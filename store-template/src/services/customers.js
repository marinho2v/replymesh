import { COMPANY_SLUG, centsToCurrency, currentStoreCompanySlug, request } from './replymeshApi'
import { STORE_COMPANY_ID } from './storeApi'

const currentCompanyId = () => localStorage.getItem('replymesh_store_company_id') || STORE_COMPANY_ID
const storeHeaders = () => (currentCompanyId() ? { 'X-Company-Id': currentCompanyId() } : {})
const publicPath = (path, slug = currentStoreCompanySlug()) => `/public/${encodeURIComponent(slug || COMPANY_SLUG)}${path}`

export const normalizePhone = (phone = '') => {
  let digits = String(phone || '').replace(/\D/g, '')

  while (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('55') && digits.length >= 12) digits = digits.slice(2)
  while (digits.startsWith('0') && digits.length > 11) digits = digits.slice(1)

  return digits
}

const CUSTOMER_SESSION_KEY = 'customerProfile'
const customerSessionKey = (slug = currentStoreCompanySlug()) => `${CUSTOMER_SESSION_KEY}:${slug || COMPANY_SLUG}`

export const saveCustomerSession = (customer, slug) => {
  if (!customer?.id) return

  localStorage.setItem(customerSessionKey(slug), JSON.stringify({
    customer_id: customer.id,
    customer_phone: normalizePhone(customer.normalized_phone || customer.phone || customer.whatsapp),
    customer_name: customer.name || customer.full_name || '',
  }))
}

export const getSavedCustomerSession = (slug) => {
  try {
    const saved = localStorage.getItem(customerSessionKey(slug))
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export const clearCustomerSession = (slug) => {
  localStorage.removeItem(customerSessionKey(slug))
}

const normalizeCustomer = (customer = {}) => ({
  ...customer,
  name: customer.name || customer.full_name,
  total_spent: customer.total_spent ?? customer.total_spent_brl ?? centsToCurrency(customer.total_spent_cents),
  total_spent_brl: customer.total_spent_brl ?? centsToCurrency(customer.total_spent_cents),
  neighborhood: customer.neighborhood || customer.last_address?.neighborhood || customer.addresses?.[0]?.neighborhood || '',
  city: customer.city || customer.last_address?.city || customer.addresses?.[0]?.city || '',
})

const sortCustomers = (customers, sortBy = 'last_order') => {
  const list = [...customers]
  const value = (customer, key) => customer[key] ?? ''

  if (sortBy === 'name') return list.sort((a, b) => String(value(a, 'full_name')).localeCompare(String(value(b, 'full_name'))))
  if (sortBy === 'total_orders') return list.sort((a, b) => Number(b.total_orders || 0) - Number(a.total_orders || 0))
  if (sortBy === 'total_spent') return list.sort((a, b) => Number(b.total_spent || 0) - Number(a.total_spent || 0))
  return list.sort((a, b) => new Date(b.last_order_at || 0) - new Date(a.last_order_at || 0))
}

export const getCustomers = async (filters = {}) => {
  const payload = await request('/store/customers', {
    params: {
      q: filters.search,
      recurring: filters.is_recurring === undefined ? undefined : String(filters.is_recurring),
      limit: filters.limit || 200,
    },
    headers: storeHeaders(),
  })

  return sortCustomers((payload.customers || []).map(normalizeCustomer), filters.sortBy)
}

export const syncCustomersFromOrders = async () => ({ success: true, skipped: true })

export const getCustomerById = async (customerId) => {
  const payload = await request(`/store/customers/${encodeURIComponent(customerId)}`, {
    headers: storeHeaders(),
  })
  return normalizeCustomer(payload.customer || {})
}

export const getCustomerByPhone = async (phone, slug) => {
  const profile = await getCustomerProfileByPhone(phone, slug)
  return profile?.found ? normalizeCustomer(profile.customer) : null
}

export const getCustomerProfileByPhone = async (phone, slug) => {
  const query = new URLSearchParams({ phone: normalizePhone(phone) }).toString()
  const payload = await request(publicPath(`/wheel/profile?${query}`, slug), { token: null })
  return {
    found: Boolean(payload.found),
    customer: payload.customer ? normalizeCustomer(payload.customer) : null,
    wheel_spins: payload.wheel_spins || { available: 0, used: 0 },
    addresses: payload.addresses || payload.customer?.addresses || [],
    orders: payload.orders || [],
    coupons: payload.coupons || [],
  }
}

export const createCustomer = async (customerData) => {
  const payload = await request('/store/customers', {
    method: 'POST',
    headers: storeHeaders(),
    body: { customer: { ...customerData, phone: normalizePhone(customerData.phone) } },
  })
  return normalizeCustomer(payload.customer || {})
}

export const updateCustomer = async (customerId, customerData) => {
  const payload = await request(`/store/customers/${encodeURIComponent(customerId)}`, {
    method: 'PATCH',
    headers: storeHeaders(),
    body: { customer: customerData },
  })
  return normalizeCustomer(payload.customer || {})
}

export const updateCustomerStats = async () => true

export const getCustomerOrders = async (customerId) => {
  const customer = await getCustomerById(customerId)
  return customer.orders || []
}

export const getCustomerAddresses = async (customerId) => {
  const payload = await request(`/store/customers/${encodeURIComponent(customerId)}/addresses`, {
    headers: storeHeaders(),
  })
  return payload.addresses || []
}

export const deleteCustomerAddressByPhone = async (phone, addressId, slug) => {
  const query = new URLSearchParams({ phone: normalizePhone(phone) }).toString()
  await request(publicPath(`/customers/addresses/${encodeURIComponent(addressId)}?${query}`, slug), {
    method: 'DELETE',
    token: null,
  })
  return { success: true }
}

export const upsertCustomer = async (customerData) => createCustomer({
  full_name: customerData.full_name,
  phone: normalizePhone(customerData.phone),
  whatsapp: normalizePhone(customerData.whatsapp || customerData.phone),
  email: customerData.email || null,
  notes: customerData.notes || null,
})

export const exportCustomersToCsv = async (customers) => {
  const headers = ['Nome', 'Telefone', 'WhatsApp', 'Bairro', 'Cidade', 'Total de Pedidos', 'Total Gasto', 'Ultimo Pedido']
  const rows = customers.map(customer => [
    customer.full_name,
    customer.phone,
    customer.whatsapp || '',
    customer.neighborhood || '',
    customer.city || '',
    customer.total_orders || 0,
    Number(customer.total_spent || 0).toFixed(2),
    customer.last_order_at ? new Date(customer.last_order_at).toLocaleDateString('pt-BR') : '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `clientes_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
