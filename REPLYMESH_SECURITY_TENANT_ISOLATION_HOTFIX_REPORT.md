# Replymesh - Security Tenant Isolation Hotfix

Data: 2026-06-15

## Resultado

Status: PASSOU

O acesso cruzado entre empresas foi bloqueado no backend e no frontend. Tokens
validos nao bastam mais para acessar um subdominio de outra empresa.

## Problema confirmado

Foram encontrados dois pontos de risco:

1. A Store mantinha sessao em chaves globais de `localStorage`
   (`replymesh_store_token`, `replymesh_store_user`, `replymesh_store_profile`).
   Isso permitia carregar um perfil antigo ao trocar de subdominio.
2. A API da Store permitia que um token normal de `super_admin` escolhesse uma
   empresa por header/parametro. O acesso correto do Master precisa ser uma
   sessao de impersonacao auditada.

Antes do hotfix, um token comum de super admin retornava HTTP 200 em
`/api/v1/store/dashboard` com `X-Company-Slug: lanchedo2r`.

## Correcao aplicada

### Backend

- `Api::V1::Store::BaseController` agora:
  - resolve explicitamente a empresa solicitada por `X-Company-Slug`,
    `X-Company-Id` ou parametros;
  - valida que `current_user` possui `company_member` ativo exatamente naquela
    empresa;
  - retorna HTTP 403 com `error: tenant_forbidden` quando o usuario nao pertence
    ao tenant;
  - bloqueia super admin sem sessao de impersonacao valida;
  - preserva impersonacao auditada do Master.
- `/api/v1/company/settings` passou a herdar a mesma protecao da Store.
- Portal motoboy agora exige `company_member` ativo com role `motoboy`, alem do
  token com `company_id` e cadastro ativo de motoboy.

### Frontend Store

- Sessao comum da loja passou a ser armazenada por tenant:
  `replymesh:store:<slug>:auth:<campo>`.
- Sessao antiga/global e migrada somente se pertencer ao slug atual; se nao
  pertencer, e removida.
- `buildReplymeshProfile` nao usa mais o primeiro vinculo como fallback.
  Se nao houver membership ativo para a empresa atual, o login falha.
- Ao receber `403 tenant_forbidden`, a Store limpa a sessao e redireciona para
  `/login` com mensagem de sessao pertencente a outra empresa.

## Arquivos alterados

- `replymesh-api/app/controllers/api/v1/store/base_controller.rb`
- `replymesh-api/app/controllers/api/v1/company_settings_controller.rb`
- `replymesh-api/app/controllers/api/v1/motoboy/base_controller.rb`
- `replymesh-api/app/controllers/api/v1/motoboy/auth/sessions_controller.rb`
- `replymesh-api/spec/requests/multi_tenant_spec.rb`
- `store-template/src/services/storeAuthStorage.js`
- `store-template/src/services/auth.js`
- `store-template/src/contexts/AuthContext.jsx`
- `store-template/src/contexts/CompanySlugContext.jsx`
- `store-template/src/services/replymeshApi.js`
- `store-template/src/pages/auth/Login.jsx`

## Validacoes locais

- `ruby -c` nos arquivos Ruby alterados: PASSOU
- `npm run build` em `store-template`: PASSOU
- `git diff --check` no escopo: PASSOU
- Auditoria de segredos no diff: PASSOU
- RSpec local: nao executou por gems nativas ausentes no Windows
  (`puma`, `bcrypt`, `bootsnap`, entre outras). Nenhuma gem foi instalada.

## Backup e deploy

- Backup:
  `/opt/replymesh/backups/security-tenant-isolation-20260615-170809`
- Imagem API ativa:
  `replymesh-api:v1.0.0-tenant-security-isolation-rc1`
- Container rollback API:
  `replymesh-rails-api.pre-tenant-security-20260615-171132`
- Rollback Store:
  `/opt/replymesh/store.pre-tenant-security-20260615-171132`
- API `/up`: HTTP 200
- Nenhuma migration, seed, reset ou drop executado
- Nenhuma alteracao em Mercado Pago ou Evolution
- Nenhum commit ou tag criado

## Validacao de producao

Empresas usadas:

- Empresa A: `lanchedo2r`
- Empresa B: `teste-rotas-global`

Resultados:

| Teste | Resultado |
| --- | --- |
| Admin A em `lanchedo2r` dashboard | HTTP 200 |
| Admin A em `teste-rotas-global` dashboard | HTTP 403 `tenant_forbidden` |
| Admin A em orders B | HTTP 403 `tenant_forbidden` |
| Admin A em products B | HTTP 403 `tenant_forbidden` |
| Admin A em categories B | HTTP 403 `tenant_forbidden` |
| Admin A em reports B | HTTP 403 `tenant_forbidden` |
| Admin A em users B | HTTP 403 `tenant_forbidden` |
| Admin A em cash_sessions B | HTTP 403 `tenant_forbidden` |
| Admin A em POS B | HTTP 403 `tenant_forbidden` |
| Admin A em company/settings B | HTTP 403 `tenant_forbidden` |
| Admin B em `teste-rotas-global` dashboard | HTTP 200 |
| Admin B em `lanchedo2r` dashboard | HTTP 403 `tenant_forbidden` |
| Super admin sem impersonacao em Store | HTTP 403 `tenant_forbidden` |
| Master `/api/v1/master/companies` | HTTP 200 |
| Cozinha em empresa correta | HTTP 200 |
| Cozinha em empresa errada | HTTP 403 `tenant_forbidden` |
| Motoboy em empresa correta | HTTP 200 |
| Token motoboy forjado para outra empresa | HTTP 401 |

## Validacao navegador

Foi simulada uma sessao antiga/global com perfil de `lanchedo2r` e aberto:

`https://teste-rotas-global.replymesh.cloud/admin/dashboard`

Resultado:

- Redirecionou para:
  `https://teste-rotas-global.replymesh.cloud/login`
- Removeu `replymesh_store_token` legado.
- Nao carregou dashboard da empresa errada.

## Pendencias

- Recomenda-se remover futuramente os aliases legados de localStorage apos uma
  janela de migracao, mas eles ja sao limpos quando nao pertencem ao tenant
  atual.

## Conclusao

O isolamento multiempresa foi corrigido no backend e no frontend. Cada usuario
so consegue acessar empresas onde possui `company_member` ativo. O Master
continua funcional e a Store exige impersonacao auditada para suporte.
