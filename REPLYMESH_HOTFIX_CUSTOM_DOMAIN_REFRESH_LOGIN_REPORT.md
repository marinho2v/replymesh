# Replymesh Hotfix - Custom Domain Refresh/Login

Data: 2026-06-18

## Problema

Ao atualizar `https://lanchesdo2r.com.br/admin/dashboard`, a Store ficava presa em tela preta com loader.

## Causa

No dominio customizado, o frontend gravava `lanchesdo2r.com.br` como `replymesh_store_company_slug` antes da API retornar o slug canonico da empresa (`lanchedo2r`). Isso fazia a autenticacao da loja alternar entre dominio customizado e slug real, gerando reload de sessao e loop de carregamento.

## Correcao aplicada

Arquivo alterado:

- `store-template/src/contexts/CompanySlugContext.jsx`

A Store agora:

- usa o dominio custom apenas como identificador inicial;
- resolve a empresa pela API publica;
- grava o slug canonico retornado pela API (`lanchedo2r`);
- evita disparar troca de autenticacao antes da resolucao canonica.

## Deploy

Publicado somente build estatico da Store.

Backup da Store antes da publicacao:

- `/opt/replymesh/backups/store-domain-refresh-fix-20260618-012140`

## Validacoes

- `npm run build` em `store-template`: OK
- `git diff --check`: OK
- `https://lanchesdo2r.com.br/login`: HTTP 200
- `https://lanchedo2r.replymesh.cloud/login`: HTTP 200
- API publica por dominio custom retorna loja `Lanche do 2R`: OK
- Reload em `https://lanchesdo2r.com.br/admin/dashboard` com perfil limpo:
  - redireciona para `/login`;
  - nao fica preso no loader;
  - sem erro de console relevante.
- LocalStorage no dominio custom:
  - `replymesh_store_company_slug = lanchedo2r`
  - `replymesh_store_company_id = 19`

## Observacao

Nao houve alteracao em API, banco, Evolution, Mercado Pago, Traefik ou SSL.
