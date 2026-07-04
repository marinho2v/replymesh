# REPLYMESH DEV — PHASE 2.1 — COACH INTELIGENTE LEARNING ADVISOR

## Status

Implementado na branch `dev`.

Esta fase evolui o AI Sales Coach para aprender com o feedback do dono da loja, sem executar acoes automaticamente e sem criar infraestrutura paralela.

## Auditoria realizada

Foram analisados e reaproveitados:

- `SalesCoachService`
- `SalesRecoveryLearningEngine`
- `SalesRecoveryEngine`
- `CompanyContextBuilder`
- `ReplymeshCacheService`
- `DashboardController`
- tela `SalesCoach.jsx`
- service frontend `marketingWhatsapp.js`

## Arquitetura criada

### `SalesCoachInsight`

Nova tabela/modelo para persistir recomendacoes do coach por empresa.

Campos principais:

- ID publico do insight
- chave estavel
- titulo
- descricao
- categoria
- prioridade
- impacto estimado
- confianca
- motivo
- origem
- acao sugerida
- status
- resultado do feedback
- impacto confirmado
- metadados seguros

### `SalesCoachLearningService`

Camada acima do `SalesCoachService`.

Responsabilidades:

- gerar insights usando a base existente;
- persistir recomendacoes por empresa;
- anexar status e feedback aos insights;
- montar historico de aprendizado;
- calcular `Coach Score`;
- montar bloco `learning_advisor`;
- invalidar cache de dashboard, coach e aprendizado.

## Status dos insights

Suportado:

- `new`
- `viewed`
- `accepted`
- `ignored`
- `archived`
- `manual_executed`

## Feedback suportado

Suportado:

- `worked`
- `not_worked`

## Endpoint criado

```http
PATCH /api/v1/store/sales_coach/insights/:id
```

Payload:

```json
{
  "status": "accepted",
  "result": "worked",
  "impact_cents": 1000
}
```

O endpoint respeita `current_company` e nao permite acesso entre empresas.

## Dashboard / UI

Tela atualizada:

- `Marketing > AI Sales Coach`

Adicionado:

- Coach Score
- Coach Inteligente
- oportunidades priorizadas
- proxima melhor acao
- historico de aprendizado
- botoes de feedback por insight

## Cache

Novo grupo:

- `sales_coach_learning`

TTL:

- 90 segundos no service
- 2 minutos no `ReplymeshCacheService`

Invalidacao integrada em:

- pedidos
- produtos
- categorias
- cupons
- campanhas
- Recovery
- configuracoes de IA
- feedback do coach

## Seguranca

Nao sao armazenados:

- JWT
- senhas
- tokens
- API keys
- Pix
- cartao
- prompts
- respostas privadas da IA
- mensagens privadas
- telefone de cliente

## Compatibilidade

O `SalesCoachService` original permanece como gerador base.

O `SalesCoachLearningService` apenas adiciona aprendizado, persistencia e feedback por cima da arquitetura existente.

Nenhuma regra de negocio foi alterada.

Nenhuma automacao foi criada.

Nenhum deploy foi executado.

## Arquivos alterados

- `replymesh-api/db/migrate/20260702090000_create_sales_coach_insights.rb`
- `replymesh-api/app/models/sales_coach_insight.rb`
- `replymesh-api/app/models/company.rb`
- `replymesh-api/app/models/order.rb`
- `replymesh-api/app/models/product.rb`
- `replymesh-api/app/models/category.rb`
- `replymesh-api/app/models/coupon.rb`
- `replymesh-api/app/models/marketing_campaign.rb`
- `replymesh-api/app/models/sales_recovery_setting.rb`
- `replymesh-api/app/models/sales_recovery_event.rb`
- `replymesh-api/app/models/store_ai_setting.rb`
- `replymesh-api/app/services/replymesh_cache_service.rb`
- `replymesh-api/app/services/sales_coach_learning_service.rb`
- `replymesh-api/app/controllers/api/v1/store/marketing_controller.rb`
- `replymesh-api/app/controllers/api/v1/store/dashboard_controller.rb`
- `replymesh-api/config/routes.rb`
- `store-template/src/services/marketingWhatsapp.js`
- `store-template/src/pages/admin/SalesCoach.jsx`
- `README.md`
- `ROADMAP_REPLYMESH.md`
- `STORE_TEMPLATE_PLAN.md`

## Pendencias futuras

- Usar historico de feedback para alterar pesos dos insights automaticamente.
- Criar comparativos por periodo de recomendacoes aceitas.
- Medir impacto real automaticamente a partir de pedidos posteriores.
- Adicionar filtros avancados de status no painel.

## Validacoes

- `ruby -c` nos arquivos Ruby alterados: OK.
- `rails routes`: pendente no ambiente local por gems ausentes no bundle (`aws-sdk-s3`, `mini_magick`, `aws-sdk-core`, `aws-sdk-kms`, `aws-sigv4`, `aws-eventstream`, `aws-partitions`, `jmespath`).
- `npm run build` no `store-template`: OK.
- `npm run build` no `replymesh-frontend`: OK.
- `git diff --check`: OK.
- Auditoria de segredos no diff: OK, sem chaves novas.

## Hash do commit

Preencher apos commit.
