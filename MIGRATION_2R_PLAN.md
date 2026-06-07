# MIGRATION_2R_PLAN — Replymesh SaaS

> **Documento de planejamento técnico.**
> Esta fase é somente planejamento e análise. Nenhuma migration será executada, nenhum arquivo do 2R será alterado e nenhum dado real será movido sem aprovação explícita.

**Data de criação:** 2026-06-04
**Baseado em:** Auditoria completa do projeto `M:\temple1` (30 tabelas, 70 migrations, 8 Edge Functions, 25+ RPCs)

---

## 1. OBJETIVO DA MIGRAÇÃO

Transformar o sistema **Lanches do 2R** em um **template SaaS reutilizável** da plataforma Replymesh.

### Situação atual

O Lanches do 2R é um sistema de delivery completo e maduro:

- Frontend React/Vite + TailwindCSS
- Backend via Supabase (PostgreSQL + Auth + Realtime + Storage + Edge Functions)
- 30 tabelas de negócio, 70 migrations, 25+ RPCs
- Apps Flutter (cliente + motoboy)
- 100% single-tenant — hardcoded para uma única loja

### Objetivo final

Transformar esse sistema em um template que qualquer empresa cliente da Replymesh possa usar, onde:

1. O **Painel Master Replymesh** cadastra a empresa, cria plano, domínio e instância WhatsApp
2. O **Backend Rails** da Replymesh passa a ser o servidor central (substituindo Supabase)
3. O **Frontend do 2R** é reutilizado como base visual do "Painel da Loja" de qualquer empresa
4. O **Lanches do 2R** migra como a primeira empresa real da Replymesh (`company_id = 1` ou o ID gerado no onboarding)

---

## 2. O QUE NÃO SERÁ FEITO AGORA

Esta fase é de planejamento. As seguintes ações estão **estritamente proibidas** até aprovação individual:

| Ação | Status |
|---|---|
| Alterar qualquer arquivo do projeto `M:\temple1` | ❌ Proibido |
| Executar migrations no Supabase do 2R | ❌ Proibido |
| Alterar banco Supabase do 2R (produção ou dev) | ❌ Proibido |
| Copiar dados reais de clientes/pedidos | ❌ Proibido |
| Trocar o domínio do 2R | ❌ Proibido |
| Alterar os apps Flutter | ❌ Proibido |
| Fazer deploy de qualquer coisa | ❌ Proibido |
| Alterar o backend Rails atual da Replymesh | ❌ Proibido agora |
| Alterar o frontend React/Vite da Replymesh | ❌ Proibido agora |

---

## 3. ESTRATÉGIA GERAL

A migração será feita em **etapas graduais e reversíveis**, nunca de uma vez.

### Princípios

1. **Nenhuma quebra no 2R atual** — o sistema continua funcionando enquanto a migração acontece
2. **Teste com empresa fake antes** — toda feature é validada em empresa de teste antes de tocar dados reais
3. **Legacy ID preservado** — os UUIDs do Supabase são guardados em campo `legacy_id` nos models Rails
4. **Rollback sempre possível** — cada fase tem checklist de backup e ponto de reversão
5. **Rails substitui Supabase progressivamente** — não é uma troca instantânea

### Etapas macro

```
[Hoje]
Lanches do 2R  →  Supabase (PostgreSQL + Auth + Edge Functions)
                  React/Vite (frontend dedicado)
                  Flutter apps (cliente + motoboy)

[Etapa A — Rails schema operacional]
Criar tabelas Rails equivalentes com company_id
Criar APIs Rails para produtos, pedidos, clientes, caixa, estoque, WhatsApp

[Etapa B — Frontend template]
Copiar frontend 2R para pasta separada (não toca original)
Trocar services Supabase por services HTTP → Rails API
Parametrizar pontos hard-coded (nome, cor, telefone, URL)

[Etapa C — Empresa fake]
Criar empresa "Loja Teste" via Replymesh Master
Validar fluxo completo end-to-end com dados de teste
Ajustar o que não funcionar

[Etapa D — Migração real do 2R]
Backup completo
Criar empresa "Lanches do 2R" na Replymesh
Importar dados com script controlado
Testar em paralelo (2R antigo ainda rodando)
Fazer cutover somente quando aprovado

[Final]
Lanches do 2R  →  Rails API Replymesh (PostgreSQL com company_id)
                  Frontend template (reutilizável por qualquer empresa)
                  Flutter apps (adaptados para multi-tenant)
```

---

## 4. ARQUITETURA FINAL ESPERADA

```
┌─────────────────────────────────────────────────────────────┐
│                   REPLYMESH SAAS                            │
│                                                             │
│  ┌─────────────────────────┐                                │
│  │   PAINEL MASTER          │  ← super_admin                │
│  │  (já implementado)       │                               │
│  │  • Cadastrar empresa     │                               │
│  │  • Criar plano           │                               │
│  │  • Criar domínio         │                               │
│  │  • Criar WhatsApp inst.  │                               │
│  │  • Ver financeiro        │                               │
│  │  • Logs e alertas        │                               │
│  └────────────┬────────────┘                                │
│               │  CompanyOnboardingService                   │
│               ▼                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           RAILS API + PostgreSQL                     │   │
│  │                                                      │   │
│  │  companies { id, slug, company_id, ... }             │   │
│  │  ├── Empresa 1: Lanches do 2R   (company_id=1)       │   │
│  │  ├── Empresa 2: Pizzaria João   (company_id=2)       │   │
│  │  └── Empresa N: ...             (company_id=N)       │   │
│  │                                                      │   │
│  │  Tabelas operacionais (todas com company_id):        │   │
│  │  orders, products, categories, customers,            │   │
│  │  motoboys, inventory, cash, whatsapp_templates...    │   │
│  └─────────────────────────────────────────────────────┘   │
│               │                                             │
│    ┌──────────┴──────────┐                                  │
│    ▼                     ▼                                  │
│  ┌────────────┐    ┌─────────────────────────────────┐     │
│  │ PAINEL     │    │  TEMPLATE LOJA (por empresa)    │     │
│  │ MASTER     │    │  (baseado no frontend 2R)       │     │
│  │ (React)    │    │                                 │     │
│  │            │    │  • Site público de delivery     │     │
│  │ Fases 1-8  │    │  • Checkout                     │     │
│  │ concluídas │    │  • Painel admin da loja         │     │
│  │            │    │  • Dashboard                    │     │
│  │            │    │  • Produtos / Categorias        │     │
│  │            │    │  • Pedidos                      │     │
│  │            │    │  • Cozinha (KDS)                │     │
│  │            │    │  • Motoboy portal               │     │
│  │            │    │  • Estoque                      │     │
│  │            │    │  • Caixa                        │     │
│  │            │    │  • Relatórios                   │     │
│  │            │    │  • WhatsApp automático          │     │
│  │            │    │  • App banners                  │     │
│  └────────────┘    └─────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. MAPEAMENTO SUPABASE → RAILS

### Convenções de nomenclatura

| Supabase | Rails | Observação |
|---|---|---|
| UUID como PK | `bigint` serial + `legacy_id uuid` | Preserva ID original |
| `is_active` | `active` ou `status` | Padrão Rails |
| `created_at` / `updated_at` | Mantidos | Padrão Rails |
| `profiles` | `users` + `company_members` | Já existem na Replymesh |
| RLS policy | Scope por `company_id` no ActiveRecord | Rails convention |

### Tabelas

| Tabela Supabase | Model Rails | Endpoint Rails | `company_id` | Prioridade | Risco |
|---|---|---|---|---|---|
| `categories` | `Category` | `GET/POST /api/v1/store/categories` | ✅ Obrigatório | 🔴 Alta | 🟢 Baixo |
| `products` | `Product` | `GET/POST /api/v1/store/products` | ✅ Obrigatório | 🔴 Alta | 🟡 Médio |
| `product_option_groups` | `ProductOptionGroup` | Aninhado em products | ✅ Obrigatório | 🔴 Alta | 🟡 Médio |
| `product_option_items` | `ProductOptionItem` | Aninhado em option_groups | ✅ Obrigatório | 🔴 Alta | 🟢 Baixo |
| `delivery_zones` | `DeliveryZone` | `GET/POST /api/v1/store/delivery_zones` | ✅ Obrigatório | 🔴 Alta | 🟢 Baixo |
| `customers` | `Customer` | `GET/POST /api/v1/store/customers` | ✅ Obrigatório | 🔴 Alta | 🟡 Médio |
| `customer_addresses` | `CustomerAddress` | Aninhado em customers | ✅ Obrigatório | 🟡 Média | 🟢 Baixo |
| `coupons` | `Coupon` | `GET/POST /api/v1/store/coupons` | ✅ Obrigatório | 🟡 Média | 🟢 Baixo |
| `orders` | `Order` | `GET/POST /api/v1/store/orders` | ✅ Obrigatório | 🔴 Alta | 🔴 Alto |
| `order_items` | `OrderItem` | Aninhado em orders | ✅ Obrigatório | 🔴 Alta | 🟡 Médio |
| `order_status_logs` | `OrderStatusLog` | `GET /api/v1/store/orders/:id/logs` | ✅ Obrigatório | 🟡 Média | 🟢 Baixo |
| `order_payment_details` | `OrderPaymentDetail` | Aninhado em orders | ✅ Obrigatório | 🔴 Alta | 🟡 Médio |
| `order_attempts` | `OrderAttempt` | Interno (sem endpoint público) | ✅ Obrigatório | 🟡 Média | 🟢 Baixo |
| `motoboys` | `Motoboy` | `GET/POST /api/v1/store/motoboys` | ✅ Obrigatório | 🔴 Alta | 🟡 Médio |
| `delivery_history` | `DeliveryHistory` | Aninhado em orders | ✅ Obrigatório | 🔴 Alta | 🟡 Médio |
| `dining_tables` | `DiningTable` | `GET/POST /api/v1/store/tables` | ✅ Obrigatório | 🟡 Média | 🟡 Médio |
| `table_sessions` | `TableSession` | `GET/POST /api/v1/store/table_sessions` | ✅ Obrigatório | 🟡 Média | 🔴 Alto |
| `inventory_items` | `InventoryItem` | `GET/POST /api/v1/store/inventory` | ✅ Obrigatório | 🟡 Média | 🟢 Baixo |
| `inventory_movements` | `InventoryMovement` | `POST /api/v1/store/inventory/:id/move` | ✅ Obrigatório | 🟡 Média | 🟡 Médio |
| `cash_sessions` | `CashSession` | `GET/POST /api/v1/store/cash_sessions` | ✅ Obrigatório | 🟡 Média | 🔴 Alto |
| `cash_movements` | `CashMovement` | Aninhado em cash_sessions | ✅ Obrigatório | 🟡 Média | 🟡 Médio |
| `store_settings` | `StoreSetting` | `GET/PUT /api/v1/store/settings` | ✅ Obrigatório | 🔴 Alta | 🟡 Médio — deixa de ser singleton |
| `business_hours` | `BusinessHour` | `GET/PUT /api/v1/store/business_hours` | ✅ Obrigatório | 🟡 Média | 🟡 Médio — UNIQUE muda |
| `business_hour_exceptions` | `BusinessHourException` | Aninhado em business_hours | ✅ Obrigatório | 🟢 Baixa | 🟢 Baixo |
| `whatsapp_templates` | `WhatsappTemplate` | Já existe na Replymesh | ✅ Já tem | 🟢 Baixa | 🟢 Baixo — apenas estender |
| `whatsapp_message_logs` | `WhatsappLog` | Já existe parcialmente | ✅ Já tem | 🟢 Baixa | 🟢 Baixo |
| `marketing_campaigns` | `MarketingCampaign` | `GET/POST /api/v1/store/marketing` | ✅ Obrigatório | 🔵 Futura | 🟢 Baixo |
| `marketing_campaign_recipients` | `MarketingRecipient` | Aninhado em campaigns | ✅ Obrigatório | 🔵 Futura | 🟢 Baixo |
| `app_banners` | `AppBanner` | `GET/POST /api/v1/store/banners` | ✅ Obrigatório | 🟡 Média | 🟢 Baixo |

**Legenda prioridade:** 🔴 Alta (Fase 10/11) · 🟡 Média (Fase 12/13) · 🟢 Baixa (Fase 14+) · 🔵 Futura (sem data)

---

## 6. MAPEAMENTO RPCs SUPABASE → SERVICES RAILS

| RPC Supabase | Função atual | Service Rails | Endpoint Rails futuro | Risco |
|---|---|---|---|---|
| `upsert_checkout_customer` | Cria/atualiza cliente + endereço em transação no checkout | `CheckoutService#upsert_customer` | Interno em `POST /api/v1/store/orders` | 🟡 Médio |
| `transition_order_status` | Muda status do pedido com validação de transição, timestamps e logs | `OrderStatusService#transition` | `PATCH /api/v1/store/orders/:id/status` | 🔴 Alto |
| `assign_motoboy_to_order` | Vincula motoboy ao pedido, cria delivery_history, envia WhatsApp | `DeliveryService#assign_motoboy` | `POST /api/v1/store/orders/:id/assign_motoboy` | 🟡 Médio |
| `update_delivery_status` | Atualiza delivery_status em orders e delivery_history | `DeliveryService#update_status` | `PATCH /api/v1/store/delivery/:id/status` | 🟡 Médio |
| `complete_my_motoboy_delivery` | Finaliza entrega, marca completed, incrementa contador | `DeliveryService#complete` | `POST /api/v1/motoboy/deliveries/:id/complete` | 🟡 Médio |
| `open_cash_session` | Abre sessão de caixa (valida que não há outra aberta) | `CashService#open_session` | `POST /api/v1/store/cash_sessions` | 🔴 Alto |
| `close_cash_session` | Fecha caixa, calcula diferença, registra valores contados | `CashService#close_session` | `POST /api/v1/store/cash_sessions/:id/close` | 🔴 Alto |
| `apply_inventory_entry` | Entrada de estoque com registro de movimento | `InventoryService#entry` | `POST /api/v1/store/inventory/:id/entry` | 🟡 Médio |
| `apply_order_inventory_deduction` | Deduz estoque ao aceitar pedido; marca inventory_deducted | `InventoryService#deduct_for_order` | Interno em `transition_order_status(accepted)` | 🔴 Alto |
| `restore_inventory_from_cancelled_order` | Restaura estoque ao cancelar pedido | `InventoryService#restore_for_order` | Interno em `transition_order_status(cancelled)` | 🔴 Alto |
| `record_order_payment` | Registra venda no caixa aberto após completar pedido | `CashService#record_payment` | Interno em `transition_order_status(completed)` | 🔴 Alto |
| `attach_whatsapp_location_to_latest_order` | Vincula localização GPS recebida via webhook ao pedido ativo | `DeliveryService#attach_location` | `POST /api/v1/webhooks/evolution/location` | 🟡 Médio |
| `create_user_internal` | Cria usuário sem enviar e-mail de confirmação | Já existe: `SessionsController#create` + `CompanyMember` | Interno no onboarding | 🟢 Baixo |
| `get_my_motoboy_deliveries` | Retorna entregas do motoboy autenticado | `MotoboyPortalController#deliveries` | `GET /api/v1/motoboy/deliveries` | 🟡 Médio |
| `update_customer_stats` | Recalcula total_orders, total_spent, is_recurring do cliente | Trigger via `after_save` no `Order` model | Automático no Rails | 🟢 Baixo |
| `increment_coupon_usage` | Incrementa used_count do cupom | `Coupon#increment_usage!` | Interno no checkout | 🟢 Baixo |
| `recalculate_table_session_totals` | Recalcula subtotal/total da mesa ao adicionar/remover item | `TableSession#recalculate!` | Interno em order_items | 🟡 Médio |
| `open_table_session` / `close_table_session` | Gerencia ciclo de vida da mesa | `TableService#open` / `#close` | `POST /store/tables/:id/open` e `/close` | 🟡 Médio |
| `add_cash_movement` | Adiciona movimentação de caixa (sangria, suprimento, etc.) | `CashService#add_movement` | `POST /store/cash_sessions/:id/movements` | 🟡 Médio |

---

## 7. MAPEAMENTO EDGE FUNCTIONS → RAILS / JOBS

| Edge Function | Função atual | Destino no Rails | Job/Service futuro |
|---|---|---|---|
| `create-public-order` | Cria pedido público com anti-abuso (rate limit por IP/phone, janela de 90s, order_attempts) | `Store::OrdersController#create` + rate limiting via Redis | `PublicOrderService` com middleware de rate limit |
| `evolution-send-text` | Envia texto via Evolution GO (header `apikey`) | Já existe: `EvolutionGoClient#send_text` no Rails | Expandir `EvolutionGoClient` com método `send_text(number, text)` |
| `evolution-location-webhook` | Recebe webhook de localização GPS e vincula ao pedido ativo | `Webhooks::EvolutionController#location` (novo endpoint) | `DeliveryService#attach_location` |
| `wasender-send-text` | Envia texto via WaSender API | `WaSenderClient` (novo service, similar ao EvolutionGoClient) | `WhatsappDispatcher` com provider strategy |
| `zapi-send-text` | Envia texto via Z-API | `ZApiClient` (novo service) | `WhatsappDispatcher` com provider strategy |
| `marketing-whatsapp` | Dispara campanhas de marketing com daily limit | `MarketingJob` (Sidekiq) | `MarketingCampaignService` + `SendMarketingMessageJob` |
| `send-fcm-notification` | Envia push notification Android via Firebase | `FcmClient` (novo service) + `SendPushJob` (Sidekiq) | `PushNotificationService` |
| `admin-create-motoboy` | Cria usuário motoboy sem enviar e-mail | Já existe: `CompanyOnboardingService` + `company_members` | `MotoboyService#create_user` |

### Estratégia de WhatsApp multi-provider

O sistema atual do 2R tem 3 providers (Evolution, WaSender, Z-API). A Replymesh já tem o `EvolutionGoClient`. A estratégia será:

```ruby
# app/services/whatsapp_dispatcher.rb
class WhatsappDispatcher
  def self.send_text(company:, number:, text:)
    provider = company.store_setting&.whatsapp_provider || "evolution_go"
    case provider
    when "evolution_go" then EvolutionGoClient.new(...).send_text(number, text)
    when "wasender"     then WaSenderClient.new(...).send_text(number, text)
    when "zapi"         then ZApiClient.new(...).send_text(number, text)
    end
  end
end
```

---

## 8. PONTOS HARD-CODED — COMO SERÃO PARAMETRIZADOS

Todos os 15 pontos fixos identificados serão substituídos por valores dinâmicos vindos da tabela `store_settings` (filtrada por `company_id`).

| Ponto fixo | Arquivo atual | Valor atual | Substituição futura |
|---|---|---|---|
| Telefone oficial da loja | `src/services/settings.js` linha 3 | `+55 21 97714-9837` | `store_settings.phone` por `company_id` |
| Domínio e-mail motoboy | `supabase/functions/admin-create-motoboy/index.ts` | `@motoboy.lanches2r.local` | `{phone}@motoboy.{company.slug}.local` |
| Evolution base URL (settings) | `src/services/settings.js` linha 160 | `https://marinho.replymesh.cloud` | `store_settings.evolution_base_url` |
| Evolution base URL (whatsappService) | `src/services/whatsappService.js` linhas 58, 68 | `https://marinho.replymesh.cloud` | Lido via API Rails `/store/settings` |
| Evolution base URL (edge function) | `supabase/functions/evolution-send-text/index.ts` | `https://marinho.replymesh.cloud` | Passa para service Rails — frontend nunca acessa diretamente |
| Nome "Lanche do 2R" nos templates | `src/utils/whatsappTemplates.js` | `Lanche do 2R` | `{store_name}` — variável dinâmica |
| Nome "Roleta do 2R" | `src/utils/whatsappTemplates.js` | `Roleta do 2R` | `{store_name} - Roleta` |
| `BrandLogo.jsx` | `src/components/shared/BrandLogo.jsx` | Texto "Lanche do 2R" | `store_settings.store_name` via context |
| Texto marketing homepage | `src/pages/public/Home.jsx` | `Hamburguer artesanal do Lanche do 2R` | `store_settings.tagline` |
| Rodapé copyright | `src/components/layout/PublicLayout.jsx` | `© 2024 Lanche do 2R` | `© {year} {store_name}` |
| Nome padrão usuário cozinha | `src/pages/admin/CreateKitchenUser.jsx` linha 32 | `Cozinha 2R` | `Cozinha {store_name}` |
| HTML footer das mesas | `src/pages/admin/Tables.jsx` linha 335 | `Lanche do 2R` | `{store_name}` via context |
| Chaves localStorage | Múltiplos arquivos | `lanches2r:*` | `{company_slug}:*` |
| Cor primária | `tailwind.config.js` / CSS | `#F60670` (rosa) | `store_settings.primary_color` como CSS variable |
| Build stamp Vite | `vite.config.js` | `build-20260530` | Gerado dinamicamente no build |

### Estratégia de parametrização no frontend template

```javascript
// src/contexts/StoreContext.jsx (novo — substitui valores hard-coded)
export const StoreContext = createContext({});

export function StoreProvider({ children }) {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    // Lê da API Rails via company_id inferido do subdomínio
    api.getStoreSettings().then(setSettings);
  }, []);

  return (
    <StoreContext.Provider value={settings}>
      {/* Injeta CSS variables da loja */}
      <style>{`:root { --primary: ${settings?.primary_color || '#F60670'}; }`}</style>
      {children}
    </StoreContext.Provider>
  );
}
```

---

## 9. ORDEM SEGURA DA MIGRAÇÃO

### FASE 10 — Schema Rails Operacional *(próxima a ser aprovada)*

> Criar as migrations e models Rails para as tabelas operacionais do template loja.

**Migrations a criar** (em ordem, respeitando FKs):

1. `create_categories` (company_id, name, slug, sort_order, active)
2. `create_products` (company_id, category_id, name, slug, price_cents, promotional_price_cents, image_url, track_inventory, is_featured, is_combo, is_customizable, active)
3. `create_product_option_groups` (company_id, product_id, name, type, required, min_select, max_select)
4. `create_product_option_items` (company_id, group_id, name, additional_price_cents, is_active)
5. `create_delivery_zones` (company_id, name, slug, city, delivery_fee_cents, estimated_minutes, minimum_order_cents, is_active)
6. `create_customers` (company_id, full_name, phone, whatsapp, total_orders, total_spent_cents, is_recurring)
7. `create_customer_addresses` (company_id, customer_id, street, number, complement, neighborhood, city, state, zip_code, is_default)
8. `create_coupons` (company_id, code, title, discount_type, discount_value, minimum_order_cents, max_uses, used_count, expires_at, is_active)
9. `create_orders` (company_id, order_number, customer_id, order_type, status, payment_method, subtotal_cents, delivery_fee_cents, discount_cents, total_cents, motoboy_id, table_id, notes)
10. `create_order_items` (company_id, order_id, product_id, product_name, unit_price_cents, quantity, total_price_cents, selected_options jsonb, notes)
11. `create_order_status_logs` (company_id, order_id, previous_status, new_status, changed_by_id)
12. `create_order_payment_details` (company_id, order_id, payment_method, amount_cents, needs_change, change_for_cents)
13. `create_order_attempts` (company_id, customer_phone, ip_address, order_signature, status, reason)
14. `create_motoboys` (company_id, user_id, name, phone, active, total_deliveries)
15. `create_delivery_history` (company_id, order_id, motoboy_id, assigned_at, delivered_at, status)
16. `create_dining_tables` (company_id, number, name, seats, status, is_active)
17. `create_table_sessions` (company_id, table_id, order_id, status, payment_method, subtotal_cents, total_cents, opened_at, closed_at)
18. `create_inventory_items` (company_id, name, slug, unit, current_quantity, minimum_quantity, is_active)
19. `create_inventory_movements` (company_id, inventory_item_id, type, quantity, quantity_before, quantity_after, reason, source, reference_id, user_id)
20. Extend `store_settings` (adicionar: evolution_base_url, wasender_base_url, tagline, primary_color já existe, pix_key, order_status_flow...)
21. `create_business_hours` (company_id, day_of_week, is_open, open_time, close_time) — UNIQUE(company_id, day_of_week)
22. `create_business_hour_exceptions` (company_id, exception_date, is_open, open_time, close_time, message)
23. `create_cash_sessions` (company_id, opened_by_id, opening_amount_cents, status, opened_at, closed_at, closing_counted_cents)
24. `create_cash_movements` (company_id, cash_session_id, type, amount_cents, affects_physical_cash, order_id, created_by_id, notes)
25. `create_app_banners` (company_id, title, image_url, link, active, sort_order)
26. `create_marketing_campaigns` (company_id, title, status, daily_limit, started_at)
27. `create_marketing_campaign_recipients` (company_id, campaign_id, phone, message, status, sent_at)

**Models a criar:** `Category`, `Product`, `ProductOptionGroup`, `ProductOptionItem`, `DeliveryZone`, `Customer`, `CustomerAddress`, `Coupon`, `Order`, `OrderItem`, `OrderStatusLog`, `OrderPaymentDetail`, `OrderAttempt`, `Motoboy`, `DeliveryHistory`, `DiningTable`, `TableSession`, `InventoryItem`, `InventoryMovement`, `CashSession`, `CashMovement`, `AppBanner`, `MarketingCampaign`, `MarketingCampaignRecipient`, `BusinessHour`, `BusinessHourException`

**Services a criar:** `OrderStatusService`, `DeliveryService`, `InventoryService`, `CashService`, `PublicOrderService`, `WhatsappDispatcher`, `CheckoutService`

---

### FASE 11 — APIs Rails para a Loja

> Criar os controllers e endpoints que o frontend template vai consumir.

```
Namespace: /api/v1/store/   (autenticado por company via JWT)
Namespace: /api/v1/public/  (público, sem autenticação)
Namespace: /api/v1/motoboy/ (autenticado como motoboy da empresa)

Endpoints necessários:
  GET    /public/{slug}/menu           — cardápio público
  GET    /public/{slug}/settings       — configurações da loja
  POST   /public/{slug}/orders         — criar pedido (anti-abuso)
  GET    /store/orders                 — listar pedidos (admin)
  PATCH  /store/orders/:id/status      — mudar status
  POST   /store/orders/:id/assign      — atribuir motoboy
  GET    /store/products               — listar produtos
  POST   /store/products               — criar produto
  PATCH  /store/products/:id
  GET    /store/categories
  POST   /store/categories
  GET    /store/customers
  GET    /store/inventory
  POST   /store/inventory/:id/entry
  GET    /store/cash_sessions
  POST   /store/cash_sessions          — abrir caixa
  POST   /store/cash_sessions/:id/close
  POST   /store/cash_sessions/:id/movements
  GET    /store/reports
  GET    /motoboy/deliveries
  PATCH  /motoboy/deliveries/:id/complete
  POST   /webhooks/evolution/location  — webhook GPS
```

---

### FASE 12 — Cópia do Frontend 2R como Template

> **NÃO mexer no original** (`M:\temple1`).

```
Criar: W:\sas replymesh\replymesh-store-template\
  (cópia do M:\temple1\src + adaptações)

Mudanças necessárias:
  1. Trocar Supabase client por api.js HTTP → Rails
  2. Criar StoreContext.jsx para dados dinâmicos da loja
  3. Parametrizar todos os 15 pontos hard-coded
  4. Adaptar autenticação: Supabase Auth → JWT da Replymesh
  5. Adaptar Realtime: Supabase Realtime → polling ou WebSocket Rails
  6. Substituir Edge Function calls por chamadas à API Rails
  7. Criar vite.config com VITE_API_URL e VITE_COMPANY_SLUG
```

---

### FASE 13 — Empresa Fake de Teste

```
Usando o Painel Master da Replymesh:
  1. Criar empresa "Loja Teste Replymesh" (slug: loja-teste)
  2. Cadastrar admin: admin@loja-teste.com
  3. Criar instância WhatsApp (modo mock)
  4. Configurar store_settings com dados fictícios
  5. Acessar template frontend com COMPANY_SLUG=loja-teste

Validar:
  ✅ Login admin funciona
  ✅ Site público carrega com dados da empresa fake
  ✅ Produtos podem ser cadastrados
  ✅ Pedido pode ser criado pelo site público
  ✅ Pedido aparece no painel admin
  ✅ Status pode ser alterado (pending → accepted → preparing → ready → completed)
  ✅ Estoque é deduzido ao aceitar pedido
  ✅ Caixa registra venda ao completar pedido
  ✅ Motoboy recebe atribuição
  ✅ WhatsApp envia mensagem (mock ou real)
```

---

### FASE 14 — Migração de Dados Fake para Testes

```
Script de seed para a empresa fake:
  - 5 categorias
  - 20 produtos (com opções)
  - 3 zonas de entrega
  - 5 clientes fictícios
  - 10 pedidos históricos
  - 2 motoboys

Validar relatórios com dados de teste antes de qualquer dado real.
```

---

### FASE 15 — Validação do Fluxo Completo (empresa fake)

Checklist de validação E2E:

```
[ ] Site público carrega para a empresa fake
[ ] Checkout completo (delivery + pickup + dine_in)
[ ] Anti-abuso de pedidos funcionando (rate limit)
[ ] Pedido chega no painel admin
[ ] Painel cozinha recebe pedido em tempo real
[ ] Status flow completo: pending → completed
[ ] Estoque deduzido corretamente
[ ] Estoque restaurado ao cancelar
[ ] Caixa abre, registra venda e fecha
[ ] Motoboy recebe atribuição e confirma entrega
[ ] WhatsApp automático enviado em cada status
[ ] Relatórios mostram dados corretos
[ ] Login/logout por todos os roles (admin, attendant, kitchen, motoboy)
[ ] App banners aparecem no site
[ ] Cupom aplicado corretamente no checkout
```

---

### FASE 16 — Planejar Migração Real do 2R

> **Autorização explícita obrigatória antes de iniciar.**

```
Pré-requisitos:
  ✅ FASE 15 completamente validada
  ✅ Backup completo do 2R realizado
  ✅ Janela de manutenção definida com o cliente
  ✅ Script de importação testado com dados fake
  ✅ Plano de rollback documentado e testado

Ordem de importação de dados:
  1. store_settings → company 2R
  2. business_hours
  3. categories
  4. products + product_option_groups + product_option_items
  5. delivery_zones
  6. customers + customer_addresses
  7. coupons
  8. inventory_items
  9. motoboys (sem senha — serão reativados)
  10. whatsapp_templates
  11. app_banners
  12. orders históricos (somente read — sem reprocessar)
  13. order_items históricos
  14. cash_sessions históricas (somente read)

Campos legacy_id:
  Todos os registros migrados recebem:
    legacy_id:     UUID original do Supabase
    legacy_source: "supabase_2r"
    legacy_table:  nome da tabela original
```

---

## 10. ESTRATÉGIA DE `company_id`

### Regras obrigatórias

1. **Toda tabela operacional** recebe `company_id bigint NOT NULL REFERENCES companies(id)`
2. **Índice obrigatório** em `company_id` de todas as tabelas
3. **Todos os scopes ActiveRecord** filtram `company_id` por padrão
4. **Nenhum endpoint da loja** retorna dados sem filtrar `company_id`

### Mudanças de constraints específicas

| Tabela | Constraint atual | Constraint futura |
|---|---|---|
| `store_settings` | 1 linha apenas (singleton) | 1 linha por `company_id` (UNIQUE) |
| `business_hours` | UNIQUE(day_of_week) | UNIQUE(company_id, day_of_week) |
| `cash_sessions` | 1 sessão aberta global | 1 sessão aberta por `company_id` |
| `dining_tables` | slug UNIQUE global | slug UNIQUE por `company_id` |
| `delivery_zones` | slug UNIQUE global | slug UNIQUE por `company_id` |
| `products` | slug UNIQUE global | slug UNIQUE por `company_id` |
| `categories` | slug UNIQUE global | slug UNIQUE por `company_id` |

### Padrão de scope no Rails

```ruby
# app/models/application_record.rb
class ApplicationRecord < ActiveRecord::Base
  # Usado em todos os models operacionais
  def self.for_company(company_id)
    where(company_id: company_id)
  end
end

# Exemplo de uso no controller
class Store::OrdersController < ApplicationController
  def index
    @orders = Order.for_company(current_company.id).recent
  end
end
```

---

## 11. ESTRATÉGIA DE `legacy_id`

O sistema 2R usa UUIDs como chaves primárias. A Replymesh usa `bigint` serial. Para preservar o histórico durante a migração:

### Campos a adicionar nas migrations Rails

```ruby
# Adicionado em todas as tabelas que receberão dados migrados do 2R
t.string  :legacy_id,     index: true   # UUID original do Supabase
t.string  :legacy_source              # ex: "supabase_2r"
t.string  :legacy_table               # ex: "orders"
```

### Exemplo de script de importação

```ruby
# script de migração (não executar agora — apenas planejamento)
supabase_orders.each do |row|
  Order.create!(
    company_id:    company_2r.id,
    legacy_id:     row["id"],        # UUID preservado
    legacy_source: "supabase_2r",
    legacy_table:  "orders",
    order_number:  row["order_number"],
    status:        row["status"],
    total_cents:   (row["total"].to_f * 100).round,
    # ...demais campos
  )
end
```

### Benefícios

- IDs originais localizáveis para auditoria e debugging
- Clientes que salvaram link `#/pedido/uuid-antigo` ainda podem ser rastreados
- Dados históricos intactos e identificáveis

---

## 12. ESTRATÉGIA DE BACKUP E ROLLBACK

### Checklist de backup pré-migração (fazer antes da FASE 16)

```
[ ] BACKUP DO PROJETO 2R
    [ ] Cópia completa de M:\temple1 para local seguro
    [ ] Verificar que o zip inclui node_modules OU package-lock.json
    [ ] Salvar branch atual do git (ou criar tag)
    [ ] Confirmar que o 2R ainda roda localmente após a cópia

[ ] BACKUP DO BANCO SUPABASE
    [ ] Executar pg_dump completo do banco Supabase (schema + dados)
    [ ] Fazer export via painel Supabase (Settings > Database > Backups)
    [ ] Exportar supabase-schema.sql atualizado
    [ ] Salvar supabase-backup-data.sql (todos os dados)
    [ ] Exportar tabela por tabela para CSV como redundância

[ ] BACKUP DO STORAGE SUPABASE
    [ ] Baixar bucket de imagens de produtos
    [ ] Baixar bucket de banners
    [ ] Baixar logo e capa da loja
    [ ] Confirmar URLs atuais antes de mover

[ ] BACKUP DAS EDGE FUNCTIONS
    [ ] Cópia dos 8 arquivos TypeScript em local seguro
    [ ] Documentar variáveis de ambiente usadas em produção (sem valores)

[ ] VALIDAÇÃO DO AMBIENTE DE TESTE
    [ ] Empresa fake criada e totalmente funcional (FASE 15 completa)
    [ ] Script de importação testado com dados fake
    [ ] Rollback testado (importar, deletar, importar novamente)

[ ] PLANO DE CUTOVER
    [ ] Janela de manutenção agendada (sugestão: madrugada ou domingo)
    [ ] Comunicação ao usuário do 2R sobre janela
    [ ] 2R antigo permanece disponível durante cutover (zero downtime ideal)
    [ ] Critério de sucesso definido antes de desligar o 2R antigo
    [ ] Número de emergência para rollback imediato
```

### Plano de rollback por fase

| Fase | O que fazer se falhar |
|---|---|
| FASE 10 — Migrations Rails | `rails db:rollback STEP=N` — nenhum dado real afetado |
| FASE 11 — APIs Rails | Remover rotas e controllers — nenhum dado afetado |
| FASE 12 — Frontend template | Pasta separada — original intocado |
| FASE 13/14/15 — Empresa fake | Deletar empresa fake — banco limpo |
| FASE 16 — Migração real | Rollback = apontar 2R de volta ao Supabase original |

---

## 13. RISCOS

### 🔴 Risco Alto

| Risco | Descrição | Mitigação |
|---|---|---|
| **25 RPCs com lógica de negócio complexa** | `open_cash_session`, `close_table_session`, `apply_order_inventory_deduction` têm lógica transacional crítica. Reimplementação incorreta pode causar inconsistência financeira. | Recriar cada RPC como `ActiveRecord::Base.transaction` no Rails. Testar individualmente com empresa fake antes do 2R real. |
| **Deduplicação de inventário no status `accepted`** | Se `applyOrderInventoryDeduction` for chamado mais de uma vez, o estoque será deduzido em duplicata. | Flag `inventory_deducted` já existe no schema 2R. Replicar no Rails: `order.update!(inventory_deducted: true)` + verificação antes de deduzir. |
| **Caixa com 1 sessão aberta por empresa** | Constraint de caixa aberto precisa ser por `company_id`, não global. Se errado, empresas distintas bloqueiam o caixa uma da outra. | Constraint SQL: `WHERE status = 'open' AND company_id = ?` + lock otimista. |
| **Dados históricos de pedidos sem `company_id`** | Se importados sem filtro correto, pedidos de uma empresa aparecem em outra. | Importar em script isolado com `company_id` hard-coded para o 2R. Validar contagem antes e depois. |
| **Apps Flutter em produção** | Mudar backend de Supabase para Rails quebra os apps Flutter em produção sem aviso. | Manter Supabase e Rails em paralelo até apps serem atualizados. Versionamento de API obrigatório. |

### 🟡 Risco Médio

| Risco | Descrição | Mitigação |
|---|---|---|
| **Realtime (cozinha + motoboy)** | Supabase Realtime (WebSocket) não existe nativamente no Rails. A cozinha depende de atualização em tempo real. | Usar polling curto (3-5s) com `setInterval` como solução temporária. Depois, implementar Action Cable (WebSocket Rails) ou SSE. |
| **Autenticação Supabase → JWT Rails** | Clientes com sessão Supabase ativa no app terão a sessão invalidada ao trocar backend. | Forçar re-login no cutover. Comunicar ao usuário previamente. |
| **`store_settings` singleton → multi-row** | Código que faz `SELECT * FROM store_settings LIMIT 1` sem filtrar `company_id` vai buscar configuração errada. | Auditar todos os `services/settings.js` e substituir por `store_settings WHERE company_id = ?`. |
| **Uploads de imagens** | O 2R usa Supabase Storage. Rails precisará de storage alternativo (Active Storage + S3, ou servir do Supabase temporariamente). | Manter imagens no Supabase Storage por URL direta no primeiro momento. Migrar para Rails Active Storage na Fase seguinte. |
| **Evolution GO com API key por empresa** | Hoje há uma API key global. Multi-tenant requer API key ou instância por empresa. | `store_settings.evolution_api_key` e `evolution_instance` por `company_id`. Já previsto no schema. |

### 🟢 Risco Baixo

| Risco | Descrição | Mitigação |
|---|---|---|
| **IDs UUID → bigint** | Mudança de tipo de PK. | `legacy_id uuid` preserva referência original. |
| **70 migrations do 2R** | Não precisamos aplicar — estamos recriando o schema no Rails com migrations próprias. | Usar as migrations do 2R como referência/documentação, não para execução. |
| **Clientes com endereços** | `customer_addresses` tem FK para `customers`. | Importar customers primeiro, depois addresses. Script já planeja esta ordem. |
| **Templates WhatsApp** | Já existe `whatsapp_templates` na Replymesh. | Apenas adicionar campos que faltam (`name`, `type`, etc.) via migration. |
| **Cupons com regras complexas** | `free_shipping`, `free_item` (roleta) são tipos especiais. | Implementar no model `Coupon` com scopo. `free_item` pode ser deixado para fase posterior. |

---

## 14. CHECKLIST ANTES DE INICIAR A FASE 10

```
[ ] Plano aprovado pelo responsável do projeto
[ ] Confirmar que M:\temple1 tem backup atualizado antes de qualquer trabalho
[ ] Confirmar que o 2R está funcionando em produção ANTES de iniciar
[ ] Criar branch git separada para o trabalho das Fases 10+
[ ] Confirmar onde ficará o "replymesh-store-template" (nova pasta no projeto)
[ ] Confirmar estratégia de storage para imagens de produtos
      [ ] Opção A: Manter URLs do Supabase Storage por ora
      [ ] Opção B: Active Storage Rails + S3/local
[ ] Confirmar estratégia de Realtime na cozinha
      [ ] Opção A: Polling a cada 3s (mais simples)
      [ ] Opção B: Action Cable WebSocket (mais robusto)
[ ] Confirmar número do company_id do Lanches do 2R na Replymesh
      (será criado como empresa no onboarding — anotar o ID)
[ ] Confirmar Ruby PATH (W:\replymesh-ruby\bin) está disponível
[ ] Confirmar servidor Rails rodando em localhost:3000
[ ] Confirmar banco replymesh_development acessível
[ ] Confirmar espaço em disco para 27 novas migrations
[ ] Definir quem executará os scripts de importação de dados
[ ] Definir janela de tempo estimada para cada fase
[ ] Confirmar que apps Flutter (aplicativopedido + motoboyapp) não serão tocados até FASE 15+
```

---

## 15. CONCLUSÃO

Este documento define o **plano técnico completo** para transformar o sistema Lanches do 2R em um template SaaS reutilizável da Replymesh.

### O que esta fase fez

- Auditou os 30 tabelas, 70 migrations, 25 RPCs, 8 Edge Functions e 15 pontos fixos do projeto `M:\temple1`
- Mapeou cada tabela Supabase para seu equivalente Rails futuro
- Mapeou cada RPC para seu equivalente em service Rails
- Mapeou cada Edge Function para seu equivalente em controller/job Rails
- Definiu a ordem segura de 7 fases de migração (FASE 10 a 16)
- Identificou todos os riscos com seus níveis e mitigações
- Criou checklist de backup e rollback

### O que esta fase NÃO fez

- ✅ Nenhum arquivo do projeto `M:\temple1` foi alterado
- ✅ Nenhuma migration foi executada
- ✅ Nenhum dado do Supabase foi copiado ou modificado
- ✅ Nenhum deploy foi realizado
- ✅ O sistema 2R em produção permanece intocado e funcional

### Próxima fase recomendada

**FASE 10 — Schema Rails Operacional**

Criar as 27 migrations e models Rails para as tabelas operacionais do template loja, com `company_id` em todas, `legacy_id` para preservar histórico, e os services críticos (`OrderStatusService`, `CashService`, `InventoryService`, `DeliveryService`).

**Não iniciar sem confirmação explícita.**
