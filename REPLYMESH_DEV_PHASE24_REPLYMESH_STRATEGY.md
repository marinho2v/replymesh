# REPLYMESH DEV — PHASE 2.4 — INTELIGÊNCIA ESTRATÉGICA DA REPLYMESH

## Auditoria realizada

Foram auditados os módulos já existentes que alimentam inteligência na loja:

- `SalesCoachService`
- `BusinessIntelligenceService`
- `SalesRecoveryLearningEngine`
- `ReplymeshBrainService`
- `ReplymeshCacheService`
- `DashboardController`
- telas `SalesCoach`, `BusinessIntelligence` e `DashboardStats`

## Arquitetura utilizada

Foi criado o serviço `ReplymeshStrategyService`.

Ele consulta as inteligências existentes e consolida recomendações parecidas em
uma lista curta de prioridades. O serviço não envia mensagens, não cria cupons,
não altera pedidos e não executa ações automáticas.

## Componentes reutilizados

- Consultor de Vendas
- Análise do Negócio
- Recovery Intelligence
- Cérebro Replymesh
- Cache Replymesh
- Dashboard da loja
- Design System existente do store-template

## Estatísticas e indicadores

A camada estratégica retorna:

- `strategic_score`
- `operational_health`
- `sales_opportunity`
- `risk_level`
- maior prioridade
- maior oportunidade
- maior risco
- confiança da análise

## Cache

Criado grupo:

`replymesh_strategy`

TTL:

`5 minutos`

Invalidado por mudanças em pedidos, produtos, categorias, cupons,
configurações, horários, delivery, recovery, coach, estoque e campanhas.

## API

Novo endpoint:

`GET /api/v1/store/strategy`

Protegido pelo mesmo acesso de dashboard da loja.

## Alterações visuais

Criada tela:

`Admin > Estratégia`

Criado card compacto no dashboard:

`Estratégia da Loja`

O visual segue os cards do painel atual, sem hero, banners ou aparência de
módulo externo de IA.

## Segurança

Não foram adicionados:

- mensagens completas
- prompts
- telefone
- Pix
- cartão
- JWT
- tokens
- API keys
- dados pessoais

A camada usa apenas métricas agregadas e textos de recomendação operacional.

## Validações

Executar ao finalizar:

- `ruby -c`
- `rails db:migrate`
- `rails routes`
- `npm run build` no `store-template`
- `npm run build` no `replymesh-frontend`
- `git diff --check`
- auditoria simples de segredos

## Pendências futuras

- Persistir timeline estratégica histórica em fase futura, se necessário.
- Conectar Phase 2.5 Customer Intelligence ao mesmo serviço.
- Expandir agrupamentos conforme dados reais de uso.
