# RELATÓRIO — FASE 16.20C: MESA, GARÇOM, KDS, WHATSAPP RECEBIDO E PDV

Data: 11/06/2026
Status: **EM ANDAMENTO — código pronto e testado localmente; deploy bloqueado aguardando autorização (ver seção DEPLOY)**

---

## 1. O QUE JÁ ESTAVA FEITO (sessão anterior, validado nesta sessão)

- Mapeamento `pending`/`order_created` → template `pedido_recebido` (`WhatsappTemplate::STATUS_TEMPLATE_KEYS`).
- `pedido_recebido` habilitado por padrão (`ENABLED_BY_DEFAULT`).
- Disparo após `CheckoutService` criar pedido (`dispatch_order_received`), com rescue para não quebrar checkout.
- Anti-duplicidade via `WhatsappLog` (`notification_already_sent?` por company + order + template + status).
- Role `waiter` no backend (`CompanyMember::ROLES`) e mapeamento `waiter`/`garcom` no `users_controller`.
- `authorize_store_role!` no `Store::BaseController`: waiter/kitchen/employee com whitelist por controller+action; recursos proibidos retornam **HTTP 403** (validado por spec).
- `orders_controller#status_allowed_for_role?`: kitchen só `accepted/preparing/ready`; waiter só `ready→completed` em pedido `dine_in`.
- Comanda do garçom cria pedido real `dine_in` (`create_order_for_kitchen!` em `table_sessions_controller`), com `legacy_source: "table_waiter"`.
- QR Code cria pedido `dine_in` com `legacy_source: "table_qr"`, sempre vinculado a sessão.
- `OrderStatusService`: sequência própria para `dine_in` e `pickup` (`pending→accepted→ready→completed`); **mesa não dispara WhatsApp** (`prepare_whatsapp_update` retorna cedo para dine_in).
- KDS: colunas Pendentes/Aceitos/Em Preparo/Prontos/Finalizados; botões por tipo ("Pronto para mesa", "Pronto para retirada"); pedidos de mesa com borda própria e origem (QR vs atendente).
- Frontend waiter: rotas restritas, redirect para `/admin/tables`, painel "Prontos para servir" com "Marcar servido", sem botões de edição/QR para garçom.
- `WheelService` corrigido para usar `subtotal_cents` (não soma taxa de entrega nos giros).

## 2. O QUE FOI CORRIGIDO NESTA SESSÃO

1. **`whatsapp_template.rb` com encoding corrompido (mojibake)** — todos os emojis dos templates estavam como `ðŸ”`; arquivo reescrito em UTF-8 correto.
2. **Mensagem `pedido_recebido` quebrada** — estava em aspas simples: `\n` ia literal para o WhatsApp. Corrigida com aspas duplas e `\#{{numero_pedido}}` escapado (Ruby não interpola, cliente recebe `#123`).
3. **Erro de sintaxe no spec** `whatsapp_status_dispatcher_spec.rb` (`"#{{...}}"` em aspas duplas = interpolação inválida) — corrigido.
4. **Validação de telefone fraca no dispatcher** — `normalize_phone` agora exige mínimo 10 dígitos (DDD+número); pedidos de mesa com `customer_phone: "mesa-X"` nunca viram destino válido.
5. **Financeiro da mesa** — novo comportamento:
   - Pedido `dine_in` **não** entra no caixa ao ser marcado `completed` (servido) — entra **no fechamento da sessão**, com a forma de pagamento real escolhida pelo garçom (`finalize_order_payment!`).
   - No fechamento: sincroniza `payment_method`/`discount_cents`/`total_cents` no pedido, avança status passo a passo até `completed` (aceitar também baixa estoque se a cozinha não tiver aceitado), registra no caixa **uma única vez** (idempotente via `financial_recorded_at`).
6. **Badge de tipo no KDS** — cards agora mostram explicitamente `MESA / SALAO` (verde), `DELIVERY` (azul), `RETIRADA` (âmbar).

## 3. STATUS USADOS POR TIPO

| Tipo | Fluxo |
|---|---|
| delivery | pending → accepted → (preparing/ready se habilitados) → out_for_delivery → completed |
| pickup/retirada | pending → accepted → ready → completed |
| dine_in/mesa | pending → accepted → ready ("Pronto para mesa") → completed ("Servido", pelo garçom) |

## 4. TESTES AUTOMATIZADOS (locais)

- Suíte completa: **94 exemplos, 3 falhas — todas pré-existentes no HEAD** (confirmado via stash):
  - `evolution_location_webhook_spec.rb:12` (500 — `gsub` em nil) — **pendência fora do escopo**
  - `store_ai_whatsapp_multi_tenant_spec.rb` (2 falhas) — **pendência fora do escopo**
- Novos specs criados (`spec/requests/table_session_flow_spec.rb`, 4 exemplos, todos verdes):
  - Garçom abre mesa → envia à cozinha → pedido `dine_in` real → fecha com PIX → pedido `completed`, `payment_method: pix`, movimento `sale_pix` no caixa, **zero** WhatsApp, sem motoboy, mesa liberada.
  - Fechamento duplo **não** duplica caixa.
  - Waiter: 200 em mesas/produtos(leitura); **403** em reports, users, inventory, cash_sessions, coupons, motoboys.
  - Waiter não cria produto (403).
- Specs WhatsApp: `pending` → `pedido_recebido` enviado 1x, segundo disparo bloqueado ("notificacao ja enviada").

## 5. VALIDAÇÕES PRÉ-DEPLOY (todas OK)

- `ruby -c` em todos os `.rb` alterados: OK
- `npm run build` store-template: OK (7.8s)
- `npm run build` replymesh-frontend: OK
- `git diff --check`: OK
- Auditoria de segredos nos diffs: limpa

## 6. SITUAÇÃO DA VPS (descoberta crítica)

**A API de produção está FORA DO AR** (https://api.replymesh.cloud/up → 502).

- Container `replymesh-rails-api` (imagem `v0.15.31-table-kds-waiter`, da sessão anterior) em **crash-loop com 49 restarts**.
- Causa: subiu com `./bin/rails server -b 0.0.0.0` (porta **3000**) em `--network host`, mas a 3000 é do **Dokploy** → `EADDRINUSE`.
- O container que funcionava (`...-pre-16-20c-...`, parado como backup) usava `-p 3010`; o Traefik roteia `api.replymesh.cloud → http://172.17.0.1:3010`.
- **Correção: recriar o container com `./bin/rails server -b 0.0.0.0 -p 3010`** (exatamente o que a fase já previa).
- Atenção: a imagem `v0.15.31` contém o `whatsapp_template.rb` com mojibake — precisa de imagem nova com os arquivos corrigidos desta sessão.

## 7. URLS E CREDENCIAIS (planejadas para os testes)

- Cozinha/KDS: `https://demohamburgueria.replymesh.cloud/kitchen`
- Garçom: `https://demohamburgueria.replymesh.cloud/loja/demohamburgueria/admin/tables`
- Usuário garçom (a criar na demo): `garcom.demo@replymesh.cloud` / `123456` (role `waiter`)
- Número autorizado para WhatsApp de teste: +55 21 95909-9803

## 8. TESTES A–F NA DEMO

**Pendentes — dependem do deploy** (ver seção 6). Roteiro pronto na fase.

## 9. PENDÊNCIAS REGISTRADAS

1. **PDV/Balcão: classificação D — não existe PDV real** (ver `PDV_STATUS_REPORT.md`). Não vender "Pedidos Balcão (PDV)" no START até construir a tela + endpoint.
2. Webhook de localização Evolution: 500 (`gsub` em nil) — pré-existente, fora do escopo.
3. Store AI multi-tenant: 2 specs falhando — pré-existente, fora do escopo.
4. PIX manual / troco no fechamento de mesa: caixa registra troco apenas se `needs_change` no pedido; fluxo de troco da mesa não tem UI própria (registrado como pendência).
5. Estoque: baixa ocorre no `accepted`; se a cozinha nunca aceitar e a mesa for fechada, a baixa acontece no fechamento (via avanço de status). Cancelamento restaura apenas se já deduzido (sem duplicação) — coberto por flag `inventory_deducted`.

## 10. COMMIT/TAG

**Não criado** — aguardando testes finais na demo, conforme regra da fase.

---

## CONCLUSÃO PARCIAL

Código da fase: **pronto e validado por testes automatizados locais**.
Deploy + testes A–F: **bloqueados aguardando autorização para agir na VPS** (e a API de produção está derrubada por erro da sessão anterior — correção conhecida e simples).
