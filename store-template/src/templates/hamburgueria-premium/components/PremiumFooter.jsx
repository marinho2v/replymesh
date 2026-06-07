import { IconPhone, IconWhatsApp, IconClock, IconShield, IconInsta } from '../icons.jsx'

const PREM = {
  gold: '#f7a325',
  line: '#26262a',
  text: '#f4f3f1',
  muted: '#9a9aa0',
  muted2: '#6f6f76',
  card: '#1a1a1d',
}

const OctaLogo = ({ size = 44, label, logoUrl }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        clipPath: 'polygon(30% 2%,70% 2%,98% 30%,98% 70%,70% 98%,30% 98%,2% 70%,2% 30%)',
        background: 'linear-gradient(145deg,#1c1c1f,#0f0f11)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `inset 0 0 0 1.5px ${PREM.gold}`,
        overflow: 'hidden',
      }}
    >
      {logoUrl ? (
        <img src={logoUrl} alt={label || 'Logo da loja'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div
          style={{
            width: size * 0.62,
            height: size * 0.62,
            clipPath: 'polygon(30% 2%,70% 2%,98% 30%,98% 70%,70% 98%,30% 98%,2% 70%,2% 30%)',
            background: 'linear-gradient(145deg,#ffb838,#e8920f)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: size * 0.22,
            color: '#2a1a05',
          }}
        >
          {(label || '').substring(0, 2).toUpperCase() || 'RM'}
        </div>
      )}
    </div>
    <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-.01em', color: PREM.text }}>
      {label || 'Hamburgueria'}
    </span>
  </div>
)

const PremiumFooter = ({ store }) => {
  const storeName = store?.store_name || store?.name || 'Hamburgueria'
  const logoUrl = store?.logo_url
  const phone = store?.phone || store?.whatsapp_number || ''
  const whatsapp = store?.whatsapp_number || store?.whatsapp || ''
  const whatsappRaw = whatsapp.replace(/\D/g, '')
  const whatsappHref = whatsappRaw ? `https://wa.me/${whatsappRaw}` : '#'

  const formatPhone = (value) => {
    const digits = String(value || '').replace(/\D/g, '')
    if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    return value || '-'
  }

  const footH = { fontSize: 15, fontWeight: 600, marginBottom: 14, color: PREM.text }
  const footRow = { display: 'flex', alignItems: 'center', gap: 9, color: PREM.text, fontSize: 14, padding: '6px 0' }
  const footLink = { display: 'block', color: PREM.muted, fontSize: 14, padding: '6px 0', textDecoration: 'none', transition: 'color .2s' }

  return (
    <footer style={{ borderTop: `1px solid ${PREM.line}`, marginTop: 10, background: '#000' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '46px 24px 0' }}>
        <div className="prem-foot-grid">
          <div>
            <OctaLogo size={44} label={storeName} logoUrl={logoUrl} />
            <p style={{ marginTop: 16, color: PREM.muted, fontSize: 14, lineHeight: 1.6, maxWidth: 260 }}>
              Qualidade, sabor e rapidez que você merece!
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
              <a
                href="#"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 11,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: PREM.card,
                  border: `1px solid ${PREM.line}`,
                  color: PREM.text,
                }}
                aria-label="Instagram"
              >
                <IconInsta s={18} />
              </a>
              {whatsappRaw && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 11,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: PREM.card,
                    border: `1px solid ${PREM.line}`,
                    color: PREM.text,
                  }}
                  aria-label="WhatsApp"
                >
                  <IconWhatsApp s={18} />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 style={footH}>Institucional</h4>
            {['Sobre nós', 'Política de entrega', 'Termos de uso', 'Privacidade'].map((label) => (
              <a key={label} href="#" style={footLink}>
                {label}
              </a>
            ))}
          </div>

          <div>
            <h4 style={footH}>Atendimento</h4>
            {phone && (
              <div style={footRow}>
                <IconPhone s={16} style={{ color: PREM.gold }} />
                {formatPhone(phone)}
              </div>
            )}
            {whatsapp && (
              <div style={footRow}>
                <IconWhatsApp s={16} style={{ color: PREM.gold }} />
                {formatPhone(whatsapp)}
              </div>
            )}
            <div style={{ ...footRow, alignItems: 'flex-start' }}>
              <IconClock s={16} style={{ color: PREM.gold, marginTop: 2 }} />
              <span>Verifique os horários<br /><span style={{ color: PREM.muted }}>no topo da página</span></span>
            </div>
          </div>

          <div>
            <h4 style={footH}>Formas de pagamento</h4>
            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
              {['VISA', 'Master', 'Pix'].map((payment) => (
                <div
                  key={payment}
                  style={{
                    height: 38,
                    padding: '0 14px',
                    borderRadius: 9,
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 13,
                    color: payment === 'VISA' ? '#1a1f71' : payment === 'Master' ? '#eb001b' : '#32bcad',
                  }}
                >
                  {payment}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 18, color: PREM.muted, fontSize: 13 }}>
              <IconShield s={20} style={{ color: PREM.gold }} />
              <span>Ambiente 100% seguro<br /><span style={{ fontSize: 12 }}>Seus dados protegidos</span></span>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 40,
            padding: '20px 0',
            borderTop: `1px solid ${PREM.line}`,
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            color: PREM.muted2,
            fontSize: 13,
          }}
        >
          <span>© {new Date().getFullYear()} {storeName}. Todos os direitos reservados.</span>
          <span>Desenvolvido por Replymesh</span>
        </div>
      </div>
    </footer>
  )
}

export default PremiumFooter
