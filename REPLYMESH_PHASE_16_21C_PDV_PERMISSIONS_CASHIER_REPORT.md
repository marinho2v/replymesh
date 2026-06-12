# REPLYMESH FASE 16.21C — PDV Permissions & Cashier Role Report

**Data:** 2026-06-11  
**Versão:** v0.15.38 RC1  
**Status:** FRONTEND DEPLOYED ✅ | BACKEND PENDING DEPLOY ⏳

---

## 1. Causa do 403

### Diagnóstico Técnico

O POST `https://api.replymesh.cloud/api/v1/store/pos/sale` retornava **403** porque:

**`pos_controller.rb#authorize_pos_role!`** só permitia os roles `store_admin` e `employee`:

```ruby
# ANTES (bug)
return if member&.role.in?(%w[store_admin employee])
```

Role `cashier` não existia em `CompanyMember::ROLES`, então qualquer usuário caixa:
1. Falha a validação do modelo (`inclusion: { in: ROLES }`) — não consegue ser criado
2. Se criado manualmente, recebe 403 em todas as rotas (não está em nenhum `*_allowed?`)

### Role real do admin Demo Hamburgueria

```
admin@demohamburgueria.com.br → role=store_admin (DB) → profile.role=admin (frontend)
```

O admin (`store_admin`) DEVERIA passar o `authorize_pos_role!`. A hipótese mais provável para o 403 reportado: **feature gate `pos_counter` estava desabilitada** anteriormente (antes do plano PRO ser ativado). Confirmado hoje: `pos_counter enabled=true source=plan`.

### Membros atuais da Demo Hamburgueria

| Email | Role DB | Role Frontend |
|-------|---------|---------------|
| admin@demohamburgueria.com.br | store_admin | admin |
| garcom.demo@replymesh.cloud | employee | attendant |
| cozinha.demo@replymesh.cloud | kitchen | kitchen |
| ju@gmail.com | kitchen | kitchen |
| motoboy.demo.qa@replymesh.cloud | motoboy | motoboy |
| waiter-test-16-21@replymesh.local | waiter | waiter |

**Nota:** `garcom.demo@replymesh.cloud` tem role `employee` (não `waiter`) — bug de cadastro anterior. Não alterado nesta fase.

---

## 2. Role Cashier — Implementação

### Backend (`replymesh-api`)

#### `app/models/company_member.rb`
```ruby
# ANTES
ROLES = %w[store_admin employee waiter kitchen motoboy support_viewer].freeze
# DEPOIS
ROLES = %w[store_admin cashier employee waiter kitchen motoboy support_viewer].freeze
```

#### `app/controllers/api/v1/store/base_controller.rb`
Adicionado `cashier?` e `cashier_allowed?`:
```ruby
def authorize_store_role!
  return true if performed? || current_user.super_admin?
  return true if store_admin?
  return true if cashier? && cashier_allowed?   # ← NOVO
  ...
end

def cashier?
  current_company_member&.role == "cashier"
end

def cashier_allowed?
  controller_path.in?(%w[
    api/v1/store/dashboard
    api/v1/store/orders
    api/v1/store/pos
    api/v1/store/cash_sessions
    api/v1/store/cash_movements
    api/v1/store/categories
    api/v1/store/products
    api/v1/store/dining_tables
    api/v1/store/table_sessions
    api/v1/store/features
    api/v1/store/notifications
    api/v1/store/reports
  ])
end
```

`api/v1/store/pos` removido de `employee_allowed?` — attendant não acessa PDV.

#### `app/controllers/api/v1/store/pos_controller.rb`
```ruby
# ANTES
return if member&.role.in?(%w[store_admin employee])
# DEPOIS
return if member&.role.in?(%w[store_admin cashier])
```

#### `app/controllers/api/v1/store/users_controller.rb`
```ruby
ROLE_MAP = {
  "cashier" => "cashier",   # ← NOVO
  "caixa"   => "cashier",   # ← NOVO alias PT
  ...
}

def public_role(member)
  case member.role
  when "cashier" then "cashier"  # ← NOVO
  ...
  end
end
```

### Frontend (`store-template`)

#### `src/services/auth.js`
```js
const membershipRoleToProfileRole = (role) => {
  if (['store_admin', 'super_admin', 'owner', 'manager'].includes(role)) return 'admin'
  if (role === 'cashier') return 'cashier'   // ← NOVO
  ...
}
```

#### `src/components/layout/AdminLayout.jsx`
- `normalizeStoreRole`: adicionado `cashier`
- Menu: `cashier` adicionado nas seções relevantes
- Link do logo: cashier → `/admin/pos`

| Rota | Roles |
|------|-------|
| Dashboard | admin, **cashier** |
| Pedidos | admin, attendant, **cashier** |
| PDV / Balcão | admin, **cashier** (removido attendant) |
| Mesas | admin, attendant, waiter, **cashier** |
| Caixa | admin, **cashier** |
| Relatórios | admin, **cashier** |
| Configurações | admin only |
| Usuários | admin only |
| WhatsApp | admin only |
| Marketing | admin only |
| IA | admin only |
| Estoque | admin only |
| Cupons/Roleta | admin only |
| Motoboys | admin, attendant |
| Clientes | admin, attendant |

#### `src/components/shared/ProtectedRoute.jsx`
- `normalizeStoreRole`: adicionado `cashier`
- fallbackPath: cashier → `/admin/pos`

#### `src/app/router.jsx`
- `SluggedAdminLayout`: adicionado `cashier` no `allowedRoles`
- `/admin` root: adicionado `cashier` no `allowedRoles`
- `adminChildren`: PDV route → `['admin', 'cashier']`
- `dashboard`: `['admin', 'cashier']`
- `cash-register`/`cash`: `['admin', 'cashier']`
- `tables`: `['admin', 'attendant', 'waiter', 'cashier']`
- `reports`: `['admin', 'cashier']`
- `customers`: `['admin', 'attendant']`
- `AdminIndexRedirect`: cashier → `/admin/pos`

---

## 3. Regra Final de Permissões

### Backend (proteção real — não confia só no frontend)

| Role DB | PDV | Caixa | Pedidos | Mesas | Config | Usuários | WhatsApp |
|---------|-----|-------|---------|-------|--------|----------|----------|
| store_admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| cashier | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| employee | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| waiter | ❌ | ❌ | ✅ (read) | ✅ | ❌ | ❌ | ❌ |
| kitchen | ❌ | ❌ | ✅ (kitchen/status) | ❌ | ❌ | ❌ | ❌ |
| motoboy | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Decisão: Attendant pode vender no PDV?

**NÃO** — por padrão, PDV é exclusivo de `admin` e `cashier`.  
Justificativa: PDV exige caixa aberto, registro financeiro e responsabilidade operacional. Attendant opera pedidos e atendimento, não caixa.

---

## 4. Fluxo Mesa x PDV

- **Mesa** → origem `table`, garçom abre comanda, cozinha prepara, caixa recebe pagamento (via Mesas/TableSessions)
- **PDV** → origem `pos`, venda rápida no balcão, pagamento imediato
- Pedido de mesa **NÃO** vira PDV. Rotas separadas, origens separadas.

---

## 5. Impressão / Comprovante

`PosSale.jsx` já possui `ReceiptModal` com `handlePrint` via `window.open`:
- ✅ Nome da loja
- ✅ Número da venda
- ✅ Data/hora
- ✅ Atendente/caixa
- ✅ Itens, subtotal, desconto, total
- ✅ Forma de pagamento
- ✅ Valor recebido + troco
- ✅ Origem: PDV / Balcão
- ✅ Botão "Imprimir" na modal
- ✅ Botão "Nova Venda" para limpar carrinho

---

## 6. UI do PDV

Estado atual:
- ✅ Caixa fechado → aviso "Caixa fechado" + botão para Abrir Caixa
- ✅ Venda finalizada → ReceiptModal com resumo + imprimir
- ✅ Carrinho limpo após venda com sucesso
- ✅ Botão desabilitado enquanto `loading=true` (previne duplo clique)
- ❌ Sem permissão → frontend redireciona para fallbackPath (não mostra mensagem específica)

---

## 7. Deploy Status

### Frontend (store-template)
- **Build:** `index-build-20260530-D-WLv_r6.js` ✅
- **VPS `/opt/replymesh/store/`:** extraído ✅
- **Container `replymesh-store`:** reiniciado ✅
- **URL pública:** `https://demohamburgueria.replymesh.cloud/` servindo `D-WLv_r6` ✅

### Backend (replymesh-api)
- **Arquivos modificados localmente:** ✅ (4 arquivos)
- **Source no VPS `/opt/replymesh/source/replymesh-api/`:** atualizado ✅
- **Container `replymesh-rails-api`:** ⏳ PENDENTE (requer autorização do usuário)

**Motivo do bloqueio:** O container não tem bind mounts. Para aplicar as mudanças é necessário reconstruir a imagem ou `docker cp` nos arquivos — ambos requerem autorização explícita devido à regra "Não tocar no container ativo replymesh-rails-api."

### Comandos para deploy do backend (executar na VPS):

```bash
# Opção A — Rebuild da imagem a partir do source atualizado
cd /opt/replymesh/source/replymesh-api
docker build -t replymesh-api:v0.15.38-cashier-permissions .

# Opção B — docker cp direto (mais rápido, sem rebuild)
docker cp /opt/replymesh/source/replymesh-api/app/models/company_member.rb \
  replymesh-rails-api:/rails/app/models/company_member.rb
docker cp /opt/replymesh/source/replymesh-api/app/controllers/api/v1/store/base_controller.rb \
  replymesh-rails-api:/rails/app/controllers/api/v1/store/base_controller.rb
docker cp /opt/replymesh/source/replymesh-api/app/controllers/api/v1/store/pos_controller.rb \
  replymesh-rails-api:/rails/app/controllers/api/v1/store/pos_controller.rb
docker cp /opt/replymesh/source/replymesh-api/app/controllers/api/v1/store/users_controller.rb \
  replymesh-rails-api:/rails/app/controllers/api/v1/store/users_controller.rb
docker restart replymesh-rails-api

# Após deploy, criar usuário caixa.demo
docker exec replymesh-rails-api bin/rails runner "
  company = Company.find_by(slug: 'demohamburgueria')
  user = User.find_or_initialize_by(email: 'caixa.demo@replymesh.cloud')
  user.name = 'Caixa Demo'
  user.global_role = 'user'
  user.status = 'active'
  user.password = '123456'
  user.save!
  member = company.company_members.find_or_initialize_by(user: user)
  member.role = 'cashier'
  member.status = 'active'
  member.save!
  puts 'Criado: ' + user.email + ' role=' + member.role
"
```

---

## 8. Usuário Caixa Demo

- **Email:** caixa.demo@replymesh.cloud
- **Senha:** 123456
- **Role:** cashier
- **Status:** ⏳ PENDENTE criação (aguarda deploy do backend)

---

## 9. Testes Obrigatórios (Pendentes)

### A) Admin da loja
- [ ] Acessar PDV
- [ ] Finalizar venda dinheiro
- [ ] Verificar caixa origem PDV

### B) Caixa (caixa.demo@replymesh.cloud)
- [ ] Login
- [ ] Menu visível: PDV, Pedidos, Mesas, Caixa, Relatórios
- [ ] Configurações bloqueadas
- [ ] Usuários bloqueados
- [ ] Venda dinheiro com troco
- [ ] Venda Pix manual
- [ ] Venda cartão
- [ ] Imprimir comprovante

### C) Atendente
- [x] **Decisão:** attendant NÃO tem PDV por padrão
- [x] Attendant vê: Pedidos, Mesas, Clientes, Motoboys

### D) Garçom
- [x] Não vê PDV (role cashier não inclui waiter, e waiter_allowed não inclui pos)
- [ ] Continua vendo mesas
- [ ] Continua conseguindo enviar para cozinha

### E) Cozinha
- [x] Não vê PDV
- [ ] Continua vendo KDS

### F) Regressão
- [ ] Delivery funcionando
- [ ] Retirada funcionando
- [x] PDV não envia WhatsApp (origin=pos sem whatsapp trigger)
- [x] PDV não cria motoboy (order_type=pos sem motoboy assignment)
- [x] PDV não gera roleta (sem coupon/wheel integration)

---

## 10. Bugs Encontrados

1. `garcom.demo@replymesh.cloud` tem role `employee` (deveria ser `waiter`) — bug de cadastro anterior, não corrigido nesta fase para não quebrar sessões ativas
2. O `feature_gate pos_counter` era provavelmente desabilitado antes do plano PRO ser ativado — causa original do 403

---

## 11. Commit/Tag

- **Commit:** `Replymesh PDV Cashier Permissions v0.15.38 RC1`
- **Tag:** `v0.15.38-pdv-cashier-permissions-rc1`
- **Status:** ⏳ PENDENTE (aguarda validação pós-deploy do backend)
