# Replymesh Frontend

Frontend React 18 + Vite do Painel Master Replymesh, convertido a partir do prototipo existente na raiz do projeto.

## Rodar

```powershell
cd "W:\sas replymesh\replymesh-frontend"
npm install
npm run dev
```

Abra:

```text
http://127.0.0.1:5173/dashboard
```

Login local:

```text
email: admin@replymesh.com.br
senha: admin123456
```

## Ambiente

Copie `.env.example` para `.env` se precisar customizar a API:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

## Empresas / Onboarding

O modulo Empresas esta conectado ao backend Rails API:

- `GET /api/v1/master/companies`
- `POST /api/v1/master/companies`
- `PATCH /api/v1/master/companies/:id`
- `PATCH /api/v1/master/companies/:id/activate`
- `PATCH /api/v1/master/companies/:id/deactivate`

A camada de API fica em `src/services/api.js` e anexa automaticamente o token JWT salvo no `localStorage`.

## Planos e Assinaturas

O modulo Planos e Assinaturas esta conectado ao backend Rails API:

- `/assinaturas` mostra MRR, trial, inadimplencia e tabela de assinaturas.
- `/assinaturas/planos` lista, cria e edita planos.
- `/assinaturas/faturas` reaproveita a tabela de assinaturas como historico inicial.
- `/assinaturas/inadimplencia` filtra assinaturas com status `overdue`.

Endpoints consumidos:

- `GET /api/v1/master/plans`
- `POST /api/v1/master/plans`
- `PATCH /api/v1/master/plans/:id`
- `GET /api/v1/master/subscriptions`
- `PATCH /api/v1/master/subscriptions/:id`

## Dominios

O modulo Dominios esta conectado ao backend Rails API:

- `/dominios` lista todos os dominios e permite criar/editar/desativar.
- `/dominios/dns` mostra dominios pendentes ou com erro de DNS.
- `/dominios/ssl` mostra dominios pendentes ou com erro de SSL.
- O botao `Verificar DNS` usa modo mock no backend.

Endpoints consumidos:

- `GET /api/v1/master/domains`
- `POST /api/v1/master/domains`
- `PATCH /api/v1/master/domains/:id`
- `DELETE /api/v1/master/domains/:id`
- `GET /api/v1/master/domains/:id/verify`
- `PATCH /api/v1/master/domains/:id/set_primary`

## WhatsApp / Evolution Go

As telas WhatsApp chamam apenas o backend Rails. A API key da Evolution Go nunca e exposta no frontend.

- `/whatsapp` lista instancias locais e executa acoes via Rails.
- `/whatsapp/qrcode` cria/seleciona instancia e solicita QR Code ao backend.
- `/whatsapp/templates` lista, cria e edita templates por empresa.
- `/whatsapp/logs` lista logs registrados no Rails.

Endpoints consumidos:

- `GET /api/v1/master/whatsapp/settings/test_connection`
- `GET /api/v1/master/whatsapp/instances`
- `POST /api/v1/master/whatsapp/instances`
- `GET /api/v1/master/whatsapp/instances/:id/status`
- `GET /api/v1/master/whatsapp/instances/:id/qrcode`
- `POST /api/v1/master/whatsapp/instances/:id/disconnect`
- `POST /api/v1/master/whatsapp/instances/:id/restart`
- `DELETE /api/v1/master/whatsapp/instances/:id`
- `GET /api/v1/master/whatsapp/templates`
- `POST /api/v1/master/whatsapp/templates`
- `PATCH /api/v1/master/whatsapp/templates/:id`
- `GET /api/v1/master/whatsapp/logs`

## Logs, Alertas e Auditoria

O modulo de auditoria esta conectado ao backend Rails API:

- `/logs` mostra visao geral de atividades e alertas.
- `/logs/atividades` filtra atividades gerais.
- `/logs/erros` destaca erros e alertas.
- `/logs/webhooks` prepara a visao para eventos de webhooks.
- `/logs/evolution` filtra eventos WhatsApp/Evolution Go.
- `/logs/automacoes` prepara a visao para automacoes.
- O Dashboard consome atividades recentes e alertas pendentes reais.

Endpoints consumidos:

- `GET /api/v1/master/activity_logs`
- `GET /api/v1/master/system_alerts`
- `PATCH /api/v1/master/system_alerts/:id/resolve`

## Validacao

```powershell
npm run lint
npm run build
```

Rotas principais:

- `/login`
- `/dashboard`
- `/empresas`
- `/empresas/nova`
- `/whatsapp`
- `/whatsapp/qrcode`
- `/whatsapp/templates`
- `/whatsapp/logs`
- `/dominios`
- `/dominios/dns`
- `/dominios/ssl`
- `/assinaturas`
- `/assinaturas/planos`
- `/assinaturas/faturas`
- `/assinaturas/inadimplencia`
- `/financeiro`
- `/usuarios-master`
- `/logs`
- `/logs/atividades`
- `/logs/erros`
- `/logs/webhooks`
- `/logs/evolution`
- `/logs/automacoes`
- `/tickets`
- `/configuracoes`
