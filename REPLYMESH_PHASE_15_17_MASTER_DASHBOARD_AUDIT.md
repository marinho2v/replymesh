# REPLYMESH - Fase 15.17 Dashboard Master Executivo

Data: 06/06/2026
Status: concluida localmente

## Objetivo

Transformar o dashboard principal do Painel Master em uma visao executiva real
da plataforma Replymesh, com metricas, graficos, alertas, empresas recentes e
atividades reais do Rails.

## Backend

Criado:

- `GET /api/v1/master/dashboard`
- `MasterDashboardService`

O endpoint aceita:

- `period=today`
- `period=7d`
- `period=30d`
- `period=current_month`
- `period=previous_month`

Retorno estruturado:

- `overview`
- `charts`
- `alerts`
- `recent_companies`
- `recent_activities`

## Metricas Implementadas

- empresas totais, ativas, em teste, inativas e novas no periodo;
- usuarios master e usuarios das lojas;
- pedidos totais e pedidos de hoje;
- receita total processada pelos clientes;
- MRR estimado da Replymesh;
- assinaturas ativas e vencidas;
- WhatsApps conectados e desconectados;
- tickets abertos, em andamento e resolvidos;
- uso da Carina hoje;
- erros Mercado Pago;
- Pix aprovados e pendentes.

## Graficos

- receita processada por dia;
- pedidos por dia;
- empresas criadas por mes;
- tickets por status;
- uso da Carina por dia;
- WhatsApps conectados vs desconectados.

## Alertas Operacionais

Foram adicionados alertas para:

- empresa com WhatsApp desconectado;
- tickets abertos ou pendentes antigos;
- empresa em teste perto de vencer;
- empresa inativa, suspensa ou cancelada;
- pagamentos Pix pendentes antigos.

Cada alerta possui acao rapida quando aplicavel.

## Frontend Master

Atualizado:

- `replymesh-frontend/src/pages/Dashboard.jsx`
- `replymesh-frontend/src/services/api.js`
- `replymesh-frontend/src/components/ui/LineChart.jsx`
- `replymesh-frontend/src/styles/main.css`

Componentes/areas criadas na tela:

- filtro de periodo;
- cards executivos;
- faixa de metricas secundarias;
- graficos;
- alertas importantes;
- empresas recentes;
- atividades recentes.

## Seguranca

- Endpoint restrito por autenticacao.
- Usuario sem permissao recebe HTTP 403.
- A resposta JSON nao retorna tokens, senhas, API keys ou secrets.
- Dados agregados nao expõem credenciais das empresas.

## Testes Executados

Backend:

- `rails db:migrate`: OK
- `rails routes`: OK
- `ruby -c app/services/master_dashboard_service.rb`: OK
- `ruby -c app/controllers/api/v1/master/dashboard_controller.rb`: OK
- `GET /api/v1/master/dashboard?period=7d`: OK
- `GET /api/v1/master/dashboard?period=30d`: OK
- teste de usuario sem permissao: HTTP 403 OK
- verificacao de ausencia de termos sensiveis no JSON: OK

Frontend:

- `npm run lint` no `replymesh-frontend`: OK
- `npm run build` no `replymesh-frontend`: OK
- `npm run build` no `store-template`: OK
- teste visual em `http://127.0.0.1:5173/dashboard`: OK
- filtro `30 dias`: OK

Observacao: os builds mantem apenas o aviso conhecido de chunk grande do Vite.

## Resultado

O dashboard executivo master esta funcionando localmente com dados reais do
Rails, filtros, graficos, alertas, empresas recentes e atividades recentes.

## Fora do Escopo

- VPS/deploy.
- Fase 16.
- Alteracoes no 2R original.
- Alteracoes em pedidos, WhatsApp, Mercado Pago, motoboy, roleta, IA Carina ou
  templates.

## Proxima Recomendacao

Antes da Fase 16, fazer uma revisao operacional final das telas criticas:

- dashboard master;
- empresas;
- acesso como empresa;
- loja publica;
- checkout;
- Pix Mercado Pago;
- pedidos/admin;
- WhatsApp;
- motoboy;
- suporte;
- Carina.
