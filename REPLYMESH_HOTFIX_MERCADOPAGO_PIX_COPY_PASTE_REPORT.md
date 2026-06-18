# REPLYMESH HOTFIX — Mercado Pago Pix Copia e Cola

Data: 2026-06-18

## Status

PIX COPIA E COLA MERCADO PAGO CORRIGIDO

## Escopo

- Empresa validada: `lanchedo2r`
- Loja: `https://lanchesdo2r.com.br`
- API: `https://api.replymesh.cloud`
- Sem alterações em Evolution, Mercado Pago real, DNS, SSL ou estrutura de banco.
- Sem migrations, seeds, reset ou drop.

## Causa encontrada

O Pix QR Code atualizava porque a página ficava consultando o status por polling.
O Pix copia e cola podia ficar pendente porque:

- a criação do pagamento Mercado Pago não enviava `notification_url`;
- a criação do pagamento não enviava `external_reference` nem metadata suficiente;
- o webhook dependia quase exclusivamente de `external_payment_id` já salvo no pedido;
- a expiração local era curta demais para pagamentos feitos em outro app.

Foi encontrado caso real em produção:

- Pedido `#519` estava pendente localmente.
- Mercado Pago retornava pagamento `approved/accredited`.
- O pedido foi conciliado com segurança e passou para pago.

## Correções aplicadas

- `MercadoPagoPixService`
  - passa a enviar `notification_url`;
  - passa a enviar `external_reference`;
  - passa a enviar metadata com empresa, pedido, número e token público;
  - `check_payment` retorna `external_reference` e `metadata`.

- `MercadopagoController`
  - aceita formatos diferentes de webhook (`data.id`, `resource.id`, `id`, `payment_id`);
  - valida `type`, `topic` ou `action`;
  - quando não encontra pedido pelo `external_payment_id`, consulta contas Mercado Pago configuradas;
  - resolve pedido por metadata ou `external_reference`;
  - não imprime tokens/segredos.

- Expiração Pix
  - janela alterada de 3 para 15 minutos no backend;
  - polling do frontend ampliado para 15 minutos;
  - contador padrão visual ajustado para 15 minutos.

## Arquivos alterados

- `replymesh-api/app/controllers/api/v1/webhooks/mercadopago_controller.rb`
- `replymesh-api/app/services/mercado_pago_payment_processor.rb`
- `replymesh-api/app/services/mercado_pago_pix_service.rb`
- `replymesh-api/app/services/payment_expiration_service.rb`
- `replymesh-api/spec/requests/mercadopago_webhook_spec.rb`
- `replymesh-api/spec/services/mercado_pago_payment_processor_spec.rb`
- `replymesh-api/spec/services/mercado_pago_pix_service_spec.rb`
- `store-template/src/components/shared/MercadoPagoPixPanel.jsx`
- `store-template/src/hooks/usePixPayment.js`

## Backup

Backup criado na VPS:

`/opt/replymesh/backups/hotfix-mp-pix-copy-20260618-023326`

Inclui:

- arquivos da API substituídos;
- Store publicada antes do hotfix;
- inspect dos containers `replymesh-rails-api` e `replymesh-store`;
- lista de containers antes do deploy.

## Deploy

- Store publicada em `/opt/replymesh/store`.
- API recriada somente no container `replymesh-rails-api`.
- Imagem ativa:

`replymesh-api:mp-pix-copy-hotfix-20260618`

Observação operacional:

Durante o primeiro pacote enviado a partir do Windows, algumas pastas perderam permissão de execução. As permissões de diretórios foram corrigidas e a imagem foi rebuildada com `--no-cache`.

## Validações

Local:

- `ruby -c` OK nos arquivos Ruby alterados.
- `npm run build` OK em `store-template`.
- `git diff --check` OK.
- Auditoria de segredos OK.
- RSpec local não executou completo por dependências/gems nativas ausentes no Windows.

Produção:

- `https://api.replymesh.cloud/up` → 200
- `https://api.replymesh.cloud/api/v1/public/lanchedo2r/store` → 200
- `https://api.replymesh.cloud/api/v1/public/lanchedo2r/menu` → 200
- `https://lanchesdo2r.com.br/` → 200
- `https://lanchesdo2r.com.br/login` → 200
- `https://lanchesdo2r.com.br/checkout` → 200
- Webhook Mercado Pago controlado com pagamento real → 200
- Pedido `#519` conciliado como pago.
- Pedidos pendentes não aprovados permaneceram pendentes.

## Resultado

O fluxo agora não depende apenas do navegador aberto em polling. Novos pagamentos Pix Mercado Pago criados pela Replymesh passam a levar webhook assinado por URL pública e referência externa do pedido, permitindo atualização automática também no pagamento via copia e cola.

