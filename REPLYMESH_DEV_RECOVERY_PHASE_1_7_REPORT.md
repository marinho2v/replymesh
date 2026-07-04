# REPLYMESH DEV - Recovery Intelligence Phase 1.7

## Escopo

Implementacao feita somente na branch `dev`, sem alterar VPS, producao, main,
Evolution, Mercado Pago, Cloudflare R2 ou IA vendedora.

## Auditoria do codigo existente

Foram analisados e reaproveitados:

- `SalesRecoveryEngine`
- `SalesRecoveryEngineJob`
- `SalesRecoveryDeliveryJob`
- `SalesRecoveryIntelligence`
- `SalesRecoverySetting`
- `SalesRecoveryEvent`
- controller `Api::V1::Store::MarketingController`
- pagina `Marketing > Automacao Inteligente`
- servico frontend `marketingWhatsapp`

Nao foi criado fluxo paralelo. A Phase 1.7 evolui a implementacao existente.

## Arquivos alterados

- `replymesh-api/app/services/sales_recovery_intelligence.rb`
- `replymesh-api/app/services/sales_recovery_engine.rb`
- `replymesh-api/app/controllers/api/v1/store/marketing_controller.rb`
- `replymesh-api/app/models/sales_recovery_setting.rb`
- `replymesh-api/config/routes.rb`
- `store-template/src/pages/admin/SalesRecovery.jsx`
- `store-template/src/services/marketingWhatsapp.js`
- `README.md`
- `ROADMAP_REPLYMESH.md`
- `STORE_TEMPLATE_PLAN.md`

## Recovery Score V2

O score passou a considerar mais fatores reais:

- tempo parado;
- valor do carrinho;
- quantidade de itens;
- perfil do cliente;
- ultima compra;
- tempo e volume da conversa;
- origem do atendimento;
- produto premium;
- produto promocional;
- uso anterior de cupom;
- historico de ignorar ou converter recovery;
- horario e dia da semana.

Cada fator possui peso configuravel via JSON de configuracao (`metadata_json`
ou `coupon_rules_json`) com fallback seguro.

## Classificacao automatica

O score agora possui classificacao:

- Muito Alta;
- Alta;
- Media;
- Baixa;
- Muito Baixa.

Somente `Alta` e `Muito Alta` podem gerar envio automatico. Scores menores ficam
registrados como bloqueados com motivo `low_recovery_score`.

## Explicacao do score

Cada evento registra:

- classificacao;
- motivos principais do score;
- breakdown dos fatores;
- pesos aplicados;
- categoria principal do carrinho quando identificada.

Essas informacoes sao exibidas no log da tela da loja.

## Painel e metricas

Foram adicionados indicadores:

- carrinhos elegiveis;
- carrinhos bloqueados;
- potencial recuperavel;
- top motivo de abandono;
- top categoria abandonada;
- top horario de abandono;
- classificacao nos logs;
- classificacao no ranking `Quase comprando`.

## Simulador

Foi criado o endpoint:

`POST /api/v1/store/sales_recovery/simulate`

Ele retorna:

- carrinho analisado;
- Recovery Score;
- classificacao;
- motivos;
- cupom sugerido;
- beneficio sugerido;
- mensagem sugerida;
- timeline;
- se enviaria automaticamente ou nao.

O simulador nao envia WhatsApp e nao cria job de envio.

## Recovery Priority

A fila passou a priorizar:

1. maior score;
2. maior valor;
3. mais tempo parado;
4. cliente recorrente;
5. carrinho mais antigo.

## Performance

Nao foram adicionadas dependencias. A implementacao reaproveita ActiveRecord,
PostgreSQL, ActiveJob e estrutura existente. O processamento continua limitado
a 50 carrinhos por execucao.

## Seguranca

Mantido isolamento por `company_id`. Nao foram adicionados logs de JWT, tokens,
mensagens privadas, prompts, Pix, cartao ou credenciais.

## Validacoes executadas

- `ruby -c` nos arquivos Ruby alterados: OK.
- `npm run build` em `store-template`: OK.
- `npm run build` em `replymesh-frontend`: OK.
- `git diff --check`: OK.
- auditoria de segredos no diff: OK.
- `rails routes`: pendente no ambiente local por gems ausentes no bundle local.

## Pendencias futuras

- criar UI avancada para editar pesos do score;
- mostrar timeline completa em modal;
- evoluir insights com mais volume real;
- criar scheduler permanente somente em etapa futura de infraestrutura.

## Commit

Hash final informado no resumo da execucao, pois o hash muda ao amendar o
proprio relatorio.
