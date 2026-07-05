# REPLYMESH DEV - Phase 2.8 Evolution Performance Audit

Data: 2026-07-05

Branch: dev

## Escopo

Auditoria das chamadas ReplyMesh -> Evolution API com foco em reduzir chamadas repetidas, evitar bloqueio de tela e preparar a integracao para crescer sem sobrecarregar a VPS.

## Pontos auditados

### Backend

- `replymesh-api/app/services/evolution_go_client.rb`
  - Cliente central existente para Evolution.
  - Chamadas: listar instancias, criar instancia, status, QR Code, conectar, webhook, envio de texto, desconectar, reiniciar e excluir.
- `replymesh-api/app/controllers/api/v1/store/whatsapp/instances_controller.rb`
  - Loja consultava status diretamente na Evolution no endpoint de polling.
  - QR Code e reconexao continuam sendo acoes explicitas.
- `replymesh-api/app/controllers/api/v1/master/whatsapp/instances_controller.rb`
  - Master lista e sincroniza instancias.
  - Status e QR Code usam Evolution.
- `replymesh-api/app/services/whatsapp_status_dispatcher.rb`
  - Envio automatico de mensagens de status.
- `replymesh-api/app/services/marketing_message_service.rb`
  - Envio de campanhas via Evolution.
- `replymesh-api/app/controllers/api/v1/webhooks/evolution_controller.rb`
  - Respostas da IA via Evolution.
- `replymesh-api/app/services/company_onboarding_service.rb`
  - Criacao inicial de instancia durante onboarding.
- `replymesh-api/app/services/evolution_webhook_provisioner.rb`
  - Garantia de webhooks.

### Frontend loja

- `store-template/src/pages/admin/Whatsapp.jsx`
  - Polling anterior: 15 segundos visivel e 60 segundos oculto.
  - A cada polling chamava API da loja, que chamava Evolution diretamente.
- `store-template/src/services/storeApi.js`
  - Servico de status nao possuia opcao de forcar refresh.

## Gargalos encontrados

- Status da instancia era consultado de forma sincronizada durante polling.
- Polling de 15 segundos podia gerar muitas chamadas em poucas empresas.
- Erros 502 da Evolution voltavam para a tela e geravam repeticao.
- Cliente Evolution tinha timeout, mas nao possuia retry real para 5xx.
- Metricas de Evolution nao recebiam sempre o `company_id`, dificultando identificar empresa com maior consumo.

## Riscos observados

- Abrir a tela WhatsApp por varios usuarios poderia martelar Evolution.
- Instancia desconectada/removida na Evolution podia gerar 502 repetido.
- Sem cache, qualquer instabilidade da Evolution afetava a UX da loja.

## Estrategia recomendada

- Manter chamada real apenas em acoes explicitas:
  - preparar instancia;
  - reconectar / gerar QR Code;
  - atualizar status manualmente;
  - enviar mensagem.
- Converter polling automatico em leitura local + refresh assincromo.
- Cachear chamadas de status/lista/QR por 30 segundos.
- Instrumentar chamadas por empresa.
- Aplicar retry/backoff curto para falhas transientes.
