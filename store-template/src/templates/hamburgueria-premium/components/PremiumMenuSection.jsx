import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { usePublicMenu } from '../../../hooks/usePublicMenu'
import { usePublicStoreInfo } from '../../../hooks/usePublicStoreInfo'
import { useCart } from '../../../hooks/useCart'
import PremiumProductCard from './PremiumProductCard'
import { IconSearch, IconClose, IconStar } from '../icons.jsx'

const PREM = {
  gold: '#f7a325',
  bg: '#0c0c0e',
  bg2: '#121214',
  card: '#1a1a1d',
  line: '#26262a',
  text: '#f4f3f1',
  muted: '#9a9aa0',
}

const isPublicCategory = (cat) => {
  const slug = String(cat?.slug || cat?.name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
  return !['adicionais', 'adicional', 'extras'].includes(slug)
}

const PremiumMenuSection = ({ store }) => {
  const { categories, products, loading, error } = usePublicMenu()
  const { store: currentStore } = usePublicStoreInfo()
  const { cart, addToCart, updateQuantity } = useCart()
  const effectiveStore = store || currentStore
  const accent = effectiveStore?.theme_primary_color || effectiveStore?.primary_color || PREM.gold

  const [activeCategory, setActiveCategory] = useState('all')
  const [query, setQuery] = useState('')

  const visibleCategories = useMemo(
    () => (categories || []).filter(isPublicCategory),
    [categories]
  )

  const getQuantity = (productId) =>
    cart.filter(item => (item.product_id || item.product_key) === productId)
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0)

  const handleAdd = (product) => {
    addToCart(product, 1)
    toast.success(`${product.name} adicionado!`, { duration: 1500 })
  }

  const handleInc = (product) => {
    const item = cart.find(i => (i.product_id || i.product_key) === product.id && !i.notes)
    if (item) {
      const idx = cart.indexOf(item)
      updateQuantity(idx, item.quantity + 1)
    } else {
      addToCart(product, 1)
    }
  }

  const handleDec = (product) => {
    const item = cart.find(i => (i.product_id || i.product_key) === product.id && !i.notes)
    if (!item) return
    const idx = cart.indexOf(item)
    updateQuantity(idx, item.quantity - 1)
  }

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase()
    return (products || []).filter(p => {
      const matchCat = activeCategory === 'all' ? p.is_featured : p.category?.slug === activeCategory
      const matchQ = !term || p.name?.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term)
      return matchCat && matchQ
    })
  }, [products, activeCategory, query])

  return (
    <div style={{ background: PREM.bg }}>
      {/* section title */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '34px 24px 8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: accent, opacity: .85 }}>
            <span style={{ height: 1, width: 46, background: `linear-gradient(90deg,transparent,${accent})` }} />
            <IconStar s={12} />
            <IconStar s={16} />
            <IconStar s={12} />
            <span style={{ height: 1, width: 46, background: `linear-gradient(90deg,${accent},transparent)` }} />
          </div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, letterSpacing: '-.01em', color: PREM.text }}>
            Cardápio
          </h2>
          <p style={{ color: PREM.muted, fontSize: 16, marginTop: -2 }}>Escolha seu favorito</p>
        </div>

        {/* search */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: PREM.card, border: `1px solid ${PREM.line}`,
            borderRadius: 12, padding: '11px 16px', width: 300, maxWidth: '100%',
          }}>
            <IconSearch s={18} style={{ color: PREM.muted, flexShrink: 0 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar no cardápio..."
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: PREM.text, fontSize: 14.5, fontFamily: 'inherit',
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{ color: PREM.muted, display: 'flex', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <IconClose s={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* category bar */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px 6px' }}>
        <div
          className="prem-scroll"
          style={{
            display: 'flex', gap: 10, overflowX: 'auto', padding: 10,
            background: PREM.bg2, border: `1px solid ${PREM.line}`, borderRadius: 16,
          }}
        >
          {[{ slug: 'all', name: 'Inicio' }, ...visibleCategories].map((cat) => {
            const active = activeCategory === cat.slug
            return (
              <button
                key={cat.slug || cat.id}
                onClick={() => setActiveCategory(cat.slug)}
                style={{
                  whiteSpace: 'nowrap', padding: '9px 18px', borderRadius: 10,
                  fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: active ? accent : 'transparent',
                  color: active ? '#08120c' : PREM.muted,
                  fontFamily: 'inherit', transition: 'all .18s',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = PREM.text
                    e.currentTarget.style.background = 'rgba(255,255,255,.04)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = PREM.muted
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                {cat.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* product grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '22px 24px 70px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: PREM.muted, padding: '60px 0' }}>
            Carregando cardápio...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: PREM.muted, padding: '60px 0' }}>
            {error}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: PREM.muted }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: PREM.text }}>Nenhum item encontrado</div>
            <div style={{ marginTop: 6 }}>Tente outra categoria ou busca.</div>
          </div>
        ) : (
          <div className="prem-grid">
            {filteredProducts.map((product) => (
              <PremiumProductCard
                key={product.id}
                product={product}
                accent={accent}
                quantity={getQuantity(product.id)}
                onAdd={handleAdd}
                onInc={handleInc}
                onDec={handleDec}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PremiumMenuSection
