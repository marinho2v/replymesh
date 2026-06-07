import { runSupabaseQuery, supabase } from './supabase'

const isMissingColumnError = (error) => ['42703', 'PGRST204'].includes(error?.code)

const CATEGORY_NAME_OVERRIDES = {
  combos: 'Combos hambúrguer tradicional',
  'hamburguer-artesanal': 'Artesanal',
}

const NON_STANDALONE_CATEGORY_SLUGS = new Set([
  'adicionais',
  'adicional',
  'extras',
])

const normalizeComboText = (value) => (
  typeof value === 'string'
    ? value.replace(/Flexa Guaran\?/g, 'Flexa Guarana')
    : value
)

const hasProductImage = (product) => (
  typeof product?.image_url === 'string' && product.image_url.trim().length > 0
)

const ARTISANAL_FEATURED_ORDER = [
  'african twin',
  'bmw 1250',
  'fazer 250',
  'harley-davidson costela',
  'hornet',
  'kawasaki',
  'kids pop 100',
  'lander',
  'sahara',
  'twister',
  'xj6',
]

const ARTISANAL_COMBO_ORDER = [
  '2 fazer + 2 guaracrack',
  'african twin + twister + 2 guaracrack',
  'fazer + xj6 + 2 guaracrack',
  'hornet + bmw 1250 + 2 guaracrack',
  'hornet + sahara + 2 guaracrack',
]

const normalizeProductName = (value) => (
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
)

export const isStandaloneMenuProduct = (product) => {
  const categorySlug = normalizeProductName(product?.category?.slug || product?.categories?.slug)
  const categoryName = normalizeProductName(product?.category?.name || product?.categories?.name)
  return !NON_STANDALONE_CATEGORY_SLUGS.has(categorySlug) && !NON_STANDALONE_CATEGORY_SLUGS.has(categoryName)
}

const isArtisanalCategory = (product) => {
  const slug = normalizeProductName(product.category?.slug)
  const name = normalizeProductName(product.category?.name)
  return slug === 'hamburguer-artesanal' || slug === 'artesanal' || name === 'artesanal'
}

const getKnownOrder = (orderList, name) => {
  const index = orderList.indexOf(normalizeProductName(name))
  return index === -1 ? 999 : index
}

const getArtisanalPriority = (product) => {
  const name = normalizeProductName(product.name)
  const slug = normalizeProductName(product.slug)
  const description = normalizeProductName(product.description)

  if (
    ARTISANAL_FEATURED_ORDER.includes(name) ||
    slug.endsWith('-hamburguer') ||
    description === 'hamburguer artesanal da casa.'
  ) {
    return 0
  }

  if (
    ARTISANAL_COMBO_ORDER.includes(name) ||
    product.is_combo === true ||
    product.is_promotional === true ||
    name.includes('+') ||
    /^2\s/.test(name)
  ) {
    return 1
  }

  return 2
}

const sortProductsForMenu = (products) => (
  [...products].sort((a, b) => {
    const sortOrder = Number(a.sort_order || 0) - Number(b.sort_order || 0)
    if (sortOrder !== 0) return sortOrder

    const aCategorySlug = a.category?.slug
    const bCategorySlug = b.category?.slug
    const bothGarlicBread = aCategorySlug === 'pao-de-alho' && bCategorySlug === 'pao-de-alho'
    const bothArtisanal = isArtisanalCategory(a) && isArtisanalCategory(b)

    if (bothGarlicBread) {
      const aIsCombo = String(a.name || '').toLowerCase().startsWith('combo')
      const bIsCombo = String(b.name || '').toLowerCase().startsWith('combo')
      const comboOrder = Number(bIsCombo) - Number(aIsCombo)
      if (comboOrder !== 0) return comboOrder
    }

    if (bothArtisanal) {
      const priorityOrder = getArtisanalPriority(a) - getArtisanalPriority(b)
      if (priorityOrder !== 0) return priorityOrder

      if (getArtisanalPriority(a) === 0 && getArtisanalPriority(b) === 0) {
        const artisanalOrder = getKnownOrder(ARTISANAL_FEATURED_ORDER, a.name) - getKnownOrder(ARTISANAL_FEATURED_ORDER, b.name)
        if (artisanalOrder !== 0) return artisanalOrder
      }

      if (getArtisanalPriority(a) === 1 && getArtisanalPriority(b) === 1) {
        const comboOrder = getKnownOrder(ARTISANAL_COMBO_ORDER, a.name) - getKnownOrder(ARTISANAL_COMBO_ORDER, b.name)
        if (comboOrder !== 0) return comboOrder
      }
    }

    const imageOrder = Number(hasProductImage(b)) - Number(hasProductImage(a))
    if (imageOrder !== 0) return imageOrder

    return String(a.name || '').localeCompare(String(b.name || ''))
  })
)

const applyProductOverrides = (product) => ({
  ...product,
  description: normalizeComboText(product.description),
  combo_description: normalizeComboText(product.combo_description),
  category: product.category
    ? {
        ...product.category,
        name: CATEGORY_NAME_OVERRIDES[product.category.slug] || product.category.name,
      }
    : product.category,
})

const stripUnsupportedFields = (productData) => {
  const { cost_price, cost_method, updated_at, is_customizable, ...legacyData } = productData
  return legacyData
}

const normalizeProductPayload = (productData) => {
  const normalized = {
    ...productData,
    name: String(productData?.name || '').trim(),
    description: productData?.description?.trim?.() || productData?.description || null,
    image_url: productData?.image_url?.trim?.() || productData?.image_url || null,
    category_id: productData?.category_id || null,
    promotional_price: productData?.promotional_price === '' || productData?.promotional_price === undefined
      ? null
      : productData.promotional_price,
    price: Number(productData?.price),
    sort_order: Number.isFinite(Number(productData?.sort_order)) ? Number(productData.sort_order) : 0,
    cost_price: Number.isFinite(Number(productData?.cost_price)) ? Number(productData.cost_price) : 0,
    track_inventory: Boolean(productData?.track_inventory),
    stock_item_id: productData?.track_inventory && productData?.stock_item_id
      ? productData.stock_item_id
      : null,
  }

  if (!normalized.name) {
    throw new Error('Nome do produto e obrigatorio')
  }

  if (!Number.isFinite(normalized.price)) {
    throw new Error('Preco do produto invalido')
  }

  if (normalized.promotional_price !== null && !Number.isFinite(Number(normalized.promotional_price))) {
    throw new Error('Preco promocional invalido')
  }

  if (!Number.isFinite(normalized.cost_price)) {
    normalized.cost_price = 0
  }

  return normalized
}

export const getProducts = async (filters = {}) => {
  try {
    const activeOnly = filters.activeOnly !== false

    let query = supabase
      .from('products')
      .select('*, category:categories(id, name, slug, is_active)')
      .order('sort_order', { ascending: true })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id)
    }

    if (filters.is_featured !== undefined) {
      query = query.eq('is_featured', filters.is_featured)
    }

    if (filters.is_promotional !== undefined) {
      query = query.eq('is_promotional', filters.is_promotional)
    }

    if (filters.is_combo !== undefined) {
      query = query.eq('is_combo', filters.is_combo)
    }

    const { data, error } = await runSupabaseQuery(query)

    if (error) throw error

    const nextData = activeOnly
      ? (data || []).filter(product => product.category?.is_active !== false && isStandaloneMenuProduct(product))
      : data
    return sortProductsForMenu(
      (nextData || []).map(applyProductOverrides)
    )
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}

export const getProductById = async (productId) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (*)
      `)
      .eq('id', productId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching product:', error)
    throw error
  }
}

export const createProduct = async (productData) => {
  try {
    const payload = normalizeProductPayload(productData)
    let { data, error } = await supabase
      .from('products')
      .insert(payload)
      .select()
      .single()

    if (error && isMissingColumnError(error)) {
      ;({ data, error } = await supabase
        .from('products')
        .insert(stripUnsupportedFields(payload))
        .select()
        .single())
    }

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating product:', error)
    throw error
  }
}

export const updateProduct = async (productId, productData) => {
  try {
    const payload = normalizeProductPayload(productData)
    let { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', productId)
      .select()
      .single()

    if (error && isMissingColumnError(error)) {
      ;({ data, error } = await supabase
        .from('products')
        .update(stripUnsupportedFields(payload))
        .eq('id', productId)
        .select()
        .single())
    }

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating product:', error)
    throw error
  }
}

export const deleteProduct = async (productId) => {
  try {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', productId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting product:', error)
    throw error
  }
}

export const hardDeleteProduct = async (productId) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error permanently deleting product:', error)
    throw error
  }
}

export const updateProductsStatus = async (productIds = [], isActive) => {
  try {
    if (!Array.isArray(productIds) || productIds.length === 0) return []

    const { data, error } = await supabase
      .from('products')
      .update({ is_active: isActive })
      .in('id', productIds)
      .select()

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error updating products status:', error)
    throw error
  }
}

export const updateProductsSortOrder = async (orderedProducts = []) => {
  try {
    const payload = orderedProducts
      .filter(product => product?.id)
      .map((product, index) => ({
        id: product.id,
        sort_order: Number.isFinite(Number(product.sort_order)) ? Number(product.sort_order) : index * 10,
      }))

    if (payload.length === 0) return []

    const updates = await Promise.all(payload.map(product => (
      supabase
        .from('products')
        .update({ sort_order: product.sort_order })
        .eq('id', product.id)
        .select('id, sort_order')
        .single()
    )))

    const errorResult = updates.find(result => result.error)
    if (errorResult?.error) throw errorResult.error

    return updates.map(result => result.data).filter(Boolean)
  } catch (error) {
    console.error('Error updating product sort order:', error)
    throw error
  }
}

export const hardDeleteProducts = async (productIds = []) => {
  try {
    if (!Array.isArray(productIds) || productIds.length === 0) return true

    const { error } = await supabase
      .from('products')
      .delete()
      .in('id', productIds)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error permanently deleting products:', error)
    throw error
  }
}
