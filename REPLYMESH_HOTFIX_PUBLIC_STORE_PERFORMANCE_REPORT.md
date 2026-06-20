# REPLYMESH_HOTFIX_PUBLIC_STORE_PERFORMANCE_REPORT

Data: 2026-06-20

## Escopo

Hotfix global de performance da Store pública multiempresa, aplicado em produção para reduzir payload, chamadas duplicadas e N+1 queries nos endpoints públicos.

Nao foram alterados:
- Evolution
- Mercado Pago
- migrations/seeds/reset/drop
- dados comerciais
- branch dev/Pizzaria Avancada

## Backup

Backup criado antes do deploy:

/opt/replymesh/backups/performance-hotfix-20260620-003848

Inclui:
- arquivos fonte tocados
- publicacao anterior da Store
- inspect do container Rails
- status Git antes do hotfix
- env-file sensivel do container apenas para recreate/rollback, sem impressao no chat

## Gargalos encontrados

1. Endpoint /store retornava payload grande por duplicacao de midia.
   - Antes: /api/v1/public/lanchedo2r/store = 548688 bytes
   - Causa: banner/cover base64 repetidos em store e store_settings.

2. Endpoint /menu tinha N+1 queries.
   - Antes: 116 SQL queries para 98 produtos
   - Causa: option groups e items carregados por produto/categoria.

3. Frontend fazia chamadas publicas duplicadas em dominio custom.
   - Antes: chamadas para lanchesdo2r.com.br e lanchedo2r no mesmo carregamento.
   - Causa: resolucao de dominio custom e hooks separados de store/banners/horarios/entrega.

4. API publica nao compactava JSON.
   - Antes: sem Rack::Deflater.
   - Causa: middleware de compressao ausente na API Rails.

## Correcoes aplicadas

### Backend

Arquivo:
- replymesh-api/app/controllers/api/v1/public/stores_controller.rb

Alteracoes:
- cache publico curto de 60 segundos nos endpoints publicos de leitura.
- /menu usa includes e agrupamento em memoria.
- serialize_product usa option groups/items ja carregados.
- /store remove duplicacao pesada de midia em store_settings.
- banner_url fica nil quando duplicado com cover_url.
- store_settings continua expondo configuracoes leves necessarias.

Arquivo:
- replymesh-api/config/application.rb

Alteracao:
- habilitado Rack::Deflater para compressao gzip de respostas JSON.

### Frontend Store

Arquivos:
- store-template/src/services/publicApi.js
- store-template/src/hooks/usePublicStoreInfo.js
- store-template/src/contexts/CompanySlugContext.jsx

Alteracoes:
- cache em memoria de requisicoes publicas por 30 segundos.
- getPublicStoreBundle usa /store como bundle unico para store, banners, horarios e areas.
- hook publico deixou de disparar varias chamadas iniciais separadas.
- dominio custom resolve slug canonico e faz cache por dominio, evitando mistura entre lojas.

## Deploy executado

API:
- imagem criada: replymesh-api:public-performance-hotfix-20260620
- container recriado: replymesh-rails-api
- container antigo preservado para rollback: replymesh-rails-api-pre-performance-20260620005317
- porta/rede/restart policy preservados.
- entrypoint preservado como /rails/bin/rails server para nao executar db:prepare/migrations.

Store:
- build executado com sucesso em /opt/replymesh/source/store-template
- /opt/replymesh/store publicado com dist limpo.
- assets antigos removidos antes da copia para evitar mistura de bundles.

## Validacoes tecnicas

ruby -c:
- stores_controller.rb: OK
- application.rb: OK

npm run build store-template:
- OK

git diff --check:
- OK

Auditoria de segredos:
- sem segredo real encontrado no diff.
- ocorrencias eram apenas nomes de campos public_key e token: null.

## Resultados depois do hotfix

### Lanche do 2R

GET /api/v1/public/lanchedo2r/store:
- status 200
- payload 143066 bytes
- TTFB 0.058954s
- total 0.062335s
- cache-control: max-age=60, public
- content-encoding: gzip

GET /api/v1/public/lanchedo2r/menu:
- status 200
- payload 52505 bytes
- TTFB 0.091962s
- total 0.093256s
- cache-control: max-age=60, public
- content-encoding: gzip

SQL /menu:
- antes: 116 queries
- depois: 6 queries

### Pizza Show

GET /api/v1/public/pizzashow/store:
- status 200
- payload 4116 bytes
- TTFB 0.046073s
- total 0.046557s
- gzip ativo

GET /api/v1/public/pizzashow/menu:
- status 200
- payload 26 bytes
- TTFB 0.045139s
- total 0.045970s
- gzip ativo

### Paginas publicas

- https://lanchesdo2r.com.br = 200
- https://lanchedo2r.replymesh.cloud = 200
- https://pizzashow.replymesh.cloud = 200
- https://lanchesdo2r.com.br/admin/login = 200
- https://lanchesdo2r.com.br/checkout = 200

## Ganho estimado

- /store do 2R reduziu de 548688 bytes para 143066 bytes: reducao aproximada de 74%.
- /menu reduziu de 116 queries para 6 queries: reducao aproximada de 95% nas queries.
- Respostas publicas agora usam gzip.
- Primeiro carregamento evita chamadas duplicadas para dominio custom + slug.

## Rollback

API:
1. parar/remover replymesh-rails-api atual;
2. renomear replymesh-rails-api-pre-performance-20260620005317 para replymesh-rails-api;
3. iniciar container antigo.

Store:
1. restaurar tarball de /opt/replymesh/backups/performance-hotfix-20260620-003848/store-before.tgz para /opt/replymesh/store.

## Status

PERFORMANCE GLOBAL DA STORE CORRIGIDA
