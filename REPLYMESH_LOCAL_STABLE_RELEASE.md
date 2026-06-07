# Replymesh Local Stable Release

## Identificacao

- Versao: `Replymesh Local Stable v0.15.22`
- Data: 06/06/2026
- Ambiente: local
- Rails API: `http://127.0.0.1:3000`
- Painel Master: `http://127.0.0.1:5173`
- Store-template: `http://127.0.0.1:5174`

## Status

Versao local congelada e aprovada pela bateria minima automatizada.

## Modulos concluidos localmente

- autenticacao e autorizacao;
- multiempresa por `company_id` e slug;
- onboarding e dominio padrao `replymesh.cloud`;
- empresas, planos, assinaturas e dominios;
- catalogo, checkout, pedidos, cozinha e acompanhamento;
- Pix manual e Mercado Pago local;
- WhatsApp/Evolution em modo local controlado;
- motoboy, mesas, caixa, estoque e relatorios;
- cupons, roleta, clientes e recuperador de vendas;
- tickets, logs, alertas e auditoria;
- Carina e IA da loja com RAG local;
- marketing WhatsApp controlado;
- solicitacao de Aplicativo Android.

## Modulos parciais

- dominios proprios com verificacao DNS/SSL;
- automacao da IA da loja por webhook publico;
- Mercado Pago em producao;
- marketing em escala;
- aplicativo Android/Flutter e push;
- templates Pizzaria, Doceria e Bebidas;
- financeiro avancado de motoboys.

## Variaveis obrigatorias

Os valores reais devem permanecer apenas nos ambientes seguros:

- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `DATABASE_NAME`
- `RAILS_MASTER_KEY`
- `JWT_SECRET`
- `EVOLUTION_GO_BASE_URL`
- `EVOLUTION_GO_API_KEY`
- `EVOLUTION_GO_MOCK_MODE`
- credenciais Mercado Pago
- credencial do provedor de IA

Nenhum valor real deve ser colocado em frontend, README, roadmap ou logs.

## Comandos

Backend:

```powershell
$env:PATH = "W:\replymesh-ruby\bin;W:\replymesh-ruby\msys64\ucrt64\bin;W:\replymesh-ruby\msys64\usr\bin;$env:PATH"
cd "W:\sas replymesh\replymesh-api"
bundle exec rails db:migrate
bundle exec rails s -b 127.0.0.1 -p 3000
```

Store-template:

```powershell
cd "W:\sas replymesh\store-template"
npm run dev -- --host 127.0.0.1 --port 5174
```

Painel Master:

```powershell
cd "W:\sas replymesh\replymesh-frontend"
npm run dev -- --host 127.0.0.1 --port 5173
```

Teste completo:

```powershell
W:\sas replymesh\scripts\smoke_all.ps1
```

## Resultado do congelamento

- Rails migrations: OK
- Rails routes: OK
- Ruby syntax: OK
- RSpec: 22 exemplos, 0 falhas
- store-template build: OK
- replymesh-frontend build: OK
- replymesh-frontend lint: OK
- rotas HTTP locais: OK
- secrets audit: OK

## Pendencias exclusivas da Fase 16

- DNS wildcard `*.replymesh.cloud`;
- Nginx para Master, API e lojas;
- SSL automatico;
- PostgreSQL de producao;
- Redis;
- Sidekiq ou scheduler;
- backups e teste de restauracao;
- logs centralizados e observabilidade;
- health checks;
- uploads publicos;
- webhook Evolution;
- webhook Mercado Pago;
- secrets de producao;
- CI/CD ou deploy manual documentado;
- rollback testado.

## Criterio de liberacao

**Liberada para iniciar o planejamento e a execucao controlada da Fase 16.**

Webhooks, pagamentos reais e integracoes externas ainda precisam de homologacao
no ambiente publico antes de liberar clientes em producao.

## Revisao 15.22

A versao congelada recebeu apenas refinamentos de UX e performance:

- lazy loading integral no Master;
- lazy loading das paginas publicas da loja;
- bundle inicial da loja reduzido para aproximadamente 73 kB;
- bundle inicial do Master reduzido para aproximadamente 53 kB;
- nenhum chunk acima de 500 kB;
- telas prioritarias verificadas sem erros de console;
- smoke completo repetido com 22 testes e 0 falhas.

O status de estabilidade permanece aprovado. Nenhuma regra de negocio foi
alterada e a Fase 16 nao foi iniciada.

## Revisao 15.23

A versao local recebeu a preparacao final de dominios oficiais:

- `replymesh.cloud` como dominio raiz;
- `app.replymesh.cloud` para o Painel Master;
- `api.replymesh.cloud` para a API Rails;
- `*.replymesh.cloud` para lojas;
- `companies.ssl_status` criado em modo local;
- slugs reservados de infraestrutura bloqueados;
- aba visual `Configuracoes > Infraestrutura / Dominios` adicionada ao Master.

Empresas existentes foram verificadas com subdominios `replymesh.cloud`.
DNS wildcard, Traefik/Nginx, SSL e dominio proprio real continuam exclusivos
da Fase 16. A Fase 16 nao foi iniciada.
