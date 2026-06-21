# REPLYMESH DEV — Modo WhatsApp Manual por Empresa

Data: 2026-06-21  
Branch: `dev`

## Resultado

O modo de WhatsApp por empresa foi implementado com os valores:

- `automatic`: preserva o fluxo atual do Replymesh Connect/Evolution.
- `manual`: prepara a mensagem pelo template e fornece um link seguro para envio pelo WhatsApp Web/App.
- `disabled`: reservado para evolução futura e tratado como modo sem automação.

O padrão do banco é `automatic`, portanto empresas existentes não mudam de comportamento.

## Migration

Criada:

- `replymesh-api/db/migrate/20260621000000_add_whatsapp_mode_to_store_settings.rb`

Alteração:

- coluna `store_settings.whatsapp_mode`;
- `default: "automatic"`;
- `null: false`;
- constraint para `automatic`, `manual` e `disabled`;
- migration reversível.

## Comportamento automático

- Continua usando a instância Replymesh Connect/Evolution.
- Continua enviando templates automaticamente.
- Continua provisionando instância e webhooks no onboarding.
- Continua aceitando localização e mensagens recebidas pelos webhooks.
- Mantém QR Code, status e teste controlado de envio.

## Comportamento manual

- Não cria nova instância no onboarding.
- Não consulta status, gera QR Code, reconecta ou modifica Evolution.
- Não envia mensagens automáticas.
- Não produz erro crítico por instância desconectada.
- Não bloqueia alteração de status do pedido.
- Reutiliza os mesmos templates configurados.
- Normaliza o telefone brasileiro com DDI 55.
- Remove caracteres de controle inválidos.
- Codifica a mensagem para URL.
- Gera link no formato `https://wa.me/55NUMERO?text=MENSAGEM`.
- Exibe aviso quando o cliente não possui telefone válido.
- Ignora webhooks Evolution para empresas fora do modo automático.
- Mantém links de mapa já existentes no pedido e não altera o painel do motoboy.

## Painel da loja

- Configurações ganhou a seleção Automático/Manual.
- A tela WhatsApp mostra um aviso neutro no modo manual e não exibe conexão ou QR Code.
- A listagem de pedidos informa quando o modo manual está ativo.
- Após mudar o status, aparece o botão para abrir a mensagem pronta no WhatsApp.
- O detalhe do pedido permite preparar e abrir a mensagem manual.

## Painel Master

- A edição da empresa permite escolher Automático ou Manual.
- A configuração é persistida por empresa.
- O modo manual continua acessando templates mesmo quando o recurso de automação não está disponível no plano.
- Operações Master que alterariam a instância são ignoradas/bloqueadas fora do modo automático.

## Arquivos alterados

### Backend

- `replymesh-api/app/models/store_setting.rb`
- `replymesh-api/app/services/whatsapp_manual_message_builder.rb`
- `replymesh-api/app/services/whatsapp_status_dispatcher.rb`
- `replymesh-api/app/services/order_status_service.rb`
- `replymesh-api/app/services/company_onboarding_service.rb`
- `replymesh-api/app/controllers/api/v1/company_settings_controller.rb`
- `replymesh-api/app/controllers/api/v1/master/companies_controller.rb`
- `replymesh-api/app/controllers/api/v1/master/whatsapp/instances_controller.rb`
- `replymesh-api/app/controllers/api/v1/store/orders_controller.rb`
- `replymesh-api/app/controllers/api/v1/store/whatsapp/instances_controller.rb`
- `replymesh-api/app/controllers/api/v1/store/whatsapp/templates_controller.rb`
- `replymesh-api/app/controllers/api/v1/store/whatsapp/test_sends_controller.rb`
- `replymesh-api/app/controllers/api/v1/webhooks/evolution_controller.rb`
- `replymesh-api/db/migrate/20260621000000_add_whatsapp_mode_to_store_settings.rb`
- `replymesh-api/db/schema.rb`

### Testes

- `replymesh-api/spec/services/whatsapp_manual_message_builder_spec.rb`
- `replymesh-api/spec/services/whatsapp_status_dispatcher_spec.rb`
- `replymesh-api/spec/services/order_status_service_spec.rb`
- `replymesh-api/spec/services/company_onboarding_service_spec.rb`

### Store

- `store-template/src/services/settings.js`
- `store-template/src/services/storeApi.js`
- `store-template/src/pages/admin/Settings.jsx`
- `store-template/src/pages/admin/Whatsapp.jsx`
- `store-template/src/pages/admin/Orders.jsx`
- `store-template/src/pages/admin/OrderDetails.jsx`
- `store-template/src/components/dashboard/OrdersTable.jsx`
- `store-template/src/components/dashboard/OrderActions.jsx`

### Master

- `replymesh-frontend/src/pages/empresas/EmpresaDetalhe.jsx`

## Validações

- `npm run build` em `store-template`: aprovado.
- `npm run build` em `replymesh-frontend`: aprovado.
- `ruby -c` em todos os arquivos Ruby alterados: aprovado.
- `git diff --check`: aprovado.
- Auditoria de segredos: aprovada.

## Pendências de ambiente

Os specs Rails e a aplicação da migration no banco DEV local não puderam ser executados nesta sessão porque o Docker Desktop permaneceu preso durante a inicialização, mesmo após reinício e espera adicional. O Ruby portátil local também não possui todas as gems do `Gemfile.lock`.

Nenhuma VPS, Evolution real, branch `main` ou ambiente de produção foi acessado.

## Commit DEV

Mensagem planejada:

`Replymesh Add Manual WhatsApp Mode Per Store`

O hash do commit é informado na resposta final da execução, pois o próprio arquivo faz parte do commit.
