# REPLYMESH DEV — PHASE 2.2 — BUSINESS INTELLIGENCE ENGINE FOUNDATION

Status: implementado na branch `dev`.

## Objetivo

Criar uma camada central de inteligência do negócio para observar dados operacionais da loja e transformar sinais em recomendações comerciais, sem executar ações automaticamente.

## Fluxo

Loja autenticada
→ `GET /api/v1/store/business_intelligence`
→ `BusinessIntelligenceService`
→ `CompanyContextBuilder`
→ `SalesCoachLearningService`
→ `SalesRecoveryLearningEngine`
→ resposta consolidada para o painel da loja.

## Backend

Arquivos principais:

- `replymesh-api/app/services/business_intelligence_service.rb`
- `replymesh-api/app/controllers/api/v1/store/business_intelligence_controller.rb`
- `replymesh-api/app/controllers/api/v1/store/dashboard_controller.rb`
- `replymesh-api/config/routes.rb`
- `replymesh-api/app/services/replymesh_cache_service.rb`

O endpoint retorna:

- `summary`
- `business_score`
- `health`
- `insights`
- `opportunities`
- `warnings`
- `recommendations`
- `top_products`
- `worst_products`
- `best_categories`
- `worst_categories`
- `best_time`
- `best_day`
- `recovery_analysis`
- `coupon_analysis`
- `delivery_analysis`
- `customer_analysis`
- `performance_analysis`
- `generated_at`

## Cache

Grupo criado:

- `business_intelligence`

TTL:

- 60 segundos

O cache é invalidado junto com alterações de:

- empresas/configurações
- horários
- produtos
- categorias
- opcionais de produtos
- pedidos
- cupons
- campanhas
- banners
- roleta
- delivery
- estoque
- IA
- recovery
- sales coach

## Frontend

Arquivos principais:

- `store-template/src/pages/admin/BusinessIntelligence.jsx`
- `store-template/src/services/storeApi.js`
- `store-template/src/app/router.jsx`
- `store-template/src/components/layout/AdminLayout.jsx`
- `store-template/src/pages/admin/Dashboard.jsx`
- `store-template/src/components/dashboard/DashboardStats.jsx`
- `store-template/src/utils/permissions.js`

Criado menu:

- Comunicação → Inteligência do Negócio

Criado card no Dashboard:

- Business Intelligence
- Score do negócio
- Saúde da operação
- Link para a tela completa

## Segurança

Esta fase não armazena nem exibe:

- JWT
- tokens
- senhas
- chaves de API
- Pix
- cartão
- mensagens privadas
- prompts
- respostas brutas de IA

## Compatibilidade

Nenhuma ação automática foi criada.

O serviço apenas observa, analisa e recomenda. Não envia WhatsApp, não cria pedido, não cria cupom, não altera estoque e não executa campanhas.

## Pendências futuras

- Refinar pesos do Business Score com dados reais.
- Exibir comparativos históricos mais ricos.
- Integrar feedback do lojista nas próximas fases.
- Adicionar gráficos somente se já houver biblioteca adequada no projeto.

## Validações

Validações executadas ao final da implementação:

- `ruby -c` nos arquivos Ruby alterados
- `npm run build` no `store-template`
- `npm run build` no `replymesh-frontend`
- `git diff --check`
- auditoria simples de segredos no diff

Hash do commit: preenchido após commit.
