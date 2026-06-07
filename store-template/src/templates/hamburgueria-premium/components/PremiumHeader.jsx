import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { IconCart, IconMenu, IconClose } from '../icons.jsx'
import '../styles.css'

const PREM = {
  gold: '#f7a325',
  goldDeep: '#e8920f',
  bg: '#0c0c0e',
  line: '#26262a',
  text: '#f4f3f1',
  muted: '#9a9aa0',
}

const PremiumLogo = ({ store, accent = PREM.gold }) => {
  const storeName = store?.store_name || store?.name || 'Hamburgueria'
  const logoUrl = store?.logo_url

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
      <div
        style={{
          width: 44,
          height: 44,
          flexShrink: 0,
          clipPath: 'polygon(30% 2%,70% 2%,98% 30%,98% 70%,70% 98%,30% 98%,2% 70%,2% 30%)',
          background: 'linear-gradient(145deg,#1c1c1f,#0f0f11)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `inset 0 0 0 1.5px ${accent}`,
          overflow: 'hidden',
        }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt={storeName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div
            style={{
              width: 28,
              height: 28,
              clipPath: 'polygon(30% 2%,70% 2%,98% 30%,98% 70%,70% 98%,30% 98%,2% 70%,2% 30%)',
              background: `linear-gradient(145deg,${accent},${PREM.goldDeep})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 10,
              color: '#2a1a05',
            }}
          >
            {storeName.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <span
        style={{
          fontWeight: 700,
          fontSize: 20,
          letterSpacing: '-.01em',
          color: PREM.text,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {storeName}
      </span>
    </div>
  )
}

const PremiumHeader = ({ store, cartCount = 0, basePath = '' }) => {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const accent = store?.theme_primary_color || store?.primary_color || PREM.gold

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { label: 'Início', to: basePath || '/' },
    { label: 'Cardápio', to: `${basePath}/menu` },
    { label: 'Minha conta', to: `${basePath}/minha-conta` },
    { label: 'Roleta', to: `${basePath}/roleta` },
  ]

  const isActive = (to) => {
    if (to === (basePath || '/')) return location.pathname === to
    return location.pathname.startsWith(to)
  }

  const navLink = (link, mobile = false) => (
    <Link
      key={link.to}
      to={link.to}
      onClick={() => setOpen(false)}
      style={{
        position: 'relative',
        padding: mobile ? '12px 4px' : '6px 0',
        color: isActive(link.to) ? accent : PREM.text,
        fontSize: 15,
        fontWeight: 500,
        textDecoration: 'none',
        borderBottom: mobile ? '1px solid #121214' : 'none',
      }}
    >
      {link.label}
      {!mobile && isActive(link.to) && (
        <span
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: -2,
            height: 2,
            background: accent,
            borderRadius: 9,
          }}
        />
      )}
    </Link>
  )

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 60,
        background: scrolled ? 'rgba(12,12,14,.94)' : 'rgba(12,12,14,.72)',
        backdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${scrolled ? PREM.line : 'transparent'}`,
        transition: 'all .25s',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        <Link to={basePath || '/'} style={{ textDecoration: 'none', minWidth: 0 }}>
          <PremiumLogo store={store} accent={accent} />
        </Link>

        <nav className="prem-desk-nav" style={{ display: 'flex', gap: 34, alignItems: 'center' }}>
          {links.map((link) => navLink(link))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate(`${basePath}/cart`)}
            aria-label="Carrinho"
            style={{
              position: 'relative',
              display: 'flex',
              color: PREM.text,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <IconCart s={26} />
            {cartCount > 0 && (
              <span
                key={cartCount}
                style={{
                  position: 'absolute',
                  top: -8,
                  right: -10,
                  minWidth: 19,
                  height: 19,
                  padding: '0 5px',
                  background: accent,
                  color: '#2a1a05',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'prem-pop .25s',
                }}
              >
                {cartCount}
              </span>
            )}
          </button>
          <button
            className="prem-burger"
            onClick={() => setOpen((value) => !value)}
            aria-label="Menu"
            style={{ display: 'none', color: PREM.text, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {open ? <IconClose s={26} /> : <IconMenu s={26} />}
          </button>
        </div>
      </div>

      {open && (
        <div
          className="prem-mob-nav"
          style={{
            borderTop: `1px solid ${PREM.line}`,
            padding: '8px 24px 16px',
            display: 'flex',
            flexDirection: 'column',
            background: PREM.bg,
          }}
        >
          {links.map((link) => navLink(link, true))}
        </div>
      )}
    </header>
  )
}

export default PremiumHeader
