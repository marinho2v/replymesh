import { useEffect, useMemo, useState } from 'react'
import { Gift, Info, RotateCw, Ticket } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { getCustomerProfileByPhone, getSavedCustomerSession, normalizePhone, saveCustomerSession } from '../../services/customers'
import { getWheelPrizes, spinCustomerWheel } from '../../services/wheel'
import { usePublicStoreInfo } from '../../hooks/usePublicStoreInfo'
import { useCompanySlug } from '../../contexts/CompanySlugContext'
import { NEUTRAL_FAVICON_URL } from '../../utils/tenantBranding'

const fallbackColors = ['#f7c600', '#ef4444', '#2f80ed', '#22c55e', '#8b3ff2', '#ff7a1a', '#14b8a6', '#ec4899']

const polarToCartesian = (center, radius, angleInDegrees) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180
  return {
    x: center + (radius * Math.cos(angleInRadians)),
    y: center + (radius * Math.sin(angleInRadians)),
  }
}

const describeSlice = (center, radius, startAngle, endAngle) => {
  const start = polarToCartesian(center, radius, endAngle)
  const end = polarToCartesian(center, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

  return [
    `M ${center} ${center}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ')
}

const splitWheelLabel = (label = '') => {
  const normalized = String(label || '').trim()
  const lower = normalized.toLowerCase()

  if (lower.includes('refrigerante')) return ['REFRI', 'GRATIS']
  if (lower.includes('batata')) return ['BATATA', 'TURBINADA', 'GRATIS']

  const words = normalized.split(/\s+/).filter(Boolean)
  if (words.length <= 1) return [normalized]
  if (normalized.length <= 10) return [normalized]

  const middle = Math.ceil(words.length / 2)
  return [words.slice(0, middle).join(' '), words.slice(middle).join(' ')]
}

const getWheelLabelFontSize = (lines) => {
  const longestLine = Math.max(...lines.map(line => line.length), 1)
  if (lines.length >= 3) return 8.5
  if (longestLine > 12) return 9
  if (longestLine > 8) return 10
  return 12
}

const getPrizeIcon = (prize = {}) => {
  const text = `${prize.name || ''} ${prize.badge || ''} ${prize.prize_type || ''}`.toLowerCase()

  if (text.includes('frete')) return 'truck'
  if (text.includes('lanche')) return 'burger'
  if (text.includes('quase') || text.includes('nao') || text.includes('não')) return 'sad'
  if (text.includes('%') || text.includes('off') || text.includes('desconto')) return 'percent'
  if (text.includes('r$') || text.includes('brl')) return 'money'
  return 'ticket'
}

const PrizeIcon = ({ type, x, y, angle }) => {
  const common = {
    transform: `translate(${x - 10} ${y - 10}) rotate(${angle} 10 10)`,
    stroke: 'white',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill: 'none',
    opacity: 0.95,
  }

  if (type === 'truck') {
    return (
      <g {...common}>
        <path d="M2 7h10v7H2z" />
        <path d="M12 9h3l3 3v2h-6z" />
        <circle cx="6" cy="16" r="1.7" />
        <circle cx="15" cy="16" r="1.7" />
      </g>
    )
  }

  if (type === 'burger') {
    return (
      <g {...common}>
        <path d="M4 8c1-3 11-3 12 0" />
        <path d="M3 11h14" />
        <path d="M4 14h12" />
        <path d="M5 16h10" />
      </g>
    )
  }

  if (type === 'sad') {
    return (
      <g {...common}>
        <circle cx="10" cy="10" r="7" />
        <path d="M7 8h.1M13 8h.1" />
        <path d="M7 14c1.5-1.5 4.5-1.5 6 0" />
      </g>
    )
  }

  if (type === 'money') {
    return (
      <g {...common}>
        <rect x="3" y="5" width="14" height="10" rx="2" />
        <path d="M10 7v6M8 9c0-1 4-1 4 0s-4 1-4 2 4 1 4 0" />
      </g>
    )
  }

  if (type === 'percent') {
    return (
      <g {...common}>
        <path d="M5 15L15 5" />
        <circle cx="6.5" cy="6.5" r="1.8" />
        <circle cx="13.5" cy="13.5" r="1.8" />
      </g>
    )
  }

  return (
    <g {...common}>
      <path d="M4 6h12v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z" />
      <path d="M9 7v8" />
    </g>
  )
}

const WheelGraphic = ({ prizes, rotation, logoUrl }) => {
  const size = 360
  const center = size / 2
  const radius = 146
  const innerRadius = 58
  const step = 360 / prizes.length

  return (
    <svg className="h-full w-full overflow-visible drop-shadow-2xl" viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <defs>
        <filter id="wheelTextShadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#000000" floodOpacity="0.75" />
        </filter>
        <radialGradient id="wheelCenterGlow" cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor="#2b2b2b" />
          <stop offset="65%" stopColor="#080808" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>
        <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff3a3" />
          <stop offset="35%" stopColor="#f0b90b" />
          <stop offset="70%" stopColor="#8a5a00" />
          <stop offset="100%" stopColor="#ffd447" />
        </linearGradient>
      </defs>
      <circle cx={center} cy={center} r="170" fill="#111111" stroke="#3b2a05" strokeWidth="4" />
      <circle cx={center} cy={center} r="162" fill="none" stroke="url(#goldRim)" strokeWidth="10" />
      <circle cx={center} cy={center} r="151" fill="none" stroke="#241a05" strokeWidth="5" />
      {Array.from({ length: 24 }).map((_, index) => {
        const point = polarToCartesian(center, 162, index * 15)
        return <circle key={index} cx={point.x} cy={point.y} r="3.2" fill={index % 2 ? '#fff0a6' : '#f59e0b'} opacity="0.95" />
      })}
      <g
        className="transition-transform duration-[1800ms] ease-out"
        style={{
          transform: `rotate(${rotation}deg)`,
          transformOrigin: `${center}px ${center}px`,
        }}
      >
        {prizes.map((prize, index) => {
          const startAngle = index * step
          const endAngle = (index + 1) * step
          const middleAngle = startAngle + step / 2
          const iconPoint = polarToCartesian(center, radius * 0.8, middleAngle)
          const textPoint = polarToCartesian(center, radius * 0.67, middleAngle)
          const textRotation = middleAngle > 90 && middleAngle < 270 ? middleAngle + 180 : middleAngle
          const lines = splitWheelLabel(prize.badge || prize.name)
          const fontSize = getWheelLabelFontSize(lines)
          const iconType = getPrizeIcon(prize)

          return (
            <g key={prize.id}>
              <path
                d={describeSlice(center, radius, startAngle, endAngle)}
                fill={prize.color || fallbackColors[index % fallbackColors.length]}
                stroke="#111827"
                strokeWidth="2"
              />
              <path
                d={`M ${center} ${center} L ${polarToCartesian(center, radius, startAngle).x} ${polarToCartesian(center, radius, startAngle).y}`}
                stroke="rgba(0,0,0,0.35)"
                strokeWidth="2"
              />
              <PrizeIcon type={iconType} x={iconPoint.x} y={iconPoint.y} angle={textRotation} />
              <text
                x={textPoint.x}
                y={textPoint.y}
                transform={`rotate(${textRotation} ${textPoint.x} ${textPoint.y})`}
                textAnchor="middle"
                dominantBaseline="middle"
                className="select-none fill-white font-black uppercase tracking-normal"
                fontSize={fontSize}
                filter="url(#wheelTextShadow)"
                style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.42)', strokeWidth: lines.length >= 3 ? 2 : 2.5, strokeLinejoin: 'round' }}
              >
                {lines.map((line, lineIndex) => (
                  <tspan key={`${line}-${lineIndex}`} x={textPoint.x} dy={lineIndex === 0 ? (lines.length > 1 ? `${-0.48 * (lines.length - 1)}em` : '0') : '1.05em'}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          )
        })}
        <circle cx={center} cy={center} r={innerRadius + 7} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="8" />
      </g>
      <circle cx={center} cy={center} r="61" fill="url(#wheelCenterGlow)" stroke="#f0b90b" strokeWidth="3" />
      <circle cx={center} cy={center} r="52" fill="#050505" stroke="#262626" strokeWidth="2" />
      <image href={logoUrl} x={center - 31} y={center - 31} width="62" height="62" preserveAspectRatio="xMidYMid meet" />
    </svg>
  )
}

const Wheel = () => {
  const companySlug = useCompanySlug()
  const { store } = usePublicStoreInfo()
  const logoUrl = store?.logo_url || NEUTRAL_FAVICON_URL
  const [phone, setPhone] = useState('')
  const [profile, setProfile] = useState(null)
  const [prizes, setPrizes] = useState([])
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState(null)

  const activePrizes = prizes.length ? prizes : [
    { id: 'placeholder-1', name: '5% OFF', badge: '5%', color: '#eab308' },
    { id: 'placeholder-2', name: '10% OFF', badge: '10%', color: '#f97316' },
    { id: 'placeholder-3', name: 'Frete gratis', badge: 'Frete', color: '#22c55e' },
    { id: 'placeholder-4', name: 'Quase!', badge: 'Quase!', color: '#6b7280' },
  ]

  const visualPrizes = useMemo(() => {
    const usedColors = new Set()
    return activePrizes.map((prize, index) => {
      const fallback = fallbackColors[index % fallbackColors.length]
      const originalColor = String(prize.color || '').toLowerCase()
      const color = originalColor && !usedColors.has(originalColor) ? originalColor : fallback
      usedColors.add(color)
      return { ...prize, color }
    })
  }, [activePrizes])

  const getPrizeRotation = (prizeId, currentRotation) => {
    const prizeIndex = visualPrizes.findIndex(prize => prize.id === prizeId)
    if (prizeIndex < 0 || visualPrizes.length === 0) {
      return currentRotation + 1440 + Math.floor(Math.random() * 360)
    }

    const step = 360 / visualPrizes.length
    const middleAngle = prizeIndex * step + step / 2
    const safeJitter = (Math.random() - 0.5) * step * 0.35
    const targetAngle = middleAngle + safeJitter
    const normalizedCurrent = ((currentRotation % 360) + 360) % 360
    const desiredModulo = (360 - targetAngle + 360) % 360
    const delta = (desiredModulo - normalizedCurrent + 360) % 360

    return currentRotation + 1440 + delta
  }

  const loadProfile = async (phoneToSearch) => {
    const normalized = normalizePhone(phoneToSearch)
    if (normalized.length < 10) {
      toast.error('Digite o telefone usado no pedido')
      return
    }

    setLoadingProfile(true)
    try {
      const data = await getCustomerProfileByPhone(normalized, companySlug)
      if (!data?.found) {
        setProfile(null)
        toast.error('Nenhum cadastro encontrado')
        return
      }

      setProfile(data)
      saveCustomerSession(data.customer, companySlug)
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel carregar sua roleta')
    } finally {
      setLoadingProfile(false)
    }
  }

  useEffect(() => {
    getWheelPrizes(companySlug).then(setPrizes).catch(() => setPrizes([]))
    const saved = getSavedCustomerSession(companySlug)
    if (saved?.customer_phone) {
      setPhone(saved.customer_phone)
      loadProfile(saved.customer_phone)
    }
  }, [companySlug])

  const handleSpin = async () => {
    const normalized = normalizePhone(phone)
    if (!profile?.found || !normalized) {
      await loadProfile(phone)
      return
    }

    if ((profile.wheel_spins?.available || 0) <= 0) {
      toast.error('Voce nao tem giros disponiveis')
      return
    }

    setSpinning(true)
    setResult(null)

    try {
      const data = await spinCustomerWheel(normalized, companySlug)

      if (!data?.success) {
        toast.error(data?.message || 'Nao foi possivel girar a roleta')
        return
      }

      setRotation(prev => getPrizeRotation(data.prize?.id, prev))
      await new Promise(resolve => setTimeout(resolve, 1800))

      setResult(data)
      const refreshed = await getCustomerProfileByPhone(normalized, companySlug)
      setProfile(refreshed)
      toast.success(data.coupon?.code ? `Voce ganhou: ${data.coupon.code}` : data.prize?.name || 'Giro realizado')
    } catch (error) {
      toast.error(error.message || 'Erro ao girar a roleta')
    } finally {
      setSpinning(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Roleta de Premios</h1>
          <p className="mt-2 text-gray-400">
            Finalizou pedido? Use seus giros aqui pelo telefone cadastrado.
          </p>
        </div>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex gap-3">
              <Info className="mt-1 shrink-0 text-yellow-400" size={22} />
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-white">Como funciona a roleta?</h2>
                <div className="grid gap-2 text-sm text-gray-300 sm:grid-cols-2">
                  <p>A cada R$ 25,00 em lanches no pedido finalizado, voce ganha 1 giro.</p>
                  <p>Exemplo: R$ 50,00 libera 2 giros; R$ 75,00 libera 3 giros.</p>
                  <p>Se ganhar desconto, o cupom fica salvo na sua conta para o proximo pedido.</p>
                  <p>Voce pode guardar varios cupons, mas usa apenas 1 cupom por pedido. Os cupons da roleta sao validos por 7 dias.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Input
                label="Telefone"
                placeholder="(21) 99999-9999"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
              <Button className="self-end" onClick={() => loadProfile(phone)} loading={loadingProfile}>
                Carregar giros
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardContent className="flex flex-col items-center gap-6 p-6">
              <div className="relative h-80 w-80 max-w-full sm:h-[360px] sm:w-[360px]">
                <div className="absolute left-1/2 top-[-10px] z-10 h-0 w-0 -translate-x-1/2 border-l-[16px] border-r-[16px] border-t-[28px] border-l-transparent border-r-transparent border-t-white" />
                <WheelGraphic prizes={visualPrizes} rotation={rotation} logoUrl={logoUrl} />
              </div>

              <Button size="lg" onClick={handleSpin} loading={spinning} disabled={spinning || !profile?.found}>
                <RotateCw size={20} className="mr-2" />
                Girar roleta
              </Button>

              {result?.success && (
                <div className="w-full rounded-xl border border-green-700 bg-green-900/20 p-4 text-center">
                  <p className="text-lg font-bold text-white">{result.prize?.name}</p>
                  <p className="mt-1 text-sm text-green-200">{result.prize?.description}</p>
                  {result.coupon?.code && (
                    <div className="mt-4 rounded-lg bg-white p-3 text-black">
                      <p className="text-xs uppercase tracking-wide">Seu cupom</p>
                      <p className="text-2xl font-black">{result.coupon.code}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-white">Seus giros</h2>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Gift className="text-gray-400" size={24} />
                  <div>
                    <p className="text-3xl font-bold text-white">{profile?.wheel_spins?.available || 0}</p>
                    <p className="text-sm text-gray-400">giros disponiveis</p>
                  </div>
                </div>
                {profile?.customer && (
                  <p className="mt-4 text-sm text-gray-300">
                    Cliente: {profile.customer.name || profile.customer.full_name}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-white">Cupons ganhos</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile?.coupons?.length ? profile.coupons.map(coupon => (
                  <div key={coupon.id} className="rounded-lg border border-dark-600 bg-dark-900 p-4">
                    <div className="flex items-center gap-3">
                      <Ticket className="text-gray-400" size={20} />
                      <div>
                        <p className="text-lg font-bold text-white">{coupon.code}</p>
                        <p className="text-sm text-gray-400">{coupon.title || coupon.description}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-400">Nenhum cupom da roleta ainda.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Wheel
