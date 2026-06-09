# REPLYMESH FASE 16.10 - PARIDADE PRODUCAO, PIX E EVOLUTION

Data: 2026-06-08/09

## Resultado

FASE 16.10 CONCLUIDA com uma validacao externa pendente: envio real de
localizacao pela instancia `replymesh_demohamburgueria_qr`.

Nenhuma mensagem WhatsApp real foi enviada durante esta fase.

## Mercado Pago / Pix

- Causa encontrada: o Mercado Pago retornava `approved`, mas o Rails tentava
  executar `pending -> accepted` enquanto o template `pedido_aceito` estava
  desativado.
- A maquina de fluxo retornava:
  `Transicao invalida: pending -> accepted. Permitidas: cancelled`.
- O endpoint de polling devolvia HTTP 500 a cada cinco segundos e revertia a
  transacao inteira.
- Correcao: o processador Pix pode executar a transicao canonica
  `pending -> accepted` mesmo quando o template WhatsApp da etapa esta
  desativado.
- O template continua desativado e nenhum envio WhatsApp foi liberado.
- Os dois pagamentos Pix aprovados que estavam presos foram reconciliados.
- Estado final dos pedidos Pix auditados: `payment_status=paid` e
  `status=accepted`.
- O endpoint de status passou a responder HTTP 200.

## Painel Mercado Pago

- Removidos da interface do cliente:
  - Webhook Secret.
  - URL de webhook.
  - Instrucao para configuracao manual de webhook.
- Permanecem:
  - Public Key.
  - Access Token mascarado depois de salvo.
  - Seletor Mercado Pago automatico.
- `npm run build`: OK.
- Build publicado no Store: OK.
- Validacao visual em producao: OK.

## API Rails

- Container ativo: `replymesh-rails-api`.
- Imagem final desta fase: `replymesh-api:v0.15.24-rc3`.
- Comando preservado: `./bin/rails server -b 0.0.0.0`.
- Rede preservada: `host`.
- Restart policy preservada: `unless-stopped`.
- `/up`: HTTP 200.
- Nenhuma migration executada.
- Nenhum seed executado.
- Nenhum reset/drop de banco executado.

Backups:

- `/root/replymesh-backups/phase-16-10-pix-20260608-234858`
- `/root/replymesh-backups/phase-16-10-store-20260608-235331`
- `/root/replymesh-backups/phase-16-10-evolution-20260609-000337`
- `/root/replymesh-backups/phase-16-10-evolution-code-20260609-000430`

Os containers anteriores da API foram preservados parados para rollback.

## Evolution Multiempresa

- Instancias encontradas:
  - `Lanche`: conectada.
  - `replymesh_demohamburgueria_qr`: conectada.
- O webhook Rails foi ajustado para aceitar um segredo dedicado pelo parametro
  `token`, pois a Evolution Go desta versao envia somente `Content-Type` no
  webhook e nao envia `apikey`.
- O parametro `token` ja e filtrado pelo Rails e nao aparece em logs normais.
- Sem segredo: webhook retorna HTTP 401.
- Com segredo dedicado: webhook retorna HTTP 200.
- Evento sintetico `fromMe` foi ignorado corretamente e nao alterou pedidos.
- A instancia Demo foi configurada para:
  `https://api.replymesh.cloud/api/v1/webhooks/evolution/location?token=<redacted>`
- Evento inscrito: `MESSAGE`.
- O token da instancia Demo foi vinculado ao registro Rails sem ser exibido.
- A instancia Demo permaneceu conectada apos atualizar a configuracao.

## Preservacao da Lanche

- A instancia `Lanche` permaneceu conectada.
- Webhook preservado: `http://172.17.0.1:9999`.
- Eventos preservados: `MESSAGE`.
- Hash da configuracao comparado antes/depois: sem alteracao.
- A instancia nao foi desconectada, recriada ou reiniciada.

## Validacao de Producao

- `https://api.replymesh.cloud/up`: 200.
- `https://app.replymesh.cloud/dashboard`: 200 e dashboard carregado.
- `https://app.replymesh.cloud/whatsapp`: 2 instancias, 2 conectadas.
- `https://demohamburgueria.replymesh.cloud`: 200.
- `/menu`: 200.
- `/checkout`: 200.
- `/login`: 200.
- `https://marinho.replymesh.cloud/manager`: 302 esperado.
- `https://infra.replymesh.cloud`: 200.
- `https://create.replymesh.cloud`: 200.
- CORS para `https://app.replymesh.cloud`: OK.

## IA / Carina

Somente auditoria:

- `CLAUDE_API_KEY`: presente no ambiente, valor nao exibido.
- Configuracao global de IA: presente.
- Configuracao de IA da Demo: presente.
- Nenhum consumo real de IA foi executado.
- Nenhuma resposta automatica foi ativada nesta fase.

## Arquivos Alterados Nesta Fase

Backend:

- `replymesh-api/app/services/mercado_pago_payment_processor.rb`
- `replymesh-api/app/services/order_status_service.rb`
- `replymesh-api/spec/services/mercado_pago_payment_processor_spec.rb`
- `replymesh-api/app/controllers/api/v1/webhooks/evolution_controller.rb`
- `replymesh-api/app/services/evolution_go_client.rb`
- `replymesh-api/app/controllers/api/v1/master/whatsapp/instances_controller.rb`
- `replymesh-api/app/controllers/api/v1/store/whatsapp/instances_controller.rb`

Store:

- `store-template/src/pages/admin/Settings.jsx`
- `store-template/src/services/settings.js`

## Diferencas Anteriores Existentes Somente na VPS

Estes arquivos ja estavam modificados na VPS antes da Fase 16.10 e precisam ser
comparados e trazidos de volta ao repositorio local antes do commit:

- `replymesh-api/app/controllers/api/v1/master/companies_controller.rb`
- `replymesh-api/config/initializers/cors.rb`
- `replymesh-frontend/src/pages/empresas/CompanyImpersonationLaunch.jsx`
- `store-template/src/app/router.jsx`
- `store-template/src/components/layout/AdminLayout.jsx`
- `store-template/src/services/replymeshApi.js`

Existem tambem backups `.bak` e relatorios nao versionados na VPS. Eles nao
devem ser incluidos automaticamente no commit.

## Testes

- Sintaxe Ruby dos arquivos alterados: OK.
- Build Vite Store local: OK.
- Build Vite Store VPS: OK.
- Health check Rails: OK.
- Polling Pix com pagamento aprovado: OK.
- Dashboard Master no navegador: OK.
- Painel WhatsApp no navegador: OK.
- Impersonacao da Demo: OK.
- Tela de configuracao Mercado Pago: OK.
- Spec local nao iniciou porque o runtime Windows esta sem algumas gems do
  `Gemfile.lock`. O comportamento foi validado na API de producao e o teste de
  regressao foi adicionado ao source.

## Pendencias

1. Enviar uma localizacao real pelo WhatsApp conectado em
   `replymesh_demohamburgueria_qr`.
2. Confirmar o recebimento no Rails e a atualizacao de Maps/Waze em um pedido
   controlado.
3. Depois da validacao, avaliar migracao controlada da `Lanche`; nao fazer antes.
4. Comparar e consolidar as alteracoes anteriores existentes somente na VPS.
5. Executar a suite RSpec em ambiente com todas as gems instaladas.
6. Fazer auditoria de segredos antes do commit.

## Git

- Nenhum commit foi criado.
- Nenhuma tag foi criada.
- Tag sugerida depois da consolidacao e validacao final: `v0.15.24`.
