# REPLYMESH DEV — PHASE 2.6 — PRODUCT INTELLIGENCE

## Resumo

A Phase 2.6 criou a Inteligencia de Produtos da Replymesh. O modulo observa pedidos, produtos, categorias e combinacoes vendidas juntas para gerar inteligencia comercial sem alterar pedidos, precos, promocoes ou automacoes.

## Arquitetura

- Backend: `ProductIntelligenceService`.
- API: `GET /api/v1/store/product_intelligence`.
- Cache: grupo `product_intelligence`, TTL de 5 minutos.
- Frontend: tela `Marketing > Inteligencia de Produtos`.
- Dashboard: card compacto `Produtos Inteligentes`.

## Endpoint

```text
GET /api/v1/store/product_intelligence
```

Retorna apenas estatisticas comerciais:

- produto campeao;
- produto em crescimento;
- produto esquecido;
- produto com maior potencial;
- Product Score;
- classificacao;
- tendencia;
- melhor horario;
- melhor dia;
- produtos vendidos juntos;
- insights comerciais.

## Product Score

O score varia de 0 a 100 e considera:

- quantidade vendida;
- receita;
- recorrencia em pedidos;
- tendencia frente ao periodo anterior;
- destaque do produto.

## Classificacoes

O modulo pode classificar produtos como:

- Popular;
- Em crescimento;
- Estavel;
- Em queda;
- Esquecido;
- Sazonal;
- Premium;
- Entrada;
- Campeao de vendas.

## Produtos vendidos juntos

O engine calcula pares de produtos que aparecem no mesmo pedido e retorna ranking com:

- produto principal;
- produto secundario;
- quantidade de pedidos;
- percentual de recorrencia;
- receita relacionada.

## Produto campeao

Produto com melhor combinacao de vendas e receita no periodo analisado.

## Produto esquecido

Produto ativo no cardapio que teve venda baixa ou nenhuma venda recente.

## Produto em crescimento

Produto com crescimento relevante comparado ao periodo anterior.

## Produto premium

Produto com preco ou margem superior ao padrao usado pelo engine.

## Integracoes

Integrado com:

- Dashboard da loja;
- Estrategia da Loja;
- cache Replymesh;
- invalidador automatico de cache;
- menu e permissoes do Store Template.

## Cache e invalidacao

O cache `product_intelligence` e invalidado quando houver alteracao em:

- produtos;
- categorias;
- pedidos;
- itens de pedido;
- cupons;
- estoque;
- adicionais;
- configuracoes;
- IA;
- entrega;
- Recovery.

## Seguranca

O modulo nao armazena nem expõe:

- telefone;
- mensagens;
- Pix;
- cartao;
- JWT;
- tokens;
- prompts;
- API keys;
- dados pessoais.

## Arquivos alterados

- `replymesh-api/app/services/product_intelligence_service.rb`
- `replymesh-api/app/controllers/api/v1/store/product_intelligence_controller.rb`
- `replymesh-api/app/controllers/api/v1/store/dashboard_controller.rb`
- `replymesh-api/app/services/replymesh_cache_service.rb`
- `replymesh-api/app/services/replymesh_strategy_service.rb`
- `replymesh-api/config/routes.rb`
- `replymesh-api/app/models/category.rb`
- `replymesh-api/app/models/coupon.rb`
- `replymesh-api/app/models/delivery_zone.rb`
- `replymesh-api/app/models/inventory_item.rb`
- `replymesh-api/app/models/order.rb`
- `replymesh-api/app/models/order_item.rb`
- `replymesh-api/app/models/product.rb`
- `replymesh-api/app/models/product_option_group.rb`
- `replymesh-api/app/models/product_option_item.rb`
- `replymesh-api/app/models/sales_recovery_event.rb`
- `replymesh-api/app/models/store_ai_setting.rb`
- `replymesh-api/app/models/store_setting.rb`
- `store-template/src/pages/admin/ProductIntelligence.jsx`
- `store-template/src/services/storeApi.js`
- `store-template/src/app/router.jsx`
- `store-template/src/components/layout/AdminLayout.jsx`
- `store-template/src/components/dashboard/DashboardStats.jsx`
- `store-template/src/pages/admin/Dashboard.jsx`
- `store-template/src/utils/permissions.js`
- `README.md`
- `ROADMAP_REPLYMESH.md`
- `STORE_TEMPLATE_PLAN.md`

## Validacoes

Resultado executado em 03/07/2026:

- `ruby -c` nos arquivos Ruby alterados: OK.
- `npm run build` em `store-template`: OK.
- `npm run build` em `replymesh-frontend`: OK.
- `git diff --check`: OK.
- Auditoria simples de segredos no diff: OK, sem chaves encontradas.
- `rails routes`: pendente no ambiente local por falta de gems instaladas (`puma`, `bcrypt`, `bootsnap` e dependencias), sem indicio de erro de rota no codigo.

## Pendencias futuras

- Usar Product Intelligence como fonte para Marketing Intelligence.
- Exibir comparativos historicos mais longos quando houver volume maior de pedidos.
- Usar margem real quando todas as lojas tiverem custo cadastrado.
- Permitir filtros por periodo na tela.

## Hash do commit

Informado no resumo final da execucao. Observacao: o hash nao foi fixado neste arquivo para evitar referencia auto-mutavel durante `git commit --amend`.
