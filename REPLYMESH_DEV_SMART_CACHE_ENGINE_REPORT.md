# REPLYMESH DEV — Smart Cache Engine

Data: 30/06/2026
Branch: `dev`
Escopo: cache inteligente com `Rails.cache`, invalidação automática por empresa e preparação para Redis futuro.

## Resumo

Foi criada uma camada central de cache para a Replymesh sem instalar Redis e sem alterar regras de negócio.

Toda a implementação usa `Rails.cache`, mantendo a troca futura de `memory_store` para `redis_cache_store` limitada à configuração do Rails.

Nenhum dado sensível foi cacheado.

## Serviço central

Criado:

```text
replymesh-api/app/services/replymesh_cache_service.rb
```

Responsabilidades:

- gerar chaves por empresa;
- organizar TTL por grupo;
- versionar cache por empresa/grupo;
- invalidar somente a empresa alterada;
- registrar cache hit/cache miss apenas em desenvolvimento ou com `REPLYMESH_CACHE_DEBUG=1`;
- preservar compatibilidade futura com Redis via `Rails.cache`.

## Chaves criadas

Padrão:

```text
company:{id}:{grupo}:v{versao}:{endpoint}
```

Grupos suportados:

```text
company:{id}:store
company:{id}:menu
company:{id}:categories
company:{id}:products
company:{id}:banners
company:{id}:delivery
company:{id}:business_hours
company:{id}:settings
company:{id}:featured_products
company:{id}:promotions
company:{id}:dashboard
company:{id}:statistics
company:{id}:tables
company:{id}:motoboys
company:{id}:ai_context
```

## TTL utilizado

```text
store              5 minutos
menu               5 minutos
categories         5 minutos
products           5 minutos
banners            5 minutos
delivery           5 minutos
business_hours     5 minutos
settings           5 minutos
featured_products  5 minutos
promotions         5 minutos
dashboard          30 segundos
statistics         60 segundos
tables             5 minutos
motoboys           5 minutos
ai_context         5 minutos
```

## Endpoints cacheados

### Loja pública

```text
GET /api/v1/public/:company_slug/store
GET /api/v1/public/:company_slug/menu
GET /api/v1/public/:company_slug/banners
GET /api/v1/public/:company_slug/business_hours
GET /api/v1/public/:company_slug/delivery_zones
```

O cache público existente foi padronizado para usar `ReplymeshCacheService`.

Também foi removido o custo de consultas repetidas de `maximum/count` usadas anteriormente para montar versão dinâmica do cache. Agora a versão é controlada por invalidação automática.

### Promoções públicas

```text
GET /api/v1/public/:company_slug/promotions
GET /api/v1/public/:company_slug/wheel/prizes
```

### Dashboard da loja

```text
GET /api/v1/store/dashboard
```

TTL: 30 segundos.

O payload completo do dashboard é cacheado por empresa e invalidado quando pedidos mudam.

### IA vendedora

O serviço `AiProductSearch` passou a usar cache de contexto estático de produtos ativos por empresa.

Cache aplicado:

```text
company:{id}:ai_context:v{versao}:active_product_ids
```

Não foram cacheados:

- conversa;
- mensagens;
- carrinho;
- pedido temporário;
- telefone do cliente;
- sessão;
- pagamento.

## Regras de invalidação

Criado concern:

```text
replymesh-api/app/models/concerns/replymesh_cache_invalidation.rb
```

Ele invalida cache via `after_commit`, sempre restrito à empresa do registro alterado.

### Modelos com invalidação automática

```text
Company
StoreSetting
Product
Category
ProductOptionGroup
ProductOptionItem
AppBanner
BusinessHour
BusinessHourException
DeliveryZone
Coupon
WheelPrize
Order
DiningTable
Motoboy
```

### Mapeamento principal

```text
Produto/Categoria/Opcionais  -> menu, products, featured_products, ai_context
Banner                       -> banners, store
Horários                     -> business_hours, store, ai_context
Áreas de entrega             -> delivery, store, ai_context
Configuração da loja         -> store, settings, business_hours, delivery, ai_context
Cupom/Roleta                 -> promotions, store
Pedido                       -> dashboard, statistics
Mesas                        -> tables
Motoboys                     -> motoboys
Empresa                      -> store, settings, menu, dashboard, ai_context
```

## Queries otimizadas

### Loja pública

Antes a montagem da chave de cache executava consultas de versão como:

- `maximum(:updated_at)`;
- `count`;
- consultas em produtos/categorias/banners/horários/áreas.

Essas consultas foram removidas do caminho quente dos endpoints públicos. A validade agora é controlada por versão de cache por empresa/grupo.

### Dashboard

O dashboard continua calculando os mesmos dados, mas agora o payload é reaproveitado por 30 segundos por empresa.

Isso reduz recalculações repetidas de:

- pedidos do dia;
- faturamento;
- contagens por status;
- clientes;
- estoque baixo;
- série de receita dos últimos dias.

### IA

A busca de produtos da IA passou a reaproveitar a lista de IDs ativos do cardápio por empresa.

O score da busca continua sendo calculado em tempo real com base na pergunta atual, sem armazenar a mensagem do cliente no cache.

## Cache hit preparado

Logs internos adicionados:

```text
cache_hit
cache_miss
endpoint
company_id
tempo_ms
```

Ativação:

```text
Rails.env.development?
ou
REPLYMESH_CACHE_DEBUG=1
```

Em produção normal não há log excessivo.

## Tela futura preparada

Criado endpoint protegido:

```text
GET /api/v1/master/performance
```

Ele retorna estrutura futura para:

- cache hit;
- cache miss;
- tempo médio de queries;
- tempo médio de respostas;
- endpoint mais pesado;
- empresa mais acessada.

Não foi colocado no menu.

## Preparação para Redis

A implementação não usa:

- Redis diretamente;
- MemoryStore diretamente;
- variável global;
- cache manual próprio.

Quando Redis for adotado, o caminho esperado será alterar apenas:

```ruby
config.cache_store
```

## Segurança

Não foram cacheados:

- JWT;
- sessão;
- senha;
- API keys;
- tokens;
- carrinho;
- checkout;
- pagamento;
- pedidos em edição;
- mensagens WhatsApp;
- conversas da IA;
- dados pessoais sensíveis.

## Validações executadas

```text
ruby -c arquivos Ruby alterados
npm run build em replymesh-frontend
npm run build em store-template
git diff --check
auditoria de segredos no diff de código
```

Resultado: OK.

## Pendências futuras

1. Medir cache hit/cache miss em produção com flag temporária.
2. Criar UI completa de Performance no Master.
3. Adicionar instrumentação por endpoint com `ActiveSupport::Notifications`.
4. Criar política de TTL específica por loja com tráfego alto.
5. Migrar `config.cache_store` para Redis quando a escala exigir.
