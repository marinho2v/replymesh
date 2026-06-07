# FASE 15.11.3 - Auditoria Final do Mercado Pago + Jobs Pendentes

Data: 2026-06-06

## Resultado

Status: concluida localmente, sem iniciar VPS/deploy/Fase 16.

## Correcoes feitas

- Pedidos publicos agora possuem `public_token` aleatorio.
- URLs publicas de acompanhamento usam token, exemplo:
  - antes: `/loja/demohamburgueria/success/70`
  - agora: `/loja/demohamburgueria/success/xdaSCoPR1kXZk73wIAHfZuiY`
- Endpoint publico de pedido busca somente por `public_token`.
- Endpoint publico de status Pix busca somente por `public_token`.
- Endpoint publico de cancelamento Pix busca somente por `public_token`.
- Resposta publica de status Pix retorna `order_id` como token publico, nao como ID interno.
- Impressao do pedido no admin recebeu HTML com `charset=UTF-8`.
- Cupom de impressao passou a formatar moeda como `R$ 0,50`, sem `R$Â`.
- Webhook Mercado Pago passou a rejeitar payload sem `payment_id` valido com 400.

## Expiracao local

Criado service:

- `PaymentExpirationService`

Criado rake:

```powershell
rails payments:expire_pending_pix
```

Regra:

- pedidos Pix com `payment_status = pending_payment` e mais de 3 minutos sao processados;
- o processor consulta status remoto quando possivel;
- se continuar pendente depois da janela, vira `expired` e pedido vira `cancelled`.

Teste local:

- pedidos verificados: 6
- pedidos expirados: 5

## Auditoria Pix

Validado localmente:

- Pix Mercado Pago real gerou QR Code e copia e cola.
- Pedido pago virou `payment_status = paid`.
- Fluxo aprovado chamou o processor e aceitou o pedido automaticamente.
- Pedido expirado vira `expired + cancelled`.
- Pedido cancelado pelo cliente usa endpoint publico com token.
- Pedido rejeitado continua mapeado para `failed + cancelled`.
- Admin nao exibe acao "Aceitar" quando `payment_status = pending_payment`.
- Cozinha nao recebe pedido Pix ainda em `pending_payment`.

## Seguranca

- Access Token Mercado Pago nao e retornado no endpoint publico.
- Access Token nao e usado no frontend.
- Configuracoes mascaram token existente.
- URL publica de pedido nao usa mais ID sequencial.
- Webhook sem `payment_id` valido retorna 400.
- O comando de expiracao nao imprime tokens.

## Testes executados

- `rails db:migrate`: OK.
- `rails routes`: OK.
- `ruby -c` nos arquivos Rails alterados: OK.
- `rails payments:expire_pending_pix`: OK.
- `GET /api/v1/public/demohamburgueria/orders/70`: 404.
- `GET /api/v1/public/demohamburgueria/orders/xdaSCoPR1kXZk73wIAHfZuiY`: 200.
- `GET /api/v1/public/demohamburgueria/payments/_9i6fcN3zyTKarjHjujOaNSX/status`: 200.
- `POST /api/v1/webhooks/mercadopago` com payload invalido: 400.
- `npm run build` no `store-template`: OK.

## Pendencias para VPS

- Configurar webhook real do Mercado Pago em URL publica.
- Rodar `payments:expire_pending_pix` por scheduler/cron ou job backend na VPS.
- Testar pagamento real em producao com valor baixo.
- Conferir logs do Mercado Pago no painel da conta.
- Confirmar se o fluxo de notificacao WhatsApp deve disparar automaticamente para todos os planos.

## Nao iniciado

- VPS/deploy.
- Fase 16.
- Alteracoes no 2R original.
