# PDV STATUS REPORT — Auditoria FASE 16.20C

Data: 11/06/2026
Escopo: verificar se "Pedidos Balcão (PDV)" anunciado no plano START corresponde a um PDV comercial real.

## CLASSIFICAÇÃO FINAL

**D — Não existe PDV real.**

Não há tela de PDV, venda rápida ou criação manual de pedido pelo lojista em nenhuma parte do store-template. O termo "balcão" aparece apenas como texto de marketing (landing page e catálogo de features), não como funcionalidade.

## EVIDÊNCIAS

| Item auditado | Existe? | Evidência |
|---|---|---|
| Tela de PDV | ❌ | Nenhuma página em `store-template/src/pages/admin/` (28 páginas auditadas) |
| Venda rápida | ❌ | `Orders.jsx` apenas lista pedidos; não cria |
| Busca de produtos para venda | ❌ | Existe apenas no fluxo de mesa (`Tables.jsx`) |
| Adicionar itens a uma venda | ❌ | Apenas via comanda de mesa ou cardápio público |
| Selecionar cliente / cliente opcional | ❌ | Não há fluxo de venda onde aplicar |
| Finalizar venda | ❌ | Não há fluxo |
| Tipo de pedido "balcao" | ❌ | Backend: `Order::ORDER_TYPES = %w[delivery pickup dine_in]` — "balcao" não existe como tipo |
| Impressão | ⚠️ Parcial | Existe impressão de pedido no KDS e na comanda de mesa; não há impressão de venda balcão |
| Dinheiro / PIX / Cartão / Troco | ✅ (infra) | `CashService` + `Order` suportam money/pix/card_on_delivery + troco — mas sem tela que use isso para balcão |
| Abertura de caixa | ✅ | `CashRegister.jsx` + `CashService.open_session` |
| Fechamento de caixa | ✅ | Com conferência, diferença e sangria/reforço |
| Entra no financeiro | ✅ (infra) | `CashService.record_payment` registra qualquer pedido |
| Entra nos relatórios | ✅ (infra) | `reports_controller` soma pedidos `completed` por forma de pagamento |
| Movimenta estoque | ✅ (infra) | `InventoryService.deduct_for_order` em qualquer pedido aceito |
| Não exige mesa/delivery/motoboy | ✅ (infra) | `pickup` já funciona sem mesa, sem taxa, sem motoboy |

## O QUE FALTA PARA VIRAR PDV COMERCIAL

Toda a **retaguarda já existe** (caixa, estoque, financeiro, relatórios, pagamento). Falta apenas a frente de venda:

1. **Tela de venda rápida** (`/admin/pos` ou similar): grade de produtos com busca por nome/categoria, carrinho lateral, atalhos de teclado.
2. **Endpoint de criação de pedido pelo lojista** — hoje só existem: checkout público (`CheckoutService`), QR de mesa e comanda de garçom. Necessário um `POST /api/v1/store/orders` (admin/attendant) com `order_type: "pickup"` e `legacy_source: "pos"`, reaproveitando o padrão do `create_order_for_kitchen!` das mesas.
3. **Cliente opcional** no fluxo (nome livre, sem telefone obrigatório, sem WhatsApp).
4. **Finalização imediata**: criar pedido já `completed` + `CashService.record_payment` na mesma transação (venda balcão não passa pela cozinha necessariamente — ou opção "enviar para cozinha").
5. **Impressão de cupom não fiscal** ao finalizar (reaproveitar o padrão de impressão existente no KDS).
6. **Distinção visual** nos pedidos/relatórios: origem "Balcão (PDV)".

Estimativa: 1 tela nova + 1 endpoint + ajustes de serialização. Nenhuma migração de banco obrigatória (pode usar `order_type: pickup` + `legacy_source: pos`; se quiser tipo próprio "balcao", precisa de migração no enum e nos fluxos).

## RECOMENDAÇÃO COMERCIAL

Enquanto o PDV não for construído, **não vender "Pedidos Balcão (PDV)" como recurso do plano START** — ou reposicionar o texto para "Pedidos de Retirada" (que existe e funciona). Item registrado como pendência para fase futura.
