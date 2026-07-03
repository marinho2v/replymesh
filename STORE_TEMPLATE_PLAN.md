# STORE_TEMPLATE_PLAN - Replymesh

## Objetivo

`store-template` e a copia isolada do frontend Lanches do 2R usada para converter, aos poucos, as chamadas Supabase para APIs Rails da Replymesh.

O projeto original `M:\temple1` nao deve ser alterado.

## Pasta

```text
W:\sas replymesh\store-template
```

## Modo hibrido

- Services Supabase antigos permanecem em `src/services`.
- Novos services Rails ficam em paralelo:
  - `src/services/replymeshApi.js`
  - `src/services/publicApi.js`
  - `src/services/storeApi.js`
- Hooks publicos Rails:
  - `src/hooks/usePublicMenu.js`
  - `src/hooks/usePublicStoreInfo.js`
- Supabase Auth continua preservado, com fallback local Rails para desenvolvimento da migracao.

## Reorganizacao do Menu Admin - Cerebro da ReplyMesh

Executado no `store-template`:

- Menu lateral reorganizado apenas visualmente, sem alterar rotas, URLs, permissoes, componentes internos ou APIs.
- `Dashboard` ficou isolado como grupo proprio.
- `Operacao`, `Cardapio`, `Entrega`, `Clientes`, `Estoque`, `Financeiro`, `Comunicacao`, `Administracao` e `Ajuda` foram separados por responsabilidade.
- `Comunicacao` permanece responsavel por canais e automacoes com clientes.
- Novo grupo visual `Cerebro da ReplyMesh` concentra todas as inteligencias atuais: Visao Estrategica, Consultor de Vendas, Analise do Negocio, Inteligencia de Clientes, Inteligencia de Produtos e Inteligencia Artificial.
- A estrutura ficou preparada para receber futuras inteligencias sem poluir o menu operacional.

## Phase 2.6 - Product Intelligence

Executado no `store-template`:

- Criada tela `Marketing > Inteligencia de Produtos`.
- A tela consome `GET /api/v1/store/product_intelligence`.
- Exibe produto campeao, produto em crescimento, produto esquecido, produto com maior potencial, score, tendencia, melhor horario, melhor dia e produtos vendidos juntos.
- Dashboard recebeu card compacto `Produtos Inteligentes`.
- Menu e permissoes foram atualizados sem criar automacoes, alterar precos, modificar pedidos ou criar campanhas.
- A tela usa o mesmo padrao visual do dashboard, sem visual futurista ou modulo separado de IA.

## Phase 2.5 - Customer Intelligence

Executado no `store-template`:

- Criada tela `Marketing > Inteligencia de Clientes`.
- A tela consome `GET /api/v1/store/customer_intelligence`.
- Exibe resumo, perfis, score, risco, potencial, produtos favoritos, categorias favoritas e insights.
- Dashboard recebeu card compacto `Clientes Inteligentes`.
- Menu e permissoes foram atualizados sem criar automacoes, campanhas ou disparos de WhatsApp.
- A tela usa o mesmo padrao visual do dashboard, sem visual futurista ou modulo separado de IA.

## Phase 2.3 - Cerebro Replymesh e padronizacao visual

Executado no `store-template`:

- Menu e permissoes passaram a exibir `Consultor de Vendas` no lugar de nomes tecnicos de IA.
- Tela do Consultor de Vendas foi simplificada para seguir os mesmos cards e espacos do dashboard.
- Tela de Analise do Negocio recebeu bloco resumido do Cerebro Replymesh.
- Dashboard da loja passou a apresentar o consultor e a analise como recursos nativos do sistema, sem visual de landing page ou modulo separado.
- Nenhuma automacao nova foi criada; as telas apenas observam, analisam e recomendam.

## Phase 2.1 - AI Sales Coach com aprendizado

Executado no `store-template`:

- A tela `Marketing > AI Sales Coach` passou a consumir o payload enriquecido do backend.
- Adicionado bloco "Coach Inteligente" com oportunidades, proxima melhor acao e Coach Score.
- Adicionado historico de aprendizado com recomendacoes aceitas, ignoradas e marcadas como funcionaram.
- Cada insight agora permite feedback manual do lojista: visualizado, aceitei, ignorei, funcionou, nao funcionou, executei manualmente e arquivar.
- O frontend chama apenas `GET /api/v1/store/sales_coach` e `PATCH /api/v1/store/sales_coach/insights/:id`.
- Nenhuma automacao e disparada pela tela; o coach apenas recomenda e aprende com o feedback.

## Fase 15.9.2 - Hamburgueria Premium React funcional

Objetivo: converter o prototipo `hamburgueria V2` em template React/Vite real, sem alterar regras operacionais.

Executado:

- A pasta original `M:\store-template\src\templates\hamburgueria V2\` foi usada apenas como referencia e nao foi modificada.
- Criada a pasta funcional `store-template/src/templates/hamburgueria-premium/`.
- Componentes React criados:
  - `components/PremiumHeader.jsx`
  - `components/PremiumHome.jsx`
  - `components/PremiumHero.jsx`
  - `components/PremiumMenuSection.jsx`
  - `components/PremiumProductCard.jsx`
  - `components/PremiumFooter.jsx`
  - `icons.jsx`
  - `styles.css`
- O template `hamburgueria-premium` foi marcado como `active` em `metadata.json`.
- `PublicLayout` passou a trocar para header premium quando `store.visual_template_id = hamburgueria-premium`.
- As rotas `/loja/:slug`, `/loja/:slug/menu` e `/loja/:slug/products/:id` respeitam o template premium.
- O premium usa dados Rails reais de loja, banners/capa, status, WhatsApp, categorias, produtos, imagens e precos.
- O carrinho atual continua sendo usado para adicionar, incrementar e remover produtos.
- O fluxo operacional foi preservado: checkout, pedidos, WhatsApp, motoboy, cupons, roleta, mesas e suporte nao foram alterados.

Teste:

- `npm run build` no `store-template`: OK.
- Browser local: Premium salvo temporariamente na Demo Hamburgueria, home/menu premium carregaram produtos Rails, carrinho adicionou produto, e Classic foi restaurado.

Pendente opcional:

- Criar screenshot `preview.png` real do template premium depois da validacao visual no navegador.

## Fase 12.5 - Restauracao visual do template 2R

Objetivo: manter a UX/UI do 2R original enquanto a origem dos dados passa gradualmente para Rails.

Auditoria realizada:

- Home: o `store-template` tinha recebido cards extras de endereco, entrega, WhatsApp e uma grade adicional de banners que nao existiam na home original.
- Cardapio: os cards de produto tinham ganhado botao `Detalhes`, alterando a composicao original de um unico botao `Adicionar`.
- Produto: a tela tinha recebido bloco de opcionais visiveis, categoria destacada e botao de compra diferente do original.
- Carrinho: o resumo original com cupom e `Finalizar Pedido` tinha sido substituido por aviso antigo de fase ainda nao conectada.
- Header/footer: estrutura original preservada; diferenca mantida apenas para nome/logo vindos do Rails.

Restaurado:

- Home voltou ao desenho original: hero, logo, titulo, status, CTAs e `MenuSection`, sem cards informativos extras.
- Categorias horizontais com scroll preservadas.
- Grid completo de produtos preservado.
- Cards voltaram ao layout original: imagem, titulo, badges, descricao, preco e botao unico `Adicionar`.
- Produto voltou ao layout original: imagem, titulo, badges, descricao, preco, quantidade e `Adicionar ao Carrinho`.
- Modal de opcionais foi mantido para dados Rails, sem ocupar a tela principal de produto.
- Carrinho voltou ao layout original com cupom, subtotal, desconto, total e `Finalizar Pedido`.
- Checkout Rails, Orders Rails e APIs Rails nao foram alterados.

Diferencas restantes:

- Nome/logo/status podem vir do Rails, por multi-tenant, em vez de ficarem fixos como `Lanche do 2R`.
- O 2R original local redirecionou para `/login` nesta maquina, entao a comparacao visual por browser foi feita principalmente contra o codigo original em `M:\temple1`.
- O botao `Adicionar` abre modal quando o produto Rails possui opcionais; isso preserva a operacao correta com adicionais sem mudar o card.

## Fase 12.6 - Ajustes de fluxo

Escopo executado:

- Menu lateral do admin reorganizado por grupos de delivery: Dashboard, Operacao, Cardapio, Entrega, Clientes & Promocoes, Estoque, Financeiro, Comunicacao, Administracao, Suporte e Sair.
- Checkout passa a iniciar pelo campo WhatsApp.
- Botao `Buscar` no checkout consulta Rails em `GET /api/v1/public/:company_slug/customers/lookup?phone=...`.
- Lookup retorna apenas dados necessarios ao checkout: nome, telefone/WhatsApp e enderecos salvos.
- Quando o cliente existe, o checkout preenche nome e ultimo endereco seguro.
- Quando o cliente nao existe, o fluxo segue com preenchimento normal.
- Pagamento em dinheiro mostra `Precisa de troco?`.
- Pedido publico envia `needs_change` e `change_for_cents` para Rails.
- Admin pedidos, cozinha e acompanhamento publico mostram o troco quando aplicavel.
- Carrinho confirmado com `Finalizar Pedido` apontando para `/checkout`, sem aviso antigo de fase nao conectada.

Fluxo WhatsApp preparado:

- Templates de status existem por empresa e possuem `enabled`.
- Defaults seguros:
  - habilitados: `pedido_aceito`, `saiu_para_entrega`, `pedido_finalizado`
  - desabilitados: `pedido_recebido`, `pedido_em_preparo`, `pedido_pronto`, `pedido_cancelado`
- Mapeamento: `accepted -> pedido_aceito`, `preparing -> pedido_em_preparo`, `ready -> pedido_pronto`, `out_for_delivery -> saiu_para_entrega`, `completed -> pedido_finalizado`, `cancelled -> pedido_cancelado`.
- Nesta etapa, a mudanca de status apenas registra preparacao/ignorado em `whatsapp_logs` com `delivery_mode=prepared_only`; nenhum envio real automatico foi ativado.

## Fase 13.1.2 - Status, WhatsApp e Location Webhook

Correcoes aplicadas em modo local controlado:

- Admin de pedidos, detalhe do pedido e cozinha passam a carregar templates WhatsApp da empresa pelo Rails.
- Botoes de status obedecem os templates ativos.
- Se `pedido_em_preparo` estiver desativado, o botao `Marcar preparo` nao aparece.
- Se `pedido_pronto` estiver desativado, o botao `Marcar pronto` nao aparece.
- Com a configuracao padrao da Demo Hamburgueria, o fluxo fica:
  - `pending -> accepted`
  - `accepted -> out_for_delivery`
  - `out_for_delivery -> completed`
- Para pedidos delivery, `Saiu para entrega` nao aparece antes de haver motoboy atribuido.
- Envio automatico real de WhatsApp foi validado somente para `demohamburgueria` em ambiente local de desenvolvimento.
- Templates ativos padrao da Demo:
  - `pedido_aceito`
  - `saiu_para_entrega`
  - `pedido_finalizado`
- Templates desativados continuam sem botao e sem envio automatico:
  - `pedido_em_preparo`
  - `pedido_pronto`
  - `pedido_cancelado`
  - `pedido_recebido`
- `AppVersionWatcher` deixou de consultar service Supabase legado e agora usa store info publica via Rails.
- O fluxo antigo de localizacao do 2R foi documentado em `FLUXO_LOCALIZACAO_EVOLUTION.md`.
- Nao foi criado webhook Rails de localizacao. Nao houve localizacao em tempo real, mapa embutido, Waze/Google Maps real novo ou deploy.

Validacao local:

- Pedido real de teste concluido na Demo: pedido `#6`, id `20`, produto `Combo Casal X-tudo`, telefone final `9803`, total R$ 62,00.
- Logs WhatsApp OK para `pedido_aceito`, `saiu_para_entrega` e `pedido_finalizado`.
- Pedido manual pendente para teste no painel: pedido `#7`, id `21`, cliente `marinho`, telefone `21 95909-9803`.

## Fase 14.0 - Webhook de Localizacao Evolution

Escopo executado em modo local:

- Criado endpoint Rails `POST /api/v1/webhooks/evolution/location`.
- Criado parser seguro `EvolutionLocationPayloadParser`.
- Criada migration para campos de localizacao em `orders`.
- Webhook valida `apikey` e aceita somente instancia Evolution vinculada a uma empresa.
- Em ambiente local, o webhook fica restrito a Demo Hamburgueria.
- Payload sem localizacao e mensagem propria/grupo sao ignorados.
- Quando localizacao valida chega, o Rails procura o pedido delivery aberto mais recente do telefone na mesma company.
- O pedido recebe:
  - `delivery_latitude`
  - `delivery_longitude`
  - `google_maps_url`
  - `waze_url`
  - `delivery_location_source=whatsapp`
  - `delivery_location_received_at`
- API do motoboy passa a retornar os links `google_maps_url` e `waze_url`.
- O portal Motoboy ja usa esses links quando existem e cai para endereco textual quando nao existem.

Validacao local:

- Pedido Demo criado para teste de localizacao: `#8`, id `23`, telefone final `9803`.
- Payload simulado da Evolution salvou coordenadas `-22.9351234,-42.8165678`.
- API do motoboy retornou Maps/Waze para o pedido `#8`.
- Sem `apikey` retornou 401.
- Payload sem localizacao retornou `ignored=true`.
- `npm run build` passou.

Nao executado nesta fase:

- Nao houve deploy.
- Nao houve troca do webhook real da Evolution.
- Nao houve alteracao na instancia Lanche.
- Nao houve mapa em tempo real ou rastreamento continuo.

## Fase 14.1 - Portal Motoboy apos localizacao WhatsApp

Escopo executado:

- O portal do motoboy nao exige mais clicar `Iniciar entrega`.
- O pedido aparece no portal assim que o admin atribui o motoboy.
- O frontend manteve apenas:
  - Maps
  - Waze
  - Cliente
  - Finalizar entrega
- O endpoint `start` continua no backend, reservado para fase futura.
- `Finalizar entrega` funciona com `delivery_status=assigned` ou `delivery_status=on_the_way`.
- Ao finalizar:
  - `delivery_status` vira `delivered`;
  - `order.status` vira `completed`;
  - historico da entrega recebe `delivered_at`;
  - WhatsApp `pedido_finalizado` dispara se o template estiver ativo.
- Quando o pedido tem localizacao WhatsApp, o card de endereco exibe um box verde:
  - titulo `Localização recebida pelo WhatsApp`;
  - texto `Maps e Waze vão abrir no pin enviado pelo cliente.`;
  - data/hora de recebimento.
- Maps usa `google_maps_url` quando existe.
- Waze usa `waze_url` quando existe.
- Sem links de localizacao, ambos mantem fallback por endereco textual.

Validacao local:

- Pedido Demo `#8`, id `23`, com pin salvo via webhook, foi finalizado sem chamar `start`.
- Pedido saiu de `GET /api/v1/motoboy/orders`.
- Pedido apareceu em `GET /api/v1/motoboy/history`.
- Historico retornou os campos de localizacao.
- Log WhatsApp `pedido_finalizado` foi gerado.
- `npm run build` passou.

## Variaveis locais

```env
VITE_REPLYMESH_API_URL=http://127.0.0.1:3000/api/v1
VITE_COMPANY_SLUG=empresa-teste
VITE_REPLYMESH_COMPANY_ID=4
```

## Escopo inicial da Fase 12

- Home publica: leitura de store info via Rails.
- Menu/cardapio publico: leitura de categorias e produtos via Rails.
- Banners publicos: leitura via Rails.
- Status aberto/fechado: calculado no frontend a partir de horarios Rails.
- Horarios de funcionamento: leitura via Rails.
- Zonas/taxa de entrega publicas: leitura via Rails.
- Nome, logo, WhatsApp e endereco da loja: leitura via Rails.
- Detalhes de produto: leitura via Rails em `/api/v1/public/:company_slug/products/:id`.
- Opcionais/adicionais: leitura via Rails a partir do menu/produto.
- Carrinho: operacao local com subtotal, quantidade e remocao.
- Checkout publico: cria pedido de teste via Rails em `POST /api/v1/public/:company_slug/orders`.
- Sucesso/acompanhamento do pedido: consulta Rails em `GET /api/v1/public/:company_slug/orders/:id`.
- Acompanhamento publico disponivel em `/success/:id` e `/pedido/:id`.
- Linha do tempo publica exibe `pending`, `accepted`, `preparing`, `ready`, `out_for_delivery` e `completed`.
- Acompanhamento publico usa botao de atualizacao manual e polling simples a cada 10 segundos.
- Backend recalcula subtotal, opcionais/adicionais, taxa de entrega e total final.
- Painel/admin de pedidos: leitura via Rails em `GET /api/v1/store/orders`.
- Cozinha/KDS: leitura via Rails em `GET /api/v1/store/kitchen/orders`.
- Status do pedido: atualizacao via Rails em `PATCH /api/v1/store/orders/:id/status`.
- Atualizacao de status usa `skip_side_effects=true` nesta etapa para nao deduzir estoque e nao registrar caixa.
- Cozinha usa polling simples a cada 4 segundos; Supabase Realtime nao e usado nessa tela migrada.
- Estado vazio quando nao houver produtos.
- WhatsApp automatico, motoboy, caixa e pagamento online permanecem fora desta etapa.

## Como rodar

Backend Rails:

```powershell
cd "W:\sas replymesh\replymesh-api"
$env:PATH = "W:\replymesh-ruby\bin;W:\replymesh-ruby\msys64\ucrt64\bin;W:\replymesh-ruby\msys64\usr\bin;$env:PATH"
bundle check
rails s -b 127.0.0.1 -p 3000
```

Template da loja:

```powershell
cd "W:\sas replymesh\store-template"
npm install
npm run dev -- --host 127.0.0.1 --port 5174
```

Abrir:

```text
http://127.0.0.1:5174/menu
```

## Validacao local realizada

- Rails subiu em `127.0.0.1:3000` usando `W:\replymesh-ruby`.
- `GET /api/v1/public/empresa-teste/store` retornou 200.
- `GET /api/v1/public/empresa-teste/menu` retornou 200.
- `GET /api/v1/public/empresa-teste/banners` retornou 200.
- `GET /api/v1/public/empresa-teste/business_hours` retornou 200.
- `GET /api/v1/public/empresa-teste/delivery_zones` retornou 200.
- `GET /api/v1/public/empresa-teste/products/2` retornou 200.
- `POST /api/v1/public/empresa-teste/orders` criou pedido publico de teste.
- `GET /api/v1/public/empresa-teste/orders/2` retornou o pedido criado.
- `POST /api/v1/auth/login` retornou JWT Rails local.
- `GET /api/v1/store/orders` retornou pedido da `empresa-teste` com itens, adicional, endereco e total.
- `PATCH /api/v1/store/orders/2/status` validou `pending -> accepted -> preparing -> ready` com `skip_side_effects=true`.
- `GET /api/v1/store/kitchen/orders` retornou apenas pedidos `pending`, `accepted`, `preparing` e `ready`.
- Pedido KDS criado via checkout: `order_number` 2, `Cliente KDS Fase 12`, `Burger Teste` + `Queijo extra`, total R$ 36,00.
- `PATCH /api/v1/store/orders/3/status` validou `pending -> accepted -> preparing -> ready` com `skip_side_effects=true`.
- `GET /api/v1/public/empresa-teste/orders/3` retornou endereco e timestamps de acompanhamento do pedido KDS.
- Pedido de acompanhamento criado via checkout: `order_number` 3, `Cliente Tracking Fase 12`, `Burger Teste` + `Bacon`, total R$ 37,00.
- `GET /api/v1/public/empresa-teste/orders/4` retornou status, cliente, itens, adicionais, total, endereco e timestamps publicos.
- `PATCH /api/v1/store/orders/4/status` validou `pending -> accepted` e gravou `accepted_at`.
- `PATCH /api/v1/store/orders/4/status` validou `accepted -> preparing` e gravou `preparing_at`.
- `http://127.0.0.1:5174/menu` carregou o produto `Burger Teste` via Rails.
- `http://127.0.0.1:5174/` carregou `Empresa Teste`, banner `Cardapio Replymesh`, status, endereco, WhatsApp e entrega `Centro - R$ 7,00`.
- `http://127.0.0.1:5174/products/2` carregou `Burger Teste` com `Bacon` e `Queijo extra`.
- Carrinho local validado com adicional `Bacon`, subtotal R$ 30,00, quantidade 2 => R$ 60,00 e remocao do item.
- Pedido teste criado com `Burger Teste` + `Bacon`: subtotal R$ 30,00, entrega R$ 7,00, total R$ 37,00 recalculado no backend.
- Tela `http://127.0.0.1:5174/success/2` validada no browser exibindo `Pedido recebido`, status `Pendente` e total recalculado.
- Tentativa duplicada com mesmo telefone e mesmo total retornou 422 dentro da janela de 90 segundos.
- Tela `http://127.0.0.1:5174/admin/orders` validada no browser exibindo `Cliente Teste Fase 12`, `Burger Teste`, adicional `Bacon`, endereco, total e status `Pronto`.
- Tela `http://127.0.0.1:5174/kitchen` validada no browser exibindo colunas KDS, pedido `#2`, cliente, item, adicional, observacao e status `Pronto`.
- Tela `http://127.0.0.1:5174/success/4` validada no browser exibindo `Pedido #3`, status `Aceito`, timeline, endereco, item, adicional, total e botao `Atualizar status`.
- Alias `http://127.0.0.1:5174/pedido/4` validado no browser com a mesma tela de acompanhamento.
- Polling do acompanhamento publico confirmado em 10 segundos, atualizando a tela para `Em preparo` sem recarregar manualmente.
- Restauracao visual 12.5 validada no browser:
  - `http://127.0.0.1:5174/` sem cards informativos extras e com cardapio embutido no layout original.
  - `http://127.0.0.1:5174/menu` com categorias horizontais, grid de produtos e cards sem botao `Detalhes`.
  - `http://127.0.0.1:5174/products/2` com layout original de detalhe do produto.
  - `http://127.0.0.1:5174/cart` com produto, adicional, cupom, total e `Finalizar Pedido`.
- `GET /api/v1/public/empresa-teste/customers/lookup?phone=21968443941` retornou cliente `Wesley Marinho` e ultimo endereco salvo.
- Pedido de teste Fase 12.6 criado com dinheiro, `needs_change=true`, `change_for_cents=5000`, subtotal R$ 30,00, entrega R$ 7,00 e total R$ 37,00.
- Acompanhamento publico exibiu `Troco: Para R$ 50,00`.
- Admin `/admin/orders` exibiu pedido com troco.
- Cozinha `/kitchen` exibiu pedido com troco.
- Menu admin `/admin/dashboard` validado com grupos reorganizados e suporte.
- Log WhatsApp `prepared_only` validado para `accepted -> pedido_aceito`, sem envio real.
- Banco confirmou `inventory_deducted=false`, `financial_recorded_at=null` e 3 logs de status.
- `npm run build` passou.

## Proxima etapa segura

Aguardar confirmacao para revisar visual do checkout/success ou iniciar outra etapa operacional aprovada. Motoboy, caixa automatico, WhatsApp automatico real, pagamento online e deploy continuam fora do escopo.

---

## Fase 12.7 - Importacao dados 2R + Dashboard visual (2026-06-04)

### O que foi feito

- Auditoria completa de M:\temple1\supabase\migrations.
- Cardapio real do 2R identificado em `20260422_import_hubt_menu.sql` e migrations de combos.
- Rake task criado: `rails import_2r:run` — importa para empresa-teste sem tocar no 2R original.
- Endpoint Rails `GET /store/dashboard` criado — substitui chamada Supabase do dashboard.
- Dashboard migrado 100% para Rails (getDashboardStats agora chama Rails, nao Supabase).
- Donut chart SVG puro para Status dos Pedidos (sem biblioteca de graficos).
- Sparklines SVG puro nos 4 cards superiores.
- Header do admin: data atual, bell com badge, avatar com inicial do usuario.
- Subtitle "Visao geral do seu negocio" no Dashboard.
- Link "Ver todos os pedidos" na secao Pedidos Recentes.

### Menus futuros (nao implementar agora)

Reorganizacoes planejadas para versoes futuras:

1. **Area Mobile/App** — mover "Banners do App" do grupo Cardapio para nova secao separada.
2. **IA no menu Comunicacao ou Automacoes** — adicionar IA como item de menu quando implementada.
3. **Recursos por plano** — bloquear/liberar items do menu por plano (Essencial/Profissional/Premium IA).
4. **Marketing WhatsApp** — considerar mover para nova secao "Automacoes" junto com IA.
5. **Templates WhatsApp por status** — exibir enabled/disabled por template diretamente no menu.

Nao implementar os menus futuros sem confirmacao. Apenas registrados aqui para referencia.

## Fase 12.8 - Admin Catalogo Rails (2026-06-04)

Paginas admin conectadas ao Rails:

| Pagina | Hook | Servico Rails |
|---|---|---|
| /admin/products | useProducts | railsGetProducts/railsCreateProduct/railsUpdateProduct |
| /admin/categories | useCategories | railsGetCategories/railsCreateCategory/railsUpdateCategory |
| /admin/delivery-zones | useDeliveryZones | railsGetDeliveryZones/railsCreateDeliveryZone/railsUpdateDeliveryZone |
| /admin/app-banners | direto | railsGetBanners/railsCreateBanner/railsUpdateBanner |

Novo no Rails:
- `delivery_zones_controller.rb` — CRUD admin de zonas de entrega
- serialize_list de produtos ampliado com category_id, cost_price_cents, track_inventory

Fluxo validado:
- Criar produto -> aparece em /menu publico
- Desativar produto -> some do /menu publico
- Reativar produto -> volta ao /menu publico
- Categorias com toggle ativar/desativar
- AppBanners reescrito (campos Supabase era titulo/imagem/link; Rails e title/image_url/link_url)

### Proxima etapa segura

Aguardar confirmacao. Nao iniciar motoboy, caixa automatico, pagamento online, WhatsApp automatico real ou deploy.

### Erros de console esperados (nao-criticos)

- `AppVersionWatcher` chama Supabase para verificar versao do app — erro esperado neste template sem Supabase. Nao afeta funcionalidade.
- Outros servicos legados que ainda referenciam Supabase (orders.js, settings.js) sao ignorados quando o componente nao os usa mais.

## Ajuste Fase 12 - Admin por empresa + WhatsApp/QR (2026-06-04)

Portas locais corretas:
- Master Replymesh: `http://127.0.0.1:5173`
- Store Template: `http://127.0.0.1:5174`
- Rails API: `http://127.0.0.1:3000`

Empresa Demo:
- Slug real: `demohamburgueria`
- Publico: `http://127.0.0.1:5174/loja/demohamburgueria`
- Login da loja: `http://127.0.0.1:5174/loja/demohamburgueria/login`
- Admin dashboard: `http://127.0.0.1:5174/loja/demohamburgueria/admin/dashboard`
- WhatsApp QR: `http://127.0.0.1:5174/loja/demohamburgueria/admin/whatsapp/qrcode`

Rotas admin slugadas adicionadas:
- `/loja/:companySlug/admin`
- `/loja/:companySlug/admin/dashboard`
- `/loja/:companySlug/admin/orders`
- `/loja/:companySlug/admin/products`
- `/loja/:companySlug/admin/categories`
- `/loja/:companySlug/admin/delivery-zones`
- `/loja/:companySlug/admin/whatsapp`
- `/loja/:companySlug/admin/whatsapp/templates`
- `/loja/:companySlug/admin/whatsapp/qrcode`

Contexto de empresa:
- O login slugado consulta `GET /api/v1/public/:company_slug/store`.
- O `company_id` retornado e salvo em `replymesh_store_company_id`.
- As chamadas admin seguem usando `X-Company-Id`, agora derivado da URL da empresa.

WhatsApp no admin da loja:
- Menu Comunicacao recebeu WhatsApp, Conexao / QR Code, Templates WhatsApp, Logs WhatsApp e Marketing WhatsApp.
- Frontend chama somente Rails.
- Rails chama Evolution Go.
- `instance_token` e apikey nao aparecem no frontend, README ou ROADMAP.
- Instancia segura da Demo para QR: `replymesh_demohamburgueria_qr`.
- QR Code real validado como imagem base64.

Validacoes:
- `/loja/demohamburgueria/admin/dashboard` abriu com links internos slugados.
- `/loja/demohamburgueria/admin/whatsapp/qrcode` listou instancias da Demo e renderizou QR Code.
- `npm run build` passou.

Pendencias:
- Branding publico/admin foi corrigido para Demo Hamburgueria e empresa-teste.
- Nao iniciar motoboy, caixa automatico, WhatsApp automatico real, pagamento online ou deploy sem confirmacao.

## Fase 12.8.1 - Ajustes criticos de Checkout, Branding, Admin e WhatsApp (2026-06-04)

Branding por empresa:
- Publico `/loja/demohamburgueria` agora exibe `Demo Hamburgueria` em header, nome da loja e footer.
- Admin `/loja/demohamburgueria/admin/dashboard` agora exibe `Demo Hamburgueria` no menu lateral.
- Login `/loja/demohamburgueria/login` agora usa o nome/logo de `store_settings`.
- `Lanche do 2R` permanece correto para `/loja/empresa-teste`.

Admin local da Demo:
- Usuario local criado/resetado:
  - email: `admin@demohamburgueria.com.br`
  - senha local: `admin123456`
- O login Rails agora retorna `company_members`.
- O frontend mapeia `store_admin` para perfil `admin`.
- Login validado abrindo `http://127.0.0.1:5174/loja/demohamburgueria/admin/dashboard`.

Checkout restaurado em modo Rails:
- WhatsApp primeiro.
- Busca cliente por WhatsApp em `GET /api/v1/public/:company_slug/customers/lookup`.
- Exibe enderecos salvos retornados pelo Rails.
- Permite selecionar endereco salvo.
- Campo de regiao atendida com taxa.
- Mensagem de area encontrada.
- Checkbox obrigatorio: conferir rua, numero e regiao antes de finalizar.
- Cupons disponiveis retornados no lookup do cliente.
- Campo para aplicar cupom.
- Dinheiro com opcao de troco.
- Resumo completo com subtotal, taxa, desconto, total visual e troco.
- Backend Rails continua recalculando subtotal, adicionais, taxa, desconto e total.

Cupom no Rails:
- `CheckoutService` agora calcula `discount_cents` antes de criar o pedido.
- Suporta `percentage`, `fixed` e `free_shipping`.
- `coupon_code` fica gravado no pedido e incrementa `used_count`.

Regra loja fechada:
- Nesta fase, loja fechada permanece regra visual no checkout.
- Bloquear ou permitir pedido fora do horario sera configuracao futura por empresa.

WhatsApp / Evolution preparado:
- Fluxo documentado para quando envio real for autorizado:
  - `accepted` -> `pedido_aceito`
  - `preparing` -> `pedido_em_preparo` se template enabled
  - `ready` -> `pedido_pronto` se template enabled
  - `out_for_delivery` -> `saiu_para_entrega`
  - `completed` -> `pedido_finalizado`
- Defaults continuam:
  - enabled: `pedido_aceito`, `saiu_para_entrega`, `pedido_finalizado`
  - disabled: `pedido_recebido`, `pedido_em_preparo`, `pedido_pronto`, `pedido_cancelado`, `marketing`
- Nenhum envio real automatico foi ativado.

QR Code WhatsApp:
- Pagina mantida: `/loja/demohamburgueria/admin/whatsapp/qrcode`.
- Instancia `replymesh_demohamburgueria_qr` esta conectada na Evolution.
- Quando a Evolution retorna `session already logged in`, a tela mostra estado conectado em vez de expor erro tecnico.
- Nenhum `instance_token`, apikey ou API key aparece no frontend.
- Instancia `Lanche` nao foi alterada.

FASE futura - Webhook localizacao Evolution:
- Fluxo atual esperado do 2R:
  - cliente envia localizacao pelo WhatsApp
  - Evolution recebe webhook
  - sistema identifica telefone do cliente
  - vincula localizacao ao pedido mais recente
  - salva latitude, longitude e link maps no pedido
  - motoboy usa Google Maps/Waze
- Nao implementar antes de confirmacao explicita e URL publica da API.

Validado:
- `/loja/demohamburgueria` sem branding 2R.
- `/loja/demohamburgueria/login` com Demo Hamburgueria.
- Login `admin@demohamburgueria.com.br` / `admin123456`.
- `/loja/demohamburgueria/admin/dashboard` sem dados da `empresa-teste`.
- `/loja/demohamburgueria/admin/whatsapp/qrcode` sem token/chave exposta.
- `/loja/empresa-teste/checkout` com lookup, endereco salvo, cupom, troco e resumo completo.
- Pedido real criado pelo checkout visual em `/loja/empresa-teste/success/10`.
- `npm run build` OK.

Proxima etapa segura:
- Aguardar confirmacao. Nao iniciar motoboy, caixa, pagamento online, WhatsApp automatico real ou deploy.

## Fase futura - Atendimento IA WhatsApp

Plano completo:
- `AI_WHATSAPP_ATTENDANT_PLAN.md`

Objetivo futuro:
- Adicionar atendimento com IA para mensagens recebidas no WhatsApp das lojas.
- IA deve ser ativada por loja e liberada por plano.
- IA deve usar apenas dados reais filtrados por `company_id`.

Fluxos que nao podem quebrar:
- Mensagens automaticas por status:
  - `accepted` -> `pedido_aceito`
  - `preparing` -> `pedido_em_preparo` se template enabled
  - `ready` -> `pedido_pronto` se template enabled
  - `out_for_delivery` -> `saiu_para_entrega`
  - `completed` -> `pedido_finalizado`
- Localizacao via WhatsApp:
  - cliente envia localizacao
  - Evolution envia webhook
  - sistema identifica telefone e pedido recente
  - sistema salva latitude, longitude e links de mapa no pedido
  - motoboy usa Google Maps/Waze

Regras:
- IA nao responde mensagens proprias.
- IA nao responde grupos.
- IA nao interfere em mensagens automaticas.
- IA nao interfere no fluxo de localizacao.
- Mensagem de localizacao tem prioridade sobre IA.
- IA nao inventa produto, preco, prazo, status ou motoboy.
- IA chama atendente quando nao souber.

Menu futuro documentado, sem implementar agora:

```text
Comunicacao
- WhatsApp
- Templates WhatsApp
- Marketing WhatsApp
- Atendimento IA
```

Fase futura - Webhook de Localizacao Evolution Go:
- Primeiro mapear o fluxo Node/Supabase do 2R.
- Depois recriar equivalente no Rails.
- Testar com instancia teste.
- Nao alterar webhook atual em producao sem validacao.

Nao fazer agora:
- Nao implementar IA.
- Nao criar tabelas.
- Nao alterar fluxo WhatsApp atual.
- Nao chamar Claude/API externa.

## Fase 12.9 - Checkout identico ao 2R, Branding Multiempresa, Onboarding Automatico e Validacao Final

### Checkout (identico ao temple1/2R)

Mudancas em `store-template/src/pages/public/Checkout.jsx`:
- Busca automatica de cliente por WhatsApp com debounce de 600ms (useEffect, substituiu trigger manual).
- Auto-preenchimento do ultimo endereco quando campos estao vazios apos lookup.
- Botao Trash2 para excluir endereco salvo via `DELETE /api/v1/public/:slug/customers/addresses/:id?phone=`.
- Secao PIX inline exibida ao selecionar PIX como forma de pagamento.
- Card de endereco de retirada dinamico usando `store.address` (nao mais hardcoded).
- Loja fechada bloqueia o botao submit (antes era apenas visual).
- `FREE_ITEM` exibido no resumo do pedido quando coupon tem discount_type=free_item.
- `saveCustomerData` no localStorage com checkbox opcional.
- `handleOrderTypeChange` corrigido: PICKUP pre-confirma endereco e zera taxa.

Novo endpoint Rails:
- `DELETE /api/v1/public/:company_slug/customers/addresses/:id?phone=`
- Controller: `api/v1/public/customer_addresses_controller.rb`

Novo na publicApi.js:
- `deletePublicCustomerAddress(phone, addressId, slug)`

### Success.jsx

- `useCompanyBasePath()` usado em todos os `navigate('/menu')`.
- Logo e nome da empresa exibidos no topo.
- Secao PIX exibida inline quando `order.payment_method === 'pix'` e store tem config PIX.
- Linha de desconto exibida quando `order.discount_amount > 0`.
- `coupon_code` adicionado ao serializer publico de pedido.
- `notes` adicionado ao serializer publico de pedido.

### Branding Multiempresa

Todos os hardcodes do 2R removidos:
- `PublicLayout.jsx`, `AdminLayout.jsx`, `Login.jsx`, `Home.jsx`, `BrandLogo.jsx`: fallback `''` em vez de `'Lanche do 2R'`.
- `whatsappTemplates.js`: nome e URL do 2R removidos.
- `marketingWhatsapp.js`: texto e URL do 2R removidos.
- `Wheel.jsx`: "Roleta do 2R" virou "Roleta de Premios".
- `MotoboyPortal.jsx`: texto "Lanche do 2R" removido.
- `Settings.jsx`: mensagem de teste neutralizada.
- `Tables.jsx`: HTML de impressao usa `session.company_name`.
- `CreateKitchenUser.jsx`: substituido por redirect ao painel master (era Supabase legado do 2R).
- `index.html`: metatags "Lanche do 2R" e `lanchesdo2r.com.br` removidos.
- localStorage keys: `lanches2r:*` -> `replymesh:*`.
- `auth.js`: email motoboy `@motoboy.lanches2r.local` -> `@motoboy.replymesh.local`.

### Onboarding Automatico

Adicionado ao `CompanyOnboardingService`:
- `create_business_hours!`: cria 7 registros BusinessHour (seg-sab 18h-23h30, dom fechado).
- `create_default_delivery_zone!`: cria zona "Centro", R$ 5,00, 40 min.
- `created_resources` tracka `business_hours` e `delivery_zone`.

### WhatsApp UX

Adicionado a `store-template/src/pages/admin/Whatsapp.jsx`:
- Auto-polling de status a cada 15s (silencioso).
- Card de Templates inline com status ativo/inativo.
- `railsGetWhatsappTemplates` integrado ao load inicial.

### Validacao Final (bugs corrigidos em 2026-06-04)

Bugs encontrados e corrigidos:
1. `render_not_found` ausente no `Public::BaseController` -> 500 em `GET /public/:slug/orders/:id`.
2. `index.html` com metatags hardcoded "Lanche do 2R" e `lanchesdo2r.com.br`.
3. `coupon_code` e `notes` ausentes no serializer publico de pedido.

Resultados dos testes:
- Todas as 3 lojas (empresa-teste, demohamburgueria, demopizza): sem referencia ao 2R no HTML.
- Lookup: found=true, 2 enderecos, 1 cupom — OK.
- Pedido com cupom TESTE10: discount=3.2 aplicado corretamente — OK.
- Pedido com troco: change_for=100 gravado e retornado — OK.
- Endpoint publico de pedido: status + itens + endereco + coupon_code + notes — OK.
- Timeline: preparing_at e out_for_delivery_at retornados corretamente — OK.
- Demo Pizza onboarding: business_hours=7, delivery_zone=1 ("Centro", R$5) — OK.
- WhatsApp: logs sem token/apikey, test_send=true, instancia connected — OK.
- npm run build: exit 0 — OK.
- dist/ JS: nenhum hardcode 2R — OK.

---

## Fase 12.8.2 - WhatsApp por empresa, instancia unica e envio teste

Regra operacional:
- Cada empresa deve usar uma unica instancia WhatsApp principal no admin da loja.
- O frontend da loja nao mostra seletor de multiplas instancias.
- Se a empresa ja possui instancia, o admin usa a existente.
- Se nao possui, o backend prepara apenas uma.
- Tokens e apikeys ficam somente no backend Rails.

Demo Hamburgueria:
- Slug: `demohamburgueria`
- Admin: `http://127.0.0.1:5174/loja/demohamburgueria/admin/dashboard`
- WhatsApp: `http://127.0.0.1:5174/loja/demohamburgueria/admin/whatsapp`
- Instancia principal: `replymesh_demohamburgueria_qr`
- Status validado: `connected`
- Numero conectado: `5521968443941:90@s.whatsapp.net`
- A instancia `Lanche` nao deve ser tocada.

Tela WhatsApp unificada:
- Conexao
- Status
- QR Code
- Logs recentes
- Teste controlado de envio

Menu Comunicacao atual:

```text
Comunicacao
- WhatsApp
- Templates WhatsApp
- Marketing WhatsApp
```

Templates padrao por empresa:
- `pedido_aceito` ativo
- `saiu_para_entrega` ativo
- `pedido_finalizado` ativo
- `pedido_recebido` desativado
- `pedido_em_preparo` desativado
- `pedido_pronto` desativado
- `pedido_cancelado` desativado
- `marketing` desativado

Fluxo status -> template:
- `accepted` -> `pedido_aceito`
- `preparing` -> `pedido_em_preparo`
- `ready` -> `pedido_pronto`
- `out_for_delivery` -> `saiu_para_entrega`
- `completed` -> `pedido_finalizado`
- `cancelled` -> `pedido_cancelado`

Envio real:
- Rota Rails controlada: `POST /api/v1/store/whatsapp/test_send`
- Usar apenas pedido teste e template habilitado.
- A Evolution Go desta VPS usa `POST /send/text` com header `apikey` da instancia.
- A rota `/message/sendText` retornou 404 neste ambiente e nao deve ser usada.
- O envio automatico operacional ainda nao esta ativado para todos os pedidos.
- Marketing em massa continua bloqueado.

---

## Fase 13.0 - Motoboy Base

Objetivo concluido:
- Criar o portal base do motoboy no store-template usando Rails, preservando o 2R original e sem usar Supabase no fluxo novo.

Rotas novas por empresa:
- `/loja/:slug/motoboy/login`
- `/loja/:slug/motoboy/dashboard`
- `/loja/:slug/motoboy/history`
- `/loja/:slug/motoboy/profile`

Servicos frontend:
- `src/services/motoboyApi.js` usa `http://127.0.0.1:3000/api/v1`.
- Token do motoboy fica em `replymesh_motoboy_token`.
- O token do motoboy e separado do token admin da loja.

Fluxo operacional validado:
- Admin cria motoboy com telefone e senha.
- Admin atribui pedido pronto ao motoboy.
- Motoboy loga pelo slug da empresa.
- Motoboy visualiza pedidos atribuidos.
- Motoboy inicia entrega.
- Motoboy finaliza entrega.
- Historico exibe entregas finalizadas.

Limites da fase:
- Sem localizacao em tempo real.
- Sem Google Maps/Waze.
- Sem webhook de localizacao Evolution.
- Sem caixa automatico.
- Sem app mobile.

---

## Fase 13.1 - UX Motoboy e Atribuicao Visual no Admin

Objetivo concluido:
- Aproximar o portal Motoboy Rails do visual original do 2R e permitir atribuicao visual pelo admin da loja.

Portal Motoboy:
- Layout centralizado em `max-w-3xl`, como no 2R.
- Header com logo/nome da empresa atual e botao Sair.
- Tabs horizontais:
  - Entregas
  - Historico
  - Financeiro
  - Perfil
- Card "Minhas entregas" com botao Atualizar.
- Card de entrega mostra cliente, status, endereco, referencia, pagamento, total, taxa, itens, adicionais e observacoes.
- Botoes:
  - Maps usando endereco textual.
  - Waze usando endereco textual.
  - Cliente abrindo WhatsApp com telefone do pedido.
- Nao foi implementado mapa embutido nem localizacao em tempo real.

Financeiro Motoboy:
- Tela basica em `/loja/:slug/motoboy/financeiro`.
- Mostra entregas concluidas, total de taxas, total a pagar e historico.
- Repasses avancados, vales e ajustes ficam para fase futura.

Admin de pedidos:
- `Orders.jsx` carrega motoboys ativos via Rails.
- `OrderActions.jsx` mostra seletor "Selecionar motoboy" quando pedido de entrega esta `ready`.
- Botao "Atribuir motoboy" chama Rails e atualiza a linha local.
- Pedido atribuido passa a aparecer no dashboard do motoboy.
- `OrderDetails.jsx` foi migrado para Rails em `/loja/:slug/admin/orders/:id`.
- O detalhe mostra dados completos do pedido, itens, adicionais, totais, endereco, observacoes e historico.
- A lateral do detalhe permite alterar status, cancelar, enviar WhatsApp manual e salvar motoboy no pedido.
- O botao Imprimir abre um cupom isolado com CSS de impressao, sem sidebar/header.

Validacao local:
- Demo Hamburgueria manteve branding correto.
- Pedido teste #3 foi atribuido ao `Motoboy Teste Replymesh`.
- Fluxo iniciar/finalizar entrega funcionou.
- Pedido teste #4 validou detalhe Rails, impressao implementada, transicoes de status, atribuicao visual, portal motoboy e historico.
- `npm run build` passou.

Diferencas restantes em relacao ao portal 2R completo:
- Upload de foto do motoboy ainda nao migrado.
- Financeiro avancado ainda nao migrado.
- Filtros financeiros por periodo ainda nao migrados.
- Localizacao precisa por WhatsApp permanece documentada para fase futura.

## Fase 13.1.1 - Correcoes finais de Admin, Impressao e Produto

Escopo concluido:
- Rota `/loja/demohamburgueria/admin/orders/17` validada sem erro de import `railsAssignMotoboyToOrder`.
- `src/services/storeApi.js` exporta `railsAssignMotoboyToOrder` e usa atualizacao parcial segura em produtos.
- Criacao manual de produto no admin valida nome, categoria e preco antes do envio.
- Toggle de produto ativo/desativado nao envia mais payload incompleto que quebrava validacoes Rails.
- Botao `Imprimir` do detalhe do pedido usa HTML isolado em `Blob` com `window.open`.
- Impressao possui fallback por iframe escondido quando popup for bloqueado.
- Cupom contem pedido, cliente, telefone, tipo, endereco, bairro, referencia, itens, subtotal, taxa, desconto, total, pagamento, troco e data/hora.

Teste local realizado:
- Produto manual criado/editado/desativado/reativado via API Rails e refletido no menu publico.
- Pedido de teste criado na `empresa-teste` com produto importado do 2R: `Combo Casal X-tudo`.
- Pedido foi levado ate `ready`, atribuido ao `Motoboy Teste Empresa`, iniciado e finalizado pelo namespace `/api/v1/motoboy`.
- Resultado final: `order.status=completed`, `delivery_status=delivered`, historico do motoboy retornando entrega concluida.
- `npm run build` passou.
- `rails routes` confirmou endpoints de produtos, pedidos, atribuicao e motoboy.

Residuo conhecido:
- `AppVersionWatcher` ainda tenta consultar Supabase via service legado e gera erro esperado no console quando Supabase nao esta configurado. Ele nao impede o detalhe do pedido nem o fluxo Rails.

Fora do escopo:
- Localizacao real.
- Webhook Evolution Location.
- Mapa embutido.
- Deploy.

---

## Fase 15 - Clientes, Cupons e Roleta no Rails

Objetivo:
- Migrar/conectar clientes, cupons e roleta ao Rails local, preservando o visual 2R no `store-template`.

Frontend:
- `src/services/customers.js` agora usa Rails para listar, buscar, editar e carregar enderecos/historico.
- `src/pages/admin/CustomerDetails.jsx` manteve o layout de cards e ganhou edicao basica no card de informacoes.
- `src/services/coupons.js` agora usa Rails para CRUD admin e validacao publica.
- Checkout aplica cupom da lista do cliente ou valida codigo manual contra Rails.
- `src/services/wheel.js` agora usa Rails para perfil, premios, giro, resumo admin e historico.
- `src/services/storeApi.js` deixou os efeitos colaterais ligados por padrao ao finalizar pedido, para liberar giro e atualizar estatisticas.

Backend Rails:
- Novas tabelas: `wheel_prizes` e `wheel_spins`.
- `coupons` ganhou `customer_id`, `source` e `metadata_json` para cupons da roleta e segmentacao por cliente.
- Novo `WheelService` controla creditos, sorteio ponderado, geracao de cupom `ROLETA...` e historico.
- Novo `CouponValidationService` centraliza validacao segura de cupom.
- `OrderStatusService` chama a roleta somente na transicao para `completed`.
- `CustomersController#show` devolve cliente, enderecos e pedidos com itens.

Endpoints Rails:
- Admin clientes: `GET /store/customers`, `GET /store/customers/:id`, `PATCH /store/customers/:id`.
- Admin enderecos: `GET /store/customers/:customer_id/addresses`.
- Admin cupons: `GET/POST/PATCH/DELETE /store/coupons`.
- Public cupons: `POST /public/:company_slug/coupons/validate`.
- Public roleta: `GET /public/:company_slug/wheel/profile`, `GET /wheel/prizes`, `POST /wheel/spin`.
- Admin roleta: `GET /store/wheel/summary`, `GET /store/wheel/spins`, `POST/PATCH /store/wheel_prizes`.

Regra da roleta:
- Giro so entra apos pedido finalizado.
- 1 giro a cada R$ 25,00 do total do pedido.
- Giros expiram em 30 dias.
- Cada giro de premio gera cupom de uso unico para o cliente.
- Tudo isolado por `company_id`.

Nao iniciado:
- VPS/deploy.
- Webhook real Evolution.
- Pagamento online.
- App Flutter.

---

## Fase 15.1 - Homologacao Final Completa

Status:
- Homologacao local concluida.
- Nenhuma funcionalidade nova iniciada.
- Nenhum deploy/VPS iniciado.

Passou:
- Public API das 3 empresas (`empresa-teste`, `demohamburgueria`, `demopizza`) para store/menu/zonas/horarios/banners.
- Catalogo admin nas 3 empresas: produtos e categorias criados/editados/ativados/desativados e refletidos no menu publico.
- Clientes nas 3 empresas: listagem, busca, detalhe, historico, enderecos e edicao basica.
- Cupons nas 3 empresas: percentual, fixo, inativo, expirado, ativar/desativar e aplicacao no checkout.
- Checkout nas 3 empresas: entrega, retirada, dinheiro, PIX, troco, observacao, taxa, desconto e totais.
- Pedidos: conclusao e historico/status por API.
- Roleta nas 3 empresas: creditos/giros apos `completed`, regra R$ 25, premio, historico, cupom vinculado e uso unico.
- Motoboy Demo: login, pedido atribuido, visualizacao, finalizar entrega, retirada da lista ativa e admin vendo `completed`.
- Localizacao WhatsApp local: serializer e frontend confirmados; Maps/Waze usam links de pin quando existem e fallback textual quando nao existem.
- Multiempresa: sem vazamento nos dados testados.

Bug corrigido:
- `OrderStatusService` nao permite mais que ausencia de caixa aberto bloqueie `completed`; isso tambem destravou a geracao dos giros da roleta.

Observacoes:
- WhatsApp ativo possui logs `ok` para numero valido; numeros temporarios de homologacao sem WhatsApp retornaram erro esperado da Evolution.
- Template inativo foi validado como ignorado (`prepared_only`).
- Instancia `Lanche` nao foi alterada.

Testes tecnicos:
- `npm run build` no store-template: OK.
- `npm run build` no replymesh-frontend: OK.
- `npm run lint` no replymesh-frontend: OK.
- `rails routes`: OK.
- `ruby -c` nos arquivos alterados: OK.

Proxima fase:
- FASE 16 - VPS E PRODUCAO.
- Nao iniciar sem confirmacao.

---

## Fase 15.4 - Refinamento visual das Configuracoes da Loja

Objetivo:
- Deixar a tela de Configuracoes mais profissional, curta e facil para o cliente usar.

Implementado no `store-template`:
- `src/pages/admin/Settings.jsx` reorganizado em accordion.
- Apenas uma secao fica aberta por vez.
- Secoes:
  - Geral.
  - Identidade visual.
  - Entrega.
  - Pagamentos / PIX.
  - Horarios.
  - Impressao / Nota.
  - WhatsApp basico.

WhatsApp em Configuracoes:
- Removidos campos tecnicos da tela:
  - Evolution Base URL.
  - Evolution API Key.
  - Evolution Instance.
  - Teste de conexao.
  - Teste de envio por template.
  - Preview de mensagem.
  - Mensagens padrao tecnicas.
  - Avisos de secrets/API.
- Mantido somente:
  - WhatsApp da loja.
  - Status simples da API.
  - Link para Comunicacao > WhatsApp.
  - Texto simples informando que mensagens automaticas ficam na area WhatsApp.

Identidade visual:
- Bloco proprio para logo.
- Upload/troca de logo.
- Remocao de logo.
- URL da logo.
- Bloco proprio para banner/capa.
- Upload/troca de banner.
- Remocao de banner.
- Fallback `/logo.png` quando nao houver logo.
- O texto explica que a logo aparece no cardapio, checkout, roleta, motoboy, login e impressao.

Layout:
- Entrega compactada em 2 colunas e checkboxes menores.
- PIX compactado em grid e payload reduzido.
- Horarios compactados por dia.
- Impressao/Nota reduzida a rodape curto.
- Relatorios removidos da tela de Configuracoes.

Persistencia:
- `src/services/settings.js` agora preserva `banner_url` e `cover_url` no retorno/salvamento de settings.

Teste:
- `npm run build`: OK.

Nao iniciado:
- VPS/deploy.
- Flutter.
- IA.
- Pagamento online.
- Alteracoes no 2R original.

---

## Fase 15.5 - Refinamento Visual do Painel + Suporte/Tickets

Objetivo:
- Reduzir placeholders e avisos tecnicos antes da VPS.
- Tornar Suporte/Tickets, Caixa e Estoque mais profissionais e conectados ao Rails.

Store Template:
- `/loja/:slug/admin/support` agora usa Rails.
- Suporte separado em Abrir ticket, Meus tickets, Detalhe, Respostas e Status.
- Removido aviso de backend pendente.
- `src/services/supportTickets.js` criado.
- Caixa passou a usar `src/services/cashRegister.js` com Rails.
- Estoque passou a usar `src/services/inventory.js` e `src/services/inventoryMovements.js` com Rails.
- Alias `/loja/:slug/admin/cash` criado para a tela de caixa.

Backend:
- Tickets reais implementados no Rails.
- Store tickets e master tickets com mensagens e status.

Painel Master:
- `/tickets` deixou de ser placeholder.
- Rotas `/tickets/abertos`, `/tickets/andamento` e `/tickets/resolvidos` usam a mesma tela com filtros.

Testes:
- Ticket criado, respondido e alterado para `pending`.
- Ticket apareceu no master.
- Caixa aberto, suprimento registrado e caixa fechado.
- Item de estoque criado, entrada registrada e ajuste aplicado.
- `npm run build` no `store-template`: OK.
- `npm run build` e `npm run lint` no master: OK.

Fora do escopo:
- VPS/deploy.
- IA.
- Flutter.
- Pagamento online.
- Marketing em massa.
- Alteracoes no 2R original.

---

## Fase 15.6 - Ajustes finais de UX, Tickets, Mesas e Refinamento Visual

Objetivo:
- Corrigir tickets da loja, finalizar Mesas/QR em Rails e fazer refinamentos visuais pontuais antes da VPS.

Tickets:
- A loja nao altera mais status de ticket.
- `/loja/:slug/admin/support` exibe status apenas como badge visual.
- Loja pode criar ticket e responder.
- Master continua alterando status em `/tickets`.
- Backend bloqueia `PATCH /api/v1/store/tickets/:id/status` com 403.

Mesas e QR:
- `src/services/tables.js`, `src/services/tableQr.js` e `src/hooks/useTables.js` foram migrados para Rails.
- Removida dependencia Supabase/RPC da tela de Mesas e do QR publico.
- QR publico usa a rota da empresa: `/loja/:slug/mesa/:qrToken`.
- API publica:
  - `GET /api/v1/public/:company_slug/tables/qr/:qr_token`
  - `POST /api/v1/public/:company_slug/tables/qr/:qr_token/session`
  - `POST /api/v1/public/:company_slug/tables/qr/:qr_token/orders`
  - `GET /api/v1/public/:company_slug/tables/qr/:qr_token/orders`
- API admin:
  - `GET/POST/PATCH/DELETE /api/v1/store/dining_tables`
  - `PATCH /api/v1/store/dining_tables/:id/set_qr_enabled`
  - `POST /api/v1/store/dining_tables/:id/regenerate_qr`
  - `GET/POST/PATCH /api/v1/store/table_sessions`
- Pedido criado pelo QR fica vinculado a `dining_table_id`.

Refinamentos visuais:
- Produtos: cards mais compactos, nomes truncados, fallback "Sem imagem".
- Clientes: telefone formatado, cards mais compactos, destaque para pedidos e total gasto.
- Relatorios: estado vazio padronizado com "Nenhum dado encontrado para o periodo selecionado."
- Suporte: detalhe em conversa e status/prioridade em badges.

Teste local:
- Mesa `Mesa Teste QR` criada na Demo Hamburgueria.
- QR publico validado em `/loja/demohamburgueria/mesa/:qrToken`.
- Pedido de mesa criado pelo Rails e exibido na pagina QR.
- `npm run build`: OK.

Fora do escopo:
- VPS/deploy.
- Flutter.
- IA.
- Pagamento online.
- Mudancas no 2R original.

---

## Fase 15.11.1 - Pix Mercado Pago e Visual Premium

Objetivo:
- Refinar o Pix Mercado Pago automatico e permitir personalizacao visual real do template premium por loja.

Pix:
- Loja com `pix_provider = mercadopago` e `mercadopago_enabled = true` nao mostra Pix manual no checkout.
- O frontend mostra o painel Mercado Pago com QR, copia e cola e status do pagamento.
- A tela de sucesso tambem entende pedido `pending_payment` e evita exibir dados manuais.
- O modo mock local usa token `TEST-`/`DEV-` e nao cria cobranca real.

Visual premium:
- Campos novos em Configuracoes > Identidade visual:
  - `hero_image_url`
  - `hero_image_position`
  - `hero_image_zoom`
  - `hero_overlay_opacity`
  - `hero_height`
  - `theme_primary_color`
- O template `hamburgueria-premium` consome esses campos diretamente do Rails.
- Fallbacks continuam ativos para imagem e cor quando a loja nao configurar nada.

Testes:
- `npm run build`: OK.
- Home da Demo Hamburgueria carregou localmente em `http://127.0.0.1:5174/loja/demohamburgueria`.

Fora do escopo:
- Deploy/VPS.
- Criar cobranca real em producao.
- Alterar o 2R original.

---

## Fase 15.11.2 - Pix Mercado Pago em Tempo Real + Cancelamento Automatico

Objetivo:
- Fazer o painel Pix Mercado Pago atualizar automaticamente o pedido por polling, sem depender de webhook publico em localhost.

Backend:
- `MercadoPagoPaymentProcessor` centraliza:
  - confirmacao `approved` -> `payment_status = paid` e `order.status = accepted`;
  - expiracao apos 3 minutos -> `payment_status = expired` e `order.status = cancelled`;
  - cancelamento publico -> `payment_status = cancelled` e `order.status = cancelled`;
  - rejeicao -> `payment_status = failed` e `order.status = cancelled`.
- Endpoint publico de status:
  - `GET /api/v1/public/:company_slug/payments/:order_id/status`
- Endpoint publico de cancelamento:
  - `POST /api/v1/public/:company_slug/orders/:id/cancel_payment`
- Webhook e simulacao usam o mesmo processador:
  - `POST /api/v1/webhooks/mercadopago`
  - `POST /api/v1/webhooks/mercadopago/simulate`

Frontend:
- `usePixPayment` faz polling a cada 5 segundos usando o slug atual da URL.
- `MercadoPagoPixPanel` mostra:
  - QR Code;
  - Pix copia e cola;
  - botao copiar;
  - botao atualizar status;
  - botao cancelar pedido;
  - contador regressivo de 3 minutos;
  - estados aguardando, confirmado, expirado, cancelado e falha.
- Checkout redireciona para sucesso quando o Pix confirma e volta para o carrinho quando o cliente cancela.

Admin/KDS:
- Pedido com `payment_status = pending_payment` aparece como "Aguardando pagamento".
- Acoes do admin nao exibem "Aceitar" antes do pagamento.
- Cozinha nao lista pedido Pix pendente.

WhatsApp:
- Quando o pagamento confirma e o pedido vira `accepted`, o fluxo chama o template `pedido_aceito`.
- Quando expira/cancela/rejeita, o fluxo chama `pedido_cancelado` apenas se o template estiver ativo.
- Teste local usou telefone falso; o envio real de `pedido_aceito` falhou com log seguro, sem expor token.

Testes:
- `rails db:migrate`: OK.
- `rails routes`: OK.
- `ruby -c`: OK.
- Endpoint de polling approved: OK.
- Endpoint de polling expired: OK.
- Endpoint cancel_payment: OK.
- Webhook simulate rejected: OK.
- `npm run build`: OK.

Fora do escopo:
- Deploy/VPS.
- Chave real no frontend.
- Alterar o 2R original.
- Marketing em massa.

## Fase 15.11.3 - Auditoria Final Mercado Pago + URLs Publicas Seguras

Objetivo:
- Fechar a auditoria do Pix Mercado Pago antes da VPS e remover ID sequencial da URL publica de pedido.

Implementado:
- `orders.public_token` criado no Rails com token aleatorio e indices unicos.
- O checkout do `store-template` navega para `/loja/:slug/success/:public_token`.
- A tela de sucesso busca pedido por token publico.
- O painel Pix Mercado Pago faz polling usando token publico.
- Cancelamento publico de Pix usa token publico.
- A API publica nao precisa mais expor ID interno na URL do cliente.
- A impressao do pedido no admin foi corrigida com HTML UTF-8 e formatacao simples de moeda.

Fluxo atual:
- Pedido novo criado no checkout recebe `public_token`.
- Se for Pix Mercado Pago, o painel de pagamento usa esse token para consultar status.
- Quando o pagamento confirma, o cliente vai para `/success/:public_token`.
- O acompanhamento continua mostrando timeline e botao para enviar o pedido pelo WhatsApp.

Comando local:

```powershell
cd "W:\sas replymesh\replymesh-api"
rails payments:expire_pending_pix
```

Validado:
- `/api/v1/public/demohamburgueria/orders/70` retorna 404.
- `/api/v1/public/demohamburgueria/orders/:public_token` retorna 200.
- `/api/v1/public/demohamburgueria/payments/:public_token/status` retorna 200.
- `npm run build` no `store-template`: OK.

Fora do escopo:
- VPS/deploy.
- Alterar o 2R original.
- Configurar scheduler real na VPS.
## Fase 15.12 - Carina no Admin da Loja

Status: concluida localmente.

- A loja nao possui menu, pagina ou campos de configuracao da Carina.
- A rota antiga `/loja/:slug/admin/ai` redireciona para o dashboard.
- O Painel Master controla estado global, provider, modelo, chave, prompt,
  aparencia e limites.
- Quando habilitada, a Carina aparece como chat flutuante nas paginas
  protegidas do admin da loja.
- O chat usa JWT e o contexto multiempresa resolvido no Rails.
- A loja acessa somente `GET /api/v1/store/ai/settings` e
  `POST /api/v1/store/ai/chat`.
- Nenhuma API key, token do WhatsApp ou credencial de pagamento e enviada ao
  frontend.
- As respostas usam Claude com fallback para a base local da Replymesh.
- A Carina apenas orienta; ela nao altera configuracoes nem executa acoes.

Validacoes:

- Demo Hamburgueria exibiu o botao flutuante no admin.
- Pergunta "Como cadastro um produto?" respondeu com orientacao objetiva.
- Assuntos fora da Replymesh foram recusados educadamente.
- Integracoes de pedidos, pagamentos, Evolution e localizacao permaneceram
  intactas.

## Fase 15.13 - Experiencia Premium da Carina

- O botao flutuante permanece em todas as paginas protegidas do admin.
- A conversa agora usa memoria das ultimas dez mensagens no backend.
- O frontend nao armazena credenciais nem precisa enviar o historico.
- Cumprimentos sao respondidos imediatamente e de forma natural.
- Perguntas de continuacao, como produto seguido de imagem, preservam contexto.
- O contexto informa pagina atual, empresa, plano, dominio e modulos ativos.
- A resposta inclui caminhos reais, como `Cardapio > Produtos`.
- A Carina sugere um proximo passo quando isso ajuda o usuario.
- Em falha do Claude, o Rails usa a resposta ideal encontrada na base local.
- A base canonica fica no backend e nao e enviada integralmente ao navegador.

Testado na Demo Hamburgueria:

- Cumprimento natural.
- Cadastro de produto.
- Continuacao sobre imagem.
- Mercado Pago.
- Cupom.
- Conexao WhatsApp.
- Cadastro de motoboy.

Nenhuma funcionalidade de pedido, pagamento, Evolution, motoboy ou checkout foi
alterada pela Fase 15.13.
# Fase 15.14 - Atualizacoes da plataforma

O menu `Atualizacoes` da loja agora consulta o Rails e nao possui mais dados estaticos.

- Rota: `/loja/:slug/admin/updates`
- Filtros: todas, novidades, melhorias, correcoes e avisos.
- Cada usuario possui seu proprio estado de leitura dentro da empresa.
- Abrir uma publicacao marca a atualizacao e sua notificacao como lidas.
- O sino usa notificacoes reais e redireciona para pedido, suporte, WhatsApp ou
  atualizacoes conforme o tipo.
- O tema da loja continua escuro nesta fase.

## Fase 15.15 - Impacto no store-template

- Nenhum fluxo de pedido, pagamento, WhatsApp, motoboy, roleta ou template foi alterado.
- A Carina continua aparecendo somente como assistente flutuante quando ativada pelo master.
- A loja continua sem acesso a configuracao, prompt ou API key da Carina.
- O build do `store-template` foi executado para garantir ausencia de regressao.
- Usuarios e permissoes desta fase pertencem exclusivamente ao Painel Master.
## Fase 15.16 - Acesso de suporte Replymesh

O painel da loja reconhece uma sessao de impersonacao separada do login normal.
Durante esse acesso:

- o token normal da loja nao e sobrescrito;
- o token temporario e usado somente durante a sessao de suporte;
- um banner fixo informa o usuario master e a empresa;
- o botao `Sair do acesso suporte` revoga a sessao no Rails;
- o contexto anterior da loja e restaurado ao sair;
- uma sessao revogada ou expirada recebe HTTP 401.

Esse fluxo nao altera pedidos, WhatsApp, Mercado Pago, motoboy, roleta,
templates ou a Carina.

## Fase 15.17 - Impacto no store-template

A Fase 15.17 ficou concentrada no Painel Master.

- Nenhuma rota publica da loja foi alterada.
- Nenhum fluxo de checkout, Pix, Mercado Pago, WhatsApp, motoboy, roleta,
  templates, pedidos ou Carina da loja foi modificado.
- O `store-template` foi apenas compilado para garantir ausencia de regressao.
- O dashboard executivo master usa dados agregados do Rails e nao expõe
  credenciais ou tokens das lojas.

## Fase 15.19 - IA da Loja com RAG local

A area `Configuracoes > Inteligencia Artificial` permite configurar e testar
localmente a futura IA de atendimento da loja.

Campos:

- ativar/desativar;
- nome da IA;
- mensagem inicial;
- tom de voz;
- modelo;
- limite diario;
- permissoes para pedidos, produtos, horarios, promocoes e status.

O painel mostra a resposta do simulador e os chunks recuperados. Metricas de
tokens e custo sao exclusivas do Painel Master.

Regras desta fase:

- a configuracao e sempre vinculada a empresa autenticada;
- a API key continua exclusivamente no Painel Master/backend;
- o cliente da loja nao ve credenciais;
- o simulador nao chama Evolution;
- nenhuma mensagem e enviada automaticamente ao WhatsApp;
- produtos, cupons, horarios e pedidos sao consultados apenas dentro da
  empresa atual;
- assuntos fora do escopo sao recusados.

Estruturas preparadas para o WhatsApp futuro:

- `StoreAiConversation`
- `StoreAiMessage`
- canal, telefone, cliente, empresa e contexto

A Fase 15.19.1 adicionou a opcao `Responder automaticamente no WhatsApp`.
Ela permanece desligada por padrao. Quando habilitada, o Rails:

- recebe a mensagem pelo webhook Evolution;
- identifica a empresa pela instancia vinculada;
- ignora mensagens proprias, grupos e localizacoes;
- identifica o cliente e o pedido recente pelo telefone;
- usa RAG e Claude com contexto reduzido;
- formata uma resposta curta para WhatsApp;
- envia pelo backend sem expor credenciais.

O endpoint preparado e:

`POST /api/v1/webhooks/evolution/messages`

O envio real depende de URL publica e configuracao futura do webhook na
Evolution. Nesta fase, o pipeline foi validado localmente em modo mock e
nenhuma mensagem real foi enviada.

## Fase 15.20 - Marketing e Aplicativo Android

O menu Comunicacao possui:

- Marketing WhatsApp
- Recuperador de Vendas

Marketing usa clientes reais do Rails e sempre filtra por empresa. A criacao
de campanha apenas prepara destinatarios; nenhum disparo acontece sem uma
segunda acao e confirmacao explicita.

O envio individual usa a instancia Evolution vinculada e gera
`MarketingMessageLog`. Campanhas aceitam `{nome}`, `{telefone}`, `{cupom}` e
`{link_loja}`. Quando nao existe cupom, a linha correspondente e removida.

O antigo item `Banners do App` passou a ser `Aplicativo Android`. A tela coleta
nome, marca, imagens, cores, WhatsApp e observacoes e cria uma solicitacao para
o Painel Master. Nenhum Flutter ou APK e gerado nesta fase.

O item fica em `Comunicacao` e possui uma pagina unica com:

- Solicitacao do aplicativo;
- Banners do App;
- Mensagens para usuarios.

Enquanto o aplicativo nativo ainda nao existe, as mensagens sao entregues pelo
WhatsApp conectado da loja usando Evolution Go. Push nativo fica reservado
para a implementacao futura do APK.

O envio passou a selecionar a instancia conectada da empresa. Instancias
antigas ou desconectadas nao sao usadas.

Na loja publica, o hero nao usa mais `/capa.jpeg` como imagem temporaria.
Antes de os dados da empresa chegarem, aparece somente o fundo escuro; depois,
a imagem configurada pela loja e renderizada diretamente.

## Fase 15.21 - Resolucao por subdominio

O template preserva as rotas locais `/loja/:slug` e agora tambem consegue
obter o tenant pelo hostname `slug.replymesh.cloud`. As chamadas publicas
continuam enviando o slug para a API Rails, mantendo isolamento por empresa.

Para producao:

- criar DNS wildcard `*.replymesh.cloud` apontando para a VPS;
- aceitar `*.replymesh.cloud` no Nginx;
- servir o store-template para os subdominios das lojas;
- manter `app.replymesh.cloud` reservado ao Painel Master;
- manter `api.replymesh.cloud` reservado a API Rails.

Dominios proprios foram preparados no banco, mas verificacao DNS e emissao de
SSL automatica permanecem fora desta fase.

## Correcao Motoboys e Recuperador

O painel administrativo de motoboys nao utiliza mais RPCs ou tabelas do
Supabase. Cadastro, historico, ranking, resumo financeiro e ajustes usam os
endpoints Rails da empresa atual.

O Recuperador de Vendas consulta clientes Rails e considera o campo de ultimo
pedido. Quando nenhum cliente completou 7, 15, 30, 60 ou 90 dias sem comprar,
a tela apresenta o estado vazio normalmente.

## Fase 15.20 - Store-template Rails puro nas rotas ativas

As rotas ativas do painel, loja publica, checkout, relatorios, marketing,
recuperador e templates nao dependem mais do Supabase configurado. Os arquivos
antigos do template foram mantidos apenas como referencia historica e nao sao
importados pelo roteador atual.

O Recuperador de Vendas permite selecionar clientes, enviar uma mensagem
individual e criar uma campanha em rascunho usando cinco modelos prontos. O
disparo coletivo continua exigindo confirmacao explicita na pagina Marketing
WhatsApp.

Os relatorios agora usam `GET /api/v1/store/reports`, que calcula no Rails:

- receita recebida e vendas brutas;
- custo salvo nos itens;
- lucro e margem;
- pedidos por status e pagamento;
- produtos mais vendidos;
- vendas por horario.

Permanecem para a infraestrutura publica: webhooks Evolution/Mercado Pago,
scheduler permanente, DNS wildcard, Nginx, SSL e push nativo Android.

## Congelamento local v0.15.21

O store-template foi compilado com sucesso e suas rotas principais foram
verificadas em `127.0.0.1:5174`.

Entradas cobertas pelo smoke:

- loja publica;
- menu;
- carrinho;
- checkout;
- dashboard da loja;
- pedidos;
- login do motoboy.

O isolamento e a autorizacao dessas rotas sao cobertos pelos testes Rails.
Arquivos Supabase historicos permanecem fora das rotas ativas e nao foram
removidos neste congelamento.

Comando:

```powershell
W:\sas replymesh\scripts\smoke_all.ps1
```

Status: `Replymesh Local Stable v0.15.21`.

## Fase 15.22 - carregamento e acabamento

As paginas publicas, administrativas, cozinha e motoboy usam code splitting.
O chunk principal caiu de aproximadamente 631 kB para 73 kB.

Os modulos pesados, incluindo checkout, produtos, relatorios, marketing,
recuperador, configuracoes e mesas, sao baixados somente quando a rota e
aberta.

Os arquivos Supabase historicos permanecem fora do roteador e nao aparecem nos
assets finais. As telas Produtos, Pedidos, Marketing, Recuperador, Relatorios,
Configuracoes e Aplicativo Android foram verificadas sem erros de console.

Localizacao real, webhook Evolution e rastreamento continuam reservados para a
infraestrutura publica.

## Fase 15.23 - Dominios oficiais do store-template

O template permanece compativel com rotas locais `/loja/:slug` e esta preparado
para producao por hostname:

- `demohamburgueria.replymesh.cloud`
- `demopizza.replymesh.cloud`
- qualquer `slug.replymesh.cloud` que nao seja reservado.

Slugs reservados para infraestrutura nao resolvem loja publica:

- `admin`
- `api`
- `app`
- `www`
- `mail`
- `ftp`
- `root`
- `support`
- `master`
- `suporte`

Na VPS, o DNS wildcard `*.replymesh.cloud` deve apontar para o frontend da loja.
O Traefik/Nginx encaminhara esses hosts para o store-template, que extrai o
slug do hostname e chama a API Rails filtrando pela empresa correta.

Dominios proprios ficam preparados no banco, mas verificacao DNS/SSL e ativacao
real permanecem para a Fase 16.

## DEV - Automacao Inteligente / Recovery Intelligence 1.6

A pagina `Marketing > Automacao Inteligente` agora exibe o Recovery como produto
comercial para lojistas:

- indicadores de valor recuperado, valor perdido, clientes recuperados e
  clientes pausados;
- Customer Value medio e Recovery Score medio;
- ranking `Quase comprando`, ordenado por score;
- insights automaticos sobre cupom, frete gratis, IA/template, horario e dia;
- logs com perfil do cliente, chance de recuperacao e decisao comercial;
- conversao por beneficio, por tipo de mensagem e por dia da semana.

A tela continua consumindo as APIs existentes do store-template, sem nova
infraestrutura e sem quebrar compatibilidade.

## DEV - Automacao Inteligente / Recovery Intelligence 1.7

A pagina recebeu uma camada mais operacional para decisao e simulacao:

- cards de carrinhos elegiveis, carrinhos bloqueados e potencial recuperavel;
- top motivo de abandono, top categoria abandonada e horario de maior abandono;
- botao `Simular Recovery`, que mostra score, cupom sugerido, mensagem sugerida
  e decisao sem enviar WhatsApp;
- logs com classificacao do score e motivos resumidos;
- ranking `Quase comprando` exibindo classificacao junto do score.

O envio automatico segue protegido: apenas classificacoes `Alta` e `Muito Alta`
podem sair automaticamente; scores menores ficam registrados para analise.
# Business Intelligence da Loja

O Store Template passa a exibir uma área de Inteligência do Negócio para administradores da loja. A tela consome apenas `/api/v1/store/business_intelligence` e apresenta score, saúde da operação, oportunidades, alertas, recomendações, produtos, categorias e análises de recovery, cupons, delivery, clientes e performance.

O painel não executa ações automaticamente; ele apenas orienta o lojista.
## DEV - Estrategia da Loja / Phase 2.4

O Store Template passa a exibir uma tela de estrategia operacional em
`Admin > Estrategia`, consumindo apenas `/api/v1/store/strategy`.

A tela mostra:

- resumo executivo;
- maior prioridade, maior oportunidade e maior risco;
- indicadores 0-100;
- prioridades consolidadas sem repeticao entre modulos;
- recomendacoes, mudancas recentes, historico e fontes.

A experiencia segue o mesmo design system do painel e nao dispara nenhuma acao
automatica.
