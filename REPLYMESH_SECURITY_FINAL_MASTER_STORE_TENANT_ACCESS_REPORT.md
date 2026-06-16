# ReplyMesh - Security Final Master/Store Tenant Access Report

Data: 2026-06-16

## Objetivo

Corrigir definitivamente o isolamento de autenticacao entre Painel Master, Store/Admin por empresa e tenants de loja.

## Escopo Executado

- Master: somente usuario com `global_role = super_admin` acessa `/api/v1/master/*`.
- Store: sessao local validada contra a API antes de renderizar painel/admin.
- Store: token de outra empresa e super admin sem impersonacao auditada sao bloqueados.
- Frontend Master: sessao so e aceita/salva se o usuario for `super_admin`.
- Frontend Store: sessao namespaced por slug continua sendo usada e agora passa por validacao ativa em `/api/v1/store/features`.

## Backup VPS

Backup criado antes do deploy controlado:

`/opt/replymesh/backups/final-tenant-auth-20260616-031436`

Arquivos incluidos no backup:

- `master-current.tgz`
- `store-current.tgz`
- `api-auth-files-current.tgz`

## Arquivos Alterados

Backend:

- `replymesh-api/app/controllers/application_controller.rb`
- `replymesh-api/spec/requests/authentication_spec.rb`

Frontend Master:

- `replymesh-frontend/src/services/api.js`
- `replymesh-frontend/src/components/auth/RequireAuth.jsx`
- `replymesh-frontend/src/pages/Login.jsx`
- `replymesh-frontend/src/App.jsx`

Frontend Store:

- `store-template/src/services/auth.js`
- `store-template/src/contexts/AuthContext.jsx`

## Deploy Controlado

Alteracoes publicadas em producao:

- API: `application_controller.rb` aplicado no source e no container `replymesh-rails-api`.
- Master: build publicado em `/opt/replymesh/master`.
- Store: build publicado em `/opt/replymesh/store`.
- Container reiniciado: apenas `replymesh-rails-api`.

Nao foram alterados:

- Evolution
- Mercado Pago
- Banco estrutural
- Migrations
- Seeds
- Reset/drop
- DNS/SSL/Traefik

## Validacoes Tecnicas Locais

- `ruby -c replymesh-api/app/controllers/application_controller.rb`: OK
- `ruby -c replymesh-api/spec/requests/authentication_spec.rb`: OK
- `npm run build` em `store-template`: OK
- `npm run build` em `replymesh-frontend`: OK
- `git diff --check` nos arquivos alterados: OK
- Auditoria simples de segredos nos arquivos alterados: OK
- RSpec focado: bloqueado localmente por gems ausentes no Windows (`puma`, `bcrypt`, `bootsnap`, `msgpack`, etc.).

## Validacao Producao

Health checks:

- `https://api.replymesh.cloud/up`: 200
- `https://app.replymesh.cloud/login`: 200
- `https://app.replymesh.cloud/dashboard`: 200
- `https://lanchedo2r.replymesh.cloud/`: 200
- `https://lanchedo2r.replymesh.cloud/admin/login`: 200
- `https://lanchedo2r.replymesh.cloud/admin/dashboard`: 200

Validacao real no navegador:

- Login com usuario da pizzaria em `https://lanchedo2r.replymesh.cloud/login`: PASSOU - permaneceu no login, nao renderizou painel do 2R, nao chamou dashboard/orders.
- Login com o mesmo usuario em `https://pizzashow.replymesh.cloud/login`: PASSOU - abriu `https://pizzashow.replymesh.cloud/admin/dashboard`.
- API para o usuario da pizzaria:
  - `X-Company-Slug: pizzashow`: 200
  - `X-Company-Slug: lanchedo2r`: 403 `tenant_forbidden`

Bundles publicados:

- Referencias a `localhost` ou `127.0.0.1`: nenhuma encontrada em `/opt/replymesh/master` e `/opt/replymesh/store`.

## Matriz de Acesso Validada

Empresas usadas:

- Empresa A: `lanchedo2r`
- Empresa B: `pizzashow`

Usuarios usados:

- Super admin: `admin@replymesh.cloud`
- Admin A: `admin@lanchedo2r.replymesh.cloud`
- Admin B: `pizzashow@replymesh.cloud`

Resultados:

| # | Teste | Resultado |
|---|---|---|
| 1 | Super admin acessa Master dashboard | PASSOU - 200 |
| 2 | Admin loja A acessa Master dashboard | PASSOU - 403 `master_forbidden` |
| 3 | Admin loja A acessa dashboard A | PASSOU - 200 |
| 4 | Admin loja A acessa dashboard B | PASSOU - 403 `tenant_forbidden` |
| 5 | Admin loja B acessa dashboard B | PASSOU - 200 |
| 6 | Admin loja B acessa dashboard A | PASSOU - 403 `tenant_forbidden` |
| 7 | Super admin cru acessa Store sem impersonacao | PASSOU - 403 `tenant_forbidden` |
| 8 | Token A acessa orders da empresa B | PASSOU - 403 `tenant_forbidden` |
| 9 | Token A acessa products da empresa B | PASSOU - 403 `tenant_forbidden` |
| 10 | Token A acessa categories da empresa B | PASSOU - 403 `tenant_forbidden` |
| 11 | Token A acessa reports da empresa B | PASSOU - 403 `tenant_forbidden` |
| 12 | Token A acessa users da empresa B | PASSOU - 403 `tenant_forbidden` |
| 13 | Token A acessa cash_sessions da empresa B | PASSOU - 403 `tenant_forbidden` |
| 14 | Token A acessa motoboys da empresa B | PASSOU - 403 `tenant_forbidden` |
| 15 | Token A acessa whatsapp/instances da empresa B | PASSOU - 403 `tenant_forbidden` |
| 16 | Token A acessa inventory_items da empresa B | PASSOU - 403 `tenant_forbidden` |
| 17 | Token A acessa coupons da empresa B | PASSOU - 403 `tenant_forbidden` |
| 18 | Master frontend aceita apenas `super_admin` | PASSOU - bloqueio no `saveSession` e `RequireAuth` |
| 19 | Store frontend valida sessao antes do layout/admin | PASSOU - validacao ativa em `/store/features` antes de `setUser` |
| 20 | Store limpa sessao ao receber `tenant_forbidden` | PASSOU - limpa sessao e volta ao login |
| 21 | LocalStorage legado/global nao libera acesso cruzado | PASSOU - sessao e lida por slug e removida quando nao corresponde |
| 22 | Dashboard com token de outra empresa pode piscar antes do bloqueio | PASSOU - bloqueado antes de renderizar `ProtectedRoute` |

## Causa Raiz

1. O backend Master ainda aceitava usuarios com `master_role` por permissao granular em `require_super_admin!`.
2. O frontend Master aceitava qualquer token salvo, sem validar `global_role = super_admin`.
3. A Store confiava na sessao local ao iniciar e so depois as chamadas de API poderiam bloquear, permitindo risco de renderizacao temporaria.

## Correcao Aplicada

1. `require_super_admin!`, `require_master_permission!` e `require_master_user!` agora exigem `current_user.super_admin?`.
2. Erro padronizado para Master: `master_forbidden`.
3. Master frontend recusa salvar sessao que nao seja `super_admin`.
4. Store frontend compara o `profile.company_slug` com o slug do subdominio atual antes de liberar `user/profile`.
5. Sessao Store invalida ou de outro tenant e limpa e redirecionada para login.
6. Store frontend valida o token contra a empresa atual em `/api/v1/store/features` antes de renderizar o painel.

## Ajuste Pos-validacao

Durante o teste real com `pizzashow@replymesh.cloud` no subdominio `lanchedo2r`, foi identificado que o backend bloqueava corretamente, mas o frontend ainda montava o painel porque validava a sessao usando o slug salvo no perfil antigo.

Correcao adicional aplicada:

- `store-template/src/contexts/AuthContext.jsx` agora usa sempre o slug atual do host.
- Se `profile.company_slug` for diferente do slug atual, a sessao e removida antes de qualquer renderizacao.
- O container `replymesh-store` foi recriado para garantir que o bind mount passasse a servir o bundle novo.

Backup adicional da Store:

`/opt/replymesh/backups/store-tenant-final-20260616-032918`

## Status Final

ISOLAMENTO FINAL MASTER/STORE CORRIGIDO.
