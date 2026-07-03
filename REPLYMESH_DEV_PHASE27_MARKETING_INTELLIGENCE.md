# REPLYMESH DEV — PHASE 2.7 — MARKETING INTELLIGENCE

## Objetivo

Criar a camada de Inteligência de Marketing da ReplyMesh sem executar campanhas,
sem disparar WhatsApp, sem criar cupons automaticamente e sem alterar dados da
loja. O módulo apenas observa as inteligências existentes e recomenda ações
comerciais.

## Arquitetura

Foi criado o serviço `MarketingIntelligenceService`, responsável por consolidar
fontes já existentes:

- Cérebro da ReplyMesh;
- Estratégia da Loja;
- Consultor de Vendas;
- Análise do Negócio;
- Inteligência de Clientes;
- Inteligência de Produtos;
- Recovery Learning.

O serviço calcula um snapshot comercial com:

- Marketing Score;
- melhor campanha;
- melhor horário;
- melhor dia;
- produto indicado para campanha;
- produto que deve ser protegido;
- categoria indicada;
- público prioritário;
- potencial estimado;
- confiança da recomendação;
- recomendações priorizadas;
- oportunidades de produtos, categorias e segmentos.

## Endpoint

Criado:

```text
GET /api/v1/store/marketing_intelligence
```

O endpoint retorna apenas métricas comerciais agregadas e recomendações. Ele não
retorna telefone, mensagens, Pix, cartão, tokens, prompts, respostas de IA ou
dados sensíveis.

## Cache

Criado grupo:

```text
marketing_intelligence
```

TTL:

```text
5 minutos
```

O cache é invalidado junto com alterações operacionais relevantes, como pedidos,
produtos, categorias, clientes, cupons, configurações, IA, Recovery e banners.

## Dashboard

Adicionado card compacto:

```text
Marketing Inteligente
```

O card exibe:

- campanha recomendada;
- produto prioritário;
- melhor horário;
- potencial;
- Marketing Score;
- atalho para a tela completa.

## Tela criada

Criada tela:

```text
Admin > Cérebro da ReplyMesh > Inteligência de Marketing
```

Rota:

```text
/admin/marketing-intelligence
```

A tela exibe:

- resumo executivo;
- métricas principais;
- recomendações;
- tipos de campanha sugeridos;
- clientes prioritários;
- produtos recomendados;
- calendário comercial.

## Performance

O módulo reaproveita serviços existentes e usa cache de curta duração para
evitar cálculos repetidos. Não instala Redis, Sidekiq, filas externas ou novos
serviços.

## Segurança

O módulo não armazena nem retorna:

- telefone;
- mensagens;
- Pix;
- cartão;
- JWT;
- tokens;
- API Keys;
- prompts;
- respostas da IA;
- dados pessoais.

## Arquivos alterados

- `replymesh-api/app/services/marketing_intelligence_service.rb`
- `replymesh-api/app/controllers/api/v1/store/marketing_intelligence_controller.rb`
- `replymesh-api/config/routes.rb`
- `replymesh-api/app/services/replymesh_cache_service.rb`
- `replymesh-api/app/controllers/api/v1/store/dashboard_controller.rb`
- modelos com invalidação de cache operacional
- `store-template/src/pages/admin/MarketingIntelligence.jsx`
- `store-template/src/services/storeApi.js`
- `store-template/src/app/router.jsx`
- `store-template/src/components/layout/AdminLayout.jsx`
- `store-template/src/utils/permissions.js`
- `store-template/src/components/dashboard/DashboardStats.jsx`
- `store-template/src/pages/admin/Dashboard.jsx`
- `README.md`
- `ROADMAP_REPLYMESH.md`
- `STORE_TEMPLATE_PLAN.md`

## Validações

Validações executadas:

- `ruby -c` nos arquivos Ruby alterados: aprovado;
- `npm run build` no `store-template`: aprovado;
- `npm run build` no `replymesh-frontend`: aprovado;
- `git diff --check`: aprovado;
- auditoria simples de segredos no diff: sem chaves ou tokens encontrados;
- `rails routes`: pendente no ambiente local por gems ausentes no Bundler
  (`puma`, `bcrypt`, `bootsnap`, `msgpack`, `websocket-driver`, `json`,
  entre outras);
- `rails db:migrate`: pendente pelo mesmo motivo de ambiente local.

## Pendências futuras

- permitir que a Inteligência de Marketing alimente futuras fases de Delivery
  Intelligence, Sales Intelligence e Decision Engine;
- criar execução assistida de campanhas somente em fase futura e com autorização
  explícita;
- enriquecer recomendações quando houver maior volume histórico por segmento.

## Commit

```text
85a0866 Replymesh Add Marketing Intelligence Phase 2.7
```
