# Replymesh Hotfix - Master Users, Delete and Company Settings

Data: 2026-06-16

## Escopo

Hotfix para corrigir:

- `tenant_forbidden` na tela Master "Configuracoes da Empresa".
- Usuarios internos do Master com `master_role` impedidos de acessar o painel.
- Exclusao/desativacao de usuarios mantendo o e-mail bloqueado para recriacao.
- Preservacao do isolamento multiempresa da Store.

## Arquivos alterados

- `replymesh-api/app/controllers/application_controller.rb`
- `replymesh-api/app/controllers/api/v1/master/companies_controller.rb`
- `replymesh-api/app/controllers/api/v1/master/users_controller.rb`
- `replymesh-api/app/controllers/api/v1/store/users_controller.rb`
- `replymesh-api/app/models/user.rb`
- `replymesh-api/spec/requests/authentication_spec.rb`
- `replymesh-frontend/src/services/api.js`
- `replymesh-frontend/src/pages/configuracoes/CompanySettings.jsx`
- `replymesh-frontend/src/pages/usuarios/MasterUsers.jsx`

## Correcoes aplicadas

### Master company settings

- A tela Master `Configuracoes da Empresa` deixou de chamar `/api/v1/company/settings`.
- Agora usa os endpoints Master:
  - `GET /api/v1/master/companies/:id/store_settings`
  - `PATCH /api/v1/master/companies/:id/store_settings`
- Isso evita passar pelo isolamento da Store e elimina o `tenant_forbidden` no Master.
- O backend Master passou a aceitar tambem campos exibidos pela tela: `email`, `address`, `city`, `state`, `zip_code`, `instagram` e `facebook`.

### Usuarios Master

- O guard do Master agora permite:
  - `super_admin`, sempre.
  - usuario com `master_role` ativo quando a permissao da rota esta liberada no cargo.
- Usuario de loja sem `master_role` continua bloqueado no Master com `master_forbidden`.
- O dashboard do Master foi mapeado para a permissao `companies.view`.
- O frontend Master deixou de aceitar somente `super_admin` e agora aceita usuario interno com `master_role`.
- Um `master_forbidden` por falta de permissao especifica nao derruba mais a sessao de um usuario Master valido.

### Exclusao segura de usuarios

- Usuarios removidos do Master passam por remocao segura:
  - ficam `inactive`;
  - perdem `master_role`;
  - recebem e-mail tecnico `deleted+...`;
  - recebem senha aleatoria;
  - o e-mail original fica liberado para novo cadastro.
- O ultimo `super_admin` ativo nao pode ser excluido.
- A propria conta nao pode ser excluida.
- Na Store, ao desativar um usuario sem outro vinculo ativo e sem papel Master, o e-mail tambem e liberado.

## Validacoes locais

- `ruby -c` OK:
  - `replymesh-api/app/models/user.rb`
  - `replymesh-api/app/controllers/application_controller.rb`
  - `replymesh-api/app/controllers/api/v1/master/users_controller.rb`
  - `replymesh-api/app/controllers/api/v1/store/users_controller.rb`
  - `replymesh-api/app/controllers/api/v1/master/companies_controller.rb`
- `git diff --check` OK no escopo do hotfix.
- `npm run build` OK em `replymesh-frontend`.
- Auditoria de segredos no diff: nenhum segredo real encontrado.

## Testes automatizados

Foi adicionada cobertura para:

- usuario de loja bloqueado no Master;
- usuario Master sem permissao bloqueado;
- usuario Master com `companies.view` liberado;
- remocao de usuario Master liberando e-mail;
- remocao de usuario da Store liberando e-mail quando nao ha vinculo ativo.

O `bundle exec rspec spec/requests/authentication_spec.rb` nao rodou no Windows local porque faltam gems nativas instaladas no bundle local (`puma`, `bcrypt`, `bootsnap`, entre outras). Nao foi erro de sintaxe nem falha de teste.

## Pendencias para producao

## Deploy em producao

Backup criado antes do deploy:

- `/opt/replymesh/backups/master-users-hotfix-20260616-234015`

API:

- Imagem anterior preservada como tag de backup.
- Nova imagem buildada: `replymesh-api:master-users-settings-hotfix-20260616`
- Container recriado: `replymesh-rails-api`
- Rede preservada: `host`
- Porta preservada: `3010`
- Restart policy preservado: `unless-stopped`

Master:

- Build local validado de `replymesh-frontend` publicado em `/opt/replymesh/master`.
- Versao anterior preservada em `/opt/replymesh/master.prev-master-users-hotfix-20260616`.
- Container `replymesh-master` reiniciado.

## Validacoes em producao

- `https://api.replymesh.cloud/up`: 200
- `https://app.replymesh.cloud/configuracoes/geral`: 200
- `https://app.replymesh.cloud/usuarios-master`: 200
- `GET /api/v1/master/companies` com token Master: 200
- `GET /api/v1/master/companies/:id/store_settings` com token Master: 200
- `GET /api/v1/company/settings` com token Master bruto e `X-Company-Slug`: 403 `tenant_forbidden`
- `grep` nos assets publicados do Master para `127.0.0.1`/`localhost`: sem ocorrencias.
- Logs recentes da API: sem exception/fatal/error relacionado ao hotfix.

## Pendencias

- Validacao manual no navegador com usuario real:
  - Criar/editar usuario Master interno e testar acesso conforme permissao.
  - Remover usuario Master e recriar o mesmo e-mail.
  - Remover usuario de loja e recriar o mesmo e-mail.
  - Abrir a tela Master "Configuracoes da Empresa" da PIZZA SHOW e confirmar que nao aparece `tenant_forbidden`.
