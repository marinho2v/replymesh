# REPLYMESH_PHASE_15_3_ADMIN_AUDIT.md

Data: 2026-06-05  
Fase: 15.3 - Configuracoes da Loja, Usuarios e Suporte  
Ambiente: local controlado

## Restricoes respeitadas

- VPS nao iniciada.
- Deploy nao iniciado.
- Flutter nao iniciado.
- IA nao iniciada.
- Marketing WhatsApp nao iniciado.
- Pagamento online nao iniciado.
- Fase 16 nao iniciada.

---

## Rails OK

### Configuracoes gerais da loja

Status: **FUNCIONANDO**

Validado no Rails:

- Nome da loja.
- Telefone.
- WhatsApp.
- Endereco.
- Cidade.
- Estado.
- CEP.
- Status da loja.
- Mensagem de loja fechada.
- URL publica exibida no frontend.

Correcoes feitas:

- `store-template/src/services/settings.js` passou a usar `GET/PUT /api/v1/company/settings`.
- `StoreSetting` passou a persistir corretamente `store_name`, `phone`, `whatsapp_number`, cidade, estado e CEP.
- Corrigida precedencia de normalizacao que sobrescrevia `store_name` com `trade_name` antigo.

### Logo e identidade visual

Status: **FUNCIONANDO**

Validado:

- Upload local da logo.
- Troca da logo.
- Exclusao da logo.
- Fallback padrao `/logo.png`.
- Regras no frontend:
  - Maximo 1 MB.
  - Formatos aceitos: PNG, JPG, WEBP, SVG.

Atualizacao da logo:

- Cabecalho da loja: **OK**.
- Cardapio publico: **OK**.
- Checkout: **OK via layout publico**.
- Pagina de sucesso: **OK**.
- Roleta: **OK apos correcao para usar `store.logo_url`**.
- Painel motoboy: **OK**.
- Login motoboy: **OK apos correcao**.
- Impressao: **PARCIAL**, pois a impressao do pedido nao inclui cabecalho de logo dinamica em todos os layouts.

### Entrega e loja aberta/fechada

Status: **FUNCIONANDO**

Validado:

- Permitir retirada.
- Bloquear pedidos quando loja fechada.
- Bloquear fora da area.
- Loja aberta/fechada.
- Mensagem personalizada.
- Checkout bloqueia pedidos quando `store_status` nao e `open`.
- Checkout agora tambem considera horario do dia quando `block_orders_when_closed` esta ativo.

### PIX

Status: **FUNCIONANDO**

Validado no Rails:

- Chave PIX.
- Tipo de chave.
- Nome recebedor.
- Cidade recebedor.
- Payload copia e cola.
- URL de QR Code PIX.

Checkout:

- Exibe chave/payload/QR Code quando configurados.

Observacao:

- Campo `banco` nao existe como campo separado no Rails; dados bancarios ficam representados por chave, recebedor, cidade, payload e QR Code.

### Horarios de funcionamento

Status: **FUNCIONANDO**

Validado:

- Segunda a domingo.
- Abrir/fechar.
- Dia fechado.
- Mensagem por dia fechado.
- Rails salva via `/api/v1/store/business_hours`.

Parcial:

- Multiplos horarios no mesmo dia ainda nao existem como multiplos registros por dia; ha um intervalo principal com pausa (`break_start`/`break_end`).

### Rodape da nota

Status: **FUNCIONANDO**

Validado:

- `print_footer` salva no Rails.
- Campo aparece na tela de configuracoes.

Parcial:

- Nem todos os templates de impressao consomem o rodape dinamico ainda.

### Usuarios

Status: **FUNCIONANDO**

Backend criado:

- `GET /api/v1/store/users`
- `POST /api/v1/store/users`
- `PATCH /api/v1/store/users/:id`
- `DELETE /api/v1/store/users/:id`

Validado:

- Proprietario/Administrador mapeado para `store_admin`.
- Atendente mapeado para `employee`.
- Cozinha mapeado para `kitchen`.
- Motoboy mapeado para `motoboy`.
- Cadastro.
- Edicao.
- Redefinicao de senha.
- Ativar/desativar.
- Isolamento por `company_id` via `CompanyMember`.

### Permissoes

Status: **FUNCIONANDO / PARCIAL**

Confirmado no frontend:

- Atendente: menu segmentado para pedidos/clientes e fluxos operacionais permitidos.
- Cozinha: menu de cozinha/preparo.
- Motoboy: portal separado com entregas, historico e perfil.

Parcial:

- A autorizacao fina ainda e majoritariamente frontend/menu. O Rails ainda nao possui policies completas por perfil em todos os endpoints da store.

---

## Legado Supabase

### Mesas

Status: **PARCIAL**

Rails OK:

- `DiningTable` existe.
- `TableSession` existe.
- CRUD basico Rails validado:
  - Criar mesa.
  - Editar mesa.
  - Desativar/exclusao logica.

Legado Supabase:

- `store-template/src/services/tables.js` ainda usa Supabase para listagem operacional, sessoes, comanda, QR e acoes completas.
- `useTables.js` ainda assina realtime Supabase.

Nao implementado no Rails:

- `qr_token`.
- `qr_enabled`.
- Regenerar QR Code.
- Abertura publica por QR via endpoint Rails.
- Associacao completa do QR ao pedido via Rails.

Classificacao:

- Criar/editar/desativar mesa em Rails: **FUNCIONANDO**.
- Modulo completo de mesas no frontend Rails: **PARCIAL**.
- QR Code Rails: **NAO IMPLEMENTADO**.

### WhatsApp/template auxiliar nas configuracoes

Status: **PARCIAL**

- A tela de configuracoes ainda possui testes auxiliares e template preview com chamadas legadas em partes do servico.
- Modulo principal WhatsApp transacional da loja ja esta em Rails/Evolution conforme fases anteriores.

### Publicar atualizacao/cache

Status: **LEGADO SUPABASE**

- `publishAppUpdate` ainda chama RPC Supabase.
- Nao foi usado nesta fase.
- Nao foi iniciado deploy.

---

## Nao implementado

### Suporte

Status: **PARCIAL / BACKEND NAO IMPLEMENTADO**

Implementado nesta fase:

- Estrutura visual completa da aba Suporte:
  - Criar ticket visual.
  - Listar ticket visual.
  - Responder ticket visual.
  - Alterar status visual.

Pendente:

- Backend Rails de tickets.
- Persistencia real.
- Historico real de respostas.
- Notificacoes internas.

Classificacao:

- Visual: **FUNCIONANDO**.
- Backend: **NAO IMPLEMENTADO**.

---

## Testes executados

### Rails

- `rails db:migrate`: **OK**.
- `rails routes`: **OK**, incluindo settings, users, business hours e tables.
- `ruby -c`:
  - `StoreSetting`: **OK**.
  - `CompanySettingsController`: **OK**.
  - `Public::StoresController`: **OK**.
  - `Store::UsersController`: **OK**.
  - migration 15.3: **OK**.

### Frontend

- `npm run build` em `store-template`: **OK**.
- Aviso nao bloqueante: chunk principal acima de 500 kB.

### Operacionais

- Configuracoes gerais: **OK apos correcao**.
- Upload/troca/exclusao de logo: **OK**.
- PIX: **OK**.
- Horarios: **OK**, com ressalva de multiplos horarios.
- Usuarios: **OK**.
- Mesas Rails basico: **OK**.
- Mesas QR Rails: **NAO IMPLEMENTADO**.
- Suporte visual: **OK**.
- Suporte backend: **NAO IMPLEMENTADO**.

---

## Conclusao

O sistema esta **quase pronto para VPS**, mas nao esta 100% fechado operacionalmente por causa de duas pendencias claras:

1. Mesas completas/QR ainda dependem de migracao do legado Supabase para Rails.
2. Suporte tem estrutura visual, mas ainda nao tem backend Rails de tickets.

Para uma VPS focada em delivery, pedidos, clientes, cupons, roleta, motoboy, WhatsApp transacional e configuracoes principais, o sistema esta pronto para preparar a Fase 16.

Para publicar tambem mesas QR e suporte com tickets reais, essas duas pendencias devem ser resolvidas antes da producao.

Proxima fase continua registrada apenas como futura:

- **FASE 16 - VPS E PRODUCAO**

Nao iniciar Fase 16 sem confirmacao explicita.

---

## Atualizacao Fase 15.4 - Refinamento visual das Configuracoes

Status: **CONCLUIDO LOCALMENTE**

Alteracoes:

- A tela `/loja/:slug/admin/settings` foi reorganizada em accordion.
- Apenas uma secao fica aberta por vez.
- Secoes finais:
  - Geral.
  - Identidade visual.
  - Entrega.
  - Pagamentos / PIX.
  - Horarios.
  - Impressao / Nota.
  - WhatsApp basico.

WhatsApp/template auxiliar nas configuracoes:

- O bloco tecnico foi removido da tela de Configuracoes.
- Nao aparecem mais Evolution Base URL, API key, instancia, teste de conexao, teste de envio, preview de template ou avisos de secrets.
- Configuracoes operacionais de WhatsApp ficam no menu Comunicacao > WhatsApp, Templates WhatsApp e Logs WhatsApp.
- A tela de Configuracoes mostra apenas WhatsApp da loja, status simples e link para o modulo WhatsApp.

Relatorios:

- Removidos da tela de Configuracoes.
- Permanecem no menu Financeiro > Relatorios.

Identidade visual:

- Criada secao propria para logo e banner/capa.
- Upload/troca/remocao de logo e banner ficam agrupados.
- Fallback de logo permanece `/logo.png`.

Teste:

- `npm run build` no `store-template`: **OK**.

Nao iniciado:

- VPS/deploy.
- Flutter.
- IA.
- Pagamento online.
- Alteracoes no 2R original.

---

## Atualizacao Fase 15.5 - Suporte, Tickets, Caixa e Estoque

Status: **CONCLUIDO LOCALMENTE**

Suporte:

- Backend Rails de tickets implementado.
- Tela de suporte da loja deixou de ser parcial/local.
- Aviso de backend pendente removido.
- Criar ticket, responder e alterar status funcionam via Rails.

Tickets master:

- Placeholder `/tickets` substituido por tela real.
- Master lista tickets de todas as empresas.
- Filtros por empresa, prioridade e data.
- Rotas `/tickets`, `/tickets/abertos`, `/tickets/andamento` e `/tickets/resolvidos`.

Caixa:

- Service do `store-template` migrado de Supabase direto para Rails.
- Abrir caixa, registrar movimentacao e fechar caixa validados.

Estoque:

- Services de estoque e movimentacoes migrados de Supabase direto para Rails.
- Criar item, entrada e ajuste validados.

Testes:

- `rails db:migrate`: **OK**.
- `rails routes`: **OK**.
- `ruby -c` nos arquivos Rails novos: **OK**.
- `npm run build` no `store-template`: **OK**.
- `npm run build` no `replymesh-frontend`: **OK**.
- `npm run lint` no `replymesh-frontend`: **OK**.

Pendencias:

- Produtos, Clientes e Relatorios podem receber refinamento visual fino em etapa menor separada.
- Deducao automatica nova de estoque por pedido nao foi iniciada.
- Fase 16 continua bloqueada sem confirmacao.
