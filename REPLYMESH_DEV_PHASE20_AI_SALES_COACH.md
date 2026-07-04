# REPLYMESH DEV — PHASE 2.0 — AI SALES COACH FOUNDATION

## Objetivo

Criar a primeira base do AI Sales Coach da Replymesh: uma inteligencia interna que conversa com o dono da loja por meio de insights e recomendacoes, sem falar com clientes e sem executar acoes automaticamente.

## Escopo aplicado

- Trabalho realizado somente na branch `dev`.
- Nenhuma alteracao feita em `main`, VPS ou producao.
- Sem nova infraestrutura, sem Redis, Sidekiq, RabbitMQ ou servicos externos.
- O Recovery Engine, IA vendedora, Evolution, Mercado Pago e Cloudflare R2 foram preservados.

## Arquitetura

### Backend

- `SalesCoachService`
  - Reutiliza `CompanyContextBuilder` para contexto operacional da empresa.
  - Reutiliza `SalesRecoveryLearningEngine` para aprendizado de Recovery.
  - Usa `ReplymeshCacheService` com grupo `sales_coach` e TTL curto.
  - Gera insights por empresa, sempre respeitando `company_id`.

### Endpoint

- `GET /api/v1/store/sales_coach`
  - Retorna `summary`, `insights`, `filters`, `history`, `learning_foundation` e `source`.
  - Protegido pelo recurso `sales_recovery`.

### Dashboard

- `DashboardController` passou a incluir `sales_coach` no payload do dashboard.
- Se o coach falhar, o dashboard continua carregando e registra aviso seguro no log.

### Frontend

- Nova tela: `Marketing > AI Sales Coach`.
- Novo card no dashboard da loja.
- Filtros por categoria, prioridade e busca textual.
- Sugestoes aparecem como recomendacoes, sem botao de execucao automatica.

## Dados analisados

- Pedidos.
- Faturamento.
- Ticket medio.
- Produtos mais e menos vendidos.
- Categorias.
- Horarios de maior venda.
- Clientes novos e recorrentes.
- Carrinhos e eventos do Recovery.
- Cupons e aprendizado do Recovery.
- Estoque.
- Company Context.

## Estrutura dos insights

Cada insight contem:

- titulo;
- descricao;
- impacto;
- prioridade;
- categoria;
- confianca;
- valor estimado;
- data;
- origem;
- sugestao;
- indicador de que nao executa automaticamente.

## Categorias

- Vendas.
- Recovery.
- Produtos.
- Clientes.
- Financeiro.
- Delivery.
- Marketing.
- IA.
- Performance.

## Prioridades

- Baixa.
- Media.
- Alta.
- Critica.

## Cache e invalidação

Grupo criado:

- `sales_coach`

Invalidado quando alteram:

- pedidos;
- produtos;
- categorias;
- cupons;
- campanhas de marketing;
- configuracoes de Recovery;
- eventos de Recovery;
- configuracoes de IA.

## Segurança

O coach nao registra nem expõe:

- JWT;
- tokens;
- API keys;
- Pix;
- cartoes;
- mensagens privadas;
- prompts;
- dados sensiveis de clientes.

## Arquivos alterados

- `replymesh-api/app/services/sales_coach_service.rb`
- `replymesh-api/app/services/replymesh_cache_service.rb`
- `replymesh-api/app/controllers/api/v1/store/marketing_controller.rb`
- `replymesh-api/app/controllers/api/v1/store/dashboard_controller.rb`
- `replymesh-api/config/routes.rb`
- `replymesh-api/app/models/order.rb`
- `replymesh-api/app/models/product.rb`
- `replymesh-api/app/models/category.rb`
- `replymesh-api/app/models/coupon.rb`
- `replymesh-api/app/models/marketing_campaign.rb`
- `replymesh-api/app/models/sales_recovery_event.rb`
- `replymesh-api/app/models/sales_recovery_setting.rb`
- `replymesh-api/app/models/store_ai_setting.rb`
- `store-template/src/services/marketingWhatsapp.js`
- `store-template/src/app/router.jsx`
- `store-template/src/components/layout/AdminLayout.jsx`
- `store-template/src/utils/permissions.js`
- `store-template/src/pages/admin/SalesCoach.jsx`
- `store-template/src/pages/admin/Dashboard.jsx`
- `store-template/src/components/dashboard/DashboardStats.jsx`
- `README.md`
- `ROADMAP_REPLYMESH.md`
- `REPLYMESH_DEV_PHASE20_AI_SALES_COACH.md`

## Pendências para Phase 2.1

- Registrar feedback de sugestoes aplicadas/ignoradas.
- Medir impacto real apos sugestao.
- Criar historico persistente de recomendacoes.
- Permitir que o dono da loja marque uma recomendacao como util.
- Evoluir o coach para sugerir campanhas prontas, ainda sem executar automaticamente.

## Validações

- `ruby -c`: OK nos arquivos Ruby alterados.
- `rails routes`: pendente no ambiente local por gems ausentes no bundle (`puma`, `bcrypt`, `bootsnap`, `msgpack`, `websocket-driver`, `bigdecimal`, `json`, `prism`, `erb`, `psych`). O erro ocorre antes de carregar a aplicação.
- `npm run build` em `store-template`: OK.
- `npm run build` em `replymesh-frontend`: OK.
- `git diff --check`: OK.
- Auditoria de segredos no diff: OK, sem chaves ou tokens reais.

## Commit

Preencher apos commit.
