# REPLYMESH DEV - PERFORMANCE DASHBOARD UI REPORT

## Escopo

Implementada a interface Master > Performance consumindo exclusivamente o endpoint existente:

`GET /api/v1/master/performance`

Nenhum endpoint novo foi criado. Nenhuma metrica nova foi criada. Nenhuma regra de negocio, banco, VPS, main ou producao foi alterada.

## Correcao adicional validada

- Corrigido erro 500 no Dashboard Master causado por chamada direta a `company.logo_url` quando o modelo local nao possui esse metodo.
- A leitura da logo agora usa fallback seguro para `store_setting.logo_url`, sem alterar regras de negocio.

## Telas criadas

- Pagina Master Performance em `/performance`.
- Item de menu Master > Performance.

## Componentes visuais criados

- Hero de status da plataforma.
- Cards de CPU, RAM, Disco, Banco e Cache.
- Cards de servicos externos: Cloudflare R2, IA, Mercado Pago e Evolution.
- Lista de alertas operacionais.
- Tabela de empresas com maior consumo.
- Tabela de endpoints.
- Tabela de slow queries.
- Tabela de payloads.
- Tabela de indices do banco.
- Rodape tecnico com versoes e uptime.
- Paginacao simples nas tabelas longas para evitar tela gigante.
- Truncamento visual do SQL resumido, mantendo apenas o trecho seguro retornado pelo backend.

## Metricas exibidas

- Status do monitor.
- Ultima atualizacao.
- Janela de eventos.
- CPU utilizada.
- Load average.
- Memoria total, usada, livre e percentual.
- Disco total, usado, livre e percentual.
- Conexoes PostgreSQL abertas, maximas, ativas e ociosas.
- Tempo SQL medio.
- Media de queries por request.
- Cache hit, miss, hit rate, TTL medio e grupo mais usado.
- Tempo medio, maior tempo, menor tempo, chamadas e erros de Cloudflare R2.
- Tempo medio, maior tempo, menor tempo, chamadas e erros de IA.
- Tempo medio, chamadas e erros de Mercado Pago.
- Tempo medio, chamadas e erros de Evolution.
- Ranking de empresas com maior consumo.
- Endpoint mais lento e endpoint mais acessado quando disponiveis.
- Slow queries com SQL resumido.
- Payload medio, maior resposta e maior requisicao.
- Indices existentes, usados, nao usados e sugestoes.
- Versoes Ruby, Rails, PostgreSQL e Node.
- Uptime, threads Puma, conexoes HTTP abertas e tempo desde ultimo deploy.

## Metricas indisponiveis ou parciais

- Nome da empresa no ranking de consumo: backend retorna `company_id`, nao nome publico.
- Cloudflare por empresa: backend nao retorna consumo Cloudflare segmentado por empresa na tabela de empresas.
- Lista completa de endpoints com tempo medio individual: backend expoe endpoint mais lento, mais acessado e rankings por payload, mas nao uma lista agregada completa por endpoint.
- Graficos historicos: backend atual retorna snapshot/janela em cache, nao serie historica.

## Seguranca

A interface nao exibe:

- JWT
- Tokens
- API keys
- Headers
- Mensagens
- Telefone
- Pix
- Cartao
- Prompt IA
- Resposta IA
- SQL completo
- Dados pessoais de clientes

## Atualizacao automatica

- Polling a cada 5 segundos com a aba visivel.
- Polling reduzido para 30 segundos quando a aba esta oculta.
- Uma unica chamada por ciclo: `/api/v1/master/performance`.

## Melhorias futuras

- Backend retornar nomes seguros das empresas para o ranking.
- Backend retornar ranking agregado de endpoints com tempo medio, maior tempo, payload e requests.
- Backend retornar series historicas para pequenos graficos.
- Criar filtros por janela de tempo quando o backend suportar.

## Validacoes

- `npm run build` em `replymesh-frontend`: OK.
- `git diff --check`: OK.
- `ruby -c` em `replymesh-api/app/services/master_dashboard_service.rb`: OK.
- Auditoria de segredos no diff: OK.

## Commit

- Hash do commit: registrado no Git apos commit local.
