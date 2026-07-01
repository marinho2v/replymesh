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
