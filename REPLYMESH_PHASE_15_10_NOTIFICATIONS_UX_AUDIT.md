# REPLYMESH — Fase 15.10 — UX Final + Notificações

**Data:** 2026-06-05  
**Ambiente:** Local controlado  
**Status:** CONCLUÍDA

---

## Restrições respeitadas

- VPS não iniciada.
- Deploy não iniciado.
- Fase 16 não iniciada.
- 2R original não alterado.
- Regras de pedido, WhatsApp, motoboy, roleta, cupons e multiempresa não alteradas.

---

## 1. Produtos — Fix de Layout

### Problemas corrigidos

| Problema | Correção |
|---|---|
| Scroll horizontal na página | `overflow-hidden` no wrapper principal |
| Cards muito largos | Grid `grid-cols-2` mobile, `3→4→5→6` em breakpoints maiores |
| Barra de ações overflow | Refatorada para `flex-wrap gap-1.5` — botões menores (Ativar/Desativar/Excluir/Renumerar) |
| Nomes de categorias longos | `max-w-[140px] truncate` + `title={category.name}` para tooltip nativo |
| Cards de produto estourados | Grid responsivo correto — 2 colunas no mobile sempre |

### Grid de produtos

```
mobile:     grid-cols-2
sm (640px): grid-cols-3
lg (1024px): grid-cols-4
xl (1280px): grid-cols-5
2xl (1536px): grid-cols-6
```

---

## 2. Backend de Notificações

### Migration

```
20260605170000_create_notifications.rb
```

Tabela `notifications`:
- `company_id` (nullable — null = master)
- `user_id` (nullable)
- `title` (string, NOT NULL)
- `message` (text)
- `notification_type` (string, default: 'system')
- `read_at` (datetime, null = não lida)
- `link_url` (string)
- `metadata` (jsonb)
- `created_at / updated_at`

Índices: `notification_type`, `read_at`, `[company_id, read_at]`, `[user_id, read_at]`

**Migration aplicada:**
```
== 20260605170000 CreateNotifications: migrated (0.1454s)
```

### Model

`Notification` — escopo `.for_company`, `.unread`, `.recent`, `.mark_read!`, `.as_notification_json`

Tipos suportados: `order`, `ticket`, `system_update`, `whatsapp`, `billing`, `stock`, `cash`, `system_alert`

### Serviço

`NotificationService`:
- `.notify_company(company:, title:, message:, type:, link_url:, metadata:)`
- `.notify_master(title:, message:, type:, link_url:, metadata:)`
- `.order_received(order)` — chamado em `Public::OrdersController#create`
- `.ticket_created(ticket)` — chamado em `Store::TicketsController#create`
- `.ticket_replied(ticket)` — chamado em `Master::TicketsController#create_message`
- `.stock_low(...)` — disponível para uso futuro
- `.system_update(version:, notes:)` — broadcast para todas as empresas

### Endpoints store

```
GET   /api/v1/store/notifications         → lista 50 mais recentes + unread_count
PATCH /api/v1/store/notifications/read_all → marca todas como lidas
PATCH /api/v1/store/notifications/:id/read → marca uma como lida
```

### Endpoints master

```
GET   /api/v1/master/notifications
PATCH /api/v1/master/notifications/read_all
PATCH /api/v1/master/notifications/:id/read
```

Rotas validadas via `rails routes`:
- 6 rotas de notificação registradas sem conflitos

---

## 3. Frontend — Sistema de Notificações

### `useNotifications.js`

- Faz polling a cada 60s
- Retorna `{ notifications, unreadCount, loading, refetch, markRead, markAllRead }`
- Falhas são silenciosas (não quebram o painel)

### `NotificationsDropdown.jsx`

- Dropdown relativo ao botão sino
- Fecha ao clicar fora (via `mousedown` listener)
- Ícone + cor por tipo de notificação
- Timestamp relativo: "agora", "5min", "2h", "3d"
- Badge de não lida (bolinha amarela)
- "Marcar todas como lidas" (ícone CheckCheck)
- Clique na notificação → navega para `link_url` + marca como lida
- Footer com link para `/admin/updates`
- Estado vazio com ícone Bell

### `AdminLayout.jsx`

- Importa `useNotifications` e `NotificationsDropdown`
- Bell exibe `unreadCount` real (não mais hardcoded "4")
- Badge não aparece quando `unreadCount === 0`
- Suporte mostra badge apenas quando necessário (removido badge "Novo" estático)
- Link "Atualizações" adicionado ao menu (ícone Sparkles)

---

## 4. Página de Atualizações (`/admin/updates`)

**Rota:** `/loja/:slug/admin/updates`

**Componente:** `SystemUpdates.jsx`

Mostra histórico de versões com:
- Versão semântica
- Data
- Título
- Items: Novo (verde), Melhoria (azul), Correção (amarelo)
- Cards colapsáveis (primeiro aberto por padrão)
- Banner "Sistema atualizado" (verde)

Versões documentadas: 1.5.5 → 1.5.9.2

---

## 5. Integração com Eventos

| Evento | Notificação gerada |
|---|---|
| Pedido criado (`POST /public/:slug/orders`) | `order_received` → notifica empresa |
| Ticket criado pela loja | `ticket_created` → notifica master |
| Master responde ticket | `ticket_replied` → notifica empresa |

Integração é `rescue nil` — falha na notificação não quebra o pedido/ticket.

---

## 6. Testes técnicos

| Teste | Resultado |
|---|---|
| `ruby -c` 8 arquivos Rails alterados | ✅ ALL OK |
| `rails db:migrate` | ✅ CreateNotifications: migrated (0.1454s) |
| `rails routes` (notificações) | ✅ 6 rotas registradas corretamente |
| `npm run build` store-template | ✅ built in 8.57s — 0 erros |
| `npm run build` replymesh-frontend | ✅ built in 883ms — 0 erros |
| `npm run lint` replymesh-frontend | ✅ 0 erros ESLint |

---

## 7. Pendências não bloqueantes

| Pendência | Quando |
|---|---|
| Notificação de WhatsApp desconectado | Quando tiver webhook de status da Evolution |
| Notificação de estoque baixo automática | Após definir threshold e integrar com inventory |
| Notificações em tempo real (WebSocket/ActionCable) | Fase 16+ |
| Notificação de caixa aberto/fechado | Pode ser integrado ao CashRegister |
| Master recebe notificações no replymesh-frontend | Frontend master a implementar |
| `SystemUpdates` com conteúdo dinâmico do banco | Pode ser gerenciado via admin |

---

## Avaliação

| Dimensão | Score |
|---|---|
| **Backend** | **95/100** |
| **Frontend** | **90/100** |
| **UX** | **87/100** |
| **Produção local** | **92/100** |

---

*Gerado em 2026-06-05 — Fase 15.10 concluída*
