export const PIZZA_PRICE_GROUP_NAME = '__pizza_price__'

const SIZE_MARKER = 'pizza:size'
const FLAVOR_MARKER = 'pizza:flavor'

const BRL = (value) => {
  const number = Number(value || 0)
  return Number.isFinite(number) ? number : 0
}

const slugify = (value) => (
  String(value || 'item')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'item'
)

const parseMarker = (name, type) => {
  const marker = String(name || '').match(/\s\[pizza:(size|flavor):([^\]]+)\]$/)
  if (!marker || `pizza:${marker[1]}` !== type) return {}

  return marker[2].split(';').reduce((acc, pair) => {
    const [key, rawValue = ''] = pair.split('=')
    if (key) acc[key] = decodeURIComponent(rawValue)
    return acc
  }, {})
}

export const cleanPizzaOptionName = (name) => (
  String(name || '').replace(/\s\[pizza:(size|flavor):[^\]]+\]$/, '')
)

export const isPizzaTechnicalGroup = (group) => group?.group_name === PIZZA_PRICE_GROUP_NAME || group?.name === PIZZA_PRICE_GROUP_NAME

export const isPizzaProduct = (product = {}) => {
  const groupNames = (product.option_groups || []).map(group => group.name || group.group_name)
  return groupNames.includes(PIZZA_PRICE_GROUP_NAME) ||
    (groupNames.includes('Tamanho') && groupNames.includes('Sabores'))
}

export const buildPizzaSizeName = (size) => {
  const id = size.id || slugify(size.name)
  const parts = [
    `id=${encodeURIComponent(id)}`,
    `max=${Number(size.max_flavors || 1)}`,
  ]
  if (size.slices !== '' && size.slices != null) parts.push(`slices=${Number(size.slices || 0)}`)
  return `${size.name || 'Tamanho'} [${SIZE_MARKER}:${parts.join(';')}]`
}

export const buildPizzaFlavorName = (flavor) => {
  const id = flavor.id || slugify(flavor.name)
  const parts = [`id=${encodeURIComponent(id)}`]
  if (flavor.description) parts.push(`desc=${encodeURIComponent(flavor.description)}`)
  return `${flavor.name || 'Sabor'} [${FLAVOR_MARKER}:${parts.join(';')}]`
}

export const buildPizzaPriceOptionName = (pricingRule, sizeId, flavorIds = []) => {
  const rule = pricingRule || 'highest_flavor'
  const normalizedFlavorIds = [...flavorIds].filter(Boolean).sort()
  return `${rule}::${sizeId}::${normalizedFlavorIds.join('+')}`
}

export const defaultAdvancedPizzaConfig = () => ({
  pricing_rule: 'highest_flavor',
  sizes: [
    { id: 'pequena', name: 'Pequena', base_price: 35, max_flavors: 1, slices: 4, active: true },
    { id: 'media', name: 'Media', base_price: 45, max_flavors: 2, slices: 6, active: true },
    { id: 'grande', name: 'Grande', base_price: 55, max_flavors: 2, slices: 8, active: true },
    { id: 'familia', name: 'Familia', base_price: 70, max_flavors: 3, slices: 12, active: true },
  ],
  flavors: [
    { id: 'calabresa', name: 'Calabresa', description: '', active: true, prices: { pequena: 35, media: 45, grande: 55, familia: 70 } },
    { id: 'portuguesa', name: 'Portuguesa', description: '', active: true, prices: { pequena: 38, media: 48, grande: 58, familia: 75 } },
    { id: 'frango-catupiry', name: 'Frango com Catupiry', description: '', active: true, prices: { pequena: 38, media: 48, grande: 58, familia: 75 } },
    { id: 'mussarela', name: 'Mussarela', description: '', active: true, prices: { pequena: 35, media: 45, grande: 55, familia: 70 } },
  ],
  edges: [
    { id: 'sem-borda', name: 'Sem borda', price: 0, active: true },
    { id: 'catupiry', name: 'Catupiry', price: 8, active: true },
    { id: 'cheddar', name: 'Cheddar', price: 8, active: true },
    { id: 'chocolate', name: 'Chocolate', price: 10, active: true },
  ],
  doughs: [
    { id: 'tradicional', name: 'Tradicional', price: 0, active: true },
    { id: 'fina', name: 'Fina', price: 0, active: true },
    { id: 'grossa', name: 'Grossa', price: 5, active: true },
  ],
})

const findGroup = (groups, name) => (groups || []).find(group => group.name === name)

const itemPrice = (item) => BRL(item.additional_price ?? ((item.additional_price_cents || 0) / 100))

const combinationSet = (items, maxLength) => {
  const combos = []

  const walk = (start, current) => {
    if (current.length > 0) combos.push(current)
    if (current.length >= maxLength) return

    for (let index = start; index < items.length; index += 1) {
      walk(index + 1, [...current, items[index]])
    }
  }

  walk(0, [])
  return combos
}

export const parsePizzaConfigFromOptionGroups = (groups = [], productPrice = 0) => {
  const baseProductPrice = BRL(productPrice)
  const sizeGroup = findGroup(groups, 'Tamanho')
  const flavorGroup = findGroup(groups, 'Sabores')
  const edgeGroup = findGroup(groups, 'Borda')
  const doughGroup = findGroup(groups, 'Massa')
  const priceGroup = findGroup(groups, PIZZA_PRICE_GROUP_NAME)

  if (!sizeGroup || !flavorGroup) return defaultAdvancedPizzaConfig()
  const storedPricingRule = (priceGroup?.items || [])
    .map(item => String(item.name || '').match(/^__pricing_rule::(.+)$/)?.[1])
    .find(Boolean)

  const sizes = (sizeGroup.items || []).map((item, index) => {
    const marker = parseMarker(item.name, SIZE_MARKER)
    const name = cleanPizzaOptionName(item.name)
    const maxFromName = String(item.name || '').match(/ate\s+(\d+)\s+sabor/i)?.[1]
    return {
      id: marker.id || slugify(name),
      name,
      base_price: baseProductPrice + itemPrice(item),
      max_flavors: Number(marker.max || maxFromName || sizeGroup.max_select || 1),
      slices: marker.slices ? Number(marker.slices) : '',
      active: item.is_active !== false,
      sort_order: item.sort_order ?? index,
    }
  })

  const priceByKey = new Map((priceGroup?.items || []).map(item => [item.name, itemPrice(item)]))

  const flavors = (flavorGroup.items || []).map((item, index) => {
    const marker = parseMarker(item.name, FLAVOR_MARKER)
    const name = cleanPizzaOptionName(item.name)
    const flavorId = marker.id || slugify(name)
    const prices = {}
    sizes.forEach((size) => {
      const technicalDelta = priceByKey.get(buildPizzaPriceOptionName('highest_flavor', size.id, [flavorId]))
        ?? priceByKey.get(`${size.id}::${flavorId}`)
      prices[size.id] = technicalDelta == null ? size.base_price : size.base_price + technicalDelta
    })

    return {
      id: flavorId,
      name,
      description: marker.desc || '',
      prices,
      active: item.is_active !== false,
      sort_order: item.sort_order ?? index,
    }
  })

  const edges = (edgeGroup?.items || []).map((item, index) => ({
    id: slugify(cleanPizzaOptionName(item.name)),
    name: cleanPizzaOptionName(item.name),
    price: itemPrice(item),
    active: item.is_active !== false,
    sort_order: item.sort_order ?? index,
  })) || []

  const doughs = (doughGroup?.items || []).map((item, index) => ({
    id: slugify(cleanPizzaOptionName(item.name)),
    name: cleanPizzaOptionName(item.name),
    price: itemPrice(item),
    active: item.is_active !== false,
    sort_order: item.sort_order ?? index,
  })) || []

  return {
    pricing_rule: storedPricingRule || 'highest_flavor',
    sizes,
    flavors,
    edges: edges.length ? edges : defaultAdvancedPizzaConfig().edges,
    doughs: doughs.length ? doughs : defaultAdvancedPizzaConfig().doughs,
  }
}

const preserveGroupId = (existingGroups, name) => findGroup(existingGroups, name)?.id

const preserveItemId = (existingGroup, cleanName) => (
  (existingGroup?.items || []).find(item => cleanPizzaOptionName(item.name) === cleanName)?.id
)

const calculateBasePizzaPrice = ({ size, flavors, pricingRule }) => (
  calculatePizzaPrice({ size, flavors, pricingRule, edge: null, dough: null })
)

export const buildPizzaOptionGroups = (config, productBasePrice, existingGroups = []) => {
  const basePrice = BRL(productBasePrice)
  const sizes = (config.sizes || []).map((size, index) => ({
    id: size.id || slugify(size.name),
    name: size.name || `Tamanho ${index + 1}`,
    base_price: BRL(size.base_price),
    max_flavors: Number(size.max_flavors || 1),
    slices: size.slices,
    active: size.active !== false,
    sort_order: index,
  }))
  const flavors = (config.flavors || []).map((flavor, index) => ({
    id: flavor.id || slugify(flavor.name),
    name: flavor.name || `Sabor ${index + 1}`,
    description: flavor.description || '',
    prices: flavor.prices || {},
    active: flavor.active !== false,
    sort_order: index,
  }))

  const sizeExisting = findGroup(existingGroups, 'Tamanho')
  const flavorExisting = findGroup(existingGroups, 'Sabores')
  const edgeExisting = findGroup(existingGroups, 'Borda')
  const doughExisting = findGroup(existingGroups, 'Massa')
  const priceExisting = findGroup(existingGroups, PIZZA_PRICE_GROUP_NAME)
  const maxFlavorLimit = Math.max(...sizes.map(size => Number(size.max_flavors || 1)), 1)
  const pricingRule = config.pricing_rule || 'highest_flavor'
  const rules = ['highest_flavor', 'average_flavors', 'sum_flavors', 'base_size']
  const activeFlavors = flavors.filter(flavor => flavor.active)
  const priceItemsByName = new Map((priceExisting?.items || []).map(item => [item.name, item]))
  const pricingItems = [
    {
      id: priceItemsByName.get(`__pricing_rule::${pricingRule}`)?.id,
      name: `__pricing_rule::${pricingRule}`,
      additional_price: 0,
      is_active: true,
      sort_order: 0,
    },
  ]

  sizes.forEach((size, sizeIndex) => {
    const combos = combinationSet(activeFlavors, Number(size.max_flavors || 1))
    rules.forEach((rule, ruleIndex) => {
      combos.forEach((flavorCombo, comboIndex) => {
        const itemName = buildPizzaPriceOptionName(rule, size.id, flavorCombo.map(flavor => flavor.id))
        const computedPrice = calculateBasePizzaPrice({ size, flavors: flavorCombo, pricingRule: rule })
        pricingItems.push({
          id: priceItemsByName.get(itemName)?.id,
          name: itemName,
          additional_price: computedPrice - size.base_price,
          is_active: size.active && flavorCombo.every(flavor => flavor.active),
          sort_order: 1 + (sizeIndex * 10000) + (ruleIndex * 1000) + comboIndex,
        })
      })
    })
  })

  const groups = [
    {
      id: preserveGroupId(existingGroups, 'Tamanho'),
      name: 'Tamanho',
      type: 'single',
      required: true,
      min_select: 1,
      max_select: 1,
      sort_order: 0,
      items: sizes.map(size => ({
        id: preserveItemId(sizeExisting, size.name),
        name: buildPizzaSizeName(size),
        additional_price: size.base_price - basePrice,
        is_active: size.active,
        sort_order: size.sort_order,
      })),
    },
    {
      id: preserveGroupId(existingGroups, 'Sabores'),
      name: 'Sabores',
      type: 'multiple',
      required: true,
      min_select: 1,
      max_select: maxFlavorLimit,
      sort_order: 1,
      items: flavors.map(flavor => ({
        id: preserveItemId(flavorExisting, flavor.name),
        name: buildPizzaFlavorName(flavor),
        additional_price: 0,
        is_active: flavor.active,
        sort_order: flavor.sort_order,
      })),
    },
    {
      id: preserveGroupId(existingGroups, 'Borda'),
      name: 'Borda',
      type: 'single',
      required: false,
      min_select: 0,
      max_select: 1,
      sort_order: 2,
      items: (config.edges || []).map((edge, index) => ({
        id: preserveItemId(edgeExisting, edge.name),
        name: edge.name || `Borda ${index + 1}`,
        additional_price: BRL(edge.price),
        is_active: edge.active !== false,
        sort_order: index,
      })),
    },
    {
      id: preserveGroupId(existingGroups, 'Massa'),
      name: 'Massa',
      type: 'single',
      required: false,
      min_select: 0,
      max_select: 1,
      sort_order: 3,
      items: (config.doughs || []).map((dough, index) => ({
        id: preserveItemId(doughExisting, dough.name),
        name: dough.name || `Massa ${index + 1}`,
        additional_price: BRL(dough.price),
        is_active: dough.active !== false,
        sort_order: index,
      })),
    },
    {
      id: preserveGroupId(existingGroups, PIZZA_PRICE_GROUP_NAME),
      name: PIZZA_PRICE_GROUP_NAME,
      type: 'single',
      required: false,
      min_select: 0,
      max_select: 1,
      sort_order: 99,
      items: pricingItems,
    },
  ]

  return groups
}

export const calculatePizzaPrice = ({ size, flavors, edge, dough, pricingRule = 'highest_flavor' }) => {
  const activeFlavors = flavors || []
  let pizzaPrice = BRL(size?.base_price)
  const flavorPrices = activeFlavors.map(flavor => BRL(flavor.prices?.[size?.id] ?? pizzaPrice))

  if (flavorPrices.length) {
    if (pricingRule === 'average_flavors') {
      pizzaPrice = flavorPrices.reduce((sum, price) => sum + price, 0) / flavorPrices.length
    } else if (pricingRule === 'sum_flavors') {
      pizzaPrice = flavorPrices.reduce((sum, price) => sum + price, 0)
    } else if (pricingRule === 'base_size') {
      pizzaPrice = BRL(size?.base_price)
    } else {
      pizzaPrice = Math.max(...flavorPrices)
    }
  }

  return pizzaPrice + BRL(edge?.price) + BRL(dough?.price)
}
