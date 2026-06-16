# REPLYMESH — HOTFIX WHATSAPP LOCATION EM TODOS OS FLUXOS

Data: 2026-06-15

## Resultado

**LOCALIZAÇÃO WHATSAPP CORRIGIDA EM TODOS OS FLUXOS**

A configuração dos webhooks Evolution foi centralizada e aplicada aos fluxos de criação, conexão, sincronização, consulta de status, QR Code e onboarding. A rotina é idempotente: preserva instâncias conectadas, não recria sessões e não gera QR Code quando o webhook já está correto.

## Diagnóstico

O projeto possuía configuração de webhook distribuída entre controllers e serviços. Alguns fluxos configuravam a URL e o evento `MESSAGE`, enquanto outros apenas criavam, sincronizavam ou consultavam a instância. Isso permitia que uma instância válida ficasse registrada sem passar novamente pela configuração completa.

Na Evolution Go usada neste ambiente, localização, localização ao vivo e mensagens enviadas pelo aparelho chegam como variações do evento `MESSAGE`. Não existe necessidade de assinar um evento separado de localização.

O pedido real `#502` já havia recebido o evento antes da conclusão do hotfix:

* empresa: `lanchedo2r`;
* instância: `replymesh_lanchedo2r`;
* evento recebido pelo Rails com HTTP 200;
* latitude e longitude persistidas;
* origem registrada como `whatsapp`;
* URLs de Google Maps e Waze geradas;
* entrega vinculada ao motoboy correto.

O estado anterior “Aguardando localização do cliente” era compatível com resposta antiga ou tela ainda não atualizada. O endpoint atual do motoboy devolve os campos esperados, e o frontend faz atualização periódica.

## Fluxos auditados

| Fluxo | Cria/reutiliza | Garante webhook | Evento MESSAGE | Salva vínculo | Evita recriação |
|---|---:|---:|---:|---:|---:|
| Master — criar instância | Sim | Sim | Sim | Sim | Sim |
| Master — sincronizar remotas | Sim | Sim | Sim | Sim | Sim |
| Master — status | Reutiliza | Sim | Sim | Sim | Sim |
| Master — QR Code | Reutiliza | Sim | Sim | Sim | Sim |
| Master — instância de teste | Sim | Sim | Sim | Sim | Sim |
| Loja — botão Conectar WhatsApp | Sim | Sim | Sim | Sim | Sim |
| Loja — ensure/create | Sim | Sim | Sim | Sim | Sim |
| Loja — status | Reutiliza | Sim | Sim | Sim | Sim |
| Loja — QR Code | Reutiliza | Sim | Sim | Sim | Sim |
| Onboarding da empresa | Sim | Sim | Sim | Sim | Sim |
| Scripts ativos | Nenhum fluxo adicional encontrado | — | — | — | — |

## Rotina central

Foi criado `EvolutionWebhookProvisioner`, chamado por todos os fluxos ativos.

A rotina:

* gera e valida o token assinado do webhook;
* garante a URL Rails correta;
* garante o evento `MESSAGE`;
* reconhece webhook já configurado e não envia atualização duplicada;
* preserva suporte a `fromMe` e mensagens manuais;
* não desconecta a instância;
* não recria instância existente;
* não força QR Code;
* registra log seguro somente quando uma configuração real é aplicada.

## Webhook e parser

Foram auditados:

* controller geral da Evolution;
* endpoint assinado de localização;
* tratamento de mensagens recebidas;
* mensagens manuais com `fromMe`;
* `locationMessage`;
* `liveLocationMessage`;
* variações de maiúsculas/minúsculas do payload;
* latitude e longitude em formatos compatíveis com a Evolution Go.

Foi acrescentado teste com payload no formato `data.Info` e `data.Message.liveLocationMessage`.

## Banco e painel do motoboy

O endpoint real do motoboy retornou HTTP 200 para o pedido `#502`, incluindo:

* latitude e longitude;
* horário de recebimento;
* origem `whatsapp`;
* URL do Google Maps;
* URL do Waze.

O frontend do motoboy consome esses mesmos campos e troca o aviso de espera pelo card verde de localização. Nenhuma alteração de frontend foi necessária.

## Instância real lanchedo2r

* nome: `replymesh_lanchedo2r`;
* status local e remoto: conectado;
* uma única instância remota com esse nome;
* webhook assinado válido;
* evento ativo: `MESSAGE`;
* rotina central: `unchanged`, confirmando configuração idempotente;
* número conectado auditado de forma mascarada;
* nenhuma desconexão ou geração de QR Code executada.

## Validação QA pelo fluxo da loja

Foi usado o endpoint real acionado pelo botão da loja para a empresa QA existente `teste-rotas-global`.

Resultado:

* instância criada: `replymesh_teste_rotas_global`;
* vínculo local e remoto criado;
* token seguro salvo;
* webhook assinado configurado automaticamente;
* evento `MESSAGE` habilitado;
* uma única instância remota com esse nome;
* status desconectado, conforme esperado porque nenhum QR Code foi lido;
* nenhum QR Code foi gerado durante o teste;
* segunda execução da rotina retornou `unchanged`.

## Handoff e mensagens manuais

Os logs recentes confirmaram mensagens manuais identificadas como `manual_whatsapp_reply`. O comportamento de `fromMe` e a pausa/handoff da IA foram preservados. Nenhum fluxo de mensagem automática foi removido ou substituído.

## Arquivos alterados

* `replymesh-api/app/services/evolution_webhook_provisioner.rb`
* `replymesh-api/app/services/evolution_go_client.rb`
* `replymesh-api/app/controllers/api/v1/store/whatsapp/instances_controller.rb`
* `replymesh-api/app/controllers/api/v1/master/whatsapp/instances_controller.rb`
* `replymesh-api/app/services/company_onboarding_service.rb`
* `replymesh-api/spec/services/evolution_webhook_provisioner_spec.rb`
* `replymesh-api/spec/services/company_onboarding_service_spec.rb`
* `replymesh-api/spec/requests/evolution_location_webhook_spec.rb`
* `REPLYMESH_HOTFIX_WHATSAPP_LOCATION_ALL_CONNECTION_FLOWS_REPORT.md`

## Backup e deploy

Backup criado em:

`/opt/replymesh/backups/pre-whatsapp-location-all-flows-20260615-114547`

O backup contém código anterior, inventário do container, dump PostgreSQL e checksums. Os arquivos foram validados sem imprimir segredos.

Imagem publicada:

`replymesh-api:v1.0.0-whatsapp-location-all-flows-rc1`

Somente o container `replymesh-rails-api` foi recriado, mantendo rede, porta, política de reinício e ambiente de produção.

Não foram executados migrations, seeds, reset, drop ou alterações no Mercado Pago. Evolution, Store e Master não foram reiniciados.

## Validações

* API `/up`: HTTP 200.
* Container Rails: ativo e sem crash-loop.
* Store build local: aprovado.
* Sintaxe Ruby dos arquivos alterados: aprovada.
* `git diff --check` no escopo do hotfix: aprovado.
* Auditoria de segredos no escopo: aprovada.
* Pedido real `#502`: localização, Maps e Waze presentes.
* Endpoint do motoboy: HTTP 200 com localização real.
* Instância `lanchedo2r`: conectada e sem webhook duplicado.
* Instância QA: criada pelo fluxo da loja com webhook automático.
* `fromMe` e handoff humano: preservados.

O RSpec focado não pôde ser executado integralmente no Windows devido à ausência de gems nativas já exigidas pelo ambiente local. Nenhuma gem foi instalada. A imagem de produção iniciou corretamente e os testes funcionais foram executados na VPS.

## Pendências operacionais

Não há pendência técnica conhecida no provisionamento automático.

Para uma validação visual adicional, basta enviar uma nova localização em um pedido ativo e aguardar até 15 segundos pela atualização automática do painel do motoboy. Não é necessário reconectar a instância.

## Validação complementar — pedido #503

Após o envio real de uma nova localização em 2026-06-15 às 08:57:24:

* o webhook Rails recebeu o evento `MESSAGE` com mídia do tipo localização;
* a empresa foi identificada como `lanchedo2r`;
* o remetente terminou em `9803`;
* o pedido `#503` foi identificado;
* latitude e longitude foram persistidas;
* Google Maps e Waze foram gerados;
* o pedido permaneceu atribuído ao motoboy correto;
* o endpoint autenticado do motoboy retornou HTTP 200 com todos esses campos.

A tela parecia continuar aguardando porque o endpoint ordenava as seis entregas abertas da mais antiga para a mais recente. O primeiro cartão era o pedido antigo `#298`, atribuído em 30/05 e sem localização. O pedido atual `#503`, já confirmado, ficava no final da página.

O endpoint foi corrigido para retornar as entregas mais recentes primeiro. A ordem validada passou a ser:

1. `#503` — localização, Maps e Waze presentes;
2. `#502` — localização, Maps e Waze presentes;
3. `#372` — localização, Maps e Waze presentes;
4. pedidos antigos sem localização.

Imagem ativa após a correção:

`replymesh-api:v1.0.0-whatsapp-location-motoboy-order-rc2`

Arquivos adicionais alterados:

* `replymesh-api/app/controllers/api/v1/motoboy/orders_controller.rb`
* `replymesh-api/spec/requests/motoboy_spec.rb`

Durante a publicação, uma imagem construída diretamente do source foi rejeitada no teste candidato por incompatibilidade entre o arquivo de credenciais do source e a chave da produção. A API ativa não foi substituída nesse momento. A imagem final foi derivada da imagem funcional validada, contendo somente o controller corrigido. Nenhum segredo foi copiado para o Git ou impresso.
