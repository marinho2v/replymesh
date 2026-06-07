import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePublicStoreInfo } from '../../../hooks/usePublicStoreInfo'
import { useCart } from '../../../hooks/useCart'
import { useCompanyBasePath } from '../../../contexts/CompanySlugContext'
import { IconCart } from '../icons.jsx'
import PremiumHero from './PremiumHero'
import PremiumMenuSection from './PremiumMenuSection'
import PremiumFooter from './PremiumFooter'
import '../styles.css'

const PREM_VARS = {
  fontFamily: "'Poppins', system-ui, sans-serif",
  background: '#0c0c0e',
  color: '#f4f3f1',
}

const CartFab = ({ count, onClick, accent = '#f7a325' }) => {
  if (!count) return null
  return (
    <div style={{ position: 'fixed', bottom: 22, left: 22, zIndex: 80 }}>
      <button
        onClick={onClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: accent, color: '#08120c',
          fontWeight: 700, fontSize: 15, padding: '13px 22px',
          borderRadius: 999, border: 'none', cursor: 'pointer',
          fontFamily: "'Poppins', system-ui, sans-serif",
          boxShadow: `0 8px 24px ${accent}55`,
          transition: 'transform .2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        <IconCart s={20} />
        <span>{count} {count === 1 ? 'item' : 'itens'}</span>
      </button>
    </div>
  )
}

const PremiumHome = () => {
  const { store, businessHours } = usePublicStoreInfo()
  const { cart } = useCart()
  const basePath = useCompanyBasePath()
  const navigate = useNavigate()
  const menuRef = useRef(null)

  const cartCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  const accent = store?.theme_primary_color || store?.primary_color || '#f7a325'
  const scrollToMenu = () => {
    menuRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div style={PREM_VARS}>
      <PremiumHero
        store={store}
        businessHours={businessHours}
        onOrder={scrollToMenu}
      />

      <div ref={menuRef} id="cardapio" />
      <PremiumMenuSection store={store} />

      <PremiumFooter store={store} />

      <CartFab count={cartCount} onClick={() => navigate(`${basePath}/cart`)} accent={accent} />
    </div>
  )
}

export default PremiumHome
