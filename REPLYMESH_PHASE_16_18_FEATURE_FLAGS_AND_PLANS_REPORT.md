# REPLYMESH FASE 16.18 - Planos, Recursos Opcionais e Feature Flags Multiempresa

Data: 2026-06-09

## Status

FASE 16.18 concluida no ambiente local.

Nao foi feito deploy.
Nao foi alterada VPS.
Nao foi alterada Evolution Go.
Nao foi alterado Mercado Pago.
Nao foram executados seeds, reset, drop ou importacoes.

## Estrutura Criada

Foi criada uma estrutura centralizada para controle de recursos:

- `FeatureCatalog`: catalogo oficial START/PRO e aliases de compatibilidade.
- `FeatureGate`: servico unico para validar acesso por empresa/recurso.
- `PlanFeature`: recursos configuraveis por plano.
- `CompanyFeatureOverride`: liberacao/bloqueio manual por empresa.
- `Store::FeaturesController`: endpoint para o frontend da loja consultar recursos liberados/bloqueados.

As verificacoes novas passam pelo `FeatureGate.enabled?(company, feature)` ou `FeatureGate.check(company, feature)`.

## Migrations

Criadas migrations seguras:

- `20260609203000_create_feature_gates.rb`
  - cria `plan_features`
  - cria `company_feature_overrides`
- `20260609204500_add_expires_at_to_company_feature_overrides.rb`
  - adiciona `expires_at`
  - permite teste gratuito/temporario de recurso

As migrations foram aplicadas apenas no banco local de desenvolvimento e teste.

## Recursos Cadastrados

Plano START:

- `dashboard`
- `orders`
- `products`
- `categories`
- `customers`
- `delivery_zones`
- `motoboys`
- `motoboy_panel`
- `cashier`
- `basic_reports`
- `users`
- `whatsapp_basic`
- `support`
- `updates`

Plano PRO:

- `store_ai`
- `whatsapp_templates`
- `marketing_whatsapp`
- `sales_recovery`
- `coupons`
- `roulette`
- `inventory`
- `inventory_movements`
- `motoboy_app`
- `tables`
- `table_qr`
- `table_menu`
- `table_orders`
- `waiter_app`
- `waiter_accounts`
- `waiter_history`
- `waiter_commands`
- `advanced_reports`
- `priority_support`

Compatibilidade mantida com chaves antigas como `ia_loja`, `cupons`, `roleta`, `estoque`, `templates_whatsapp` e `recuperador_vendas`.

## Painel Master

Tela da empresa atualizada em:

- `replymesh-frontend/src/pages/empresas/EmpresaDetalhe.jsx`

Agora exibe:

- Plano atual
- Status do plano
- Recursos herdados do plano
- Recursos extras liberados
- Recursos bloqueados
- Lista completa de recursos
- Modo por recurso:
  - Herdar plano
  - Liberar manualmente
  - Bloquear manualmente
- Data opcional de expiracao por recurso

## APIs Protegidas

Foram adicionadas verificacoes no backend para recursos PRO:

- Cupons: `coupons`
- Roleta: `roulette`
- Estoque: `inventory`
- Movimentacoes de estoque: `inventory_movements`
- Relatorios avancados: `advanced_reports`
- IA da Loja: `store_ai`
- Templates WhatsApp: `whatsapp_templates`
- Marketing WhatsApp: `marketing_whatsapp`
- Recuperador de vendas: `sales_recovery`
- App Android do motoboy: `motoboy_app`
- Mesas: `tables`
- QR de mesa: `table_qr`
- Pedidos de mesa: `table_orders`

Quando a empresa nao possui o recurso, a API retorna HTTP 403 com:

```json
{
  "error": "feature_not_available",
  "feature": "inventory",
  "required_plan": "pro"
}
```

O payload tambem inclui `success: false` e uma mensagem amigavel para o frontend.

## Frontend da Loja

O menu administrativo da loja foi conectado ao mapa de recursos.

Recursos bloqueados aparecem com cadeado e mensagem de upgrade para Plano PRO.

Arquivos principais:

- `store-template/src/components/layout/AdminLayout.jsx`
- `store-template/src/services/storeApi.js`

## Testes Realizados

Comandos executados:

- `ruby -c` nos arquivos Ruby alterados principais
- `git diff --check`
- `rails db:migrate` local
- `RAILS_ENV=test rails db:migrate`
- `bundle exec rspec spec/services/feature_gate_spec.rb spec/requests/feature_gates_spec.rb`
- `npm run build` em `replymesh-frontend`
- `npm run build` em `store-template`
- `rails routes` filtrando rotas de features e recursos protegidos

Resultados:

- Sintaxe Ruby: OK
- Diff whitespace: OK
- Specs focadas: 13 exemplos, 0 falhas
- Build Master: OK
- Build Store Template: OK
- Rotas Rails: OK

## Arquivos Principais Alterados/Criados

Backend:

- `replymesh-api/app/services/feature_catalog.rb`
- `replymesh-api/app/services/feature_gate.rb`
- `replymesh-api/app/models/plan_feature.rb`
- `replymesh-api/app/models/company_feature_override.rb`
- `replymesh-api/app/controllers/api/v1/store/features_controller.rb`
- `replymesh-api/app/controllers/api/v1/store/base_controller.rb`
- `replymesh-api/app/controllers/api/v1/master/companies_controller.rb`
- controllers Store protegidos por recurso
- `replymesh-api/config/routes.rb`
- migrations de feature flags
- specs de feature gate
- `replymesh-api/db/schema.rb`

Frontend Master:

- `replymesh-frontend/src/pages/empresas/EmpresaDetalhe.jsx`
- `replymesh-frontend/src/services/api.js`

Store Template:

- `store-template/src/components/layout/AdminLayout.jsx`
- `store-template/src/services/storeApi.js`

## Pode Subir Para VPS?

Sim, pode subir para VPS em uma fase controlada, desde que siga runbook com:

1. Backup antes do deploy.
2. Publicar backend e frontends afetados.
3. Executar somente as migrations novas:
   - `20260609203000_create_feature_gates.rb`
   - `20260609204500_add_expires_at_to_company_feature_overrides.rb`
4. Recriar somente containers necessarios.
5. Validar START e PRO em empresa de teste antes de liberar para clientes reais.

## Precisa Nova Tag?

Sim.

Recomendado criar nova tag apos auditoria final e commit limpo, por exemplo:

- `v0.15.29-feature-flags-rc1`

## Pendencias

- Homologar visualmente no Master em uma empresa real/local.
- Homologar em VPS com uma empresa START e uma PRO.
- Definir precos oficiais no cadastro real dos planos, se ainda nao estiverem salvos no banco de producao.

## Conclusao

O sistema de planos START/PRO, recursos opcionais, bloqueio/liberacao manual por empresa e expiracao de recurso temporario foi implementado e validado localmente.

FASE 16.18 CONCLUIDA.
