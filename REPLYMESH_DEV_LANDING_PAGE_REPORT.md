# Replymesh Dev Landing Page Report

Data: 2026-06-19
Branch: dev
Base local antes do commit: 882f443
Origin/dev observado: 37bbdc7
Status da branch antes do commit: dev ahead 2, behind 1

## Escopo

Organizar e validar as alteracoes locais da Landing Page configuravel na branch dev, sem deploy e sem tocar na VPS.

## Classificacao dos arquivos locais

### 1. Landing Page

Frontend Master:
- replymesh-frontend/src/pages/LandingPage.jsx
- replymesh-frontend/src/pages/configuracoes/MasterBranding.jsx
- replymesh-frontend/src/styles/landing.css
- replymesh-frontend/src/styles/main.css
- replymesh-frontend/src/components/layout/Sidebar.jsx
- replymesh-frontend/src/components/layout/Topbar.jsx
- replymesh-frontend/src/services/api.js
- replymesh-frontend/public/clients/lanche-do-2r.png
- replymesh-frontend/public/clients/petisco-da-paty.png
- replymesh-frontend/public/clients/pizza-show.png

Backend API:
- replymesh-api/app/controllers/api/v1/master/branding_controller.rb
- replymesh-api/app/controllers/api/v1/public/platform_controller.rb
- replymesh-api/app/models/master_brand_setting.rb
- replymesh-api/config/routes.rb
- replymesh-api/db/migrate/20260618133000_add_landing_fields_to_master_brand_settings.rb
- replymesh-api/db/migrate/20260619113000_add_contact_and_social_fields_to_master_brand_settings.rb
- replymesh-api/db/schema.rb

Observacao sobre schema.rb:
- O schema foi atualizado para incluir os campos da landing.
- Tambem aparece no schema a migration ja existente 20260611220000_add_origin_to_cash_movements.rb, presente em origin/dev. Nao e uma alteracao nova da landing, mas faz parte do estado atual do schema local.

### 2. Pizzaria Avancada / Store

Deixados fora do commit da landing:
- replymesh-api/app/controllers/api/v1/store/dashboard_controller.rb
- replymesh-api/app/models/whatsapp_template.rb
- replymesh-api/app/services/delivery_service.rb
- replymesh-api/app/services/mercado_pago_payment_processor.rb
- replymesh-api/app/services/order_status_service.rb
- replymesh-api/spec/requests/api/v1/store/dashboard_spec.rb
- replymesh-api/spec/services/mercado_pago_payment_processor_spec.rb
- replymesh-api/spec/services/order_status_service_spec.rb
- store-template/src/components/dashboard/DashboardStats.jsx
- store-template/src/components/layout/AdminLayout.jsx
- store-template/src/components/menu/MenuSection.jsx
- store-template/src/components/shared/NotificationsDropdown.jsx
- store-template/src/components/ui/Modal.jsx
- store-template/src/pages/admin/Dashboard.jsx
- store-template/src/pages/admin/OrderDetails.jsx
- store-template/src/pages/admin/Orders.jsx
- store-template/src/pages/admin/Products.jsx
- store-template/src/pages/admin/Settings.jsx
- store-template/src/pages/admin/WhatsappTemplates.jsx
- store-template/src/pages/public/Checkout.jsx
- store-template/src/templates/hamburgueria-premium/components/PremiumProductCard.jsx
- store-template/src/utils/whatsappTemplates.js

### 3. Relatorios fora do commit

- REPLYMESH_DEV_ENVIRONMENT_SETUP_REPORT.md
- REPLYMESH_DEV_START_AND_ADVANCED_PIZZA_QA_REPORT.md

### 4. Sujeira/temporarios fora do commit

- docker-compose.dev.local.yml
- replymesh-api/Dockerfile.dev.local

### 5. Arquivos que exigem atencao

- A branch local dev esta divergida de origin/dev: ahead 2, behind 1.
- Existem muitas alteracoes locais fora do escopo da landing.
- Por isso, o push automatico de dev deve aguardar limpeza/decisao sobre as alteracoes restantes.

## Funcionalidades validadas no codigo

- Landing publica consome branding publico via /api/v1/public/platform.
- Logo do cabecalho da landing editavel.
- Hero image editavel.
- Preview das imagens no Master Branding.
- Logo da landing reutilizada no menu do Master.
- WhatsApp, email e localizacao editaveis.
- Instagram, Facebook e YouTube editaveis.
- Numero de contato formatado na landing.
- Secao Clientes e parceiros.
- Cadastro de nome, tipo, logo e link por cliente.
- Logos iniciais: Lanche do 2R, Petisco da Paty e Pizza Show.
- Cards de clientes compactados e responsivos.
- Carrossel automatico quando houver mais de cinco clientes.
- Pausa do carrossel em hover.
- Bloco promocional grande removido.
- Cards flutuantes do hero reduzidos no celular.
- Links sociais desativados visualmente quando nao configurados.
- Endpoint publico de branding criado.
- Campos novos de landing/contatos/redes sociais criados em migrations.

## Migrations

Criadas:
- 20260618133000_add_landing_fields_to_master_brand_settings.rb
- 20260619113000_add_contact_and_social_fields_to_master_brand_settings.rb

Validacao:
- Sao reversiveis via change/add_column.
- Nao alteram dados reais.
- Adicionam apenas campos em master_brand_settings.

## Validacoes executadas

- git diff --check: OK, apenas avisos CRLF do Windows.
- ruby -c nos Ruby alterados da landing: OK.
- npm run build em replymesh-frontend: OK.
- npm run build em store-template: OK, executado porque a arvore local tambem possui arquivos da Store alterados, mas eles ficaram fora do commit da landing.
- Auditoria de segredos: sem segredo real nos arquivos da landing. Hits fora do escopo vieram de nomes de campos/configuracoes e arquivos dev locais nao stageados.

## Commit

Mensagem prevista:
Replymesh Add Configurable Marketing Landing Page

Commit hash:
Registrado no fechamento da execucao apos o amend final.

## Push origin/dev

Nao executado ainda neste ponto.
Motivos:
- branch dev esta divergida de origin/dev;
- ha alteracoes locais fora do escopo da landing que precisam de decisao separada;
- o prompt condiciona push a estado limpo/correto.

## Producao

Nada foi publicado em producao.
Nenhuma VPS foi alterada.
Nenhum deploy foi executado.

## Pendencias

- Decidir o destino das alteracoes restantes de Pizzaria/Store.
- Resolver divergencia dev ahead/behind antes de push final.
- Depois da limpeza, executar git push origin dev.
