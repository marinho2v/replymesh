# Replymesh - Sincronizacao do acesso Super Admin a empresa

Data: 2026-06-20

## Problema

O Painel Master gerava o acesso temporario em `/admin/impersonate` usando parametros no fragmento da URL (`#token=...`). A Store publicada em producao estava com um bundle anterior que consultava apenas a query string. O resultado era a tela `Acesso nao autorizado` com a mensagem `Acesso temporario invalido ou incompleto`.

## Causa

O codigo corrigido ja estava versionado no commit `de01425` (`Replymesh Fix Superadmin Store Impersonation`), mas o artefato estatico da Store em producao nao continha essa versao.

## Correcao aplicada

- Build limpo do `store-template` a partir da branch `dev`.
- API de producao definida explicitamente como `https://api.replymesh.cloud/api/v1` durante o build.
- Publicacao somente da Store em `/opt/replymesh/store`.
- Nenhuma alteracao em banco, API, Evolution, Mercado Pago, Traefik ou DNS.

## Backup

`/opt/replymesh/backups/store-before-impersonation-fix-20260620-125414.tgz`

## Validacoes

- `npm run build`: passou, 3000 modulos transformados.
- Store `/admin/impersonate`: HTTP 200.
- Chunk `MasterImpersonation`: HTTP 200.
- Bundle publicado consulta `window.location.search` e `window.location.hash`.
- API `/up`: HTTP 200.
- Master: HTTP 200.
- Bundle sem `http://127.0.0.1` e sem `http://localhost`.

## Resultado

O fluxo publicado aceita o formato atual gerado pelo Master e mantem compatibilidade com query string. O source versionado ja continha a correcao; esta etapa alinhou o artefato de producao e documentou a publicacao.
