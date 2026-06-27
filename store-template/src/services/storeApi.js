import { request } from './replymeshApi'

export const STORE_COMPANY_ID = import.meta.env.VITE_REPLYMESH_COMPANY_ID || '4'

const currentCompanyId = () => (
  localStorage.getItem('replymesh_store_company_id') || STORE_COMPANY_ID
)

export const setCurrentStoreCompany = ({ companyId, slug } = {}) => {
  if (companyId) localStorage.setItem('replymesh_store_company_id', String(companyId))
  if (slug) localStorage.setItem('replymesh_store_company_slug', String(slug))
}

const withCompanyHeader = (companyId) => (
  companyId ? { 'X-Company-Id': String(companyId) } : {}
)

const h = () => withCompanyHeader(currentCompanyId())

const toCents = (val) => (val == null || val === '' ? null : Math.round(Number(val) * 100))
const toBrl   = (cents) => (cents == null ? null : cents / 100)

const clearCatalogCache = () => {
  try {
    Object.keys(sessionStorage)
      .filter(key => key.startsWith('categories:') || key.startsWith('products:') || key.startsWith('public-menu:'))
      .forEach(key => sessionStorage.removeItem(key))
  } catch {
    // Cache local nao pode bloquear a acao principal.
  }
}

// ── Normalizers: Rails shape → page shape ─────────────────────────────────────

const normalizeProduct = (p) => ({
  ...p,
  price:             toBrl(p.price_cents),
  promotional_price: p.promotional_price_cents ? toBrl(p.promotional_price_cents) : null,
  cost_price:        toBrl(p.cost_price_cents ?? 0),
  category_id:       p.category?.id ?? p.category_id ?? null,
})

const normalizeCategory = (c) => ({ ...c })

const normalizeZone = (z) => ({
  ...z,
  delivery_fee:          toBrl(z.delivery_fee_cents),
  minimum_order_amount:  toBrl(z.minimum_order_cents ?? 0),
  estimated_time:        z.estimated_minutes ? String(z.estimated_minutes) : '',
  estimated_distance_km: z.estimated_distance_km ?? '',
  logistics_group:       z.logistics_group || '',
  latitude:              z.latitude ?? '',
  longitude:             z.longitude ?? '',
  internal_note:         z.internal_note || z.notes || '',
})

const normalizeBanner = (b) => ({
  id:         b.id,
  title:      b.title,
  image_url:  b.image_url,
  link_url:   b.link_url,
  is_active:  b.is_active,
  sort_order: b.sort_order,
})

// ── Orders ────────────────────────────────────────────────────────────────────

export const getStoreOrders = (options = {}) => (
  request('/store/orders', {
    params: options.params,
    headers: withCompanyHeader(options.companyId || currentCompanyId()),
  })
)

export const getKitchenOrders = (options = {}) => (
  request('/store/kitchen/orders', {
    params: options.params,
    headers: withCompanyHeader(options.companyId || currentCompanyId()),
  }).then(payload => payload.orders || [])
)

export const getStoreOrder = (orderId, options = {}) => (
  request(`/store/orders/${encodeURIComponent(orderId)}`, {
    headers: withCompanyHeader(options.companyId || currentCompanyId()),
  }).then(payload => payload.order)
)

export const updateStoreOrderStatus = (orderId, status, options = {}) => (
  request(`/store/orders/${encodeURIComponent(orderId)}/status`, {
    method: 'PATCH',
    body: { status, skip_side_effects: Boolean(options.skipSideEffects) },
    headers: withCompanyHeader(options.companyId || currentCompanyId()),
  }).then(payload => ({
    ...payload.order,
    manual_whatsapp: payload.manual_whatsapp || null,
  }))
)

export const railsGetMotoboys = (options = {}) => (
  request('/store/motoboys', {
    params: options.params,
    headers: withCompanyHeader(options.companyId || currentCompanyId()),
  }).then(payload => payload.motoboys || [])
)

export const railsAssignMotoboyToOrder = (orderId, motoboyId, options = {}) => (
  request(`/store/orders/${encodeURIComponent(orderId)}/assign_motoboy`, {
    method: 'POST',
    body: { motoboy_id: motoboyId, notes: options.notes },
    headers: withCompanyHeader(options.companyId || currentCompanyId()),
  }).then(payload => ({
    ...(payload.order || {}),
    route_suggestion: payload.route_suggestion || null,
  }))
)

export const railsGetMotoboyRouteSuggestion = (motoboyId, options = {}) => (
  request('/store/orders/route_suggestion', {
    params: { motoboy_id: motoboyId },
    headers: withCompanyHeader(options.companyId || currentCompanyId()),
  }).then(payload => payload.route_suggestion)
)

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const getDashboardStats = (options = {}) => (
  request('/store/dashboard', {
    headers: withCompanyHeader(options.companyId || currentCompanyId()),
  })
)

export const railsGetFeatureAccess = (options = {}) => (
  request('/store/features', {
    headers: withCompanyHeader(options.companyId || currentCompanyId()),
  })
)

// ── Public (kept for menu/checkout) ──────────────────────────────────────────

export const getStoreCategories = (options = {}) => (
  request('/store/categories', { headers: withCompanyHeader(options.companyId) })
)

export const getStoreProducts = (options = {}) => (
  request('/store/products', {
    params: options.params,
    headers: withCompanyHeader(options.companyId),
  })
)

// ── Admin: Categories ─────────────────────────────────────────────────────────

export const railsGetCategories = () =>
  request('/store/categories', { headers: h() })
    .then(r => (r.categories || []).map(normalizeCategory))

export const railsCreateCategory = (data) =>
  request('/store/categories', {
    method: 'POST',
    headers: h(),
    body: { category: { name: data.name, slug: data.slug, sort_order: data.sort_order ?? 0, is_active: data.is_active !== false } },
  }).then(r => {
    clearCatalogCache()
    return normalizeCategory(r.category)
  })

export const railsUpdateCategory = (id, data) =>
  request(`/store/categories/${id}`, {
    method: 'PATCH',
    headers: h(),
    body: { category: { name: data.name, slug: data.slug, sort_order: data.sort_order, is_active: data.is_active } },
  }).then(r => {
    clearCatalogCache()
    return normalizeCategory(r.category)
  })

export const railsDeleteCategory = (id) =>
  request(`/store/categories/${id}`, { method: 'DELETE', headers: h() }).then(r => {
    clearCatalogCache()
    return r
  })

// ── Admin: Products ───────────────────────────────────────────────────────────

export const railsGetProducts = (params = {}) =>
  request('/store/products', { headers: h(), params })
    .then(r => (r.products || []).map(normalizeProduct))

export const railsGetProduct = (id) =>
  request(`/store/products/${id}`, { headers: h() })
    .then(r => normalizeProduct(r.product))

const productToRails = (data, { partial = false } = {}) => {
  const product = {}

  if (!partial || data.name !== undefined) product.name = data.name
  if (data.slug !== undefined) product.slug = data.slug || null
  if (!partial || data.description !== undefined) product.description = data.description || null
  if (!partial || data.category_id !== undefined) product.category_id = data.category_id || null
  if (!partial || data.price !== undefined) product.price_cents = toCents(data.price)
  if (!partial || data.promotional_price !== undefined) {
    product.promotional_price_cents = data.promotional_price ? toCents(data.promotional_price) : null
  }
  if (!partial || data.cost_price !== undefined) product.cost_price_cents = data.cost_price ? toCents(data.cost_price) : 0
  if (!partial || data.image_url !== undefined) product.image_url = data.image_url || null
  if (data.is_featured !== undefined) product.is_featured = !!data.is_featured
  if (data.is_promotional !== undefined) product.is_promotional = !!data.is_promotional
  if (data.is_combo !== undefined) product.is_combo = !!data.is_combo
  if (data.is_customizable !== undefined) product.is_customizable = !!data.is_customizable
  if (data.sort_order !== undefined) product.sort_order = Number(data.sort_order) || 0
  if (data.is_active !== undefined) product.is_active = data.is_active !== false
  if (data.track_inventory !== undefined) product.track_inventory = !!data.track_inventory
  if (data.stock_item_id !== undefined || data.track_inventory !== undefined) {
    product.stock_item_id = data.track_inventory ? (data.stock_item_id || null) : null
  }

  return product
}

export const railsCreateProduct = (data) =>
  request('/store/products', {
    method: 'POST', headers: h(),
    body: { product: productToRails(data) },
  }).then(r => normalizeProduct(r.product))

export const railsUpdateProduct = (id, data) =>
  request(`/store/products/${id}`, {
    method: 'PATCH', headers: h(),
    body: { product: productToRails(data, { partial: true }) },
  }).then(r => normalizeProduct(r.product))

export const railsDeleteProduct = (id) =>
  request(`/store/products/${id}`, { method: 'DELETE', headers: h() })

export const railsUpdateProductsStatus = async (ids, isActive) => {
  await Promise.all(ids.map(id =>
    request(`/store/products/${id}`, {
      method: 'PATCH', headers: h(),
      body: { product: { is_active: isActive } },
    })
  ))
}

export const railsUpdateProductsSortOrder = async (items) => {
  await Promise.all(items.map(({ id, sort_order }) =>
    request(`/store/products/${id}`, {
      method: 'PATCH', headers: h(),
      body: { product: { sort_order } },
    })
  ))
}

// ── Admin: Option Groups ──────────────────────────────────────────────────────

export const railsGetOptionGroups = (productId) =>
  request(`/store/products/${productId}/option_groups`, { headers: h() })
    .then(r => (r.option_groups || []).map(g => ({
      ...g,
      type: g.group_type,
      items: (g.items || []).map(item => ({
        ...item,
        additional_price: toBrl(item.additional_price_cents ?? 0),
      })),
    })))

export const railsSaveOptionGroups = async (productId, groups) => {
  const existing = await railsGetOptionGroups(productId)
  const existingIds = existing.map(g => g.id)

  for (const group of groups) {
    const railsGroup = {
      name:       group.name,
      group_type: group.type || group.group_type || 'single',
      required:   !!group.required,
      min_select: Number(group.min_select) || 0,
      max_select: Number(group.max_select) || 1,
      sort_order: Number(group.sort_order) || 0,
    }

    let savedGroup
    if (group.id && existingIds.includes(group.id)) {
      savedGroup = await request(`/store/products/${productId}/option_groups/${group.id}`, {
        method: 'PATCH', headers: h(),
        body: { option_group: railsGroup },
      }).then(r => r.option_group)
    } else {
      savedGroup = await request(`/store/products/${productId}/option_groups`, {
        method: 'POST', headers: h(),
        body: { option_group: railsGroup },
      }).then(r => r.option_group)
    }

    for (const item of (group.items || [])) {
      const railsItem = {
        name:                 item.name,
        additional_price_cents: toCents(item.additional_price ?? 0),
        is_active:            item.is_active !== false,
        sort_order:           Number(item.sort_order) || 0,
      }
      if (item.id) {
        await request(`/store/products/${productId}/option_groups/${savedGroup.id}/items/${item.id}`, {
          method: 'PATCH', headers: h(),
          body: { option_item: railsItem },
        })
      } else {
        await request(`/store/products/${productId}/option_groups/${savedGroup.id}/items`, {
          method: 'POST', headers: h(),
          body: { option_item: railsItem },
        })
      }
    }
  }
}

// ── Admin: App Banners ────────────────────────────────────────────────────────

export const railsGetBanners = () =>
  request('/store/app_banners', { headers: h() })
    .then(r => (r.app_banners || []).map(normalizeBanner))

export const railsCreateBanner = (data) =>
  request('/store/app_banners', {
    method: 'POST', headers: h(),
    body: { app_banner: { title: data.title, image_url: data.image_url, link_url: data.link_url || null, is_active: data.is_active !== false, sort_order: Number(data.sort_order) || 0 } },
  }).then(r => normalizeBanner(r.app_banner))

export const railsUpdateBanner = (id, data) =>
  request(`/store/app_banners/${id}`, {
    method: 'PATCH', headers: h(),
    body: { app_banner: { title: data.title, image_url: data.image_url, link_url: data.link_url || null, is_active: data.is_active, sort_order: Number(data.sort_order) || 0 } },
  }).then(r => normalizeBanner(r.app_banner))

export const railsDeleteBanner = (id) =>
  request(`/store/app_banners/${id}`, { method: 'DELETE', headers: h() })

// ── Admin: Delivery Zones ─────────────────────────────────────────────────────

export const railsGetDeliveryZones = () =>
  request('/store/delivery_zones', { headers: h() })
    .then(r => (r.delivery_zones || []).map(normalizeZone))

const zoneToRails = (data) => ({
  name:                 data.name,
  slug:                 data.slug,
  city:                 data.city || null,
  delivery_fee_cents:   toCents(data.delivery_fee),
  minimum_order_cents:  toCents(data.minimum_order_amount ?? 0),
  estimated_minutes:    data.estimated_time ? parseInt(data.estimated_time) || null : null,
  estimated_distance_km: data.estimated_distance_km === '' || data.estimated_distance_km == null ? null : Number(data.estimated_distance_km),
  logistics_group:       data.logistics_group || null,
  latitude:              data.latitude === '' || data.latitude == null ? null : Number(data.latitude),
  longitude:             data.longitude === '' || data.longitude == null ? null : Number(data.longitude),
  internal_note:         data.internal_note || data.notes || null,
  match_priority:       Number(data.match_priority) || 100,
  is_active:            data.is_active !== false,
  aliases:              Array.isArray(data.aliases) ? data.aliases : (data.aliases ? [data.aliases] : []),
})

export const railsCreateDeliveryZone = (data) =>
  request('/store/delivery_zones', {
    method: 'POST', headers: h(),
    body: { delivery_zone: zoneToRails(data) },
  }).then(r => normalizeZone(r.delivery_zone))

export const railsUpdateDeliveryZone = (id, data) =>
  request(`/store/delivery_zones/${id}`, {
    method: 'PATCH', headers: h(),
    body: { delivery_zone: zoneToRails(data) },
  }).then(r => normalizeZone(r.delivery_zone))

export const railsDeleteDeliveryZone = (id) =>
  request(`/store/delivery_zones/${id}`, { method: 'DELETE', headers: h() })

// WhatsApp / Evolution Go (store admin)
export const railsGetWhatsappInstances = () =>
  request('/store/whatsapp/instances', { headers: h() })
    .then(r => r.instances || [])

export const railsGetWhatsappConfiguration = () =>
  request('/store/whatsapp/instances', { headers: h() })

export const railsEnsureWhatsappInstance = () =>
  request('/store/whatsapp/instances/ensure', { method: 'POST', headers: h() })
    .then(r => r.instance)

export const railsGetWhatsappInstanceStatus = (id) =>
  request(`/store/whatsapp/instances/${id}/status`, { headers: h() })
    .then(r => r.instance)

export const railsGetWhatsappQrCode = (id) =>
  request(`/store/whatsapp/instances/${id}/qrcode`, { headers: h() })

export const railsGetWhatsappTemplates = () =>
  request('/store/whatsapp/templates', { headers: h() })
    .then(r => r.templates || [])

export const railsUpdateWhatsappTemplate = (id, data) =>
  request(`/store/whatsapp/templates/${id}`, {
    method: 'PATCH',
    headers: h(),
    body: { template: data },
  }).then(r => r.template)

export const railsGetWhatsappLogs = () =>
  request('/store/whatsapp/logs', { headers: h() })
    .then(r => r.logs || [])

export const railsSendWhatsappTest = ({ orderId, status = 'accepted' }) =>
  request('/store/whatsapp/test_send', {
    method: 'POST',
    headers: h(),
    body: { order_id: orderId, status },
  })

// IA Assistente interna
export const railsGetAiSettings = () =>
  request('/store/ai/settings', { headers: h() })
    .then(r => r.settings)

export const railsChatWithAi = ({ message, page }) =>
  request('/store/ai/chat', {
    method: 'POST',
    headers: h(),
    body: { message, page },
  })

// IA da loja (RAG local e simulador; sem Evolution nesta fase)
export const railsGetStoreAiSettings = () =>
  request('/store/store_ai/settings', { headers: h() })

export const railsUpdateStoreAiSettings = (settings) =>
  request('/store/store_ai/settings', {
    method: 'PATCH',
    headers: h(),
    body: { settings },
  })

export const railsSimulateStoreAi = ({ message, phone }) =>
  request('/store/store_ai/simulate', {
    method: 'POST',
    headers: h(),
    body: { message, phone },
  })

export const railsGetStoreAiLogs = (period = 'today') =>
  request('/store/store_ai/logs', {
    headers: h(),
    params: { period },
  })
