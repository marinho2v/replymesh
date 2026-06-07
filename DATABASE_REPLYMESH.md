# DATABASE — Replymesh SaaS

> Schema completo do banco PostgreSQL.
> Versão: Fase 1 (Painel Master)

---

## Convenções

- Todos os `id` são `bigint` gerado automaticamente (Rails default)
- Todos os timestamps usam `timestamptz` (`created_at`, `updated_at`)
- Valores monetários em **centavos** (`integer`) — ex: R$ 300,00 = `30000`
- Campos JSON usam `jsonb` para indexação e consulta eficiente
- Foreign keys explícitas com `NOT NULL` onde obrigatório
- Índices em todos os `company_id`, `email`, `slug`, `domain`, `status`

---

## ERD Textual (Relacionamentos)

```
users ────────────────────── company_members ──── companies
  │                                                    │
  │                                                    ├── subscriptions ── plans
  │                                                    ├── domains
  │                                                    ├── store_settings
  │                                                    ├── payment_methods
  │                                                    ├── whatsapp_instances ── whatsapp_logs
  │                                                    ├── whatsapp_templates
  │                                                    ├── activity_logs ◄── users
  │                                                    └── system_alerts
  └── activity_logs
```

---

## Tabelas

---

### users

Usuários do sistema (Admin Master + admins das lojas + funcionários).

```sql
CREATE TABLE users (
  id                bigserial PRIMARY KEY,
  name              text NOT NULL,
  email             text NOT NULL UNIQUE,
  password_digest   text NOT NULL,
  phone             text,
  global_role       text NOT NULL DEFAULT 'user',
  status            text NOT NULL DEFAULT 'active',
  last_sign_in_at   timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email  ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

**global_role:** `super_admin` | `user`  
**status:** `active` | `inactive` | `suspended`

---

### companies

Empresas clientes cadastradas na Replymesh.

```sql
CREATE TABLE companies (
  id                  bigserial PRIMARY KEY,
  name                text NOT NULL,
  slug                text NOT NULL UNIQUE,
  legal_name          text,
  document_number     text,
  responsible_name    text NOT NULL,
  responsible_phone   text,
  responsible_email   text NOT NULL,
  status              text NOT NULL DEFAULT 'trial',
  plan_status         text NOT NULL DEFAULT 'trial',
  trial_ends_at       timestamptz,
  timezone            text NOT NULL DEFAULT 'America/Sao_Paulo',
  default_locale      text NOT NULL DEFAULT 'pt-BR',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_companies_slug  ON companies(slug);
CREATE        INDEX idx_companies_status ON companies(status);
```

**status:** `active` | `inactive` | `trial` | `suspended` | `canceled`  
**plan_status:** `trial` | `active` | `overdue` | `canceled` | `suspended`

---

### company_members

Vínculo entre usuários e empresas. Um usuário pode ser membro de múltiplas empresas.

```sql
CREATE TABLE company_members (
  id          bigserial PRIMARY KEY,
  company_id  bigint NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id     bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'employee',
  status      text NOT NULL DEFAULT 'active',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);

CREATE INDEX idx_company_members_company ON company_members(company_id);
CREATE INDEX idx_company_members_user    ON company_members(user_id);
```

**role:** `store_admin` | `employee` | `kitchen` | `motoboy` | `support_viewer`  
**status:** `active` | `inactive`

---

### plans

Planos de assinatura disponíveis.

```sql
CREATE TABLE plans (
  id             bigserial PRIMARY KEY,
  name           text NOT NULL,
  slug           text NOT NULL UNIQUE,
  price_cents    integer NOT NULL DEFAULT 0,
  billing_cycle  text NOT NULL DEFAULT 'monthly',
  description    text,
  features_json  jsonb NOT NULL DEFAULT '[]',
  status         text NOT NULL DEFAULT 'active',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_plans_slug ON plans(slug);
```

**billing_cycle:** `monthly` | `yearly`  
**status:** `active` | `inactive`

**Seeds iniciais:**
```
Essencial    | essencial    | 30000  (R$ 300/mês)
Profissional | profissional | 50000  (R$ 500/mês)
Premium IA   | premium_ia   | 0      (sob consulta)
```

---

### subscriptions

Assinaturas de empresas em planos.

```sql
CREATE TABLE subscriptions (
  id                    bigserial PRIMARY KEY,
  company_id            bigint NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_id               bigint NOT NULL REFERENCES plans(id),
  status                text NOT NULL DEFAULT 'trial',
  price_cents           integer NOT NULL DEFAULT 0,
  started_at            timestamptz NOT NULL DEFAULT now(),
  trial_ends_at         timestamptz,
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  canceled_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_company ON subscriptions(company_id);
CREATE INDEX idx_subscriptions_status  ON subscriptions(status);
```

**status:** `trial` | `active` | `overdue` | `canceled` | `suspended`

---

### domains

Domínios e subdomínios das empresas.

```sql
CREATE TABLE domains (
  id              bigserial PRIMARY KEY,
  company_id      bigint NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  domain          text NOT NULL UNIQUE,
  domain_type     text NOT NULL DEFAULT 'subdomain',
  status          text NOT NULL DEFAULT 'pending',
  ssl_status      text NOT NULL DEFAULT 'pending',
  is_primary      boolean NOT NULL DEFAULT true,
  last_checked_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_domains_company ON domains(company_id);
CREATE UNIQUE INDEX idx_domains_domain ON domains(domain);
```

**domain_type:** `subdomain` | `custom_domain`  
**status:** `pending` | `active` | `dns_error` | `inactive`  
**ssl_status:** `pending` | `active` | `error`

*Exemplo de subdomínio criado automaticamente:* `pizzariadojoao.replymesh.cloud`

---

### store_settings

Configurações gerais da loja (1 por empresa, relação 1:1 com companies).

```sql
CREATE TABLE store_settings (
  id                          bigserial PRIMARY KEY,
  company_id                  bigint NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  store_name                  text,
  logo_url                    text,
  cover_url                   text,
  primary_color               text DEFAULT '#16a34a',
  secondary_color             text DEFAULT '#0b0b0d',
  accent_color                text DEFAULT '#2563eb',
  whatsapp_number             text,
  phone                       text,
  email                       text,
  address                     text,
  city                        text,
  state                       text,
  zip_code                    text,
  delivery_enabled            boolean NOT NULL DEFAULT true,
  pickup_enabled              boolean NOT NULL DEFAULT true,
  dine_in_enabled             boolean NOT NULL DEFAULT false,
  min_order_value_cents       integer NOT NULL DEFAULT 0,
  default_delivery_fee_cents  integer NOT NULL DEFAULT 0,
  estimated_delivery_minutes  integer NOT NULL DEFAULT 40,
  store_status                text NOT NULL DEFAULT 'open',
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_store_settings_company ON store_settings(company_id);
```

**store_status:** `open` | `closed` | `paused`

---

### payment_methods

Formas de pagamento disponíveis em cada empresa.

```sql
CREATE TABLE payment_methods (
  id              bigserial PRIMARY KEY,
  company_id      bigint NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            text NOT NULL,
  method_type     text NOT NULL,
  enabled         boolean NOT NULL DEFAULT true,
  requires_change boolean NOT NULL DEFAULT false,
  pix_key         text,
  instructions    text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_methods_company ON payment_methods(company_id);
```

**method_type:** `cash` | `pix` | `credit_card` | `debit_card` | `online_payment`

**Padrão criado no onboarding:**
```
Dinheiro     | cash        | requires_change: true
Pix          | pix         | enabled: true
Cartão Débito | debit_card | enabled: true
Cartão Crédito| credit_card| enabled: true
```

---

### whatsapp_instances

Instâncias WhatsApp de cada empresa via Evolution Go.

```sql
CREATE TABLE whatsapp_instances (
  id                    bigserial PRIMARY KEY,
  company_id            bigint NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  provider              text NOT NULL DEFAULT 'evolution_go',
  instance_name         text NOT NULL,
  status                text NOT NULL DEFAULT 'not_created',
  base_url              text,
  connected_number      text,
  qr_code               text,
  last_connected_at     timestamptz,
  last_disconnected_at  timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, instance_name)
);

CREATE INDEX idx_whatsapp_instances_company ON whatsapp_instances(company_id);
CREATE INDEX idx_whatsapp_instances_status  ON whatsapp_instances(status);
```

**provider:** `evolution_go`  
**status:** `not_created` | `created` | `connecting` | `connected` | `disconnected` | `error`

---

### whatsapp_templates

Templates de mensagem WhatsApp por empresa.

```sql
CREATE TABLE whatsapp_templates (
  id            bigserial PRIMARY KEY,
  company_id    bigint NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  template_key  text NOT NULL,
  title         text NOT NULL,
  message       text NOT NULL,
  enabled       boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, template_key)
);

CREATE INDEX idx_whatsapp_templates_company ON whatsapp_templates(company_id);
```

**Templates padrão (copiados no onboarding):**

| template_key        | Título               | Mensagem padrão                                   |
|---------------------|----------------------|---------------------------------------------------|
| pedido_recebido     | Pedido Recebido      | Olá {{1}}! Recebemos seu pedido #{{2}}...         |
| pedido_aceito       | Pedido Aceito        | Seu pedido #{{1}} foi aceito! Tempo estimado...   |
| pedido_cancelado    | Pedido Cancelado     | Infelizmente seu pedido #{{1}} foi cancelado...   |
| saiu_para_entrega   | Saiu para Entrega    | Seu pedido #{{1}} saiu para entrega!...           |
| pedido_finalizado   | Pedido Finalizado    | Pedido #{{1}} entregue! Obrigado pela preferência |
| marketing           | Marketing            | {{1}}, temos uma oferta especial para você!       |

---

### whatsapp_logs

Logs de eventos das instâncias WhatsApp.

```sql
CREATE TABLE whatsapp_logs (
  id                    bigserial PRIMARY KEY,
  company_id            bigint NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  whatsapp_instance_id  bigint REFERENCES whatsapp_instances(id) ON DELETE SET NULL,
  level                 text NOT NULL DEFAULT 'info',
  message               text NOT NULL,
  metadata_json         jsonb DEFAULT '{}',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_whatsapp_logs_company  ON whatsapp_logs(company_id);
CREATE INDEX idx_whatsapp_logs_instance ON whatsapp_logs(whatsapp_instance_id);
CREATE INDEX idx_whatsapp_logs_level    ON whatsapp_logs(level);
```

**level:** `ok` | `info` | `warn` | `err`

---

### activity_logs

Registro de ações realizadas no sistema (auditoria).

```sql
CREATE TABLE activity_logs (
  id              bigserial PRIMARY KEY,
  company_id      bigint REFERENCES companies(id) ON DELETE CASCADE,
  user_id         bigint REFERENCES users(id) ON DELETE SET NULL,
  action          text NOT NULL,
  resource_type   text,
  resource_id     bigint,
  metadata_json   jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_logs_company   ON activity_logs(company_id);
CREATE INDEX idx_activity_logs_user      ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action    ON activity_logs(action);
CREATE INDEX idx_activity_logs_resource  ON activity_logs(resource_type, resource_id);
```

**Exemplos de action:** `company_created` | `company_activated` | `plan_changed` | `whatsapp_connected` | `login`

---

### system_alerts

Alertas e incidentes do sistema.

```sql
CREATE TABLE system_alerts (
  id           bigserial PRIMARY KEY,
  company_id   bigint REFERENCES companies(id) ON DELETE CASCADE,
  level        text NOT NULL DEFAULT 'warning',
  title        text NOT NULL,
  message      text NOT NULL,
  resolved_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_system_alerts_company ON system_alerts(company_id);
CREATE INDEX idx_system_alerts_level   ON system_alerts(level);
```

**level:** `info` | `warning` | `error` | `critical`

---

## Índices Consolidados

| Tabela               | Coluna(s)              | Tipo        |
|----------------------|------------------------|-------------|
| users                | email                  | UNIQUE      |
| users                | status                 | INDEX       |
| companies            | slug                   | UNIQUE      |
| companies            | status                 | INDEX       |
| company_members      | company_id             | INDEX       |
| company_members      | user_id                | INDEX       |
| company_members      | (company_id, user_id)  | UNIQUE      |
| plans                | slug                   | UNIQUE      |
| subscriptions        | company_id             | INDEX       |
| subscriptions        | status                 | INDEX       |
| domains              | domain                 | UNIQUE      |
| domains              | company_id             | INDEX       |
| store_settings       | company_id             | UNIQUE      |
| payment_methods      | company_id             | INDEX       |
| whatsapp_instances   | company_id             | INDEX       |
| whatsapp_instances   | status                 | INDEX       |
| whatsapp_instances   | (company_id, inst_name)| UNIQUE      |
| whatsapp_templates   | company_id             | INDEX       |
| whatsapp_templates   | (company_id, tmpl_key) | UNIQUE      |
| whatsapp_logs        | company_id             | INDEX       |
| whatsapp_logs        | whatsapp_instance_id   | INDEX       |
| activity_logs        | company_id             | INDEX       |
| activity_logs        | user_id                | INDEX       |
| system_alerts        | company_id             | INDEX       |

---

## Seeds (db/seeds.rb)

```ruby
# Planos
Plan.create!([
  { name: 'Essencial',    slug: 'essencial',    price_cents: 30000, billing_cycle: 'monthly' },
  { name: 'Profissional', slug: 'profissional', price_cents: 50000, billing_cycle: 'monthly' },
  { name: 'Premium IA',   slug: 'premium_ia',   price_cents: 0,     billing_cycle: 'monthly' },
])

# Usuário Admin Master
master = User.create!(
  name: 'Admin Master',
  email: ENV['REPLYMESH_MASTER_EMAIL'],
  password: ENV['REPLYMESH_MASTER_PASSWORD'],
  global_role: 'super_admin',
  status: 'active'
)
```

---

## Tabelas Futuras (Fase 9+)

Não implementar sem aprovação explícita:

```
categories          — company_id, name, slug, sort_order, active
products            — company_id, category_id, name, price_cents, active
customers           — company_id, name, phone, email
customer_addresses  — company_id, customer_id, address, city, zip
orders              — company_id, customer_id, status, total_cents
order_items         — company_id, order_id, product_id, qty, price_cents
motoboys            — company_id, user_id, status
delivery_history    — company_id, order_id, motoboy_id, events_json
inventory_items     — company_id, product_id, qty
inventory_movements — company_id, inventory_item_id, qty, type
cash_sessions       — company_id, opened_by, opened_at, closed_at
cash_movements      — company_id, cash_session_id, amount_cents, type
coupons             — company_id, code, discount_type, discount_value
dining_tables       — company_id, number, seats, status
app_banners         — company_id, image_url, link, active, sort_order
```
