import { COMPANY_SLUG, centsToCurrency, request } from './replymeshApi'
import { setCurrentStoreCompany } from './storeApi'

const publicPath = (slug, path) => `/public/${encodeURIComponent(slug || COMPANY_SLUG)}${path}`

const mapStore = (store = {}) => ({
  ...store,
  name: store.store_name || store.name,
  logo_url: store.logo_url || '/logo.png',
  cover_url: store.cover_url || store.banner_url || '/capa.jpeg',
  display_address: [store.address, store.city, store.state].filter(Boolean).join(' - '),
  default_delivery_fee: centsToCurrency(store.default_delivery_fee_cents),
})

const mapCategory = (category = {}) => ({
  ...category,
  is_active: category.is_active !== false,
})

const mapOptionItem = (item = {}) => ({
  ...item,
  additional_price: item.additional_price ?? centsToCurrency(item.additional_price_cents),
  is_active: item.is_active !== false,
})

const mapOptionGroup = (group = {}) => ({
  ...group,
  type: group.type || group.group_type || 'single',
  group_type: group.group_type || group.type || 'single',
  min_select: Number(group.min_select || 0),
  max_select: Number(group.max_select || 1),
  required: Boolean(group.required),
  items: (group.items || []).map(mapOptionItem),
})

const mapProduct = (product = {}, category = null) => ({
  ...product,
  category: product.category || category,
  categories: product.category || category,
  price: product.price ?? centsToCurrency(product.price_cents),
  promotional_price: product.promotional_price ?? (
    product.promotional_price_cents ? centsToCurrency(product.promotional_price_cents) : null
  ),
  is_active: product.is_active !== false,
  is_local: false,
  option_groups: (product.option_groups || []).map(mapOptionGroup),
})

export const getPublicStoreInfo = async (slug = COMPANY_SLUG) => {
  const payload = await request(publicPath(slug, '/store'), { token: null })
  const store = mapStore(payload.store || {})
  setCurrentStoreCompany({ companyId: store.company_id || store.id, slug: store.slug || slug })
  return store
}

export const getPublicBanners = async (slug = COMPANY_SLUG) => {
  const payload = await request(publicPath(slug, '/banners'), { token: null })
  return payload.banners || []
}

export const getPublicBusinessHours = async (slug = COMPANY_SLUG) => {
  const payload = await request(publicPath(slug, '/business_hours'), { token: null })
  return {
    business_hours: payload.business_hours || [],
    exceptions: payload.exceptions || [],
  }
}

export const getPublicDeliveryZones = async (slug = COMPANY_SLUG) => {
  const payload = await request(publicPath(slug, '/delivery_zones'), { token: null })
  return (payload.delivery_zones || []).map((zone) => ({
    ...zone,
    delivery_fee: centsToCurrency(zone.delivery_fee_cents),
    minimum_order: centsToCurrency(zone.minimum_order_cents),
  }))
}

export const getPublicMenu = async (slug = COMPANY_SLUG) => {
  const payload = await request(publicPath(slug, '/menu'), { token: null })
  const categories = (payload.menu || []).map(mapCategory)
  const products = categories.flatMap((category) => (
    (category.products || []).map((product) => mapProduct(product, {
      id: category.id,
      name: category.name,
      slug: category.slug,
      is_active: category.is_active,
    }))
  ))

  return { categories, products }
}

export const getPublicProduct = async (productId, slug = COMPANY_SLUG) => {
  const payload = await request(publicPath(slug, `/products/${encodeURIComponent(productId)}`), { token: null })
  return mapProduct(payload.product || {})
}

export const lookupPublicCustomer = async (phone, slug = COMPANY_SLUG) => {
  const query = new URLSearchParams({ phone: String(phone || '') }).toString()
  const payload = await request(publicPath(slug, `/customers/lookup?${query}`), { token: null })
  return {
    found: Boolean(payload.found),
    customer: payload.customer || null,
  }
}

export const deletePublicCustomerAddress = async (phone, addressId, slug = COMPANY_SLUG) => {
  const query = new URLSearchParams({ phone: String(phone || '') }).toString()
  await request(publicPath(slug, `/customers/addresses/${encodeURIComponent(addressId)}?${query}`), {
    method: 'DELETE',
    token: null,
  })
}

export const createPublicOrder = async (orderPayload, slug = COMPANY_SLUG) => {
  const payload = await request(publicPath(slug, '/orders'), {
    method: 'POST',
    token: null,
    body: orderPayload,
  })

  // Retorna o pedido + dados de Pix MP se disponíveis
  return { ...(payload.order || {}), ...pickPixData(payload) }
}

const pickPixData = (payload) => {
  const keys = ['pix_payment_id', 'pix_qr_code', 'pix_copy_paste', 'pix_qr_code_base64', 'pix_ticket_url', 'pix_mode', 'pix_test_mode', 'pix_error']
  const result = {}
  keys.forEach(k => { if (payload[k] !== undefined) result[k] = payload[k] })
  return result
}

export const getPublicPaymentStatus = async (orderId, slug = COMPANY_SLUG) => {
  const payload = await request(publicPath(slug, `/payments/${orderId}/status`), { token: null })
  return payload
}

export const cancelPublicPixPayment = async (orderId, slug = COMPANY_SLUG) => {
  const payload = await request(publicPath(slug, `/orders/${encodeURIComponent(orderId)}/cancel_payment`), {
    method: 'POST',
    token: null,
  })
  return payload
}

export const getPublicOrder = async (orderId, slug = COMPANY_SLUG) => {
  const payload = await request(publicPath(slug, `/orders/${encodeURIComponent(orderId)}`), { token: null })
  return payload.order
}
