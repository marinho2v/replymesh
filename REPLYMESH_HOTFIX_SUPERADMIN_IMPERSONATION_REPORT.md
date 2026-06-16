# Replymesh Hotfix - Superadmin Impersonation

Data: 2026-06-16

## Problema

O acesso "Entrar como empresa" do Painel Master abria a rota da loja, mas a Store bloqueava o superadmin com:

- `Acesso nao autorizado`
- `Acesso temporario invalido ou incompleto`

## Causa

O fluxo da Store validava a sessao temporaria do Master usando igualdade rigida entre o slug do token e o slug resolvido pelo host atual. Em cenarios com subdominio limpo, dominio/custom domain ou slug visual diferente, a Store abortava antes de permitir que o backend validasse o token auditado de impersonacao.

## Correcao

- A tela `/admin/impersonate` agora aceita parametros tanto em query string quanto em hash fragment.
- A Store nao bloqueia impersonacao de superadmin apenas por divergencia textual de slug.
- A validacao de seguranca continua no backend via token JWT de impersonacao, `impersonation_session_id` e `impersonated_company_id`.
- Admins comuns continuam isolados por empresa e continuam dependentes do `company_members` ativo.
- O Master continua gerando rota limpa `/admin/impersonate`.

## Arquivos

- `store-template/src/pages/auth/MasterImpersonation.jsx`
- `store-template/src/contexts/AuthContext.jsx`
- `store-template/src/services/replymeshApi.js`
- `replymesh-frontend/src/lib/companyImpersonation.js`

## Validacoes locais

- `npm run build` em `store-template`: OK
- `npm run build` em `replymesh-frontend`: OK
- `git diff --check`: OK
- Auditoria simples de segredos nos arquivos alterados: OK

## Resultado esperado

- Superadmin consegue acessar qualquer loja via acesso auditado do Master.
- Admin de empresa A continua bloqueado ao tentar acessar empresa B.
