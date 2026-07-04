# REPLYMESH DEV — AUTOMATION ENGINE PHASE 1 REPORT

## Status

Implementacao realizada na branch `dev`, sem alterar `main`, producao ou VPS.

## Auditoria antes da implementacao

- Recuperador manual existente: `Api::V1::Store::MarketingController#recovery_customers`.
- Envio WhatsApp existente: `MarketingMessageService`, usando `WhatsappInstance` e `EvolutionGoClient`.
- Campanhas existentes: `MarketingCampaign`, `MarketingCampaignRecipient` e `MarketingMessageLog`.
- Cupons existentes: `Coupon`, com `source`, `customer_id`, validade, uso unico e contador.
- IA da loja existente: `StoreAiService`, `StoreAiSalesService`, `StoreAiSetting`, `AiGlobalSetting` e providers Claude/Groq/OpenAI.
- Carrinho da IA existente: `StoreAiCart`, multiempresa e vinculado a `StoreAiConversation`.
- Dashboard da loja existente: `DashboardController`.
- Feature gate existente: chave interna `sales_recovery`.
- Multiempresa preservado via `current_company` e relacoes por `company_id`.

## Arquitetura criada

### Backend

- `SalesRecoverySetting`
  - configuracao por empresa;
  - janela de envio;
  - dias permitidos;
  - limite diario;
  - uso de IA;
  - cupom automatico;
  - frete gratis;
  - template opcional.

- `SalesRecoveryEvent`
  - log por carrinho/cliente;
  - status da fila;
  - mensagem enviada;
  - cupom;
  - erro;
  - conversao;
  - snapshot do carrinho.

- `SalesRecoveryEngine`
  - localiza carrinhos da IA com itens e sem finalizacao;
  - valida janela, dias e limites;
  - impede recuperar o mesmo carrinho duas vezes;
  - gera cupom unico quando habilitado;
  - usa IA quando configurada;
  - usa templates variados quando IA nao esta disponivel;
  - envia pelo `MarketingMessageService`;
  - atualiza logs e conversoes.

- `SalesRecoveryEngineJob`
  - usa ActiveJob padrao do Rails;
  - sem Redis, Sidekiq, RabbitMQ ou nova infraestrutura.

- `SalesRecoveryDeliveryJob`
  - agenda cada mensagem individualmente;
  - respeita o intervalo gradual configurado;
  - valida novamente empresa, status, dia e janela antes do envio.

### Frontend

- Pagina `Marketing > Automacao Inteligente`.
- Cards:
  - Hoje recuperados;
  - Carrinhos recuperados;
  - Valor recuperado;
  - Mensagens enviadas;
  - Taxa recuperacao;
  - Cupons usados.
- Configuracoes:
  - recuperador ativo;
  - tempo sem finalizar;
  - limite diario;
  - janela de envio;
  - dias permitidos;
  - IA ligada/desligada;
  - cupom automatico;
  - desconto padrao;
  - frete gratis;
  - validade do cupom;
  - template opcional.
- Logs:
  - cliente;
  - telefone;
  - carrinho;
  - status;
  - cupom;
  - mensagem;
  - erro;
  - valor;
  - data.

## Fluxo

1. Cliente conversa com a IA e monta carrinho.
2. Carrinho fica parado pelo tempo configurado.
3. ActiveJob chama o motor da empresa.
4. Motor valida janela, dia e limite.
5. Motor verifica se o carrinho ja foi recuperado.
6. Motor gera cupom quando habilitado.
7. Motor cria mensagem via IA ou template seguro.
8. Motor envia via Evolution existente.
9. Evento fica registrado.
10. Se houver pedido com o cupom, o evento vira `recovered`.

## Servicos reaproveitados

- `MarketingMessageService`
- `EvolutionGoClient`
- `AiProviderService`
- `AiGlobalSetting`
- `Coupon`
- `StoreAiCart`
- `FeatureGate`

## Validacoes executadas

- Sintaxe Ruby validada em todos os arquivos Ruby alterados.
- Build do `store-template` concluido com sucesso.
- Build do `replymesh-frontend` concluido com sucesso.
- `git diff --check` concluido sem erros.
- Auditoria de segredos concluida sem chaves novas no diff.
- Migration aplicada somente no banco local de desenvolvimento.
- As 9 empresas locais foram preservadas, sem reset, seed ou substituicao de dados.
- Loja publica `qa-pizza` validada com resposta HTTP 200.
- Rotas protegidas do Master e da automacao retornam 401 sem autenticacao, conforme esperado.
- Loja QA validada visualmente apos a migration.
- Consulta do dashboard da automacao mantida somente leitura.
- Entrega gradual preparada com ActiveJob por evento.
- Protecao contra recuperacao duplicada por empresa e carrinho.
- Isolamento multiempresa mantido por `company_id`.

## Validacoes dependentes de integracoes

- Nenhuma mensagem foi enviada para cliente real.
- Nenhuma chamada real de IA ou Evolution foi executada nesta etapa.
- O endpoint de execucao controlada permite teste posterior em empresa QA.
- A conversao sera confirmada quando um pedido real utilizar o cupom unico do evento.
- O scheduler permanente deve ser configurado em fase operacional futura, sem nova infraestrutura nesta fase.

## Pendencias futuras — Fase 2

- Jornadas inteligentes por comportamento.
- Recuperacao por produto/categoria.
- Campanhas de recompra.
- Playbooks automaticos.
- Segmentacao avancada.
- Scheduler permanente de infraestrutura, se necessario.

## Arquivos principais alterados

- `replymesh-api/db/migrate/20260701090000_create_sales_recovery_automation.rb`
- `replymesh-api/app/models/sales_recovery_setting.rb`
- `replymesh-api/app/models/sales_recovery_event.rb`
- `replymesh-api/app/services/sales_recovery_engine.rb`
- `replymesh-api/app/jobs/sales_recovery_engine_job.rb`
- `replymesh-api/app/jobs/sales_recovery_delivery_job.rb`
- `replymesh-api/app/controllers/api/v1/store/marketing_controller.rb`
- `replymesh-api/config/routes.rb`
- `store-template/src/pages/admin/SalesRecovery.jsx`
- `store-template/src/services/marketingWhatsapp.js`
- `store-template/src/components/layout/AdminLayout.jsx`

## Hash do commit

`feecef8` — Replymesh Add AI Sales Recovery Automation Engine

---

# Phase 1.5 — Inteligencia e Seguranca do Recovery Engine

## Status

Consolidacao feita somente na branch `dev`, sem iniciar Phase 2, sem alterar `main`, sem deploy e sem mexer na VPS/producao.

## Auditoria da base Phase 1

- `SalesRecoveryEngine` revisado para manter o fluxo existente de carrinho abandonado, cupom, IA/template, fila e envio.
- `SalesRecoveryEngineJob` e `SalesRecoveryDeliveryJob` preservados sem criar scheduler novo.
- `SalesRecoverySetting` e `SalesRecoveryEvent` foram expandidos com campos de controle, sem remover campos existentes.
- Integracoes existentes com Evolution, IA, cupons e `MarketingMessageService` foram reaproveitadas.
- Tela da loja em `Marketing > Automacao Inteligente` foi mantida e ampliada com configuracoes e metricas simples.

## Melhorias implementadas

- Deteccao de abandono mais segura considerando carrinho com itens, valor minimo, conversa ativa, resposta recente do cliente, pedido ja criado, cooldown e limite por empresa/cliente.
- Antispam com cooldown configuravel por cliente, bloqueio de duplicidade por carrinho e registro de motivo quando a recuperacao nao pode ser enviada.
- Score interno de recuperacao de 0 a 100 baseado em valor, quantidade de itens, tempo parado, perfil do cliente e metodo de pagamento.
- Cupons mais inteligentes com regras configuraveis para carrinho baixo, carrinho alto, primeira compra e cliente recorrente com frete gratis opcional.
- IA recebe contexto ampliado: loja, cliente, itens, valor, beneficio real, cupom, historico resumido e link da loja.
- Biblioteca sem IA ampliada para 20 templates, evitando repeticao constante.
- Horarios protegidos: janela de envio, dias permitidos, horario de silencio e horario operacional da loja.
- Logs ampliados com score, motivo de bloqueio, cupom, tempo parado, estrategia de envio, envio realizado/bloqueado e erros.
- Dashboard ampliado com mensagens bloqueadas, score medio, cupom mais usado e ticket recuperado medio.
- Revalidacao do job corrigida para nao bloquear o proprio evento `queued` por cooldown/duplicidade.

## Seguranca multiempresa

- Todas as consultas continuam partindo de `@company` ou `current_company`.
- Eventos e configuracoes continuam vinculados a `company_id`.
- Nenhuma empresa acessa eventos, cupons ou carrinhos de outra.
- Nenhuma mensagem real foi disparada durante esta validacao local.

## Performance

- Candidatos limitados a 50 carrinhos por execucao.
- Uso de `includes(:store_ai_conversation)` mantido no motor.
- Logs da tela carregam relacoes principais com `includes(:coupon, :customer, :store_ai_cart)`.
- Nenhum polling novo, Redis, Sidekiq ou infraestrutura extra foi criada.

## Validacoes Phase 1.5

- `ruby -c` executado nos arquivos Ruby alterados: OK.
- `npm run build` em `store-template`: OK.
- `npm run build` em `replymesh-frontend`: OK.
- `git diff --check`: OK.
- Auditoria de segredos no diff: sem chaves novas identificadas.
- RSpec dedicado do Recovery Engine ainda nao existe; tentativa do spec relacionado foi bloqueada por gems locais ausentes (`puma`, `bcrypt`, `bootsnap`, entre outras).
- A fase ficou validada por sintaxe, build, `git diff --check`, auditoria de segredos e revisao do fluxo.

## Arquivos alterados na Phase 1.5

- `replymesh-api/db/migrate/20260701093000_harden_sales_recovery_automation.rb`
- `replymesh-api/db/schema.rb`
- `replymesh-api/app/models/sales_recovery_setting.rb`
- `replymesh-api/app/models/sales_recovery_event.rb`
- `replymesh-api/app/services/sales_recovery_engine.rb`
- `replymesh-api/app/controllers/api/v1/store/marketing_controller.rb`
- `store-template/src/pages/admin/SalesRecovery.jsx`

## Pendencias para Phase 2

- Criar specs dedicados para cenarios completos do Recovery Engine.
- Testar envio real em empresa QA com Evolution controlado.
- Testar IA real em empresa QA com provedor configurado.
- Medir conversao real por cupom apos pedidos reais de teste.

## Hash do commit Phase 1.5

`4995273` — Replymesh Harden Sales Recovery Automation Engine
