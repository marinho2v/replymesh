# Replymesh Hotfix - Custom Domain Portals and Delivery Status

Data: 2026-06-17

## Problema corrigido nesta etapa

No painel de pedidos, pedidos `accepted` ainda exibiam o botao "Saiu para entrega" e o frontend enviava:

`PATCH /api/v1/store/orders/:id/status` com `status=out_for_delivery`

O backend ja estava correto e recusava:

`Transicao invalida: accepted -> out_for_delivery. Permitidas: preparing, cancelled.`

## Causa

O frontend da Store montava o fluxo de botoes a partir dos templates WhatsApp.
Quando o template de preparo estava inativo/desabilitado, o frontend removia `preparing` do fluxo visual e pulava direto de `accepted` para `out_for_delivery`.

Isso estava errado: templates WhatsApp podem controlar envio de mensagem, mas nao podem remover etapas obrigatorias do fluxo operacional.

Tambem havia bundle antigo/cacheado no padrao `20260614-hotfix`/`20260530`.

## Arquivos ajustados

- `store-template/src/utils/orderStatus.jsx`
- `store-template/src/components/dashboard/OrderActions.jsx`
- `store-template/vite.config.js`
- `store-template/src/pages/public/Promotions.jsx` sincronizado no source da VPS porque o router ja referenciava esse arquivo.
- `store-template/src/pages/admin/StoreAiSettings.jsx` sincronizado no source da VPS porque o router ja referenciava esse arquivo.

## Ajustes aplicados

- `normalizeOrderStatusFlow` agora preserva sempre as etapas oficiais:
  - `accepted`
  - `preparing`
  - `ready`
  - `out_for_delivery`
  - `completed`
- Templates WhatsApp nao removem mais essas etapas.
- Botao de `preparing` alterado para "Em preparo".
- Botao de `ready` alterado para "Pronto".
- Assets da Store passaram para o identificador:
  - `20260617-status-hotfix`

## Build e publicacao

Para evitar worktree local sujo, o build foi feito a partir de uma copia limpa do source atual da VPS em:

- `W:\tmp\replymesh-store-status-hotfix-vps-source\store-template`

Comandos/validacoes:

- `npm ci`: OK
- `npm run build`: OK
- Publicacao em `/opt/replymesh/store`: OK
- Container `replymesh-store`: reiniciado

Backup antes da publicacao:

- `/opt/replymesh/backups/store-status-hotfix-20260617-030213`

## Validacoes em producao

- `https://lanchedo2r.replymesh.cloud/admin/orders`: 200
- `replymesh-store` servindo `/opt/replymesh/store`: confirmado
- `index.html` publicado referencia assets `20260617-status-hotfix`
- Busca por `20260614-hotfix` e `20260530` em `/opt/replymesh/store`: nenhuma ocorrencia
- Bundle `orderStatus` publicado contem:
  - `preparing: true`
  - `ready: true`
  - `out_for_delivery: true`
  - `completed: true`
- Bundle `OrdersTable` publicado contem botoes:
  - "Em preparo"
  - "Pronto"
  - "Saiu para entrega"

## Teste real via API Store

Pedido QA criado:

- `id=2681`
- empresa: `lanchedo2r`
- tipo: `delivery`
- `skip_side_effects=true`

Sequencia validada em producao:

- `pending -> accepted`: HTTP 200
- `accepted -> preparing`: HTTP 200
- `preparing -> ready`: HTTP 200
- `ready -> out_for_delivery`: HTTP 200
- `out_for_delivery -> completed`: HTTP 200

## Resultado

Status de entrega corrigido no frontend publicado.

Pendente apenas validacao visual manual em navegador autenticado para confirmar:

- pedido aceito mostra botao "Em preparo";
- pedido em preparo mostra botao "Pronto";
- pedido pronto mostra botao "Saiu para entrega".
