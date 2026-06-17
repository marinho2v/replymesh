# REPLYMESH HOTFIX - Ocultar Branding Evolution

Data: 2026-06-17

## Objetivo

Remover textos visiveis que expunham o fornecedor interno de WhatsApp nas telas da Store e do Master.

## Escopo

Arquivos ajustados:

- store-template/src/pages/admin/Whatsapp.jsx
- store-template/src/pages/admin/WhatsappTemplates.jsx
- store-template/src/pages/admin/AppBanners.jsx
- store-template/src/knowledge_base/index.js
- replymesh-frontend/src/pages/whatsapp/WhatsApp.jsx
- replymesh-frontend/src/pages/logs/LogsAuditoria.jsx
- replymesh-frontend/src/components/layout/navigation.js
- replymesh-frontend/src/services/api.js

## Resultado

Textos visiveis foram trocados para Replymesh Connect, WhatsApp ou WhatsApp da loja.

Campos e rotas tecnicas internas nao foram alterados quando necessarios para compatibilidade.

## Validacao em producao

- Store: 200
- Master: 200
- API /up: 200
- grep publicado sem Evolution Go / Evolution API em Store e Master.

## Restricoes respeitadas

- Sem alteracao em Evolution.
- Sem alteracao em Mercado Pago.
- Sem migration/seed/reset/drop.
- Sem inclusao de segredos.
