# REPLYMESH PHASE 16.0A - LOCAL DEPLOY AUDIT

Data: 2026-06-07
Versao auditada: Replymesh Local Stable v0.15.22
Escopo: auditoria local para preparar migracao futura para VPS/Producao.

> Auditoria somente-leitura. Nenhum deploy, exclusao, movimentacao de pastas, alteracao de banco, alteracao de `.env` ou configuracao de VPS foi executada.

---

## 1. Estrutura local principal

Raiz do projeto:

- `W:\sas replymesh`

Projetos localizados:

- Backend Rails API: `W:\sas replymesh\replymesh-api`
- Frontend Master React/Vite: `W:\sas replymesh\replymesh-frontend`
- Store Template React/Vite: `W:\sas replymesh\store-template`
- Scripts locais: `W:\sas replymesh\scripts`
- Uploads locais: `W:\sas replymesh\uploads`
- Documentacao e auditorias: `W:\sas replymesh\*.md`
- Copia/template 2R local: `W:\sas replymesh\temple1`
- Backup 2R original tambem encontrado em: `M:\temple1\replymesh-export\backups`

Arquivos base relevantes:

- `W:\sas replymesh\README.md`
- `W:\sas replymesh\ROADMAP_REPLYMESH.md`
- `W:\sas replymesh\STORE_TEMPLATE_PLAN.md`
- `W:\sas replymesh\MASTER_PLAN_REPLYMESH.md`
- `W:\sas replymesh\DATABASE_REPLYMESH.md`
- `W:\sas replymesh\MIGRATION_2R_PLAN.md`
- `W:\sas replymesh\REPLYMESH_LOCAL_STABLE_RELEASE.md`
- `W:\sas replymesh\REPLYMESH_FULL_SYSTEM_AUDIT.md`

---

## 2. Tamanhos aproximados

Medicao local por arquivos, incluindo dependencias instaladas quando presentes:

| Caminho | Tamanho aprox. | Arquivos | Pastas |
|---|---:|---:|---:|
| `W:\sas replymesh` | 6870.58 MB | 128945 | 21709 |
| `W:\sas replymesh\replymesh-api` | 234.26 MB | 3339 | 494 |
| `W:\sas replymesh\replymesh-frontend` | 112.65 MB | 8372 | 488 |
| `W:\sas replymesh\store-template` | 222.35 MB | 16524 | 1263 |
| `W:\sas replymesh\scripts` | 0.01 MB | 4 | 0 |
| `W:\sas replymesh\uploads` | 1.31 MB | 1 | 0 |

Builds e publicos:

| Caminho | Tamanho aprox. | Arquivos |
|---|---:|---:|
| `W:\sas replymesh\replymesh-frontend\dist` | 0.45 MB | 38 |
| `W:\sas replymesh\store-template\dist` | 40.20 MB | 272 |
| `W:\sas replymesh\store-template\public` | 39.12 MB | 184 |
| `W:\sas replymesh\replymesh-frontend\public` | 0.01 MB | 2 |
| `W:\sas replymesh\replymesh-api\public` | 0 MB | 1 |

Observacao: o tamanho total da raiz inclui copia `temple1`, runtime/tools locais, node_modules e artefatos que nao devem subir para VPS.

---

## 3. Arvore resumida

### `replymesh-api`

Pastas principais:

- `.git`
- `.github`
- `.kamal`
- `app`
- `bin`
- `config`
- `db`
- `docs`
- `lib`
- `log`
- `public`
- `script`
- `spec`
- `tmp`
- `vendor`

### `replymesh-frontend`

Pastas principais:

- `dist`
- `node_modules`
- `public`
- `src`

### `store-template`

Pastas principais:

- `.claude`
- `dist`
- `docs`
- `node_modules`
- `public`
- `scripts`
- `src`
- `tools`

---

## 4. Backend Rails

Caminho:

- `W:\sas replymesh\replymesh-api`

Tecnologias identificadas:

- Ruby: `4.0.5`
- Rails: `8.1.3`
- Banco: PostgreSQL via `config/database.yml`
- Servidor: Puma
- Porta local padrao: `3000`
- Runtime Ruby usado localmente: `W:\replymesh-ruby\bin\ruby.exe`

Arquivos de configuracao:

- `W:\sas replymesh\replymesh-api\Gemfile`
- `W:\sas replymesh\replymesh-api\config\database.yml`
- `W:\sas replymesh\replymesh-api\config\puma.rb`
- `W:\sas replymesh\replymesh-api\config\routes.rb`
- `W:\sas replymesh\replymesh-api\.env`
- `W:\sas replymesh\replymesh-api\.env.example`

Banco Rails:

- Adapter: PostgreSQL
- Development database default: `replymesh_development`
- Production database default: `replymesh_production`
- Test database: `replymesh_test`

Puma:

- `config/puma.rb` usa `PORT`, padrao `3000`.
- Existe suporte para Solid Queue dentro do Puma se `SOLID_QUEUE_IN_PUMA` estiver definido.

Jobs:

- `app/jobs/application_job.rb` existe.
- Nao foi encontrado Sidekiq ativo no codigo/config principal.
- `REDIS_URL` existe como variavel de ambiente, mas nao foi confirmado uso ativo obrigatorio em desenvolvimento.
- Solid Queue aparece preparado em configuracoes de deploy/Puma.

Migrations:

- `db/migrate`: 78 migrations encontradas.

Rotas:

- `rails routes`: 298 linhas de rotas.
- Namespaces principais existentes:
  - `/api/v1/auth`
  - `/api/v1/master`
  - `/api/v1/store`
  - `/api/v1/public/:company_slug`
  - `/api/v1/motoboy`
  - `/api/v1/webhooks`

Servicos Rails relevantes:

- `CompanyOnboardingService`
- `EvolutionGoClient`
- `CheckoutService`
- `OrderStatusService`
- `MercadoPagoPixService`
- `PaymentExpirationService`
- `WhatsappStatusDispatcher`
- `ReplymeshBackupImportService`
- `MasterDashboardService`
- `StoreAiService`
- `StoreRagService`
- `ReplymeshRagService`
- `CarinaAssistantService`

---

## 5. Frontend Master

Caminho:

- `W:\sas replymesh\replymesh-frontend`

Tecnologias:

- Node: `v22.19.0`
- npm: `10.9.3`
- React: `^18.3.1`
- Vite: `^8.0.12`
- React Router DOM: `^6.30.4`
- Lucide React: `^1.17.0`

Scripts:

- `npm run dev`
- `npm run build`
- `npm run lint`

Build:

- Saida: `W:\sas replymesh\replymesh-frontend\dist`
- Tamanho aproximado: 0.45 MB

Variaveis de ambiente conhecidas:

- `VITE_API_URL`

Porta local:

- `5173`

Rotas/modulos principais mapeados por documentacao e codigo:

- `/dashboard`
- `/empresas`
- `/empresas/nova`
- `/empresas/importar-backup`
- `/assinaturas`
- `/whatsapp`
- `/dominios`
- `/financeiro`
- `/usuarios-master`
- `/logs`
- `/tickets`
- `/configuracoes`
- `/configuracoes/ia`
- `/configuracoes/atualizacoes`
- `/aplicativos-android`

APIs consumidas:

- Base local: `http://127.0.0.1:3000/api/v1`
- Namespace principal: `/api/v1/master`
- Auth: `/api/v1/auth`

---

## 6. Store Template

Caminho:

- `W:\sas replymesh\store-template`

Tecnologias:

- Node: `v22.19.0`
- npm: `10.9.3`
- React: `^18.3.1`
- Vite: `^5.4.8`
- React Router DOM: `^6.26.1`
- Lucide React: `^0.451.0`
- Framer Motion: `^11.11.7`
- Sonner: `^1.5.0`

Scripts:

- `npm run dev`
- `npm run build`
- `npm run preview`

Build:

- Saida: `W:\sas replymesh\store-template\dist`
- Tamanho aproximado: 40.20 MB

Porta local:

- `5174`

Variaveis de ambiente conhecidas:

- `VITE_REPLYMESH_API_URL`
- `VITE_COMPANY_SLUG`
- `VITE_REPLYMESH_COMPANY_ID`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `WASENDER_API_URL`
- `WASENDER_API_TOKEN`

Observacao:

- Supabase ainda aparece como dependencia/legado no template, mas a migracao ativa deve usar Rails/Replymesh. O uso real precisa continuar sendo auditado antes da VPS.

Templates existentes:

- Template classico/base.
- Template premium hamburgueria em `src/templates/hamburgueria-premium`.
- Estrutura preparada para templates futuros.

Rotas publicas principais:

- `/loja/:companySlug`
- `/loja/:companySlug/menu`
- `/loja/:companySlug/cart`
- `/loja/:companySlug/checkout`
- `/loja/:companySlug/success/:id`
- `/loja/:companySlug/pedido/:id`
- `/loja/:companySlug/roleta`
- `/loja/:companySlug/mesa/:qrToken`

Rotas admin principais:

- `/loja/:companySlug/login`
- `/loja/:companySlug/admin`
- `/loja/:companySlug/admin/dashboard`
- `/loja/:companySlug/admin/orders`
- `/loja/:companySlug/admin/orders/:id`
- `/loja/:companySlug/admin/products`
- `/loja/:companySlug/admin/categories`
- `/loja/:companySlug/admin/customers`
- `/loja/:companySlug/admin/coupons`
- `/loja/:companySlug/admin/wheel`
- `/loja/:companySlug/admin/delivery-zones`
- `/loja/:companySlug/admin/motoboys`
- `/loja/:companySlug/admin/cash`
- `/loja/:companySlug/admin/reports`
- `/loja/:companySlug/admin/marketing`
- `/loja/:companySlug/admin/sales-recovery`
- `/loja/:companySlug/admin/settings`
- `/loja/:companySlug/admin/android-app`
- `/loja/:companySlug/admin/support`
- `/loja/:companySlug/admin/whatsapp`
- `/loja/:companySlug/admin/whatsapp/templates`
- `/loja/:companySlug/admin/whatsapp/qrcode`

Rotas motoboy:

- `/loja/:companySlug/motoboy/login`
- `/loja/:companySlug/motoboy/dashboard`
- `/loja/:companySlug/motoboy/history`
- `/loja/:companySlug/motoboy/financeiro`
- `/loja/:companySlug/motoboy/profile`

---

## 7. Banco local

PostgreSQL local detectado:

- Porta: `5432`
- Processo: `postgres`
- Conexoes locais ativas.

Contagens lidas via Rails runner:

- Tabelas: 64
- Empresas: 6
- Pedidos: 73
- Produtos: 221
- Clientes: 247
- Usuarios: 13

Sem exposicao de dados pessoais ou valores sensiveis neste relatorio.

---

## 8. Variaveis de ambiente mapeadas

Somente nomes encontrados. Valores nao foram exibidos.

Backend `.env` / `.env.example`:

- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_NAME`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `JWT_SECRET`
- `JWT_EXPIRATION_HOURS`
- `SECRET_KEY_BASE`
- `RAILS_ENV`
- `RAILS_MASTER_KEY`
- `REDIS_URL`
- `REPLYMESH_DEFAULT_DOMAIN`
- `REPLYMESH_MASTER_EMAIL`
- `REPLYMESH_MASTER_PASSWORD`
- `EVOLUTION_GO_BASE_URL`
- `EVOLUTION_GO_API_KEY`
- `EVOLUTION_GO_MOCK_MODE`

Frontend Master:

- `VITE_API_URL`

Store Template:

- `VITE_REPLYMESH_API_URL`
- `VITE_COMPANY_SLUG`
- `VITE_REPLYMESH_COMPANY_ID`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `WASENDER_API_URL`
- `WASENDER_API_TOKEN`

Variaveis citadas/necessarias para integracoes futuras:

- `CLAUDE_API_KEY`
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_PUBLIC_KEY`
- `EVOLUTION_WEBHOOK_SECRET` ou equivalente para webhook Evolution
- `MERCADOPAGO_WEBHOOK_SECRET` ou equivalente para webhook Mercado Pago

---

## 9. Portas locais em uso

Portas principais detectadas:

| Porta | Uso esperado | Processo |
|---:|---|---|
| 3000 | Rails API | `ruby` em `W:\replymesh-ruby\bin\ruby.exe` |
| 5173 | Replymesh Master | `node` |
| 5174 | Store Template | `node` |
| 5432 | PostgreSQL | `postgres` |

Outras portas locais vistas:

- `5037`: processo local nao relacionado diretamente ao Replymesh.
- `5040`: processo local Windows.

Conflitos possiveis:

- VPS deve expor HTTP/HTTPS em 80/443, nao 5173/5174 diretamente.
- Portas 3000/5173/5174 devem ficar internas ou atras de Nginx/PM2/systemd.
- PostgreSQL 5432 nao deve ficar publico sem firewall/regras.

---

## 10. Backups encontrados

Backups/importacoes relevantes:

- `M:\temple1\replymesh-export\backups\2r-backup-2026-06-07T16-00.json`
- `M:\temple1\replymesh-export\backups\2r-backup-2026-06-07T15-53.json`
- `W:\sas replymesh\temple1\replymesh-export\backups\2r-backup-2026-06-07T16-00.json`
- `W:\sas replymesh\temple1\replymesh-export\backups\2r-backup-2026-06-07T15-53.json`
- `M:\temple1\supabase-backup-data.json`
- `W:\sas replymesh\temple1\supabase-backup-data.json`

Observacao:

- Os backups do 2R sao artefatos de migracao/importacao. Devem ser tratados como dados sensiveis e enviados para VPS apenas se forem necessarios e com cuidado.

---

## 11. Scripts locais

Pasta:

- `W:\sas replymesh\scripts`

Scripts:

- `audit_secrets.ps1`
- `smoke_all.ps1`
- `smoke_backend.ps1`
- `smoke_frontend.ps1`

Uso esperado antes da VPS:

- `W:\sas replymesh\scripts\smoke_all.ps1`
- `W:\sas replymesh\scripts\audit_secrets.ps1`

---

## 12. Documentacao localizada

Arquivos principais:

- `README.md`
- `ROADMAP_REPLYMESH.md`
- `STORE_TEMPLATE_PLAN.md`
- `MASTER_PLAN_REPLYMESH.md`
- `DATABASE_REPLYMESH.md`
- `MIGRATION_2R_PLAN.md`
- `FLUXO_LOCALIZACAO_EVOLUTION.md`
- `AI_WHATSAPP_ATTENDANT_PLAN.md`
- `STORE_VISUAL_TEMPLATES_GUIDE.md`

Auditorias `REPLYMESH_*` existentes:

- `REPLYMESH_FULL_SYSTEM_AUDIT.md`
- `REPLYMESH_LOCAL_STABLE_RELEASE.md`
- `REPLYMESH_PRE_VPS_AUDIT.md`
- `REPLYMESH_PHASE_15_3_ADMIN_AUDIT.md`
- `REPLYMESH_PHASE_15_5_UI_SUPPORT_AUDIT.md`
- `REPLYMESH_PHASE_15_6_FINAL_UX_AUDIT.md`
- `REPLYMESH_PHASE_15_7_UI_POLISH_AUDIT.md`
- `REPLYMESH_PHASE_15_8_FINAL_LOCAL_AUDIT.md`
- `REPLYMESH_PHASE_15_9_VISUAL_TEMPLATES_AUDIT.md`
- `REPLYMESH_PHASE_15_9_1_TEMPLATE_CATEGORIES_AUDIT.md`
- `REPLYMESH_PHASE_15_9_2_HAMBURGUERIA_PREMIUM_AUDIT.md`
- `REPLYMESH_PHASE_15_10_NOTIFICATIONS_UX_AUDIT.md`
- `REPLYMESH_PHASE_15_11_MERCADOPAGO_PIX_AUDIT.md`
- `REPLYMESH_PHASE_15_11_1_MP_PIX_VISUAL_FIX_AUDIT.md`
- `REPLYMESH_PHASE_15_11_2_MP_REALTIME_PAYMENT_AUDIT.md`
- `REPLYMESH_PHASE_15_11_3_MP_AUDIT.md`
- `REPLYMESH_PHASE_15_12_AI_MASTER_FIX_AUDIT.md`
- `REPLYMESH_PHASE_15_12_CARINA_PLATFORM_AI_AUDIT.md`
- `REPLYMESH_PHASE_15_12_SYSTEM_AI_ASSISTANT_AUDIT.md`
- `REPLYMESH_PHASE_15_13_CARINA_PREMIUM_AUDIT.md`
- `REPLYMESH_PHASE_15_14_SYSTEM_UPDATES_NOTIFICATIONS_AUDIT.md`
- `REPLYMESH_PHASE_15_15_MASTER_USERS_PERMISSIONS_AUDIT.md`
- `REPLYMESH_PHASE_15_16_IMPERSONATION_AUDIT_LOGS.md`
- `REPLYMESH_PHASE_15_17_MASTER_DASHBOARD_AUDIT.md`
- `REPLYMESH_PHASE_15_18_CARINA_RAG.md`
- `REPLYMESH_PHASE_15_19_STORE_AI_RAG.md`
- `REPLYMESH_PHASE_15_19_1_STORE_AI_POLISH.md`
- `REPLYMESH_PHASE_15_20_MARKETING_RECUPERADOR_ANDROID.md`
- `REPLYMESH_PHASE_15_20_LOCAL_CLEANUP_AND_PARTIALS.md`
- `REPLYMESH_PHASE_15_21_LOCAL_STABLE_TESTS.md`
- `REPLYMESH_PHASE_15_21_SUBDOMAINS_REPLYMESH_CLOUD.md`
- `REPLYMESH_PHASE_15_22_UX_PERFORMANCE_FINAL.md`

---

## 13. Auditoria de segredos

Busca feita por nomes/assinaturas de segredos, sem imprimir valores.

Ocorrencias por nome foram encontradas em:

- Documentacao local.
- `.env` e `.env.example`.
- Controllers/Services Rails de Evolution, Mercado Pago, Webhooks e WhatsApp.
- `replymesh-api\rails-server.log`.
- `store-template\src\pages\admin\Settings.jsx`.
- `store-template\dist\assets\Settings-*.js`.
- Codigo legado/copia `temple1`.
- `node_modules` e gems locais, que nao devem subir.

Riscos:

- Confirmar que `dist` nao contem valor real de segredo. Campos e labels podem aparecer no bundle, mas valores reais nao devem.
- `rails-server.log` deve ser limpo/ignorado antes de qualquer envio.
- `.env` nunca deve ser enviado ao repositorio nem ao frontend.
- Backups podem conter dados de clientes e devem ser tratados como sensiveis.

Recomendacao:

- Executar `W:\sas replymesh\scripts\audit_secrets.ps1` imediatamente antes de empacotar ou fazer deploy.
- Revisar qualquer ocorrencia em `dist` e logs.

---

## 14. Arquivos obrigatorios para VPS

### Prioridade 1 - Backend

- `replymesh-api\app`
- `replymesh-api\bin`
- `replymesh-api\config`
- `replymesh-api\db`
- `replymesh-api\lib`
- `replymesh-api\Gemfile`
- `replymesh-api\Gemfile.lock`
- `replymesh-api\Rakefile`
- `replymesh-api\config.ru`
- `replymesh-api\public`
- `replymesh-api\spec` somente se testes forem rodar na VPS/CI
- `replymesh-api\docs` se documentacao tecnica for mantida junto

### Prioridade 2 - Frontend Master

- Codigo fonte: `replymesh-frontend\src`, `public`, configs e `package*.json`
- Ou build gerado: `replymesh-frontend\dist`
- Configurar `VITE_API_URL` para producao antes do build.

### Prioridade 3 - Store Template

- Codigo fonte: `store-template\src`, `public`, configs e `package*.json`
- Ou build gerado: `store-template\dist`
- Configurar `VITE_REPLYMESH_API_URL` para producao antes do build.

### Prioridade 4 - Uploads / assets

- Uploads persistentes que forem usados pelas lojas.
- Imagens publicas de templates.
- Banners/logos reais importados, quando nao forem URLs externas.

### Prioridade 5 - Scripts / documentacao

- `scripts\smoke_*.ps1` adaptados para Linux ou criar equivalentes `.sh`.
- Documentos de deploy e checklist.

---

## 15. O que nao precisa subir

Nao enviar para VPS:

- `node_modules`
- `tmp`
- `log` local
- `.git` se for empacotamento manual
- `.claude`
- `.codex-local`
- `.thumbnail`
- caches do Vite
- caches de bundle
- `dist` antigo se a VPS for fazer build novo
- backups antigos desnecessarios
- `tools\ruby` local do Windows
- `W:\sas replymesh\temple1` completo, exceto backup especifico se necessario
- `M:\temple1` original
- arquivos de teste obsoletos
- logs com payloads ou dados sensiveis

---

## 16. Checklist pre-deploy VPS

Infra:

- DNS wildcard `*.replymesh.cloud`.
- Nginx aceitando `app.replymesh.cloud`, `api.replymesh.cloud`, `*.replymesh.cloud`.
- SSL LetsEncrypt/Certbot.
- PostgreSQL producao.
- Usuario de banco dedicado.
- Firewall.
- Backups automatizados.
- Health checks.
- Logs centralizados/rotacao.

Backend:

- Definir `RAILS_ENV=production`.
- Definir `DATABASE_*`.
- Definir `SECRET_KEY_BASE`.
- Definir `JWT_SECRET`.
- Definir `EVOLUTION_GO_BASE_URL`.
- Definir `EVOLUTION_GO_API_KEY`.
- Definir `EVOLUTION_GO_MOCK_MODE=false` se usar real.
- Definir Mercado Pago real.
- Definir Claude real no backend/master, nunca no frontend.
- Rodar `rails db:migrate`.
- Rodar seeds apenas se seguro.
- Configurar job scheduler para Pix expirado.
- Configurar webhook Evolution publico.
- Configurar webhook Mercado Pago publico.

Frontend:

- Build master com API de producao.
- Build store-template com API de producao.
- Testar roteamento por `/loja/:slug`.
- Preparar roteamento por subdominio `slug.replymesh.cloud`.

Seguranca:

- Nao commitar `.env`.
- Nao subir logs locais.
- Nao expor tokens no bundle.
- Testar permissao multiempresa.
- Testar master impersonation.
- Testar CORS.

Dados:

- Decidir se migracao vai usar dump PostgreSQL local ou seeds/importadores.
- Tratar backup 2R como dado sensivel.
- Validar imagens relativas dos produtos importados.

---

## 17. Riscos encontrados

1. `store-template\dist` tem bundle grande e contem textos/campos de configuracao; precisa confirmar ausencia de valores reais de secrets.
2. `rails-server.log` aparece na auditoria de nomes sensiveis; deve ser removido/ignorado antes de migrar.
3. Copia `temple1` e backups Supabase/2R existem dentro da raiz e aumentam muito o tamanho total.
4. `node_modules` e runtime Ruby local Windows nao devem subir.
5. Webhooks Evolution/Mercado Pago dependem de URL publica e ainda precisam configuracao real na VPS.
6. Localizacao real via WhatsApp depende de webhook publico; nao deve ser considerada validada em producao local.
7. Scheduler/worker para expiracao Pix precisa decisao de producao: Solid Queue, cron, systemd timer ou Sidekiq.
8. Uploads/imagens importadas com caminhos relativos precisam estrategia final: migrar arquivos, manter URL original ou hospedar em storage publico.

---

## 18. O projeto local esta pronto para ser migrado?

Resposta curta: parcialmente pronto.

A versao local esta madura para iniciar a preparacao da Fase 16, mas ainda nao deve ser enviada para producao sem resolver os pontos pre-deploy abaixo.

Falta antes da Fase 16 efetiva:

- Rodar smoke completo final: `W:\sas replymesh\scripts\smoke_all.ps1`.
- Rodar auditoria final de secrets: `W:\sas replymesh\scripts\audit_secrets.ps1`.
- Confirmar que nenhum segredo real esta no `dist`, logs ou docs.
- Limpar/ignorar logs locais.
- Definir estrategia de banco de producao.
- Definir estrategia de uploads/imagens.
- Definir job scheduler para expiracao Pix.
- Preparar variaveis de ambiente de producao.
- Preparar DNS/Nginx/SSL para `replymesh.cloud`.
- Configurar webhooks publicos Evolution e Mercado Pago.
- Testar multiempresa, login, checkout, Pix, WhatsApp, motoboy, roleta e importacao em ambiente staging/VPS antes de liberar cliente.

Status final:

- Auditoria local concluida.
- Inventario criado.
- Sem deploy.
- Sem alteracao de banco.
- Sem alteracao de `.env`.
- Sem configuracao de VPS.

