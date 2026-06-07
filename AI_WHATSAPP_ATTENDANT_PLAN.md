# AI WhatsApp Attendant Plan

Status: fase futura documentada. Nao implementar codigo agora.

## Objetivo

Criar, em fase futura, um atendimento com IA no WhatsApp para responder mensagens recebidas dos clientes das lojas Replymesh.

O sistema e um SaaS de delivery. Cada loja conecta seu WhatsApp pelo Evolution Go usando QR Code. O atendimento IA deve respeitar isolamento multiempresa por `company_id` e nunca misturar dados entre lojas.

## Fluxos Existentes Que Nao Podem Quebrar

### Mensagens Automaticas Por Status

O sistema ja possui mensagens automaticas preparadas por status de pedido:

- `accepted` -> `pedido_aceito`
- `preparing` -> `pedido_em_preparo` se template enabled
- `ready` -> `pedido_pronto` se template enabled
- `out_for_delivery` -> `saiu_para_entrega`
- `completed` -> `pedido_finalizado`

Por padrao, somente estes templates ficam enabled:

- `pedido_aceito`
- `saiu_para_entrega`
- `pedido_finalizado`

O atendimento IA nao pode interceptar, substituir, duplicar ou impedir essas mensagens automaticas.

### Localizacao Via WhatsApp

Fluxo esperado:

1. Cliente envia localizacao pelo WhatsApp.
2. Evolution recebe webhook.
3. Sistema identifica telefone do cliente.
4. Sistema vincula localizacao ao pedido mais recente.
5. Sistema salva latitude, longitude e links de mapa no pedido.
6. Motoboy usa Google Maps/Waze.

A IA nao pode interceptar nem substituir mensagens de localizacao. Se a mensagem recebida for localizacao, o fluxo de localizacao tem prioridade. A IA so pode responder depois que o webhook salvar a localizacao, se isso for configurado.

## Regras De Seguranca E Escopo

- IA so responde se estiver ativa para a loja.
- IA so funciona se o plano da loja permitir.
- IA nao responde mensagens enviadas pelo proprio sistema.
- IA nao responde grupos.
- IA nao interfere nas mensagens automaticas.
- IA nao interfere no fluxo de localizacao.
- IA identifica loja pela instancia Evolution.
- IA identifica cliente pelo telefone.
- IA busca pedido recente pelo telefone.
- IA sempre filtra por `company_id`.
- IA nunca mistura dados entre lojas.
- IA nao inventa produto, preco, prazo, status ou motoboy.
- IA chama atendente quando nao souber.
- IA nunca recebe API keys da Evolution no frontend.
- IA nunca retorna dados sensiveis internos para o cliente.

## Fluxo Futuro

1. Cliente manda mensagem no WhatsApp.
2. Evolution envia webhook para Rails.
3. Rails identifica instancia e loja.
4. Rails ignora mensagens proprias e grupos.
5. Rails verifica plano.
6. Rails verifica se IA esta ativa.
7. Rails classifica intencao.
8. Rails busca dados reais.
9. Rails monta contexto pequeno.
10. Provedor IA gera resposta curta.
11. Rails envia resposta pelo Evolution.

## Intencoes Previstas

- Status do pedido.
- Tempo estimado.
- Motoboy.
- Cardapio/produto.
- Horario.
- Pagamento.
- Taxa de entrega.
- Localizacao/endereco.
- Falar com atendente.
- Reclamacao.
- Fora do assunto.

## Configuracao Super Admin

Campos futuros:

- Provedor IA.
- API key.
- Modelo.
- Limite de tokens.
- IA ativa/inativa global.
- Logs de uso.

Regras:

- API key deve ficar apenas no backend.
- O frontend nunca deve receber API key.
- Logs nao devem gravar prompts com dados sensiveis sem mascaramento.

## Configuracao Da Loja

Campos futuros:

- Ativar/desativar IA.
- Nome da loja.
- Tom da IA.
- Tempo medio de preparo.
- Tempo medio de entrega.
- Mensagem fora do horario.
- Mensagem chamar atendente.
- Formas de pagamento.
- Taxa de entrega.

## Prompt Interno Base

```text
Voce e o atendente virtual da loja {{store_name}}. Responda apenas sobre pedidos, cardapio, horario, entrega, pagamento e informacoes da loja. Use somente os dados fornecidos no contexto. Nunca invente preco, produto, ingrediente, motoboy, status ou prazo. Se faltar informacao, peca o numero do pedido ou encaminhe para um atendente humano. Responda em portugues do Brasil, em mensagens curtas e naturais para WhatsApp.
```

## Contexto Pequeno Para IA

O contexto enviado ao provedor deve ser minimo e filtrado por `company_id`:

- Nome da loja.
- Horario/status de funcionamento.
- Formas de pagamento.
- Taxa de entrega ou zonas relevantes.
- Pedido recente do telefone, se houver.
- Status e timestamps relevantes do pedido.
- Itens do pedido, sem dados internos desnecessarios.
- Produtos/cardapio apenas quando a intencao pedir.

## Prioridade De Handlers

Ordem futura recomendada:

1. Ignorar mensagem propria.
2. Ignorar grupo.
3. Detectar e processar localizacao.
4. Detectar comandos internos/sistema, se houver.
5. Validar plano e flag IA.
6. Classificar intencao.
7. Gerar resposta IA.
8. Enviar pelo Evolution.

## Menu Futuro

Menu futuro no painel da loja:

```text
Comunicacao
- WhatsApp
- Templates WhatsApp
- Marketing WhatsApp
- Atendimento IA
```

Nao adicionar o item no menu agora sem confirmacao.

## Etapas Futuras

1. Mapear webhooks Evolution existentes.
2. Criar feature flag/plano.
3. Criar configuracoes IA por loja.
4. Criar `AIProvider` isolado.
5. Criar `WhatsAppAIHandler`.
6. Criar logs de IA.
7. Criar painel Atendimento IA.
8. Testar sem quebrar mensagens automaticas.
9. Testar sem quebrar localizacao.
10. Ativar somente em plano permitido.

## Fase Futura - Webhook De Localizacao Evolution Go

Objetivo: migrar o fluxo de localizacao do 2R Node/Supabase para Rails sem quebrar o fluxo atual.

Regras:

- Nao remover o fluxo atual do 2R.
- Nao alterar webhook atual em producao.
- Primeiro mapear o codigo Node/Supabase existente.
- Depois recriar equivalente no Rails.
- Testar com instancia teste.
- So depois pensar em trocar producao.

Fluxo:

1. Evolution Go envia evento de localizacao.
2. Rails recebe webhook.
3. Rails identifica `instance_name` ou `instance_uuid`.
4. Rails identifica `company_id`.
5. Rails identifica telefone do cliente.
6. Rails procura pedido mais recente pendente/em entrega.
7. Rails salva:
   - `delivery_latitude`
   - `delivery_longitude`
   - `delivery_location_received_at`
   - `google_maps_url`
   - `waze_url`, se necessario
8. Motoboy usa essa localizacao no painel/app.

## Nao Fazer Nesta Fase

- Nao implementar codigo.
- Nao criar tabelas.
- Nao alterar fluxo WhatsApp atual.
- Nao ativar IA.
- Nao chamar Claude, OpenAI ou qualquer API externa.
- Nao alterar webhook em producao.
- Nao iniciar motoboy, caixa, pagamento online ou deploy.
