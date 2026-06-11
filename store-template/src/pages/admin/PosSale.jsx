import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Search, ShoppingCart, Plus, Minus, Trash2, X, Printer,
  DollarSign, CreditCard, Smartphone, ChevronDown, CheckCircle,
  AlertCircle, Tag, User, Package, Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { createPosSale, getPosMenu } from '../../services/pos'
import { getOpenCashSession } from '../../services/cashRegister'
import { useCompanySlug, useCompanyBasePath } from '../../contexts/CompanySlugContext'
import { useAuth } from '../../hooks/useAuth'
import { Link } from 'react-router-dom'

const fmt = (cents) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    (cents || 0) / 100
  )

const PAYMENT_LABELS = {
  money: 'Dinheiro',
  pix: 'Pix',
  card_on_delivery: 'Cartao',
}
const PAYMENT_ICONS = {
  money: DollarSign,
  pix: Smartphone,
  card_on_delivery: CreditCard,
}

// ─── Receipt modal ───────────────────────────────────────────────────────────
function ReceiptModal({ sale, onClose }) {
  const printRef = useRef()
  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=380,height=600')
    w.document.write(`
      <html><head><title>Comprovante PDV</title>
      <style>
        body{font-family:monospace;font-size:13px;margin:16px;color:#000}
        h2{text-align:center;margin:0 0 4px}
        .center{text-align:center}
        .sep{border:none;border-top:1px dashed #000;margin:8px 0}
        .row{display:flex;justify-content:space-between}
        .bold{font-weight:bold}
        .footer{text-align:center;margin-top:12px;font-size:11px}
      </style></head><body>
      ${printRef.current.innerHTML}
      </body></html>
    `)
    w.document.close()
    w.print()
  }

  const change = Math.max(0, (sale.change_for_cents || 0) - (sale.total_cents || 0))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-xl border border-dark-700 bg-dark-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-dark-700 px-4 py-3">
          <span className="font-semibold text-white">Comprovante PDV</span>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 rounded-lg bg-dark-800 px-3 py-1.5 text-xs text-gray-200 hover:bg-dark-700">
              <Printer size={13} /> Imprimir
            </button>
            <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-dark-800"><X size={16} /></button>
          </div>
        </div>
        <div ref={printRef} className="px-4 py-3 text-sm text-gray-200 font-mono">
          <h2 className="text-center text-base font-bold text-white mb-0.5">{sale.store_name}</h2>
          <p className="text-center text-[11px] text-gray-400 mb-2">PDV / Balcao</p>
          <hr className="border-dashed border-dark-600 my-2" />
          <div className="flex justify-between text-xs text-gray-400">
            <span>Venda #{sale.order_number}</span>
            <span>{new Date(sale.created_at).toLocaleString('pt-BR')}</span>
          </div>
          {sale.attendant && <div className="text-xs text-gray-400">Atendente: {sale.attendant}</div>}
          {sale.customer_name && sale.customer_name !== 'Balcao' && (
            <div className="text-xs text-gray-400">Cliente: {sale.customer_name}</div>
          )}
          <hr className="border-dashed border-dark-600 my-2" />
          {(sale.items || []).map((item, i) => (
            <div key={i} className="flex justify-between text-xs py-0.5">
              <span className="truncate max-w-[180px]">{item.quantity}x {item.product_name}</span>
              <span>{fmt(item.total_price_brl * 100)}</span>
            </div>
          ))}
          <hr className="border-dashed border-dark-600 my-2" />
          <div className="flex justify-between text-xs text-gray-400">
            <span>Subtotal</span><span>{fmt(sale.subtotal_cents)}</span>
          </div>
          {sale.discount_cents > 0 && (
            <div className="flex justify-between text-xs text-green-400">
              <span>Desconto</span><span>-{fmt(sale.discount_cents)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-white mt-1">
            <span>TOTAL</span><span>{fmt(sale.total_cents)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{PAYMENT_LABELS[sale.payment_method] || sale.payment_method}</span>
            {sale.change_for_cents > 0 && <span>Recebido: {fmt(sale.change_for_cents)}</span>}
          </div>
          {change > 0 && (
            <div className="flex justify-between text-xs text-yellow-400 font-bold">
              <span>Troco</span><span>{fmt(change)}</span>
            </div>
          )}
          <hr className="border-dashed border-dark-600 my-2" />
          <p className="text-center text-[11px] text-gray-500">Obrigado pela preferencia!</p>
        </div>
        <div className="border-t border-dark-700 px-4 py-3 flex justify-end">
          <button onClick={onClose} className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300">
            Nova Venda
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main PDV component ───────────────────────────────────────────────────────
export default function PosSale() {
  const companySlug = useCompanySlug()
  useAuth()
  const basePath = useCompanyBasePath()

  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [cashSession, setCashSession] = useState(null)
  const [cashLoading, setCashLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [receipt, setReceipt] = useState(null)

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('money')
  const [receivedAmount, setReceivedAmount] = useState('')
  const [discountType, setDiscountType] = useState('none')
  const [discountValue, setDiscountValue] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [notes, setNotes] = useState('')
  const [showCustomer, setShowCustomer] = useState(false)

  useEffect(() => {
    getOpenCashSession().then(setCashSession).catch(() => setCashSession(null)).finally(() => setCashLoading(false))
    if (companySlug) {
      getPosMenu(companySlug).then(setCategories).catch(() => setCategories([]))
    }
  }, [companySlug])

  // Computed
  const allProducts = useMemo(() => categories.flatMap((c) => c.products || []), [categories])

  const visibleProducts = useMemo(() => {
    let list = selectedCategory
      ? (categories.find((c) => c.id === selectedCategory)?.products || [])
      : allProducts
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q))
    }
    return list.filter((p) => p.is_active !== false)
  }, [categories, allProducts, selectedCategory, search])

  const subtotalCents = useMemo(
    () => cart.reduce((sum, i) => sum + i.unit_price_cents * i.quantity, 0),
    [cart]
  )

  const discountCents = useMemo(() => {
    if (discountType === 'fixed') return Math.min(toCents(discountValue), subtotalCents)
    if (discountType === 'percent') return Math.min(Math.round((subtotalCents * Number(discountValue || 0)) / 100), subtotalCents)
    return 0
  }, [discountType, discountValue, subtotalCents])

  const totalCents = Math.max(subtotalCents - discountCents, 0)

  const receivedCents = paymentMethod === 'money' ? toCents(receivedAmount) : totalCents
  const changeCents = paymentMethod === 'money' ? Math.max(receivedCents - totalCents, 0) : 0
  const canFinalize = cart.length > 0 && cashSession &&
    (paymentMethod !== 'money' || receivedCents >= totalCents)

  // Cart actions
  const addToCart = (product) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product_id === product.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 }
        return next
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        unit_price_cents: product.promotional_price_cents || product.price_cents,
        quantity: 1,
        notes: '',
      }]
    })
  }

  const changeQty = (productId, delta) => {
    setCart((prev) =>
      prev.flatMap((i) => {
        if (i.product_id !== productId) return [i]
        const qty = i.quantity + delta
        return qty > 0 ? [{ ...i, quantity: qty }] : []
      })
    )
  }

  const removeItem = (productId) => setCart((prev) => prev.filter((i) => i.product_id !== productId))
  const clearCart = () => { setCart([]); setDiscountValue(''); setDiscountType('none'); setCustomerName(''); setNotes(''); setReceivedAmount('') }

  const handleFinalize = async () => {
    if (!canFinalize) return
    setLoading(true)
    try {
      const sale = await createPosSale({
        items: cart,
        paymentMethod,
        discountCents,
        changeForCents: paymentMethod === 'money' ? receivedCents : 0,
        customerName: customerName.trim(),
        notes: notes.trim(),
      })
      clearCart()
      setReceipt(sale)
      toast.success(`Venda #${sale.order_number} registrada!`)
      // Refresh cash session after sale
      getOpenCashSession().then(setCashSession).catch(() => {})
    } catch (err) {
      toast.error(err?.message || 'Erro ao registrar venda')
    } finally {
      setLoading(false)
    }
  }

  if (cashLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Verificando caixa...</div>
  }

  if (!cashSession) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <Wallet size={48} className="text-yellow-400" />
        <h2 className="text-xl font-bold text-white">Caixa fechado</h2>
        <p className="text-gray-400 text-sm max-w-xs">Abra o caixa antes de iniciar vendas no PDV.</p>
        <Link to={`${basePath}/admin/cash-register`} className="rounded-lg bg-yellow-400 px-5 py-2.5 text-sm font-bold text-black hover:bg-yellow-300">
          Abrir Caixa
        </Link>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0 overflow-hidden -mx-3 sm:-mx-4 lg:-mx-6 -mt-3 sm:-mt-4 lg:-mt-6">

      {/* ─── Left: Products panel ────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 border-r border-dark-700 bg-dark-950">
        {/* Search + title */}
        <div className="flex items-center gap-3 border-b border-dark-700 px-4 py-3">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Package size={18} className="text-yellow-400" />
            PDV / Balcao
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-lg bg-dark-800 border border-dark-700 px-3 py-2 ml-2">
            <Search size={15} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar produto..."
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && <button onClick={() => setSearch('')}><X size={13} className="text-gray-400" /></button>}
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 overflow-x-auto border-b border-dark-700 px-4 py-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !selectedCategory ? 'bg-yellow-400 text-black' : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedCategory === cat.id ? 'bg-yellow-400 text-black' : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 content-start auto-rows-max">
          {visibleProducts.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center gap-2 py-16 text-gray-500">
              <Package size={32} />
              <span className="text-sm">Nenhum produto encontrado</span>
            </div>
          )}
          {visibleProducts.map((product) => {
            const inCart = cart.find((i) => i.product_id === product.id)
            const price = product.promotional_price_cents || product.price_cents
            return (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className={`relative flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all active:scale-95 hover:border-yellow-500/50 ${
                  inCart ? 'border-yellow-500/60 bg-yellow-500/10' : 'border-dark-700 bg-dark-900 hover:bg-dark-800'
                }`}
              >
                {product.image_url && (
                  <img src={product.image_url} alt={product.name} className="w-full h-24 object-cover rounded-lg mb-1" />
                )}
                {inCart && (
                  <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-black">
                    {inCart.quantity}
                  </span>
                )}
                <span className="text-xs font-medium text-white leading-snug line-clamp-2">{product.name}</span>
                <span className="text-sm font-bold text-yellow-300">{fmt(price)}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── Right: Cart + Payment panel ─────────────────────────────────── */}
      <div className="flex w-80 lg:w-96 shrink-0 flex-col bg-dark-900">

        {/* Cart header */}
        <div className="flex items-center justify-between border-b border-dark-700 px-4 py-3">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <ShoppingCart size={16} />
            Carrinho
            {cart.length > 0 && (
              <span className="rounded-full bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold text-black">{cart.length}</span>
            )}
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition-colors">
              <Trash2 size={12} /> Limpar
            </button>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-gray-500">
              <ShoppingCart size={28} />
              <span className="text-xs">Clique em um produto</span>
            </div>
          ) : (
            <div className="divide-y divide-dark-700">
              {cart.map((item) => (
                <div key={item.product_id} className="flex items-center gap-2 px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{item.name}</p>
                    <p className="text-[11px] text-gray-400">{fmt(item.unit_price_cents)} un.</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => changeQty(item.product_id, -1)} className="flex h-6 w-6 items-center justify-center rounded-md bg-dark-800 text-gray-300 hover:bg-dark-700">
                      <Minus size={10} />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-white">{item.quantity}</span>
                    <button onClick={() => changeQty(item.product_id, 1)} className="flex h-6 w-6 items-center justify-center rounded-md bg-dark-800 text-gray-300 hover:bg-dark-700">
                      <Plus size={10} />
                    </button>
                    <button onClick={() => removeItem(item.product_id)} className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-md text-gray-500 hover:text-red-400 hover:bg-dark-800">
                      <X size={10} />
                    </button>
                  </div>
                  <span className="w-14 text-right text-xs font-semibold text-white shrink-0">
                    {fmt(item.unit_price_cents * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer (optional) */}
        <div className="border-t border-dark-700 px-3 py-2">
          <button
            onClick={() => setShowCustomer((v) => !v)}
            className="flex w-full items-center gap-2 text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            <User size={12} />
            <span>Cliente (opcional)</span>
            <ChevronDown size={12} className={`ml-auto transition-transform ${showCustomer ? 'rotate-180' : ''}`} />
          </button>
          {showCustomer && (
            <input
              type="text"
              placeholder="Nome do cliente..."
              className="mt-2 w-full rounded-lg bg-dark-800 border border-dark-700 px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-yellow-500/50"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          )}
        </div>

        {/* Discount */}
        <div className="border-t border-dark-700 px-3 py-2">
          <div className="flex items-center gap-2 mb-1.5">
            <Tag size={12} className="text-gray-400" />
            <span className="text-xs text-gray-400">Desconto</span>
            <div className="ml-auto flex rounded-lg bg-dark-800 border border-dark-700 overflow-hidden">
              {['none', 'fixed', 'percent'].map((t) => (
                <button
                  key={t}
                  onClick={() => { setDiscountType(t); setDiscountValue('') }}
                  className={`px-2 py-1 text-[10px] font-medium transition-colors ${discountType === t ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:text-white'}`}
                >
                  {t === 'none' ? 'Nao' : t === 'fixed' ? 'R$' : '%'}
                </button>
              ))}
            </div>
          </div>
          {discountType !== 'none' && (
            <input
              type="number"
              min="0"
              step={discountType === 'percent' ? '1' : '0.01'}
              placeholder={discountType === 'fixed' ? 'Valor em R$...' : 'Percentual %...'}
              className="w-full rounded-lg bg-dark-800 border border-dark-700 px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-yellow-500/50"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
            />
          )}
        </div>

        {/* Totals */}
        <div className="border-t border-dark-700 px-4 py-2 space-y-1 bg-dark-950/40">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Subtotal</span><span>{fmt(subtotalCents)}</span>
          </div>
          {discountCents > 0 && (
            <div className="flex justify-between text-xs text-green-400">
              <span>Desconto</span><span>-{fmt(discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-white text-base">
            <span>Total</span><span className="text-yellow-300">{fmt(totalCents)}</span>
          </div>
        </div>

        {/* Payment method */}
        <div className="border-t border-dark-700 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">Forma de pagamento</p>
          <div className="grid grid-cols-3 gap-1.5">
            {['money', 'pix', 'card_on_delivery'].map((method) => {
              const Icon = PAYMENT_ICONS[method]
              return (
                <button
                  key={method}
                  onClick={() => { setPaymentMethod(method); setReceivedAmount('') }}
                  className={`flex flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-medium transition-colors ${
                    paymentMethod === method
                      ? 'bg-yellow-400 text-black'
                      : 'bg-dark-800 text-gray-300 hover:bg-dark-700 border border-dark-700'
                  }`}
                >
                  <Icon size={14} />
                  {PAYMENT_LABELS[method]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Money received + change */}
        {paymentMethod === 'money' && (
          <div className="border-t border-dark-700 px-3 py-2">
            <label className="text-[10px] uppercase tracking-wide text-gray-500 block mb-1.5">Valor recebido</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              className="w-full rounded-lg bg-dark-800 border border-dark-700 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-yellow-500/50"
              value={receivedAmount}
              onChange={(e) => setReceivedAmount(e.target.value)}
            />
            {receivedCents > 0 && receivedCents >= totalCents && (
              <div className="mt-1.5 flex justify-between text-xs font-bold text-yellow-300">
                <span>Troco</span>
                <span>{fmt(changeCents)}</span>
              </div>
            )}
            {receivedCents > 0 && receivedCents < totalCents && (
              <p className="mt-1 text-[11px] text-red-400 flex items-center gap-1">
                <AlertCircle size={11} /> Valor insuficiente
              </p>
            )}
          </div>
        )}

        {/* Finalize button */}
        <div className="border-t border-dark-700 p-3">
          <button
            disabled={!canFinalize || loading}
            onClick={handleFinalize}
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all ${
              canFinalize && !loading
                ? 'bg-yellow-400 text-black hover:bg-yellow-300 active:scale-[.98]'
                : 'bg-dark-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
            ) : (
              <CheckCircle size={16} />
            )}
            {loading ? 'Registrando...' : `Finalizar Venda — ${fmt(totalCents)}`}
          </button>
        </div>
      </div>

      {receipt && <ReceiptModal sale={receipt} onClose={() => setReceipt(null)} />}
    </div>
  )
}

function toCents(value) {
  return Math.round(Number(value || 0) * 100)
}
