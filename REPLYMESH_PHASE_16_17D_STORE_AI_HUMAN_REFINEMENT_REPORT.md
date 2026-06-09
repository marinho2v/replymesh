# REPLYMESH FASE 16.17D - Store AI humana, handoff e webhook organizado

Data: 2026-06-09

## Status

FASE 16.17D CONCLUIDA.

## Escopo executado

- Backend `replymesh-api` atualizado e publicado na VPS.
- Store/template nao foi alterado nesta fase.
- Evolution Go nao foi alterado.
- Instancia `Lanche` nao foi alterada.
- Mercado Pago nao foi alterado.
- Seeds, reset, drop e importacoes nao foram executados.
- IA mantida ativa apenas para `demohamburgueria`.

## Backup

Backup criado antes do deploy:

`/root/replymesh-backups/pre-phase-16-17d-20260609-191108`

Arquivos gerados:

- `replymesh-api-source.tgz`
- `replymesh-production-before-16-17d.sql`
- `replymesh-rails-api.env.copy` com permissao restrita
- `docker-ps-before.txt`
- `docker-ps-before-recreate.txt`

## Migration

Migration aplicada:

`20260609183000_add_handoff_fields_to_store_ai_conversations.rb`

Campos adicionados:

- `paused_until`
- `handoff_reason`
- indice `index_store_ai_conversations_pause_lookup`

Status validado:

- `up 20260609183000 Add handoff fields to store ai conversations`

## Arquivos alterados

- `replymesh-api/app/controllers/api/v1/webhooks/evolution_controller.rb`
- `replymesh-api/app/models/store_ai_conversation.rb`
- `replymesh-api/app/services/evolution_message_payload_parser.rb`
- `replymesh-api/app/services/store_ai_intent_classifier.rb`
- `replymesh-api/app/services/store_ai_service.rb`
- `replymesh-api/app/services/store_rag_service.rb`
- `replymesh-api/db/migrate/20260609183000_add_handoff_fields_to_store_ai_conversations.rb`
- `replymesh-api/db/schema.rb`
- `replymesh-api/spec/services/carina_rag_and_store_ai_spec.rb`
- `replymesh-api/spec/services/store_ai_whatsapp_multi_tenant_spec.rb`

## Melhorias aplicadas

- Respostas da IA ficaram mais curtas e naturais.
- Resposta tecnica foi limitada a:
  `Posso ajudar com produtos, pedidos, horarios, pagamentos e entregas da loja.`
- Produtos retornam ate 3 opcoes com preco e link.
- Perguntas de horario usam data/hora atual da loja.
- Perguntas de pedido aceitam telefone informado pelo cliente.
- Gatilho de humano implementado:
  - Cliente pede humano: envia resposta de handoff e pausa a IA.
  - Mensagem `fromMe` manual: pausa IA para aquele telefone.
  - Mensagens da propria IA nao pausam o atendimento por causa de cache curto.
- Endpoints preservados:
  - `/api/v1/webhooks/evolution/messages`
  - `/api/v1/webhooks/evolution/location`

## Deploy

Imagem buildada:

`replymesh-api:v0.15.28-store-ai-human-rc1`

Container recriado:

- `replymesh-rails-api`

Containers nao alterados:

- `replymesh-store`
- `evolution-go-1dvv-api-1`
- `evolution-go-1dvv-postgres-1`

## Validacoes em producao

Saude:

- `https://api.replymesh.cloud/up` retornou `HTTP/2 200`
- `https://demohamburgueria.replymesh.cloud` retornou `HTTP/2 200`

IA por empresa:

- `demohamburgueria`: `enabled=true`, `auto_reply_whatsapp=true`
- `testemultiempresa`: `enabled=false`, `auto_reply_whatsapp=false`
- `homologacao-replymesh`: `enabled=false`, `auto_reply_whatsapp=false`
- `negao`: `enabled=false`, `auto_reply_whatsapp=false`

Instancia validada:

- `replymesh_demohamburgueria_qr`
- Empresa: `demohamburgueria`
- Status: `connected`

## Testes WhatsApp reais

Numero de teste usado: final `9803`.

Resultados:

- `oi`: 200 / success
- `quero fazer pedido`: 200 / success / ordering
- `tem x bacon?`: 200 / success / products
- `quero triplo cheddar bacon`: 200 / success / products
- `medio`: 200 / success / products
- `aceita pix?`: primeiro teste pegou rate limit; reteste isolado 200 / success / payments
- `entrega em Marica?`: 200 / success / delivery
- `esta aberto hoje?`: 200 / success / hours
- `que horas fecha?`: 200 / success / hours
- `cade meu pedido?`: 200 / success / order_status
- `meu telefone e 21968443941`: reteste apos ajuste 200 / success / order_status
- `como configuro webhook?`: 200 / blocked
- `token`: 200 / blocked
- `painel`: 200 / blocked
- `quero falar com humano`: 200 / handoff / human_request

## Teste de pausa humana

Teste com telefone ficticio, sem envio real:

- Evento `fromMe=true`: 200 / `manual_whatsapp_reply`
- Conversa ficou `handed_off`
- Proxima mensagem do cliente foi ignorada com `human_takeover`

## Logs e custo

Ultima hora apos testes:

- `AiUsageLog`: 57 registros
- Tokens estimados: 57.857
- Custo estimado: US$ 0.115714
- `WhatsappLog`: 65 registros
- Enviados: 59
- Ignorados/skipped: 6
- Falhas: 0

## Testes locais

Executado:

- `ruby -c` nos arquivos Ruby alterados: OK

Nao executado localmente:

- `bundle exec rspec`

Motivo:

- Ambiente Windows local esta sem gems nativas instaladas no bundle (`puma`, `bcrypt`, `bootsnap`, `msgpack`, `websocket-driver`, entre outras).

## Auditoria de segredos

Varredura executada nos arquivos alterados.

Resultado:

- Nenhum segredo real encontrado.
- Ocorreram apenas referencias a nomes de headers, variaveis ENV e colunas criptografadas.

## Pendencias

- Fazer commit/tag desta entrega quando aprovado.
- Opcional: transformar a separacao interna do webhook em classes dedicadas (`EvolutionLocationHandler`, `StoreAiWhatsappHandler`) em uma fase pequena de refatoracao, mantendo comportamento ja validado.
- Acompanhar custo Claude em homologacao real antes de liberar para clientes reais.

## Conclusao

Sistema pronto para continuar homologacao da IA da loja na Demo Hamburgueria.

Nao liberar automaticamente para outras empresas ainda sem uma rodada curta de observacao dos logs.
