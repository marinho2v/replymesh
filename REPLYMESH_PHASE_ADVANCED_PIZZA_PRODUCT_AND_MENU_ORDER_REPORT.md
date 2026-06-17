# REPLYMESH - FASE PIZZARIA AVANCADA

Data: 2026-06-16

Status: PENDENTE QA VISUAL COMPLETO

## Objetivo

Validar a Pizzaria Avancada no worktree limpo antes de qualquer publicacao em producao.

Worktree usado:

`W:\tmp\replymesh-advanced-pizza-clean`

## Regras respeitadas

- Nao foi feito deploy em producao.
- Nao foi alterado Evolution.
- Nao foi alterado Mercado Pago.
- Nao foi executada migration, seed, reset ou drop.
- Nao foi feito commit ou tag.
- Nao foram apagados dados.

## Arquivos da fase

- `store-template/src/utils/pizzaProduct.js`
- `store-template/src/components/menu/PizzaCustomizationModal.jsx`
- `store-template/src/utils/productOptions.js`
- `store-template/src/pages/admin/Products.jsx`
- `store-template/src/components/menu/MenuSection.jsx`
- `store-template/src/templates/hamburgueria-premium/components/PremiumMenuSection.jsx`
- `store-template/src/pages/public/ProductDetails.jsx`
- `store-template/src/pages/admin/Help.jsx`
- `store-template/src/knowledge_base/index.js`

## Validacoes tecnicas executadas

### Build

Comando:

`npm run build`

Resultado:

PASSOU.

O Vite gerou o build completo da Store sem erro.

### Git diff check

Comando:

`git diff --check`

Resultado:

PASSOU.

Foram exibidos apenas avisos de normalizacao LF/CRLF do Git no Windows.

### Auditoria de segredos

Busca executada no diff dos arquivos da fase por padroes sensiveis:

- SECRET
- RAILS_MASTER_KEY
- ACCESS_TOKEN
- PRIVATE KEY
- client_secret
- sk_live
- apikey/api_key
- token/password em atribuicoes

Resultado:

PASSOU.

Nenhum segredo real encontrado no diff da fase.

## Validacao de regra de preco

Cenario solicitado:

- Tamanho: Grande
- Sabores: Calabresa + Portuguesa
- Borda: Catupiry
- Massa: Tradicional
- Regra: Cobrar sabor mais caro

Precos configurados pelo modelo:

- Calabresa Grande: R$55,00
- Portuguesa Grande: R$58,00
- Catupiry: R$8,00
- Tradicional: R$0,00

Resultado esperado:

R$58,00 + R$8,00 = R$66,00

Resultado calculado pelo utilitario:

R$66,00

Status:

PASSOU.

## Limites de sabores

Validado no utilitario do modelo:

- Pequena: ate 1 sabor
- Media: ate 2 sabores
- Grande: ate 2 sabores
- Familia: ate 3 sabores

Status:

PASSOU.

## Grupo tecnico `__pizza_price__`

O grupo tecnico existe internamente para compatibilizar o checkout atual com a estrutura de `product_option_groups`, sem migration.

Validacoes:

- `buildPizzaOptionGroups` gera o grupo tecnico.
- `normalizeSelectedOptions` remove o grupo tecnico da exibicao.
- `formatSelectedOptions` usa os dados normalizados.
- O editor comum de opcoes nao aparece quando o produto esta no tipo Pizza; aparece o editor dedicado.

Status:

PASSOU em validacao de codigo.

## Admin / Produtos

Validado por leitura de codigo:

- Existe tipo de produto `Pizza`.
- Existe botao `Modelo Pizzaria Completo`.
- A tela dedicada possui secoes de tamanhos, sabores, bordas, massas e regra de preco.
- O modelo carrega os dados padrao solicitados.
- Produto do tipo Pizza salva via `buildPizzaOptionGroups`.
- Ao editar, a configuracao volta via `parsePizzaConfigFromOptionGroups`.

Status:

PASSOU em validacao de codigo.

PENDENTE em QA visual autenticado.

## Cardapio publico

Validado por leitura de codigo:

- Cardapio padrao abre `PizzaCustomizationModal` quando `isPizzaProduct(product)` for verdadeiro.
- Template Hamburgueria Premium abre o mesmo modal.
- Pagina de detalhes do produto abre o mesmo modal.
- Produto simples continua usando fluxo direto.
- Produto customizavel antigo continua usando `ProductCustomizationModal`.

Status:

PASSOU em validacao de codigo.

PENDENTE em QA visual com produto real.

## Carrinho, pedido, cozinha e impressao

Validado por leitura de codigo:

- `selectedOptions` da pizza inclui dados limpos de tamanho, sabores, borda e massa.
- O grupo tecnico `__pizza_price__` fica oculto na normalizacao.
- As telas que usam `formatSelectedOptions` nao devem mostrar `pizza_price`, IDs tecnicos ou JSON.

Status:

PASSOU em validacao de codigo.

PENDENTE em pedido real ponta a ponta.

## Regressao

Validado por leitura de codigo e build:

- Produto simples continua normal.
- Produto customizavel antigo continua normal.
- Modelo Pastel permanece no fluxo de customizaveis.
- Produto combo nao foi alterado diretamente.
- Build geral da Store continuou OK.

Status:

PASSOU em validacao tecnica.

PENDENTE em clique visual ponta a ponta.

## Ordem do menu admin

Validado em `AdminLayout.jsx`:

1. Dashboard
2. Pedidos
3. PDV / Balcao
4. Mesas

Status:

PASSOU.

## Tentativa de QA visual local

Foram iniciadas instancias locais Vite nas portas 5184, 5185 e 5186.

O endpoint publico da API para Pizza Show respondeu corretamente:

`https://api.replymesh.cloud/api/v1/public/pizzashow/store`

Resultado da API:

PASSOU.

Porem, a Store local no navegador, mesmo tentando simular a empresa Pizza Show via rota `/loja/pizzashow` e via `VITE_COMPANY_SLUG=pizzashow`, renderizou:

`Loja nao encontrada`

Sem erros de console relevantes.

Conclusao:

O ambiente local/browser deste worktree nao ficou confiavel para concluir o QA visual autenticado da Pizza Show. Nao foi feita publicacao em producao para contornar isso.

## Nao executado

- Criacao real do produto `Pizza Teste Avancada` no admin.
- Edicao visual do produto salvo.
- Clique no produto de pizza real no cardapio publico.
- Adicao ao carrinho em navegador com produto real.
- Checkout real.
- Validacao de pedido no admin.
- Validacao de cozinha/KDS.
- Validacao de impressao/comprovante.

Motivo:

O tenant Pizza Show nao carregou corretamente no navegador local do worktree. Como a regra era nao publicar em producao, o QA visual ponta a ponta foi interrompido com pendencia registrada.

## Resultado

PIZZARIA AVANCADA COM PENDENCIAS NO QA.

Pode seguir para deploy somente depois de concluir o QA visual autenticado em ambiente que carregue a empresa de teste corretamente.
