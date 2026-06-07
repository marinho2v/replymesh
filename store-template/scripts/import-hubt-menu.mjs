import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const HUBT_PROPS_URL = 'https://storage.googleapis.com/download/storage/v1/b/hassets/o/s110539%2Fprops-fecf43c3d54880d55557db39db4a8a6d.json?generation=1772563968009385&alt=media'

const OUTPUT_DIR = path.resolve('data', 'hubt-menu')
const SQL_OUTPUT = path.resolve('supabase', 'migrations', '20260422_import_hubt_menu.sql')

const slugify = (value) => (
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
)

const parsePrice = (value) => {
  const normalized = String(value || '0')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.]/g, '')

  return Number.parseFloat(normalized || '0')
}

const normalizeImageUrl = (src) => {
  if (!src) return null
  if (/^https?:\/\//i.test(src)) return src

  const markerIndex = src.indexOf('://')
  if (markerIndex >= 0) {
    const withoutHubtPrefix = src.slice(markerIndex + 3)
    return withoutHubtPrefix ? `https://${withoutHubtPrefix}` : null
  }

  return src
}

const sqlString = (value) => {
  if (value === null || value === undefined || value === '') return 'null'
  return `'${String(value).replace(/'/g, "''")}'`
}

const sqlBoolean = (value) => value ? 'true' : 'false'
const sqlNumber = (value) => Number.isFinite(Number(value)) ? Number(value).toFixed(2) : '0.00'

const buildProductName = (item, price, priceCount) => {
  const label = String(price?.label || '').trim()
  if (priceCount <= 1 || !label || label.toLowerCase() === 'unico' || label.toLowerCase() === 'único') {
    return item.title
  }

  return `${item.title} - ${label}`
}

const buildProductDescription = (item, price, priceCount) => {
  const chunks = []
  if (item.desc) chunks.push(item.desc)
  if (item.extraDesc) chunks.push(item.extraDesc)

  const label = String(price?.label || '').trim()
  if (priceCount > 1 && label && !['unico', 'único'].includes(label.toLowerCase())) {
    chunks.push(`Opcao importada do cardapio antigo: ${label}.`)
  }

  if ((item.complements || []).length > 0) {
    chunks.push(`Adicionais no cardapio antigo: ${(item.complements || []).map(c => c.title || c.name).filter(Boolean).join(', ')}.`)
  }

  return chunks.filter(Boolean).join('\n')
}

const extractMenu = async () => {
  const response = await fetch(HUBT_PROPS_URL)
  if (!response.ok) {
    throw new Error(`Falha ao baixar cardapio Hubt: ${response.status} ${response.statusText}`)
  }

  const props = await response.json()
  const menuModules = (props.modules || [])
    .filter(module => module._moduleType === 3 && module.properties?.title && (module.items || []).length > 0)

  const categories = menuModules.map((module, index) => ({
    source_module_id: module._module,
    name: module.properties.title,
    slug: slugify(module.properties.title),
    sort_order: index + 1,
    is_active: true,
  }))

  const usedProductSlugs = new Set()
  const products = []

  for (const [categoryIndex, module] of menuModules.entries()) {
    const category = categories[categoryIndex]
    let productOrder = 1

    for (const item of module.items || []) {
      const prices = (item.prices || []).length ? item.prices : [{ label: 'Unico', value: '0,00' }]
      const imageUrl = normalizeImageUrl(item.images?.[0]?.src)

      for (const price of prices) {
        const name = buildProductName(item, price, prices.length)
        const baseSlug = slugify(name)
        let slug = baseSlug
        let counter = 2

        while (usedProductSlugs.has(slug)) {
          slug = `${baseSlug}-${counter}`
          counter += 1
        }

        usedProductSlugs.add(slug)

        products.push({
          source_module_id: module._module,
          source_item_id: item._id,
          source_price_id: price.id || null,
          category_slug: category.slug,
          category_name: category.name,
          name,
          slug,
          description: buildProductDescription(item, price, prices.length),
          price: parsePrice(price.value),
          promotional_price: null,
          image_url: imageUrl,
          is_featured: productOrder <= 2,
          is_promotional: false,
          is_combo: false,
          combo_description: null,
          is_active: true,
          track_inventory: false,
          stock_item_id: null,
          sort_order: productOrder,
        })

        productOrder += 1
      }
    }
  }

  return { source_url: 'https://www.hubt.com.br/lanche-do-2r', props_url: HUBT_PROPS_URL, categories, products }
}

const buildSql = ({ categories, products }) => {
  const lines = [
    '-- Importacao do cardapio antigo Hubt: https://www.hubt.com.br/lanche-do-2r',
    '-- Gerado por scripts/import-hubt-menu.mjs',
    '-- Seguro para rodar mais de uma vez: usa slug como chave de conflito.',
    '',
    'alter table public.categories',
    '  add column if not exists deleted_at timestamptz;',
    '',
    'alter table public.products',
    '  add column if not exists slug text,',
    '  add column if not exists track_inventory boolean not null default false,',
    '  add column if not exists stock_item_id uuid;',
    '',
    'create unique index if not exists categories_slug_key',
    '  on public.categories(slug);',
    '',
    'create unique index if not exists products_slug_key',
    '  on public.products(slug);',
    '',
    'begin;',
    '',
    '-- Categorias',
  ]

  for (const category of categories) {
    lines.push([
      'insert into public.categories (name, slug, sort_order, is_active, deleted_at)',
      `values (${sqlString(category.name)}, ${sqlString(category.slug)}, ${category.sort_order}, ${sqlBoolean(category.is_active)}, null)`,
      'on conflict (slug) do update set',
      '  name = excluded.name,',
      '  sort_order = excluded.sort_order,',
      '  is_active = true,',
      '  deleted_at = null;',
      '',
    ].join('\n'))
  }

  lines.push('-- Produtos')

  for (const product of products) {
    lines.push([
      'insert into public.products (',
      '  category_id, name, slug, description, price, promotional_price, image_url,',
      '  is_featured, is_promotional, is_combo, combo_description, is_active,',
      '  track_inventory, stock_item_id, sort_order',
      ')',
      'select',
      `  c.id, ${sqlString(product.name)}, ${sqlString(product.slug)}, ${sqlString(product.description)}, ${sqlNumber(product.price)}, null, ${sqlString(product.image_url)},`,
      `  ${sqlBoolean(product.is_featured)}, false, false, null, true,`,
      '  false, null, ' + product.sort_order,
      'from public.categories c',
      `where c.slug = ${sqlString(product.category_slug)}`,
      'on conflict (slug) do update set',
      '  category_id = excluded.category_id,',
      '  name = excluded.name,',
      '  description = excluded.description,',
      '  price = excluded.price,',
      '  promotional_price = excluded.promotional_price,',
      '  image_url = excluded.image_url,',
      '  is_featured = excluded.is_featured,',
      '  is_promotional = excluded.is_promotional,',
      '  is_combo = excluded.is_combo,',
      '  combo_description = excluded.combo_description,',
      '  is_active = true,',
      '  sort_order = excluded.sort_order;',
      '',
    ].join('\n'))
  }

  lines.push('commit;', '')
  return lines.join('\n')
}

const main = async () => {
  const menu = await extractMenu()
  await mkdir(OUTPUT_DIR, { recursive: true })

  await writeFile(path.join(OUTPUT_DIR, 'hubt-menu.json'), JSON.stringify(menu, null, 2), 'utf8')
  await writeFile(path.join(OUTPUT_DIR, 'hubt-menu-summary.json'), JSON.stringify({
    source_url: menu.source_url,
    categories_count: menu.categories.length,
    products_count: menu.products.length,
    categories: menu.categories.map(category => ({
      name: category.name,
      slug: category.slug,
      products_count: menu.products.filter(product => product.category_slug === category.slug).length,
    })),
  }, null, 2), 'utf8')

  await writeFile(SQL_OUTPUT, buildSql(menu), 'utf8')

  console.log(`Categorias extraidas: ${menu.categories.length}`)
  console.log(`Produtos gerados: ${menu.products.length}`)
  for (const category of menu.categories) {
    const count = menu.products.filter(product => product.category_slug === category.slug).length
    console.log(`- ${category.name}: ${count}`)
  }
  console.log(`JSON: ${path.join(OUTPUT_DIR, 'hubt-menu.json')}`)
  console.log(`SQL: ${SQL_OUTPUT}`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
