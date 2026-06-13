# REPLYMESH PHASE 16.32 - Commercial Blockers Resolution Report

Data: 2026-06-13

Escopo: correcoes finais dos bloqueios comerciais da Fase 16.31 em producao real.

## Backup

- Backup criado antes das alteracoes:
  `/opt/replymesh/backups/phase-16-32-20260613-013018`
- Inclui source, store, master, configuracoes Dokploy/Traefik disponiveis, compose Evolution e inventario Docker.

## Bloco 1 - SSL automatico generico

### Diagnostico

- DNS wildcard `*.replymesh.cloud` resolve para `2.24.96.109`.
- Traefik usa ACME HTTP-01 (`certResolver: letsencrypt`).
- Nao foram encontradas credenciais DNS-01 na VPS.
- Router `HostRegexp` atende o site, mas nao emite certificado valido por host generico. Por isso hosts novos caiam no `TRAEFIK DEFAULT CERT`.

### Solucao escolhida

Foi implementada a opcao B/C: provisionamento automatico de routers individuais por empresa ativa.

Arquivos criados/alterados na VPS:

- `/opt/replymesh/scripts/sync-replymesh-store-routers.sh`
- `/etc/dokploy/traefik/dynamic/replymesh-store-generated.yml`
- `/etc/cron.d/replymesh-store-router-sync`

Funcionamento:

- O script le empresas ativas no Rails.
- Gera routers HTTP/HTTPS individuais para subdominios `*.replymesh.cloud`.
- O Traefik recarrega automaticamente via file provider.
- Cron executa a cada 2 minutos.

### QA criada

- Empresa: `QA SSL Auto 16.32`
- Slug: `qa-ssl-auto-16-32`
- Subdominio: `qa-ssl-auto-16-32.replymesh.cloud`

Validacao:

| Teste | Resultado |
|---|---|
| HTTPS | 200 |
| Certificado | Lets Encrypt |
| Subject | `qa-ssl-auto-16-32.replymesh.cloud` |
| Verify return code | 0 |

Status: PASSOU.

## Bloco 2 - Evolution webhook Supabase legado

### Diagnostico

O compose da Evolution possuia webhook global legado:

- `WEBHOOK_GLOBAL_ENABLED=true`
- `WEBHOOK_EVENTS_MESSAGES_UPSERT=true`
- `WEBHOOK_URL` apontando para Supabase legado

### Alteracao realizada

Arquivo alterado:

- `/docker/evolution-go-1dvv/docker-compose.yml`

Backup:

- `/docker/evolution-go-1dvv/docker-compose.yml.pre-16-32-*.bak`
- Backup sanitizado de variaveis em `/opt/replymesh/backups/evolution-webhook-env-pre-16-32-*.txt`

Configuracao aplicada:

- `WEBHOOK_GLOBAL_ENABLED=false`
- `WEBHOOK_EVENTS_MESSAGES_UPSERT=false`
- `WEBHOOK_URL=""`

Recriacao:

- Recriado somente o servico `api` da Evolution.
- Banco Postgres Evolution nao foi reiniciado.
- Instancia Lanche nao foi alterada diretamente.
- Nenhuma sessao foi apagada.
- Nenhum QR foi gerado.

Validacao:

| Item | Resultado |
|---|---|
| Container Evolution API | online |
| `WEBHOOK_GLOBAL_ENABLED` | false |
| `WEBHOOK_EVENTS_MESSAGES_UPSERT` | false |
| `WEBHOOK_URL` | vazio |
| Instancias no banco Evolution | preservadas |
| `marinho.replymesh.cloud/manager/instances` | 200 |

Instancias auditadas por tipo de webhook:

| Instancia | Webhook |
|---|---|
| Lanche | legado/proprio, preservado |
| replymesh_demohamburgueria_qr | Rails |
| replymesh_gabs | Rails |
| replymesh_negao | Rails |
| replymesh_testemultiempresa | Rails |

Status: PASSOU.

Observacao: foi observado evento recente chegando no Rails para a instancia Demo apos a mudanca. Logs sensiveis nao foram incluidos neste relatorio.

## Bloco 3 - Master -> Store visual completo

### Backend

Arquivos alterados:

- `replymesh-api/config/routes.rb`
- `replymesh-api/app/controllers/api/v1/master/companies_controller.rb`
- `replymesh-api/app/models/store_setting.rb`

Rotas adicionadas:

- `GET /api/v1/master/companies/:id/store_settings`
- `PATCH /api/v1/master/companies/:id/store_settings`

Campos suportados:

- `store_name`
- `description` mapeado para `hero_subtitle`
- `phone`
- `whatsapp`
- `logo_url`
- `banner_url`
- `cover_url`
- `primary_color`
- `secondary_color`
- `pix_key`
- `pix_receiver_name`
- `minimum_order_amount`
- `estimated_delivery_minutes`
- `store_status`
- `pix_enabled`
- campos visuais hero/template existentes

Observacao tecnica:

- A tabela `store_settings` nao possui coluna propria `favicon_url` nem `description`.
- Nao foi criada migration desnecessaria.
- `favicon_url` retorna `nil` de forma segura se a coluna nao existir.
- `description` foi mapeado para `hero_subtitle`.

### Frontend Master

Arquivos alterados:

- `replymesh-frontend/src/services/api.js`
- `replymesh-frontend/src/pages/empresas/EmpresaDetalhe.jsx`

Tela de edicao da empresa agora possui secao:

- Visual e loja publica

### Validacao

Empresa testada:

- `qa-commercial-16-31`

Resultados:

| Teste | Resultado |
|---|---|
| Login Master | OK |
| `GET /master/companies/:id/store_settings` | 200 |
| `PATCH /master/companies/:id/store_settings` | 200 |
| Store publica refletiu nome | OK |
| Store publica refletiu PIX | OK |
| Sem rebuild da Store | OK |

Status: PASSOU.

## Bloco 4 - Login motoboy com telefone normalizado

Arquivos alterados:

- `replymesh-api/app/services/phone_normalizer.rb`
- `replymesh-api/app/models/motoboy.rb`
- `replymesh-api/app/controllers/api/v1/motoboy/auth/sessions_controller.rb`

Normalizacao:

- remove mascara
- remove DDI `55` quando houver mais de 11 digitos
- compara ultimos 11 digitos quando aplicavel

Empresa testada:

- `qa-commercial-16-31`

Resultados:

| Telefone | Resultado |
|---|---|
| `21959099803` | 200 |
| `+55 21 95909-9803` | 200 |
| `55 21 95909-9803` | 200 |
| `(21) 95909-9803` | 200 |
| `21 95909-9803` | 200 |
| invalido `000` | 401 |

Status: PASSOU.

## Deploy controlado

API:

- Imagem criada: `replymesh-api:phase-16-32-commercial-blockers`
- Container recriado: `replymesh-rails-api`
- Sem migrations.
- Sem seeds.
- Sem reset/drop.

Master:

- Build executado com:
  `VITE_API_URL=https://api.replymesh.cloud/api/v1`
- Publicado em:
  `/opt/replymesh/master`
- Grep por `localhost`/`127.0.0.1`: sem ocorrencias no build publicado.

Store:

- `npm run build` executado localmente com sucesso.
- Store nao precisou ser republicada porque nao houve alteracao nela nesta fase.

## Validacoes finais

| Item | Resultado |
|---|---|
| `ruby -c` arquivos Ruby alterados | OK |
| `npm run build` Master | OK |
| `npm run build` Store | OK |
| `git diff --check` | OK, apenas warnings de LF/CRLF |
| Auditoria basica de segredos nos arquivos alterados | OK, sem segredo real |
| `https://api.replymesh.cloud/up` | 200 |
| `https://app.replymesh.cloud/dashboard` | 200 |
| `https://demohamburgueria.replymesh.cloud` | 200 |
| `https://qa-ssl-auto-16-32.replymesh.cloud` | 200 |
| Certificado QA SSL auto | Lets Encrypt, verify 0 |
| Evolution API | online |
| Master altera StoreSetting | OK |
| Store publica reflete Master | OK |
| Motoboy com `+55` | OK |

## Arquivos de codigo alterados

- `replymesh-api/app/services/phone_normalizer.rb`
- `replymesh-api/app/models/motoboy.rb`
- `replymesh-api/app/controllers/api/v1/motoboy/auth/sessions_controller.rb`
- `replymesh-api/app/models/store_setting.rb`
- `replymesh-api/app/controllers/api/v1/master/companies_controller.rb`
- `replymesh-api/config/routes.rb`
- `replymesh-frontend/src/services/api.js`
- `replymesh-frontend/src/pages/empresas/EmpresaDetalhe.jsx`

## Arquivos de producao/infra alterados

- `/opt/replymesh/scripts/sync-replymesh-store-routers.sh`
- `/etc/dokploy/traefik/dynamic/replymesh-store-generated.yml`
- `/etc/cron.d/replymesh-store-router-sync`
- `/docker/evolution-go-1dvv/docker-compose.yml`

## Commit/tag

Nao foi criado commit nem tag nesta fase.

Sugestao apos revisao:

- Commit: `Replymesh Resolve Commercial Blockers v0.15.42 RC1`
- Tag: `v0.15.42-commercial-blockers-rc1`

## Resultado

FASE 16.32 CONCLUIDA.
