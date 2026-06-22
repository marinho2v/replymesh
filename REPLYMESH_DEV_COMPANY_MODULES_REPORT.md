# REPLYMESH DEV — Company Modules por Empresa

Status: implementado na branch `dev`.

Escopo respeitado:

- Sem deploy.
- Sem VPS.
- Sem merge para `main`.
- Sem alteração em produção.

## Estrutura escolhida

Foi reutilizada a estrutura existente de `company_feature_overrides`, `plan_features`, `FeatureCatalog` e `FeatureGate`, evitando criar uma tabela paralela e mantendo compatibilidade com empresas existentes.

Foi adicionada uma camada comercial de módulos:

- `CompanyModuleCatalog`: catálogo comercial dos módulos exibidos no Master.
- `CompanyModuleAssignment`: aplica módulos por empresa, convertendo cada módulo em liberações/bloqueios granulares existentes.

Também foram adicionados campos comerciais em `companies`:

- `monthly_price_cents`
- `free_period_days`
- `internal_note`
- `contract_type`

## Módulos criados

Core:

- menu
- orders
- checkout
- reports
- dashboard

Operação:

- pos
- tables
- waiter
- delivery
- motoboy
- finance
- inventory

Marketing:

- coupons
- promotions
- roulette
- banners
- whatsapp_marketing
- abandoned_cart

WhatsApp:

- whatsapp_manual
- whatsapp_automatic

IA:

- store_ai

Pagamentos:

- mercado_pago
- pix

Segmentos:

- advanced_pizza

Aplicativos:

- motoboy_app
- waiter_app

Domínio:

- custom_domain

Presets:

- basic
- operation
- complete

## Telas alteradas

Painel Master:

- Criação de empresa ganhou seleção de módulos por grupo, presets rápidos e campos comerciais.
- Detalhe/configuração de empresa ganhou card de módulos com ativar/desativar, presets rápidos e aviso ao desligar módulo essencial.
- Detalhe da assinatura passou a exibir valor combinado, gratuidade e tipo de contrato.

Painel da loja:

- Menus de módulos desativados passam a ficar ocultos.
- A página de Produtos esconde o tipo de produto de Pizzaria Avançada quando o módulo não está ativo.
- O handler de API agora reconhece `feature_disabled` e `feature_not_available`.

## Guards backend

Foram aplicados/reaproveitados guards de feature nos principais pontos:

- dashboard
- pedidos
- produtos
- categorias
- delivery zones
- motoboys
- painel motoboy
- caixa/movimentos
- banners
- WhatsApp Connect
- POS
- IA
- estoque
- movimentações de estoque
- mesas
- pedidos por mesa
- roleta
- relatórios avançados
- aplicativos Android

Endpoints públicos sensíveis também respeitam módulos quando aplicável:

- menu/produtos
- banners
- delivery zones
- pedidos
- PIX/Mercado Pago
- roleta
- mesa por QR Code

Resposta padrão para recurso bloqueado:

```json
{
  "error": "feature_disabled",
  "feature": "module_or_feature_key"
}
```

## WhatsApp manual/automático

O módulo `whatsapp_manual` mantém o fluxo de envio manual.

O módulo `whatsapp_automatic` habilita fluxo automático/Replymesh Connect.

Ao aplicar módulos pelo Master, o `StoreSetting#whatsapp_mode` é sincronizado:

- `automatic` se `whatsapp_automatic` estiver ativo;
- `manual` se somente `whatsapp_manual` estiver ativo;
- `disabled` se nenhum WhatsApp estiver ativo.

## Empresas QA criadas na DEV local

Criadas/atualizadas de forma idempotente no banco DEV local:

- `qa-modulos-basico`: menu, orders, checkout, reports, whatsapp_manual
- `qa-modulos-operacao`: menu, orders, checkout, reports, pos, motoboy, delivery, whatsapp_manual
- `qa-modulos-completo`: todos os módulos

## Validações executadas

- `npm run build` em `store-template`: OK
- `npm run build` em `replymesh-frontend`: OK
- `npm run lint` em `replymesh-frontend`: OK
- `ruby -c` nos arquivos Ruby alterados principais: OK
- `docker exec replymesh-api-dev-local env RAILS_ENV=test bundle exec rails db:migrate`: OK
- `docker exec replymesh-api-dev-local env RAILS_ENV=test bundle exec rspec spec/services/company_module_assignment_spec.rb spec/services/feature_gate_spec.rb spec/requests/feature_gates_spec.rb spec/requests/motoboy_spec.rb`: 20 examples, 0 failures
- `git diff --check`: OK
- `scripts/audit_secrets.ps1`: OK, nenhum segredo hardcoded encontrado nas áreas publicáveis

Observação: o container local tem `RAILS_ENV=development` por padrão; por isso os specs foram executados forçando `RAILS_ENV=test`.

## Pendências

- Validação visual/manual no navegador das três empresas QA.
- Aplicar rollout para VPS somente em etapa futura e separada, com backup e smoke test.
- Se necessário, refinar bloqueios específicos de Pizzaria Avançada em endpoints granulares de opcionais/sabores após mapear todos os fluxos internos.

## Commit DEV

Hash do commit dev da implementação: c8d21b4
