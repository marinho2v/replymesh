# REPLYMESH FASE 16.11 â€” Pedido, WhatsApp, Motoboy e LocalizaÃ§Ã£o

Data: 2026-06-09

## Status

CONCLUIDA.

Fluxo de pedido, WhatsApp de status, painel do motoboy e localizacao real foram validados em producao.

## Pedido real informado

- Pedido: #806
- Status: accepted
- Delivery status: assigned
- Telefone do cliente: final 9803
- Motoboy vinculado: sim
- Latitude/longitude no pedido: presentes
- google_maps_url/waze_url no pedido: presentes
- Localizacao recebida em: 2026-06-09 01:19:04 UTC

## Causa da localizaÃ§Ã£o nÃ£o aparecer

O painel do motoboy jÃ¡ dependia dos campos de localizaÃ§Ã£o do pedido:

- delivery_latitude
- delivery_longitude
- delivery_location_received_at
- google_maps_url
- waze_url

Esses campos estavam vazios no pedido #806 antes da correcao do token. Depois que o cliente reenviou a localizacao, o pedido foi atualizado corretamente.

Nos logs da Rails API havia chamadas POST para:

`/api/v1/webhooks/evolution/location?token=[FILTERED]`

mas elas retornavam 401 Unauthorized. A causa era:

- o webhook da Evolution jÃ¡ tinha token prÃ³prio na URL;
- a Rails API nÃ£o estava carregando `EVOLUTION_LOCATION_WEBHOOK_SECRET`;
- a API caÃ­a no fallback `EVOLUTION_GO_API_KEY`, que nÃ£o batia com o token do webhook.

## CorreÃ§Ã£o aplicada

Sem alterar a Evolution, foi extraÃ­do o token jÃ¡ configurado no registro remoto da instÃ¢ncia `replymesh_demohamburgueria_qr` e salvo em:

- `/etc/replymesh-rails-api.env`

VariÃ¡vel adicionada:

- `EVOLUTION_LOCATION_WEBHOOK_SECRET`

Backup criado:

- `/etc/replymesh-rails-api.env.pre-location-token-20260609-010520.bak`

Container recriado:

- somente `replymesh-rails-api`

NÃ£o houve alteraÃ§Ã£o em:

- Evolution Go
- instÃ¢ncia Lanche
- webhook da instÃ¢ncia Lanche
- Traefik
- SSL
- banco
- Mercado Pago

## ValidaÃ§Ã£o do webhook

Teste controlado com telefone sem pedido aberto:

- HTTP: 200
- Resultado: success true, matched false
- Mensagem: nenhum pedido aberto encontrado para este telefone

Isso confirma que o token passou a ser aceito e o endpoint voltou a processar eventos autenticados.

## Painel do motoboy

Arquivo alterado:

- `store-template/src/pages/motoboy/MotoboyDashboard.jsx`

AlteraÃ§Ã£o visual:

- quando o pedido tiver localizaÃ§Ã£o WhatsApp, exibe bloco verde: "LocalizaÃ§Ã£o confirmada pelo cliente";
- quando ainda nÃ£o tiver localizaÃ§Ã£o, exibe bloco amarelo: "Aguardando localizaÃ§Ã£o do cliente";
- Maps/Waze continuam usando o endereÃ§o digitado como fallback enquanto o pin nÃ£o chega.

Build:

- `npm run build` OK

PublicaÃ§Ã£o:

- `/opt/replymesh/store`

Backup criado:

- `/opt/replymesh/store.pre-location-ui-20260609-011809`

ValidaÃ§Ã£o pÃºblica:

- `https://api.replymesh.cloud/up`: 200
- `https://demohamburgueria.replymesh.cloud/motoboy/login`: 200

## Localizacao real recebida

O cliente final 9803 reenviou a localizacao pelo WhatsApp para o pedido #806.

Resultado:

- webhook processou o evento pela instancia `replymesh_demohamburgueria_qr`;
- pedido #806 recebeu latitude/longitude;
- `google_maps_url` foi salvo;
- `waze_url` foi salvo;
- `delivery_location_received_at` foi salvo;
- log criado: `Localizacao vinculada ao pedido #806`;
- mensagens de grupo continuam sendo ignoradas corretamente;
- mensagens enviadas pelo proprio sistema continuam sendo ignoradas corretamente.

## Resultado final

FASE 16.11 CONCLUIDA.

Pode fazer commit/tag v0.15.24 depois de revisar o conjunto completo de arquivos alterados.

## AtualizaÃ§Ã£o Multiempresa

Foi aplicado o padrÃ£o multiempresa para novas lojas:

- ao criar empresa pelo Master, o onboarding passa a criar uma instÃ¢ncia Evolution inicial por padrÃ£o;
- a instÃ¢ncia Ã© criada com token local salvo em `whatsapp_instances.instance_token`;
- o webhook de localizaÃ§Ã£o Ã© configurado automaticamente com evento `MESSAGE`;
- o nome da instÃ¢ncia passa a ser padronizado como `replymesh_<slug_sanitizado>`;
- ao acessar a tela WhatsApp da loja, o backend reforÃ§a a configuraÃ§Ã£o do webhook se a instÃ¢ncia jÃ¡ existir e tiver token local;
- o webhook de localizaÃ§Ã£o deixou de ser restrito Ã  Demo Hamburgueria;
- mensagens operacionais deixam de depender de allowlist manual por slug e passam a enviar quando:
  - o template do status estÃ¡ ativo;
  - a empresa tem instÃ¢ncia WhatsApp conectada;
  - a instÃ¢ncia tem token local;
  - o pedido tem telefone vÃ¡lido.

Marketing WhatsApp continua fora desse fluxo automÃ¡tico.

Arquivos principais alterados:

- `replymesh-api/app/services/company_onboarding_service.rb`
- `replymesh-api/app/controllers/api/v1/store/whatsapp/instances_controller.rb`
- `replymesh-api/app/controllers/api/v1/webhooks/evolution_controller.rb`
- `replymesh-api/app/services/whatsapp_status_dispatcher.rb`

Testes locais:

- `spec/services/whatsapp_status_dispatcher_spec.rb`
- `spec/services/company_onboarding_service_spec.rb`
- `spec/requests/evolution_location_webhook_spec.rb`

Resultado:

- 6 exemplos, 0 falhas.

ProduÃ§Ã£o:

- imagem criada: `replymesh-api:v0.15.24-rc5`
- container recriado: somente `replymesh-rails-api`
- `/up`: 200
- `EVOLUTION_LOCATION_WEBHOOK_SECRET`: presente
- `EVOLUTION_LOCATION_WEBHOOK_URL`: presente
- webhook final: `https://api.replymesh.cloud/api/v1/webhooks/evolution/location?token=[FILTERED]`

Backups VPS:

- `/root/replymesh-backups/phase-16-11-multiempresa-whatsapp-20260609-013245`
- `/etc/replymesh-rails-api.env.pre-location-url-20260609-013459.bak`

Containers crÃ­ticos:

- Evolution Go nÃ£o foi alterado.
- Traefik nÃ£o foi alterado.
- Banco nÃ£o foi alterado.
- Migrations/seeds nÃ£o foram executados.
## AtualizaÃ§Ã£o Marketing e RecuperaÃ§Ã£o de Venda

TambÃ©m foi validado o fluxo de mensagens fora do status de pedido:

- marketing individual;
- campanha de marketing;
- recuperador de venda/lista de clientes inativos.

O backend usa sempre:

- `current_company`;
- clientes da empresa atual;
- campanhas da empresa atual;
- `WhatsappInstance.primary_for_company(company)`.

CorreÃ§Ã£o aplicada:

- o placeholder `{link_loja}` nÃ£o gera mais link local `127.0.0.1`;
- agora gera `https://<slug>.replymesh.cloud`, respeitando a empresa atual.

Arquivo alterado:

- `replymesh-api/app/controllers/api/v1/store/marketing_controller.rb`

Testes adicionados/validados:

- marketing customers nÃ£o retorna clientes de outra empresa;
- sales recovery nÃ£o retorna clientes de outra empresa;
- envio operacional WhatsApp nÃ£o depende de allowlist manual;
- webhook de localizaÃ§Ã£o funciona para empresa diferente da Demo.

Resultado local atualizado:

- 12 exemplos, 0 falhas.

ProduÃ§Ã£o:

- imagem criada: `replymesh-api:v0.15.24-rc6`
- container recriado: somente `replymesh-rails-api`
- `/up`: 200

Backups VPS adicionais:

- `/root/replymesh-backups/phase-16-11-marketing-multitenant-20260609-013905`

ConfirmaÃ§Ã£o de isolamento:

- usuÃ¡rios normais entram apenas na empresa associada via `CompanyMember`;
- se tentarem acessar outro `company_slug`, recebem forbidden;
- super admin continua podendo acessar/impersonar empresas pelo fluxo auditado.
