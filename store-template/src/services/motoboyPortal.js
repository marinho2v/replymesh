import { runSupabaseQuery, supabaseMotoboy } from './supabase'

export const getMyMotoboyDeliveries = async () => {
  const { data, error } = await runSupabaseQuery(
    supabaseMotoboy.rpc('get_my_motoboy_deliveries'),
    15000
  )

  if (error) throw error
  return Array.isArray(data) ? data : []
}

export const completeMyMotoboyDelivery = async (orderId, notes = null) => {
  const { data, error } = await runSupabaseQuery(
    supabaseMotoboy.rpc('complete_my_motoboy_delivery', {
      p_order_id: orderId,
      p_notes: notes,
    }),
    15000
  )

  if (error) throw error
  return data
}

export const getMotoboyStoreSettings = async () => {
  try {
    const { data, error } = await supabaseMotoboy
      .from('store_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  } catch {
    return null
  }
}

export const getMotoboyWhatsappTemplate = async (key) => {
  try {
    const { data, error } = await supabaseMotoboy
      .from('whatsapp_templates')
      .select('*')
      .eq('key', key)
      .maybeSingle()

    if (error) throw error
    return data
  } catch {
    return null
  }
}

export const getMotoboyProfile = async () => {
  const { data: { user } } = await supabaseMotoboy.auth.getUser()
  if (!user) return null
  const { data, error } = await supabaseMotoboy
    .from('motoboys')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) throw error
  return data
}

export const uploadMotoboyPhoto = async (motoboyId, file) => {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${motoboyId}.${ext}`

  // Upload para bucket "motoboy-photos" (cria se não existir via RLS)
  const { error: uploadError } = await supabaseMotoboy.storage
    .from('motoboy-photos')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabaseMotoboy.storage
    .from('motoboy-photos')
    .getPublicUrl(path)

  // Salva URL via RPC (SECURITY DEFINER) para bypassar RLS
  const { error: updateError } = await supabaseMotoboy
    .rpc('update_my_photo_url', { p_url: publicUrl })

  if (updateError) throw updateError
  return publicUrl
}

const _getMotoboyId = async () => {
  const { data: { user } } = await supabaseMotoboy.auth.getUser()
  if (!user) return null
  const { data } = await supabaseMotoboy
    .from('motoboys')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  return data?.id ?? null
}

// Retorna data no formato YYYY-MM-DD (adjustment_date é tipo date no banco)
const _filterFromDate = (filter) => {
  const now = new Date()
  let d
  if (filter === '7days') d = new Date(now - 7 * 24 * 60 * 60 * 1000)
  else if (filter === 'month') d = new Date(now.getFullYear(), now.getMonth(), 1)
  else d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return d.toISOString().slice(0, 10) // "YYYY-MM-DD"
}

// Retorna ISO string para filtros de timestamp (assigned_at)
const _filterFromISO = (filter) => {
  const now = new Date()
  if (filter === '7days') return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
  if (filter === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
}

export const getMotoboyHistory = async (filter = 'today') => {
  const motoboyId = await _getMotoboyId()
  if (!motoboyId) return []

  const { data, error } = await supabaseMotoboy
    .from('delivery_history')
    .select('order_id, assigned_at, delivered_at, status, orders!inner(*)')
    .eq('motoboy_id', motoboyId)
    .eq('orders.status', 'completed') // só pedidos realmente finalizados
    .gte('assigned_at', _filterFromISO(filter))
    .order('assigned_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return (data || []).map(row => ({
    ...(row.orders || {}),
    assigned_at: row.delivered_at || row.assigned_at || row.orders?.assigned_at,
    delivery_status: row.status || row.orders?.delivery_status,
  }))
}

// Aceita { filter } OU { fromDate, toDate } no formato "YYYY-MM-DD"
export const getMotoboyFinance = async ({ filter = 'month', fromDate: customFrom = null, toDate: customTo = null } = {}) => {
  const motoboyId = await _getMotoboyId()
  if (!motoboyId) return null

  const todayStr = new Date().toISOString().slice(0, 10)
  const fromDate = customFrom || _filterFromDate(filter)
  const toDate   = customTo   || todayStr
  const fromISO  = new Date(fromDate + 'T00:00:00').toISOString()
  const toISO    = new Date(toDate   + 'T23:59:59').toISOString()

  // Ajustes financeiros — tabela real: motoboy_financial_adjustments
  let adjustments = []
  try {
    let q = supabaseMotoboy
      .from('motoboy_financial_adjustments')
      .select('*')
      .eq('motoboy_id', motoboyId)
      .gte('adjustment_date', fromDate)
      .lte('adjustment_date', toDate)
      .order('adjustment_date', { ascending: false })

    const adjResult = await q
    if (!adjResult.error) adjustments = adjResult.data || []
  } catch (_) {}

  // Entregas do período via delivery_history
  let deliveries = []
  try {
    const delivResult = await supabaseMotoboy
      .from('delivery_history')
      .select('order_id, assigned_at, status, orders(status, delivery_fee)')
      .eq('motoboy_id', motoboyId)
      .gte('assigned_at', fromISO)
      .lte('assigned_at', toISO)

    if (!delivResult.error) deliveries = delivResult.data || []
  } catch (_) {}

  // Concluídas = status delivered na delivery_history OU no orders
  const completed = deliveries.filter(r =>
    r.status === 'delivered' || ['completed', 'delivered'].includes(r.orders?.status)
  )
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayCompleted = completed.filter(r => new Date(r.assigned_at) >= todayStart)

  const periodFee = completed.reduce((s, r) => s + (Number(r.orders?.delivery_fee) || 0), 0)
  const todayFee  = todayCompleted.reduce((s, r) => s + (Number(r.orders?.delivery_fee) || 0), 0)

  const isCredit = (a) => {
    if (a.direction === 'credit') return true
    if (a.direction === 'debit') return false
    return false // se não tem direction, assume débito por segurança
  }

  const credits = adjustments.filter(isCredit).reduce((s, a) => s + Number(a.amount || 0), 0)
  const debits  = adjustments.filter(a => !isCredit(a)).reduce((s, a) => s + Number(a.amount || 0), 0)

  return {
    todayDeliveries: todayCompleted.length,
    todayFee,
    periodDeliveries: completed.length,
    periodFee,
    netAmount: periodFee + credits - debits,
    totalCredits: credits,
    totalDebits: debits,
    adjustments,
  }
}
