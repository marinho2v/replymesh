# Replymesh API

Backend Rails API do SaaS Replymesh.

## Requisitos locais

- Ruby 4.0.5
- Rails 8.1.3
- PostgreSQL 17
- Redis 5

No Windows, use o projeto pelo drive sem espaco:

```powershell
subst M: "W:\sas replymesh"
cd M:\replymesh-api
```

Nesta maquina, as gems nativas foram instaladas com uma copia do runtime em `W:\replymesh-ruby`, porque o GCC do MSYS falhava ao resolver o caminho com espaco.

## Configuracao

Copie `.env.example` para `.env` e ajuste os dados do PostgreSQL local:

```env
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=sua_senha_local
DATABASE_NAME=replymesh_development
JWT_SECRET=uma_string_local_segura
EVOLUTION_GO_MOCK_MODE=true
```

Para conectar a Evolution Go real em ambiente local:

```env
EVOLUTION_GO_BASE_URL=https://marinho.replymesh.cloud
EVOLUTION_GO_API_KEY=your_api_key_here
EVOLUTION_GO_MOCK_MODE=false
```

A chave real da Evolution deve ficar somente no `.env` local do backend.

Credencial master local criada pelo seed:

```text
email: admin@replymesh.com.br
senha: admin123456
```

## Comandos

```powershell
$env:PATH = "W:\replymesh-ruby\bin;W:\replymesh-ruby\msys64\ucrt64\bin;W:\replymesh-ruby\msys64\usr\bin;$env:PATH"
bundle install
rails db:create db:migrate db:seed
rails server
```

## Endpoints iniciais

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/master/companies`
- `POST /api/v1/master/companies`
- `GET /api/v1/master/companies/:id`
- `PUT /api/v1/master/companies/:id`
- `PATCH /api/v1/master/companies/:id`
- `PATCH /api/v1/master/companies/:id/activate`
- `PATCH /api/v1/master/companies/:id/deactivate`
- `GET /api/v1/master/plans`
- `POST /api/v1/master/plans`
- `GET /api/v1/master/plans/:id`
- `PATCH /api/v1/master/plans/:id`
- `GET /api/v1/master/subscriptions`
- `GET /api/v1/master/subscriptions/:id`
- `PATCH /api/v1/master/subscriptions/:id`
- `GET /api/v1/master/domains`
- `POST /api/v1/master/domains`
- `GET /api/v1/master/domains/:id`
- `PATCH /api/v1/master/domains/:id`
- `DELETE /api/v1/master/domains/:id`
- `GET /api/v1/master/domains/:id/verify`
- `PATCH /api/v1/master/domains/:id/set_primary`
- `GET /api/v1/master/whatsapp/settings/test_connection`
- `POST /api/v1/master/whatsapp/instances/sync`
- `POST /api/v1/master/whatsapp/instances/create_test`
- `GET /api/v1/master/whatsapp/instances`
- `POST /api/v1/master/whatsapp/instances`
- `GET /api/v1/master/whatsapp/instances/:id/status`
- `GET /api/v1/master/whatsapp/instances/:id/qrcode`
- `POST /api/v1/master/whatsapp/instances/:id/disconnect`
- `POST /api/v1/master/whatsapp/instances/:id/restart`
- `DELETE /api/v1/master/whatsapp/instances/:id`
- `GET /api/v1/master/whatsapp/templates`
- `POST /api/v1/master/whatsapp/templates`
- `PATCH /api/v1/master/whatsapp/templates/:id`
- `GET /api/v1/master/whatsapp/logs`
- `GET /api/v1/company/settings`
- `PUT /api/v1/company/settings`
- `GET /api/v1/master/activity_logs`
- `GET /api/v1/master/system_alerts`
- `GET /api/v1/master/system_alerts/:id`
- `PATCH /api/v1/master/system_alerts/:id/resolve`

## Logs, Alertas e Auditoria

## APIs da Loja - Fase 11

Rotas autenticadas em `/api/v1/store` usam JWT e sempre filtram por `current_company`.
Para `super_admin`, informe `company_id` ou o header `X-Company-Id`.

Cardapio:

- `GET/POST /api/v1/store/categories`
- `GET/PATCH/DELETE /api/v1/store/categories/:id`
- `GET/POST /api/v1/store/products`
- `GET/PATCH/DELETE /api/v1/store/products/:id`
- `GET/POST /api/v1/store/products/:product_id/option_groups`
- `GET/PATCH/DELETE /api/v1/store/products/:product_id/option_groups/:id`
- `GET/POST /api/v1/store/products/:product_id/option_groups/:option_group_id/items`
- `GET/PATCH/DELETE /api/v1/store/products/:product_id/option_groups/:option_group_id/items/:id`

Operacao:

- `GET/POST /api/v1/store/customers`
- `GET/PATCH /api/v1/store/customers/:id`
- `GET/POST /api/v1/store/customers/:customer_id/addresses`
- `GET/POST /api/v1/store/orders`
- `PATCH /api/v1/store/orders/:id/status`
- `POST /api/v1/store/orders/:id/assign_motoboy`
- `PATCH /api/v1/store/orders/:id/delivery_status`
- `POST /api/v1/store/orders/:id/complete_delivery`
- `POST /api/v1/store/orders/:id/record_payment`
- `GET/POST /api/v1/store/inventory_items`
- `POST /api/v1/store/inventory_items/:id/entry`
- `POST /api/v1/store/inventory_items/:id/adjust`
- `GET /api/v1/store/inventory_movements`
- `GET/POST /api/v1/store/cash_sessions`
- `POST /api/v1/store/cash_sessions/:id/close`
- `GET/POST /api/v1/store/cash_movements`
- `GET/POST /api/v1/store/motoboys`
- `GET /api/v1/store/deliveries`
- `POST /api/v1/store/deliveries/assign`
- `PATCH /api/v1/store/deliveries/:id/status`
- `POST /api/v1/store/deliveries/:id/complete`

Configuracao:

- `GET/PATCH /api/v1/store/dining_tables/:id`
- `GET/POST /api/v1/store/table_sessions`
- `GET/PATCH /api/v1/store/business_hours/:id`
- `POST /api/v1/store/business_hours/bulk_create`
- `GET/POST /api/v1/store/business_hour_exceptions`
- `GET/POST /api/v1/store/app_banners`
- `GET/POST /api/v1/store/coupons`

Rotas publicas por slug:

- `GET /api/v1/public/:company_slug/store`
- `GET /api/v1/public/:company_slug/menu`
- `GET /api/v1/public/:company_slug/banners`
- `GET /api/v1/public/:company_slug/business_hours`
- `GET /api/v1/public/:company_slug/delivery_zones`
- `POST /api/v1/public/:company_slug/orders`

Services integrados:

- `CheckoutService` para checkout publico e pedido autenticado.
- `OrderStatusService` para transicoes validas.
- `InventoryService` para deducao/restauracao de estoque.
- `CashService` para registrar pagamentos no caixa aberto.
- `DeliveryService` para atribuicao e conclusao de entregas.

Os endpoints master de auditoria exigem usuario `super_admin`.

- `GET /api/v1/master/activity_logs` aceita filtros `company_id`, `log_action`, `resource_type`, `type`, `date_from`, `date_to` e `limit`.
- `GET /api/v1/master/system_alerts` aceita filtros `company_id`, `level`, `status`, `date_from`, `date_to` e `limit`.
- `PATCH /api/v1/master/system_alerts/:id/resolve` marca o alerta como resolvido e registra `system_alert_resolved`.

Metadados de auditoria passam por mascara para senhas, tokens, API keys e headers de autorizacao.

## Evolution Go

A imagem atual da VPS (`evoapicloud/evolution-go:latest`) lista instancias por `GET /instance/all`.

O `EvolutionGoClient` testa os headers aceitos sem expor a chave. O header validado no ambiente atual foi `apikey`.

- `apikey`
- `x-api-key`
- `Authorization: Bearer`

Campos locais adicionados para suporte real da Evolution:

- `whatsapp_instances.instance_uuid`
- `whatsapp_instances.instance_token`
- `whatsapp_instances.remote_status`
- `whatsapp_instances.remote_data`
- `whatsapp_instances.last_remote_sync_at`

Instancias remotas sem empresa local clara sao espelhadas em `whatsapp_remote_instances` e nao sao vinculadas automaticamente.

A instancia de teste controlada da Fase 6 usa o nome `replymesh_teste_local`. O backend gera e armazena o token da instancia em `whatsapp_instances.instance_token`, mas esse valor nunca e retornado ao frontend.

O QR Code real e permitido somente para instancias de teste seguras, como `replymesh_teste_local`, usando `GET /instance/qr` com o token da propria instancia no backend. O retorno e normalizado para `{ type, value }`.

Dominio principal da Replymesh: `replymesh.cloud`.

Arquitetura futura sugerida:

- `app.replymesh.cloud` para o Painel Master.
- `api.replymesh.cloud` para a API Rails.
- `{slug}.replymesh.cloud` para lojas/clientes.
