# Replymesh - Fase 15.6 Final UX Audit

Data: 05/06/2026

Status: concluida localmente.

Escopo:
- Ajustes finais de UX.
- Tickets.
- Mesas / QR Code.
- Refinamento visual pontual de Caixa, Relatorios, Produtos, Clientes e Estoque.

Restricoes respeitadas:
- VPS nao iniciada.
- Deploy nao iniciado.
- Flutter nao iniciado.
- IA nao iniciada.
- Pagamento online nao iniciado.
- Projeto original do 2R nao alterado.

## Tickets

Corrigido:
- Cliente/loja nao pode mais alterar status do ticket.
- Loja pode abrir ticket.
- Loja pode visualizar respostas.
- Loja pode responder ticket.
- Status aparece somente como badge visual na loja.
- Master continua com controle de status em `/tickets`.

Backend:
- `PATCH /api/v1/store/tickets/:id/status` agora retorna 403.
- `PATCH /api/v1/master/tickets/:id/status` permanece ativo para suporte/master.

Frontend:
- `store-template/src/pages/admin/Support.jsx` removeu o select de status.
- Detalhe do ticket ficou mais organizado, com respostas em formato de conversa.

Validado:
- Tentativa de alterar status pela loja: bloqueada com 403.
- `/loja/demohamburgueria/admin/support`: carregou sem erro.
- `/tickets`: carregou no painel master sem erro.

## Mesas / QR Code

Implementado em Rails:
- CRUD logico de mesas.
- Ativar/desativar mesa.
- Excluir mesa como desativacao segura.
- Gerar/regenerar QR Code.
- Ativar/desativar QR Code.
- Rota publica por empresa: `/loja/:slug/mesa/:qrToken`.
- Pedido publico de mesa vinculado a `dining_table_id`.

Migrations:
- `20260605155600_add_qr_fields_to_dining_tables.rb`
- `20260605155601_backfill_dining_table_qr_tokens.rb`

Campos adicionados:
- `dining_tables.qr_token`
- `dining_tables.qr_enabled`
- `dining_tables.qr_generated_at`
- `dining_tables.qr_updated_at`

Endpoints:
- `GET /api/v1/store/dining_tables`
- `POST /api/v1/store/dining_tables`
- `GET /api/v1/store/dining_tables/:id`
- `PATCH /api/v1/store/dining_tables/:id`
- `DELETE /api/v1/store/dining_tables/:id`
- `PATCH /api/v1/store/dining_tables/:id/set_qr_enabled`
- `POST /api/v1/store/dining_tables/:id/regenerate_qr`
- `GET /api/v1/store/table_sessions`
- `POST /api/v1/store/table_sessions`
- `GET /api/v1/store/table_sessions/:id`
- `PATCH /api/v1/store/table_sessions/:id`
- `GET /api/v1/public/:company_slug/tables/qr/:qr_token`
- `POST /api/v1/public/:company_slug/tables/qr/:qr_token/session`
- `POST /api/v1/public/:company_slug/tables/qr/:qr_token/orders`
- `GET /api/v1/public/:company_slug/tables/qr/:qr_token/orders`

Frontend:
- `src/services/tables.js` migrado para Rails.
- `src/services/tableQr.js` migrado para Rails.
- `src/hooks/useTables.js` removeu Supabase realtime e passou a usar polling simples.
- `src/pages/admin/Tables.jsx` gera link QR correto em `/loja/:slug/mesa/:qrToken`.
- `src/pages/public/TableQrMenu.jsx` usa menu publico Rails e company slug da URL/contexto.

Validado:
- `Mesa Teste QR` criada na Demo Hamburgueria.
- QR publico abriu em `/loja/demohamburgueria/mesa/lfhajv8zzeklmrjycpjnjer`.
- Sessao de mesa criada.
- Pedido de mesa criado no Rails.
- Pedido apareceu na pagina da mesa.

Observacao:
- Mesa e pedidos criados sao dados locais de teste.

## Refinamento visual

Suporte:
- Cards e detalhe mais compactos.
- Status e prioridade como badges.
- Respostas em conversa.

Produtos:
- Cards menores.
- Nome truncado.
- Acoes mais compactas.
- Fallback visual "Sem imagem".

Clientes:
- Cards mais compactos.
- Telefone formatado.
- Pedidos e total gasto destacados.
- Nome truncado.

Relatorios:
- Estado vazio amigavel:
  - "Nenhum dado encontrado para o periodo selecionado."
- Cards/listas principais mantidos.

Caixa:
- Tela carregou sem erro em `/loja/demohamburgueria/admin/cash`.
- Refinamento visual profundo fica recomendado para fase futura menor se necessario.

Estoque:
- Tela carregou sem erro em `/loja/demohamburgueria/admin/inventory`.
- Itens e indicadores carregaram via Rails.

## Testes executados

Rails:
- `rails db:migrate`: OK.
- `rails routes`: OK.
- `ruby -c`:
  - `app/controllers/api/v1/public/table_qr_controller.rb`: OK.
  - `app/controllers/api/v1/store/dining_tables_controller.rb`: OK.
  - `app/controllers/api/v1/store/table_sessions_controller.rb`: OK.
  - `app/controllers/api/v1/store/tickets_controller.rb`: OK.
  - `app/models/dining_table.rb`: OK.

API:
- Login da Demo Hamburgueria: OK.
- Listar mesas: OK.
- Criar mesa: OK.
- Abrir QR publico: OK.
- Abrir sessao da mesa: OK.
- Criar pedido de mesa: OK.
- Alterar status de ticket pela loja: bloqueado com 403.

Frontend:
- `npm run build` no `store-template`: OK.
- `npm run build` no `replymesh-frontend`: OK.
- `npm run lint` no `replymesh-frontend`: OK.

Navegador:
- `/loja/demohamburgueria/admin/support`: OK.
- `/tickets`: OK.
- `/loja/demohamburgueria/admin/tables`: OK.
- `/loja/demohamburgueria/admin/cash`: OK.
- `/loja/demohamburgueria/admin/reports`: OK.
- `/loja/demohamburgueria/admin/products`: OK.
- `/loja/demohamburgueria/admin/customers`: OK.
- `/loja/demohamburgueria/admin/inventory`: OK.
- `/loja/demohamburgueria/mesa/:qrToken`: OK.

## Bugs encontrados e corrigidos

- `TableQrController` tinha conflito entre action e helper privado com nome `open_session`; corrigido renomeando helper para `ensure_open_session`.
- Pagina QR podia perder o slug em montagem publica; corrigido usando contexto de empresa e fallback pela URL.
- Mesas antigas sem `qr_token`: corrigido por migration de backfill.

## Pendencias restantes

- Caixa pode receber refinamento visual mais profundo em fase menor.
- Relatorios precisam de mais dados reais para validar bem graficos/listas em volume.
- Mesa QR esta funcional em modo local, mas ainda nao deve ser publicada sem Fase 16.
- Fase 16 VPS nao foi iniciada.

## Pronto para Fase 16?

Tecnicamente o ambiente local esta mais organizado para preparar Fase 16.

Nao iniciar Fase 16 sem confirmacao explicita.
