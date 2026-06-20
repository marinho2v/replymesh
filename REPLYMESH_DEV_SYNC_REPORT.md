# REPLYMESH DEV SYNC REPORT

Data: 2026-06-19

## Objetivo

Sincronizar a branch `dev` local com `origin/dev` sem perder commits locais e sem misturar alteracoes soltas nao validadas.

## Estado inicial

- Branch: `dev`
- Antes do `fetch`: `ahead 3`, `behind 1`
- Depois do `fetch`: `ahead 2`, `behind 3`
- VPS: nao alterada
- `main`: nao alterada
- Deploy: nao executado

## Commits locais preservados

- `70c56ee` - Replymesh Add Configurable Marketing Landing Page
- `882f443` - Merge remote-tracking branch 'origin/main' into dev

## Commits remotos incorporados

- `37bbdc7` - Replymesh Fix Product Category Selection And PDV Menu Order
- `c93cded` - Replymesh Optimize Public Store Performance
- `2fb8ea1` - Merge main performance hotfix into dev preserving advanced pizza

## Alteracoes nao commitadas preservadas

As alteracoes soltas foram preservadas em stash nomeado:

- `stash@{0}` - `dev-pending-before-sync-origin-dev`

Arquivos preservados no stash:

- Alteracoes de API/Store/Pizzaria ainda nao validadas
- Relatorios de ambiente dev
- Arquivos locais de ambiente dev

Nada desse pacote foi enviado ao GitHub nesta sincronizacao.

## Conflitos

Houve conflito em:

- `store-template/src/pages/admin/Products.jsx`

Resolucao:

- Preservado o helper `toSelectId` do fluxo de produtos/pizzaria.
- Removida duplicacao do helper apos validacao do build.

## Arquivos incorporados do remoto

- `REPLYMESH_HOTFIX_PUBLIC_STORE_PERFORMANCE_REPORT.md`
- `replymesh-api/app/controllers/api/v1/public/stores_controller.rb`
- `replymesh-api/config/application.rb`
- `store-template/src/components/layout/PublicLayout.jsx`
- `store-template/src/contexts/CompanySlugContext.jsx`
- `store-template/src/hooks/usePublicStoreInfo.js`
- `store-template/src/services/publicApi.js`

## Validacoes executadas

- `ruby -c replymesh-api/app/controllers/api/v1/public/stores_controller.rb`: OK
- `npm run build` em `store-template`: OK
- `npm run build` em `replymesh-frontend`: OK
- `git diff --cached --check`: OK
- Auditoria de segredos no diff staged: OK, sem segredos reais encontrados

## Auditoria de segredos

Nao foram incluidos:

- `.env`
- `master.key`
- `credentials`
- `node_modules`
- `dist`
- logs
- backups
- dumps
- tokens reais
- senhas

Ocorrencias encontradas na busca eram apenas referencias textuais/campos sem valor sensivel, como `token: null`.

## Status

Sincronizacao pronta para push em `origin/dev` apos conclusao do merge.

## Pendencias

- Revisar o stash `dev-pending-before-sync-origin-dev` em uma etapa separada.
- Decidir se as alteracoes de Store/Pizzaria/relatorios/env dev do stash devem virar commit separado ou permanecer fora do Git.
