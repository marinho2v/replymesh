# REPLYMESH - PROMOCOES PUBLICAS

Data: 2026-06-15

## Resultado

Status: CONCLUIDO

A navegacao publica "Roleta" foi substituida por "Promocoes". A roleta existente
foi preservada e agora e apresentada dentro da pagina de promocoes somente quando
o recurso esta habilitado e existe ao menos um premio disponivel.

Quando nao existe promocao ativa, a loja publica mostra:

* Promocoes
* Nenhuma promocao ativa no momento.
* Acompanhe nossas novidades para participar das proximas campanhas.
* Botao "Voltar ao cardapio"

Nenhuma mensagem publica menciona plano, upgrade ou recurso bloqueado.

## Implementacao

Frontend Store:

* criada a pagina publica `Promotions.jsx`;
* criada a rota limpa `/promocoes`;
* mantida compatibilidade com `/roleta`;
* menus desktop, mobile e template premium exibem "Promocoes";
* o link da conta do cliente aponta para `/promocoes`;
* a roleta existente continua sendo reutilizada sem recriacao.

Backend Rails:

* criado `GET /api/v1/public/:company_slug/promotions`;
* a disponibilidade usa a feature `roulette` e premios ativos com peso positivo;
* `wheel/prizes` retorna lista vazia quando a promocao esta inativa;
* `wheel/spin` retorna mensagem publica neutra quando nao existe promocao ativa;
* empresa inexistente continua retornando `404 store_not_found`.

## Arquivos Alterados

* `store-template/src/pages/public/Promotions.jsx`
* `store-template/src/services/wheel.js`
* `store-template/src/app/router.jsx`
* `store-template/src/components/layout/PublicLayout.jsx`
* `store-template/src/templates/hamburgueria-premium/components/PremiumHeader.jsx`
* `store-template/src/pages/public/MyAccount.jsx`
* `replymesh-api/config/routes.rb`
* `replymesh-api/app/services/wheel_service.rb`
* `replymesh-api/app/controllers/api/v1/public/wheel_controller.rb`
* `replymesh-api/spec/requests/api/v1/public/promotions_spec.rb`

## Validacoes Locais

* `npm run build` em `store-template`: PASSOU, 2994 modulos processados.
* `ruby -c` nos arquivos Ruby alterados: PASSOU.
* `git diff --check`: PASSOU, somente avisos LF/CRLF.
* auditoria de segredos: PASSOU.
* referencias a `localhost` e `127.0.0.1` no build: zero.
* RSpec focado: PENDENTE LOCALMENTE por gems nativas ausentes no Ruby Windows.
  Nenhuma gem foi instalada para evitar alterar o ambiente.

## Backup e Deploy

Backup pre-deploy:

`/opt/replymesh/backups/pre-promotions-public-20260615-112934`

O backup inclui Store, arquivos da API alterados, inventario Docker, configuracao
de runtime protegida, dump PostgreSQL e checksums SHA256.

Imagem da API publicada:

`replymesh-api:v1.0.0-promotions-public-rc1`

Somente o container `replymesh-rails-api` foi recriado. A Store estatica foi
publicada em `/opt/replymesh/store`, removendo assets antigos para impedir mistura
de bundles.

Nao houve migration, seed, reset, alteracao no Evolution, Mercado Pago ou estrutura
do banco.

## Evidencias de Producao

* `https://api.replymesh.cloud/up`: HTTP 200.
* endpoint de promocoes do `lanchedo2r`: HTTP 200 e `roulette_active=false`.
* premios publicos do `lanchedo2r`: HTTP 200 e lista vazia.
* `/promocoes`: HTTP 200 e estado vazio correto validado no navegador.
* `/roleta`: HTTP 200 e mesma pagina compativel, sem erro.
* menu publico: exibe "Promocoes" e usa a rota limpa `/promocoes`.
* console do navegador: sem erros.
* subdominio inexistente: API retorna HTTP 404 `store_not_found`.
* bundle publicado: zero referencias a localhost ou 127.0.0.1.

## Cenarios

### A - Roleta ativa

PASSOU na regra de backend em validacao somente leitura: com a feature `roulette`
habilitada e premio disponivel, `promotion_active?` retorna verdadeiro e a pagina
usa o componente de roleta existente.

### B - Roleta desativada

PASSOU em producao no `lanchedo2r`: `/promocoes` e `/roleta` mostram a mensagem
elegante de nenhuma promocao ativa, sem expor regras comerciais internas.

### C - Subdominio inexistente

PASSOU na API: retorna `404 store_not_found` e nao cria loja vazia.

Observacao: certificado wildcard para nomes arbitrarios continua sendo uma
pendencia separada de infraestrutura e nao foi alterado nesta fase.

### D - Rotas limpas

PASSOU: links publicos usam `/promocoes`, sem gerar `/loja/:slug`.

## Conclusao

PROMOCOES PUBLICAS CONCLUIDAS
