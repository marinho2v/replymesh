# REPLYMESH DEV — VPS HEALTH MONITOR + DATABASE ANALYZER

## Escopo

Implementação realizada somente na branch `dev`, sem deploy, sem VPS, sem `main`, sem banco de produção e sem alteração de regra de negócio.

## CPU monitor

O endpoint protegido `GET /api/v1/master/performance` agora expõe um bloco `system.cpu` com percentual de uso estimado por amostragem curta em Linux.

## RAM monitor

O bloco `system.memory` lê `/proc/meminfo` quando disponível e retorna:

- memória total;
- memória utilizada;
- memória livre/disponível;
- percentual utilizado.

## Disco monitor

O bloco `system.disk` executa leitura segura de `df -k /` e retorna:

- mount;
- bytes totais;
- bytes usados;
- bytes livres;
- percentual usado.

## Banco monitor

O bloco `database` consulta apenas estatísticas nativas de leitura do PostgreSQL:

- conexões abertas;
- máximo permitido;
- conexões ociosas;
- conexões ativas;
- conexões por estado;
- tempo médio SQL medido por request;
- quantidade média de queries por request;
- tabelas mais consultadas.

Nenhum `VACUUM`, `ANALYZE`, migration ou alteração de configuração foi executado.

## Slow Queries

Toda query acima de `100 ms` passa a ser registrada em memória/cache com:

- endpoint;
- `company_id`;
- duração;
- quantidade de linhas quando disponível;
- SQL resumido e sanitizado;
- timestamp.

O SQL é resumido, truncado e tem literais substituídos por `?`. Não grava parâmetros, JWT, senha, telefone, mensagem, pagamento, Pix ou cartão.

## Payload

O monitor registra:

- tamanho do payload de resposta;
- tamanho do payload recebido por `Content-Length`;
- maior resposta;
- maior requisição;
- tempo aproximado de renderização/serialização;
- ranking de endpoints por tamanho.

## Cache

O cache analyzer foi expandido com:

- cache hit;
- cache miss;
- hit rate;
- miss rate;
- TTL médio observado;
- eventos por empresa;
- grupo de cache mais acessado;
- entradas expiradas quando esse evento existir.

O cache não é limpo automaticamente.

## Cloudflare

As chamadas do `CloudStorageService` para Cloudflare R2 foram instrumentadas apenas para medir:

- tempo médio;
- maior tempo;
- menor tempo;
- quantidade de chamadas;
- quantidade de erros.

Nenhuma credencial foi alterada ou registrada.

## IA

As chamadas dos providers de IA via `ClaudeAiService` e `OpenAiCompatibleChatService` foram instrumentadas apenas por tempo e sucesso/erro.

Conteúdo de conversa, prompts, mensagens e respostas não são registrados no monitor.

## Mercado Pago

As chamadas HTTP do `MercadoPagoPixService` foram instrumentadas apenas por tempo e sucesso/erro.

Dados de pagamento, token, Pix ou cartão não são registrados.

## Evolution

As chamadas HTTP do `EvolutionGoClient` foram instrumentadas apenas por tempo e sucesso/erro.

Telefones, mensagens e tokens não são registrados.

## Empresas

O bloco `companies.top_load` foi preparado com ranking por:

- empresa (`company_id`);
- quantidade de requests;
- quantidade de chamadas IA;
- média de resposta;
- uso de cache;
- maior payload;
- quantidade de queries;
- acessos a endpoints de pedidos.

Nenhum dado privado da empresa ou cliente é exposto.

## Índices auditados

O endpoint retorna `database.indexes` com:

- tabela;
- índices existentes;
- índices utilizados;
- índices nunca utilizados;
- sugestões somente informativas.

Nenhuma migration de índice foi criada nesta etapa.

## Performance Dashboard

Foi preparada a estrutura backend para futura tela Master:

- sistema;
- CPU;
- RAM;
- disco;
- banco;
- cache;
- Cloudflare;
- IA;
- Mercado Pago;
- Evolution;
- empresas;
- top endpoints;
- top queries;
- top payloads;
- top empresas.

A interface visual ainda não foi criada, conforme solicitado.

## Arquivos alterados

- `replymesh-api/app/services/performance_monitor_service.rb`
- `replymesh-api/app/controllers/application_controller.rb`
- `replymesh-api/app/services/replymesh_cache_service.rb`
- `replymesh-api/app/services/evolution_go_client.rb`
- `replymesh-api/app/services/mercado_pago_pix_service.rb`
- `replymesh-api/app/services/open_ai_compatible_chat_service.rb`
- `replymesh-api/app/services/claude_ai_service.rb`
- `replymesh-api/app/services/cloud_storage_service.rb`

## Pendências

- CPU depende de ambiente Linux com `/proc/stat`; fora da VPS/local Linux pode retornar `null`.
- Métricas de TTL/entradas expiradas são baseadas em eventos observados pelo cache atual, não em varredura interna do cache.
- `bundle exec rspec` não executou neste ambiente local por ausência de gems nativas/locais (`puma`, `bcrypt`, `bootsnap`, `msgpack`, `websocket-driver`, `bigdecimal`, `json`, `prism`, `erb`, `psych`).

## Validações executadas

- `ruby -c` nos Ruby alterados: OK.
- `npm run build` em `replymesh-frontend`: OK.
- `npm run build` em `store-template`: OK.
- `git diff --check`: OK.
- Auditoria de segredos no diff: OK (`NO_SECRET_MATCHES_IN_CODE_DIFF`).
- Testes existentes: pendente por ambiente local sem gems, conforme descrito acima.

## Hash do commit

Será confirmado após o commit final desta fase.
