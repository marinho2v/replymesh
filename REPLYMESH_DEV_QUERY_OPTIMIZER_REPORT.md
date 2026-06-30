# REPLYMESH DEV — QUERY OPTIMIZER + PERFORMANCE MONITOR

## Escopo

- Branch trabalhada: `dev`
- Produção/VPS/main: não alteradas nesta fase.
- Banco de produção: não alterado.
- Evolution, IA, Mercado Pago e Cloudflare R2: sem alteração de regra ou integração.
- Infra nova: não foi instalado Redis, Sidekiq, RabbitMQ, Kubernetes ou Load Balancer.

## Consultas auditadas

Áreas revisadas nesta etapa:

- Dashboard da loja
- Pedidos
- Cozinha
- Sugestão de rota/motoboy
- Produtos
- Loja pública
- Cardápio público
- Master empresas
- Relatórios
- Cache público e cache de dashboard

## N+1 encontrados

### Pedidos

Foi identificado que a listagem de pedidos serializava dados de mesa (`dining_table`) sem preload explícito.

Correção aplicada:

- `OrdersController#index` agora carrega `:dining_table` junto com `customer`, `motoboy`, `order_items` e `delivery_zone`.

### Cozinha

Foi identificado `TableSession.find_by(order_id: order.id)` dentro do loop de serialização da cozinha.

Correção aplicada:

- `OrdersController#kitchen` agora busca todas as sessões de mesa dos pedidos carregados em uma única query e passa o resultado para o serializer.

### Sugestão de rota

Foi identificado que a sugestão de rota usa o mesmo serializer de pedidos, que pode acessar `dining_table`.

Correção aplicada:

- `serialize_route_suggestion` agora carrega `:dining_table`.

## Queries reduzidas

- `GET /api/v1/store/orders`: removida possibilidade de N+1 ao acessar mesa.
- `GET /api/v1/store/kitchen/orders`: removida query por pedido para `TableSession`.
- `GET /api/v1/store/orders/route_suggestion`: removida possibilidade de N+1 ao serializar mesa.

## Payload reduzido

Não houve remoção de campos nesta fase para preservar compatibilidade total com o frontend atual.

Foram adicionadas métricas de payload no monitor para identificar futuramente:

- maior resposta em bytes;
- endpoint com maior payload;
- média de payload por janela.

## Endpoints otimizados

- `Api::V1::Store::OrdersController#index`
- `Api::V1::Store::OrdersController#kitchen`
- `Api::V1::Store::OrdersController#route_suggestion`

## Performance Monitor criado

Endpoint protegido existente:

- `GET /api/v1/master/performance`

Agora retorna uma base real de monitoramento usando `Rails.cache`, sem criar tabelas e sem gravar dados sensíveis:

- tempo médio das APIs;
- tempo médio SQL;
- quantidade média de queries;
- cache hit;
- cache miss;
- cache hit rate;
- endpoint mais lento;
- endpoint mais acessado;
- empresa mais acessada;
- empresa com maior consumo;
- maior payload;
- maior consulta SQL por endpoint;
- tempo médio futuro para IA, Cloudflare R2, Mercado Pago e Evolution;
- tempo médio da loja pública.

## Instrumentação criada

Foi adicionada instrumentação por request usando `ActiveSupport::Notifications` e contador de SQL via `sql.active_record`.

Áreas classificadas:

- dashboard
- orders
- products
- ai
- public_store
- checkout
- motoboy
- master
- api

Registro fica ativo somente quando:

- ambiente é `development`; ou
- `REPLYMESH_PERFORMANCE_MONITOR=1`.

## Segurança

O monitor não grava:

- JWT;
- senha;
- API keys;
- mensagens de clientes;
- dados pessoais;
- dados de pagamento;
- corpo de requisição;
- parâmetros.

Somente grava metadados técnicos:

- endpoint;
- área;
- company_id;
- tempo total;
- tempo SQL;
- tempo renderizado aproximado;
- quantidade de queries;
- tamanho do payload;
- timestamp.

## Auditoria de modelos

Foi mantido o comportamento atual dos relacionamentos. Nesta etapa não foram aplicadas mudanças em `dependent`, `touch`, `counter_cache` ou `inverse_of`, para evitar qualquer risco de mudança funcional.

Pendência futura segura:

- auditar `counter_cache` para pedidos por cliente/motoboy;
- revisar `inverse_of` em associações de alto uso;
- avaliar índices adicionais somente com plano de migration próprio.

## Paginação

Endpoints de listas grandes já possuem limites em pontos críticos, como pedidos e relatórios.

Nesta etapa não houve mudança de contrato de paginação para não quebrar o frontend.

Pendência futura:

- padronizar `page`, `per_page`, `total`, `has_more` gradualmente.

## Multiempresa

Todas as otimizações mantêm `company_scope` e `current_company`.

Nenhum filtro de empresa foi removido.

Nenhum endpoint passou a consultar dados fora do tenant atual.

## Validações executadas

- `ruby -c` nos Ruby alterados: OK
- `npm run build` em `replymesh-frontend`: OK
- `npm run build` em `store-template`: OK
- `git diff --check`: OK
- auditoria de segredos no diff: OK — `NO_SECRET_MATCHES_IN_CODE_DIFF`
- testes existentes: pendente por ambiente local. O comando `bundle exec rspec` não iniciou porque faltam gems locais no Ruby do workspace (`puma`, `bcrypt`, `bootsnap`, `msgpack`, `websocket-driver`, `bigdecimal`, `json`, `prism`, `erb`, `psych`).

## Pendências futuras

- Conectar métricas de chamadas externas reais de IA/R2/Mercado Pago/Evolution aos pontos de integração, mantendo sem dados sensíveis.
- Criar tela visual no Master apenas depois de estabilizar o backend do monitor.
- Padronizar paginação em endpoints com listas grandes.
- Avaliar índices com relatório separado de migration.

## Hash do commit

Consultar `git log --oneline -1` na branch `dev`.

Observação: o relatório está versionado dentro do próprio commit, então gravar o hash final no arquivo faria o hash mudar a cada amend.
