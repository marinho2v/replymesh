# REPLYMESH DEV - Recovery Learning Engine Phase 1.8

## Escopo

Implementacao feita somente na branch `dev`.

Nao foi alterado:

- VPS;
- producao;
- branch `main`;
- Evolution;
- Mercado Pago;
- Cloudflare R2;
- IA vendedora;
- banco de producao.

## Auditoria

Foram analisados e reaproveitados:

- `SalesRecoveryEngine`
- `SalesRecoveryIntelligence`
- `Recovery Score`
- `Recovery Simulation`
- `SalesRecoveryEvent`
- `SalesRecoverySetting`
- tela `Marketing > Automacao Inteligente`
- servico frontend `marketingWhatsapp`

Nao foi criado fluxo paralelo. A Phase 1.8 usa os eventos existentes e adiciona
aprendizado estatistico sobre eles.

## Arquivos alterados

- `replymesh-api/app/services/sales_recovery_learning_engine.rb`
- `replymesh-api/app/services/sales_recovery_engine.rb`
- `replymesh-api/app/controllers/api/v1/store/marketing_controller.rb`
- `replymesh-api/config/routes.rb`
- `store-template/src/services/marketingWhatsapp.js`
- `store-template/src/pages/admin/SalesRecovery.jsx`
- `README.md`
- `ROADMAP_REPLYMESH.md`

## Endpoint criado

`GET /api/v1/store/recovery/insights`

Retorna:

- melhor estrategia;
- melhor horario;
- melhor dia;
- melhor template;
- melhor cupom;
- categoria com maior abandono;
- categoria com maior recuperacao;
- tempo medio ate compra;
- taxa geral;
- top 5 estrategias;
- conversao por IA;
- conversao por template;
- tendencia.

## Fluxo de aprendizado

O sistema passa a registrar automaticamente no `metadata_json` dos eventos:

- recovery enviado;
- recovery ignorado;
- recovery convertido;
- recovery respondido sem compra;
- pedido gerado com cupom;
- pedido gerado sem cupom;
- tempo ate responder;
- tempo ate comprar;
- horario;
- dia da semana;
- tipo do carrinho;
- categoria principal;
- template/estrategia utilizada;
- score e classificacao.

## Aprendizado estatistico

Foi criado `SalesRecoveryLearningEngine`.

Ele compara estatisticamente:

- templates;
- mensagens com IA vs templates;
- tipo de beneficio;
- cupom percentual;
- frete gratis;
- horarios;
- dias da semana;
- categorias.

Nao usa machine learning pesado. Nao usa Redis. Nao usa servico externo.

## Painel

Foi adicionado o card `Recovery Insights` na tela:

`Marketing > Automacao Inteligente`

Exibe:

- melhor estrategia;
- melhor horario;
- melhor dia;
- cupom campeao;
- conversao IA;
- conversao template;
- categoria mais recuperada;
- tendencia;
- top 5 estrategias.

## Performance

- Reaproveita ActiveRecord e PostgreSQL.
- Usa `Rails.cache` com expiracao curta.
- Nao aumenta polling.
- Nao cria scheduler novo.
- Nao registra mensagens completas.

## Seguranca

Nao armazena:

- JWT;
- token;
- API Key;
- Pix;
- cartao;
- credenciais;
- prompt;
- mensagens completas.

## Validacoes executadas

- `ruby -c` nos arquivos Ruby alterados: OK.
- `npm run build` em `store-template`: OK.
- `npm run build` em `replymesh-frontend`: OK.
- `git diff --check`: OK.
- auditoria de segredos no diff: OK.
- `rails routes`: pendente no ambiente local por gems ausentes no bundle local
  (`puma`, `bcrypt`, `bootsnap`, `msgpack`, `websocket-driver`, entre outras).

## Pendencias futuras

- criar tela avancada com historico detalhado por estrategia;
- permitir comparar periodos no painel;
- usar os insights para sugerir configuracoes automaticamente;
- manter Phase 2 separada e somente com nova autorizacao.
