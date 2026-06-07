# FASE 15.5 - Refinamento Visual do Painel + Suporte/Tickets

Status: concluida localmente, sem VPS/deploy.

## Escopo executado

- Suporte da loja deixou de ser apenas visual e passou a persistir tickets no Rails.
- Tickets no painel master deixaram de ser placeholder e passaram a listar/responder/alterar status.
- Caixa do `store-template` deixou de usar Supabase direto e passou a usar endpoints Rails.
- Estoque e movimentacoes deixaram de usar Supabase direto e passaram a usar endpoints Rails.
- Rota alias `/loja/:slug/admin/cash` criada para apontar para a tela atual de caixa.
- Produtos, Clientes e Relatorios foram auditados; nao receberam reescrita ampla nesta fase porque ja estavam funcionais em Rails ou sem erro bloqueante.

## Backend Rails

Criado:

- `support_tickets`
- `support_ticket_messages`
- `SupportTicket`
- `SupportTicketMessage`

Endpoints da loja:

- `GET /api/v1/store/tickets`
- `POST /api/v1/store/tickets`
- `GET /api/v1/store/tickets/:id`
- `POST /api/v1/store/tickets/:ticket_id/messages`
- `PATCH /api/v1/store/tickets/:id/status`

Endpoints master:

- `GET /api/v1/master/tickets`
- `GET /api/v1/master/tickets/:id`
- `POST /api/v1/master/tickets/:id/messages`
- `PATCH /api/v1/master/tickets/:id/status`

Status:

- `open`
- `pending`
- `resolved`
- `closed`

Prioridades:

- `low`
- `normal`
- `high`
- `urgent`

## Store Template

Alterado:

- `src/pages/admin/Support.jsx`
- `src/services/supportTickets.js`
- `src/services/cashRegister.js`
- `src/services/inventory.js`
- `src/services/inventoryMovements.js`
- `src/app/router.jsx`

Suporte:

- Separado em cards: Abrir ticket, Meus tickets, Detalhe do ticket e Respostas.
- Removidos avisos de backend pendente.
- Lista de tickets real por Rails.
- Resposta e status persistem no Rails.

Caixa:

- Service migrado para Rails.
- Listagem de sessoes e movimentos via Rails.
- Abrir caixa, registrar movimentacao e fechar caixa via Rails.
- Removida dependencia direta de Supabase nesta tela.

Estoque:

- Listagem de itens e movimentacoes via Rails.
- Criar item, entrada e ajuste via Rails.
- Removida dependencia direta de Supabase nos services principais de estoque.

## Painel Master

Alterado:

- `src/pages/tickets/Tickets.jsx`
- `src/services/api.js`
- `src/router/routes.jsx`
- `src/styles/main.css`

Tickets:

- `/tickets`
- `/tickets/abertos`
- `/tickets/andamento`
- `/tickets/resolvidos`

Funcional:

- Listar tickets de todas as empresas.
- Filtrar por empresa, prioridade e data.
- Abrir detalhe.
- Responder ticket.
- Alterar status.
- Visual sem placeholder.

## Testes executados

Rails:

- `rails db:migrate`: OK.
- `rails routes`: OK, incluindo tickets, caixa e estoque.
- `ruby -c` nos models/controllers/migrations de tickets: OK.

API:

- Login master local: OK.
- Criar ticket da loja Demo Hamburgueria: OK.
- Responder ticket pela loja: OK.
- Alterar status para `pending`: OK.
- Listar ticket no master: OK.
- Listar caixa via Rails: OK.
- Abrir caixa: OK.
- Registrar suprimento: OK.
- Fechar caixa: OK.
- Listar estoque via Rails: OK.
- Criar item de estoque: OK.
- Registrar entrada: OK.
- Registrar ajuste: OK.

Frontend:

- `npm run build` no `store-template`: OK.
- `npm run build` no `replymesh-frontend`: OK.
- `npm run lint` no `replymesh-frontend`: OK.

Navegador:

- `/loja/demohamburgueria/admin/support`: carregou sem aviso Supabase/backend pendente.
- `/loja/demohamburgueria/admin/cash-register`: carregou sem aviso Supabase.
- `/loja/demohamburgueria/admin/inventory`: carregou sem erro de movimentacoes.
- `/tickets`: carregou autenticado, sem placeholder e exibindo ticket criado.

## Pendencias restantes

- Relatorios ainda podem receber refinamento visual mais profundo quando houver mais dados reais.
- Produtos e Clientes foram mantidos como estavam; seguem candidatos a refinamento visual fino, mas sem bloqueio funcional nesta fase.
- Estoque nao recebeu deducao automatica nova por pedido nesta fase; services de deducao automatica permanecem seguros/stub no frontend para nao iniciar comportamento operacional novo.
- Mesas QR e suporte avancado com anexos/SLA continuam fora do escopo.

Atualizacao posterior:

- A Fase 15.6 corrigiu a regra de tickets da loja: loja nao altera mais status.
- A Fase 15.6 migrou Mesas/QR para Rails e removeu Supabase/RPC desse modulo.
- A Fase 15.6 aplicou refinamentos visuais pontuais em Produtos, Clientes, Relatorios e Suporte.
- Detalhes em `REPLYMESH_PHASE_15_6_FINAL_UX_AUDIT.md`.

## Restricoes respeitadas

- VPS nao iniciada.
- Deploy nao iniciado.
- Flutter nao iniciado.
- IA nao iniciada.
- Marketing em massa nao iniciado.
- Pagamento online nao iniciado.
- Projeto original do 2R nao alterado.
- Fase 16 nao iniciada.
