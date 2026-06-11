import { request } from './replymeshApi'
import { STORE_COMPANY_ID } from './storeApi'

const currentCompanyId = () => (
  localStorage.getItem('replymesh_store_company_id') || STORE_COMPANY_ID
)

const h = () => ({ 'X-Company-Id': String(currentCompanyId()) })

const toCents = (value) => Math.round(Number(value || 0) * 100)
const toBrl = (value) => Number(value || 0) / 100

const normalizeTable = (table = {}) => ({
  ...table,
  name: table.name || `Mesa ${table.number || table.id}`,
  active_session: table.active_session || null,
})

const normalizeSession = (session = {}) => ({
  ...session,
  discount_amount: session.discount_amount ?? toBrl(session.discount_cents),
  service_fee_amount: session.service_fee_amount ?? toBrl(session.service_fee_cents),
  dining_tables: session.dining_tables || session.table,
  profiles: session.profiles || null,
  orders: session.orders || null,
})

export const listDiningTables = async () => {
  const payload = await request('/store/dining_tables', { headers: h() })
  return (payload.dining_tables || []).map(normalizeTable)
}

export const createDiningTable = async (table) => {
  const payload = await request('/store/dining_tables', {
    method: 'POST',
    headers: h(),
    body: { dining_table: normalizeTablePayload(table) },
  })
  return normalizeTable(payload.dining_table)
}

export const updateDiningTable = async (tableId, table) => {
  const payload = await request(`/store/dining_tables/${encodeURIComponent(tableId)}`, {
    method: 'PATCH',
    headers: h(),
    body: { dining_table: normalizeTablePayload(table) },
  })
  return normalizeTable(payload.dining_table)
}

export const toggleDiningTableActive = async (tableId, isActive) => {
  const payload = await request(`/store/dining_tables/${encodeURIComponent(tableId)}`, {
    method: 'PATCH',
    headers: h(),
    body: { dining_table: { is_active: Boolean(isActive), status: isActive ? 'available' : 'disabled' } },
  })
  return normalizeTable(payload.dining_table)
}

export const deleteDiningTable = async (tableId) => {
  await request(`/store/dining_tables/${encodeURIComponent(tableId)}`, {
    method: 'DELETE',
    headers: h(),
  })
  return true
}

export const setTableQrEnabled = async ({ tableId, enabled }) => {
  const payload = await request(`/store/dining_tables/${encodeURIComponent(tableId)}/set_qr_enabled`, {
    method: 'PATCH',
    headers: h(),
    body: { enabled: Boolean(enabled) },
  })
  return normalizeTable(payload.dining_table)
}

export const regenerateTableQrToken = async ({ tableId }) => {
  const payload = await request(`/store/dining_tables/${encodeURIComponent(tableId)}/regenerate_qr`, {
    method: 'POST',
    headers: h(),
  })
  return normalizeTable(payload.dining_table)
}

export const openTableSession = async ({ tableId }) => {
  const payload = await request('/store/table_sessions', {
    method: 'POST',
    headers: h(),
    body: { table_session: { dining_table_id: tableId } },
  })
  return normalizeSession(payload.table_session)
}

export const getTableSession = async (sessionId) => {
  const payload = await request(`/store/table_sessions/${encodeURIComponent(sessionId)}`, { headers: h() })
  return normalizeSession(payload.table_session)
}

export const saveTableOrderItems = async ({ session, items, notes }) => {
  const subtotal = (items || []).reduce((sum, item) => sum + toCents(item.total_price), 0)
  const payload = await request(`/store/table_sessions/${encodeURIComponent(session.id)}`, {
    method: 'PATCH',
    headers: h(),
    body: {
      table_session: {
        notes,
        subtotal_cents: subtotal,
        total_cents: subtotal,
      },
    },
  })
  return {
    ...normalizeSession(payload.table_session),
    local_items: items,
  }
}

export const sendTableOrderToKitchen = async (session) => {
  const payload = await request(`/store/table_sessions/${encodeURIComponent(session.id)}`, {
    method: 'PATCH',
    headers: h(),
    body: {
      table_session: { status: 'sent_to_kitchen', sent_to_kitchen_at: new Date().toISOString(), notes: session.notes },
      items: session.local_items || [],
    },
  })
  return normalizeSession(payload.table_session)
}

export const requestTableClosure = async (sessionId) => {
  const payload = await request(`/store/table_sessions/${encodeURIComponent(sessionId)}`, {
    method: 'PATCH',
    headers: h(),
    body: { table_session: { status: 'waiting_payment', requested_close_at: new Date().toISOString() } },
  })
  return normalizeSession(payload.table_session)
}

export const closeTableSession = async ({ session, paymentMethod, discountAmount, serviceFee, notes }) => {
  const subtotal = Number(session.subtotal_cents || 0)
  const discount = toCents(discountAmount)
  const fee = toCents(serviceFee)
  const total = Math.max(0, subtotal + fee - discount)

  const payload = await request(`/store/table_sessions/${encodeURIComponent(session.id)}`, {
    method: 'PATCH',
    headers: h(),
    body: {
      table_session: {
        status: 'closed',
        payment_method: paymentMethod,
        payment_status: 'paid',
        notes,
        discount_cents: discount,
        service_fee_cents: fee,
        total_cents: total,
        paid_at: new Date().toISOString(),
        closed_at: new Date().toISOString(),
      },
    },
  })
  return normalizeSession(payload.table_session)
}

export const transferTableSession = async ({ sessionId }) => {
  return getTableSession(sessionId)
}

const normalizeTablePayload = (table = {}) => ({
  number: Number(table.number || table.name?.match(/\d+/)?.[0] || Date.now() % 100000),
  name: table.name,
  slug: table.slug || null,
  seats: Number(table.seats || 4),
  status: table.status || (table.is_active === false ? 'disabled' : 'available'),
  is_active: table.is_active !== false,
  sort_order: Number(table.sort_order || 0),
  notes: table.notes || null,
  qr_enabled: table.qr_enabled !== false,
})
