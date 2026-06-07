# Replymesh - Fase 15.11.2 - Pix Mercado Pago em Tempo Real

Data: 2026-06-05

## Escopo

Corrigir o fluxo Pix Mercado Pago para confirmar pagamento automaticamente por polling, aceitar o pedido, cancelar automaticamente apos 3 minutos e permitir cancelamento manual pelo cliente.

Nao foi iniciado:

- VPS/deploy.
- Fase 16.
- Alteracao no 2R original.
- Chave real no frontend.
- Marketing em massa.

## Backend

Arquivos principais:

- `replymesh-api/app/services/mercado_pago_payment_processor.rb`
- `replymesh-api/app/controllers/api/v1/public/payments_controller.rb`
- `replymesh-api/app/controllers/api/v1/public/orders_controller.rb`
- `replymesh-api/app/controllers/api/v1/webhooks/mercadopago_controller.rb`
- `replymesh-api/app/controllers/api/v1/store/orders_controller.rb`
- `replymesh-api/config/routes.rb`

Endpoints:

- `GET /api/v1/public/:company_slug/payments/:order_id/status`
- `POST /api/v1/public/:company_slug/orders/:id/cancel_payment`
- `POST /api/v1/webhooks/mercadopago`
- `POST /api/v1/webhooks/mercadopago/simulate`

Regras implementadas:

- `approved` confirma o Pix, marca `payment_status = paid`, muda pedido para `accepted` e grava `accepted_at`.
- Pedido Pix pendente com mais de 3 minutos expira com `payment_status = expired` e `status = cancelled`.
- Cancelamento manual publico so funciona para pedido ainda em `pending_payment`.
- Pagamento rejeitado/falho cancela o pedido e marca `payment_status = failed`.
- Webhook real e simulacao usam o mesmo processador do polling.
- Notificacoes Rails sao criadas para pagamento confirmado, expirado e cancelado.
- KDS/cozinha nao lista pedidos Pix ainda aguardando pagamento.

## Frontend

Arquivos principais:

- `store-template/src/hooks/usePixPayment.js`
- `store-template/src/components/shared/MercadoPagoPixPanel.jsx`
- `store-template/src/pages/public/Checkout.jsx`
- `store-template/src/services/publicApi.js`
- `store-template/src/components/dashboard/OrderActions.jsx`
- `store-template/src/components/dashboard/OrderStatusBadge.jsx`
- `store-template/src/components/dashboard/OrdersTable.jsx`

Regras implementadas:

- Polling a cada 5 segundos usando o slug atual da loja.
- Painel mostra QR Code, copia e cola, copiar, atualizar status, cancelar pedido e contador regressivo de 3 minutos.
- Quando pago, o frontend chama `onConfirmed` e segue para sucesso.
- Quando expira/cancela/falha, o painel mostra estado de cancelado/expirado.
- Admin mostra badge "Aguardando pagamento" e nao mostra acao "Aceitar" enquanto `payment_status = pending_payment`.

## Testes locais

Ambiente:

- Rails API: `http://127.0.0.1:3000`
- Store Template: build local
- Empresa: `demohamburgueria`
- Token Mercado Pago local: `TEST-REPLYMESH-LOCAL`
- Telefones de teste: falsos, para nao enviar mensagem real para cliente.

Resultados:

- `rails db:migrate`: OK.
- `rails routes`: OK.
- `ruby -c` nos Rails alterados: OK.
- `npm run build` no `store-template`: OK.
- Polling approved:
  - Pedido teste `#30`, id `60`.
  - Resultado: `payment_status = paid`, `status = accepted`, `accepted_at` preenchido.
- Polling expired:
  - Pedido teste `#31`, id `61`.
  - Resultado: `payment_status = expired`, `status = cancelled`, `cancelled_at` preenchido.
- Cancelamento publico:
  - Pedido teste `#32`, id `62`.
  - Resultado: `success = true`, `payment_status = cancelled`, `status = cancelled`.
- Webhook simulate rejected:
  - Pedido teste `#33`, id `63`.
  - Resultado: `payment_status = failed`, `status = cancelled`.
- Logs de status:
  - `pending -> accepted` para approved.
  - `pending -> cancelled` para expired/cancelled/rejected.
- Notificacoes:
  - "Pagamento confirmado - Pedido #30".
  - "Pix expirado - Pedido #31".
  - "Pix cancelado - Pedido #32".
  - "Pix cancelado - Pedido #33".

## WhatsApp

- O fluxo aprovado acionou o disparo do template `pedido_aceito`.
- Como o teste usou telefone falso, o envio real falhou e foi registrado em `whatsapp_logs` como erro seguro.
- Para cancelamento/expiracao/rejeicao, `pedido_cancelado` estava desativado; o sistema registrou que o envio foi ignorado por template desativado.
- Nenhuma chave/token foi exposta no frontend ou documentacao.

## Pendencias

- Testar pagamento real Mercado Pago somente quando houver ambiente publico/webhook seguro.
- Validar envio real do WhatsApp `pedido_aceito` com um pedido teste controlado e telefone autorizado.
- Definir regra final de producao para expirar por job/server-side alem do polling do cliente, para cobrir caso o cliente feche a tela.

## Proxima recomendacao

Fase 16 - VPS e producao, somente com confirmacao explicita.
