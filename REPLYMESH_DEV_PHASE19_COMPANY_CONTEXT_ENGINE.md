# REPLYMESH DEV — Phase 1.9 — Company Context Engine

## Objetivo

Criar uma base central de contexto da empresa para todos os módulos atuais e futuros de IA da Replymesh, sem alterar comportamento visível, sem mexer em produção, sem VPS e sem main.

## Auditoria realizada

Foram analisados os pontos que hoje montam ou consomem informações da empresa:

- `StoreAiService`
- `StoreAiSalesService`
- `ClaudeAiService`
- `OpenAiCompatibleChatService`
- `GroqAiService`
- `AiProviderService`
- `SalesRecoveryEngine`
- `SalesRecoveryLearningEngine`
- `SalesRecoveryIntelligence`
- `DashboardController`
- `CloudStorageService`
- `ReplymeshCacheService`
- `PerformanceMonitorService`

## Estrutura criada

Novo serviço:

- `CompanyContextBuilder`

Uso principal:

```ruby
CompanyContextBuilder.build(company)
```

O builder retorna um objeto único com:

- dados principais da loja;
- slug e domínio;
- horários;
- timezone;
- cidade e estado;
- logo e banner;
- métodos de pagamento sem expor dados sensíveis;
- entrega e zonas;
- categorias;
- produtos;
- produtos em destaque;
- mais vendidos;
- promoções;
- cupons disponíveis;
- cupom atual de recovery;
- regras comerciais;
- tom e nome da IA;
- campanhas;
- alertas de estoque;
- ticket médio;
- estatísticas de recovery;
- placeholders futuros para `delivery_context`, `sales_context` e `customer_context`.

## Fluxo antigo

Cada módulo montava parte do contexto manualmente:

- IA vendedora buscava nome, tom, loja e pagamentos em pontos diferentes.
- Recovery usava informações próprias da empresa e do carrinho.
- Alguns dados ficavam duplicados entre serviços.

## Fluxo novo

```text
Empresa
  ↓
CompanyContextBuilder
  ↓
ReplymeshCacheService
  ↓
IA Vendedora / Recovery / futuras IAs
```

O comportamento final permanece o mesmo. A mudança é estrutural: a fonte de contexto passa a ser centralizada.

## Cache e invalidação

O contexto utiliza cache com TTL de 5 minutos via `ReplymeshCacheService`.

O cache é invalidado quando há alteração em:

- produtos;
- categorias;
- configurações da loja;
- banners;
- cupons;
- campanhas;
- estoque;
- áreas de entrega;
- horários;
- configuração de IA;
- configuração de Recovery.

## Métricas e monitoramento

O builder registra:

- tempo total de montagem;
- tempo SQL;
- quantidade de queries;
- tamanho aproximado do payload;
- cache hit/miss por meio do `ReplymeshCacheService`.

As métricas entram no Performance Monitor pelo endpoint lógico:

```text
company_context_builder
```

## Segurança

O contexto não inclui:

- JWT;
- senhas;
- tokens;
- API keys;
- segredos;
- dados de cartão;
- chaves Pix;
- payload Pix;
- mensagens privadas;
- prompt bruto;
- resposta bruta da IA.

## Compatibilidade

Compatibilidade preservada:

- IA vendedora continua respondendo pelo fluxo atual.
- Recovery Engine continua usando os mesmos templates e lógica.
- Providers Claude/Groq/OpenAI continuam intactos.
- Nenhuma rota pública foi alterada.
- Nenhuma migration foi criada nesta fase.
- Nenhuma regra de negócio foi removida.

## Arquivos alterados

- `replymesh-api/app/services/company_context_builder.rb`
- `replymesh-api/app/services/store_ai_service.rb`
- `replymesh-api/app/services/store_ai_sales_service.rb`
- `replymesh-api/app/services/sales_recovery_engine.rb`
- `replymesh-api/app/models/app_banner.rb`
- `replymesh-api/app/models/marketing_campaign.rb`
- `replymesh-api/app/models/inventory_item.rb`
- `replymesh-api/app/models/store_ai_setting.rb`
- `replymesh-api/app/models/sales_recovery_setting.rb`
- `README.md`
- `ROADMAP_REPLYMESH.md`
- `REPLYMESH_DEV_PHASE19_COMPANY_CONTEXT_ENGINE.md`

## Validações

- `ruby -c`: OK nos Ruby alterados.
- `rails routes`: pendente por ambiente local sem gems instaladas (`puma`, `bcrypt`, `bootsnap`, `msgpack`, `websocket-driver`, `bigdecimal`, `json`, `prism`, `erb`, `psych`).
- `npm run build` em `store-template`: OK.
- `npm run build` em `replymesh-frontend`: OK.
- `git diff --check`: OK.
- Auditoria simples de segredos no diff: OK, sem chaves encontradas.

## Pendências futuras

- Fazer Delivery AI consumir `delivery_context`.
- Fazer Customer Intelligence consumir `customer_context`.
- Fazer Sales AI Coach consumir `sales_context`.
- Evoluir dashboard para detalhar consumo do contexto por empresa.

## Commit

`Replymesh Add Company Context Engine Foundation`

Hash final: consultar `git log --oneline -1` ou a resposta final desta execução.
