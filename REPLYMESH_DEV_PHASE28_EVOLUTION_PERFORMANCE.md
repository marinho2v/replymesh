# REPLYMESH DEV - Phase 2.8 Evolution Performance Optimization

Data: 2026-07-05

Branch: dev

## Objetivo

Reduzir carga da Evolution API sem alterar o comportamento funcional do WhatsApp da ReplyMesh.

## Implementado

### Cliente Evolution centralizado

Arquivo:

- `replymesh-api/app/services/evolution_go_client.rb`

Melhorias:

- cache por grupo `evolution` com TTL de 30 segundos;
- status da instancia cacheado;
- QR Code cacheado com possibilidade de `force`;
- listagem de instancias cacheada;
- timeouts configuraveis;
- retry com backoff para falhas de rede e respostas 5xx;
- keep-alive quando suportado por `Net::HTTP`;
- metricas com `company_id` quando a chamada pertence a uma empresa.

Variaveis opcionais:

- `EVOLUTION_GO_READ_TIMEOUT` padrao 5s;
- `EVOLUTION_GO_OPEN_TIMEOUT` padrao 2s;
- `EVOLUTION_GO_RETRY_ATTEMPTS` padrao 2;
- `EVOLUTION_GO_RETRY_BACKOFF_MS` padrao 250;
- `EVOLUTION_GO_KEEP_ALIVE_TIMEOUT` padrao 30s.

### Cache de Evolution

Arquivo:

- `replymesh-api/app/services/replymesh_cache_service.rb`

Grupo adicionado:

- `evolution`: 30 segundos.

Observacao:

- Em ambiente com `REPLYMESH_CACHE_PROVIDER=redis` e `REDIS_URL`, o cache usa Redis.
- Sem Redis configurado, permanece fallback seguro em memoria, sem quebrar o ambiente dev.

### Refresh assincromo de status

Arquivo novo:

- `replymesh-api/app/jobs/evolution_instance_status_refresh_job.rb`

Fluxo:

1. Tela solicita status.
2. API devolve dados locais imediatamente.
3. Se `last_remote_sync_at` estiver vencido, um job consulta Evolution em segundo plano.
4. A proxima leitura recebe os dados atualizados.

### Polling reduzido

Arquivo:

- `store-template/src/pages/admin/Whatsapp.jsx`

Alteracao:

- visivel: 15s -> 30s;
- aba oculta: 60s -> 120s.

### Refresh manual preservado

Arquivo:

- `store-template/src/services/storeApi.js`

O frontend agora envia `force=1` quando o usuario clica em "Atualizar status".

## Chamadas antes/depois

Antes:

- polling de status podia chamar Evolution a cada 15 segundos por tela aberta.

Depois:

- polling automatico nao chama Evolution diretamente;
- consulta real so ocorre via cache/job ou acao explicita;
- em condicoes normais, status remoto e limitado a no maximo 1 refresh a cada 30 segundos por instancia.

## Logs e seguranca

Nao foram adicionados logs de:

- mensagens;
- payload completo;
- contatos;
- conversas;
- tokens;
- API keys.

As metricas continuam agregadas no Performance Monitor.

## Pendencias futuras

- Migrar fila ActiveJob para worker dedicado quando a escala exigir.
- Avaliar WebSocket/SSE para status em tempo real.
- Criar pagina master especifica de saude da Evolution.
- Validar Redis real em producao para cache compartilhado entre processos.

## Validacoes

As validacoes executadas devem ser registradas na resposta final da tarefa.
