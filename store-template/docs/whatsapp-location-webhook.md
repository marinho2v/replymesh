# Localizacao do cliente por WhatsApp

Quando o cliente enviar uma localizacao nativa para o WhatsApp da loja, a Evolution deve chamar:

```text
https://dmczuzsrmejuogoyaouq.supabase.co/functions/v1/evolution-location-webhook
```

O webhook aceita mensagens normais tambem, mas ignora tudo que nao tiver latitude e longitude.

## Como funciona

1. A Evolution recebe a localizacao enviada pelo cliente.
2. O webhook extrai telefone, latitude e longitude.
3. O Supabase procura o pedido de entrega mais recente e ainda aberto desse telefone.
4. O pedido recebe:
   - `delivery_latitude`
   - `delivery_longitude`
   - `google_maps_url`
   - `waze_url`
   - `delivery_location_source = whatsapp`
5. O painel do motoboy passa a abrir Maps/Waze no pin enviado pelo cliente.

## Observacao importante

Isso funciona quando o cliente manda a localizacao para o WhatsApp conectado na API da loja.
Se a localizacao for enviada direto para o WhatsApp pessoal do motoboy, o sistema nao consegue ler esse evento.
