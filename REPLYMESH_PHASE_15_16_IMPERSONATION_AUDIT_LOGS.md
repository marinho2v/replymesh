# Replymesh - Fase 15.16

## Resultado

Status: concluida localmente, sem VPS, deploy ou inicio da Fase 16.

## Impersonacao

- Sessao temporaria de 30 minutos.
- Acesso sem senha do cliente.
- Sessao vinculada ao usuario master e a uma empresa.
- Token de revogacao persistido somente como SHA-256.
- JWT validado contra a sessao ativa em todas as requisicoes.
- Revogacao imediata pelo painel da loja.
- Login real da loja mantido em armazenamento separado.
- Rota intermediaria no master evita abas vazias e bloqueio de popup assincrono.

Endpoints:

- `POST /api/v1/master/companies/:id/impersonate`
- `DELETE /api/v1/master/impersonation/:token`

## Permissoes

- `impersonate_company`
- `view_audit_logs`
- `manage_audit_logs`

Super Admin e Administrador possuem acesso por padrao. Suporte depende da
permissao explicita. Financeiro, Comercial e Desenvolvedor nao recebem acesso
por padrao.

## Auditoria

Foram criados:

- `MasterImpersonationSession`
- `MasterAuditLog`
- `MasterAuditLogService`
- `/api/v1/master/audit_logs`
- `/logs/auditoria`

Os registros incluem usuario, empresa, acao, modulo, recurso, IP, navegador,
status e metadados filtrados. Senhas, tokens e chaves sao substituidos por
`[FILTERED]`.

## Testes executados

- Super Admin entrou na Demo Hamburgueria.
- Banner exibiu usuario e empresa.
- Saida revogou a sessao e retornou ao Painel Master.
- Token revogado recebeu HTTP 401.
- Token expirado recebeu HTTP 401.
- Suporte sem permissao recebeu HTTP 403.
- Suporte com permissao marcada conseguiu entrar.
- Usuario de loja em endpoint master recebeu HTTP 403.
- Auditoria registrou entrada, saida, login e acesso negado.
- Filtros e tela da auditoria foram validados.
- `rails db:migrate`, `rails db:seed` e `rails routes`: OK.
- Sintaxe Ruby dos arquivos alterados: OK.
- Lint e build do Painel Master: OK.
- Build do store-template: OK.

## Pendencias

- Configurar URLs publicas somente na futura etapa de infraestrutura.
- Definir politica de retencao/arquivamento de auditoria antes da producao.
- VPS, deploy e Fase 16 continuam fora do escopo.
