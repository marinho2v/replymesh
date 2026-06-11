# REPLYMESH FASE 16.21 — PDV / Balcão Completo
# STATUS: PRÉ-TESTE CONCLUÍDO — AGUARDANDO APROVAÇÃO PARA COMMIT/TAG

Data: 11/06/2026 22:28 UTC
Versão alvo: v0.15.33-pdv-balcao-rc1
Commit base: `bc49592`

---

## STATUS GERAL

```
IMPLEMENTAÇÃO:    ✅ Completa
VALIDAÇÃO LOCAL:  ✅ ruby -c, npm build, git diff --check, secrets, labels
PRÉ-TESTE VPS:    ✅ 15 examples, 0 failures (container isolado, banco descartável)
PRODUÇÃO INTACTA: ✅ replymesh-rails-api Up 5 hours — não tocado
COMMIT/TAG:       ⏸ Aguardando aprovação do usuário
DEPLOY:           ⏸ Não autorizado ainda
```

---

## RESULTADO DO PRÉ-TESTE FINAL

```
PDV / Balcao — PosController (FASE 16.21)
  Caso A — Dinheiro com troco
    cria pedido pos, completa, registra cash_movement origin=pos, calcula troco  ✅
    estoque e deducao chamados uma vez                                             ✅
    nao cria motoboy nem delivery                                                  ✅
  Caso B — Pix manual sem cliente
    cria pedido pos com pix, cash_movement sale_pix, origin=pos                   ✅
    aceita ausencia de customer_name e usa Balcao como fallback                   ✅
  Caso C — Cartao com desconto
    aplica desconto fixo e registra sale_card                                     ✅
    aplica desconto percentual                                                    ✅
  Caso D — Caixa fechado
    retorna erro amigavel                                                          ✅
  Caso E — Permissoes
    admin acessa                                                                  ✅
    attendant/employee acessa                                                     ✅
    waiter recebe 403                                                             ✅
    kitchen recebe 403                                                            ✅
  Caso F — Regressao
    delivery nao vira pos                                                         ✅
    PDV nao dispara WhatsApp                                                      ✅
    PDV nao gera giro de roleta                                                   ✅

Finished in 1.76 seconds (files took 0.93107 seconds to load)
15 examples, 0 failures
```

Banco: `replymesh_test` (postgres:16-alpine temporário, credenciais descartáveis)
Container `replymesh-rails-api`: **Up 5 hours — não tocado**
Cleanup: containers/rede/imagem/scripts temporários removidos

---

## ESCOPO IMPLEMENTADO

- Grade de produtos com busca e categorias
- Carrinho lateral com desconto (R$ fixo ou %)
- Formas de pagamento: dinheiro (com troco), PIX, cartão
- Caixa aberto obrigatório antes de vender
- `order_type: "pos"` direto para `completed` sem passar por cozinha/delivery
- Movimento financeiro com `origin: "pos"` e `movement_type` correto
- Dedução de estoque via `InventoryService`
- Sem WhatsApp, sem motoboy, sem giro de roleta
- Cupom não-fiscal via `window.open` (browser print)
- Permissão: `store_admin` + `employee`; waiter/kitchen/motoboy → 403
- Feature gate: `pos_counter` no plano START

---

## BUGS CORRIGIDOS (pós-RC1, não commitados)

| # | Arquivo | Bug | Fix |
|---|---|---|---|
| 1 | `order_status_service.rb` | WheelService chamado para pos | `unless @order.pos?` |
| 2 | `base_controller.rb` | employee bloqueado em `/store/pos` | `api/v1/store/pos` em `employee_allowed?` |
| 3 | `pos_controller.rb` | `company.store_name` → NoMethodError | `store_setting&.store_name` |
| 4 | `pos_controller.rb` | `payment_status` não atualizado | `update_column(:payment_status, "paid")` |
| 5 | `pos_controller_spec.rb` | CheckoutService sem Evolution | Teste simplificado |

---

## REGRAS MANTIDAS

- ✅ Não alterou Evolution / Mercado Pago / Lanche
- ✅ Não rodou seeds / db:reset / migrations em produção
- ✅ Não quebrou delivery / mesa / garçom / cozinha / financeiro
- ✅ Não tocou container ativo replymesh-rails-api
- ✅ Não publicou Store
- ✅ Não alterou banco de produção
- ✅ Commit/tag não criados sem aprovação final

---

## PRÓXIMOS PASSOS (aguardando aprovação)

```bash
# 1. Commitar os 5 arquivos pendentes
git add replymesh-api/app/controllers/api/v1/store/base_controller.rb
git add replymesh-api/app/controllers/api/v1/store/pos_controller.rb
git add replymesh-api/app/services/order_status_service.rb
git add replymesh-api/spec/requests/pos_controller_spec.rb
git add store-template/src/utils/orderStatus.jsx
git commit -m "Replymesh PDV Balcao fixes pos-rc1 v0.15.33"

# 2. Tag
git tag v0.15.33-pdv-balcao-rc1

# 3. Push
git push origin main --tags

# 4. Deploy VPS — somente após autorização explícita do usuário
```
