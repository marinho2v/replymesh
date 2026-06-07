# Replymesh - Fase 15.11.1 - Mercado Pago Pix + Visual Premium

Data: 2026-06-05

## Objetivo

Corrigir o fluxo Pix Mercado Pago automatico e adicionar controles de personalizacao visual para o template `hamburgueria-premium`, sem iniciar VPS/deploy e sem alterar o 2R original.

## Pix Mercado Pago

Implementado:

- Checkout detecta `pix_provider = mercadopago` e `mercadopago_enabled = true`.
- Pix manual, payload manual e QR manual ficam ocultos nesse modo.
- Backend cria pagamento Pix via `MercadoPagoPixService`.
- Pedido fica com `payment_status = pending_payment`.
- Pedido salva `external_payment_id`, `pix_qr_code`, `pix_copy_paste`, `pix_qr_code_base64` e `pix_ticket_url`.
- Tela de sucesso mostra painel Mercado Pago quando o pedido ainda aguarda pagamento.
- Pix manual continua disponivel apenas quando a loja esta configurada como manual.

Correcao critica:

- `MercadoPagoPixService`, webhook e notificacoes nao usam mais `order.total`.
- O valor passa a vir de `total_brl` ou `total_cents`.

Seguranca:

- Access token Mercado Pago nao e retornado ao frontend.
- Documentacao nao recebeu chave real.
- Teste local usou token mock `TEST-/DEV-`, sem cobranca real.

## Visual Premium

Campos adicionados em `store_settings`:

- `hero_image_url`
- `hero_image_position`
- `hero_image_zoom`
- `hero_overlay_opacity`
- `hero_height`
- `theme_primary_color`

Frontend:

- Configuracoes > Identidade visual ganhou controles para esses campos.
- `hamburgueria-premium` aplica imagem, posicao, zoom, overlay, altura e cor primaria vindos da API.
- Fallbacks permanecem ativos quando a loja nao configura imagem/cor.

## Arquivos principais alterados

- `replymesh-api/app/services/mercado_pago_pix_service.rb`
- `replymesh-api/app/controllers/api/v1/public/orders_controller.rb`
- `replymesh-api/app/controllers/api/v1/public/stores_controller.rb`
- `replymesh-api/app/controllers/api/v1/webhooks/mercadopago_controller.rb`
- `replymesh-api/app/controllers/api/v1/company_settings_controller.rb`
- `replymesh-api/app/models/store_setting.rb`
- `replymesh-api/app/services/notification_service.rb`
- `store-template/src/pages/public/Checkout.jsx`
- `store-template/src/pages/public/Success.jsx`
- `store-template/src/pages/admin/Settings.jsx`
- `store-template/src/services/publicApi.js`
- `store-template/src/services/settings.js`
- `store-template/src/templates/hamburgueria-premium/components/PremiumHero.jsx`
- `store-template/src/templates/hamburgueria-premium/components/PremiumHeader.jsx`

## Migrations

- `20260605180100_add_premium_visual_controls_to_store_settings.rb`
- `20260605180101_add_pix_copy_paste_to_orders.rb`

## Testes executados

- `rails db:migrate`: OK.
- `rails routes`: OK.
- `ruby -c` nos arquivos Rails alterados: OK.
- `MercadoPagoPixService` mock com token `TEST-DEV-TOKEN`: OK, gerou payment id DEV, QR e base64.
- `GET /api/v1/public/demohamburgueria/store`: OK, retornou campos visuais e flags publicas do Mercado Pago.
- `npm run build` no `store-template`: OK.
- Verificacao visual local da home da Demo Hamburgueria: OK.

## Nao executado

- Cobranca real Mercado Pago.
- Simulacao approved com disparo de WhatsApp, para evitar envio real sem confirmacao.
- Deploy/VPS.

## Proxima recomendacao

Antes da Fase 16, decidir se o teste aprovado do Mercado Pago sera feito com pedido e telefone controlados, para validar webhook/simulacao sem enviar mensagem a cliente real.
