# REPLYMESH FASE 16.19 - Template Padrao, Logo, Favicon e Landing Principal

Data: 2026-06-09

## Status

FASE 16.19 CONCLUIDA.

## Versionamento

- Commit publicado: `498e33b`
- Tag publicada: `v0.15.30-template-landing-rc1`
- Mensagem: `Replymesh Default Template and Landing v0.15.30 RC1`

## Backup VPS

- Backup criado em: `/opt/replymesh/backups/pre-phase-16-19-20260609-233722`
- Itens incluidos: source, master, store, nginx configs, Traefik/Dokploy dynamic config e checksums.

## Backend

- Imagem publicada: `replymesh-api:v0.15.30-template-landing-rc1`
- Container recriado: `replymesh-rails-api`
- Migrations executadas:
  - `20260609203000 CreateFeatureGates`
  - `20260609204500 AddExpiresAtToCompanyFeatureOverrides`
  - `20260609211500 ChangeStoreSettingsDefaultVisualTemplate`
- Seeds/reset/drop/importacoes: nao executados.

## Template Padrao

- Novo padrao para empresas novas: `hamburgueria-premium`
- `Hamburgueria Classic`: mantido no codigo para lojas antigas, mas marcado como inativo e removido da escolha visual.
- Templates ativos para escolha:
  - `hamburgueria-premium`
  - `bebidas-neon`
  - `doceria-clean`

## Logo, Favicon e Banner

- Empresas novas recebem fallback:
  - Logo: `/logo.png`
  - Banner/capa: `/capa.jpeg`
- Moldura preta/amarela da logo removida no componente compartilhado.

## Landing Principal

- `https://replymesh.cloud` publicado com a nova landing.
- O bundle foi republicado com API correta: `https://api.replymesh.cloud/api/v1`.
- Validado que o bundle publicado nao contem chamadas para `http://127.0.0.1:3000` ou `http://localhost:3000`.

## Empresa de Homologacao

- Empresa criada: `Homologacao Template 16.19`
- Slug: `homologacao-template-1619`
- Dominio: `https://homologacao-template-1619.replymesh.cloud`
- Status: active
- Template: `hamburgueria-premium`
- Logo: `/logo.png`
- Banner: `/capa.jpeg`
- Banners ativos: 1
- Instancias WhatsApp: 0

## SSL Homologacao

- Router individual criado apenas para `homologacao-template-1619.replymesh.cloud`.
- Backup Traefik: `/etc/dokploy/traefik/dynamic/replymesh-store.yml.pre-16-19-20260609-235620.bak`
- Validacao SSL: `Verify return code: 0 (ok)`

## Validacoes

- `https://api.replymesh.cloud/up`: 200
- `https://app.replymesh.cloud/dashboard`: 200
- `https://replymesh.cloud`: 200
- `https://demohamburgueria.replymesh.cloud`: 200
- `https://homologacao-template-1619.replymesh.cloud`: 200
- API publica homologacao `/store`: 200
- API publica homologacao `/menu`: 200

## Containers

- Alterado/recriado: `replymesh-rails-api`
- Nao reiniciados:
  - Evolution Go
  - PostgreSQL Evolution
  - Dokploy
  - Redis Dokploy
  - PostgreSQL Dokploy
  - Traefik
  - `replymesh-store`
  - `replymesh-master`
  - `replymesh-blank-site`

## Observacoes

- A VPS possui Node 18.19.1, abaixo do exigido pelo Vite atual. O build foi feito no ambiente local validado e publicado como arquivo estatico.
- `/etc/replymesh-api.env` parece conter `RAILS_MASTER_KEY` antiga/invalida; o deploy da API usou as variaveis ja carregadas no container ativo, sem imprimir segredos.
- Nenhum segredo foi impresso ou versionado.
