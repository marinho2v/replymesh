# Fase 15.20 - Limpeza Local e Modulos Parciais

Data: 06/06/2026

## Resultado

A fase foi concluida em ambiente local sem iniciar VPS, deploy ou Fase 16.

## Supabase legado

As rotas ativas do `store-template` foram migradas ou confirmadas no Rails:

- autenticacao administrativa;
- checkout publico;
- pedidos e alteracao de status;
- zonas de entrega;
- configuracoes e horarios;
- templates WhatsApp;
- marketing e recuperacao;
- relatorios.

Os arquivos antigos `products.js`, `categories.js`, `productOptions.js`,
`whatsappService.js`, `motoboyPortal.js` e `useRealtimeOrders.js` permanecem
somente como referencia historica. Nenhuma rota atual os carrega.

## Marketing WhatsApp

Finalizado localmente:

- clientes da empresa atual;
- filtros por recorrencia e inatividade;
- envio individual via Rails/Evolution;
- log de envio;
- campanhas em rascunho;
- confirmacao obrigatoria antes do disparo coletivo.

## Recuperador de Vendas

Finalizado localmente:

- periodos de 7, 15, 30, 60 e 90 dias;
- total gasto, pedidos e ticket medio;
- selecao individual e todos filtrados;
- envio individual;
- templates Sentimos sua falta, Cupom de retorno, Frete gratis, Promocao
  especial e Cliente VIP;
- criacao de campanha sem disparo automatico.

## Aplicativo Android

Fluxo administrativo local concluido. A loja solicita e acompanha o pedido; o
Master visualiza e altera o status. Geracao de APK, Flutter e push nativo nao
fazem parte desta fase.

## Relatorios

Foi criado `GET /api/v1/store/reports`. O endpoint retorna dados isolados pela
empresa autenticada e calcula receita, custos, lucro, margem, pedidos,
pagamentos, produtos e horarios sem Supabase.

## Validacoes executadas

- `rails db:migrate`: aprovado.
- `rails routes`: endpoint de relatorios, marketing e Android presentes.
- `ruby -c`: controllers alterados aprovados.
- `npm run build` no `store-template`: aprovado.
- `npm run build` no `replymesh-frontend`: aprovado.
- `npm run lint` no `replymesh-frontend`: aprovado.
- Rails runner: 6 empresas, 73 pedidos, 2 campanhas e 1 solicitacao Android.

## Pendencias exclusivas de VPS

- DNS wildcard `*.replymesh.cloud`;
- Nginx e SSL;
- webhooks publicos Evolution e Mercado Pago;
- scheduler permanente de expiracao Pix;
- monitoramento, backups e rollback;
- homologacao externa multiempresa.

## Observacoes

Classic e Premium permanecem selecionaveis. Pizzaria, Doceria e Bebidas
continuam bloqueados com a indicacao `Template em breve`, ate existir design
aprovado. A IA da loja permanece em simulador local.
