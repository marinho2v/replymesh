# REPLYMESH DEV — RECOVERY INTELLIGENCE PHASE 1.6

Status: implementado na branch `dev` local.

Produção, VPS e `main` não foram alteradas nesta fase.

## Auditoria do código existente

Arquivos analisados:

- `replymesh-api/app/services/sales_recovery_engine.rb`
- `replymesh-api/app/jobs/sales_recovery_engine_job.rb`
- `replymesh-api/app/jobs/sales_recovery_delivery_job.rb`
- `replymesh-api/app/models/sales_recovery_setting.rb`
- `replymesh-api/app/models/sales_recovery_event.rb`
- `replymesh-api/app/models/customer.rb`
- `replymesh-api/app/controllers/api/v1/store/marketing_controller.rb`
- `store-template/src/pages/admin/SalesRecovery.jsx`
- `store-template/src/services/marketingWhatsapp.js`

O motor existente ja possuia:

- deteccao de carrinhos abandonados da IA;
- cooldown por cliente;
- bloqueio por resposta recente;
- bloqueio quando a conversa da IA ainda esta ativa;
- janela de envio;
- horario de silencio;
- limite diario;
- limite por cliente;
- templates variados;
- IA opcional;
- geracao automatica de cupom;
- envio pelo `MarketingMessageService` e Evolution existentes;
- logs por empresa.

Nenhuma funcionalidade existente foi removida.

## Alterações realizadas

### Customer Value Score

Criado score permanente por cliente:

- `customer_value_score`
- `customer_segment`
- `customer_value_score_calculated_at`
- `recovery_reputation_json`

Critérios usados:

- quantidade de pedidos;
- ticket medio;
- valor total gasto;
- recencia da ultima compra;
- frequencia de compra;
- tempo como cliente;
- uso de cupons.

Segmentos:

- `new`
- `active`
- `recurring`
- `vip`

### Recovery Score

O score do carrinho agora considera:

- valor do carrinho;
- quantidade de itens;
- tempo abandonado;
- perfil do cliente;
- customer value;
- reputacao recente;
- horario e dia da semana.

### Decisão automática de benefício

O novo serviço `SalesRecoveryIntelligence` decide:

- lembrar sem desconto;
- cupom percentual;
- frete gratis;
- bloquear por cliente pausado.

Exemplos:

- carrinho baixo: lembrete sem desconto;
- cliente VIP: lembrete sem desconto para preservar margem;
- carrinho alto: frete gratis;
- cliente novo: cupom inicial.

### Reputação e antispam

O sistema calcula:

- mensagens enviadas;
- mensagens recuperadas;
- mensagens ignoradas;
- falhas;
- bloqueios;
- conversao;
- pausa automatica quando o cliente ignora muitas recuperacoes.

### Aprendizado estatístico

Eventos recuperados registram:

- `conversion_minutes`;
- beneficio escolhido;
- segmento do cliente;
- customer value no momento;
- reputacao sanitizada.

Nao ha treinamento de modelo. O aprendizado e estatistico.

### Insights

Criados insights automaticos para:

- carrinhos de maior valor;
- comparacao entre frete gratis e cupom;
- comparacao entre IA e template;
- valor recuperado no periodo.

### Dashboard

A tela da loja recebeu:

- Valor perdido;
- Customer Value medio;
- Clientes recuperados;
- Tempo medio ate compra;
- Frete gratis utilizado;
- Clientes pausados;
- ranking `Quase comprando`;
- insights automaticos;
- conversao por beneficio;
- conversao por IA/template;
- conversao por dia da semana.

## Segurança

Novos campos não registram:

- JWT;
- senhas;
- tokens;
- API Keys;
- Pix;
- cartao;
- prompts;
- respostas da IA;
- conteudo de mensagens;
- telefone em metadata nova.

Observacao: campos antigos como `sales_recovery_events.customer_phone` e
`sales_recovery_events.message` foram preservados por compatibilidade e nao
foram expandidos.

## Performance

- O motor continua usando ActiveJob existente.
- Nenhuma dependencia nova foi instalada.
- Nenhum Redis, Sidekiq, RabbitMQ ou servico externo foi adicionado.
- Consultas do dashboard usam agregacoes por empresa.
- Eventos recentes sao limitados e ordenados por score.
- O score do cliente e persistido para reuso futuro.

## Arquivos alterados

- `replymesh-api/app/controllers/api/v1/store/marketing_controller.rb`
- `replymesh-api/app/models/customer.rb`
- `replymesh-api/app/models/sales_recovery_event.rb`
- `replymesh-api/app/services/sales_recovery_engine.rb`
- `replymesh-api/app/services/sales_recovery_intelligence.rb`
- `replymesh-api/db/migrate/20260701110000_add_recovery_intelligence_metrics.rb`
- `replymesh-api/db/schema.rb`
- `store-template/src/pages/admin/SalesRecovery.jsx`
- `README.md`
- `ROADMAP_REPLYMESH.md`
- `STORE_TEMPLATE_PLAN.md`

## Validações executadas

Executado com sucesso:

- `ruby -c replymesh-api/app/services/sales_recovery_intelligence.rb`
- `ruby -c replymesh-api/app/services/sales_recovery_engine.rb`
- `ruby -c replymesh-api/app/controllers/api/v1/store/marketing_controller.rb`
- `ruby -c replymesh-api/app/models/customer.rb`
- `ruby -c replymesh-api/app/models/sales_recovery_event.rb`
- `ruby -c replymesh-api/db/migrate/20260701110000_add_recovery_intelligence_metrics.rb`
- `npm run build` em `store-template`
- `npm run build` em `replymesh-frontend`
- `git diff --check`
- `/up` local retornou `200`
- loja publica QA retornou `200`
- Master sem token retornou `401`, comportamento esperado
- banco local/dev preservou `9` empresas antes e depois da migration

Validação com pendência técnica local:

- `bundle exec rails routes`
- `bundle exec rails runner`

Motivo: o bundle Ruby local esta incompleto e retornou `Bundler::GemNotFound`
para gems como `puma`, `bcrypt`, `bootsnap`, `msgpack`, `json`, `psych` e
outras. A API local estava em execucao e foi validada via HTTP.

## Pendências futuras

- Criar testes automatizados específicos para `SalesRecoveryIntelligence`.
- Exibir graficos mais ricos somente quando houver volume real de eventos.
- Avaliar scheduler permanente apenas na etapa de infraestrutura/VPS.
- Nao iniciar Fase 2 sem autorizacao.
