# Replymesh - Hotfix Dashboard 2R e Produtos em Destaque

Data local: 2026-06-17

## Escopo

Hotfix controlado executado em producao para a empresa `lanchedo2r`, sem
alterar banco, migrations, seeds, Evolution, Mercado Pago ou a branch `dev`.

## Backup

Backup criado antes da publicacao:

`/opt/replymesh/backups/hotfix-2r-dashboard-featured-20260618-005620`

Conteudo:

- controllers ativos da API;
- inspecao dos containers API e Store;
- lista dos containers ativos;
- arquivos publicados da Store;
- arquivos equivalentes do source;
- checksums SHA-256.

## Causa do dashboard

O Rails estava usando UTC e calculava o dia com:

`Time.current.beginning_of_day..Time.current.end_of_day`

Depois das 21h no Brasil, essa janela passava a representar o dia seguinte em
UTC e ignorava a maior parte das vendas do dia comercial brasileiro.

Tambem foram encontrados:

- ticket medio calculado dividindo receita concluida por todos os pedidos;
- resumo de status usando pedidos ativos de todo o historico;
- cupons do dia usando a mesma janela UTC incorreta.

## Correcao do dashboard

Endpoint:

`GET /api/v1/store/dashboard`

Regra aplicada:

- dia comercial em `America/Sao_Paulo`;
- pedidos do dia excluem cancelados do card principal;
- faturamento soma pedidos `completed`;
- ticket medio divide o faturamento pela quantidade de pedidos `completed`;
- novos clientes usam a mesma janela local;
- status mostram somente os pedidos do dia;
- tendencia dos sete dias usa uma janela local para cada data.

Resultado real validado no 2R:

- pedidos validos do dia: 11;
- pedidos concluidos: 6;
- faturamento: R$ 269,00;
- ticket medio: R$ 44,83;
- novos clientes: 2;
- status: 2 pendentes, 1 aceito, 1 em preparo, 1 saiu para entrega e
  6 finalizados.

## Causa do produto em destaque

O backend ja retornava `is_featured: true`. O produto
`BATATA COM COSTELA -M` estava ativo e destacado, mas aparecia na posicao 23
da pagina inicial porque os destaques eram achatados segundo a ordem das
categorias.

## Correcao dos destaques

- a API publica passou a retornar `sort_order` e `updated_at`;
- a pagina inicial ordena produtos destacados pela atualizacao mais recente;
- `sort_order` e nome sao usados como criterios de desempate;
- a ordem normal dentro das categorias nao foi alterada;
- badge, preco, imagem e acao de carrinho foram preservados.

Validacao:

- `BATATA COM COSTELA -M` retornou `is_featured: true`;
- imagem e preco continuaram presentes;
- produto apareceu no DOM publico antes dos destaques antigos;
- nenhuma mensagem de erro da Store foi renderizada.

## Arquivos alterados

- `replymesh-api/app/controllers/api/v1/store/dashboard_controller.rb`
- `replymesh-api/app/controllers/api/v1/public/stores_controller.rb`
- `replymesh-api/spec/requests/api/v1/store/dashboard_spec.rb`
- `replymesh-api/spec/requests/api/v1/public/featured_products_spec.rb`
- `store-template/src/components/dashboard/DashboardStats.jsx`
- `store-template/src/templates/hamburgueria-premium/components/PremiumMenuSection.jsx`

## Build e testes

- `ruby -c`: passou nos controllers e specs.
- `npm run build store-template`: passou, 2.998 modulos transformados.
- `git diff --check`: passou.
- auditoria de segredos: passou.
- RSpec local: nao executado por gems nativas ausentes no Windows; nenhuma gem
  foi instalada.
- dois specs focados foram adicionados para execucao no ambiente Ruby completo.

## Deploy

Imagem ativa:

`replymesh-api:2r-dashboard-featured-20260618`

Somente `replymesh-rails-api` foi recriado. O container anterior foi mantido
parado para rollback:

`replymesh-rails-api-pre-dashboard-featured-20260618-010440`

A Store foi publicada com assets limpos e novo `index.html`, sem alterar
Evolution, Mercado Pago ou banco.

## Health checks

Retorno HTTP 200:

- `https://api.replymesh.cloud/up`
- `https://lanchesdo2r.com.br/`
- `https://lanchesdo2r.com.br/admin/dashboard`
- `https://lanchesdo2r.com.br/admin/orders`
- `https://lanchesdo2r.com.br/admin/products`
- `https://lanchesdo2r.com.br/login`
- `https://lanchesdo2r.com.br/motoboy/login`

## Pendencias

- Executar os specs focados em CI/Linux com as gems completas.
- As oito vulnerabilidades registradas pelo `npm audit` ja existiam nas
  dependencias e nao foram alteradas neste hotfix.
