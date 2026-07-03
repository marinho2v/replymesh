# REPLYMESH DEV — PHASE 2.5 — CUSTOMER INTELLIGENCE

## Resumo

A Phase 2.5 criou a base de Inteligencia de Clientes da Replymesh. O modulo observa dados comerciais existentes da loja e classifica clientes em perfis, scores, riscos, oportunidades e preferencias, sem enviar mensagens, campanhas ou executar acoes automaticas.

## Arquitetura

- Backend: `CustomerIntelligenceService`.
- API: `GET /api/v1/store/customer_intelligence`.
- Cache: grupo `customer_intelligence`, TTL de 5 minutos.
- Frontend: tela `Marketing > Inteligencia de Clientes`.
- Dashboard: card compacto `Clientes Inteligentes`.

## Dados analisados

- Pedidos.
- Valor gasto.
- Ticket medio.
- Frequencia.
- Produtos favoritos.
- Categorias favoritas.
- Forma de pagamento.
- Delivery ou retirada.
- Uso de cupons.
- Recovery.
- Dias e horarios de compra.
- Tempo sem comprar.

## Perfis calculados

- Novo.
- Ativo.
- Recorrente.
- VIP.
- Em risco.
- Inativo.
- Perdido.

## Customer Score

O `Customer Score` varia de 0 a 100 e considera frequencia, valor, recencia, fidelidade e engajamento comercial.

## Atributos comerciais

O servico identifica sinais como:

- Cliente Premium.
- Sensivel a desconto.
- Compra por impulso.
- Compra somente fim de semana.
- Compra somente almoco.
- Compra somente jantar.
- Prefere retirada.
- Prefere delivery.
- Cliente sazonal.
- Cliente recorrente.

## Risco e oportunidade

O modulo calcula:

- Chance de abandono: Baixa, Media, Alta, Muito Alta.
- Potencial de crescimento: Baixo, Medio, Alto, Muito Alto.

## Integracoes

- Dashboard da loja.
- Estrategia da Loja.
- Recovery.
- Cerebro Replymesh.
- Business Intelligence.
- Consultor de Vendas.

Nenhum comportamento existente foi alterado; o modulo apenas fornece leitura e inteligencia.

## Seguranca

O modulo nao retorna nem armazena:

- mensagens;
- telefone;
- Pix;
- cartao;
- JWT;
- tokens;
- prompts;
- API keys;
- dados sensiveis.

O payload usa somente metricas comerciais e identificadores internos necessarios para operacao.

## Arquivos alterados

- `replymesh-api/app/controllers/api/v1/store/customer_intelligence_controller.rb`
- `replymesh-api/app/controllers/api/v1/store/dashboard_controller.rb`
- `replymesh-api/app/models/category.rb`
- `replymesh-api/app/models/coupon.rb`
- `replymesh-api/app/models/customer.rb`
- `replymesh-api/app/models/order.rb`
- `replymesh-api/app/models/order_item.rb`
- `replymesh-api/app/models/product.rb`
- `replymesh-api/app/models/sales_recovery_event.rb`
- `replymesh-api/app/services/customer_intelligence_service.rb`
- `replymesh-api/app/services/replymesh_cache_service.rb`
- `replymesh-api/app/services/replymesh_strategy_service.rb`
- `replymesh-api/config/routes.rb`
- `store-template/src/app/router.jsx`
- `store-template/src/components/dashboard/DashboardStats.jsx`
- `store-template/src/components/layout/AdminLayout.jsx`
- `store-template/src/pages/admin/CustomerIntelligence.jsx`
- `store-template/src/pages/admin/Dashboard.jsx`
- `store-template/src/services/storeApi.js`
- `store-template/src/utils/permissions.js`
- `README.md`
- `ROADMAP_REPLYMESH.md`
- `STORE_TEMPLATE_PLAN.md`

## Validacoes

As validacoes devem confirmar:

- `ruby -c` nos arquivos Ruby alterados.
- `rails routes`.
- `npm run build` no `store-template`.
- `npm run build` no `replymesh-frontend`.
- `git diff --check`.
- Auditoria simples de segredos.

## Pendencias futuras

- Usar estes perfis para Product Intelligence.
- Usar estes perfis para Marketing Intelligence.
- Usar estes perfis para Delivery Intelligence.
- Conectar futuras automacoes apenas depois de autorizacao explicita.

