# Replymesh - Auditoria da Fase 15.15

Data: 06/06/2026

## Escopo concluido

- Gestao real de usuarios internos do Painel Master.
- Funcoes e permissoes separadas dos usuarios das lojas.
- Convites locais.
- Perfil do administrador.
- Identidade visual do Painel Master.
- Refinamento da sidebar, acoes de empresas e notificacoes.
- Auditoria rapida da Carina.

## Backend

Foram criados:

- `MasterRole`
- `MasterInvite`
- `MasterBrandSetting`

O model `User` foi adaptado com `master_role_id` e `avatar_url`. Um usuario e
considerado interno quando e `super_admin` ou possui uma funcao master.

Permissoes cobrem empresas, tickets, financeiro, configuracoes, usuarios e
logs. O super admin ignora a matriz e mantem acesso total.

Endpoints:

- `GET/POST /api/v1/master/users`
- `PATCH/DELETE /api/v1/master/users/:id`
- `PATCH /api/v1/master/users/:id/status`
- `PATCH /api/v1/master/users/:id/reset_password`
- `GET/POST /api/v1/master/roles`
- `PATCH /api/v1/master/roles/:id`
- `GET/POST /api/v1/master/invites`
- `PATCH /api/v1/master/invites/:id/cancel`
- `PATCH /api/v1/master/invites/:id/resend`
- `GET/PATCH /api/v1/master/profile`
- `PATCH /api/v1/master/profile/password`
- `GET/PATCH /api/v1/master/branding`

## Seguranca

- Usuarios das lojas nao recebem acesso master automaticamente.
- Usuario inativo nao autentica nem reutiliza JWT.
- Senhas nunca sao serializadas.
- Troca de senha do perfil exige a senha atual.
- O proprio administrador nao pode desativar ou excluir a propria conta.
- Super admin nao pode ser removido pelo endpoint comum.
- Convites usam token aleatorio e sao acessiveis apenas ao master.
- Alteracoes sensiveis registram `ActivityLog`.

## Frontend

Telas reais:

- `/usuarios-master`
- `/usuarios-master/funcoes`
- `/usuarios-master/convites`
- `/perfil`
- `/configuracoes/aparencia`

A sidebar recolhida possui tooltip nativo, modulo ativo, logo compacta e avatar
real. A tabela de empresas possui menu para visualizar, editar, suspender,
assinatura, dominio, WhatsApp, tickets e relatorios. `Entrar como empresa`
permanece desabilitado e identificado como futuro.

## Carina

Validado:

- botao flutuante presente no admin da Demo Hamburgueria;
- configuracao apenas no Painel Master;
- JSON publico sem API key;
- cumprimento natural;
- respostas locais sobre produtos, cupons, Mercado Pago e WhatsApp;
- perguntas geograficas e outros assuntos externos bloqueados.

Bug corrigido:

- pergunta geografica podia cair em um fallback generico da base. O filtro de
  escopo foi ampliado sem refatorar o restante da IA.

## Testes

- `rails db:migrate`: OK.
- `rails db:seed`: OK.
- `rails routes`: OK.
- `ruby -c` nos arquivos Rails alterados: OK.
- fluxo API de usuario suporte: criar, editar, desativar, redefinir senha e remover acesso: OK.
- fluxo API de convite: criar, reenviar e cancelar: OK.
- perfil e marca: leitura e gravacao: OK.
- `npm run lint` no master: OK.
- `npm run build` no master: OK.
- `npm run build` no store-template: OK.
- validacao visual das telas e sidebar: OK.

## Pendencias futuras

- envio real de convites por email;
- aceite publico do convite e definicao inicial de senha;
- impersonacao segura de empresa com banner, prazo e auditoria reforcada;
- upload binario de logos e avatares, hoje suportados por URL;
- deploy/VPS somente apos autorizacao da Fase 16.
