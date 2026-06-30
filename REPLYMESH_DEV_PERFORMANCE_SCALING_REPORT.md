# REPLYMESH DEV — Performance e escala

Status: auditoria e base inicial implementadas na branch `dev`.

Data: 2026-06-30

## Escopo executado

Esta etapa preparou a Replymesh para aguentar mais empresas na VPS atual sem mudar a arquitetura principal, sem tornar Redis obrigatório e sem alterar produção, VPS, `main` ou dados reais.

## Endpoints auditados

### Públicos

- `/api/v1/public/:slug/store`
- `/api/v1/public/:slug/menu`
- `/api/v1/public/:slug/promotions`
- `/api/v1/public/:slug/delivery_zones`
- `/api/v1/public/:slug/checkout`

Principais gargalos encontrados:

- `/store` reúne configuração, banners, horários e áreas de entrega.
- `/menu` carrega categorias, produtos, grupos de opcionais e itens de opcionais.
- As chamadas públicas são repetidas por visitantes, AppVersionWatcher e páginas públicas.
- Já havia preload em partes importantes do menu, reduzindo N+1, mas sem cache de resposta.

### Store/Admin

- `/api/v1/store/dashboard`
- `/api/v1/store/orders`
- `/api/v1/store/products`
- `/api/v1/store/delivery_zones`
- `/api/v1/store/settings`
- `/api/v1/store/store_ai/settings`

Principais gargalos encontrados:

- `dashboard` faz várias agregações em `orders`, `customers` e estoque.
- `orders` lista pedidos com joins/preloads e é chamado frequentemente.
- Telas de pedidos, cozinha, motoboy, notificações e WhatsApp tinham polling fixo mesmo com aba oculta.
- `products` lista todos os produtos da loja; precisa de atenção quando lojas tiverem cardápios grandes.

### Master

- `/api/v1/master/companies`
- `/api/v1/master/dashboard`
- `/api/v1/master/users`

Principais gargalos encontrados:

- `/master/companies` já usa includes para evitar N+1 em domínios, membros, configurações e assinaturas.
- Notificações do Master tinham polling fixo.
- Recomenda-se paginação futura para `/master/companies` quando passar de centenas de empresas.

## Implementações feitas

### 1. Pool correto do Postgres

Arquivo:

- `replymesh-api/config/database.yml`

Alteração:

- Troca de `max_connections` para `pool`, que é a configuração usada pelo ActiveRecord.
- Novo padrão:
  - `DB_POOL`
  - fallback para `RAILS_MAX_THREADS`
  - fallback final `5`

Recomendação para VPS atual:

```env
WEB_CONCURRENCY=1
RAILS_MAX_THREADS=5
DB_POOL=5
```

Se a VPS tiver Postgres com margem e pouca concorrência de workers:

```env
DB_POOL=10
```

Não aplicar automaticamente sem conferir limite real de conexões do Postgres.

### 2. Cache HTTP/API público

Arquivos:

- `replymesh-api/config/initializers/replymesh_cache.rb`
- `replymesh-api/app/services/public_response_cache.rb`
- `replymesh-api/app/controllers/api/v1/public/stores_controller.rb`

Implementado:

- Provider de cache configurável:
  - `memory`
  - `redis`
  - `disabled`
- Padrão atual: `memory`.
- Redis é opcional e não quebra boot se não existir.
- Cache aplicado em:
  - `store`
  - `menu`
  - `banners`
  - `business_hours`
  - `delivery_zones`
- TTL padrão: 60 segundos.
- `Cache-Control` público curto com `stale-while-revalidate=30`.

Chave de cache:

- empresa
- endpoint
- versão baseada em `updated_at`/contagem dos dados relacionados

Isso evita servir menu antigo por muito tempo quando produto, categoria, opcional, banner, horário ou área de entrega mudar.

### 3. Índices seguros preparados

Arquivo:

- `replymesh-api/db/migrate/20260630023000_add_performance_scaling_indexes.rb`

Índices preparados:

- `orders(company_id, status, created_at)`
- `orders(company_id, payment_method, created_at)`
- `orders(company_id, payment_status, created_at)`
- `orders(company_id, delivery_zone_id, created_at)`
- `products(company_id, is_active, category_id, sort_order)`
- `delivery_zones(company_id, is_active, match_priority)`
- `customers(company_id, created_at)`
- `subscriptions(company_id, status, created_at)`
- `whatsapp_instances(company_id, status, updated_at)`

Observação:

- Migration criada para dev.
- Não foi aplicada em produção nesta etapa.
- Usa `algorithm: :concurrently` e `if_not_exists`.

### 4. Polling adaptativo no frontend da loja

Arquivos:

- `store-template/src/utils/adaptivePolling.js`
- `store-template/src/hooks/useNotifications.js`
- `store-template/src/hooks/useRealtimeOrders.js`
- `store-template/src/hooks/useTables.js`
- `store-template/src/hooks/useKitchenOrders.js`
- `store-template/src/pages/admin/Orders.jsx`
- `store-template/src/pages/admin/Whatsapp.jsx`
- `store-template/src/pages/motoboy/MotoboyDashboard.jsx`
- `store-template/src/components/shared/AppVersionWatcher.jsx`

Implementado:

- Aba visível: polling normal.
- Aba escondida: polling reduzido.
- Erros consecutivos: backoff simples.

Impacto esperado:

- Menos chamadas quando lojista deixa painel aberto em segundo plano.
- Menos pressão em `/orders`, cozinha, notificações, WhatsApp e motoboy.

### 5. Polling adaptativo no Master

Arquivos:

- `replymesh-frontend/src/utils/adaptivePolling.js`
- `replymesh-frontend/src/components/layout/AppLayout.jsx`

Implementado:

- Notificações do Master consultam normalmente com aba visível.
- Com aba oculta, reduzem frequência.

## Auditoria de banco

Tabelas avaliadas:

- `companies`
- `products`
- `categories`
- `orders`
- `order_items`
- `customers`
- `delivery_zones`
- `whatsapp_instances`
- `store_ai_carts`
- `ai_usage_logs`
- `subscriptions`

Observações:

- As tabelas principais já tinham vários índices por `company_id`.
- `orders` já tinha índices importantes, mas faltavam alguns compostos para filtros comuns de painel.
- `products` já tinha índice para `company_id/is_active`, mas menu público se beneficia de índice composto com categoria e ordenação.
- `payments` como tabela isolada não aparece no schema atual; pagamentos estão ligados principalmente a campos em `orders` e detalhes auxiliares.

## Redis futuro

Redis não foi tornado obrigatório.

Quando usar Redis:

- cache compartilhado entre processos;
- rate limit distribuído;
- filas com Sidekiq;
- lock de webhook;
- limite de uso da IA;
- sessões futuras;
- dedupe de mensagens WhatsApp.

Antes disso, `memory` é suficiente para VPS pequena, sabendo que:

- cache é por processo;
- ao reiniciar Rails, cache limpa;
- em múltiplos workers/processos, cada processo terá seu cache.

## Background jobs

Pontos candidatos a jobs:

- envio WhatsApp;
- chamadas IA;
- webhooks pesados;
- geração/reconciliação Mercado Pago;
- relatórios;
- campanhas e recuperador de vendas.

Recomendação:

- Curto prazo: ActiveJob com adapter inline/async controlado.
- Médio prazo: Sidekiq com Redis quando volume justificar.
- Não tornar worker obrigatório antes de estabilizar Redis.

## Rate limit recomendado

Ainda não aplicado nesta etapa para evitar bloqueio indevido.

Prioridades:

1. login;
2. cadastro público/fundadores;
3. checkout;
4. IA;
5. webhooks;
6. criação de pedido;
7. recuperação de senha.

Estratégia futura:

- chave por IP + company_id;
- chave por telefone nos fluxos de WhatsApp/IA;
- limites pequenos para tentativas sensíveis;
- whitelists internas para webhooks confiáveis.

## Capacidade estimada da VPS atual

Sem benchmark real, estimativa conservadora:

### Até 10 empresas

- VPS atual deve suportar bem se banco estiver saudável.
- Cache memory + polling adaptativo já ajudam bastante.

### 50 empresas

- Recomendado ativar monitoramento de CPU/RAM/Postgres.
- Revisar queries de dashboard e pedidos.
- Começar paginação mais agressiva no Master.

### 100 empresas

- Redis passa a ser recomendado para cache compartilhado e rate limit.
- Workers separados começam a fazer sentido para WhatsApp/IA/Pix.
- Avaliar upgrade para KVM 2 se CPU/RAM ficarem pressionadas.

### 500 empresas

- Redis obrigatório.
- Worker separado obrigatório.
- Postgres precisa de tuning e possivelmente VPS/serviço dedicado.
- Considerar separar frontend estático, API e banco.
- Load balancer só depois de medir gargalo real.

## Gargalos mais prováveis

1. Polling de pedidos/cozinha/motoboy com muitas lojas abertas.
2. `/public/:slug/menu` em cardápios grandes.
3. Dashboard com muitas agregações em pedidos.
4. Envio WhatsApp/IA dentro do fluxo da requisição.
5. Postgres sem pool alinhado com Puma.

## Validações executadas

- `ruby -c` nos Ruby alterados.
- `git diff --check`.

Validações executadas até finalizar a etapa:

- `npm run build` em `store-template`.
- `npm run build` em `replymesh-frontend`.
- `ruby -c` nos Ruby alterados.
- `git diff --check`.

Pendência:

- `bundle exec rails db:migrate` não pôde ser executado no ambiente local porque as gems Ruby do bundle não estão instaladas neste workspace (`puma`, `bcrypt`, `bootsnap`, entre outras). A migration está com sintaxe válida, mas deve ser aplicada primeiro em dev com bundle completo antes de qualquer produção.

## Próximos passos recomendados

1. Rodar migration em dev e revisar tempo.
2. Medir payload real de `/menu` e `/store` com lojas grandes.
3. Criar benchmark simples com 10/50/100 empresas fake em dev.
4. Adicionar paginação/filtros em Master `/companies` antes de muitas empresas.
5. Planejar Redis/Sidekiq sem pressa, mas com caminho pronto.
