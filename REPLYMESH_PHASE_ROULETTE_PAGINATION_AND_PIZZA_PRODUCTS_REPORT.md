# Replymesh - Roleta com Paginacao e Produto Pizza

Data: 2026-06-16

## Objetivo

Melhorar a tela administrativa da Roleta e preparar o cadastro/cardapio para produtos de pizzaria sem quebrar produtos simples, customizaveis, combos ou pasteis.

## Escopo Implementado no Codigo Local

### Roleta

- API de historico da roleta passou a suportar:
  - `page`
  - `per_page` / `perPage`
  - `search`
  - `status`
  - `prize_id` / `prizeId`
  - `start_date` / `startDate`
  - `end_date` / `endDate`
- O retorno da API agora inclui:
  - `spins`
  - `pagination`
  - `summary`
- A tela admin da Roleta agora usa paginacao com:
  - 20 itens por pagina;
  - Anterior / Proxima;
  - botoes numericos;
  - texto `Pagina X de Y`;
  - total de registros.
- Filtros adicionados/melhorados:
  - busca por cliente/telefone;
  - premio;
  - status;
  - periodo rapido: Hoje, Ontem, Esta semana, Este mes, Personalizado.
- Resumo filtrado:
  - registros filtrados;
  - cupons ganhos;
  - cupons usados;
  - sem premio.
- Resumo global:
  - giros disponiveis;
  - giros usados;
  - cupons gerados;
  - cupons usados.

### Produto Pizza

- Nao foi criada migration.
- Nao foi alterada estrutura de banco.
- Produto tipo Pizza foi implementado usando a estrutura existente de `product_option_groups` e `product_option_items`.
- Cadastro de produto agora possui tipo visual:
  - Simples;
  - Customizavel;
  - Pizza.
- Ao escolher Pizza:
  - produto fica `is_customizable=true`;
  - pode usar modelo pronto `Modelo Pizzaria`;
  - o modelo cria grupos:
    - Tamanho;
    - Sabores;
    - Borda;
    - Massa.
- O checkout continua usando a regra segura atual:
  - preco base do produto;
  - soma dos adicionais escolhidos.
- O template publico premium agora respeita produtos customizaveis e abre o modal de escolha, em vez de adicionar direto ao carrinho.
- Produtos simples continuam indo direto ao carrinho.
- Produtos customizaveis existentes continuam usando o fluxo antigo de opcionais.
- Modelo Pastel foi mantido.

## Limite Tecnico Registrado

A regra completa de pizzaria com matriz de preco por sabor/tamanho e calculos como:

- cobrar sabor mais caro;
- media dos sabores;
- somar sabores;
- preco fixo por tamanho;
- limite dinamico de sabores conforme tamanho escolhido;

nao foi implementada nesta fase porque a estrutura atual do banco nao possui campos para matriz de precos nem metadados por grupo/item.

Para isso ficar 100% profissional e auditavel, a fase futura deve criar uma estrutura propria, por exemplo:

- `product_type`;
- `pizza_sizes`;
- `pizza_flavors`;
- `pizza_edges`;
- `pizza_doughs`;
- `pizza_price_rules`;
- matriz sabor x tamanho.

Nesta fase foi mantido o caminho sem migration, conforme restricao do prompt.

## Arquivos Alterados Nesta Fase

- `replymesh-api/app/controllers/api/v1/store/wheel_controller.rb`
- `replymesh-api/app/services/wheel_service.rb`
- `store-template/src/services/wheel.js`
- `store-template/src/pages/admin/WheelSettings.jsx`
- `store-template/src/pages/admin/Products.jsx`
- `store-template/src/templates/hamburgueria-premium/components/PremiumMenuSection.jsx`
- `REPLYMESH_PHASE_ROULETTE_PAGINATION_AND_PIZZA_PRODUCTS_REPORT.md`

## Validacoes Executadas

- `ruby -c replymesh-api/app/services/wheel_service.rb`: OK
- `ruby -c replymesh-api/app/controllers/api/v1/store/wheel_controller.rb`: OK
- `npm run build` em `store-template`: OK
- `git diff --check` nos arquivos da fase: OK
- Auditoria simples de segredos nos arquivos da fase: OK. Ocorrencias encontradas foram termos tecnicos esperados como `token: null`, `public_token` e `key` de React, sem segredo real.

## Deploy

Deploy executado em producao a partir de worktree limpo.

- Branch/worktree limpo: `roleta-pizza-basic-clean`
- Commit publicado: `8c5ebff`
- Backup VPS: `/opt/replymesh/backups/roleta-pizza-basic-20260616-221224`
- API: arquivos Ruby copiados para o container `replymesh-rails-api`
- Store: build limpo publicado em `/opt/replymesh/store`
- Container reiniciado: somente `replymesh-rails-api`
- Nao houve migration, seed, reset ou drop.
- Nao houve alteracao em Evolution ou Mercado Pago.

Validacoes de producao executadas:

- `https://api.replymesh.cloud/up`: 200
- `https://lanchedo2r.replymesh.cloud`: 200
- `https://lanchesdo2r.com.br`: 200
- `https://api.replymesh.cloud/api/v1/public/lanchedo2r/store`: 200
- `https://api.replymesh.cloud/api/v1/public/lanchedo2r/menu`: 200
- `https://pizzashow.replymesh.cloud`: 200
- `https://lanchedo2r.replymesh.cloud/admin/wheel`: 200
- Bundle publicado contem `Modelo Pizzaria`.
- Bundle publicado contem tela da Roleta com filtros, paginacao e resumo filtrado.
- Logs da API apos restart sem crash-loop.

Observacao:

O `grep` do bundle ainda encontra a string `localhost` dentro da logica normal de deteccao de ambiente local. Nao foi encontrada URL de API local sendo usada no build publicado; a base da API permanece `https://api.replymesh.cloud/api/v1`.

## Status

ROLETA/PIZZARIA BASICA PUBLICADA.

Pendencia funcional futura:

- Produto Pizza avancado com regra de preco por tamanho/sabor precisa de migration e modelagem propria.
