# Replymesh - Hotfix Dominio Custom 2R

Data: 2026-06-16

## Objetivo

Fazer os dominios abaixo abrirem a loja `lanchedo2r`:

- `https://lanchesdo2r.com.br`
- `https://www.lanchesdo2r.com.br`

## Diagnostico

- DNS ja apontava para a VPS `2.24.96.109`.
- O navegador recebia `404 page not found` do Traefik.
- A tabela `domains` possuia `lanchesdo2r.com.br` ativo, primario e com SSL ativo.
- `www.lanchesdo2r.com.br` nao existia na tabela antes do hotfix.
- O arquivo `/etc/dokploy/traefik/dynamic/replymesh-store-generated.yml` nao continha routers para `lanchesdo2r.com.br`.
- O script `sync-replymesh-store-routers.sh` gerava apenas dominios `*.replymesh.cloud`.
- A Store tambem so detectava tenant via `*.replymesh.cloud`, sem suporte inicial a dominio custom.

## Correcao Aplicada

- API publica agora resolve empresa por:
  - slug;
  - subdominio Replymesh;
  - dominio custom ativo na tabela `domains`;
  - `www.` apontando para dominio raiz ativo.
- Route constraint ajustada para aceitar identificadores publicos com ponto no path.
- Store agora detecta dominio custom pelo hostname.
- Login/admin em dominio custom passa a usar o slug real retornado pela API publica.
- Script de Traefik agora inclui `Domain` custom ativo e gera tambem o `www`.
- Criado registro de dominio `www.lanchesdo2r.com.br` para a empresa `lanchedo2r`.
- Script normalizado para LF na VPS apos detectar CRLF no arquivo instalado.

## Backups

- `/root/replymesh-backups/custom-domain-2r-20260616-150856`
- `/root/replymesh-backups/custom-domain-store-dist-20260616-150952`

## Arquivos Alterados

- `replymesh-api/app/controllers/api/v1/public/base_controller.rb`
- `replymesh-api/config/routes.rb`
- `store-template/src/utils/companyDomain.js`
- `store-template/src/pages/auth/Login.jsx`
- `store-template/src/contexts/CompanySlugContext.jsx`
- `scripts/sync-replymesh-store-routers.sh`

## Validacoes

- `ruby -c replymesh-api/app/controllers/api/v1/public/base_controller.rb`: OK
- `ruby -c replymesh-api/config/routes.rb`: OK
- `npm run build` em `store-template`: OK
- `git diff --check`: OK
- Auditoria simples de segredos nos arquivos alterados: OK
- `bash -n /usr/local/bin/sync-replymesh-store-routers.sh` na VPS: OK
- `https://lanchesdo2r.com.br`: HTTP 200
- `https://www.lanchesdo2r.com.br`: HTTP 200
- `https://lanchedo2r.replymesh.cloud`: HTTP 200
- `https://lanchesdo2r.com.br/admin/login`: HTTP 200
- `https://lanchesdo2r.com.br/checkout`: HTTP 200
- `https://lanchesdo2r.com.br/promocoes`: HTTP 200
- SSL `lanchesdo2r.com.br`: `Verify return code: 0 (ok)`
- SSL `www.lanchesdo2r.com.br`: `Verify return code: 0 (ok)`
- API publica por `lanchedo2r`: `success=true`, `slug=lanchedo2r`
- API publica por `lanchesdo2r.com.br`: `success=true`, `slug=lanchedo2r`
- API publica por `www.lanchesdo2r.com.br`: `success=true`, `slug=lanchedo2r`

## Observacao Operacional

A API foi atualizada com hotfix controlado no container em producao e a Store foi publicada como bundle estatico. Proximo rebuild limpo da API deve incluir este commit para eliminar diferenca entre imagem e codigo versionado.

## Resultado

DOMINIO CUSTOM 2R FUNCIONANDO.
