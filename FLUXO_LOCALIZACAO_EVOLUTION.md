# FLUXO DE LOCALIZACAO EVOLUTION - 2R / REPLYMESH

Documento de referencia para a migracao futura do fluxo de localizacao do 2R para Rails.

Este documento foi criado em modo leitura a partir do projeto original do 2R. Nenhum arquivo do 2R, Supabase de producao ou Evolution de producao foi alterado.

## Estado Atual No 2R

O fluxo atual do 2R funciona assim:

1. O cliente envia uma localizacao pelo WhatsApp conectado da loja.
2. A Evolution Go recebe o evento de mensagem.
3. A Evolution chama a Edge Function do Supabase `evolution-location-webhook`.
4. A Edge Function tenta extrair telefone do cliente, latitude, longitude e um rotulo/endereco quando existir.
5. A Edge Function chama a RPC Supabase `attach_whatsapp_location_to_latest_order`.
6. A RPC procura o pedido delivery aberto mais recente para aquele telefone.
7. A RPC grava a localizacao no pedido.
8. O portal do motoboy le os campos gravados no pedido e abre Maps/Waze no pin correto.

## Campos Gravados No Pedido

No fluxo original, a localizacao do WhatsApp atualiza campos equivalentes a:

- `delivery_latitude`
- `delivery_longitude`
- `delivery_full_address`
- `google_maps_url`
- `waze_url`
- `delivery_location_source = whatsapp`
- `delivery_location_received_at`
- `delivery_location_payload`

## Regra Mais Importante

A localizacao precisa chegar no WhatsApp conectado da loja, nao no WhatsApp pessoal do motoboy.

O motoboy nao recebe a localizacao diretamente da Evolution. Ele apenas ve no portal os dados que ja foram salvos no pedido.

## Como A RPC Encontra O Pedido

A busca do 2R usa o telefone normalizado do cliente e procura:

- pedidos `delivery`;
- pedidos nao finalizados e nao cancelados;
- pedidos criados nos ultimos dias;
- o pedido mais recente;
- com prioridade para entregas ja atribuidas ou em rota.

Quando encontra, grava URLs como:

- Google Maps: `https://www.google.com/maps?q=LAT,LNG`
- Waze: `https://waze.com/ul?ll=LAT,LNG&navigate=yes`

## Como O Motoboy Usa

No portal do motoboy, se o pedido tiver latitude e longitude:

- a tela mostra que a localizacao foi recebida pelo WhatsApp;
- o botao Maps abre o Google Maps com as coordenadas;
- o botao Waze abre o Waze com as coordenadas;
- se nao houver coordenadas, o portal cai para o endereco textual.

## Prioridade Sobre IA

Quando o evento recebido for localizacao, o fluxo de localizacao deve ter prioridade.

A IA WhatsApp futura nao pode interceptar, substituir nem bloquear mensagens de localizacao. Se futuramente existir resposta de IA apos salvar localizacao, ela deve acontecer apenas depois que o webhook concluir a gravacao no pedido.

## Plano Futuro Para Rails

Fase futura - Webhook de Localizacao Evolution:

1. Mapear todos os formatos de evento de localizacao enviados pela Evolution Go.
2. Criar endpoint Rails para receber webhook da Evolution.
3. Identificar a instancia Evolution por `instance_name` ou `instance_uuid`.
4. Resolver `company_id` pela instancia.
5. Ignorar mensagens sem localizacao.
6. Ignorar mensagens proprias e grupos.
7. Normalizar telefone do cliente.
8. Procurar pedido delivery aberto mais recente da mesma empresa e telefone.
9. Gravar latitude, longitude, URLs Maps/Waze e payload sanitizado no pedido.
10. Registrar log/auditoria sem expor tokens ou API keys.
11. Testar primeiro com instancia local de teste.
12. Somente depois avaliar troca do webhook de producao.

## Implementacao Local Na Replymesh - Fase 14.0

Endpoint criado:

```text
POST /api/v1/webhooks/evolution/location
Header: apikey
```

O valor do header deve bater com `EVOLUTION_LOCATION_WEBHOOK_SECRET` quando existir, ou com `EVOLUTION_GO_API_KEY` no ambiente local.

Payload aceito nesta etapa:

```json
{
  "instanceName": "replymesh_demohamburgueria_qr",
  "data": {
    "Info": {
      "Sender": "5521999999999@s.whatsapp.net",
      "Chat": "5521999999999@s.whatsapp.net",
      "IsFromMe": false
    },
    "Message": {
      "locationMessage": {
        "degreesLatitude": -22.9351234,
        "degreesLongitude": -42.8165678,
        "name": "Rua enviada pelo cliente"
      }
    }
  }
}
```

Campos conhecidos aceitos:

- instancia: `instanceName`, `instance_name`, `instance`, `data.instanceName`, `data.Info.InstanceName`, `data.Info.InstanceID` ou headers `x-instance-name` / `x-instance-id`;
- telefone: `data.Info.Sender`, `data.Info.Chat`, `data.key.remoteJid`, `data.key.participant`, `data.sender`, `sender`, `from`, `phone`, `remoteJid`;
- localizacao: `data.Message.locationMessage`, `data.Message.LocationMessage`, `data.Message.liveLocationMessage`, `data.Message.location`, `data.locationMessage`, `data.location`, `locationMessage`, `location`;
- coordenadas: `degreesLatitude`/`degreesLongitude`, `latitude`/`longitude`, `lat`/`lng`, `lat`/`lon`.

Regras de seguranca:

- mensagens proprias (`fromMe` / `IsFromMe`) sao ignoradas;
- grupos (`@g.us`) sao ignorados;
- payload sem localizacao e ignorado;
- coordenadas fora do intervalo valido sao ignoradas;
- a instancia precisa existir em `whatsapp_instances` e estar vinculada a uma empresa;
- no ambiente local atual, a liberacao esta restrita a `demohamburgueria`;
- tokens e API keys nao sao registrados em logs.

Validacao local:

- Pedido Demo `#8` / id `23` recebeu latitude, longitude, Google Maps e Waze via payload simulado.
- API do motoboy retornou os links salvos.
- Sem `apikey`, o endpoint retornou 401.
- Payload sem localizacao retornou `ignored=true`.

## Portal Motoboy - Fase 14.1

O portal do motoboy foi simplificado para o fluxo atual:

1. Admin atribui o pedido ao motoboy.
2. Pedido aparece no portal.
3. Motoboy abre Maps, Waze ou WhatsApp do cliente se quiser.
4. Motoboy clica apenas em `Finalizar entrega`.

O botao `Iniciar entrega` foi ocultado no frontend. O endpoint de start continua no backend para uma fase futura de mapa/localizacao, mas nao e obrigatorio no fluxo atual.

Quando o pedido possui localizacao recebida pelo WhatsApp, o card de endereco exibe um box verde:

- `Localização recebida pelo WhatsApp`;
- `Maps e Waze vão abrir no pin enviado pelo cliente.`;
- data/hora de recebimento.

Os botoes funcionam assim:

- Maps usa `google_maps_url` quando existir;
- Waze usa `waze_url` quando existir;
- sem links de localizacao, ambos usam o endereco textual como fallback.

## Nao Fazer Nesta Fase

- Nao alterar webhook atual de producao.
- Nao remover Edge Function Supabase do 2R.
- Nao ativar webhook Rails real.
- Nao iniciar localizacao em tempo real.
- Nao implementar mapa embutido.
- Nao alterar instancia Lanche.
- Nao fazer deploy.
