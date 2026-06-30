import { useState } from 'react'
import { IconTruck, IconShield, IconStar, IconClock } from '../icons.jsx'
import { formatStoreHour, getEffectiveStoreStatus, normalizeTime } from '../../../utils/storeSchedule'

const PREM = {
  bg: '#0c0c0e',
  line: '#26262a',
  muted: '#9a9aa0',
  green: '#1fbf5a',
}

const features = [
  { icon: <IconTruck s={20} />, title: 'Entrega rápida', sub: 'Para toda região' },
  { icon: <IconShield s={20} />, title: 'Pagamento seguro', sub: 'Ambiente protegido' },
  { icon: <IconStar s={18} />, title: 'Qualidade premium', sub: 'Sempre o melhor' },
]

const dayLabels = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const PremiumHero = ({ store, businessHours }) => {
  const [showHours, setShowHours] = useState(false)
  const storeName = store?.store_name || store?.name || 'Loja'
  const themeColor = store?.theme_primary_color || store?.primary_color || '#f7a325'
  const heroImage = store?.banner_url || store?.cover_url || store?.hero_image_url || ''
  const heroPosition = store?.hero_image_position || 'center'
  const heroZoom = Math.max(80, Math.min(Number(store?.hero_image_zoom || 100), 160))
  const heroOverlay = Math.max(0, Math.min(Number(store?.hero_overlay_opacity ?? 65), 90)) / 100
  const heroHeight = Math.max(360, Math.min(Number(store?.hero_height || 480), 760))
  const heroTitle = store?.hero_title || 'CARDAPIO ONLINE'
  const heroHighlight = store?.hero_highlight || storeName
  const heroSubtitle = store?.hero_subtitle || 'Confira nossos produtos e faca seu pedido.'
  const status = getEffectiveStoreStatus(store, businessHours)
  const isOpen = status.isOpen
  const closeTime = normalizeTime(status.closesAt)
  const openTime = normalizeTime(status.opensAt)
  const orderedHours = [...(businessHours || [])].sort((a, b) => Number(a.day_of_week) - Number(b.day_of_week))

  return (
    <section style={{
      position: 'relative',
      overflow: 'hidden',
      background: PREM.bg,
      minHeight: heroHeight,
      '--premium-accent': themeColor,
    }}>
      <div className="prem-hero-img">
        {heroImage && <img
          src={heroImage}
          alt={storeName}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: heroPosition,
            transform: `scale(${heroZoom / 100})`,
            transformOrigin: heroPosition,
          }}
          onError={(e) => { e.target.style.display = 'none' }}
        />}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(90deg,#0c0c0e 8%,rgba(12,12,14,${heroOverlay}) 32%,rgba(12,12,14,0) 62%)`,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(0deg,#0c0c0e 2%,rgba(12,12,14,0) 30%)',
        }} />
      </div>

      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '64px 24px 72px',
        position: 'relative', zIndex: 2,
      }}>
        <div style={{ maxWidth: 620 }}>
          <h1 className="prem-anim-0" style={{
            fontWeight: 500,
            fontSize: 'clamp(30px,4.5vw,52px)',
            lineHeight: 1.02,
            letterSpacing: '-.01em',
          }}>
            <span style={{ whiteSpace: 'pre-line' }}>{heroTitle}</span><br />
            <span style={{
              fontWeight: 800,
              fontSize: 'clamp(40px,6.5vw,76px)',
              color: themeColor,
              display: 'inline-block',
              marginTop: 6,
            }}>
              {heroHighlight}
            </span>
          </h1>

          <p className="prem-anim-1" style={{
            marginTop: 18, fontSize: 18,
            color: '#d9d8d4',
          }}>
            {heroSubtitle}
          </p>

          <button className="prem-anim-2" type="button" onClick={() => setShowHours(prev => !prev)} style={{
            marginTop: 26,
            display: 'inline-flex', flexDirection: 'column', gap: 4,
            background: 'rgba(20,20,22,.7)',
            border: `1px solid ${PREM.line}`,
            borderRadius: 14, padding: '14px 20px',
            backdropFilter: 'blur(6px)',
            color: '#f4f3f1',
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 600, fontSize: 15 }}>
              <span style={{
                width: 10, height: 10, borderRadius: 999,
                background: isOpen ? PREM.green : '#ef4444',
                boxShadow: `0 0 0 4px ${isOpen ? 'rgba(31,191,90,.18)' : 'rgba(239,68,68,.18)'}`,
              }} />
              {isOpen ? 'Loja aberta' : 'Loja fechada'}
            </div>
            {isOpen && closeTime && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: PREM.muted, fontSize: 13.5 }}>
                <span style={{ color: PREM.green, display: 'flex' }}><IconClock s={16} /></span>
                Fechamento às {closeTime}
              </div>
            )}
            {!isOpen && openTime && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: PREM.muted, fontSize: 13.5 }}>
                <span style={{ color: '#ef4444', display: 'flex' }}><IconClock s={16} /></span>
                Abre às {openTime}
              </div>
            )}
            <div style={{ color: PREM.muted, fontSize: 12, marginTop: 2 }}>
              Clique para ver horários
            </div>
          </button>

          {showHours && (
            <div className="prem-anim-3" style={{
              marginTop: 12,
              maxWidth: 330,
              background: 'rgba(20,20,22,.86)',
              border: `1px solid ${PREM.line}`,
              borderRadius: 14,
              padding: '12px 14px',
              backdropFilter: 'blur(6px)',
            }}>
              {orderedHours.length > 0 ? orderedHours.map((hour) => (
                <div key={hour.id || hour.day_of_week} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 14,
                  padding: '5px 0',
                  borderBottom: '1px solid rgba(255,255,255,.05)',
                  color: PREM.muted,
                  fontSize: 13,
                }}>
                  <span>{dayLabels[Number(hour.day_of_week)] || 'Dia'}</span>
                  <strong style={{ color: '#f4f3f1', fontWeight: 600 }}>
                    {formatStoreHour(hour)}
                  </strong>
                </div>
              )) : (
                <div style={{ color: PREM.muted, fontSize: 13 }}>Horários não cadastrados.</div>
              )}
            </div>
          )}

          <div className="prem-anim-4 prem-feature-grid" style={{ marginTop: 34 }}>
            {features.map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 11,
                background: 'rgba(20,20,22,.55)',
                border: `1px solid ${PREM.line}`,
                borderRadius: 12, padding: '10px 14px',
                minHeight: 58,
              }}>
                <span style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                  background: `${themeColor}24`,
                  color: themeColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {f.icon}
                </span>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{f.title}</div>
                  <div style={{ fontSize: 11.5, color: PREM.muted }}>{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default PremiumHero
