# Replymesh - Hotfix Store Bundle Invalid Token

Data: 2026-06-14

## Resultado

STORE RESTAURADA.

## Causa

O build publicado continha 10 chunks JavaScript preenchidos integralmente com bytes nulos (`0x00`).
O arquivo principal estava integro, mas os imports dinamicos desses chunks causavam:

`SyntaxError: Invalid or unexpected token`

O primeiro rebuild gerou os mesmos nomes de assets antigos. Como navegadores podiam manter os
arquivos corrompidos em cache, foi aplicado um identificador novo nos nomes do build.

## Backup

Backup criado antes da publicacao:

`/opt/replymesh/backups/hotfix-store-invalid-token-20260614-172439/store-current`

## Alteracoes

- `store-template/vite.config.js`
  - identificador dos assets alterado para `20260614-hotfix`;
  - evita reutilizacao dos chunks corrompidos em cache.
- `store-template/src/app/router.jsx`
  - adicionado alias `/admin/login` para a tela oficial de login da loja.

Nenhuma alteracao foi feita em banco, Evolution, Mercado Pago ou API.
Nenhuma migration, seed, reset ou drop foi executado.
Nenhum commit ou tag foi criado.

## Build e publicacao

- 2.993 modulos transformados.
- 92 chunks JavaScript validados.
- Chunks com byte nulo: 0.
- Erros de sintaxe: 0.
- Referencias a `localhost` ou `127.0.0.1`: 0.
- Nginx: configuracao valida.
- Container `replymesh-store`: running, sem reinicio.

## Validacao publica

Todos retornaram HTTP 200:

- `https://demohamburgueria.replymesh.cloud/`
- `https://qa-rc1-16-33.replymesh.cloud/`
- `https://demohamburgueria.replymesh.cloud/admin/login`
- `https://demohamburgueria.replymesh.cloud/admin/pos`
- `https://demohamburgueria.replymesh.cloud/checkout`

Validacao em navegador:

- Demo Hamburgueria carregou normalmente.
- QA RC1 16.33 carregou normalmente.
- `/admin/login` exibiu o formulario de login.
- `/checkout` exibiu a tela de finalizacao.
- `/admin/pos` carregou o app sem erro de bundle; o conteudo depende de sessao autorizada.
- Nenhum novo `Invalid or unexpected token` foi registrado no console.

## Master

O Master nao foi alterado. Uma nova autenticacao foi realizada e os endpoints retornaram:

- `/api/v1/master/branding`: HTTP 200.
- `/api/v1/master/notifications`: HTTP 200.
- `/api/v1/master/dashboard`: HTTP 200.
- `/api/v1/master/companies`: HTTP 200.

Os 401 anteriores eram causados por sessao expirada.
