import { request } from './replymeshApi'

const toCents = (value) => Math.round(Number(value || 0) * 100)
const toBrl = (value) => Number(value || 0) / 100

const emptySummary = {
  total_cash_sales: 0,
  total_pix_sales: 0,
  total_card_sales: 0,
  total_change_given: 0,
  total_sangria: 0,
  total_reinforcement: 0,
  total_withdrawal: 0,
  total_adjustment: 0,
  expected_cash_balance: 0,
}

const normalizeSession = (session) => {
  if (!session) return null
  const closing_expected_amount = session.closing_expected_brl ?? toBrl(session.closing_expected_cents)
  const closing_counted_amount  = session.closing_counted_brl ?? toBrl(session.closing_counted_cents)
  const difference_amount       = session.difference_brl ?? toBrl(session.difference_cents)
  return {
    ...session,
    opening_amount:          session.opening_amount_brl ?? toBrl(session.opening_amount_cents),
    closing_expected:        closing_expected_amount,
    closing_counted:         closing_counted_amount,
    difference:              difference_amount,
    closing_expected_amount,
    closing_counted_amount,
    difference_amount,
    opened_at: session.opened_at || session.created_at,
  }
}

const normalizeMovement = (movement) => ({
  ...movement,
  type: movement.movement_type || movement.type,
  amount: movement.amount_brl ?? toBrl(movement.amount_cents),
  orders: movement.orders ?? (movement.order_number ? { order_number: movement.order_number } : null),
  origin: movement.origin || null,
  origin_table_name: movement.origin_table_name || null,
  origin_waiter_name: movement.origin_waiter_name || null,
})

export const getOpenCashSession = async () => {
  try {
    const payload = await request('/store/cash_sessions/current')
    return normalizeSession(payload.cash_session)
  } catch (error) {
    if (error.status === 404) return null
    throw error
  }
}

export const getCashSessions = async ({ limit = 50 } = {}) => {
  const payload = await request('/store/cash_sessions', { params: { limit } })
  return (payload.cash_sessions || []).map(normalizeSession)
}

export const getCashMovements = async ({ sessionId, limit = 200 } = {}) => {
  const payload = await request('/store/cash_movements', {
    params: {
      cash_session_id: sessionId,
      limit,
    },
  })
  return (payload.cash_movements || []).map(normalizeMovement)
}

export const getCashSessionSummary = async (sessionId) => {
  if (!sessionId) return emptySummary
  const payload = await request(`/store/cash_sessions/${sessionId}`)
  return {
    ...emptySummary,
    ...(payload.cash_session?.movements_summary || {}),
  }
}

export const openCashSession = async ({ openingAmount, notes }) => {
  const payload = await request('/store/cash_sessions', {
    method: 'POST',
    body: {
      cash_session: {
        opening_amount_cents: toCents(openingAmount),
        notes,
      },
    },
  })
  return normalizeSession(payload.cash_session)
}

export const addCashMovement = async ({ type, amount, notes }) => {
  const payload = await request('/store/cash_movements', {
    method: 'POST',
    body: {
      movement_type: type,
      amount_cents: toCents(amount),
      notes,
    },
  })
  return normalizeMovement(payload.cash_movement)
}

export const closeCashSession = async ({ cashSessionId, countedAmount, notes }) => {
  const payload = await request(`/store/cash_sessions/${cashSessionId}/close`, {
    method: 'POST',
    body: {
      counted_cents: toCents(countedAmount),
      notes,
    },
  })
  return normalizeSession(payload.cash_session)
}

export const recordOrderPayment = async (orderId) => {
  const payload = await request(`/store/orders/${orderId}/record_payment`, { method: 'POST' })
  return payload.success !== false
}

export const getFinancialSummary = async () => {
  const [sessions, movements] = await Promise.all([
    getCashSessions({ limit: 100 }),
    getCashMovements({ limit: 1000 }),
  ])

  const summary = movements.reduce((acc, movement) => {
    const amount = Number(movement.amount || 0)
    acc.totalMovements += amount
    acc.byType[movement.type] = (acc.byType[movement.type] || 0) + amount
    if (movement.type === 'sale_cash') acc.cashSales += amount
    if (movement.type === 'sale_pix') acc.pixSales += amount
    if (movement.type === 'sale_card') acc.cardSales += amount
    if (movement.type === 'change_given') acc.changeGiven += amount
    if (movement.type === 'sangria') acc.sangria += amount
    if (movement.type === 'reinforcement') acc.reinforcement += amount
    if (movement.type === 'withdrawal') acc.withdrawal += amount
    return acc
  }, {
    totalMovements: 0,
    cashSales: 0,
    pixSales: 0,
    cardSales: 0,
    changeGiven: 0,
    sangria: 0,
    reinforcement: 0,
    withdrawal: 0,
    byType: {},
  })

  return { sessions, movements, summary }
}
