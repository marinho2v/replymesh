# REPLYMESH — Fase 15.11 — Pix Mercado Pago + Notificações de Pagamento

**Data:** 2026-06-05  
**Ambiente:** Local controlado  
**Status:** CONCLUÍDA

---

## Restrições respeitadas

- VPS não iniciada.
- Deploy não iniciado.
- Fase 16 não iniciada.
- 2R original não alterado.
- Fluxo WhatsApp não alterado.
- Checkout atual não quebrado.
- Token de acesso nunca exposto no frontend.

---

## 1. Backend — Banco de Dados

### Migrations aplicadas

**`20260605180000` — AddMercadopagoToStoreSettings:**
```
store_settings.pix_provider                (string, default: 'manual')
store_settings.mercadopago_public_key      (string)
store_settings.mercadopago_access_token    (text — mascarado na API)
store_settings.mercadopago_webhook_secret  (string)
store_settings.mercadopago_enabled         (boolean, default: false)
```

**`20260605180001` — AddPaymentStatusToOrders:**
```
orders.external_payment_id   (string, unique index)
orders.payment_confirmed_at  (datetime)
orders.pix_qr_code           (text)
orders.pix_qr_code_base64    (text)
orders.pix_ticket_url        (string)
```

`PAYMENT_STATUSES` atualizado para:
```
not_required, pending_payment, pending, paid, failed, expired, refunded, cancelled
```

---

## 2. Backend — Serviço Mercado Pago

**`MercadoPagoPixService`:**

- `create_pix_payment(order:, payer_email:)` → cria pagamento via `POST /v1/payments`
- `check_payment(payment_id)` → consulta status via `GET /v1/payments/:id`
- `self.test_connection(access_token)` → verifica credenciais via `GET /users/me`
- Timeout: 15s read, 10s open
- Idempotency key: `replymesh-order-{id}-{company_id}`

**Modo desenvolvimento:**
- Token começando com `TEST-` ou `DEV-` → retorna mock sem chamada real
- Mock QR Code: payload BR Code simplificado
- Mock Base64: pixel placeholder (substituir quando integração real)

---

## 3. Backend — Webhook

**`POST /api/v1/webhooks/mercadopago`:**
- Recebe `data.id` ou `id` (payment_id)
- Busca pedido por `external_payment_id`
- Verifica MP → confirma ou rejeita
- Se `approved`: marca `payment_status: 'paid'`, avança status para `accepted`
- Dispara `NotificationService` (billing notification para a empresa)
- Seguro para erros — sempre retorna `200 OK`

**`POST /api/v1/webhooks/mercadopago/simulate` (DEV ONLY):**
- Aceita `order_id` e `status` (approved/rejected/pending)
- Processa o mesmo fluxo de webhook
- Retorna status atualizado do pedido
- **Bloqueado em produção** — retorna 403 se `!Rails.env.development?`

**`GET /api/v1/public/:slug/payments/:order_id/status`:**
- Retorna `{ payment_status, order_status, confirmed_at, has_pix }`

---

## 4. Backend — Integração com Checkout

`Public::OrdersController#create` → chama `maybe_create_mp_pix(order, company)`:
- Verifica se `mercadopago_enabled && pix_provider == 'mercadopago'`
- Verifica se `payment_method == 'pix'`
- Chama `MercadoPagoPixService#create_pix_payment`
- Salva `external_payment_id`, `pix_qr_code`, `pix_qr_code_base64`, `pix_ticket_url`
- Retorna dados MP junto com o pedido (não bloqueante — `rescue` em caso de falha)

---

## 5. Segurança do Token

- `StoreSetting#mask_token(token)` → retorna `"TEST****5678"` (4 primeiros + asteriscos + 4 últimos)
- `as_company_settings_json` sempre retorna o token mascarado
- `settings.js` no frontend: só envia o token se o usuário digitou algo novo (não contém `****`)
- Token nunca vai para localStorage, sessionStorage ou console

---

## 6. Frontend — Settings.jsx

Seção "Pagamentos / PIX" expandida com:
- **Modo Pix:** select `manual` / `mercadopago`
- **Checkbox:** "Habilitar Mercado Pago"
- Quando `mercadopago` selecionado:
  - Input Public Key
  - Input Access Token (type="password")
  - Input Webhook Secret
  - Info box com URL do webhook + simulação dev

---

## 7. Frontend — Checkout.jsx

Quando o pedido retorna `pix_payment_id`:
- Exibe `MercadoPagoPixPanel` em vez de navegar para `/success`
- Polling automático a cada 5s (via `usePixPayment`)
- Quando `paid` confirmado → navega para `/success/:orderId`

---

## 8. Componentes e Hooks Criados

| Arquivo | Descrição |
|---|---|
| `hooks/usePixPayment.js` | Polling 5s de status de pagamento, até 10min |
| `components/shared/MercadoPagoPixPanel.jsx` | Painel QR Code + copia e cola + status |
| `utils/pix.js` (atualizado) | `isMercadoPagoEnabled`, `isMercadoPagoConfigured`, `maskToken` |
| `services/publicApi.js` (atualizado) | `getPublicPaymentStatus`, `createPublicOrder` retorna dados MP |

---

## 9. Fluxo completo (dev mock)

```
1. Admin configura: pix_provider = mercadopago, public_key + access_token TEST-, enabled = true
2. Cliente faz checkout → seleciona Pix
3. Pedido criado → MercadoPagoPixService detecta token TEST- → retorna mock
4. Frontend exibe MercadoPagoPixPanel com QR Code mock
5. Dev simula pagamento: POST /api/v1/webhooks/mercadopago/simulate { order_id, status: approved }
6. Webhook processa → marca paid → avança para accepted → notificação criada
7. Frontend (polling 5s) detecta paid → navega para /success/:orderId
```

---

## 10. Testes técnicos

| Teste | Resultado |
|---|---|
| `ruby -c` 8 arquivos Ruby | ✅ ALL OK |
| `rails db:migrate` | ✅ 2 migrations aplicadas |
| `rails routes` (mercadopago) | ✅ 4 rotas corretas |
| `npm run build` store-template | ✅ built in 8.18s — 0 erros |

---

## 11. Pendências para Fase 16 / VPS

| Pendência | Detalhe |
|---|---|
| Access token com criptografia real | Usar Rails ActiveRecord::Encryption ou attr_encrypted |
| Webhook URL pública | Configurar ngrok (dev) ou URL pública (VPS) no painel MP |
| QR Code base64 real | Mock atual é placeholder — MP real retornará imagem |
| Teste com conta MP real | Conta Sandbox + credenciais TEST- reais |
| Webhook signature verification | Validar `X-Signature` do MP para segurança |
| Expiração de Pix (30min) | Adicionar `date_of_expiration` no payload de criação |
| Pix no template Premium | MercadoPagoPixPanel disponível para integrar |

---

*Gerado em 2026-06-05 — Fase 15.11 concluída*
