# Replymesh SaaS - Painel Master

Plataforma SaaS multi-tenant para lanchonetes, restaurantes, hamburguerias, pizzarias e delivery.

## Status

- Reorganizacao do menu admin: a navegacao da loja foi separada em Dashboard, Operacao, Cardapio, Entrega, Clientes, Estoque, Financeiro, Comunicacao, Cerebro da ReplyMesh, Administracao e Ajuda. As telas de inteligencia agora ficam concentradas no grupo `Cerebro da ReplyMesh`, sem alterar rotas, APIs ou permissoes.
- Fase 2.6 Product Intelligence: `ProductIntelligenceService` transforma pedidos e cardapio em inteligencia de produtos, calculando score, classificacao, tendencia, potencial, horarios, dias e combinacoes vendidas juntas, com cache `product_intelligence` e sem alterar precos, pedidos ou promocoes.
- Fase 2.5 Customer Intelligence: `CustomerIntelligenceService` classifica clientes por perfil, score, risco, oportunidade, produtos favoritos e insights comerciais, usando apenas metricas da loja, cache `customer_intelligence` e sem enviar mensagens ou executar campanhas.
- Fase 2.3 Cerebro Replymesh: `ReplymeshBrainService` consolida estatisticas anonimas globais e por empresa para reutilizar aprendizado em Recovery, Consultor de Vendas e Analise do Negocio, usando PostgreSQL e cache `replymesh_brain`, sem armazenar dados pessoais ou mensagens.
- Fase 2.2 Business Intelligence: `BusinessIntelligenceService` transforma dados operacionais da loja em leitura comercial, riscos, oportunidades e indicadores executivos.
- Fase 2.1 Coach Inteligente: `SalesCoachLearningService` adiciona aprendizado por empresa ao AI Sales Coach, com persistencia de insights, status, feedback do lojista, historico, Coach Score e area visual de recomendacoes inteligentes. O coach continua apenas recomendando; nenhuma acao e executada automaticamente.
- Fase 2.0 AI Sales Coach Foundation: `SalesCoachService` analisa pedidos, faturamento, ticket medio, produtos, categorias, Recovery, cupons, clientes, horarios, estoque e aprendizado existente para gerar recomendacoes ao dono da loja. O coach apenas observa e sugere acoes; nao executa automacoes.
- Fase 1.9 AI Foundation: `CompanyContextBuilder` centraliza contexto de empresa para IA vendedora e Recovery Engine, com cache de 5 minutos, invalidacao por alteracoes da loja e metricas no Performance Monitor.
- Fase 1: Backend Rails API concluido.
- Fase 2: Frontend React/Vite convertido a partir do prototipo aprovado.
- Fase 3: Modulo Empresas / Onboarding conectado ao backend Rails API.
- Fase 4: Modulo Planos e Assinaturas conectado ao backend Rails API.
- Fase 5: Modulo Dominios conectado ao backend Rails API.
- Fase 6: Modulo WhatsApp implementado localmente; leitura real da Evolution Go funcionando para `/instance/all`.
- Fase 6.5: Modulo Configuracoes da Empresa conectado ao backend Rails API.
- Fase 7: Modulo Logs, Alertas e Auditoria conectado ao backend Rails API.
- Fase 8: Modulo Financeiro com MRR real, evolucao mensal, cobrancas e inadimplencia.
- Fase 9: Auditoria do sistema Lanches do 2R e plano de migracao para template SaaS (MIGRATION_2R_PLAN.md).
- Fase 10: Schema Rails operacional criado — 28 migrations, 27 models, 5 services, 44 tabelas no banco.
- Fase 11: APIs Rails da loja criadas/validadas para substituir gradualmente chamadas Supabase do template 2R.
- Fase 12: `store-template` criado como copia isolada do 2R; home, menu, produto, carrinho, checkout publico, acompanhamento publico, painel/admin de pedidos e cozinha/KDS conectados ao Rails.
- Fase 12.5: visual publico do template restaurado para ficar mais proximo do 2R original.
- Fase 12.6: fluxo do checkout, lookup por WhatsApp, troco no dinheiro, menu admin e regra segura de templates WhatsApp ajustados.
- Fase 12.7: cardapio real do 2R (95 produtos, 8 categorias, 7 zonas) importado para empresa-teste; dashboard visual aprimorado com donut chart, sparklines, Resumo Geral com icones, header com data/bell/avatar; getDashboardStats e Pedidos Recentes migrados para Rails.
- Fase 12.8: admin catalogo conectado ao Rails — /admin/products, /admin/categories, /admin/app-banners, /admin/delivery-zones todos usando APIs Rails; fluxo desativar/reativar produto refletido em tempo real no menu publico.
- Fase 12.8.1: checkout identico ao 2R com lookup automatico por WhatsApp, enderecos salvos, PIX inline, troco e cupons.
- Fase 12.8.2: WhatsApp por empresa — instancia unica, QR Code oculto quando conectado, test_send validado com envio real.
- Fase 12.9: checkout totalmente identico ao temple1/2R, branding multiempresa completo (zero hardcodes do 2R), onboarding automatico com BusinessHours e DeliveryZone padrao, WhatsApp com auto-polling e templates inline, validacao final concluida.
- Fase 13.0: Modulo Motoboy base com login Rails, entregas, iniciar/finalizar e historico.
- Fase 13.1: UX Motoboy aproximada do portal 2R, tabs horizontais, financeiro basico e atribuicao visual no admin de pedidos.
- Fase 13.1.1: correcoes finais de detalhe do pedido, impressao, produto manual e fluxo pedido real + motoboy.
- Fase 13.1.2: fluxo de status passou a obedecer templates WhatsApp ativos; envio automatico real liberado somente em desenvolvimento para Demo Hamburgueria; AppVersionWatcher deixou de consultar Supabase; fluxo de localizacao Evolution documentado em `FLUXO_LOCALIZACAO_EVOLUTION.md`.
- Fase 14.0: webhook Rails local de localizacao Evolution criado em `POST /api/v1/webhooks/evolution/location`, validado com Demo Hamburgueria e payload simulado da Evolution.
- Fase 14.1: portal motoboy simplificado; pedido atribuido ja aparece para entrega, botao `Iniciar entrega` foi ocultado, `Finalizar entrega` conclui direto e o card mostra localizacao WhatsApp em verde quando houver pin salvo.
- Fase 15.0: clientes, cupons e roleta conectados ao Rails, mantendo isolamento por empresa e visual do 2R.
- Fase 15.1: homologacao final completa concluida em modo local controlado, sem iniciar producao.
- Fase 15.7: polish final UI/UX — todas as paginas admin do store-template refinadas visualmente (suporte chat bubbles, relatorios KPI executivo, clientes CRM, caixa compacto, estoque/mesas/produtos com empty states profissionais).
- Fase 15.8: auditoria final de producao local — 120 arquivos Ruby Syntax OK, 29 migrations up, 222 rotas Rails, builds 0 erros, multiempresa validada, fluxos completos auditados. Sistema local aprovado para Fase 16.
- Fase 15.9: sistema de templates visuais da loja — campo `visual_template_id` no banco, registry de templates, `StoreTemplateContext`, seletor de template nas configuracoes. Template hamburgueria-classic registrado como padrao.
- Fase 15.9.1: templates por categoria — hamburgueria-premium (baseado em V2 HTML), pizzaria-dark, doceria-clean, bebidas-neon registrados. Filtro por categoria no seletor. Preview CSS dinamico por template. Guia `STORE_VISUAL_TEMPLATES_GUIDE.md` atualizado com fluxo HTML→React.
- Fase 15.9.2: hamburgueria-premium convertido para React/Vite funcional. Home, menu, cards de produto, header, footer e detalhe de produto carregam dados Rails e respeitam `visual_template_id`.
- Proxima fase registrada: FASE 16 - VPS E PRODUCAO, somente com aprovacao explicita.
- Nao iniciar deploy, banco de producao, Evolution real, webhook real, pagamento online, Flutter, IA ou marketing em massa sem aprovacao explicita.

## Estrutura

```text
W:\sas replymesh\
  replymesh-api\        Backend Rails API
  replymesh-frontend\   Frontend React/Vite
  index.html            Prototipo visual original
  shell.jsx             Referencia do shell antigo
  lib.jsx               Referencia de componentes antigos
  dashboard.jsx         Referencia do dashboard antigo
  empresas.jsx          Referencia de empresas antigo
  whatsapp.jsx          Referencia do WhatsApp antigo
```

## Backend

```powershell
cd "W:\sas replymesh\replymesh-api"
$env:PATH = "W:\replymesh-ruby\bin;W:\replymesh-ruby\msys64\ucrt64\bin;W:\replymesh-ruby\msys64\usr\bin;$env:PATH"
bundle install
rails db:create db:migrate db:seed
rails s -b 127.0.0.1 -p 3000
```

Backend: `http://127.0.0.1:3000`

Usuario local seedado:

```text
email: admin@replymesh.cloud
senha: admin123456
```

### Importacao de dados do 2R

Para importar o cardapio real do Lanche do 2R para a empresa-teste:

```powershell
cd "W:\sas replymesh\replymesh-api"
$env:PATH = "W:\replymesh-ruby\bin;$env:PATH"

# Primeira importacao (ou reimportar limpando dados antigos):
ruby bin/rails import_2r:run RESET_TEST_DATA=true

# Importar sem limpar (idempotente):
ruby bin/rails import_2r:run
```

Resultado esperado: 8 categorias, 95 produtos, 7 zonas de entrega, 8 templates WhatsApp.

### APIs da Loja

Namespaces da Fase 11:

- `/api/v1/store/...`: rotas autenticadas para painel/admin/cozinha/motoboy da empresa logada.
- `/api/v1/public/:company_slug/...`: rotas publicas para loja, cardapio e checkout.

Para `super_admin`, rotas `/store` exigem `company_id` ou header `X-Company-Id`. Usuarios de loja usam a empresa ativa em `company_members`.

Principais modulos disponiveis:

- Cardapio: categorias, produtos, grupos e itens de opcoes.
- Clientes: clientes e enderecos.
- Pedidos: checkout, listagem e transicoes de status.
- Estoque: itens, entradas, ajustes e movimentos.
- Caixa: sessoes, fechamento e movimentacoes.
- Motoboys: cadastro, atribuicao e status de entregas.
- Loja publica: store info, menu, banners, horarios, zonas e pedidos publicos.
- Lookup publico de cliente por telefone: `GET /api/v1/public/:company_slug/customers/lookup?phone=...`.

## Dominios

Dominio principal da Replymesh: `replymesh.cloud`.

Arquitetura futura prevista:

- `app.replymesh.cloud` para o Painel Master.
- `api.replymesh.cloud` para a API Rails.
- `{slug}.replymesh.cloud` para lojas/clientes.

Nao usar `.com.br` como dominio padrao nas novas configuracoes.

## Frontend

```powershell
cd "W:\sas replymesh\replymesh-frontend"
npm install
npm run dev
```

Frontend: `http://127.0.0.1:5173/dashboard`

Login local:

```text
email: admin@replymesh.cloud
senha: admin123456
```

Rotas principais:

- `/login`
- `/dashboard`
- `/empresas`
- `/empresas/nova`
- `/whatsapp`
- `/whatsapp/qrcode`
- `/whatsapp/templates`
- `/whatsapp/logs`
- `/dominios`
- `/dominios/dns`
- `/dominios/ssl`
- `/assinaturas`
- `/assinaturas/planos`
- `/assinaturas/faturas`
- `/assinaturas/inadimplencia`
- `/financeiro`
- `/usuarios-master`
- `/logs`
- `/logs/atividades`
- `/logs/erros`
- `/logs/webhooks`
- `/logs/evolution`
- `/logs/automacoes`
- `/tickets`
- `/configuracoes`

## Store Template

Template da loja baseado no frontend 2R, sem alterar o projeto original `M:\temple1`:

```powershell
cd "W:\sas replymesh\store-template"
npm install
npm run dev -- --host 127.0.0.1 --port 5174
```

URL local:

```text
http://127.0.0.1:5174/menu
```

Variaveis:

```env
VITE_REPLYMESH_API_URL=http://127.0.0.1:3000/api/v1
VITE_COMPANY_SLUG=empresa-teste
VITE_REPLYMESH_COMPANY_ID=4
```

Modo hibrido da Fase 12:

- Supabase antigo permanece em paralelo nos services originais.
- Rails foi adicionado em `src/services/replymeshApi.js`, `src/services/publicApi.js` e `src/services/storeApi.js`.
- Home publica usa store info Rails.
- Menu/cardapio publico usa categorias e produtos Rails.
- Banners, horarios, status aberto/fechado, endereco, WhatsApp e zonas de entrega usam leitura Rails.
- Detalhes de produto, opcionais/adicionais e carrinho local usam leitura Rails.
- O carrinho permite adicionar, alterar quantidade, remover item e calcular subtotal local.
- Checkout publico de teste usa `POST /api/v1/public/:company_slug/orders`.
- Checkout inicia pelo WhatsApp, pode buscar cliente/endereco por telefone e salva troco em pedidos com dinheiro (`needs_change`, `change_for_cents`).
- A tela de sucesso/acompanhamento usa `GET /api/v1/public/:company_slug/orders/:id`.
- As rotas `/success/:id` e `/pedido/:id` mostram timeline publica com atualizacao manual e polling simples a cada 10 segundos.
- O backend recalcula produto, opcionais/adicionais, taxa de entrega e total final antes de gravar o pedido.
- O painel `/admin/orders` usa `GET /api/v1/store/orders` com JWT Rails e `X-Company-Id`.
- A cozinha `/kitchen` usa `GET /api/v1/store/kitchen/orders` com JWT Rails e polling simples.
- A alteracao de status usa `PATCH /api/v1/store/orders/:id/status` com `skip_side_effects=true` nesta etapa.
- O menu admin da loja esta organizado por Dashboard, Operacao, Cardapio, Entrega, Clientes & Promocoes, Estoque, Financeiro, Comunicacao, Administracao e Suporte.
- Templates WhatsApp por status usam `enabled` por empresa; no ambiente local, a Demo Hamburgueria ja valida envio real automatico seguro para os templates ativos.
- Supabase Auth segue preservado; o login ganhou fallback local Rails para desenvolvimento da migracao.
- Motoboy, caixa automatico, WhatsApp automatico real, pagamento online e deploy ainda nao foram iniciados.

### Webhook de Localizacao Evolution

Endpoint local criado na Fase 14.0:

```text
POST /api/v1/webhooks/evolution/location
Header: apikey: <EVOLUTION_LOCATION_WEBHOOK_SECRET ou EVOLUTION_GO_API_KEY>
```

Payload esperado, em formato conhecido da Evolution Go:

```json
{
  "instanceName": "replymesh_demohamburgueria_qr",
  "data": {
    "Info": {
      "Sender": "5521999999999@s.whatsapp.net",
      "Chat": "5521999999999@s.whatsapp.net",
      "IsFromMe": false
    },
    "Message": {
      "locationMessage": {
        "degreesLatitude": -22.9351234,
        "degreesLongitude": -42.8165678,
        "name": "Endereco enviado pelo cliente"
      }
    }
  }
}
```

O webhook identifica a instancia vinculada, filtra por empresa, localiza o pedido delivery aberto mais recente pelo telefone e grava `delivery_latitude`, `delivery_longitude`, `google_maps_url`, `waze_url`, `delivery_location_source=whatsapp` e `delivery_location_received_at`.

No portal do motoboy, quando esses campos existem, Maps/Waze usam o pin recebido pelo WhatsApp. Quando nao existem, continuam usando o endereco textual como fallback. O endpoint `POST /api/v1/motoboy/orders/:id/start` permanece no backend para fase futura, mas o frontend atual nao exige mais iniciar entrega.

Para validar com backend local:

```powershell
cd "W:\sas replymesh\replymesh-api"
$env:PATH = "W:\replymesh-ruby\bin;W:\replymesh-ruby\msys64\ucrt64\bin;W:\replymesh-ruby\msys64\usr\bin;$env:PATH"
bundle check
rails s -b 127.0.0.1 -p 3000
```

## Frontend API

Arquivo:

```text
replymesh-frontend/src/services/api.js
```

Variavel:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

Metodos disponiveis:

- `login`
- `me`
- `getCompanies`
- `createCompany`
- `updateCompany`
- `activateCompany`
- `deactivateCompany`
- `getPlans`
- `createPlan`
- `updatePlan`
- `getSubscriptions`
- `updateSubscription`
- `getDomains`
- `createDomain`
- `updateDomain`
- `deactivateDomain`
- `verifyDomain`
- `setPrimaryDomain`
- `testEvolutionConnection`
- `getWhatsappInstances`
- `createWhatsappInstance`
- `getWhatsappStatus`
- `getWhatsappQrCode`
- `disconnectWhatsappInstance`
- `restartWhatsappInstance`
- `deleteWhatsappInstance`
- `getWhatsappTemplates`
- `createWhatsappTemplate`
- `updateWhatsappTemplate`
- `getWhatsappLogs`
- `getActivityLogs`
- `getSystemAlerts`
- `resolveSystemAlert`

Evolution Go local:

- Base URL: `https://marinho.replymesh.cloud`
- Listagem real: `GET /instance/all`
- Header validado: `apikey`
- Sincronizacao segura: `POST /api/v1/master/whatsapp/instances/sync`
- Criacao controlada da instancia teste: `POST /api/v1/master/whatsapp/instances/create_test`
- QR Code real da instancia teste: `GET /api/v1/master/whatsapp/instances/:id/qrcode`
- Instancias remotas sem empresa clara ficam como nao vinculadas.
- A API key fica somente no `.env` do backend.

## Portas locais e loja por empresa

- Replymesh Master: `http://127.0.0.1:5173`
- Store Template: `http://127.0.0.1:5174`
- Rails API: `http://127.0.0.1:3000`

Demo Hamburgueria:

- Slug: `demohamburgueria`
- Loja publica: `http://127.0.0.1:5174/loja/demohamburgueria`
- Login da loja: `http://127.0.0.1:5174/loja/demohamburgueria/login`
- Admin: `http://127.0.0.1:5174/loja/demohamburgueria/admin/dashboard`
- WhatsApp QR Code: `http://127.0.0.1:5174/loja/demohamburgueria/admin/whatsapp/qrcode`

O admin da loja usa o `companySlug` da URL para buscar `company_id` via Rails e enviar `X-Company-Id` nas rotas autenticadas. O frontend nunca chama Evolution Go diretamente e nunca exibe `instance_token` ou apikey.

Admin local da Demo:

- E-mail: `admin@demohamburgueria.com.br`
- Senha local: `admin123456`
- Acesso: `http://127.0.0.1:5174/loja/demohamburgueria/login`

Checkout publico:

- O fluxo restaurado segue o 2R: WhatsApp primeiro, lookup de cliente, enderecos salvos, regiao atendida, conferencia de rua/numero/regiao, cupom, dinheiro com troco e resumo completo.
- O Rails recalcula subtotal, adicionais, taxa, desconto e total; o frontend mostra apenas uma previa.
- Loja fechada por enquanto gera regra visual. Bloquear ou permitir pedido fora do horario sera uma configuracao futura por empresa.

WhatsApp por status fica preparado, sem envio real automatico:

- `accepted` -> `pedido_aceito`
- `preparing` -> `pedido_em_preparo` se template enabled
- `ready` -> `pedido_pronto` se template enabled
- `out_for_delivery` -> `saiu_para_entrega`
- `completed` -> `pedido_finalizado`

Templates enabled por padrao: `pedido_aceito`, `saiu_para_entrega`, `pedido_finalizado`.

Fase futura documentada: webhook de localizacao Evolution, onde a localizacao enviada pelo cliente no WhatsApp sera vinculada ao pedido mais recente e usada pelo motoboy no Google Maps/Waze.

## Fase futura - Atendimento IA WhatsApp

Plano completo:

- `AI_WHATSAPP_ATTENDANT_PLAN.md`

Resumo:

- Atendimento IA no WhatsApp sera opcional por loja e liberado por plano.
- IA identificara a loja pela instancia Evolution e o cliente pelo telefone.
- Todas as buscas devem filtrar por `company_id`.
- IA nao pode responder grupos, mensagens proprias, mensagens automaticas do sistema ou mensagens de localizacao antes do fluxo de localizacao.
- IA nao pode inventar produto, preco, prazo, status ou motoboy.
- IA deve chamar atendente quando nao souber.

Fluxos preservados:

- Mensagens automaticas por status continuam separadas.
- Localizacao via WhatsApp continua prioridade:
  - Evolution recebe localizacao.
  - Rails salva latitude/longitude/link maps no pedido.
  - Motoboy usa Google Maps/Waze.

Menu futuro planejado, ainda nao implementado:

```text
Comunicacao
- WhatsApp
- Templates WhatsApp
- Marketing WhatsApp
- Atendimento IA
```

Rotas Rails da loja para WhatsApp:

- `GET /api/v1/store/whatsapp/instances`
- `POST /api/v1/store/whatsapp/instances/ensure`
- `GET /api/v1/store/whatsapp/instances/:id/status`
- `GET /api/v1/store/whatsapp/instances/:id/qrcode`
- `GET/PATCH /api/v1/store/whatsapp/templates`
- `GET /api/v1/store/whatsapp/logs`
- `POST /api/v1/store/whatsapp/test_send`

Regra WhatsApp por empresa:

- Uma empresa usa uma unica instancia WhatsApp principal no painel da loja.
- Demo Hamburgueria usa `replymesh_demohamburgueria_qr`.
- Status validado da Demo: conectado.
- Numero conectado da Demo: `5521968443941:90@s.whatsapp.net`.
- QR Code fica oculto quando a instancia esta conectada.
- O frontend nunca recebe `instance_token`, apikey ou API key.
- A Evolution Go desta VPS envia texto em `POST /send/text` com header `apikey` da instancia.

Templates ativos por padrao:

- `pedido_aceito`
- `saiu_para_entrega`
- `pedido_finalizado`

Templates existentes mas desativados por padrao:

- `pedido_recebido`
- `pedido_em_preparo`
- `pedido_pronto`
- `pedido_cancelado`
- `marketing`

Fluxo status -> WhatsApp:

- `accepted` -> `pedido_aceito`
- `preparing` -> `pedido_em_preparo`
- `ready` -> `pedido_pronto`
- `out_for_delivery` -> `saiu_para_entrega`
- `completed` -> `pedido_finalizado`
- `cancelled` -> `pedido_cancelado`

O envio real automatico permanece bloqueado fora do fluxo de teste controlado.

## Verificacao

```powershell
cd "W:\sas replymesh\replymesh-frontend"
npm run lint
npm run build
```

Para o `store-template`:

```powershell
cd "W:\sas replymesh\store-template"
npm run build
```

Observacao: o `store-template` ainda nao possui script `lint`.

## Fase 13.0 - Motoboy Base

Rotas locais do portal Motoboy:

- `http://127.0.0.1:5174/loja/demohamburgueria/motoboy/login`
- `http://127.0.0.1:5174/loja/demohamburgueria/motoboy/dashboard`
- `http://127.0.0.1:5174/loja/demohamburgueria/motoboy/history`
- `http://127.0.0.1:5174/loja/demohamburgueria/motoboy/profile`

Endpoints Rails:

- `POST /api/v1/motoboy/auth/login`
- `GET /api/v1/motoboy/profile`
- `GET /api/v1/motoboy/orders`
- `POST /api/v1/motoboy/orders/:id/start`
- `POST /api/v1/motoboy/orders/:id/complete`
- `GET /api/v1/motoboy/history`

Credencial local de teste criada durante a validacao:

- Telefone: `21977770000`
- Senha: `motoboy123456`
- Empresa: `demohamburgueria`

Observacoes:

- O token do motoboy fica separado do token admin da loja.
- A Fase 13.0 nao implementa localizacao em tempo real, Google Maps, Waze ou Evolution Location.

## Fase 13.1 - UX Motoboy e Atribuicao Visual

Entregue:

- Portal Motoboy com layout centralizado no padrao do 2R.
- Header com logo/nome da empresa atual.
- Tabs horizontais: Entregas, Historico, Financeiro, Perfil.
- Card "Minhas entregas" com botao Atualizar.
- Cards de entrega com cliente, status, endereco, referencia, pagamento, total, taxa, itens, observacoes e botoes Maps/Waze/Cliente.
- Rota `http://127.0.0.1:5174/loja/demohamburgueria/motoboy/financeiro`.
- Admin de pedidos mostra seletor "Atribuir motoboy" quando pedido de entrega esta `ready`.
- Depois da atribuicao, o pedido aparece no painel do motoboy.
- Detalhe do pedido em `/loja/:slug/admin/orders/:id` usa Rails e mostra dados completos do pedido.
- Botao Imprimir abre cupom em janela de impressao do navegador.
- A lateral do detalhe permite enviar WhatsApp, alterar status, cancelar e salvar motoboy.

Ainda nao implementado:

- Localizacao em tempo real.
- Webhook de localizacao Evolution.
- Mapa embutido.
- Financeiro avancado de repasses/vales.
- Upload de foto do motoboy no portal Rails novo.

## Fase 13.1.1 - Correcoes finais

Entregue:

- `/loja/demohamburgueria/admin/orders/17` abre sem erro de import `railsAssignMotoboyToOrder`.
- `store-template/src/services/storeApi.js` exporta `railsAssignMotoboyToOrder` e usa update parcial seguro para produtos.
- Produto manual no admin valida nome, categoria e preco; criar/editar/desativar/reativar funciona via Rails.
- Produto ativo aparece no menu publico; desativado some do menu publico.
- Detalhe do pedido imprime cupom em HTML isolado via `window.open` com `Blob` e fallback por iframe escondido.
- Cupom inclui pedido, cliente, telefone, tipo, endereco, bairro, referencia, itens, subtotal, taxa, desconto, total, pagamento, troco e data/hora.
- Pedido teste com produto real importado do 2R (`Combo Casal X-tudo`) foi criado na `empresa-teste`, atribuido a motoboy, iniciado e finalizado.

Credencial local criada para teste da `empresa-teste`:

- Motoboy: `21988880000`
- Senha: `motoboy123456`

Validacao:

- `npm run build` no `store-template`: OK.
- `rails routes`: OK.
- Fluxo final do pedido teste: `ready -> assigned -> out_for_delivery -> completed`, com `delivery_status=delivered`.

Observacao:

- O `AppVersionWatcher` ainda pode registrar erro esperado de Supabase no console por ser legado do modo hibrido. Isso nao bloqueia as telas Rails migradas.

## Fase 15 - Clientes, Cupons e Roleta

Status local:

- `/admin/customers` e detalhe do cliente conectados ao Rails.
- Detalhe do cliente lista dados basicos, enderecos salvos e historico de pedidos.
- Edicao basica de cliente usa `PATCH /api/v1/store/customers/:id`.
- `/admin/coupons` usa Rails para listar, criar, editar e desativar/reativar cupons.
- Checkout valida cupom manual em `POST /api/v1/public/:company_slug/coupons/validate`.
- Pedido publico continua exibindo cupom/desconto nos totais.
- Roleta usa endpoints Rails publicos e administrativos, mantendo o visual original do 2R.
- Giros sao liberados somente quando o pedido chega em `completed`.
- Regra migrada do 2R: 1 giro a cada R$ 25,00 do total do pedido.
- Dados de clientes, cupons, premios e giros ficam sempre escopados por `company_id`.

Endpoints principais:

- `GET /api/v1/store/customers`
- `GET /api/v1/store/customers/:id`
- `PATCH /api/v1/store/customers/:id`
- `GET /api/v1/store/customers/:customer_id/addresses`
- `GET /api/v1/store/coupons`
- `POST /api/v1/store/coupons`
- `PATCH /api/v1/store/coupons/:id`
- `DELETE /api/v1/store/coupons/:id`
- `POST /api/v1/public/:company_slug/coupons/validate`
- `GET /api/v1/public/:company_slug/wheel/profile`
- `GET /api/v1/public/:company_slug/wheel/prizes`
- `POST /api/v1/public/:company_slug/wheel/spin`
- `GET /api/v1/store/wheel/summary`
- `GET /api/v1/store/wheel/spins`
- `POST /api/v1/store/wheel_prizes`
- `PATCH /api/v1/store/wheel_prizes/:id`

Nao iniciado nesta fase:

- VPS/deploy.
- Webhook real Evolution.
- Pagamento online.
- App Flutter.

## Fase 15.1 - Homologacao Final Completa

Status local:

- Auditoria geral validou documentacao de Fases 1 a 15, sem iniciar deploy ou Fase 16.
- Produtos e categorias testados em `empresa-teste`, `demohamburgueria` e `demopizza`.
- Clientes, cupons, checkout, pedidos, roleta, motoboy, localizacao WhatsApp local e multiempresa validados por API local.
- `npm run build` passou no `store-template`.
- `npm run build` e `npm run lint` passaram no `replymesh-frontend`.
- `rails routes` passou com rotas de produtos, categorias, clientes, cupons, pedidos, roleta, motoboy e WhatsApp.
- `ruby -c` passou nos arquivos Rails alterados da Fase 15/15.1.

Bug corrigido durante a homologacao:

- `OrderStatusService` bloqueava `completed` quando nao havia caixa aberto (`Nenhum caixa aberto`), impedindo tambem a geracao de giros da roleta. Agora o caixa registra quando houver sessao aberta, mas a ausencia de caixa nao impede concluir pedido nem liberar giro.

Observacoes:

- WhatsApp ativo foi validado por logs locais; tentativas com numeros temporarios sem WhatsApp geraram erro esperado da Evolution, enquanto logs com numero valido ja mostram envio `ok`.
- Template inativo foi validado como ignorado com `delivery_mode=prepared_only`.
- Nenhuma instancia `Lanche`, webhook global, VPS, deploy, pagamento online, IA, marketing em massa ou Flutter foi iniciado.

Proxima fase registrada:

- FASE 16 - VPS E PRODUCAO.
- Nao iniciar sem confirmacao explicita.

## Documentacao

- `MASTER_PLAN_REPLYMESH.md`
- `DATABASE_REPLYMESH.md`
- `ROADMAP_REPLYMESH.md`

## Restricoes

O sistema Lanches do 2R e qualquer banco/Supabase externo nao devem ser alterados durante o desenvolvimento da Replymesh.

## Fase 15.4 - Refinamento visual das Configuracoes

Status local:

- Tela `/loja/:slug/admin/settings` reorganizada em accordion com uma secao aberta por vez.
- Secoes atuais: Geral, Identidade visual, Entrega, Pagamentos / PIX, Horarios, Impressao / Nota e WhatsApp basico.
- Campos tecnicos de Evolution/API key/instancia/teste de envio foram removidos da tela de Configuracoes.
- Configuracao real de WhatsApp permanece no menu Comunicacao > WhatsApp, Templates WhatsApp e Logs WhatsApp.
- Relatorios foram removidos de Configuracoes; continuam no menu Financeiro > Relatorios.
- Identidade visual ganhou bloco proprio para logo e banner/capa, com fallback `/logo.png`.
- Entrega, PIX, horarios e impressao foram compactados para reduzir altura da tela.
- `npm run build` no `store-template`: OK.

Nao iniciado:

- VPS/deploy.
- Flutter.
- IA.
- Pagamento online.
- Alteracoes no 2R original.

## Fase 15.11.1 - Pix Mercado Pago + Visual Premium

Status local:

- Checkout esconde Pix manual quando a loja usa Mercado Pago.
- Pedido Pix Mercado Pago salva `pending_payment`, `external_payment_id`, QR, copia e cola, base64 e link de ticket quando retornado.
- Corrigido `MercadoPagoPixService` para usar `total_brl/total_cents` em vez de `order.total`.
- Tela de sucesso mostra painel Mercado Pago para pedido Pix aguardando pagamento.
- Configuracoes > Identidade visual permite ajustar imagem do hero, posicao, zoom, opacidade, altura e cor primaria do template premium.
- Endpoint publico da loja retorna os campos visuais premium sem expor token Mercado Pago.

Testes:

- `rails db:migrate`: OK.
- `rails routes`: OK.
- `ruby -c` nos arquivos Rails alterados: OK.
- Mock local Mercado Pago Pix com token de desenvolvimento: OK.
- `npm run build` no `store-template`: OK.
- Verificacao visual local da Demo Hamburgueria: OK.

Relatorio detalhado:

- `REPLYMESH_PHASE_15_11_1_MP_PIX_VISUAL_FIX_AUDIT.md`

## Fase 15.11.2 - Pix Mercado Pago em Tempo Real

Status local:

- Criado `MercadoPagoPaymentProcessor` para confirmar, expirar, cancelar e rejeitar pagamentos Pix Mercado Pago em um unico fluxo.
- Endpoint de polling:
  - `GET /api/v1/public/:company_slug/payments/:order_id/status`
- Endpoint de cancelamento publico:
  - `POST /api/v1/public/:company_slug/orders/:id/cancel_payment`
- Webhook e simulacao:
  - `POST /api/v1/webhooks/mercadopago`
  - `POST /api/v1/webhooks/mercadopago/simulate`

Regras implementadas:

- Pedido Pix Mercado Pago inicia como `payment_status = pending_payment`.
- Se o Mercado Pago/mock retornar `approved`, o pedido vira `payment_status = paid` e `status = accepted`.
- Se ficar sem pagamento por mais de 3 minutos, o pedido vira `payment_status = expired` e `status = cancelled`.
- O cliente pode cancelar enquanto ainda estiver em `pending_payment`.
- Admin nao mostra botao "Aceitar" para Pix pendente.
- Cozinha/KDS nao recebe pedido Pix pendente.
- Frontend exibe QR, copia e cola, botao copiar, atualizar status, cancelar pedido, contador regressivo e estados de confirmado/expirado.

Teste local:

- Mock aprovado via `DEV-SIM-*`: OK.
- Expiracao automatica apos 3 minutos: OK.
- Cancelamento publico: OK.
- Simulacao rejeitada: OK.
- Notificacoes Rails criadas para confirmado/expirado/cancelado.
- WhatsApp `pedido_aceito` foi acionado; no teste local foi usado telefone falso e o envio real falhou com log seguro.
- `pedido_cancelado` ficou desativado e foi registrado como ignorado.
- `npm run build` no `store-template`: OK.

Relatorio detalhado:

- `REPLYMESH_PHASE_15_11_2_MP_REALTIME_PAYMENT_AUDIT.md`

## Fase 15.11.3 - Auditoria Final Mercado Pago

Status local:

- Pedidos publicos agora usam `public_token` aleatorio em vez de ID sequencial na URL.
- Nova URL de acompanhamento: `/loja/:slug/success/:public_token`.
- Endpoints publicos de pedido/status/cancelamento Pix resolvem por token publico.
- ID interno continua reservado para admin/API autenticada.
- Criado comando local para expirar Pix pendente:

```powershell
cd "W:\sas replymesh\replymesh-api"
$env:PATH = "W:\replymesh-ruby\bin;W:\replymesh-ruby\msys64\ucrt64\bin;W:\replymesh-ruby\msys64\usr\bin;$env:PATH"
rails payments:expire_pending_pix
```

- Impressao de pedido no admin corrigida para UTF-8 e moeda limpa.
- Webhook Mercado Pago rejeita payload sem `payment_id` valido.

Relatorio detalhado:

- `REPLYMESH_PHASE_15_11_3_MP_AUDIT.md`

## Fase 15.5 - Refinamento Visual do Painel + Suporte/Tickets

Status local:

- Suporte da loja agora usa tickets reais em Rails.
- Painel master `/tickets` deixou de ser placeholder e lista tickets de todas as empresas.
- Criados endpoints Rails de tickets para loja e master.
- Caixa do `store-template` foi migrado de Supabase direto para Rails.
- Estoque e movimentacoes foram migrados de Supabase direto para Rails.
- Criada rota alias `/loja/:slug/admin/cash` apontando para a tela de caixa.
- Teste local criou ticket na Demo Hamburgueria e exibiu no master.
- Teste local abriu caixa, registrou suprimento e fechou caixa.
- Teste local criou item de estoque, registrou entrada e ajuste.
- `npm run build` no `store-template`: OK.
- `npm run build` e `npm run lint` no `replymesh-frontend`: OK.
- `rails db:migrate`, `rails routes` e `ruby -c`: OK.

Relatorio detalhado:

- `REPLYMESH_PHASE_15_5_UI_SUPPORT_AUDIT.md`

Nao iniciado:

- VPS/deploy.
- Flutter.
- IA.
- Marketing em massa.
- Pagamento online.
- Alteracoes no 2R original.

## Fase 15.6 - Ajustes finais de UX, Tickets, Mesas e Refinamento Visual

Status local:

- Tickets da loja corrigidos: cliente/loja pode abrir e responder, mas nao altera status.
- Master continua responsavel por alterar status de tickets em `/tickets`.
- Backend da loja retorna 403 para tentativa de alterar status de ticket.
- Mesas/QR foram migradas para Rails no `store-template`, sem Supabase/RPC.
- Adicionados campos de QR em `dining_tables`: `qr_token`, `qr_enabled`, `qr_generated_at`, `qr_updated_at`.
- QR publico validado em `/loja/demohamburgueria/mesa/:qrToken`.
- Pedido de mesa pelo QR cria pedido Rails vinculado a `dining_table_id`.
- Produtos, Clientes e Relatorios receberam refinamentos visuais pontuais.
- Estoque, Caixa, Relatorios, Produtos, Clientes, Tickets e Mesas carregaram no navegador local.

Endpoints relevantes:

- `GET/POST/PATCH/DELETE /api/v1/store/dining_tables`
- `PATCH /api/v1/store/dining_tables/:id/set_qr_enabled`
- `POST /api/v1/store/dining_tables/:id/regenerate_qr`
- `GET/POST/PATCH /api/v1/store/table_sessions`
- `GET /api/v1/public/:company_slug/tables/qr/:qr_token`
- `POST /api/v1/public/:company_slug/tables/qr/:qr_token/session`
- `POST /api/v1/public/:company_slug/tables/qr/:qr_token/orders`
- `GET /api/v1/public/:company_slug/tables/qr/:qr_token/orders`

Testes:

- `rails db:migrate`: OK.
- `rails routes`: OK.
- `ruby -c` nos Rails alterados: OK.
- `npm run build` no `store-template`: OK.
- `npm run build` no `replymesh-frontend`: OK.
- `npm run lint` no `replymesh-frontend`: OK.

Relatorio detalhado:

- `REPLYMESH_PHASE_15_6_FINAL_UX_AUDIT.md`

Nao iniciado:

- VPS/deploy.
- Flutter.
- IA.
- Pagamento online.
- Alteracoes no 2R original.
## Fase 15.12 - Carina, Assistente Oficial da Replymesh

A Carina e a assistente de suporte da plataforma para donos, administradores e
atendentes. Ela nao atende o consumidor final, nao participa do WhatsApp da
loja e nao executa alteracoes automaticas.

Configuracao:

- Exclusiva do Painel Master em `Configuracoes > IA / Carina`.
- Provider inicial: Claude.
- Modelo local validado: `claude-haiku-4-5-20251001`.
- API key criptografada no Rails e exibida somente de forma mascarada no master.
- A loja recebe apenas nome, avatar, mensagem inicial e estado global.

Rotas:

- `GET/PATCH /api/v1/master/ai/settings`
- `POST /api/v1/master/ai/test`
- `GET /api/v1/store/ai/settings`
- `POST /api/v1/store/ai/chat`

Na loja nao existe menu nem tela de configuracao da IA. Quando ativada
globalmente, a Carina aparece como chat flutuante nas paginas protegidas do
admin e responde apenas sobre a plataforma Replymesh.

Documentacao:

- `REPLYMESH_AI_KNOWLEDGE_BASE.md`
- `REPLYMESH_PHASE_15_12_CARINA_PLATFORM_AI_AUDIT.md`
- `REPLYMESH_PHASE_15_12_AI_MASTER_FIX_AUDIT.md`

## Fase 15.13 - Carina IA Premium

A Carina passou a conversar como uma atendente de suporte experiente, usando
contexto seguro da empresa, memoria recente e recuperacao da base real da
Replymesh.

Principais melhorias:

- Cumprimentos naturais com nome do responsavel quando o usuario e um admin
  generico.
- Contexto com empresa, plano, dominio, modulos, WhatsApp, Mercado Pago, Pix,
  produtos, pedidos, caixa e tickets.
- Memoria das ultimas cinco interacoes, equivalente a dez mensagens.
- Busca por topicos, intencoes e sinonimos antes de chamar o Claude.
- Respostas com caminhos reais de menu e sugestoes de proximos passos.
- Fallback local baseado na resposta ideal do modulo mais relevante.
- Logs com tokens usados e tempo de resposta.
- Base canonica com 34 secoes em:
  `replymesh-api/docs/REPLYMESH_AI_KNOWLEDGE_BASE.md`.

Validacoes conversacionais:

- Boa noite.
- Como criar produto?
- Como adiciono imagem?
- Como configurar Mercado Pago?
- Como criar cupom?
- Como conectar WhatsApp?
- Como cadastrar motoboy?

A Carina continua sem executar alteracoes automaticas e sem responder assuntos
fora da plataforma.
# Fase 15.14 - Central de atualizacoes e notificacoes

- O master gerencia publicacoes em `/configuracoes/atualizacoes`.
- A loja consulta atualizacoes reais em `/loja/:slug/admin/updates`.
- Publicacoes podem atingir todas as empresas, um plano ou uma empresa especifica.
- Leituras sao registradas por usuario e empresa.
- Os sinos do master e da loja exibem notificacoes reais, sem contadores fixos.
- O painel master possui tema claro/escuro persistido no navegador.
- Seeds locais incluem as entregas das Fases 15.5 a 15.13.

## Fase 15.15 - Equipe e administracao do Painel Master

O Painel Master possui gestao real da equipe interna, separada dos usuarios das
lojas por `master_role_id`.

Telas:

- `/usuarios-master`: usuarios internos, status, cargo e redefinicao de senha.
- `/usuarios-master/funcoes`: seis cargos iniciais e permissoes granulares.
- `/usuarios-master/convites`: convite local com token, expiracao e cancelamento.
- `/perfil`: dados pessoais, avatar e alteracao segura de senha.
- `/configuracoes/aparencia`: nome, logos, favicon, cores e contatos do master.

O super admin possui acesso total. Usuarios internos comuns dependem das
permissoes do cargo. Acoes sensiveis geram `ActivityLog`.

Tambem foram refinados:

- sidebar recolhida com tooltip, logo compacta e avatar real;
- menu completo de acoes na tabela de empresas;
- sino master com contador e links reais;
- bloqueio adicional de assuntos externos na Carina.

Auditoria: `REPLYMESH_PHASE_15_15_MASTER_USERS_PERMISSIONS_AUDIT.md`.

### Acoes administrativas das empresas

No Painel Master, o menu de cada empresa permite:

- visualizar a ficha administrativa em `/empresas/:id`;
- editar os dados em `/empresas/:id/editar`;
- entrar temporariamente no painel da loja.

O acesso temporario exige a permissao `impersonate_company`, dura 30 minutos,
fica vinculado a uma unica empresa e gera registro de auditoria. O painel da
loja exibe um aviso visivel e um botao para voltar ao Painel Master.

## Fase 15.16 - Impersonacao segura e auditoria master

O acesso de suporte agora usa uma sessao propria e revogavel:

- `POST /api/v1/master/companies/:id/impersonate`;
- `DELETE /api/v1/master/impersonation/:token`;
- validade de 30 minutos;
- token de revogacao armazenado apenas como hash;
- sessao vinculada ao usuario master e a uma unica empresa;
- login normal da loja preservado no navegador;
- banner com usuario master, empresa e botao para encerrar o acesso.

A auditoria profissional fica em `/logs/auditoria` e registra usuario, empresa,
acao, modulo, IP, navegador, detalhes filtrados e status. As permissoes
`impersonate_company`, `view_audit_logs` e `manage_audit_logs` podem ser
administradas em `/usuarios-master/funcoes`.

Auditoria: `REPLYMESH_PHASE_15_16_IMPERSONATION_AUDIT_LOGS.md`.

## Fase 15.17 - Dashboard Master Executivo

O dashboard principal do Painel Master agora usa dados reais do Rails em
`/dashboard`, consumidos pelo endpoint `GET /api/v1/master/dashboard`.

Concluido:

- cards executivos com MRR estimado, empresas ativas, pedidos hoje, receita
  processada, tickets abertos, WhatsApps conectados e uso da Carina;
- filtros por hoje, 7 dias, 30 dias, mes atual e mes anterior;
- graficos de receita, pedidos, empresas criadas, tickets, Carina e WhatsApp;
- alertas operacionais com acoes rapidas para empresa, tickets, WhatsApp e
  acesso de suporte;
- empresas recentes com plano, status, pedidos, receita, WhatsApp e entrada
  como empresa;
- atividades recentes baseadas em `MasterAuditLog`;
- permissao restrita a super admin, retornando HTTP 403 para usuario sem
  acesso.

Validado localmente:

- `rails db:migrate`;
- `rails routes`;
- `ruby -c` nos arquivos Rails alterados;
- chamada real da API com dados do banco;
- teste de permissao 403;
- `npm run lint` e `npm run build` no `replymesh-frontend`;
- `npm run build` no `store-template`;
- teste visual em `http://127.0.0.1:5173/dashboard`.

Auditoria: `REPLYMESH_PHASE_15_17_MASTER_DASHBOARD_AUDIT.md`.

## Fases 15.18 e 15.19 - RAG unificado

A Replymesh possui agora uma arquitetura local de recuperacao de conhecimento
compartilhada entre dois assistentes, mantendo suas responsabilidades
separadas:

- Carina: suporte interno sobre a plataforma Replymesh.
- IA da loja: respostas baseadas exclusivamente nos dados da empresa atual.

### Carina

O `ReplymeshRagService` indexa
`replymesh-api/docs/REPLYMESH_AI_KNOWLEDGE_BASE.md`, divide o documento em
chunks, classifica os modulos e envia ao provider apenas os trechos mais
relevantes.

No teste local com a pergunta sobre Mercado Pago:

- base completa: 37.434 caracteres;
- contexto selecionado: 5.087 caracteres;
- reducao estimada: 86,4%.

### IA da loja

Servicos:

- `StoreKnowledgeService`
- `StoreRagService`
- `StoreAiService`

Fontes locais:

- produtos e categorias ativos;
- cupons e promocoes vigentes;
- horarios;
- configuracoes e status da loja;
- ultimo pedido do telefone informado.

Configuracao e simulacao:

`/loja/:slug/admin/settings`, secao `Inteligencia Artificial`.

O simulador nao chama Evolution e nao envia WhatsApp. A IA da loja permanece
desativada por padrao e exige `company_id` resolvido pela sessao autenticada.

Endpoints:

- `GET /api/v1/store/store_ai/settings`
- `PATCH /api/v1/store/store_ai/settings`
- `POST /api/v1/store/store_ai/simulate`
- `GET /api/v1/master/ai/usage`
- `POST /api/v1/webhooks/evolution/messages`

### Polimento e Evolution

A loja configura apenas a IA, suas permissoes e a opcao de resposta
automatica. Tokens, custos e metricas tecnicas aparecem somente no Painel
Master em `/configuracoes/ia`.

As respostas ao consumidor:

- nao exibem IDs, SKUs ou nomes tecnicos;
- usam nome, descricao, preco e categoria;
- sao curtas e formatadas para WhatsApp;
- consultam cliente e pedido recente pelo telefone;
- recusam assuntos externos ao atendimento da loja.

O webhook Evolution identifica a empresa pela instancia vinculada e ignora
mensagens proprias, grupos e eventos de localizacao. A resposta automatica
fica desligada por padrao. O pipeline foi validado localmente em modo mock;
nenhum envio real foi realizado e nenhuma credencial e retornada ao frontend.

Auditorias:

- `REPLYMESH_PHASE_15_18_CARINA_RAG.md`
- `REPLYMESH_PHASE_15_19_STORE_AI_RAG.md`
- `REPLYMESH_PHASE_15_19_1_STORE_AI_POLISH.md`
- `REPLYMESH_PHASE_15_20_MARKETING_RECUPERADOR_ANDROID.md`

## Fase 15.20 - Comunicacao comercial e Android

Endpoints da loja:

- `GET /api/v1/store/marketing/customers`
- `GET /api/v1/store/marketing/campaigns`
- `POST /api/v1/store/marketing/campaigns`
- `POST /api/v1/store/marketing/send_individual`
- `POST /api/v1/store/marketing/campaigns/:id/send`
- `GET /api/v1/store/sales_recovery/customers`
- `GET /api/v1/store/android_app`
- `POST /api/v1/store/android_app`

Endpoints master:

- `GET /api/v1/master/android_apps`
- `GET /api/v1/master/android_apps/:id`
- `PATCH /api/v1/master/android_apps/:id`
- `PATCH /api/v1/master/android_apps/:id/status`

Campanhas sao criadas em rascunho e exigem confirmacao separada para envio.
Todos os clientes, logs, campanhas e solicitacoes sao isolados por empresa.

`Aplicativo Android` fica no grupo Comunicacao. A pagina concentra solicitacao,
banners e mensagens. Até existir push nativo, as mensagens usam o WhatsApp da
empresa via Evolution Go. O backend sempre seleciona a instancia conectada.

O hero publico nao exibe mais a imagem padrao antes da imagem configurada.

## Fase 15.21 - Subdominios Replymesh

O endereco padrao de novas lojas agora usa `replymesh.cloud`. O onboarding
normaliza o nome informado, remove acentos e espacos, gera o slug e evita
duplicidades com sufixos numericos.

Exemplo:

- empresa: `Demo Hamburgueria`
- slug: `demohamburgueria`
- endereco: `demohamburgueria.replymesh.cloud`

O acesso local por `/loja/:slug` continua funcionando. O store-template tambem
esta preparado para identificar o slug pelo hostname `slug.replymesh.cloud`.
Em producao ainda sera necessario configurar DNS wildcard e Nginx.

### Motoboys e Recuperador

O painel de motoboys usa Rails para cadastro, entregas, relatorio, ranking,
diarias, vales, bonus e descontos. O Recuperador de Vendas tambem consulta
clientes Rails e pode ficar vazio quando todos os clientes compraram dentro do
periodo selecionado.

## Fechamento local da Fase 15.20

O `store-template` usa Rails nas rotas ativas de autenticacao, checkout,
pedidos, configuracoes, templates, zonas de entrega, marketing, recuperacao
de vendas e relatorios. A aplicacao pode ser executada sem variaveis Supabase.

Novo endpoint de relatorios:

- `GET /api/v1/store/reports?date_from=...&date_to=...`

O Recuperador de Vendas oferece filtros de 7, 15, 30, 60 e 90 dias, selecao
de clientes, mensagens individuais e campanhas em rascunho. Campanhas nunca
sao disparadas sem confirmacao.

O que continua reservado para a VPS: DNS/SSL wildcard, Nginx, webhooks
publicos, scheduler permanente de Pix, observabilidade e homologacao externa.

## Replymesh Local Stable v0.15.21

A versao local foi congelada em 06/06/2026 depois de uma bateria minima de
regressao:

- 22 testes Rails, 0 falhas;
- migrations, rotas e sintaxe Ruby validadas;
- builds do store-template e Painel Master aprovados;
- lint do Painel Master aprovado;
- rotas locais principais respondendo;
- nenhum segredo hardcoded encontrado nas areas publicaveis.

Para repetir a validacao:

```powershell
W:\sas replymesh\scripts\smoke_all.ps1
```

Documentos:

- `REPLYMESH_PHASE_15_21_LOCAL_STABLE_TESTS.md`
- `REPLYMESH_LOCAL_STABLE_RELEASE.md`

A Fase 16 continua sem execucao neste fechamento. DNS, SSL, Nginx, banco de
producao, jobs, backups, webhooks, secrets e rollback pertencem exclusivamente
a etapa de infraestrutura.

## Fase 15.22 - UX e performance final

Os dois frontends passaram a carregar paginas sob demanda:

- store-template: chunk principal reduzido de aproximadamente 631 kB para 73 kB;
- Painel Master: bundle principal reduzido de aproximadamente 984 kB para 53 kB.

O importador de icones do Master tambem foi limitado aos icones utilizados.
Depois da alteracao, nenhum build possui chunk acima de 500 kB.

Foram refinados carregamento de paginas, toolbars, tabelas, truncamento,
estados vazios, espacamentos e responsividade, preservando o design aprovado.
As telas prioritarias foram abertas no navegador local sem erros de console.

Auditoria completa:

- `REPLYMESH_PHASE_15_22_UX_PERFORMANCE_FINAL.md`

## Fase 15.23 - Subdominios e dominios oficiais

A preparacao local de dominios foi reforcada para a infraestrutura oficial:

- Landing: `replymesh.cloud`
- Painel Master: `app.replymesh.cloud`
- API Rails: `api.replymesh.cloud`
- Lojas: `*.replymesh.cloud`

Ao criar empresa, o sistema gera automaticamente `slug.replymesh.cloud`,
remove acentos/espacos/caracteres especiais, trata duplicidade com sufixo
numerico e bloqueia slugs reservados como `admin`, `api`, `app`, `www`,
`mail`, `ftp`, `root` e `support`.

Dominio proprio permanece preparado localmente com status, mas DNS wildcard,
SSL e roteamento real ficam para a Fase 16/VPS.

Auditoria completa:

- `REPLYMESH_PHASE_15_23_DOMAINS_DEPLOY_READINESS.md`

## Fase DEV - Automacao Inteligente de Vendas

O antigo Recuperador de Vendas manual foi preservado e a tela da loja passou a
ter a base da Automacao Inteligente para recuperacao segura de carrinhos:

- configuracao por empresa, com janela de envio, dias permitidos e limite diario;
- deteccao de carrinhos da IA com produtos e sem finalizacao;
- fila gradual via ActiveJob padrao do Rails, sem Redis ou Sidekiq;
- cupons unicos por cliente/carrinho, com validade configuravel;
- mensagens por IA quando o provider da loja estiver configurado, com fallback
  para templates humanos variados;
- envio reaproveitando o `MarketingMessageService` e Evolution existentes;
- logs por empresa com status, cupom, mensagem, erro e conversao;
- dashboard da pagina com valor recuperado, mensagens, taxa e produtos.

Relatorio:

- `REPLYMESH_DEV_AUTOMATION_ENGINE_PHASE1_REPORT.md`

## Fase DEV - Recovery Intelligence 1.6

O Sales Recovery evoluiu para um motor de decisao comercial, mantendo Rails,
ActiveJob, PostgreSQL, Evolution, IA existente e `Rails.cache`, sem nova
infraestrutura.

Principais pontos:

- Customer Value Score por cliente, com segmento `novo`, `ativo`, `recorrente`
  ou `VIP`;
- Recovery Score do carrinho considerando valor, itens, abandono, horario,
  perfil do cliente e reputacao recente;
- decisao automatica de beneficio: lembrar sem desconto, cupom percentual ou
  frete gratis;
- reputacao anti-spam por cliente para pausar recuperacao quando houver muitas
  mensagens ignoradas;
- metricas e ranking `Quase comprando` na tela da loja;
- insights automaticos de conversao por beneficio, IA/template, horario e dia;
- logs enriquecidos sem adicionar telefone, tokens, Pix, cartao, prompts ou
  respostas de IA aos novos campos.

Relatorio:

- `REPLYMESH_DEV_RECOVERY_INTELLIGENCE_PHASE_1_6_REPORT.md`

## Fase DEV - Recovery Intelligence 1.7

A fase 1.7 tornou o Recovery mais seletivo e explicavel, sem criar novo fluxo e
sem alterar Evolution, IA de atendimento, VPS ou producao.

Principais pontos:

- Recovery Score V2 com pesos configuraveis via JSON de configuracao;
- classificacao automatica `Muito Alta`, `Alta`, `Media`, `Baixa` e
  `Muito Baixa`;
- somente scores `Alta` e `Muito Alta` podem gerar envio automatico;
- motivos do score salvos no log para o lojista entender a decisao;
- fila priorizada por score, valor, tempo parado e cliente recorrente;
- simulador de Recovery sem envio real;
- novos indicadores: carrinhos elegiveis, bloqueados, potencial recuperavel,
  motivo, categoria e horario de abandono.

Relatorio:

- `REPLYMESH_DEV_RECOVERY_PHASE_1_7_REPORT.md`

## Fase DEV - Recovery Learning Engine 1.8

A fase 1.8 adicionou aprendizado estatistico ao Recovery, usando somente
PostgreSQL, ActiveRecord e `Rails.cache`.

Principais pontos:

- registro automatico de recovery enviado, ignorado, respondido sem compra e
  convertido;
- deteccao de pedido recuperado com cupom e sem cupom;
- calculo de tempo ate responder e tempo ate comprar;
- comparacao de estrategias por template, IA, cupom, frete gratis, horario,
  dia e categoria;
- endpoint `GET /api/v1/store/recovery/insights`;
- card `Recovery Insights` na tela `Marketing > Automacao Inteligente`;
- sem armazenar mensagens completas, prompts, tokens, Pix, cartao ou
  credenciais.

Relatorio:

- `REPLYMESH_DEV_RECOVERY_LEARNING_PHASE18.md`
# Replymesh — Business Intelligence

Phase 2.2 adiciona a base do Business Intelligence da loja.

O módulo observa pedidos, produtos, categorias, recovery, cupons, delivery, clientes e performance para gerar score, alertas, oportunidades e recomendações. Ele é somente leitura: não cria pedidos, não envia mensagens, não cria cupons e não altera dados operacionais.
## Replymesh Strategy — Phase 2.4

A Phase 2.4 adiciona a camada `ReplymeshStrategyService`, que consolida
Consultor de Vendas, Analise do Negocio, Recovery Intelligence e Cerebro
Replymesh em prioridades simples para o dono da loja.

Principais pontos:

- endpoint `GET /api/v1/store/strategy`;
- card compacto `Estrategia da Loja` no dashboard da loja;
- tela `Admin > Estrategia`;
- indicadores internos `Strategic Score`, `Operational Health`,
  `Sales Opportunity` e `Risk Level`;
- agrupamento de recomendacoes semelhantes para evitar repeticao;
- cache `replymesh_strategy` com TTL de 5 minutos;
- nenhuma acao automatica, envio, cupom ou alteracao operacional.

## Replymesh Marketing Intelligence — Phase 2.7

A Phase 2.7 adiciona o `MarketingIntelligenceService`, uma camada somente
leitura que reutiliza Cérebro ReplyMesh, Estratégia, Consultor de Vendas,
Análise do Negócio, Inteligência de Clientes, Inteligência de Produtos e
Recovery Learning para recomendar oportunidades comerciais.

Principais pontos:

- endpoint `GET /api/v1/store/marketing_intelligence`;
- card compacto `Marketing Inteligente` no dashboard da loja;
- tela `Admin > Inteligência de Marketing` dentro do grupo Cérebro da ReplyMesh;
- cache `marketing_intelligence` com TTL de 5 minutos;
- recomendações de melhor campanha, produto, categoria, horário, dia, público
  prioritário, potencial e confiança;
- nenhuma campanha, cupom, WhatsApp ou alteração operacional é executada
  automaticamente.
