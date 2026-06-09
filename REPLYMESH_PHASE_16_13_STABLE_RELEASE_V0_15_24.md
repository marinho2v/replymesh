# REPLYMESH FASE 16.13 - Consolidacao e Auditoria v0.15.24

Data da auditoria: 2026-06-09 01:03:33 -03:00

## Status

FASE 16.13.1 liberada para commit e tag depois da correcao SSL.

O bloqueio anterior foi removido: `testemultiempresa.replymesh.cloud` agora
apresenta certificado Let's Encrypt valido e responde normalmente sem ignorar
a verificacao TLS.

## Referencias Git

- Branch local: `main`
- Commit local antes da release: `910422f792210a2d745a6b15b57d43af1e6f7999`
- `origin/main`: `910422f792210a2d745a6b15b57d43af1e6f7999`
- Tag anterior: `v0.15.23`
- Commit da release: objeto apontado por `v0.15.24`; o hash exato foi
  registrado no resultado operacional depois da criacao do commit.
- Tag: `v0.15.24`
- Mensagem: `Replymesh Production Stable v0.15.24`

## A) Alteracoes que devem ir para o Git

Backend Rails:

- `replymesh-api/app/controllers/api/v1/master/companies_controller.rb`
- `replymesh-api/app/controllers/api/v1/master/whatsapp/instances_controller.rb`
- `replymesh-api/app/controllers/api/v1/store/marketing_controller.rb`
- `replymesh-api/app/controllers/api/v1/store/whatsapp/instances_controller.rb`
- `replymesh-api/app/controllers/api/v1/webhooks/evolution_controller.rb`
- `replymesh-api/app/services/company_onboarding_service.rb`
- `replymesh-api/app/services/evolution_go_client.rb`
- `replymesh-api/app/services/mercado_pago_payment_processor.rb`
- `replymesh-api/app/services/order_status_service.rb`
- `replymesh-api/app/services/whatsapp_status_dispatcher.rb`
- `replymesh-api/config/initializers/cors.rb`

Testes Rails:

- `replymesh-api/spec/requests/evolution_location_webhook_spec.rb`
- `replymesh-api/spec/requests/multi_tenant_spec.rb`
- `replymesh-api/spec/services/company_onboarding_service_spec.rb`
- `replymesh-api/spec/services/mercado_pago_payment_processor_spec.rb`
- `replymesh-api/spec/services/order_status_service_spec.rb`
- `replymesh-api/spec/services/whatsapp_status_dispatcher_spec.rb`

Painel Master:

- `replymesh-frontend/src/pages/empresas/CompanyImpersonationLaunch.jsx`

`EmpresasList.jsx` e `Dashboard.jsx` nao possuem diff ativo em relacao ao
GitHub/main. As correcoes relevantes desses fluxos ja estao no snapshot base.

Store:

- `store-template/src/app/router.jsx`
- `store-template/src/components/layout/AdminLayout.jsx`
- `store-template/src/pages/admin/Settings.jsx`
- `store-template/src/pages/motoboy/MotoboyDashboard.jsx`
- `store-template/src/services/replymeshApi.js`
- `store-template/src/services/settings.js`
- `store-template/src/utils/orderStatus.jsx`

Relatorios:

- `REPLYMESH_PHASE_16_9_PRODUCTION_PARITY_AND_FIXES.md`
- `REPLYMESH_PHASE_16_10_PRODUCTION_PARITY_PIX_EVOLUTION_REPORT.md`
- `REPLYMESH_PHASE_16_11_ORDER_WHATSAPP_MOTOBOY_LOCATION_REPORT.md`
- `REPLYMESH_PHASE_16_12_GLOBAL_MULTI_COMPANY_VALIDATION.md`
- `REPLYMESH_PHASE_16_13_STABLE_RELEASE_V0_15_24.md`

Protecao do repositorio:

- `.gitignore`: adicionados `secrets-local/`, `*.bak` e `.codex_tmp_*`.

## B) Somente producao/VPS - nao versionar

- `/etc/replymesh-rails-api.env`
- `/root/replymesh-secrets/`
- imagens e containers Docker de producao
- arquivos estaticos publicados em `/opt/replymesh/master` e
  `/opt/replymesh/store`
- configuracoes e certificados Traefik/ACME
- backups em `/root/replymesh-backups/` e `/opt/replymesh/backups/`
- `REPLYMESH_CORS_MINIMAL_FIX_REPORT.md`, presente somente na VPS

## C) Temporarios e backups - nao versionar

- qualquer arquivo `*.bak`
- `replymesh-api/.codex_tmp_phase_16_7_local_counts.rb`
- `.env`, `.env.production` e `.env.local`
- `master.key` e chaves de credentials
- `secrets-local/` e `replymesh-secrets/`
- `node_modules/`, `dist/`, uploads, logs, dumps e exports reais

## Auditoria de segredos

Foram varridos os arquivos modificados e novos por:

- chaves privadas;
- tokens GitHub;
- chaves AWS;
- tokens Mercado Pago `APP_USR` e `TEST`;
- chaves `sk-*`;
- senhas, secrets, API keys e tokens em atribuicoes;
- blocos base64 longos.

Resultado: nenhum segredo real encontrado.

O unico alerta textual foi `senha-forte-123` em um spec de onboarding. Trata-se
de dado sintetico de teste, sem relacao com credencial de producao.

Os relatorios usam marcadores como `<redacted>` e `[FILTERED]`. Nenhum token,
senha, chave privada, QR Code base64 ou credencial real foi incluido.

Nenhum arquivo foi staged porque o bloqueio TLS foi identificado antes da
preparacao final do commit.

## Testes locais

- `ruby -c` em 17 arquivos Ruby alterados/adicionados: OK.
- `npm run build` em `replymesh-frontend`: OK.
- `npm run lint` em `replymesh-frontend`: OK, sem erros.
- `npm run build` em `store-template`: OK.
- `git diff --check`: OK.
- `bundle exec rspec` direcionado aos specs alterados: nao iniciou no Windows.

Motivo do RSpec local:

O runtime local nao possui todas as gems do `Gemfile.lock`, incluindo
`puma-8.0.2`, `bcrypt-3.1.22`, `bootsnap-1.24.6`, `msgpack-1.8.1` e outras.
Nenhuma gem foi instalada durante esta fase.

Observacao sobre o build local do Master:

Sem `.env.production`, o fallback de desenvolvimento para
`127.0.0.1:3000` permanece no bundle local. O bundle atualmente publicado na
VPS foi auditado separadamente e usa `https://api.replymesh.cloud`.

## Validacoes de producao

HTTP:

- `https://api.replymesh.cloud/up`: 200.
- `https://app.replymesh.cloud/dashboard`: 200.
- `https://app.replymesh.cloud/whatsapp`: 200.
- `https://demohamburgueria.replymesh.cloud`: 200.
- `https://demohamburgueria.replymesh.cloud/admin/login`: 200.
- `https://demohamburgueria.replymesh.cloud/motoboy/login`: 200.
- `https://testemultiempresa.replymesh.cloud`: 200, TLS verify 0.

CORS:

- `https://app.replymesh.cloud`: permitido.
- `https://demohamburgueria.replymesh.cloud`: permitido.
- `https://testemultiempresa.replymesh.cloud`: permitido.
- `https://evil.example.com`: rejeitado, sem
  `Access-Control-Allow-Origin`.

Master autenticado com token efemero gerado em memoria:

- `GET /api/v1/master/dashboard`: 200.
- `GET /api/v1/master/companies`: 200.
- `GET /api/v1/master/whatsapp/instances`: 200.
- Instancias retornadas ao Master: 4 registros.

Loja Teste Multiempresa autenticada:

- `GET /api/v1/auth/me`: 200.
- `GET /api/v1/store/dashboard`: 200.
- `GET /api/v1/store/whatsapp/instances`: 200, uma instancia da empresa.
- `GET /api/v1/store/whatsapp/templates`: 200.
- `GET /api/v1/store/orders?limit=1`: 200.

Contagem Rails somente leitura:

- Empresas: 4.
- Instancias WhatsApp: 3.
- Instancias conectadas/open: 2.
- Instancias da Demo: 1.
- Instancias da Teste Multiempresa: 1.

Os testes autenticados geraram apenas os registros operacionais normais de
login/auditoria. Nao houve migration, seed, alteracao estrutural ou importacao.

Bundles publicados:

- Master publicado: sem referencia a `localhost:3000`; usa
  `https://api.replymesh.cloud`.
- Store publicada: sem referencia a `localhost:3000`; usa
  `https://api.replymesh.cloud`.

## SSL

Validos:

- `api.replymesh.cloud`: Let's Encrypt, verify code 0.
- `app.replymesh.cloud`: Let's Encrypt, verify code 0.
- `demohamburgueria.replymesh.cloud`: Let's Encrypt, verify code 0.

Corrigido na Fase 16.13.1:

- `testemultiempresa.replymesh.cloud`
- Subject: `CN = testemultiempresa.replymesh.cloud`
- Issuer: Let's Encrypt `YR1`
- Validade: 2026-06-09 ate 2026-09-07
- Verify return code: `0 (ok)`
- HTTP: 200 sem `-k`

Configuracao operacional alterada somente na VPS:

- `/etc/dokploy/traefik/dynamic/replymesh-store.yml`
- Router HTTP individual com redirect para HTTPS.
- Router HTTPS individual com `certResolver: letsencrypt`.
- Service preservado: `replymesh-store-service`.
- Backup:
  `/etc/dokploy/traefik/dynamic/replymesh-store.yml.pre-16-13-1-20260609-041714.bak`

O Traefik recarregou a configuracao dinamicamente. Nenhum container foi
reiniciado.

## Estado local, GitHub e VPS

- Antes do commit, local, GitHub/main e source da VPS estavam no mesmo commit
  base.
- Os arquivos legitimos exclusivos da VPS foram consolidados no local.
- Backups e relatorios exclusivos de operacao foram mantidos fora do Git.
- A configuracao Traefik e exclusiva da VPS e nao entra no Git.

## Validacao de regressao apos SSL

- `https://api.replymesh.cloud/up`: 200, TLS verify 0.
- `https://app.replymesh.cloud/dashboard`: 200, TLS verify 0.
- `https://app.replymesh.cloud/whatsapp`: 200, TLS verify 0.
- `https://demohamburgueria.replymesh.cloud`: 200, TLS verify 0.
- `https://testemultiempresa.replymesh.cloud`: 200, TLS verify 0.
- `demopizza.replymesh.cloud`: 200.
- `marinho.replymesh.cloud`: 200.
- `infra.replymesh.cloud`: 200.
- `create.replymesh.cloud`: 200.
- CORS da Teste Multiempresa: permitido com headers, methods e origin.

## Pendencias

- Executar a suite RSpec completa em ambiente com todas as gems instaladas.
- O proximo ciclo funcional permanece IA/RAG Carina e IA da loja.

## Proximo foco depois da release

- IA/RAG Carina.
- IA da loja.

Esses focos nao foram iniciados.
