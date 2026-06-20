import { useState } from 'react'
import { IconCart, IconPlus, IconMinus } from '../icons.jsx'
import { formatCurrency } from '../../../utils/currency'

const PREM = {
  gold: '#f7a325',
  bg2: '#121214',
  card: '#1a1a1d',
  line: '#26262a',
  text: '#f4f3f1',
  muted: '#9a9aa0',
}

const PremiumProductCard = ({ product, quantity = 0, onAdd, onInc, onDec, accent = PREM.gold }) => {
  const [hover, setHover] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const price = product.promotional_price || product.price || 0
  const originalPrice = product.promotional_price ? product.price : null
  const hasDescription = Boolean(product.description?.trim())

  const handleAdd = () => onAdd(product)
  const handleInc = () => onInc(product)
  const handleDec = () => onDec(product)

  const detailsButtonStyle = {
    alignSelf: 'flex-start',
    marginTop: 7,
    border: 'none',
    background: 'none',
    color: accent,
    cursor: 'pointer',
    fontSize: 12.5,
    fontWeight: 700,
    padding: 0,
    fontFamily: 'inherit',
  }

  return (
    <>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: PREM.card,
          border: `1px solid ${hover ? '#34343a' : PREM.line}`,
          borderRadius: 16,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          transform: hover ? 'translateY(-4px)' : 'none',
          boxShadow: hover ? '0 16px 36px rgba(0,0,0,.45)' : '0 2px 10px rgba(0,0,0,.25)',
          transition: 'all .22s',
        }}
      >
      {/* image */}
      <div style={{ position: 'relative', aspectRatio: '16/11', overflow: 'hidden' }}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            decoding="async"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              transform: hover ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform .4s',
            }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'repeating-linear-gradient(135deg, rgba(255,255,255,.025) 0 10px, rgba(255,255,255,0) 10px 20px), radial-gradient(120% 120% at 70% 20%, #3a2a18 0%, #241a12 45%, #15110d 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,.28)', fontSize: 11, textTransform: 'uppercase',
            letterSpacing: '.08em', textAlign: 'center', padding: 14,
          }}>
            {product.name}
          </div>
        )}
        {product.is_featured && (
          <span style={{
            position: 'absolute', top: 10, right: 10, zIndex: 2,
            background: 'rgba(12,12,14,.82)', color: accent,
            fontSize: 11.5, fontWeight: 600,
            padding: '5px 11px', borderRadius: 8,
            border: `1px solid ${accent}66`,
            backdropFilter: 'blur(4px)',
          }}>
            ★ Destaque
          </span>
        )}
      </div>

      {/* info */}
      <div style={{ padding: '15px 16px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.25, minHeight: 38, color: PREM.text }}>
          {product.name}
        </h3>

        {product.description && (
          <p style={{ fontSize: 13, color: PREM.muted, marginTop: 6, lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.description}
          </p>
        )}

        {product.is_promotional && (
          <span style={{
            alignSelf: 'flex-start', marginTop: 8,
            background: accent, color: '#08120c',
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 7,
            textTransform: 'uppercase', letterSpacing: '.03em',
          }}>
            Promoção
          </span>
        )}

        <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 19, fontWeight: 700, color: PREM.text }}>
            {formatCurrency(price)}
          </span>
          {originalPrice && (
            <span style={{ fontSize: 13, color: PREM.muted, textDecoration: 'line-through' }}>
              {formatCurrency(originalPrice)}
            </span>
          )}
        </div>

        {/* cart controls */}
        <div style={{ marginTop: 12 }}>
          {quantity > 0 ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: PREM.bg2, border: `1px solid ${accent}`,
              borderRadius: 10, padding: 4,
            }}>
              <button
              onClick={handleDec}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 7, color: accent, borderRadius: 7,
                  border: 'none', background: 'none', cursor: 'pointer',
                }}
              >
                <IconMinus s={18} />
              </button>
              <span style={{ fontWeight: 700, fontSize: 15, color: PREM.text }} key={quantity}>
                {quantity}
              </span>
              <button
              onClick={handleInc}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 7, color: accent, borderRadius: 7,
                  border: 'none', background: 'none', cursor: 'pointer',
                }}
              >
                <IconPlus s={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: accent, color: '#08120c',
                fontWeight: 700, fontSize: 14.5,
                padding: 11, borderRadius: 10,
                border: 'none', cursor: 'pointer', width: '100%',
                fontFamily: 'inherit', transition: 'background .2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)' }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'none' }}
            >
              <IconCart s={17} /> Adicionar
            </button>
          )}
          {hasDescription && (
            <button type="button" onClick={() => setDetailsOpen(true)} style={detailsButtonStyle}>
              Ver detalhes do item
            </button>
          )}
        </div>
      </div>
    </div>

      {detailsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Detalhes de ${product.name}`}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 14,
            background: 'rgba(0,0,0,.72)',
            backdropFilter: 'blur(6px)',
          }}
          onClick={() => setDetailsOpen(false)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(440px, 100%)',
              maxHeight: '92vh',
              overflowY: 'auto',
              background: PREM.card,
              border: `1px solid ${PREM.line}`,
              borderRadius: 18,
              boxShadow: '0 22px 70px rgba(0,0,0,.6)',
            }}
          >
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                style={{ width: '100%', aspectRatio: '16/10', objectFit: 'cover', display: 'block' }}
              />
            )}
            <div style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <h3 style={{ color: PREM.text, fontSize: 22, lineHeight: 1.15, fontWeight: 800, margin: 0 }}>
                  {product.name}
                </h3>
                <button
                  type="button"
                  onClick={() => setDetailsOpen(false)}
                  aria-label="Fechar detalhes"
                  style={{
                    border: `1px solid ${PREM.line}`,
                    background: PREM.bg2,
                    color: PREM.text,
                    borderRadius: 10,
                    width: 36,
                    height: 36,
                    cursor: 'pointer',
                    fontSize: 20,
                    lineHeight: 1,
                  }}
                >
                  x
                </button>
              </div>

              {hasDescription && (
                <p style={{ color: PREM.muted, fontSize: 15, lineHeight: 1.55, marginTop: 12, whiteSpace: 'pre-line' }}>
                  {product.description}
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 16 }}>
                <span style={{ color: PREM.text, fontSize: 24, fontWeight: 800 }}>
                  {formatCurrency(price)}
                </span>
                {originalPrice && (
                  <span style={{ color: PREM.muted, fontSize: 14, textDecoration: 'line-through' }}>
                    {formatCurrency(originalPrice)}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setDetailsOpen(false)
                  handleAdd()
                }}
                style={{
                  marginTop: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%',
                  border: 'none',
                  borderRadius: 12,
                  background: accent,
                  color: '#08120c',
                  fontFamily: 'inherit',
                  fontSize: 15,
                  fontWeight: 800,
                  padding: 13,
                  cursor: 'pointer',
                }}
              >
                <IconCart s={17} /> Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PremiumProductCard
