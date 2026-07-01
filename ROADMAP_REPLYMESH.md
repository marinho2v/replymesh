# ROADMAP â€” Replymesh SaaS

> Controle oficial de desenvolvimento.
> **Leia este arquivo no inÃ­cio de cada sessÃ£o. Continue sempre pela prÃ³xima tarefa pendente.**

---

## Como usar este Roadmap

1. Ler este arquivo e o `MASTER_PLAN_REPLYMESH.md`
2. Identificar a prÃ³xima tarefa `[ ]` marcada como pendente
3. Executar somente essa tarefa
4. Testar antes de avanÃ§ar
5. Marcar como `[x]` ao concluir
6. Informar arquivos criados/alterados e como testar
7. Anotar a prÃ³xima tarefa recomendada

---

## Status Atual

### Atualizacao DEV em 2026-07-01 — Phase 1.9 Company Context Engine

- Criado `CompanyContextBuilder` como fonte unica de contexto de empresa para modulos de IA.
- IA vendedora e Sales Recovery passaram a consumir o mesmo contexto central sem mudar comportamento visivel.
- Contexto inclui loja, horarios, pagamentos, entrega, categorias, produtos, destaques, cupons, campanhas, estoque e estatisticas de recuperacao.
- Cache de 5 minutos via `ReplymeshCacheService`, com invalidacao em produtos, categorias, configuracoes, cupons, banners, campanhas, estoque, IA e Recovery.
- Metricas de montagem do contexto alimentam o Performance Monitor como `company_context_builder`.
- Proxima direcao: Delivery AI, Customer Intelligence, Sales AI Coach e Analytics Inteligente devem consumir este contexto central.

**Fase atual:** FASE 15.11.3 - Auditoria Final do Mercado Pago + Jobs Pendentes - **CONCLUIDA EM 2026-06-06**  
**Última atualização:** 2026-06-06  
**Próxima tarefa recomendada:** FASE 16 - VPS E PRODUCAO, somente com confirmacao explicita. Nao iniciar deploy, banco de producao, Evolution real, webhook real, pagamento online, Flutter, IA ou marketing em massa sem confirmacao.

### Conclusao da FASE 15.11.3 em 2026-06-06

Auditoria final do Pix Mercado Pago antes da VPS:

- Criado `public_token` aleatorio em `orders`, com backfill dos pedidos existentes e indices unicos.
- URLs publicas de acompanhamento deixaram de usar ID sequencial: `/success/:public_token`.
- Endpoints publicos de pedido, status Pix e cancelamento Pix agora resolvem o pedido por `public_token`.
- `GET /api/v1/public/demohamburgueria/orders/70` retorna 404; token equivalente retorna 200.
- Resposta publica de status Pix retorna `order_id` como token publico.
- Criado `PaymentExpirationService`.
- Criado comando local `rails payments:expire_pending_pix`.
- Expiracao local validada: 6 pedidos verificados, 5 expirados.
- Impressao do pedido no admin corrigida com HTML UTF-8 e moeda limpa `R$ 0,50`.
- Webhook Mercado Pago passou a rejeitar payload sem `payment_id` valido com 400.
- `rails db:migrate`, `rails routes`, `ruby -c` e `npm run build` no `store-template` passaram.

Relatorio detalhado:

- `REPLYMESH_PHASE_15_11_3_MP_AUDIT.md`

### Conclusao da FASE 15.11.2 em 2026-06-05

Pix Mercado Pago em tempo real local:

- Criado `MercadoPagoPaymentProcessor` para centralizar confirmacao, expiracao e cancelamento de Pix Mercado Pago.
- `GET /api/v1/public/:company_slug/payments/:order_id/status` agora consulta o status remoto/mock, confirma pagamento aprovado e expira pedido pendente com mais de 3 minutos.
- `POST /api/v1/public/:company_slug/orders/:id/cancel_payment` permite cancelar publicamente somente pedido Pix ainda em `pending_payment`.
- `POST /api/v1/webhooks/mercadopago` e `/simulate` passam pelo mesmo processador usado pelo polling.
- Fluxo aprovado validado localmente: `pending_payment` -> `paid` e `pending` -> `accepted`, com `accepted_at`, log de status e notificacao "Pagamento confirmado".
- Fluxo expirado validado localmente: `pending_payment` -> `expired` e `pending` -> `cancelled`, com notificacao "Pix expirado".
- Fluxo cancelado validado localmente: `pending_payment` -> `cancelled` e pedido `cancelled`.
- Fluxo rejeitado validado localmente: `pending_payment` -> `failed` e pedido `cancelled`.
- Admin da loja nao mostra acao "Aceitar" enquanto `payment_status = pending_payment`; exibe badge "Aguardando pagamento".
- Cozinha/KDS ignora pedidos Pix ainda aguardando pagamento.
- Frontend do Pix mostra contador de 3 minutos, botao "Cancelar pedido", status atualizado por polling e trata expirado/cancelado.
- WhatsApp `pedido_aceito` foi acionado pelo fluxo aprovado; no teste local com telefone falso o envio real falhou e gerou log seguro. `pedido_cancelado` permaneceu desativado e foi registrado como ignorado.
- Testes: `rails db:migrate` OK, `rails routes` OK, `ruby -c` OK, endpoints locais OK, mock approved/expired/cancelled/rejected OK, `npm run build` no `store-template` OK.

Relatorio detalhado:

- `REPLYMESH_PHASE_15_11_2_MP_REALTIME_PAYMENT_AUDIT.md`

### Conclusao da FASE 15.11.1 em 2026-06-05

Correcoes finais de Pix Mercado Pago e personalizacao visual do template premium:

- Pix automatico: quando `pix_provider = mercadopago` e `mercadopago_enabled = true`, o checkout nao exibe Pix manual/payload/QR manual.
- Pedido Pix Mercado Pago fica em `pending_payment` com `external_payment_id`, `pix_qr_code`, `pix_copy_paste`, `pix_qr_code_base64` e `pix_ticket_url`.
- Corrigido bug do `MercadoPagoPixService` que usava `order.total`; agora usa `total_brl/total_cents`.
- Tela de sucesso exibe painel Mercado Pago quando o pedido aguarda pagamento, e Pix manual apenas quando a loja esta em modo manual.
- Configuracoes > Identidade visual recebeu controles do template premium: `hero_image_url`, `hero_image_position`, `hero_image_zoom`, `hero_overlay_opacity`, `hero_height` e `theme_primary_color`.
- Endpoint publico da loja retorna campos visuais premium e flags publicas do Mercado Pago sem expor access token.
- Template `hamburgueria-premium` aplica imagem, posicao, zoom, overlay, altura e cor primaria vindos do Rails, com fallback local.
- Migration criada: `20260605180101_add_pix_copy_paste_to_orders.rb`.
- Testes: `rails db:migrate` OK, `rails routes` OK, `ruby -c` OK, mock MP Pix OK, `npm run build` no `store-template` OK, verificacao visual local OK.

Relatorio detalhado:

- `REPLYMESH_PHASE_15_11_1_MP_PIX_VISUAL_FIX_AUDIT.md`

### Conclusao da FASE 15.11 em 2026-06-05

Pix Mercado Pago com modo local (mock) e estrutura pronta para producao:

- Migrations: `pix_provider`, `mercadopago_public_key`, `mercadopago_access_token`, `mercadopago_enabled` em store_settings; `external_payment_id`, `payment_confirmed_at`, `pix_qr_code`, `pix_qr_code_base64`, `pix_ticket_url` em orders.
- PAYMENT_STATUSES atualizado: not_required, pending_payment, pending, paid, failed, expired, refunded, cancelled.
- MercadoPagoPixService: create_pix_payment (Net::HTTP real), check_payment, test_connection; mock automatico para token TEST-/DEV-.
- Webhook: POST /api/v1/webhooks/mercadopago (recebe notificacao MP, confirma pagamento, avanca status, notifica empresa); POST /api/v1/webhooks/mercadopago/simulate (DEV ONLY, 403 em producao).
- GET /api/v1/public/:slug/payments/:order_id/status (polling de status).
- Checkout integrado: quando MP ativo + Pix + pedido criado → chama MP service → salva QR → retorna para frontend.
- Token mascarado na API (mask_token): nao exposto no frontend, nao salvo se contiver ****.
- Frontend: usePixPayment (polling 5s, ate 10min), MercadoPagoPixPanel (QR Code + copia e cola + status), Settings.jsx com secao MP completa (modo, public_key, access_token, webhook_secret, info box URL), Checkout.jsx mostra painel MP antes de redirecionar.
- Build: store-template 8.18s, 0 erros; ruby -c 8 arquivos OK; 4 rotas MP corretas.

### Conclusao da FASE 15.10 em 2026-06-05

UX Final + Notificacoes:

- Products.jsx: grid responsivo corrigido (2→3→4→5→6 cols), overflow-hidden no wrapper, barra de acoes refatorada com flex-wrap, categorias com truncate e tooltip.
- Backend: tabela `notifications` criada (migration 20260605170000), model Notification com scopes unread/recent/for_company, NotificationService com metodos order_received/ticket_created/ticket_replied/stock_low/system_update.
- Endpoints: GET/PATCH store/notifications + master/notifications com rotas corretas (6 rotas).
- Integracao: pedido criado gera notificacao para empresa; ticket criado gera notificacao para master; master responde ticket gera notificacao para empresa.
- Frontend: useNotifications (polling 60s, silencioso), NotificationsDropdown (dropdown real, icone por tipo, timestamp relativo, marcar lida/todas lidas), AdminLayout com bell real (sem hardcoded "4").
- SystemUpdates.jsx: pagina /admin/updates com historico de versoes 1.5.5→1.5.9.2, cards coleapsaveis, badges Novo/Melhoria/Correcao.
- Router: rota /admin/updates adicionada. Menu sidebar: link Atualizacoes adicionado com icone Sparkles.
- Build: store-template 8.57s, replymesh-frontend 883ms, ESLint 0 erros, ruby -c 8 arquivos OK.

### Conclusao da FASE 15.9.2 em 2026-06-05

Conversao funcional do template `hamburgueria V2` para React/Vite:

- Pasta original analisada e preservada sem alteracao: `M:\store-template\src\templates\hamburgueria V2\`.
- Criado template React em `store-template/src/templates/hamburgueria-premium/`.
- Componentes criados/conectados:
  - `PremiumHeader.jsx`
  - `PremiumHome.jsx`
  - `PremiumHero.jsx`
  - `PremiumMenuSection.jsx`
  - `PremiumProductCard.jsx`
  - `PremiumFooter.jsx`
  - `icons.jsx`
  - `styles.css`
- `hamburgueria-premium/metadata.json` ficou com status `active`.
- `PublicLayout` troca header/footer classico por chrome premium quando `visual_template_id = hamburgueria-premium`.
- Rotas publicas respeitando template:
  - `/loja/:slug`
  - `/loja/:slug/menu`
  - `/loja/:slug/products/:id`
- Dados Rails conectados no premium:
  - nome/logo/banner/status/WhatsApp da loja.
  - categorias reais.
  - produtos reais, imagens, precos, destaque/promocao e status ativo.
  - carrinho atual com adicionar/incrementar/decrementar.
- Corrigido erro de build causado por JSX em `icons.js`; arquivo duplicado removido e imports ajustados para `icons.jsx`.
- `npm run build` no `store-template`: OK.
- Teste no navegador: `Hamburgueria Premium` selecionado em `/loja/demohamburgueria/admin/settings`, home/menu carregaram visual premium com produtos Rails, carrinho adicionou item, e `Hamburgueria Classic` foi restaurado.
- Nao foram alterados checkout, pedidos, WhatsApp, motoboy, roleta, cupons, mesas, suporte, Supabase ou 2R original.

### Conclusao da FASE 15.9.1 em 2026-06-05

Templates por categoria e fluxo de conversao HTML para React:

- Template HTML `hamburgueria V2/` (app.jsx, data.jsx, icons.jsx, Poppins, dourado #f7a325) analisado e registrado como `hamburgueria-premium` com status `preview`.
- 4 novos metadata.json criados: hamburgueria-premium, pizzaria-dark, doceria-clean, bebidas-neon.
- `index.js` atualizado com funcoes: `getAllTemplates()`, `getTemplateById()`, `getTemplatesByCategory()`, `getTemplateCategories()`, `isValidTemplateId()`.
- `TEMPLATE_CATEGORIES` exportada com 7 categorias.
- Settings.jsx: novo `TemplateSelectorSection` com filtro de categoria por botoes, contagem de resultados, estado vazio.
- `TemplatePreviewCard` reescrito com preview CSS dinamico usando cores reais do template, badge colorido com a cor de acento, status `coming_soon` bloqueia selecao com opacity e cursor.
- `STORE_VISUAL_TEMPLATES_GUIDE.md` atualizado com guia completo HTML→React: conversao de atributos, substituicao de dados hardcoded por hooks Rails, uso de `useStoreTemplate()`.
- Build: 0 erros, 6.50s.
- Template hamburgueria V2 preservado intacto como referencia de prototipo.

### Conclusao da FASE 15.9 em 2026-06-05

Sistema de templates visuais da loja publica:

- Migration `20260605160000`: coluna `visual_template_id` (string, NOT NULL, default hamburgueria-classic) em `store_settings`.
- Todas as 6 empresas migradas com valor padrao automaticamente.
- `StoreSetting` model: `apply_company_settings!` e `as_company_settings_json` incluem o campo.
- `Public::StoresController`: `serialize_store` retorna `visual_template_id`.
- `CompanySettingsController`: `settings_params` permite o campo no PUT.
- Frontend: `src/templates/index.js` (registry), `hamburgueria-classic/metadata.json` (primeiro template).
- `StoreTemplateContext` + `StoreTemplateProvider` + `useStoreTemplate()` hook disponivel em toda a loja publica.
- `PublicLayout` envolve com `StoreTemplateProvider` usando `store.visual_template_id`.
- `Settings.jsx`: nova secao "Template da loja" com cards selecionaveis, badge "Atual" e botao "Usar este template".
- `services/settings.js`: get e save incluem `visual_template_id`.
- Documentacao: `STORE_VISUAL_TEMPLATES_GUIDE.md` e `REPLYMESH_PHASE_15_9_VISUAL_TEMPLATES_AUDIT.md`.
- Build store-template: 0 erros, 5.95s.
- Visual atual nao alterado (hamburgueria-classic = visual padrao existente).

### Conclusao da FASE 15.8 em 2026-06-05

Auditoria final de producao local — simulacao de operacao real completa:

- Testes tecnicos: 62 controllers + 46 models + 12 services com Syntax OK; 29 migrations todas `up`; rails routes 222 rotas sem erros; builds ambos frontends sem erros; ESLint replymesh-frontend 0 erros.
- Banco local: 47 tabelas, 6 empresas, 116 produtos, 36 clientes, 50 pedidos — consistentes.
- Multiempresa: `company_scope` verificado em todos os 8+ controllers criticos — isolamento confirmado.
- Fluxo de pedido: lookup WhatsApp, troco, cupom, criacao, aceite, motoboy, finalizacao, WhatsApp, historico — todos OK.
- Roleta: 1 giro/R$25 (CENTS_PER_SPIN=2500), cupom unico por premio, vinculado a company_id.
- Cupons: expirado/inativo/uso-unico todos rejeitados por CouponValidationService.
- Tickets: loja retorna 403 para alteracao de status; somente master pode alterar.
- ProtectedRoute: role-based redirect funcional para admin/attendant/kitchen/motoboy.
- Nenhum bug bloqueante encontrado.
- Conclusao: **Sistema local apto para preparacao da Fase 16 — VPS e Producao.**

### Conclusao da FASE 15.7 em 2026-06-05

Refinamento visual profissional de todas as paginas admin do store-template:

- **Suporte**: Chat bubbles (cliente direita, suporte esquerda), stats cards, ticket list com borda por prioridade, Ctrl+Enter para enviar, auto-scroll
- **Relatórios**: Layout executivo 2 linhas de KPIs, top produtos com barra de participacao, exports compactos
- **Clientes**: Avatar com iniciais + cor unica, badges Novo/Recorrente, grid 3 colunas, stats header
- **Caixa Operacional**: Badge de status inline, KPIs compactos, diff colorida, badges por tipo de movimentacao
- **Estoque**: Layout 2 colunas, empty state com CTA, contagem de itens no header
- **Mesas**: Empty state com CTA, subtitulo dinamico, cards menores e mais elegantes
- **Produtos**: Empty state com botao "Limpar filtros", subtitulo com contagem
- Build: `npm run build` 0 erros, 7.12s

### Conclusao da FASE 14.1 em 2026-06-04

Ajuste do Portal Motoboy apos webhook de localizacao:

- Portal do motoboy foi simplificado: pedido atribuido aparece direto para entrega.
- Botao `Iniciar entrega` foi removido/ocultado no frontend.
- Endpoint backend `POST /api/v1/motoboy/orders/:id/start` foi preservado para fase futura.
- Botao `Finalizar entrega` agora funciona em entregas `assigned` ou `on_the_way`.
- Ao finalizar entrega atribuida diretamente, backend marca `delivery_status=delivered`, registra historico, ajusta status operacional para permitir concluir e chama `OrderStatusService` para `completed`.
- WhatsApp `pedido_finalizado` continua sendo disparado quando template ativo.
- Card do endereco no `MotoboyDashboard` mostra box verde quando o pedido possui `delivery_latitude`/`delivery_longitude`, `delivery_location_received_at`, `google_maps_url` ou `waze_url`.
- Box verde exibe `Localização recebida pelo WhatsApp`, explica que Maps/Waze abrem no pin e mostra data/hora de recebimento.
- Maps usa `google_maps_url` quando existir; Waze usa `waze_url` quando existir; sem localizacao, ambos continuam caindo para endereco textual.
- Serializer do historico do motoboy tambem passou a retornar campos de localizacao.
- Teste local: pedido Demo `#8` / id `23` com localizacao WhatsApp foi finalizado sem chamar start, saiu das entregas ativas, entrou no historico e gerou log WhatsApp `pedido_finalizado`.
- `npm run build`, `rails routes` e sintaxe Ruby passaram.

### Conclusao da FASE 14.0 em 2026-06-04

Webhook Rails local de localizacao Evolution criado e validado com Demo Hamburgueria:

- Endpoint criado: `POST /api/v1/webhooks/evolution/location`.
- Migration `20260604100028_add_whatsapp_location_fields_to_orders.rb` adicionou `delivery_latitude`, `delivery_longitude`, `google_maps_url`, `waze_url`, `delivery_location_source` e `delivery_location_received_at`.
- Parser seguro `EvolutionLocationPayloadParser` criado para aceitar somente campos conhecidos da Evolution Go, sem varrer JSON inteiro.
- Webhook valida `apikey` usando `EVOLUTION_LOCATION_WEBHOOK_SECRET` ou `EVOLUTION_GO_API_KEY`.
- Webhook resolve instancia por `instanceName`, `instance_uuid` ou headers de instancia, e aceita somente instancia vinculada a uma company.
- Em modo local, o webhook fica restrito a `demohamburgueria` salvo flag futura `ALLOW_EVOLUTION_LOCATION_WEBHOOK_ALL_COMPANIES=true`.
- Payload simulado da Evolution salvou localizacao no pedido Demo `#8`, order id `23`, telefone final `9803`.
- Pedido recebeu `delivery_latitude=-22.9351234`, `delivery_longitude=-42.8165678`, `google_maps_url` e `waze_url`.
- API do motoboy passou a retornar links Maps/Waze e campos de localizacao.
- Testes de seguranca: sem `apikey` retornou 401; payload sem localizacao foi ignorado com log seguro.
- `npm run build` passou no `store-template`.
- Nenhuma instancia Lanche foi alterada. Nenhum webhook de producao foi trocado. Nenhum deploy foi feito.

### Conclusao da FASE 13.1.2 em 2026-06-04

Correcoes finais do fluxo status + WhatsApp + location webhook documentadas em modo local:

- Fluxo de status do Rails agora usa a proxima etapa ativa conforme templates WhatsApp da empresa.
- Frontend admin/cozinha/detalhe do pedido passou a esconder botoes de status cujos templates estao desativados.
- Com os defaults da Demo, o fluxo operacional fica `pending -> accepted -> out_for_delivery -> completed`; `preparing` e `ready` nao aparecem enquanto `pedido_em_preparo` e `pedido_pronto` estiverem desativados.
- Envio automatico real pelo WhatsApp foi ativado somente em `development` e somente para `demohamburgueria`.
- Instancia principal validada para Demo: `replymesh_demohamburgueria_qr`, status `connected`, numero `5521968443941:90@s.whatsapp.net`.
- AppVersionWatcher deixou de consultar service Supabase legado e passou a usar store info Rails pelo slug atual.
- Criado `FLUXO_LOCALIZACAO_EVOLUTION.md` documentando o fluxo atual do 2R: cliente -> Evolution -> Edge Function Supabase -> RPC -> pedido -> portal motoboy.
- Pedido local de teste com produto real do 2R criado e concluido: Demo Hamburgueria, pedido `#6`, order id `20`, produto `Combo Casal X-tudo`, telefone final `9803`, total R$ 62,00.
- Logs WhatsApp reais gerados para `pedido_aceito`, `saiu_para_entrega` e `pedido_finalizado` com `delivery_mode=real_auto_demo`.
- Pedido manual deixado pendente para teste no painel: Demo Hamburgueria, pedido `#7`, order id `21`, cliente `marinho`, telefone `21 95909-9803`, endereco `Rua Elizeu Mendes Rodrigues, 1052`.
- Nenhum webhook de localizacao Rails foi ativado. Nenhuma instancia Lanche foi alterada.

### AtualizaÃ§Ã£o da FASE 1 em 2026-06-03

ImplementaÃ§Ã£o backend Rails API avanÃ§ada em `W:\sas replymesh\replymesh-api`:

- Projeto Rails API existente auditado.
- Migrations base existentes preservadas.
- Migrations `activity_logs` e `system_alerts` adicionadas.
- Models base criados com associaÃ§Ãµes e validaÃ§Ãµes.
- AutenticaÃ§Ã£o JWT inicial criada.
- Endpoints criados: login, me e CRUD master inicial de companies.
- `CompanyOnboardingService` criado com transaction e recursos padrÃ£o.
- `EvolutionGoClient` criado em modo mock.
- Seeds idempotentes criados para usuÃ¡rio master local e planos padrÃ£o.
- CORS, `.env.example`, `database.yml` e README ajustados.
- `bundle install` concluÃ­do usando runtime Ruby copiado para `W:\replymesh-ruby` por falha de compilaÃ§Ã£o no caminho com espaÃ§o.

Bloqueio atual:

- `rails db:create db:migrate db:seed` nÃ£o foi concluÃ­do porque o PostgreSQL local exige senha SCRAM e a senha atual em `.env` nÃ£o autentica para o usuÃ¡rio `postgres`.
- Testes HTTP de login/me/companies dependem do banco migrado e seedado.

PrÃ³xima tarefa recomendada:

- Confirmar/ajustar `DATABASE_PASSWORD` do PostgreSQL local e rodar `rails db:create db:migrate db:seed`, depois testar endpoints com token JWT.

### ConclusÃ£o da FASE 1 em 2026-06-03

Bloqueio PostgreSQL resolvido com a senha local informada.

- `.env` e `.env.example` atualizados com `DATABASE_HOST=127.0.0.1`, usuÃ¡rio `postgres`, banco `replymesh_development` e senha local.
- Senha do usuÃ¡rio `postgres` confirmada no PostgreSQL local.
- `rails db:create db:migrate db:seed` executado com sucesso.
- `rails routes` executado com sucesso.
- `POST /api/v1/auth/login` testado com usuario master local e retornou JWT.
- `GET /api/v1/auth/me` testado com JWT e retornou o usuÃ¡rio master.
- `GET /api/v1/master/companies` testado com JWT e retornou lista vazia com sucesso.

Status: FASE 1 concluÃ­da no escopo aprovado. NÃ£o iniciar Fase 2 sem aprovaÃ§Ã£o.

### ConclusÃ£o da FASE 2 em 2026-06-03

Frontend React/Vite criado em `W:\sas replymesh\replymesh-frontend` a partir do protÃ³tipo aprovado.

- Projeto Vite criado com React 18.
- React Router v6 configurado.
- `lucide-react` instalado.
- CSS inline do `index.html` extraÃ­do para `src/styles/main.css`.
- Shell convertido para `AppLayout`, `Sidebar` e `Topbar`.
- Dashboard convertido com cards, grÃ¡fico, donut, tabelas e atividades.
- Empresas convertido com listagem, filtros, tabs e formulÃ¡rio Nova Empresa.
- WhatsApp convertido com instÃ¢ncias, QR Code, templates e logs.
- Rotas criadas para `/dashboard`, `/empresas`, `/empresas/nova`, `/whatsapp`, `/dominios`, `/assinaturas`, `/financeiro`, `/usuarios-master`, `/logs`, `/tickets`, `/configuracoes`.
- Dados mantidos mockados.
- Camada `src/services/api.js` preparada para login, me, companies e create company.
- `.env.example` frontend criado com `VITE_API_URL=http://localhost:3000/api/v1`.
- `npm run lint` executado com sucesso.
- `npm run build` executado com sucesso.
- `npm run dev` executado em `http://127.0.0.1:5173`.
- Rotas principais validadas por HTTP com status 200.

Status: FASE 2 concluÃ­da no escopo aprovado. NÃ£o iniciar Fase 3 sem aprovaÃ§Ã£o.

### ConclusÃ£o da FASE 3 em 2026-06-03

Modulo Empresas / Onboarding conectado ao backend Rails API.

- Backend validado com `GET`, `POST`, `GET :id`, `PATCH :id`, `PATCH :id/activate` e `PATCH :id/deactivate`.
- `CompaniesController` ajustado para aceitar `options` ausente e retornar plano, dominio principal e contagem de usuarios na listagem.
- `CompanyOnboardingService` validado criando company, admin user, company_member, subscription, domain, store_settings, payment_methods, whatsapp_templates, whatsapp_instance mockada e activity_log.
- Frontend ganhou tela simples de login com JWT local.
- `src/services/api.js` atualizado para `VITE_API_URL`, Bearer token, erro 401, erro de conexao e funcoes de Empresas.
- `EmpresasList` conectado ao backend real com loading, erro, refresh, filtros e botoes ativar/inativar.
- `NovaEmpresa` conectado ao `POST /api/v1/master/companies` com validacao basica e toast de sucesso/erro.
- `npm run lint` executado com sucesso.
- `npm run build` executado com sucesso.
- Rails `db:migrate`, `db:seed` e `rails routes` executados com sucesso.
- Teste HTTP criou empresa de teste e validou recursos do onboarding.
- Teste visual headless confirmou login, listagem, criacao pela UI, aparicao na lista e ativar/inativar.

Status: FASE 3 concluida no escopo aprovado. Nao iniciar Fase 4 sem aprovacao.

### Ajuste da FASE 3 em 2026-06-03

Autenticacao frontend refinada antes da Fase 4.

- Menu do usuario no topo do painel agora abre dropdown ao clicar.
- Dropdown mostra nome, e-mail, perfil e acao `Sair`.
- Logout remove token e usuario do `localStorage`, limpa estado da sessao e redireciona para `/login`.
- Rotas protegidas continuam redirecionando para `/login` quando nao ha token.
- Nenhuma alteracao feita em planos, backend de empresas, 2R, Supabase ou deploy.

### ConclusÃ£o da FASE 4 em 2026-06-03

Modulo real de Planos e Assinaturas criado e conectado ao backend Rails API.

- Backend ganhou `PlansController` com listar, exibir, criar e editar planos reais do banco.
- Backend ganhou `SubscriptionsController` com listar, exibir e editar assinatura.
- `GET /api/v1/master/subscriptions` retorna metricas de MRR, trial, inadimplencia e totais.
- Alteracao de plano de empresa feita pela assinatura, sincronizando `company.plan_status` e `company.status`.
- Activity logs registram criacao/edicao de plano, mudanca de plano e atualizacao de assinatura.
- Frontend ganhou pagina `/assinaturas` com cards de receita recorrente e tabela de assinaturas.
- Frontend ganhou pagina `/assinaturas/planos` com listagem, criacao e edicao de planos.
- Camada `src/services/api.js` conectada aos endpoints de planos e assinaturas.
- `npm run lint` executado com sucesso.
- `npm run build` executado com sucesso.
- Rails `db:migrate`, `db:seed` e `rails routes` executados com sucesso.
- Teste HTTP validou login, listar/criar/editar plano, listar assinaturas e alterar plano/status.
- Teste visual headless confirmou carregamento das telas, criacao de plano pela UI e alteracao de assinatura.

Status: FASE 4 concluida no escopo aprovado. Nao iniciar Fase 5 sem aprovacao.

### ConclusÃ£o da FASE 5 em 2026-06-03

Modulo real de Dominios criado e conectado ao backend Rails API.

- Backend ganhou `DomainsController` com listar, exibir, criar, editar, desativar, definir primario e verificar DNS mock.
- `GET /api/v1/master/domains` retorna metricas de total, ativos, pendentes, erro e inativos.
- `DELETE /api/v1/master/domains/:id` desativa o dominio sem remover o registro fisico.
- `GET /api/v1/master/domains/:id/verify` executa verificacao DNS/SSL em modo mock.
- `PATCH /api/v1/master/domains/:id/set_primary` define dominio primario e remove primario anterior da mesma empresa.
- Activity logs registram criacao, edicao, desativacao, primario e verificacao.
- Frontend ganhou pagina `/dominios` com cards, tabela, formulario e acoes.
- Frontend ganhou filtros reais para `/dominios/dns` e `/dominios/ssl`.
- Camada `src/services/api.js` conectada aos endpoints de dominios.
- `rails routes` executado com sucesso.
- `npm run lint` executado com sucesso.
- `npm run build` executado com sucesso.
- Teste HTTP validou listar, criar, editar, definir primario, verificar DNS mock e desativar.
- Teste visual headless confirmou paginas de Dominios, criacao pela UI e verificacao DNS mock.

Status: FASE 5 concluida no escopo aprovado. Nao iniciar Fase 6 sem aprovacao.

### AtualizaÃ§Ã£o da FASE 6 em 2026-06-03

Modulo WhatsApp / Evolution Go implementado no backend e conectado ao frontend, com pendencia externa de conectividade.

- `EvolutionGoClient` atualizado para modo real via `EVOLUTION_GO_BASE_URL` e `EVOLUTION_GO_API_KEY`, com fallback mock quando `EVOLUTION_GO_MOCK_MODE=true`.
- API key fica somente no backend; frontend chama Rails e Rails chama Evolution Go.
- `.env.example` atualizado com placeholders, sem chave real.
- `.env` local configurado para modo real.
- Endpoints Rails criados para instancias, QR Code, status, desconectar, reiniciar, excluir, templates, logs e teste de conexao.
- Frontend `/whatsapp`, `/whatsapp/qrcode`, `/whatsapp/templates` e `/whatsapp/logs` conectado ao backend Rails.
- Criacao automatica no onboarding permanece preparada, mas o toggle no frontend nao vem mais ativo por padrao.
- `rails routes` executado com sucesso.
- `npm run lint` executado com sucesso.
- `npm run build` executado com sucesso.
- Teste visual headless confirmou as quatro telas WhatsApp carregando dados locais.

Pendencia:

- A base informada para a Evolution Go respondeu HTTP 404 para os endpoints de API testados (`/instance/fetchInstances`, `/api/instance/fetchInstances`, `/api/v1/instance/fetchInstances`, `/api/v2/instance/fetchInstances`).
- O host responde HTML em `/` e `/manager`, indicando que a URL atual parece apontar para o painel/manager, nao para a base REST da API Evolution.
- Por seguranca, nenhuma instancia real nova foi criada na Evolution Go enquanto a conexao real nao estiver confirmada.

Status: FASE 6 implementada localmente, mas nao concluida porque a conexao real com a Evolution Go ainda nao foi estabelecida. Nao iniciar Fase 7 sem aprovacao.

### Continuação da FASE 6 em 2026-06-03

Auditoria da VPS confirmou a Evolution Go real rodando no container `evolution-go-1dvv-api-1`, imagem `evoapicloud/evolution-go:latest`, porta interna `4000`, com Nginx apontando para `127.0.0.1:4000`.

- Hosts da Evolution: `marinho.replymesh.cloud`, `api.marinho.replymesh.cloud` e `evolution.marinho.replymesh.cloud`.
- Rota real de listagem: `GET /instance/all`.
- A rota antiga `/instance/fetchInstances` retorna `404` e nao deve ser usada para esta imagem.
- Sem API key, `/instance/all` retorna `401`.
- `EvolutionGoClient` ajustado para testar `apikey`, `x-api-key` e `Authorization: Bearer` sem expor a chave.
- Listagem de WhatsApp ajustada para exibir instancias locais e remotas com origem `local`/`remote`.
- Acoes de QR Code, status, desconectar e reiniciar ficam bloqueadas para instancias apenas remotas ate serem vinculadas a uma empresa local.

Dominios:

- Dominio principal correto: `replymesh.cloud`.
- Arquitetura futura prevista: `app.replymesh.cloud` para Painel Master, `api.replymesh.cloud` para API Rails e `{slug}.replymesh.cloud` para lojas/clientes.
- Nao usar `.com.br` como dominio padrao nas novas configuracoes.

Status: FASE 6 segue em andamento. Proximo passo e validar `/api/v1/master/whatsapp/settings/test_connection` e `/api/v1/master/whatsapp/instances` com a API key local do backend.

### Validação real da FASE 6 em 2026-06-03

Leitura real da Evolution Go validada pelo backend Rails.

- `GET /instance/all` funcionou com o header `apikey`.
- Headers `x-api-key` e `Authorization: Bearer` retornaram `401` neste ambiente.
- `GET /api/v1/master/whatsapp/settings/test_connection` retornou sucesso, `instances_count=1`.
- `GET /api/v1/master/whatsapp/instances` retornou 3 linhas: 2 locais e 1 remota.
- Instancia remota encontrada: `Lanche`, status normalizado `connected`, status bruto `connected`.
- Nenhuma instancia foi criada, desconectada, reiniciada ou excluida.
- `npm run lint` e `npm run build` executados com sucesso no frontend.

Status: FASE 6 agora tem leitura real funcionando. Ainda falta mapear e validar com seguranca QR Code, status por instancia e criacao controlada de `replymesh_teste_local`.

### Correção de estabilidade da FASE 6 em 2026-06-03

O ajuste parcial para `instance_uuid`/`instance_token` foi revertido porque o banco local ainda nao possui essas colunas e isso podia quebrar a listagem de WhatsApp.

- Removida a migration parcial de identidade Evolution antes de ser aplicada.
- Removidas referencias a `instance_uuid` e `instance_token` do controller/model local.
- `EvolutionGoClient` manteve a leitura real por `GET /instance/all` com header `apikey`.
- Acoes reais ainda nao confirmadas, como QR Code, desconectar, reiniciar e excluir, permanecem bloqueadas/pendentes para evitar impacto em instancias reais.
- `.env` local segue com Evolution Go configurado, sem expor a chave em documentacao.
- `GET /api/v1/master/whatsapp/settings/test_connection` validado com sucesso.
- `GET /api/v1/master/whatsapp/instances` validado com instancias locais e remotas.
- `npm run lint` e `npm run build` executados com sucesso.

Status: FASE 6 estabilizada novamente no escopo de leitura real. Proximo passo seguro: criar uma migration planejada para `instance_uuid` e `instance_token`, rodar `rails db:migrate`, e so entao implementar criacao/QR da instancia teste.

### Migration segura da FASE 6 em 2026-06-03

Suporte de banco para dados reais da Evolution Go adicionado sem criar, desconectar, reiniciar ou excluir instancias reais.

- Migration `20260603000014_add_evolution_remote_fields_to_whatsapp_instances.rb` criada e aplicada.
- Campos adicionados em `whatsapp_instances`: `instance_uuid`, `instance_token`, `remote_status`, `remote_data`, `last_remote_sync_at`.
- Indice adicionado em `whatsapp_instances.instance_uuid`; indice existente em `company_id + instance_name` preservado.
- Tabela `whatsapp_remote_instances` criada para espelhar instancias remotas nao vinculadas sem forcar `company_id` incorreto.
- `WhatsappInstance#safe_json` criado para serializar sem `instance_token`.
- `EvolutionGoClient` segue usando `GET /instance/all` e normaliza UUID, nome, status, numero conectado, profile name e dados remotos sem token.
- Endpoint seguro criado: `POST /api/v1/master/whatsapp/instances/sync`.
- Sincronizacao atualiza instancias locais pelo mesmo `instance_name`; remotas sem empresa clara ficam nao vinculadas.
- Frontend `/whatsapp` agora mostra Local, Remota vinculada e Remota nao vinculada, com botao de sincronizacao segura.
- Criacao de instancia teste e QR Code real permanecem bloqueados para a proxima etapa.

Testes executados:

- `rails db:migrate` OK.
- `rails routes` OK.
- `GET /api/v1/master/whatsapp/settings/test_connection` OK.
- `POST /api/v1/master/whatsapp/instances/sync` OK.
- `GET /api/v1/master/whatsapp/instances` OK.
- `npm run lint` OK.
- `npm run build` OK.

Resultado da sincronizacao: 1 instancia remota encontrada (`Lanche`), 0 vinculadas automaticamente e 1 nao vinculada.

### Criacao controlada de instancia teste na FASE 6 em 2026-06-03

Instancia teste `replymesh_teste_local` criada de forma controlada na Evolution Go.

- Endpoint criado: `POST /api/v1/master/whatsapp/instances/create_test`.
- Antes de criar, o backend verifica existencia local e remota pelo nome `replymesh_teste_local`.
- Se a instancia ja existir, o endpoint apenas sincroniza e nao cria duplicado.
- Token da instancia e gerado no backend e salvo em `whatsapp_instances.instance_token`.
- `instance_token` nao e retornado ao frontend e nao entra em logs/documentacao.
- `instance_uuid` foi capturado e salvo.
- Status remoto capturado: `disconnected`.
- `Lanche` nao foi alterada, desconectada, reiniciada, excluida nem teve webhook alterado.
- QR Code real e webhook continuam pendentes para proxima etapa segura.

Testes executados:

- Pre-checagem confirmou que `replymesh_teste_local` nao existia local/remota antes da criacao.
- Criacao controlada retornou `created_remote=true`.
- Reexecucao do endpoint confirmou `created_remote=false`, sem duplicar, apenas sincronizando.
- Listagem remota retornou `Lanche` e `replymesh_teste_local`.
- `rails routes` OK.
- `npm run lint` OK.
- `npm run build` OK.
- `/whatsapp` respondeu 200 no Vite local.

Status: FASE 6 avancou com criacao controlada da instancia teste. Proxima etapa segura: implementar `GET /instance/qr` usando `instance_token` da propria instancia teste, sem configurar webhook ainda.

### QR Code real da instancia teste na FASE 6 em 2026-06-03

QR Code real implementado somente para a instancia segura `replymesh_teste_local`.

- Endpoint usado no Rails: `GET /api/v1/master/whatsapp/instances/:id/qrcode`.
- Chamada real Evolution Go: `GET /instance/qr` com header `apikey` usando apenas o `instance_token` da instancia teste.
- O endpoint bloqueia QR real para instancias que nao sejam de teste.
- `Lanche` nao foi consultada para QR, nao teve webhook alterado e nao recebeu nenhuma acao de conexao/desconexao.
- Retorno normalizado para `qrcode.type` e `qrcode.value`.
- Formato retornado pela Evolution: `data.Qrcode` como `data:image/png;base64,...`.
- Frontend `/whatsapp/qrcode` lista apenas instancias elegiveis `replymesh_teste*`, gera o QR e permite atualizar status.
- Status apos atualizacao: `disconnected`.
- `instance_token` e `apikey` nao aparecem no JSON da API nem nos documentos.

Testes executados:

- `rails routes` OK.
- `GET /api/v1/master/whatsapp/instances/:id/qrcode` OK para `replymesh_teste_local`.
- `GET /api/v1/master/whatsapp/instances/:id/status` OK.
- `npm run lint` OK.
- `npm run build` OK.
- `/whatsapp/qrcode` respondeu 200 no Vite local.

Status: FASE 6 tem leitura real, criacao controlada de instancia teste e QR Code real funcionando. Proxima etapa segura: preparar conexao/webhook da instancia teste usando URL publica futura, sem tocar na `Lanche`.

### Fechamento seguro da FASE 6 em 2026-06-04

FASE 6 marcada como concluida parcialmente em modo seguro.

- Evolution Go leitura real concluida com `GET /instance/all` e header `apikey`.
- Instancia teste `replymesh_teste_local` criada e vinculada localmente.
- `instance_uuid` capturado e `instance_token` armazenado somente no backend.
- QR Code real concluido para `replymesh_teste_local`.
- `Lanche` permaneceu intocada.
- Webhook real pendente para quando existir URL publica da API.
- URL futura prevista para webhook: `https://api.replymesh.cloud/api/v1/webhooks/evolution`.
- Webhook local nao foi configurado.
- FASE 7 ainda nao foi iniciada.

Proximo bloco recomendado: FASE 7 — Logs, Alertas e Auditoria.

### Conclusao da FASE 6.5 em 2026-06-04

Modulo de Configuracoes da Empresa criado com dados vinculados por `company_id`.

- Migration `20260604000001_extend_store_settings_for_company_settings.rb` criada e aplicada.
- `StoreSetting` passou a suportar dados gerais, identidade visual, redes sociais, entrega, PIX, horarios, mensagem WhatsApp e formas de pagamento.
- Endpoints criados: `GET /api/v1/company/settings` e `PUT /api/v1/company/settings`.
- Controller criado sem namespace conflitante com o model `Company`.
- `CompanyOnboardingService` ajustado para novas empresas nascerem com configuracoes padrao.
- Frontend `/configuracoes` substituiu o stub por tela real com abas: Geral, Identidade Visual, Redes Sociais, Entrega, PIX, Horarios e WhatsApp.
- Menu lateral de Configuracoes agora e expansivel com os blocos da Fase 6.5.
- Upload de logo e banner preparado via preview local/base64 armazenado nos campos de URL enquanto nao houver storage dedicado.
- API frontend preparada com `getCompanySettings` e `updateCompanySettings`.

Testes executados:

- `rails db:migrate`
- `rails routes`
- `POST /api/v1/auth/login`
- `GET /api/v1/master/companies`
- `GET /api/v1/company/settings`
- `PUT /api/v1/company/settings`
- `npm run lint`
- `npm run build`
- `/configuracoes` respondeu 200 no Vite local.

Status: FASE 6.5 concluida no escopo aprovado. Nao iniciar Fase 7 sem confirmacao.

### Conclusão da FASE 9 em 2026-06-04

Auditoria completa do projeto Lanches do 2R (`M:\temple1`) e criação do plano técnico de migração.

- Auditados: 30 tabelas, 70 migrations SQL, 25+ RPCs, 8 Edge Functions, 2 apps Flutter, 15 pontos hard-coded.
- Sistema 2R confirmado como 100% single-tenant, base ideal para o template SaaS.
- `MIGRATION_2R_PLAN.md` criado com estratégia completa de conversão para multi-tenant.
- Mapeamento tabela a tabela: Supabase → Rails com model, endpoint, company_id e risco.
- Mapeamento RPC a RPC: Supabase → Services Rails com equivalências exatas.
- Mapeamento Edge Function a Edge Function: → controllers/jobs Rails.
- 15 pontos hard-coded mapeados e estratégia de parametrização definida.
- Ordem de migração definida em 7 fases (FASE 10 a FASE 16).
- Checklist de backup e rollback completo.
- Riscos classificados: 5 altos, 5 médios, 5 baixos.
- Nenhum arquivo do 2R foi alterado.
- Nenhum dado do Supabase foi tocado.
- Nenhuma migration foi executada.

Status: FASE 9 concluída no escopo aprovado. Não iniciar FASE 10 sem confirmação.

---

### Conclusão da FASE 8 em 2026-06-04

Módulo Financeiro real criado com dados do banco.

- Backend `FinanceiroController` criado com 3 actions: `index`, `cobrancas`, `inadimplencia`.
- `GET /api/v1/master/financeiro` retorna: MRR real, ARR, empresas ativas/trial/inadimplentes/canceladas, evolução mensal (13 meses), receita por plano e top empresas por receita.
- `GET /api/v1/master/financeiro/cobrancas` retorna assinaturas ativas e trial com empresa, plano, valor e datas.
- `GET /api/v1/master/financeiro/inadimplencia` retorna assinaturas overdue/suspended com empresa, plano e valor em risco.
- Todos os endpoints protegidos com `authenticate_user!` + `require_super_admin!`.
- Rotas registradas em `config/routes.rb`.
- Frontend `Financeiro.jsx` criado com 3 abas: Visão Geral, Cobranças e Inadimplência.
- Visão Geral: 5 stat cards, gráfico MRR mensal (LineChart), tabela receita por plano com totais, top empresas e histórico mensal.
- Cobranças: stat cards de total esperado, tabela com empresa/plano/status/datas/valor.
- Inadimplência: stat cards de valor em risco, tabela com empresa/plano/status/valor, empty state quando limpo.
- Rotas `/financeiro`, `/financeiro/cobrancas`, `/financeiro/inadimplencia` registradas no React Router.
- `api.getFinanceiro`, `api.getFinanceiroCobrancas`, `api.getFinanceiroInadimplencia` adicionados em `services/api.js`.

Testes executados:

- `rails routes | grep financeiro` OK (3 rotas)
- `GET /api/v1/master/financeiro` OK (success, 13 meses, 5 planos)
- `GET /api/v1/master/financeiro/cobrancas` OK (success, count, total)
- `GET /api/v1/master/financeiro/inadimplencia` OK (success, count, total_overdue)
- `npm run lint` OK
- `npm run build` OK (1772 módulos)

Status: FASE 8 concluída no escopo aprovado. Não iniciar FASE 9 sem confirmação.

---

### Conclusao da FASE 7 em 2026-06-04

Modulo real de Logs, Alertas e Auditoria criado no Painel Master.

- `ActivityLog` e `SystemAlert` validados como base de auditoria.
- Migration `20260604000002_extend_system_alerts_for_audit.rb` criada e aplicada para `metadata_json`, `resolved_by_id` e indice de `resolved_at`.
- Helper de auditoria criado no `ApplicationController`, com mascara para senhas, tokens, API keys e autorizacoes.
- Eventos registrados: login master, alteracao de empresa, alteracao de plano/assinatura, alteracao de dominio, acoes WhatsApp/Evolution, alteracao de configuracoes da loja e resolucao de alerta.
- Alertas automaticos criados para falhas relevantes de Evolution Go e configuracoes da empresa.
- Endpoints validados: `GET /api/v1/master/activity_logs`, `GET /api/v1/master/system_alerts`, `PATCH /api/v1/master/system_alerts/:id/resolve`.
- Frontend criou `/logs`, `/logs/atividades`, `/logs/erros`, `/logs/webhooks`, `/logs/evolution` e `/logs/automacoes`.
- Dashboard passou a consumir atividades recentes e alertas pendentes reais.
- Filtros implementados por empresa, tipo, status e data.
- Detalhes de log/alerta exibidos em modal JSON sanitizado.
- Alertas podem ser marcados como resolvidos pelo painel.

Testes executados:

- `rails db:migrate`
- `rails routes`
- `POST /api/v1/auth/login`
- `GET /api/v1/master/activity_logs`
- `GET /api/v1/master/system_alerts`
- `PATCH /api/v1/master/system_alerts/:id/resolve`
- `PUT /api/v1/company/settings` gerando `store_settings_updated`
- `npm run lint`
- `npm run build`
- `/logs`, `/logs/atividades`, `/logs/erros` e `/logs/evolution` responderam 200 no Vite local.

Status: FASE 7 concluida no escopo aprovado. Nao iniciar Fase 8 sem confirmacao.

---

## FASE 0 â€” PreparaÃ§Ã£o do Ambiente

> Objetivo: Garantir que o ambiente local estÃ¡ pronto para o desenvolvimento.

- [x] Verificar Ruby instalado â€” **Ruby 4.0.5** âœ… instalado em `W:\sas replymesh\tools\ruby`
- [x] Verificar Rails instalado â€” **Rails 8.1.3** âœ…
- [x] Verificar Node.js instalado â€” **v22.19.0** âœ… (npm 10.9.3 âœ…)
- [x] Verificar PostgreSQL instalado e rodando â€” **v17.6** âœ… serviÃ§o `postgresql-x64-17` Running
- [x] Verificar Redis instalado e rodando â€” **Redis 5.0.14.1** âœ… em `W:\sas replymesh\tools\redis` â€” ping: PONG
- [ ] Criar estrutura de pastas `replymesh-api/`
- [ ] Criar estrutura de pastas `replymesh-frontend/`
- [ ] Criar `.env.example` com todas as variÃ¡veis necessÃ¡rias
- [x] Criar `README.md`
- [x] Criar `MASTER_PLAN_REPLYMESH.md`
- [x] Criar `DATABASE_REPLYMESH.md`
- [x] Criar `ROADMAP_REPLYMESH.md`

**CritÃ©rio de conclusÃ£o:** Todos os prÃ©-requisitos instalados, pastas criadas, documentaÃ§Ã£o completa.

---

## FASE 1 â€” Backend Base Rails API

> Objetivo: Ter um servidor Rails API rodando com autenticaÃ§Ã£o JWT e as tabelas base.

### Setup inicial
- [x] Criar projeto Rails API (`rails new replymesh-api --api --database=postgresql`)
- [x] Configurar `database.yml` com banco local
- [x] Configurar CORS (`rack-cors`) para aceitar localhost:5173
- [x] Configurar dotenv (gem `dotenv-rails`)
- [x] Configurar gems: `jwt`, `bcrypt`, `pundit`, `rspec-rails`, `factory_bot_rails`

### Models e Migrations
- [x] Criar migration + model `User`
- [x] Criar migration + model `Company`
- [x] Criar migration + model `CompanyMember`
- [x] Criar migration + model `Plan`
- [x] Criar migration + model `Subscription`
- [x] Criar migration + model `Domain`
- [x] Criar migration + model `StoreSetting`
- [x] Criar migration + model `PaymentMethod`
- [x] Criar migration + model `WhatsappInstance`
- [x] Criar migration + model `WhatsappTemplate`
- [x] Criar migration + model `WhatsappLog`
- [x] Criar migration + model `ActivityLog`
- [x] Criar migration + model `SystemAlert`
- [x] Rodar `rails db:create db:migrate`

### Seeds
- [x] Criar seeds com planos padrÃ£o (Essencial, Profissional, Premium IA)
- [x] Criar seed com usuÃ¡rio super_admin (Admin Master)
- [x] Criar seeds com templates WhatsApp padrÃ£o
- [x] Rodar `rails db:seed`

### AutenticaÃ§Ã£o
- [x] Criar `SessionsController` (POST /api/v1/auth/login)
- [x] Criar `ApplicationController` com `authenticate_user!`
- [x] Criar helper `encode_jwt` / `decode_jwt`
- [x] Criar endpoint GET /api/v1/me (usuÃ¡rio autenticado)
- [x] Testar login via curl/Insomnia

**CritÃ©rio de conclusÃ£o:** Login retorna JWT. `/api/v1/me` retorna usuÃ¡rio com token vÃ¡lido.

---

## FASE 2 â€” Frontend Base React/Vite

> Objetivo: Converter o protÃ³tipo HTML existente para React/Vite, preservando 100% do visual.

### AnÃ¡lise e setup
- [x] Analisar CSS inline do `index.html` â€” listar todas as classes e variÃ¡veis
- [x] Criar projeto Vite (`npm create vite@latest replymesh-frontend -- --template react`)
- [x] Instalar dependÃªncias: `react-router-dom`, `lucide-react`
- [x] Instalar fonte Geist (`@fontsource/geist` ou manter CDN)
- [x] Extrair CSS completo do `index.html` â†’ `src/styles/main.css`
- [x] Verificar que nenhuma classe CSS foi perdida

### Componentes de Layout
- [x] Criar `src/components/layout/AppLayout.jsx` (wrapper principal)
- [x] Criar `src/components/layout/Sidebar.jsx` (baseado em shell.jsx)
  - SeÃ§Ãµes: MASTER, SUPORTE, CONFIGURAÃ‡Ã•ES
  - Grupos colapsÃ¡veis com animaÃ§Ã£o
  - Comportamento collapse/expand
  - Logo + user footer
- [x] Criar `src/components/layout/Topbar.jsx` (baseado em shell.jsx)
  - Busca com âŒ˜K
  - NotificaÃ§Ãµes com badge
  - Dropdown de usuÃ¡rio

### Componentes UI (de lib.jsx)
- [x] Criar `src/components/ui/Badge.jsx` (tones: gray, green, red, amber, blue)
- [x] Criar `src/components/ui/Switch.jsx`
- [x] Criar `src/components/ui/CoAvatar.jsx` (iniciais + cor determinÃ­stica)
- [x] Criar `src/components/ui/LineChart.jsx` (com tooltip hover)
- [x] Criar `src/components/ui/Donut.jsx`
- [x] Criar `src/components/shared/StatCard.jsx`
- [x] Criar `src/components/shared/PageStub.jsx` (placeholder)
- [x] Criar `src/components/shared/Toast.jsx` (auto-dismiss 2.6s)
- [x] Criar `src/lib/utils.js` (`BRL()`, `NUM()`, `slugify()`)

### PÃ¡ginas
- [x] Criar `src/pages/Dashboard.jsx` (stat cards, charts, tabela, atividades)
- [x] Criar `src/pages/empresas/EmpresasList.jsx` (tabs, filtros, tabela)
- [x] Criar `src/pages/empresas/NovaEmpresa.jsx` (form 2 colunas + sidebar sticky)
- [x] Criar `src/pages/whatsapp/WAInstances.jsx`
- [x] Criar `src/pages/whatsapp/WAQrCode.jsx` (QR animado, countdown)
- [x] Criar `src/pages/whatsapp/WATemplates.jsx`
- [x] Criar `src/pages/whatsapp/WALogs.jsx`
- [x] Criar pÃ¡ginas stub para: Assinaturas, DomÃ­nios, Financeiro, UsuÃ¡rios Master, Logs, Tickets, Planos, PermissÃµes, ConfiguraÃ§Ãµes

### Roteamento
- [x] Criar `src/router/routes.jsx` com React Router v6
  - `/` â†’ Dashboard
  - `/empresas` â†’ EmpresasList
  - `/empresas/nova` â†’ NovaEmpresa
  - `/whatsapp/instancias` â†’ WAInstances
  - `/whatsapp/qrcode` â†’ WAQrCode
  - `/whatsapp/templates` â†’ WATemplates
  - `/whatsapp/logs` â†’ WALogs
  - Demais rotas â†’ PageStub

### VerificaÃ§Ã£o visual
- [x] Sidebar idÃªntica ao protÃ³tipo (largura, cores, hover, collapse)
- [x] Dashboard idÃªntico ao protÃ³tipo (grid 5 cards, chart, tabela)
- [x] FormulÃ¡rio Nova Empresa idÃªntico (incluindo sidebar sticky e validaÃ§Ãµes)
- [x] WhatsApp tabs funcionando
- [x] Responsividade preservada
- [x] Nenhum backend real necessÃ¡rio nesta fase

**CritÃ©rio de conclusÃ£o:** `npm run dev` â†’ painel visualmente idÃªntico ao `index.html` original, com rotas funcionando.

---

## FASE 3 â€” Empresas / Onboarding

> Objetivo: FormulÃ¡rio Nova Empresa conectado ao backend â€” criaÃ§Ã£o real via API.

### Backend
- [x] Criar `GET /api/v1/master/companies` (lista paginada)
- [x] Criar `POST /api/v1/master/companies` (onboarding completo)
- [x] Criar `GET /api/v1/master/companies/:id`
- [x] Criar `PUT /api/v1/master/companies/:id`
- [x] Criar `PATCH /api/v1/master/companies/:id/activate`
- [x] Criar `PATCH /api/v1/master/companies/:id/deactivate`
- [x] Criar `CompanyOnboardingService` com transaction completa (14 passos)
- [ ] Criar testes RSpec para criaÃ§Ã£o de empresa (happy path + rollback)

### Frontend
- [x] Conectar `EmpresasList` ao `GET /companies`
- [x] Conectar `NovaEmpresa` ao `POST /companies`
- [x] Remover dados mock de empresas
- [x] Mostrar loading states durante criaÃ§Ã£o
- [x] Exibir toast de sucesso/erro
- [x] Redirecionar para lista apÃ³s criar
- [x] Mostrar empresa recÃ©m-criada no topo da lista

**CritÃ©rio de conclusÃ£o:** Criar empresa pelo formulÃ¡rio â†’ aparece na lista â†’ dados persistidos no banco.

---

## FASE 4 â€” Planos e Assinaturas

> Objetivo: Gerenciar planos e visualizar assinaturas das empresas.

- [x] Criar `GET /api/v1/master/plans`
- [x] Criar `GET /api/v1/master/subscriptions`
- [x] Criar pÃ¡gina Planos (listar + editar planos)
- [x] Criar pÃ¡gina Assinaturas â€” VisÃ£o Geral (empresas por plano, receita MRR)
- [x] Criar pÃ¡gina Assinaturas â€” Faturas (histÃ³rico)
- [x] Criar pÃ¡gina Assinaturas â€” InadimplÃªncia (status overdue)
- [x] Vincular plano ao badge da listagem de empresas
- [x] Calcular MRR (soma das assinaturas ativas)

**CritÃ©rio de conclusÃ£o:** Ver lista de planos. Ver empresas por status de assinatura. MRR calculado corretamente.

---

## FASE 5 â€” DomÃ­nios

> Objetivo: Gerenciar domÃ­nios e subdomÃ­nios das empresas.

- [x] Criar `GET /api/v1/master/domains`
- [x] Criar `POST /api/v1/master/domains`
- [x] Criar `GET /api/v1/master/domains/:id/verify`
- [x] Criar pÃ¡gina DomÃ­nios â€” Todos os DomÃ­nios
- [x] Criar pÃ¡gina DomÃ­nios â€” ConfiguraÃ§Ã£o DNS (mockado)
- [x] Criar pÃ¡gina DomÃ­nios â€” Certificados SSL (mockado)
- [x] BotÃ£o "Verificar DNS" (retorna status mockado)
- [x] Status visual: pending (Ã¢mbar), active (verde), dns_error (vermelho)

**CritÃ©rio de conclusÃ£o:** Ver domÃ­nios por empresa. Adicionar domÃ­nio customizado. Verificar status DNS.

---

## FASE 6 â€” WhatsApp / Evolution Go

> Objetivo: Gerenciar instÃ¢ncias WhatsApp via Evolution Go (com modo mock).

### Backend
- [x] Criar `EvolutionGoClient` service
  - `test_connection` â€” verificar se Evolution Go estÃ¡ acessÃ­vel
  - `list_instances` â€” listar instÃ¢ncias
  - `create_instance(name)` â€” criar nova instÃ¢ncia
  - `get_qr_code(name)` â€” obter QR Code (base64)
  - `get_status(name)` â€” status da instÃ¢ncia
  - `disconnect(name)` â€” desconectar
  - `restart(name)` â€” reiniciar
- [x] Implementar modo mock (quando sem Evolution Go configurado)
- [x] Criar `GET /api/v1/master/whatsapp/instances`
- [x] Criar `POST /api/v1/master/whatsapp/instances`
- [x] Criar `GET /api/v1/master/whatsapp/instances/:id/qrcode`
- [x] Criar `GET /api/v1/master/whatsapp/instances/:id/status`
- [x] Criar `POST /api/v1/master/whatsapp/instances/:id/disconnect`
- [x] Criar `POST /api/v1/master/whatsapp/instances/:id/restart`
- [x] Criar `DELETE /api/v1/master/whatsapp/instances/:id`
- [x] Criar `GET /api/v1/master/whatsapp/templates`
- [x] Criar `POST /api/v1/master/whatsapp/templates`
- [x] Criar `PATCH /api/v1/master/whatsapp/templates/:id`
- [x] Criar `GET /api/v1/master/whatsapp/logs`
- [x] Criar `GET /api/v1/master/whatsapp/settings/test_connection`
- [x] Confirmar conexao real com a base REST correta da Evolution Go
  - [x] Identificar rota real de listagem: `GET /instance/all`
  - [x] Ajustar client para trocar `/instance/fetchInstances` por `/instance/all`
  - [x] Validar header aceito e quantidade de instancias retornadas pelo Rails
- [x] Criar instancia teste controlada `replymesh_teste_local`
- [x] Obter QR Code real da instancia teste
- [ ] Configurar webhook real apenas quando existir URL publica da API

### Frontend
- [x] Conectar WAInstances ao backend
- [x] Conectar WAQrCode ao endpoint Rails
- [x] Conectar WATemplates ao backend
- [x] Conectar WALogs ao backend
- [ ] PÃ¡gina ConfiguraÃ§Ãµes > IntegraÃ§Ãµes > Evolution Go
  - URL base, API Key, status, botÃ£o testar conexÃ£o

**CritÃ©rio de conclusÃ£o:** InstÃ¢ncias aparecem da API. QR Code gerado pelo backend. Templates editÃ¡veis.

---

## FASE 6.5 - Configuracoes da Empresa

> Objetivo: Permitir que cada empresa mantenha suas configuracoes proprias vinculadas por `company_id`.

### Backend
- [x] Estender `store_settings` com campos gerais, identidade visual, redes sociais, entrega, PIX, horarios e WhatsApp
- [x] Criar serializacao segura em `StoreSetting`
- [x] Criar `GET /api/v1/company/settings`
- [x] Criar `PUT /api/v1/company/settings`
- [x] Ajustar onboarding para criar configuracoes padrao

### Frontend
- [x] Criar tela real em `/configuracoes`
- [x] Criar menu expansivel Configuracoes
- [x] Criar abas Geral, Identidade Visual, Redes Sociais, Entrega, PIX, Horarios e WhatsApp
- [x] Preparar upload de logo e banner
- [x] Conectar leitura e salvamento na API Rails

### Testes
- [x] Rodar `rails db:migrate`
- [x] Rodar `rails routes`
- [x] Testar login e settings via HTTP
- [x] Rodar `npm run lint`
- [x] Rodar `npm run build`

Status: concluida. Nao iniciar Fase 7 sem confirmacao.

---

## FASE 7 â€” Logs, Alertas e Auditoria

> Objetivo: Registrar e visualizar eventos importantes do sistema.

- [x] Registrar `activity_log` em: criaÃ§Ã£o de empresa, alteraÃ§Ã£o de plano, alteraÃ§Ã£o de status
- [x] Registrar `activity_log` em: login do master, aÃ§Ãµes WhatsApp
- [x] Criar `system_alert` automÃ¡tico em falhas de onboarding e erros importantes
- [x] Criar `GET /api/v1/master/activity_logs`
- [x] Criar `GET /api/v1/master/system_alerts`
- [x] Criar `PATCH /api/v1/master/system_alerts/:id/resolve`
- [x] Criar pÃ¡gina Logs do Sistema (tabela filtrada por nÃ­vel/data)
- [x] Criar pÃ¡gina Alertas (alertas nÃ£o resolvidos em destaque)
- [x] BotÃ£o "Marcar como resolvido" nos alertas

**CritÃ©rio de conclusÃ£o:** Criar empresa â†’ log registrado. Ver logs no painel. Alertas aparecem quando hÃ¡ erros.

---

## FASE 8 â€” Financeiro Inicial

> Objetivo: Visualizar receita recorrente e situaÃ§Ã£o financeira das empresas.

- [x] Criar página Financeiro — Receita (MRR por período, gráfico)
- [x] Criar página Financeiro — Cobranças (assinaturas ativas/trial)
- [x] Criar página Financeiro — Inadimplência (overdue/suspended)
- [x] Calcular MRR a partir das assinaturas ativas
- [x] Mostrar evolução MRR mês a mês (13 meses)
- [x] Cards: MRR | ARR | Empresas Ativas | Trial | Inadimplentes | Canceladas

**CritÃ©rio de conclusÃ£o:** Dashboard financeiro com MRR calculado do banco real.

---

## FASE 9 â€” PreparaÃ§Ã£o para Sistema 2R

> Objetivo: Planejar (somente planejar, nÃ£o executar) a integraÃ§Ã£o do Lanches do 2R.

- [x] Mapear schema atual do banco Supabase do 2R -- 30 tabelas auditadas em M:\temple1
- [x] Identificar tabelas que serao reaproveitadas -- todas as 30 mapeadas
- [x] Definir como adicionar company_id as tabelas -- estrategia documentada
- [x] Definir estrategia de migracao de dados (products, orders, customers)
- [x] Definir como o sistema 2R usara a API Rails da Replymesh
- [x] Documentar plano de migracao em MIGRATION_2R_PLAN.md -- criado com 15 secoes
- [x] NAO executar migracao -- apenas documentar -- zero alteracoes no 2R

**CritÃ©rio de conclusÃ£o:** Documento de migraÃ§Ã£o aprovado. Zero alteraÃ§Ãµes no 2R.

---

## FASE 10 â€” Deploy VPS (Hostinger)

> Objetivo: Fazer o primeiro deploy funcional em produÃ§Ã£o.

- [ ] Criar `Dockerfile` para Rails API
- [ ] Criar `Dockerfile` para React/Vite (nginx)
- [ ] Criar `docker-compose.yml` (rails + postgres + redis + nginx)
- [ ] Configurar PostgreSQL na VPS
- [ ] Configurar Redis na VPS
- [ ] Configurar Nginx como reverse proxy
- [ ] Configurar SSL (Let's Encrypt / Certbot)
- [ ] Configurar variÃ¡veis de ambiente na VPS
- [ ] Configurar backup automÃ¡tico do banco
- [ ] Configurar log rotation
- [ ] Fazer deploy de teste com empresa fictÃ­cia
- [ ] Testar criaÃ§Ã£o de empresa em produÃ§Ã£o

**CritÃ©rio de conclusÃ£o:** Painel Master acessÃ­vel via domÃ­nio real com HTTPS. CriaÃ§Ã£o de empresa funcional em prod.

---

## FASE 11 - APIs Rails para a Loja

> Objetivo: Criar APIs Rails que substituirao gradualmente chamadas Supabase do template Lanches do 2R, sem mexer no projeto original do 2R.

### Backend
- [x] Validar `current_company` para rotas autenticadas `/api/v1/store`
- [x] Validar resolucao publica por `company_slug` em `/api/v1/public/:company_slug`
- [x] Garantir isolamento por `company_id` nas consultas da loja
- [x] Confirmar associacoes operacionais em `Company`
- [x] Complementar associacoes operacionais em `User`
- [x] Criar/validar controllers de cardapio, clientes, pedidos, estoque, caixa, motoboys, entregas, mesas e configuracoes
- [x] Criar/validar API publica da loja: info, menu, banners, horarios, zonas e checkout
- [x] Integrar `CheckoutService`, `OrderStatusService`, `InventoryService`, `CashService` e `DeliveryService`

### Endpoints principais
- [x] `/api/v1/store/categories`
- [x] `/api/v1/store/products`
- [x] `/api/v1/store/products/:product_id/option_groups`
- [x] `/api/v1/store/products/:product_id/option_groups/:option_group_id/items`
- [x] `/api/v1/store/customers`
- [x] `/api/v1/store/customers/:customer_id/addresses`
- [x] `/api/v1/store/orders`
- [x] `/api/v1/store/orders/:id/status`
- [x] `/api/v1/store/orders/:id/record_payment`
- [x] `/api/v1/store/inventory_items`
- [x] `/api/v1/store/inventory_movements`
- [x] `/api/v1/store/cash_sessions`
- [x] `/api/v1/store/cash_movements`
- [x] `/api/v1/store/motoboys`
- [x] `/api/v1/store/deliveries`
- [x] `/api/v1/store/dining_tables`
- [x] `/api/v1/store/table_sessions`
- [x] `/api/v1/store/business_hours`
- [x] `/api/v1/store/business_hour_exceptions`
- [x] `/api/v1/store/app_banners`
- [x] `/api/v1/store/coupons`
- [x] `/api/v1/public/:company_slug/store`
- [x] `/api/v1/public/:company_slug/menu`
- [x] `/api/v1/public/:company_slug/banners`
- [x] `/api/v1/public/:company_slug/business_hours`
- [x] `/api/v1/public/:company_slug/delivery_zones`
- [x] `/api/v1/public/:company_slug/orders`

### Testes
- [x] `rails db:migrate`
- [x] `rails routes`
- [x] Eager load dos controllers/models
- [x] Login JWT
- [x] `current_company` com super_admin exigindo `X-Company-Id`
- [x] Criar categoria/produto de teste
- [x] Checkout publico com `CheckoutService`
- [x] Transicoes de pedido com `OrderStatusService`
- [x] Caixa aberto e registro de pagamento com `CashService`
- [x] Entrada, ajuste e deducao de estoque com `InventoryService`
- [x] Motoboy/entrega com `DeliveryService`

Status: concluida no escopo aprovado. Nao iniciar Fase 12 sem confirmacao.

---

## FASE 12 - Conversao gradual do frontend 2R para Rails

> Objetivo: Criar uma copia/template do frontend 2R e iniciar a troca gradual das leituras publicas Supabase pelas APIs Rails da Replymesh, sem alterar o projeto original `M:\temple1`.

### Escopo executado
- [x] Criar pasta isolada `W:\sas replymesh\store-template`
- [x] Copiar o template 2R para a nova pasta sem alterar `M:\temple1`
- [x] Excluir da copia itens sensiveis/pesados: `.env`, `node_modules`, `dist`, `backups`, `data`, `supabase` e dumps/logs de payload
- [x] Auditar services e hooks que ainda usam Supabase
- [x] Criar camada Rails paralela:
  - `src/services/replymeshApi.js`
  - `src/services/publicApi.js`
  - `src/services/storeApi.js`
- [x] Criar hooks publicos Rails:
  - `src/hooks/usePublicMenu.js`
  - `src/hooks/usePublicStoreInfo.js`
- [x] Configurar `.env.example` com `VITE_REPLYMESH_API_URL` e `VITE_COMPANY_SLUG`
- [x] Adaptar pagina publica de cardapio/menu para ler categorias e produtos via Rails
- [x] Adaptar home publica para ler nome da loja via Rails
- [x] Adaptar home publica para ler banners, endereco, WhatsApp e zona de entrega via Rails
- [x] Adaptar header e rodape publicos para nome/logo Rails
- [x] Adaptar badge de status aberto/fechado para horarios publicos Rails
- [x] Criar endpoint publico `GET /api/v1/public/:company_slug/products/:id`
- [x] Adaptar detalhes de produto para leitura Rails
- [x] Adaptar modal de opcionais/adicionais usando dados Rails do menu/produto
- [x] Adaptar carrinho para modo local/leitura, com subtotal, quantidade e remocao
- [x] Manter services Supabase antigos intactos em modo hibrido
- [x] Permitir boot do template sem credenciais Supabase locais
- [x] Ajustar CORS local do Rails para aceitar `127.0.0.1:5174` e `localhost:5174`
- [x] Ampliar `/api/v1/public/:company_slug/store` com `store_settings`, `app_banners`, `business_hours`, `business_hour_exceptions` e `delivery_zones`
- [x] Criar dados locais minimos para `empresa-teste`: 1 banner, 7 horarios, 1 zona de entrega e settings basicos
- [x] Enriquecer `GET /api/v1/public/:company_slug/orders/:id` com endereco e timestamps de acompanhamento
- [x] Conectar acompanhamento publico em `/success/:id` e `/pedido/:id`
- [x] Exibir linha do tempo do pedido com atualizacao manual e polling simples

### Testes
- [x] `npm install` em `store-template`
- [x] `npm run build` em `store-template`
- [x] Vite dev validado em `http://127.0.0.1:5174/menu`
- [x] API publica Rails validada por HTTP antes do restart: `/api/v1/public/empresa-teste/store` e `/api/v1/public/empresa-teste/menu`
- [x] Restaurar Rails local em `127.0.0.1:3000` usando `W:\replymesh-ruby`
- [x] Validacao visual completa com backend Rails reiniciado apos CORS

### Observacoes
- O projeto original `M:\temple1` permaneceu intocado.
- Supabase permanece no template em paralelo; nenhuma chamada foi removida nesta fase.
- Checkout publico de teste iniciado e conectado ao Rails; motoboy, caixa, WhatsApp automatico e deploy nao foram iniciados.
- Rails local restaurado com o runtime correto `W:\replymesh-ruby`, sem reinstalar Ruby e sem rodar `bundle install`.
- Menu publico validado no browser carregando `Burger Teste` via Rails.
- Home publica validada no browser carregando `Empresa Teste`, `Cardapio Replymesh`, status da loja, endereco, WhatsApp e entrega `Centro - R$ 7,00`.
- Produto `Burger Teste` validado no browser com grupo `Adicionais`, item `Bacon`, subtotal R$ 30,00, quantidade 2 => R$ 60,00, e remocao do carrinho.
- Checkout publico conectado ao Rails via `POST /api/v1/public/:company_slug/orders`.
- `CheckoutService` recalcula subtotal, opcionais/adicionais, taxa de entrega e total no backend, sem confiar nos totais do frontend.
- Pedido de teste criado para `empresa-teste`: `order_number` 1, status `pending`, produto `Burger Teste` + adicional `Bacon`, subtotal R$ 30,00, entrega R$ 7,00 e total R$ 37,00.
- Tela de sucesso publica consulta `GET /api/v1/public/:company_slug/orders/:id` e exibe numero, status, itens e total recalculado.
- Duplicidade por mesmo telefone + mesmo total dentro de 90 segundos validada com retorno 422.
- Painel `/admin/orders` do `store-template` conectado a `GET /api/v1/store/orders`.
- Login do template preserva Supabase Auth e ganhou fallback local Rails para obter JWT em desenvolvimento.
- `src/services/storeApi.js` usa `Authorization: Bearer` e `X-Company-Id` para super_admin acessar `empresa-teste`.
- Listagem de pedidos exibe numero, cliente, telefone, itens, adicionais, endereco, tipo, pagamento, total, status e data.
- Mudanca de status conectada a `PATCH /api/v1/store/orders/:id/status` com `skip_side_effects=true`.
- Status testados: `pending -> accepted -> preparing -> ready`.
- Confirmado no banco que `inventory_deducted=false` e `financial_recorded_at=null`; caixa e estoque nao foram acionados.
- Tela `/admin/orders` validada no browser exibindo `Cliente Teste Fase 12`, `Burger Teste`, adicional `Bacon`, endereco e status `Pronto`.
- Endpoint `GET /api/v1/store/kitchen/orders` criado para KDS/cozinha.
- Tela `/kitchen` conectada ao Rails com polling simples a cada 4 segundos.
- KDS exibe colunas `pending`, `accepted`, `preparing` e `ready`, preservando o layout original do 2R.
- KDS mostra numero do pedido, cliente, telefone, itens, adicionais, observacoes, horario relativo, total e status.
- Pedido de teste KDS criado: `order_number` 2, `Cliente KDS Fase 12`, `Burger Teste` + `Queijo extra`, total R$ 36,00.
- KDS validado por API e browser: pedido apareceu, foi atualizado ate `ready` e permaneceu sem baixa de estoque/caixa.
- Acompanhamento publico conectado a `GET /api/v1/public/:company_slug/orders/:id`.
- Pedido de teste de acompanhamento criado: `order_number` 3, `Cliente Tracking Fase 12`, `Burger Teste` + adicional `Bacon`, entrega R$ 7,00 e total R$ 37,00.
- Endpoint publico retornou status, cliente, itens, adicionais, total, endereco de entrega e timestamps `accepted_at`, `preparing_at`, `ready_at`, `out_for_delivery_at`, `completed_at` e `canceled_at`.
- Status do pedido de acompanhamento atualizado de `pending` para `accepted` pelo Rails; `accepted_at` apareceu na resposta publica.
- Status do mesmo pedido avancado de `accepted` para `preparing`; `preparing_at` apareceu na resposta publica.
- Telas `http://127.0.0.1:5174/success/4` e `http://127.0.0.1:5174/pedido/4` validadas no browser exibindo timeline, endereco, item, adicional, total e botao `Atualizar status`.
- Polling simples do acompanhamento publico confirmado a cada 10 segundos, atualizando a tela para `Em preparo` sem recarregar manualmente.

Status: checkout publico, painel/admin de pedidos, cozinha/KDS e acompanhamento publico Rails concluidos no escopo aprovado. Proxima acao recomendada: aguardar confirmacao para iniciar detalhes admin/cozinha ou proxima etapa operacional aprovada, sem motoboy, caixa, WhatsApp automatico ou pagamento online.

---

## FASE 12.5 - Restauracao Visual do Template 2R

> Objetivo: restaurar a aparencia do `store-template` para ficar o mais proximo possivel do frontend 2R original, mantendo Rails apenas como origem dos dados.

### Auditoria visual
- Home: identificados cards extras de endereco, entrega, WhatsApp e banner grid adicionados durante a migracao.
- Cardapio: identificado botao `Detalhes` nos cards, alterando o layout original de card com botao unico `Adicionar`.
- Produto: identificado bloco visivel de opcionais, categoria e CTA diferente do layout original.
- Carrinho: identificado aviso antigo de fase nao conectada no lugar do resumo original com cupom e finalizacao.
- Header/footer: estrutura preservada; diferenca mantida para nome/logo dinamicos por empresa.

### Correcoes aplicadas
- Home restaurada para hero + status + CTAs + `MenuSection`, sem blocos extras.
- Categorias horizontais com scroll preservadas.
- Grid e cards de produtos restaurados para imagem, titulo, badges, descricao, preco e botao `Adicionar`.
- Tela de produto restaurada para o layout original de imagem, titulo, badges, descricao, preco, quantidade e `Adicionar ao Carrinho`.
- Modal de opcionais mantido apenas como comportamento Rails quando o produto tem adicionais.
- Carrinho restaurado com cupom, subtotal, desconto, total e `Finalizar Pedido`.
- Nenhum endpoint Rails, Checkout Rails ou Orders Rails foi alterado.

### Validacao
- `npm run build` executado com sucesso no `store-template`.
- Browser validou Home, Menu, Produto e Carrinho no `store-template`.
- Produto Rails `Burger Teste` continuou carregando via Rails.
- Modal de opcionais abriu e adicional `Bacon` foi adicionado ao carrinho.
- Carrinho exibiu produto, adicional, campo de cupom e botao `Finalizar Pedido`.

### Diferencas restantes
- O 2R original local redirecionou para `/login` nesta maquina; a comparacao do original foi feita pelo codigo-fonte em `M:\temple1`.
- Nome/logo/status seguem dinamicos via Rails para suportar multi-tenant.

Status: FASE 12.5 concluida no escopo visual aprovado. Nao iniciar motoboy, caixa, WhatsApp automatico, pagamento online ou novas funcionalidades sem confirmacao.

---

## FASE 12.6 - Ajustes de Fluxo, Dashboard, Checkout e WhatsApp

> Objetivo: organizar os fluxos atuais sem iniciar nova funcionalidade operacional, preservando o template 2R e Rails como origem dos dados migrados.

### Ajustes aplicados
- Menu lateral do admin reorganizado por grupos profissionais de delivery:
  - Dashboard
  - Operacao: Pedidos, Mesas
  - Cardapio: Produtos, Categorias, Banners do App
  - Entrega: Areas de Entrega, Motoboys
  - Clientes & Promocoes: Clientes, Cupons, Roleta
  - Estoque: Itens de Estoque, Movimentacoes
  - Financeiro: Caixa, Relatorios
  - Comunicacao: Templates WhatsApp, Marketing WhatsApp
  - Administracao: Usuarios, Configuracoes
  - Suporte e Sair
- Checkout reorganizado para iniciar por WhatsApp.
- Endpoint publico seguro criado: `GET /api/v1/public/:company_slug/customers/lookup?phone=...`.
- Lookup retorna apenas dados necessarios ao checkout: nome, telefone/WhatsApp e enderecos salvos.
- Checkout preenche nome e endereco quando cliente e encontrado pelo WhatsApp.
- Campo de troco exibido apenas quando pagamento e `Dinheiro`.
- Pedido salva `needs_change` e `change_for_cents` usando campos ja existentes no banco.
- Carrinho confirmado com botao `Finalizar Pedido` para `/checkout` e sem aviso antigo de fase nao conectada.
- Admin pedidos, cozinha e acompanhamento publico exibem informacao de troco.
- Templates WhatsApp por status preparados com `enabled` por empresa.
- Defaults seguros de WhatsApp:
  - habilitados: `pedido_aceito`, `saiu_para_entrega`, `pedido_finalizado`
  - desabilitados: `pedido_recebido`, `pedido_em_preparo`, `pedido_pronto`, `pedido_cancelado`
- Mudanca de status consulta o template correspondente e registra log interno em modo `prepared_only`, sem envio real automatico.

### Mapeamento WhatsApp por status
- `accepted` -> `pedido_aceito`
- `preparing` -> `pedido_em_preparo`
- `ready` -> `pedido_pronto`
- `out_for_delivery` -> `saiu_para_entrega`
- `completed` -> `pedido_finalizado`
- `cancelled` -> `pedido_cancelado`

### Testes
- `rails db:migrate` OK, sem migration pendente.
- `rails db:seed` OK; templates padrao sincronizados sem sobrescrever configuracoes existentes.
- `rails routes` confirmou `customers/lookup`.
- `GET /api/v1/public/empresa-teste/customers/lookup?phone=21968443941` retornou cliente e ultimo endereco.
- `POST /api/v1/public/empresa-teste/orders` criou pedido com dinheiro e troco para R$ 50,00.
- `PATCH /api/v1/store/orders/:id/status` atualizou pedido para `accepted` com `skip_side_effects=true`.
- Log WhatsApp criado como `prepared_only` para `pedido_aceito`, sem envio real.
- `GET /api/v1/public/empresa-teste/orders/:id` retornou `needs_change`, `change_for_cents` e `change_for`.
- `GET /api/v1/store/orders` e `GET /api/v1/store/kitchen/orders` retornaram troco.
- `npm run build` OK no `store-template`.
- Browser validou `/cart`, `/checkout`, `/success/:id`, `/admin/dashboard`, `/admin/orders` e `/kitchen`.

Status: FASE 12.6 concluida no escopo de ajustes. Nao iniciar motoboy, caixa automatico, pagamento online, WhatsApp automatico real ou deploy sem confirmacao.

---

### FASE 12.7 - Importacao dados reais 2R + Dashboard visual em 2026-06-04

Auditoria de dados do 2R (M:\temple1\supabase\migrations) concluida.

Dados encontrados com INSERT real:
- `20260422_import_hubt_menu.sql` — cardapio completo real (7 categorias, ~50 produtos com imagens Google Photos)
- `20260426_traditional_burger_combos.sql` — 12 combos hamburguer tradicional
- `20260427_artisanal_burger_combos.sql` — 5 combos artesanais
- `20240420_add_delivery_zones.sql` — 7 zonas de entrega reais (Apollo, Manilha, Itaborai, Sao Goncalo, Rio)
- `20240420_add_initial_settings.sql` — store_settings, business_hours, whatsapp_templates
- Arquivos reset/backup: apenas schema, sem dados operacionais sensiveis

Nao importado: pedidos, clientes, caixa, logs WhatsApp (dados operacionais — outra fase).

Criado:
- `replymesh-api/app/controllers/api/v1/store/dashboard_controller.rb` — endpoint `GET /store/dashboard`
- `replymesh-api/config/routes.rb` — rota `get "dashboard"` adicionada ao namespace store
- `replymesh-api/lib/tasks/import_2r_to_test_company.rake` — importa 8 categorias + ~55 produtos + 7 zonas + settings/hours/templates para empresa-teste

Alterado no store-template:
- `src/services/storeApi.js` — adicionado `getDashboardStats()` chamando Rails `/store/dashboard`
- `src/pages/admin/Dashboard.jsx` — migrado de Supabase para Rails, subtitle "Visao geral do seu negocio", link "Ver todos os pedidos"
- `src/components/layout/AdminLayout.jsx` — header aprimorado com data formatada, bell notification, avatar circular com inicial
- `src/components/dashboard/DashboardStats.jsx` — donut chart SVG para Status dos Pedidos (sem biblioteca), sparklines SVG nos 4 cards, % ao lado dos contadores, resumo com seta

Para executar importacao:
  rails import_2r:run                    (importa sem resetar)
  rails import_2r:run RESET_TEST_DATA=true  (limpa e reimporta)

Para verificar:
  Company.find_by(slug: "empresa-teste").categories.count  # -> 8
  Company.find_by(slug: "empresa-teste").products.count    # -> ~55

`npm run build` OK sem erros.

### FASE 12.7 ajustes finais em 2026-06-04

Importacao executada com sucesso:
- rails import_2r:run RESET_TEST_DATA=true rodou sem erros
- Resultado: 8 categorias, 95 produtos, 7 zonas, 8 templates, StoreSetting "Lanche do 2R"
- Cardapio completo: Pastel (12), Pao de alho (9), Hamburguer (11), Hamburguer Artesanal (27), Combos (12), Acompanhamentos (8), Acai (10), Bebidas (6)

Correcoes adicionais:
- stores_controller.rb: store_name agora usa store_setting.store_name em vez de company.name hardcoded
- Dashboard.jsx: migrado de useOrders (Supabase) para getStoreOrders (Rails) para Pedidos Recentes
- Rake task: corrigido campo allow_pickup -> pickup_enabled e estimated_delivery_minutes vs estimated_minutes

Validado no navegador:
- /empresa-teste/menu: titulo "Lanche do 2R", status "Loja aberta", 8 categorias reais, produtos reais com imagens
- /admin/dashboard: header com data + bell + avatar, subtitle "Visao geral do seu negocio", 4 cards stats, donut chart, Resumo Geral com 6 icones, Pedidos Recentes com tabela Rails (6 pedidos), link "Ver todos os pedidos"
- npm run build OK

Status: FASE 12.7 concluida. Nao iniciar proxima fase sem confirmacao.

---

### FASE 12.8 - Admin Catalogo Rails em 2026-06-04

Objetivo: Conectar as paginas admin de catalogo ao Rails, substituindo chamadas Supabase.

Criado no Rails:
- `delivery_zones_controller.rb` — CRUD completo de zonas de entrega (GET/POST/PATCH/DELETE)
- `routes.rb` — adicionado `resources :delivery_zones` no namespace store
- `products_controller.rb` — serialize_list agora inclui category_id, cost_price_cents, track_inventory, stock_item_id, category objeto

Criado/atualizado no frontend (store-template):
- `src/services/storeApi.js` — adicionados: railsGetCategories, railsCreateCategory, railsUpdateCategory, railsDeleteCategory, railsGetProducts, railsCreateProduct, railsUpdateProduct, railsDeleteProduct, railsUpdateProductsStatus, railsUpdateProductsSortOrder, railsGetOptionGroups, railsSaveOptionGroups, railsGetBanners, railsCreateBanner, railsUpdateBanner, railsDeleteBanner, railsGetDeliveryZones, railsCreateDeliveryZone, railsUpdateDeliveryZone, railsDeleteDeliveryZone
- `src/hooks/useProducts.js` — migrado de services/products.js (Supabase) para railsGetProducts (Rails)
- `src/hooks/useCategories.js` — migrado de services/categories.js (Supabase) para railsGetCategories (Rails)
- `src/hooks/useDeliveryZones.js` — migrado para railsGetDeliveryZones (Rails)
- `src/pages/admin/Products.jsx` — troca de servicos para Rails (criar/editar/desativar/bulk/option groups)
- `src/pages/admin/Categories.jsx` — troca de servicos para Rails (criar/editar/toggle/excluir)
- `src/pages/admin/DeliveryZones.jsx` — troca de servicos para Rails; matchDeliveryZone neutralizado
- `src/pages/admin/AppBanners.jsx` — reescrito por completo para Rails (campos completamente diferentes)

Normalizacao de dados:
- Rails preco em cents -> BRL: price_cents/100 = price_brl
- Rails entraga em cents -> BRL: delivery_fee_cents/100
- Rails tempo em minutos -> string: estimated_minutes -> estimated_time
- Writes convertem BRL -> cents antes de enviar ao Rails

Testado via API e navegador:
- Criar produto: ID 98 criado na categoria Bebidas
- Editar produto: nome atualizado para "(editado)"
- Desativar produto: nao aparece no /menu publico
- Reativar produto: aparece novamente no /menu publico
- Produto teste removido ao final
- /admin/products: 95 produtos, 8 categorias filtradas
- /admin/categories: 8 categorias com botoes Editar/Desativar/Excluir
- /admin/delivery-zones: 7 zonas com taxas em BRL corretas (Apollo R$8, Manilha R$9, etc.)
- npm run build OK

Status: FASE 12.8 concluida. Nao iniciar proxima fase sem confirmacao.

---

### Auditoria multiempresa + acesso por /loja/:slug em 2026-06-04

Empresa Demo Hamburgueria auditada no Rails:
- Company ID: 5
- Slug: demohamburgueria (sem hifen — normalizacao do Rails)
- Status: active/active
- StoreSetting: criado ("Demo Hamburgueria")
- Members: 1 usuario admin vinculado
- Domain: demohamburgueria.replymesh.cloud (pending)
- Subscription: active
- Categories: 0, Products: 0, Zones: 0, BusinessHours: 0 (empresa nova vazia)

Implementado: acesso multiempresa local por rota /loja/:companySlug

Criado:
- `src/contexts/CompanySlugContext.jsx` — context com slug + basePath; hooks useCompanySlug() e useCompanyBasePath()

Atualizado:
- `src/app/router.jsx` — rota /loja/:companySlug com SluggedPublicLayout (le useParams().companySlug); rota / permanece com fallback do .env; filhos publicos reutilizados
- `src/components/layout/PublicLayout.jsx` — todos os Link/navigate usam basePath do contexto
- `src/hooks/usePublicStoreInfo.js` — usa useCompanySlug() automaticamente
- `src/hooks/usePublicMenu.js` — usa useCompanySlug() automaticamente
- `src/pages/public/Home.jsx` — link "Ver Cardapio Completo" usa basePath
- `src/pages/public/Cart.jsx` — links /menu e /checkout usam basePath
- `src/pages/public/Checkout.jsx` — lookupPublicCustomer e createPublicOrder passam slug; navigate para /success usa basePath
- `src/pages/public/ProductDetails.jsx` — getPublicProduct passa slug
- `src/pages/public/Success.jsx` — getPublicOrder passa slug

Validado no navegador:
- http://127.0.0.1:5174/ -> empresa-teste (Lanche do 2R, 95 produtos) — slug do .env
- http://127.0.0.1:5174/loja/empresa-teste -> empresa-teste (Lanche do 2R, 95 produtos)
- http://127.0.0.1:5174/loja/demohamburgueria -> Demo Hamburgueria (empresa vazia, cardapio limpo)
- Ambas completamente isoladas — dados de cada empresa nao vazam
- npm run build OK

Status: multiempresa local concluido. Nao iniciar proxima fase sem confirmacao.

---

### Ajuste FASE 12 - Admin por empresa + WhatsApp/QR no painel da loja em 2026-06-04

Portas locais corretas:
- Replymesh Master: `http://127.0.0.1:5173`
- Store Template: `http://127.0.0.1:5174`
- Rails API: `http://127.0.0.1:3000`

Empresa validada:
- Nome: Demo Hamburgueria
- Slug: `demohamburgueria`
- URL publica: `http://127.0.0.1:5174/loja/demohamburgueria`
- Admin: `http://127.0.0.1:5174/loja/demohamburgueria/admin/dashboard`
- Login: `http://127.0.0.1:5174/loja/demohamburgueria/login`
- QR Code: `http://127.0.0.1:5174/loja/demohamburgueria/admin/whatsapp/qrcode`

Criado/ajustado no Rails:
- `GET /api/v1/public/:company_slug/store` agora retorna `id` e `company_id`.
- `GET /api/v1/store/whatsapp/instances`
- `POST /api/v1/store/whatsapp/instances/ensure`
- `GET /api/v1/store/whatsapp/instances/:id/status`
- `GET /api/v1/store/whatsapp/instances/:id/qrcode`
- `GET/PATCH /api/v1/store/whatsapp/templates`
- `GET /api/v1/store/whatsapp/logs`

Criado/ajustado no store-template:
- Rotas slugadas do admin: `/loja/:companySlug/admin`, `/dashboard`, `/orders`, `/products`, `/categories`, `/delivery-zones`, `/whatsapp`, `/whatsapp/templates`, `/whatsapp/qrcode`.
- Rota slugada de login: `/loja/:companySlug/login`.
- Login Rails agora preserva `companySlug` e `company_id` no contexto local.
- AdminLayout usa links com prefixo `/loja/:companySlug/admin`.
- Menu Comunicacao ganhou WhatsApp, Conexao / QR Code, Templates WhatsApp, Logs WhatsApp e Marketing WhatsApp.
- Paginas criadas: `Whatsapp`, `WhatsappQrCode`, `WhatsappLogs`.

WhatsApp Demo:
- Instancia local existente: `replymesh_demohamburgueria`.
- Como ela nao tinha token local para QR, foi preparada uma instancia segura separada: `replymesh_demohamburgueria_qr`.
- UUID remoto capturado para `replymesh_demohamburgueria_qr`.
- QR Code real obtido via Rails como `base64`.
- Nenhuma chave global, `instance_token` ou apikey e retornada ao frontend.
- A instancia `Lanche` nao foi desconectada, reiniciada, excluida ou alterada.

Testado:
- `rails routes` confirmou rotas `/api/v1/store/whatsapp/*`.
- `GET /api/v1/public/demohamburgueria/store` OK com `company_id=5`.
- `GET /api/v1/store/whatsapp/instances` OK com `X-Company-Id=5`, sem token no JSON.
- `POST /api/v1/store/whatsapp/instances/ensure` OK; preparou `replymesh_demohamburgueria_qr`.
- `GET /api/v1/store/whatsapp/instances/5/qrcode` OK; `qrcode.type=base64`.
- Browser validou `/loja/demohamburgueria/admin/dashboard` e `/loja/demohamburgueria/admin/whatsapp/qrcode`.
- `npm run build` OK no `store-template`.

Status: admin por empresa + WhatsApp/QR no painel da loja concluido no escopo seguro. Nao iniciar motoboy, caixa automatico, pagamento online, WhatsApp automatico real ou deploy sem confirmacao.

---

### FASE 12.8.1 - Ajustes criticos de Checkout, Branding, Admin e Fluxo WhatsApp em 2026-06-04

Objetivo: corrigir pontos criticos antes de qualquer modulo novo.

Concluido:
- Branding por empresa corrigido:
  - `/loja/demohamburgueria` mostra Demo Hamburgueria em header/footer/loja.
  - `/loja/demohamburgueria/login` mostra Demo Hamburgueria.
  - `/loja/demohamburgueria/admin/dashboard` mostra Demo Hamburgueria.
  - `/loja/empresa-teste` preserva Lanche do 2R.
- Admin local da Demo criado/resetado:
  - `admin@demohamburgueria.com.br`
  - senha local `admin123456`
  - membership `store_admin`
- Login Rails agora retorna `company_members`; frontend mapeia `store_admin` para perfil `admin`.
- Checkout restaurado no fluxo original do 2R, mantendo Rails como origem:
  - WhatsApp primeiro
  - lookup por WhatsApp
  - enderecos salvos
  - selecao de regiao atendida
  - area/taxa encontrada
  - checkbox de conferencia de rua, numero e regiao
  - cupons disponiveis e campo de cupom
  - dinheiro com troco
  - resumo completo
- `CheckoutService` corrigido para calcular `discount_cents` e `total_cents` com cupom antes de gravar o pedido.
- Regra de loja fechada mantida como visual; bloqueio/permitir fora do horario fica para configuracao futura.
- Fluxo WhatsApp por status documentado e preparado, sem envio real:
  - `accepted -> pedido_aceito`
  - `preparing -> pedido_em_preparo` se enabled
  - `ready -> pedido_pronto` se enabled
  - `out_for_delivery -> saiu_para_entrega`
  - `completed -> pedido_finalizado`
- Defaults preservados: enabled somente `pedido_aceito`, `saiu_para_entrega`, `pedido_finalizado`.
- Futuro webhook de localizacao Evolution documentado.
- QR da Demo mantido em `/loja/demohamburgueria/admin/whatsapp/qrcode`; instancia `replymesh_demohamburgueria_qr` conectada; tokens/chaves nao aparecem.

Testado:
- `rails routes` OK.
- Login Demo OK.
- `/loja/demohamburgueria` sem branding 2R.
- `/loja/demohamburgueria/admin/dashboard` sem dados da `empresa-teste`.
- `/loja/demohamburgueria/admin/whatsapp/qrcode` sem token/chave.
- API lookup `empresa-teste` retornou cliente, 2 enderecos e cupom.
- API criou pedido com cupom `TESTE10`: subtotal 1600, desconto 160, total 2940, troco 5000.
- Browser criou pedido real no checkout visual: `/loja/empresa-teste/success/10`.
- `npm run build` OK.

Status: FASE 12.8.1 concluida. Nao iniciar motoboy, caixa, pagamento online, WhatsApp automatico real ou deploy sem confirmacao.

---

### FASE FUTURA - Atendimento IA WhatsApp documentada em 2026-06-04

Status: documentacao criada, sem implementacao.

Arquivo criado:
- `AI_WHATSAPP_ATTENDANT_PLAN.md`

Objetivo futuro:
- Criar atendimento com IA no WhatsApp para responder mensagens recebidas dos clientes.
- IA deve ser opcional por loja, controlada por plano e isolada por `company_id`.

Regras documentadas:
- IA nao responde mensagens proprias.
- IA nao responde grupos.
- IA nao interfere nas mensagens automaticas por status.
- IA nao interfere no fluxo de localizacao.
- IA identifica loja pela instancia Evolution e cliente pelo telefone.
- IA busca pedido recente pelo telefone sempre filtrando por `company_id`.
- IA nao inventa produto, preco, prazo, status ou motoboy.
- IA chama atendente quando nao souber.

Fluxo futuro documentado:
- Cliente envia mensagem.
- Evolution envia webhook para Rails.
- Rails identifica instancia/loja.
- Rails ignora mensagens proprias e grupos.
- Rails valida plano e flag IA.
- Rails classifica intencao.
- Rails busca dados reais.
- Rails monta contexto pequeno.
- Provedor IA gera resposta curta.
- Rails responde via Evolution.

Intencoes previstas:
- status do pedido, tempo estimado, motoboy, cardapio/produto, horario, pagamento, taxa de entrega, localizacao/endereco, falar com atendente, reclamacao e fora do assunto.

Menu futuro documentado:
- Comunicacao
  - WhatsApp
  - Templates WhatsApp
  - Marketing WhatsApp
  - Atendimento IA

FASE futura - Webhook de Localizacao Evolution Go:
- Registrar que localizacao tem prioridade sobre IA.
- Rails deve salvar latitude, longitude, horario de recebimento, Google Maps e Waze no pedido.
- Motoboy usara esses dados no painel/app.
- Nao alterar fluxo atual do 2R nem webhook de producao antes de mapear e testar com instancia teste.

Status: somente documentacao. Nao implementar IA, nao criar tabelas, nao chamar APIs externas e nao iniciar nova fase sem confirmacao.

---

### FASE 12.8.2 - Padronizacao WhatsApp, instancia unica e teste de envio em 2026-06-04

Objetivo: organizar o WhatsApp da loja antes de motoboy/caixa.

Concluido:
- Regra aplicada no admin da loja: uma empresa opera apenas uma instancia WhatsApp principal.
- `GET /api/v1/store/whatsapp/instances` agora retorna somente a instancia canonica da empresa.
- A instancia canonica e escolhida priorizando `connected`, depois token local e sincronizacao recente.
- Demo Hamburgueria ficou vinculada visual/operacionalmente a `replymesh_demohamburgueria_qr`.
- A instancia local antiga `replymesh_demohamburgueria` foi preservada como historico local, sem acao remota.
- Instancia `Lanche` nao foi alterada, desconectada, reiniciada ou excluida.
- Tela `/loja/demohamburgueria/admin/whatsapp` foi unificada para Conexao, QR Code, Status, teste controlado e logs recentes.
- Rota antiga `/loja/demohamburgueria/admin/whatsapp/qrcode` permanece funcional apontando para a tela unificada.
- Menu Comunicacao ficou padronizado:
  - WhatsApp
  - Templates WhatsApp
  - Marketing WhatsApp
- QR Code fica oculto quando a instancia esta conectada.
- Templates WhatsApp padrao foram sincronizados por empresa:
  - ativos: `pedido_aceito`, `saiu_para_entrega`, `pedido_finalizado`
  - desativados: `pedido_recebido`, `pedido_em_preparo`, `pedido_pronto`, `pedido_cancelado`, `marketing`
- Textos dos templates usam `{{nome_loja}}`, evitando branding fixo do 2R em outras empresas.
- Fluxo status -> WhatsApp segue preparado:
  - `accepted` -> `pedido_aceito`
  - `preparing` -> `pedido_em_preparo`
  - `ready` -> `pedido_pronto`
  - `out_for_delivery` -> `saiu_para_entrega`
  - `completed` -> `pedido_finalizado`
  - `cancelled` -> `pedido_cancelado`
- Endpoint controlado criado: `POST /api/v1/store/whatsapp/test_send`.
- Envio real automatico em massa nao foi ativado.
- Envio real foi testado somente com pedido marcado como teste da Demo.
- Swagger real da Evolution Go na VPS confirmou rota de envio `POST /send/text`.
- A tentativa antiga `/message/sendText` retornou 404 e foi substituida.

Resultado da Demo:
- Instancia principal: `replymesh_demohamburgueria_qr`.
- Status: `connected`.
- Numero conectado: `5521968443941:90@s.whatsapp.net`.
- Pedido teste criado: ID 11, order_number 1.
- Teste `pedido_aceito` enviado com sucesso pela Evolution Go.
- Log gerado: `WhatsApp enviado para status accepted`, `delivery_mode=real_test`.
- Nenhum `instance_token`, apikey ou API key aparece no frontend, README ou roadmap.

Testes:
- `rails db:migrate` OK.
- `rails routes` OK.
- Login Demo OK.
- `GET /api/v1/store/whatsapp/instances` retornou 1 instancia.
- `GET /api/v1/store/whatsapp/templates` confirmou templates ativos padrao.
- `GET /api/v1/store/whatsapp/instances/:id/status` confirmou conectado.
- `PATCH /api/v1/store/orders/:id/status` aceitou pedido teste.
- `POST /api/v1/store/whatsapp/test_send` enviou mensagem real de teste.
- `GET /api/v1/store/whatsapp/logs` exibiu logs sem segredos.
- `npm run build` OK no `store-template`.
- `npm run lint` nao existe no `store-template`.
- Browser validou `/loja/demohamburgueria/admin/whatsapp`: conectado, numero visivel, QR oculto, menu sem duplicidade.

Status: FASE 12.8.2 concluida no escopo seguro. Nao iniciar motoboy, caixa automatico, pagamento online, marketing em massa ou deploy sem confirmacao.

Proxima etapa recomendada: FASE 12.9 - preparar modulo de motoboy somente apos confirmacao.

---

### FASE 12.9 - Checkout identico ao 2R, Branding Multiempresa e Onboarding Automatico em 2026-06-04

Objetivo: igualar checkout ao temple1, remover branding fixo do 2R de todo o store-template, completar onboarding automatico e melhorar UX WhatsApp.

#### ETAPA 1 - Checkout

Correcoes aplicadas no store-template/src/pages/public/Checkout.jsx:
- Busca automatica por WhatsApp com debounce de 600ms (substituiu trigger manual on blur)
- Auto-aplicacao do ultimo endereco salvo quando campos estao vazios
- Botao Trash2 para excluir endereco salvo com confirmacao + recarga do perfil
- Secao PIX exibida inline quando pagamento = PIX (QR code, chave, botao copiar)
- Card de endereco de retirada dinamico usando `store.address` (nao mais hardcoded)
- Loja fechada agora bloqueia o botao submit (antes apenas visual)
- Cupom FREE_ITEM exibido no resumo do pedido
- `saveCustomerData` no localStorage (checkbox + useEffect) para pre-preencher proxima visita
- `handleOrderTypeChange` correto: PICKUP pre-confirma endereco e zera taxa

Novo endpoint Rails:
- `DELETE /api/v1/public/:slug/customers/addresses/:id?phone=` para excluir endereco publicamente
- `api/v1/public/customer_addresses_controller.rb` criado
- Rota adicionada em `config/routes.rb`

Novo na publicApi.js:
- `deletePublicCustomerAddress(phone, addressId, slug)` adicionado

#### ETAPA 2 - Acompanhamento do Pedido (/success/:id)

Correcoes aplicadas em store-template/src/pages/public/Success.jsx:
- `useCompanyBasePath()` usado em todos os navigate('/menu') — fixado para multi-tenant
- Branding da empresa (logo + nome) exibido no topo do card
- Secao PIX inline quando `order.payment_method === 'pix'` e store tem config PIX
- Linha de desconto exibida quando `order.discount_amount > 0`
- Botao copiar PIX adicionado

#### ETAPA 3 - Branding Multiempresa

Todos os hardcodes "2R" removidos do store-template:
- `PublicLayout.jsx`, `AdminLayout.jsx`, `Login.jsx`, `Home.jsx`, `BrandLogo.jsx`: fallback `'Lanche do 2R'` → `''`
- `whatsappTemplates.js`: `'Lanche do 2R'` → `''`; URL roleta removida; demo store_name `'Demo Store'`
- `marketingWhatsapp.js`: texto "O Lanche do 2R" removido; URL `lanchesdo2r.com.br` removida
- `Wheel.jsx`: "Roleta do 2R" → "Roleta de Premios"
- `MotoboyPortal.jsx`: "Lanche do 2R agradece" removido; mensagem WhatsApp do motoboy neutralizada
- `Settings.jsx`: mensagem de teste de WhatsApp neutralizada
- `Tables.jsx`: "Lanche do 2R" no HTML de impressao substituido por `session.company_name`
- `CreateKitchenUser.jsx`: substituido por tela de redirect ao painel master (era Supabase legado)
- localStorage keys: `lanches2r:*` → `replymesh:*`
- `auth.js`: email motoboy `@motoboy.lanches2r.local` → `@motoboy.replymesh.local`

#### ETAPA 4 - Onboarding Automatico

Adicionado ao `CompanyOnboardingService`:
- `DEFAULT_BUSINESS_HOURS` constante com seg-sex 18h-23h, sab 23h30, dom fechado
- `create_business_hours!`: cria 7 registros BusinessHour para a empresa
- `create_default_delivery_zone!`: cria zona "Centro" com R$ 5,00 de taxa
- `created_resources` atualizado para rastrear `business_hours` e `delivery_zone`

#### ETAPA 5 - WhatsApp UX

Adicionado em store-template/src/pages/admin/Whatsapp.jsx:
- Auto-polling de status a cada 15 segundos (silencioso, sem resetar a tela)
- Card de Templates inline mostrando lista com status ativo/inativo e link "Editar templates"
- `railsGetWhatsappTemplates` integrado ao load inicial

Regras ja existentes preservadas:
- 1 empresa = 1 instancia (instances[0])
- QR Code oculto quando conectado
- Botoes preparar/reconectar condicionais ao status

### Validacao Final FASE 12.9 em 2026-06-04

Bugs encontrados e corrigidos durante a validacao:

1. Bug critico: `render_not_found` ausente no `Public::BaseController` causava 500 no `GET /public/:slug/orders/:id`.
   - Corrigido: metodo adicionado ao base controller publico.

2. Bug: `index.html` do store-template tinha meta tags hardcoded com "Lanche do 2R" e URL `lanchesdo2r.com.br`.
   - Corrigido: substituido por metatags genericas sem branding.

3. Dado ausente: `coupon_code` e `notes` nao eram retornados pelo endpoint publico de pedido.
   - Corrigido: campos adicionados ao `serialize_order` do `OrdersController`.

Testes executados e resultados:

- Demo Hamburgueria: store_name "Demo Hamburgueria" — OK
- Demo Hamburgueria: sem "2R/lanchesdo2r" no HTML — OK (apos fix do index.html)
- Empresa Teste: 8 categorias, 95 produtos — OK
- Lookup por WhatsApp: found=true, 2 enderecos, 1 cupom — OK
- Pedido com dinheiro e troco: subtotal=32, fee=15, total=47, troco=100 — OK
- Pedido com cupom TESTE10: subtotal=32, fee=15, discount=3.2, total=43.8 — OK
- Endpoint publico /orders/:id: status + itens + endereco + coupon_code + notes — OK
- Timeline de status: preparing_at e out_for_delivery_at aparecem no publico — OK
- WhatsApp logs: "preparado" para saiu_para_entrega — OK
- WhatsApp test_send: sent=true — OK
- Nenhum token/apikey nos logs ou resposta de instancias — OK
- Demo Pizza criada: business_hours=7, delivery_zone=1 ("Centro", R$5) — OK
- Demo Pizza: store_name="Demo Pizza" via endpoint publico — OK
- npm run build: exit 0, sem erros de compilacao — OK
- dist/ JS: nenhum hardcode "Lanche do 2R" ou "lanchesdo2r.com" — OK

Testes nao executados por limitacao de acesso:
- Admin empresa-teste (senha gerada aleatoriamente nao registrada); admin demohamburgueria testado com sucesso.
- Envio WhatsApp em fluxo automatico de status: apenas test_send manual validado; fluxo automatico continua em modo "prepared_only" ate configuracao futura.

Decisao: FASE 12 considerada concluida.

### FASE 13.0 - Modulo Motoboy Base

Status: concluida em modo base local.

Implementado:
- Namespace Rails autenticado `GET /api/v1/motoboy/profile`.
- Namespace Rails autenticado `GET /api/v1/motoboy/orders`.
- Namespace Rails autenticado `POST /api/v1/motoboy/orders/:id/start`.
- Namespace Rails autenticado `POST /api/v1/motoboy/orders/:id/complete`.
- Namespace Rails autenticado `GET /api/v1/motoboy/history`.
- Login Rails do motoboy em `POST /api/v1/motoboy/auth/login`.
- Cadastro/admin de motoboy cria usuario Rails com `global_role=motoboy` quando senha e telefone sao informados.
- Fluxo seguro de entrega: pedido atribuido -> em rota -> entregue; pedido `ready` -> `out_for_delivery` -> `completed`.
- Conclusao de entrega usa transaction e `skip_side_effects`, sem iniciar caixa automatico ou estoque nesta fase.
- Store-template com rotas slugadas:
  - `/loja/:slug/motoboy/login`
  - `/loja/:slug/motoboy/dashboard`
  - `/loja/:slug/motoboy/history`
  - `/loja/:slug/motoboy/profile`

Validado em `demohamburgueria`:
- Admin local logou com `admin@demohamburgueria.com.br`.
- Motoboy teste criado: `Motoboy Teste Replymesh`.
- Pedido teste criado e atribuido.
- Login motoboy OK.
- Inicio de entrega: `delivery_status=on_the_way`, `order.status=out_for_delivery`.
- Finalizacao de entrega: `delivery_status=delivered`, `order.status=completed`.
- Historico do motoboy retornou a entrega finalizada.
- `rails db:migrate`: OK.
- `rails routes`: endpoints Motoboy OK.
- `npm run build` no store-template: OK.

Nao iniciado nesta fase:
- Localizacao em tempo real.
- Google Maps/Waze.
- Webhook de localizacao Evolution.
- App mobile.
- Caixa automatico.
- Deploy.

Proxima etapa recomendada: FASE 13.1 - UX Motoboy e atribuicao visual no admin, ainda sem localizacao real.

### FASE 13.1 - UX Motoboy igual ao 2R + Atribuicao Visual no Admin

Status: concluida em modo local seguro.

Implementado no store-template:
- Portal Motoboy voltou para layout centralizado semelhante ao 2R original.
- Header com `BrandLogo` usando nome/logo da empresa atual.
- Botao Sair no canto superior.
- Tabs horizontais:
  - Entregas
  - Historico
  - Financeiro
  - Perfil
- Card "Minhas entregas" com botao Atualizar.
- Cards de entrega no padrao 2R, exibindo:
  - atribuido em
  - cliente
  - status
  - endereco
  - referencia
  - pagamento
  - total
  - taxa
  - itens/adicionais
  - observacoes
  - botoes Maps, Waze e Cliente
  - Iniciar entrega / Finalizar entrega
- Rota nova `/loja/:slug/motoboy/financeiro`.
- Financeiro basico com entregas concluidas, total de taxas, total a pagar e historico.

Implementado no admin:
- `GET /api/v1/store/motoboys` consumido no admin de pedidos.
- `POST /api/v1/store/orders/:id/assign_motoboy` consumido no admin de pedidos.
- Quando pedido de entrega esta `ready` e sem motoboy, aparece seletor de motoboy + botao "Atribuir motoboy".
- O avanco `ready -> out_for_delivery` fica escondido ate haver motoboy atribuido.
- Detalhe do pedido em `/loja/:slug/admin/orders/:id` migrado para Rails.
- Detalhe exibe cliente, telefone, tipo, pagamento, status da entrega, endereco, bairro, referencia, itens, adicionais, subtotal, taxa, desconto/cupom, total, troco, observacoes e historico.
- Lateral do detalhe inclui Enviar WhatsApp, Alterar status, Cancelar pedido, Selecionar motoboy e Salvar motoboy no pedido.
- Impressao por cupom criada em janela isolada com `window.print()` e CSS proprio para impressao.

Validado:
- `npm run build` no store-template: OK.
- `rails routes` para motoboy/assign: OK.
- Admin Demo Hamburgueria carregou motoboys ativos.
- Pedido teste #3 criado em `ready`.
- Pedido #3 atribuido ao `Motoboy Teste Replymesh`.
- Pedido #3 apareceu no painel do motoboy.
- Inicio da entrega: `order.status=out_for_delivery`, `delivery_status=on_the_way`.
- Finalizacao: `order.status=completed`, `delivery_status=delivered`.
- Admin ve status final atualizado.
- Pedido teste #4 validou detalhe Rails, transicoes `pending -> accepted -> preparing -> ready`, atribuicao, portal motoboy, start/complete e historico com 5 registros.
- Rotas HTTP 200:
  - `/loja/demohamburgueria/motoboy/login`
  - `/loja/demohamburgueria/motoboy/dashboard`
  - `/loja/demohamburgueria/motoboy/financeiro`
  - `/loja/demohamburgueria/admin/orders`
  - `/loja/demohamburgueria/admin/orders/17`

Diferencas restantes vs 2R original:
- Upload de foto do motoboy ainda nao foi recriado no fluxo Rails.
- Financeiro avancado de vales/ajustes/periodos customizados nao foi migrado.
- Localizacao precisa via WhatsApp, mapa embutido e app mobile continuam fora da fase.

Nao iniciado:
- Localizacao em tempo real.
- Webhook Evolution Location.
- Google Maps/Waze real alem dos links por endereco textual.
- Deploy.

Proxima etapa recomendada: FASE 13.2 - Refinos operacionais do Motoboy ou preparacao controlada de localizacao, somente com confirmacao.

### FASE 13.1.1 - Correcoes finais antes da 13.2

Status: concluida em modo local seguro.

Corrigido:
- Confirmado e recompilado o export `railsAssignMotoboyToOrder` em `storeApi.js`; `/loja/demohamburgueria/admin/orders/17` abre sem erro de modulo.
- `OrderDetails.jsx` passou a imprimir cupom em HTML isolado via `window.open` com `Blob` e fallback por iframe escondido quando popup for bloqueado.
- Cupom de impressao contem pedido, cliente, telefone, tipo, endereco, bairro, referencia, itens, subtotal, taxa, desconto, total, pagamento, troco e data/hora.
- Criacao manual de produto no admin ganhou validacoes de nome, categoria e preco antes de enviar ao Rails.
- Atualizacao parcial de produto no `storeApi.js` deixou de enviar campos obrigatorios vazios em toggles de ativo/destaque, corrigindo desativar/reativar.

Validado:
- `npm run build` no `store-template`: OK.
- `rails routes` confirmou produtos, pedidos, atribuicao e motoboy.
- Produto manual criado/editado/desativado/reativado via Rails; quando ativo aparece no menu publico e quando desativado some.
- Pedido real com produto 2R `Combo Casal X-tudo` criado na `empresa-teste`.
- Pedido teste foi levado ate `ready`, atribuido ao `Motoboy Teste Empresa`, apareceu em `/api/v1/motoboy/orders`, iniciou entrega e finalizou com `order.status=completed` e `delivery_status=delivered`.
- Historico do motoboy retornou a entrega concluida.
- Browser validou `/loja/demohamburgueria/admin/orders/17` sem erro `railsAssignMotoboyToOrder`.

Observacao:
- O `store-template` ainda registra erro esperado do `AppVersionWatcher` legado tentando Supabase; nao quebra a tela migrada e fica como residuo do modo hibrido.
- O navegador embutido bloqueou nova automacao do clique de impressao por politica interna; a implementacao foi ajustada para Chrome/Edge com `Blob` + fallback iframe.

Nao iniciado:
- Localizacao em tempo real.
- Webhook Evolution Location.
- Mapa embutido.
- Deploy.

Proxima etapa recomendada: aguardar confirmacao para FASE 13.2.

---

### FASE 15 - Clientes, Cupons e Roleta

Status: implementada localmente, sem deploy.

Clientes:
- `store-template/src/services/customers.js` deixou de usar Supabase e consome Rails.
- `/admin/customers` lista clientes por `GET /api/v1/store/customers`.
- `/admin/customers/:id` carrega dados, enderecos e historico por `GET /api/v1/store/customers/:id` e `GET /api/v1/store/customers/:customer_id/addresses`.
- Edicao basica salva nome, telefone, WhatsApp, email e observacoes por `PATCH /api/v1/store/customers/:id`.
- Backend serializa historico de pedidos com itens no detalhe do cliente.

Cupons:
- `store-template/src/services/coupons.js` deixou de usar Supabase e consome Rails.
- Admin lista/cria/edita/desativa cupons em `/api/v1/store/coupons`.
- Checkout valida cupom digitado em `POST /api/v1/public/:company_slug/coupons/validate`.
- CheckoutService Rails valida cupom ativo, esgotado, minimo, vinculo com cliente e uso unico por cliente.
- Pedido mantem `coupon_code`, `coupon_id` e `discount_cents` para exibir desconto.

Roleta:
- Auditada implementacao 2R/Supabase: visual ja existia no `store-template`, com regra de 1 giro a cada R$ 25.
- Migrado para Rails com `wheel_prizes` e `wheel_spins`.
- `OrderStatusService` libera giros somente quando o pedido transiciona para `completed`.
- Regra local segue a ultima migration auditada do 2R: base no total do pedido, incluindo frete.
- Publico usa `GET /api/v1/public/:company_slug/wheel/profile`, `GET /wheel/prizes` e `POST /wheel/spin`.
- Admin usa `GET /api/v1/store/wheel/summary`, `GET /wheel/spins`, `POST /wheel_prizes` e `PATCH /wheel_prizes/:id`.
- Premios aceitam tipos do visual 2R (`coupon_percentage`, `coupon_fixed`, `free_shipping`, `no_prize`) e convertem para cupons Rails quando necessario.

Restricoes respeitadas:
- Nao foi iniciada VPS.
- Nao foi configurado webhook real.
- Nao foi iniciado pagamento online.
- Nao foi iniciado app Flutter.

---

### FASE 15.1 - Homologacao Final Completa do Sistema

Status: concluida em modo local, sem deploy e sem iniciar Fase 16.

Escopo auditado:
- README.md, ROADMAP_REPLYMESH.md e STORE_TEMPLATE_PLAN.md lidos.
- Confirmado historico de Fases 1 a 15 implementadas/localmente concluidas.
- Fase 16 nao iniciada.
- VPS/deploy nao iniciado.
- Flutter, IA, marketing em massa e pagamento online nao iniciados.

Validacao executada:
- Produtos em `empresa-teste`, `demohamburgueria` e `demopizza`: criar, editar, ativar, desativar, excluir/desativar e reflexo no menu publico.
- Categorias nas 3 empresas: criar, editar, ativar/desativar, excluir/desativar e reflexo no menu/categorias horizontais.
- Clientes nas 3 empresas: listagem, busca, historico de pedidos, enderecos salvos, edicao basica e isolamento por `company_id`.
- Cupons nas 3 empresas: criar, editar, ativar/desativar, percentual, fixo, expirado, inativo e aplicacao no checkout.
- Checkout nas 3 empresas: entrega, retirada, dinheiro, PIX, troco, observacao, taxa, desconto e totais recalculados pelo Rails.
- Pedidos: transicao para `completed`, timestamps/historico via API e atualizacao de status.
- Roleta nas 3 empresas: giro somente apos `completed`, 1 giro a cada R$ 25, premio, historico, cupom gerado, cupom vinculado ao cliente e uso unico.
- Motoboy na Demo: login, pedido atribuido, visualizacao, finalizar entrega, saida da lista ativa e admin vendo `completed`.
- Localizacao WhatsApp local: campos no serializer, frontend com box verde e uso de `google_maps_url`/`waze_url` com fallback por endereco.
- Multiempresa: `empresa-teste`, `demohamburgueria` e `demopizza` sem mistura de produtos, clientes ou pedidos nos testes.
- WhatsApp: templates ativos/inativos e logs verificados; instancia `Lanche` nao alterada.

Bug encontrado e corrigido:
- `OrderStatusService` falhava ao concluir pedido quando nao havia caixa aberto (`Nenhum caixa aberto`). Isso bloqueava `completed` e giros da roleta. Ajustado para nao bloquear status/roleta quando nao houver caixa aberto; quando houver caixa, o registro financeiro continua sendo feito.

Testes tecnicos:
- `npm run build` no `store-template`: OK, com aviso nao bloqueante de chunk grande do Vite.
- `npm run build` no `replymesh-frontend`: OK.
- `npm run lint` no `replymesh-frontend`: OK.
- `rails routes`: OK.
- `ruby -c` nos arquivos Rails alterados: OK.

Resultado:
- Sistema aprovado para preparar Fase 16, mas ainda nao publicado.
- Proxima fase registrada: FASE 16 - VPS E PRODUCAO.
- Objetivos futuros da Fase 16: `api.replymesh.cloud`, SSL, banco producao, deploy frontend, Evolution real, webhook real, teste real da localizacao e `REPLYMESH_V1_STABLE.md`.
- Nao iniciar Fase 16 sem confirmacao explicita.

---

## HistÃ³rico de VersÃµes

| Data       | Fase       | DescriÃ§Ã£o                              |
|------------|------------|----------------------------------------|
| 2026-06-03 | FASE 0     | DocumentaÃ§Ã£o inicial criada            |
| 2026-06-03 | FASE 0     | Ambiente verificado: Node OK, PG17 OK, Ruby/Redis faltando |
| 2026-06-03 | FASE 0     | Ruby 4.0.5 + Rails 8.1.3 + Bundler instalados em tools\ruby |
| 2026-06-03 | FASE 0     | Redis 5.0.14.1 instalado em tools\redis â€” PONG OK          |
| 2026-06-03 | FASE 0     | Drive M: mapeado para W:\sas replymesh (gems nativas)       |
| 2026-06-03 | FASE 0     | PATH configurado: ruby\bin, redis, psql adicionados         |

---

### FASE 15.4 - Refinamento visual das Configuracoes da Loja

Status: concluida localmente, sem iniciar Fase 16.

Implementado:
- `/loja/:slug/admin/settings` foi reorganizada em accordion com as secoes: Geral, Identidade visual, Entrega, Pagamentos / PIX, Horarios, Impressao / Nota e WhatsApp basico.
- A tela nao exibe mais todos os blocos abertos ao mesmo tempo.
- Campos tecnicos de WhatsApp/Evolution foram removidos da tela de Configuracoes:
  - Base URL da Evolution.
  - API key.
  - Nome da instancia.
  - Teste de envio por template.
  - Preview de mensagem.
  - Avisos tecnicos de secrets/API.
- O bloco WhatsApp basico mostra somente WhatsApp da loja, status simples da API e link para Comunicacao > WhatsApp.
- Relatorios foram removidos de Configuracoes e permanecem no menu Financeiro > Relatorios.
- Entrega, Pagamentos/PIX, Horarios e Impressao/Nota foram compactados.
- Identidade visual ganhou secao propria para logo, URL da logo, upload/troca, remocao, banner/capa e fallback `/logo.png`.
- `banner_url`/`cover_url` passaram a ser preservados no payload de settings do `store-template`.

Testes:
- `npm run build` no `store-template`: OK.

Restricoes respeitadas:
- Nao foi iniciada VPS.
- Nao foi feito deploy.
- Nao foi iniciado Flutter.
- Nao foi iniciada IA.
- Nao foi iniciado pagamento online.
- O 2R original nao foi alterado.

Proxima fase:
- FASE 16 continua pendente e depende de confirmacao explicita.

---

### FASE 15.5 - Refinamento Visual do Painel + Suporte/Tickets

Status: concluida localmente, sem iniciar Fase 16.

Implementado:
- Backend Rails de tickets com `support_tickets` e `support_ticket_messages`.
- Endpoints de tickets para loja:
  - `GET /api/v1/store/tickets`
  - `POST /api/v1/store/tickets`
  - `GET /api/v1/store/tickets/:id`
  - `POST /api/v1/store/tickets/:ticket_id/messages`
  - `PATCH /api/v1/store/tickets/:id/status`
- Endpoints de tickets master:
  - `GET /api/v1/master/tickets`
  - `GET /api/v1/master/tickets/:id`
  - `POST /api/v1/master/tickets/:id/messages`
  - `PATCH /api/v1/master/tickets/:id/status`
- Tela `/loja/:slug/admin/support` conectada ao Rails, sem aviso de backend pendente.
- Tela master `/tickets` conectada ao Rails, sem placeholder.
- Rotas master `/tickets/abertos`, `/tickets/andamento` e `/tickets/resolvidos`.
- Service de caixa do `store-template` migrado para Rails.
- Services de estoque/movimentacoes do `store-template` migrados para Rails.
- Alias `/loja/:slug/admin/cash` criado para caixa.

Validado:
- Criar ticket pela loja Demo Hamburgueria.
- Responder ticket pela loja.
- Alterar status do ticket.
- Listar ticket no master.
- Abrir caixa, registrar suprimento e fechar caixa.
- Criar item de estoque, registrar entrada e ajuste.
- `rails db:migrate`: OK.
- `rails routes`: OK.
- `ruby -c`: OK nos arquivos Rails novos.
- `npm run build` no `store-template`: OK.
- `npm run build` e `npm run lint` no `replymesh-frontend`: OK.

Pendencias:
- Refinamento visual fino de Produtos, Clientes e Relatorios ainda pode ser feito em fase menor separada.
- Deducao automatica nova de estoque por pedido nao foi iniciada nesta fase.
- Fase 16 segue pendente de confirmacao explicita.

---

### FASE 15.6 - Ajustes finais de UX, Tickets, Mesas e Refinamento Visual

Status: concluida localmente, sem iniciar Fase 16.

Implementado:
- Regra de tickets corrigida: a loja pode abrir ticket, ver respostas e responder; a loja nao pode alterar status.
- Backend de tickets da loja agora bloqueia `PATCH /api/v1/store/tickets/:id/status` com 403.
- Painel master continua com controle de status em `/tickets`.
- Suporte da loja ficou com status/prioridade em badges e respostas em formato de conversa.
- Mesas/QR migradas para Rails no `store-template`, sem Supabase:
  - CRUD logico de mesas.
  - Ativar/desativar mesa.
  - Excluir mesa como desativacao segura.
  - Gerar/regenerar QR Code.
  - Ativar/desativar QR Code.
  - Rota publica `/loja/:slug/mesa/:qrToken`.
  - Pedido publico de mesa vinculado a `dining_table_id`.
- Backend Rails ganhou campos de QR em `dining_tables`:
  - `qr_token`
  - `qr_enabled`
  - `qr_generated_at`
  - `qr_updated_at`
- Criado endpoint publico de QR:
  - `GET /api/v1/public/:company_slug/tables/qr/:qr_token`
  - `POST /api/v1/public/:company_slug/tables/qr/:qr_token/session`
  - `POST /api/v1/public/:company_slug/tables/qr/:qr_token/orders`
  - `GET /api/v1/public/:company_slug/tables/qr/:qr_token/orders`
- Produtos compactados visualmente com cards menores, nome truncado e fallback de imagem.
- Clientes compactados com telefone formatado e destaque para pedidos/total gasto.
- Relatorios receberam estado vazio: "Nenhum dado encontrado para o periodo selecionado."
- Estoque validado carregando via Rails sem erro visual nas rotas locais.

Validado:
- `rails db:migrate`: OK.
- `rails routes`: OK, incluindo tickets e mesas/QR.
- `ruby -c`: OK nos controllers/model Rails alterados.
- `npm run build` no `store-template`: OK.
- `npm run build` no `replymesh-frontend`: OK.
- `npm run lint` no `replymesh-frontend`: OK.
- Navegador:
  - `/loja/demohamburgueria/admin/support`: OK.
  - `/tickets`: OK.
  - `/loja/demohamburgueria/admin/tables`: OK.
  - `/loja/demohamburgueria/admin/cash`: OK.
  - `/loja/demohamburgueria/admin/reports`: OK.
  - `/loja/demohamburgueria/admin/products`: OK.
  - `/loja/demohamburgueria/admin/customers`: OK.
  - `/loja/demohamburgueria/admin/inventory`: OK.
  - `/loja/demohamburgueria/mesa/:qrToken`: OK.

Dados locais criados para teste:
- Mesa `Mesa Teste QR` na Demo Hamburgueria.
- Pedidos de mesa de teste #19 e #20.

Pendencias:
- Caixa visual pode receber refinamento mais profundo, mas carregou sem erro.
- Relatorios ainda dependem de mais dados reais para avaliar graficos/listas em volume.
- Fase 16 VPS continua pendente de confirmacao explicita.
## Fase 15.12 - Carina IA da Plataforma

Status: concluida localmente, sem iniciar Fase 16.

Concluido:

- Configuracao centralizada exclusivamente no Painel Master.
- Removida a configuracao de IA por empresa e a tabela `ai_company_settings`.
- Removidos menu e pagina `/admin/ai` da loja; URL antiga redireciona ao dashboard.
- Chat flutuante global no admin da loja quando habilitado pelo master.
- Integracao real com Claude pelo backend Rails.
- Estrutura de providers preparada para expansao futura.
- Modelo atual `claude-haiku-4-5-20251001`, com normalizacao do identificador legado.
- Contexto seguro e multiempresa, sempre filtrado por `company_id`.
- Limites diarios por empresa e por minuto por usuario.
- Logs com empresa, usuario, pagina, provider, modelo e status, sem segredos.
- Fallback para base local quando o provider estiver indisponivel.
- Bloqueio deterministico para perguntas fora da plataforma Replymesh.
- Base de conhecimento criada em `REPLYMESH_AI_KNOWLEDGE_BASE.md`.
- Erro da antiga rota de IA da loja eliminado.
- Lista de empresas inativas endurecida para campos nulos e validada sem erro.

Validado:

- Claude respondeu pelo servidor Rails com o modelo atual.
- Perguntas dos modulos Replymesh responderam pela IA ou base local.
- Perguntas fora do escopo foram bloqueadas.
- API key nao aparece no JSON da loja, console ou logs.
- `rails db:migrate`, `rails routes` e `ruby -c`: OK.
- Builds do master e store-template: OK.
- Lint do master: OK.

Fora do escopo:

- VPS/deploy.
- Acoes automaticas executadas pela Carina.
- Atendimento de consumidor final ou WhatsApp.
- Fase 16.

## Fase 15.13 - Carina IA Premium

Status: concluida localmente, sem deploy e sem iniciar Fase 16.

Concluido:

- Cumprimentos naturais, sem fallback de desconhecimento.
- Nome humano resolvido pelo usuario ou responsavel da empresa.
- Contexto premium com plano, dominio, integracoes, modulos e indicadores.
- Memoria isolada por `company_id` e `user_id` com dez mensagens.
- Recuperacao da base por sinonimos, palavras-chave e intencao.
- Resposta-modelo local quando o Claude estiver indisponivel.
- Prompt premium com linguagem humana, caminhos de menu e proximo passo.
- Migration com `tokens_used` e `response_time_ms`.
- Base reconstruida a partir do codigo real, com 34 modulos/secoes, problemas
  comuns, operacoes, regras, exemplos e historico de versao.
- Claude validado no chat real da Demo Hamburgueria.

Testes:

- Cumprimento respondeu "Boa noite, Wesley!".
- Produto e continuacao sobre imagem mantiveram contexto.
- Mercado Pago, cupom, WhatsApp e motoboy responderam com caminhos reais.
- Memoria confirmou cinco interacoes/dez mensagens.
- Logs confirmaram provider, modelo, tokens, tempo e ausencia de segredo.
- Sintaxe Ruby, migrations, rotas e builds: OK.

Fora do escopo:

- VPS e producao.
- Acoes automaticas pela Carina.
- Busca vetorial externa ou banco de embeddings.
- Fase 16.
# Fase 15.14 - Central de Atualizacoes + Notificacoes (concluida localmente)

- [x] Modelos `SystemUpdate` e `SystemUpdateRead`.
- [x] CRUD e publicacao no painel master.
- [x] Publico global, por plano e por empresa.
- [x] Central profissional e filtros no painel da loja.
- [x] Leitura por usuario e contador de nao lidas.
- [x] Sino real no master e na loja.
- [x] Notificacoes para tickets, pedidos, pagamentos, atualizacoes e WhatsApp desconectado.
- [x] Tema claro/escuro persistente no master.
- [x] Seeds locais com sete atualizacoes.
- [x] Builds, lint, rotas, migrations e teste visual.
- [ ] Deploy/VPS permanece bloqueado ate autorizacao da Fase 16.

# Fase 15.15 - Usuarios, permissoes e identidade Master (concluida localmente)

- [x] `MasterRole` com permissoes separadas das funcoes das lojas.
- [x] Usuarios internos adaptados no model `User` por `master_role_id`.
- [x] CRUD, status, remocao segura e redefinicao de senha.
- [x] Funcoes: Super Admin, Administrador, Suporte, Financeiro, Comercial e Desenvolvedor.
- [x] Convites locais com link, expiracao, reenvio e cancelamento.
- [x] Perfil do administrador com avatar e troca de senha.
- [x] Identidade visual global do Painel Master.
- [x] Sidebar recolhida refinada.
- [x] Menu de acoes das empresas com visualizacao e edicao funcionais.
- [x] Entrada temporaria e auditada como empresa, exclusiva para super admin.
- [x] Notificacoes master mantidas com contador real, leitura e navegacao.
- [x] Auditoria rapida da Carina e bloqueio adicional de perguntas externas.
- [x] Migrations, rotas, sintaxe Ruby, testes de API, lint e builds.
- [ ] Email real de convite depende da infraestrutura futura.
- [x] Token temporario de 30 minutos vinculado a uma unica empresa.
- [x] Troca indevida de `company_id` bloqueada com HTTP 403.
- [ ] VPS/deploy e Fase 16 continuam bloqueados.

# Fase 15.16 - Impersonacao segura e auditoria master (concluida localmente)

- [x] Sessao temporaria de suporte vinculada ao usuario master e empresa.
- [x] Token de revogacao salvo somente como hash.
- [x] Expiracao em 30 minutos e validacao em todas as chamadas da loja.
- [x] Revogacao pelo botao `Sair do acesso suporte`.
- [x] Login normal da loja preservado separadamente.
- [x] Banner mostra usuario master e empresa acessada.
- [x] Permissoes `impersonate_company`, `view_audit_logs` e `manage_audit_logs`.
- [x] Super Admin e Administrador autorizados por padrao.
- [x] Suporte autorizado somente quando a permissao for marcada.
- [x] Financeiro, Comercial e Desenvolvedor sem acesso por padrao.
- [x] `MasterAuditLogService` com filtragem de dados sensiveis.
- [x] Tela `/logs/auditoria` com filtros por usuario, empresa, acao, modulo,
  periodo e status.
- [x] Testes de revogacao, expiracao, isolamento e permissoes.
- [x] Migrations, rotas, sintaxe Ruby, lint e builds validados.
- [ ] VPS, deploy e Fase 16 permanecem bloqueados.

## Correcao local - Motoboys e Recuperador de Vendas

- [x] Removidas as chamadas Supabase restantes do painel administrativo de motoboys.
- [x] Cadastro, edicao e desativacao de motoboy usam Rails.
- [x] Historico e resumo financeiro de entregas usam Rails.
- [x] Vales, diarias, bonus e descontos possuem persistencia Rails por empresa.
- [x] Relatorio preserva isolamento por `company_id`.
- [x] Recuperador de Vendas validado com clientes Rails.
- [x] Estado vazio confirmado quando nenhum cliente atingiu o periodo sem comprar.

# Fase 15.17 - Dashboard Master Executivo (concluida localmente)

- [x] Endpoint `GET /api/v1/master/dashboard` criado.
- [x] `MasterDashboardService` consolidando metricas reais da plataforma.
- [x] Filtros por hoje, 7 dias, 30 dias, mes atual e mes anterior.
- [x] Cards executivos de MRR, empresas ativas, pedidos, receita processada,
  tickets, WhatsApp e uso da Carina.
- [x] Graficos simples sem biblioteca pesada para receita, pedidos, empresas,
  tickets, Carina e WhatsApp.
- [x] Alertas operacionais para WhatsApp desconectado, tickets antigos, testes
  perto de vencer, empresas inativas e Pix pendente antigo.
- [x] Empresas recentes com plano, status, receita, pedidos, WhatsApp e acesso
  rapido.
- [x] Atividades recentes usando `MasterAuditLog`.
- [x] Usuario sem permissao recebe HTTP 403.
- [x] Dados sensiveis nao aparecem na resposta JSON do dashboard.
- [x] Teste visual em `http://127.0.0.1:5173/dashboard`.
- [x] `rails db:migrate`, rotas, sintaxe Ruby, lint e builds validados.
- [ ] VPS, deploy e Fase 16 permanecem bloqueados.

# Fase 15.18 - RAG local da Carina (concluida localmente)

- [x] Criado `ReplymeshRagService`.
- [x] Base Markdown dividida em chunks de tamanho controlado.
- [x] Classificacao por modulo, palavras-chave, sinonimos e relevancia.
- [x] Historico curto preservado para perguntas de continuacao.
- [x] Carina envia apenas os top chunks relevantes ao Claude.
- [x] Logs de uso consolidados em `AiUsageLog`.
- [x] Reducao medida de 86,4% no contexto da pergunta de Mercado Pago.
- [x] Meta minima de 60% superada.
- [x] Cumprimentos e bloqueio de assuntos externos preservados.
- [ ] Embeddings e banco vetorial continuam fora do escopo.

# Fase 15.19 - IA dos clientes com RAG local (concluida em modo local seguro)

- [x] Criados `StoreKnowledgeService`, `StoreRagService` e `StoreAiService`.
- [x] Configuracao isolada por `company_id`.
- [x] IA desativada por padrao.
- [x] Permissoes separadas para pedidos, produtos, horarios, promocoes e status.
- [x] Criados `StoreAiConversation` e `StoreAiMessage`.
- [x] Memoria preparada para as ultimas dez mensagens.
- [x] Criado `AiUsageLog` com tokens, custo estimado, modelo e tempo.
- [x] Simulador local adicionado em Configuracoes > Inteligencia Artificial.
- [x] Simulador exibe chunks encontrados, tempo, tokens e resposta.
- [x] Produtos, horarios, cupons e ultimo pedido validados.
- [x] Receita de bolo, futebol e politica recusados.
- [x] Isolamento entre Demo Hamburgueria e outra empresa validado.
- [x] Nenhuma chamada Evolution ou envio automatico de WhatsApp.
- [ ] Ativacao real no WhatsApp depende de fase futura e confirmacao.
- [ ] VPS, deploy e Fase 16 permanecem bloqueados.

# Fase 15.19.1 - Polimento da IA da Loja e integracao Evolution (concluida localmente)

- [x] Metricas tecnicas removidas do painel da loja.
- [x] Metricas globais separadas entre Carina e IA das Lojas no Painel Master.
- [x] Produtos tecnicos, IDs e SKUs removidos das respostas ao cliente.
- [x] Respostas curtas, naturais e formatadas para WhatsApp.
- [x] Cumprimentos, produtos, horarios, Pix, promocoes e pedidos validados.
- [x] Assuntos externos recusados de forma amigavel.
- [x] Opcao `Responder automaticamente no WhatsApp` criada e desligada por padrao.
- [x] Webhook `POST /api/v1/webhooks/evolution/messages` criado.
- [x] Identificacao segura da empresa pela instancia Evolution.
- [x] Mensagens proprias, grupos e localizacao ignorados pelo fluxo da IA.
- [x] Cliente e ultimo pedido identificados pelo telefone recebido.
- [x] Auditoria sem senha, token ou API key.
- [x] Pipeline Evolution validado localmente em modo mock.
- [ ] Envio real automatico permanece desligado ate configuracao do webhook publico.
- [ ] VPS, deploy e Fase 16 permanecem bloqueados.

# Fase 15.20 - Marketing, Recuperador e Aplicativo Android (concluida localmente)

- [x] Marketing WhatsApp deixou de consultar clientes pelo Supabase.
- [x] Clientes reais da empresa atual carregados pelo Rails.
- [x] Filtros de recorrentes, novos e inativos em 30/60/90 dias.
- [x] Selecao individual e selecao de todos filtrados.
- [x] Envio individual preparado via Evolution com log seguro.
- [x] Campanhas criadas como rascunho, sem disparo automatico.
- [x] Envio de campanha exige confirmacao explicita e respeita limite diario.
- [x] Variaveis de nome, telefone, cupom e link da loja.
- [x] Linhas com cupom removidas quando nao ha cupom.
- [x] Recuperador de Vendas com filtros de 7/15/30/60/90 dias.
- [x] `MarketingMessageLog` criado.
- [x] Banners do App renomeado para Aplicativo Android.
- [x] Loja pode solicitar e acompanhar um aplicativo Android.
- [x] Painel Master lista solicitacoes e altera o status.
- [x] Aplicativo Android movido para o grupo Comunicacao.
- [x] Solicitacao, Banners do App e Mensagens reunidos na mesma pagina.
- [x] Mensagens do modulo Android preparadas pelo WhatsApp via Evolution.
- [x] Envio Evolution corrigido para escolher a instancia conectada da empresa.
- [x] Flash da imagem padrao do hero removido.
- [x] Auditoria master registrada nas alteracoes.
- [x] Migrations, rotas, sintaxe Ruby, lint e builds validados.
- [ ] Geracao de Flutter/APK permanece futura.
- [ ] VPS, deploy e Fase 16 permanecem bloqueados.

- [x] Tela Master de Aplicativos Android reconstruida no design system, com cards, busca, tabela, status e detalhes responsivos.

# Fase 15.21 - Subdominio automatico replymesh.cloud (concluida localmente)

- [x] Dominio padrao alterado para `replymesh.cloud`.
- [x] Slug automatico remove acentos, espacos e normaliza caracteres especiais.
- [x] Duplicidades recebem sufixo numerico, como `demohamburgueria-2`.
- [x] `companies` recebeu `subdomain`, `primary_domain`, `custom_domain`, status e data de verificacao DNS.
- [x] Empresas existentes receberam backfill seguro.
- [x] Nova Empresa mostra o sufixo fixo `.replymesh.cloud`.
- [x] API master retorna os novos campos de dominio.
- [x] `/loja/:slug` permanece compativel.
- [x] Store-template preparado para resolver o tenant por `slug.replymesh.cloud`.
- [x] Estrutura de dominio proprio preparada sem verificacao DNS automatica.
- [x] Migration, rotas, sintaxe Ruby, lint e builds validados.
- [ ] Configurar `*.replymesh.cloud` no DNS durante a fase de VPS.
- [ ] Configurar Nginx para aceitar hosts wildcard durante a fase de VPS.
- [ ] Verificacao DNS e SSL de dominio proprio permanece futura.
- [ ] VPS, deploy e Fase 16 permanecem bloqueados.

# Fase 15.20 - Limpeza final local e modulos parciais (concluida)

- [x] Login e sessao do store-template usam Rails sem tentativa previa no Supabase.
- [x] Checkout publico adaptado ao contrato Rails atual.
- [x] Pedidos, zonas de entrega, configuracoes e templates ativos usam Rails.
- [x] Services Supabase antigos permanecem somente como arquivos historicos sem rota ativa.
- [x] Marketing WhatsApp usa clientes reais, filtros, envio individual e campanhas com confirmacao.
- [x] Recuperador de Vendas ganhou selecao, templates, envio individual e criacao segura de campanha.
- [x] Relatorios da loja usam endpoint Rails com receita, custo, lucro, status, pagamentos e produtos.
- [x] Aplicativo Android possui solicitacao na loja e gestao administrativa no Master.
- [x] Templates visuais incompletos continuam bloqueados como `Template em breve`.
- [x] Dominio padrao local validado como `replymesh.cloud`.
- [x] IA da loja continua em simulador; custos e tokens ficam no Master.
- [x] Builds dos dois frontends, lint do Master, rotas, Ruby e migrations validados.
- [ ] Webhooks publicos Evolution e Mercado Pago ficam para a VPS.
- [ ] Scheduler permanente de expiracao Pix fica para a VPS.
- [ ] DNS wildcard, Nginx e SSL ficam para a VPS.
- [ ] Flutter/APK e push Android permanecem futuros.
- [ ] Fase 16 nao iniciada.

# Fase 15.22 - UX final e performance (concluida localmente)

- [x] Lazy loading aplicado em todas as paginas do Painel Master.
- [x] Lazy loading aplicado nas paginas publicas do store-template.
- [x] Dashboard, Relatorios, IA, Android, Auditoria, Atualizacoes, Marketing e Recuperador separados em chunks.
- [x] Bundle principal do store-template reduzido de aproximadamente 631 kB para 73 kB.
- [x] Bundle principal do Master reduzido de aproximadamente 984 kB para 53 kB.
- [x] Importacao integral do Lucide removida do Master.
- [x] Nenhum chunk final acima de 500 kB.
- [x] Toolbars, tabelas, cards, estados vazios e espacamentos refinados.
- [x] Responsividade de notebook validada no navegador.
- [x] Breakpoints de tablet e mobile reforcados.
- [x] Telas prioritarias abertas sem erros de console.
- [x] Nenhum codigo Supabase legado presente nos assets ativos.
- [x] Smoke completo aprovado com 22 testes Rails.
- [ ] Webhooks, localizacao real e homologacao publica permanecem para a Fase 16.
- [ ] Fase 16 nao iniciada.

# Fase 15.21 - Testes minimos e congelamento local (concluida)

- [x] Suite RSpec criada para autenticacao e permissoes.
- [x] Isolamento multiempresa coberto para produtos, pedidos, clientes e cupons.
- [x] Checkout coberto para delivery, retirada, cupom, entrega, troco e loja fechada.
- [x] Mercado Pago coberto para pendente, aprovado, expirado e cancelado.
- [x] WhatsApp coberto para template ativo, inativo e numero invalido.
- [x] Motoboy coberto para login, pedidos, finalizacao e historico.
- [x] Roleta, Carina e simulador da IA da loja cobertos.
- [x] Resultado: 22 exemplos, 0 falhas.
- [x] Smoke backend e frontend criados em PowerShell.
- [x] Builds dos dois frontends e lint do Master aprovados.
- [x] Rotas locais principais verificadas.
- [x] Auditoria de segredos aprovada sem expor valores.
- [x] Versao congelada como `Replymesh Local Stable v0.15.21`.
- [x] Matriz da Fase 16 registrada.
- [ ] Webhooks e pagamentos reais exigem homologacao publica na Fase 16.
- [ ] Fase 16 nao iniciada.

# Fase 15.23 - Subdominios, dominios proprios e deploy readiness (concluida localmente)

- [x] URLs oficiais definidas: `replymesh.cloud`, `app.replymesh.cloud`, `api.replymesh.cloud` e `*.replymesh.cloud`.
- [x] `CompanyDomainService` centraliza slug, subdominio, dominios oficiais e URLs da plataforma.
- [x] Slug automatico remove acentos, espacos e caracteres especiais.
- [x] Duplicidade tratada com sufixo numerico, como `demohamburgueria-2`.
- [x] Slugs reservados bloqueados: `admin`, `api`, `app`, `www`, `mail`, `ftp`, `root`, `support`, `master`, `suporte`.
- [x] `companies.ssl_status` criado com default `pending`.
- [x] Empresas existentes verificadas com subdominio `replymesh.cloud`.
- [x] Painel Master ganhou aba visual `Configuracoes > Infraestrutura / Dominios`.
- [x] Store-template permanece preparado para resolver tenant via `slug.replymesh.cloud`.
- [x] Dominio proprio fica preparado sem verificacao DNS real.
- [x] Migration e validacoes secas executadas localmente.
- [ ] DNS wildcard `*.replymesh.cloud` fica para VPS.
- [ ] Traefik/Nginx e SSL real ficam para VPS.
- [ ] Fase 16 nao iniciada.

# DEV - Automacao Inteligente de Vendas / Recovery Engine AI Fase 1

- [x] Auditoria do recuperador manual, Evolution, cupons, IA da loja, carrinhos e multiempresa.
- [x] Recuperador manual preservado na nova pagina de Automacao Inteligente.
- [x] Configuracao por empresa criada para ativar/pausar a automacao.
- [x] Motor `SalesRecoveryEngine` criado para localizar carrinhos abandonados da IA.
- [x] Limites diarios, janela de horario, dias permitidos e limite por cliente aplicados.
- [x] Cupons unicos `VOLTA-XXXXX` criados automaticamente quando habilitado.
- [x] Mensagens com IA usam provider global da loja quando configurado.
- [x] Fallback sem IA usa templates variados e nao envia em massa.
- [x] Envio reaproveita Evolution via `MarketingMessageService`.
- [x] Logs e metricas por empresa criados.
- [x] UI da loja criada em Marketing > Automacao Inteligente.
- [x] Fase 1.6 adicionou Customer Value Score por cliente.
- [x] Fase 1.6 adicionou Recovery Score inteligente por carrinho.
- [x] Fase 1.6 adicionou decisao automatica de beneficio: sem desconto, cupom ou frete gratis.
- [x] Fase 1.6 adicionou reputacao anti-spam e pausa automatica de clientes que ignoram recuperacoes.
- [x] Fase 1.6 adicionou ranking `Quase comprando`, insights automaticos e metricas de conversao.
- [x] Fase 1.7 adicionou Recovery Score V2 com pesos configuraveis.
- [x] Fase 1.7 adicionou classificacao automatica e bloqueio de envio para score abaixo de Alta.
- [x] Fase 1.7 adicionou motivos do score, fila priorizada e simulador sem envio.
- [x] Fase 1.7 adicionou metricas de elegibilidade, bloqueio, potencial recuperavel, motivo, categoria e horario.
- [x] Fase 1.8 adicionou Recovery Learning Engine estatistico por empresa.
- [x] Fase 1.8 registra enviado, ignorado, respondido sem compra e convertido.
- [x] Fase 1.8 detecta pedido recuperado com cupom e sem cupom.
- [x] Fase 1.8 criou `GET /api/v1/store/recovery/insights`.
- [x] Fase 1.8 adicionou card `Recovery Insights` na tela de Automacao Inteligente.
- [ ] Fase 2: campanhas inteligentes, recomendacoes avancadas, playbooks e orquestracao de jornadas.
- [ ] Scheduler permanente em VPS deve ser avaliado somente em etapa de infraestrutura.
