import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle, Minus, Plus, ReceiptText, Search, Utensils } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Badge } from '../../components/ui/Badge'
import { COMPANY_SLUG } from '../../services/replymeshApi'
import { createQrTableOrder, getQrTableContext, getQrTableOrders, openQrTableSession } from '../../services/tableQr'
import { getPublicMenu } from '../../services/publicApi'
import { useCompanySlug } from '../../contexts/CompanySlugContext'
import { formatCurrency } from '../../utils/currency'

const POLL_INTERVAL_MS = 5000

const isPublicCategory = (category) => {
  const value = String(category?.slug || category?.name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  return !['adicionais', 'adicional', 'extras'].includes(value)
}

const getStorageKeys = (qrToken) => ({
  session: `table_session_token:${qrToken}`,
  orders: `last_order_ids:${qrToken}`,
  customer: `table_customer_name:${qrToken}`,
})

const getClientStatus = (status) => {
  if (status === 'preparing') {
    return { label: 'Em preparo', className: 'border-orange-600 bg-orange-950/30 text-orange-100' }
  }

  if (['ready', 'completed'].includes(status)) {
    return { label: 'Pedido pronto', className: 'border-green-600 bg-green-950/30 text-green-100' }
  }

  return { label: 'Pedido recebido', className: 'border-yellow-600 bg-yellow-950/30 text-yellow-100' }
}

const normalizeCartItem = (product) => {
  const price = Number(product.promotional_price || product.price || 0)
  return {
    product_id: product.is_local ? null : product.id,
    product_key: product.local_id || product.id,
    product_name: product.name,
    unit_price: price,
    quantity: 1,
    total_price: price,
    notes: '',
  }
}

const TableQrMenu = () => {
  const { companySlug, qrToken } = useParams()
  const contextCompanySlug = useCompanySlug()
  const pathCompanySlug = window.location.pathname.match(/^\/loja\/([^/]+)/)?.[1]
  const resolvedCompanySlug = companySlug || contextCompanySlug || pathCompanySlug || COMPANY_SLUG
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(true)
  const [loadingContext, setLoadingContext] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [context, setContext] = useState(null)
  const [customerName, setCustomerName] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState([])
  const [orderNotes, setOrderNotes] = useState('')
  const [sentOrder, setSentOrder] = useState(null)
  const [showComanda, setShowComanda] = useState(false)
  const [sessionOrders, setSessionOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const storageKeys = useMemo(() => getStorageKeys(qrToken), [qrToken])

  useEffect(() => {
    let active = true

    const loadContext = async () => {
      try {
        setLoadingContext(true)
        const data = await getQrTableContext(qrToken, resolvedCompanySlug)
        if (!active) return
        setContext(data)
        const storedName = localStorage.getItem(storageKeys.customer) || ''
        setCustomerName(data?.session?.customer_name || storedName)
      } catch (error) {
        console.error('Error loading QR table context:', error)
        if (active) setContext({ success: false })
      } finally {
        if (active) setLoadingContext(false)
      }
    }

    loadContext()

    return () => {
      active = false
    }
  }, [qrToken, resolvedCompanySlug, storageKeys.customer])

  useEffect(() => {
    let active = true

    const loadMenu = async () => {
      try {
        setCategoriesLoading(true)
        setProductsLoading(true)
        const data = await getPublicMenu(resolvedCompanySlug)
        if (!active) return
        setCategories(data.categories || [])
        setProducts(data.products || [])
      } catch (error) {
        console.error('Error loading table QR menu:', error)
        if (active) toast.error('Nao foi possivel carregar o cardapio')
      } finally {
        if (active) {
          setCategoriesLoading(false)
          setProductsLoading(false)
        }
      }
    }

    loadMenu()
    return () => { active = false }
  }, [resolvedCompanySlug])

  const table = context?.table
  const session = context?.session
  const hasOpenSession = Boolean(session?.id)
  const canOrder = Boolean(session?.id && session?.customer_name)
  const visibleCategories = useMemo(() => (categories || []).filter(isPublicCategory), [categories])

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return (products || []).filter(product => {
      const matchesCategory = selectedCategoryId === 'all' || product.category_id === selectedCategoryId
      const matchesSearch = !term || product.name?.toLowerCase().includes(term) || product.description?.toLowerCase().includes(term)
      return matchesCategory && matchesSearch
    })
  }, [products, searchTerm, selectedCategoryId])

  const subtotal = cart.reduce((sum, item) => sum + Number(item.total_price || 0), 0)

  const loadSessionOrders = async (sessionId, { silent = false } = {}) => {
    if (!sessionId) return

    try {
      if (!silent) setLoadingOrders(true)
      const data = await getQrTableOrders(sessionId, { qrToken, companySlug: resolvedCompanySlug })

      if (data?.success === false) {
        setSessionOrders([])
        localStorage.removeItem(storageKeys.session)
        localStorage.removeItem(storageKeys.orders)
        return
      }

      const nextOrders = data?.orders || []
      setSessionOrders(nextOrders)
      if (nextOrders.length > 0) {
        setShowComanda(true)
      }
      localStorage.setItem(storageKeys.session, sessionId)
      localStorage.setItem(storageKeys.orders, JSON.stringify(nextOrders.map(order => order.id)))

      if (data?.session) {
        setContext(prev => prev ? { ...prev, session: data.session } : prev)
      }
    } catch (error) {
      console.error('Error loading QR table orders:', error)
      if (!silent) toast.error('Nao foi possivel carregar seus pedidos')
    } finally {
      if (!silent) setLoadingOrders(false)
    }
  }

  useEffect(() => {
    if (!session?.id) return undefined

    loadSessionOrders(session.id)
    const pollId = window.setInterval(() => {
      loadSessionOrders(session.id, { silent: true })
    }, POLL_INTERVAL_MS)

    return () => window.clearInterval(pollId)
  }, [session?.id])

  const startSession = async (event) => {
    event.preventDefault()
    const name = customerName.trim()
    if (!name) {
      toast.error('Informe seu nome para iniciar a comanda')
      return
    }

    try {
      setSubmitting(true)
      const data = await openQrTableSession({ qrToken, customerName: name, companySlug: resolvedCompanySlug })
      setContext(data)
      setCustomerName(data?.session?.customer_name || name)
      localStorage.setItem(storageKeys.customer, data?.session?.customer_name || name)
      if (data?.session?.id) {
        localStorage.setItem(storageKeys.session, data.session.id)
        await loadSessionOrders(data.session.id, { silent: true })
      }
      toast.success('Comanda aberta')
    } catch (error) {
      console.error('Error opening QR table session:', error)
      toast.error(error.message || 'Nao foi possivel abrir a comanda')
    } finally {
      setSubmitting(false)
    }
  }

  const addProduct = (product) => {
    setSentOrder(null)
    setCart(prev => {
      const productKey = product.local_id || product.id
      const existing = prev.find(item => (item.product_key || item.product_id) === productKey && !item.notes)
      if (!existing) return [...prev, normalizeCartItem(product)]

      return prev.map(item => {
        if (item !== existing) return item
        const quantity = item.quantity + 1
        return { ...item, quantity, total_price: item.unit_price * quantity }
      })
    })
    toast.success(`${product.name} adicionado`)
  }

  const updateQuantity = (index, quantity) => {
    setCart(prev => prev.flatMap((item, itemIndex) => {
      if (itemIndex !== index) return [item]
      const nextQuantity = Number(quantity || 0)
      if (nextQuantity <= 0) return []
      return [{ ...item, quantity: nextQuantity, total_price: item.unit_price * nextQuantity }]
    }))
  }

  const updateNotes = (index, notes) => {
    setCart(prev => prev.map((item, itemIndex) => (
      itemIndex === index ? { ...item, notes } : item
    )))
  }

  const submitOrder = async () => {
    if (!session?.id) return
    if (cart.length === 0) {
      toast.error('Adicione pelo menos um item')
      return
    }

    try {
      setSubmitting(true)
      const data = await createQrTableOrder({ qrToken, sessionId: session.id, items: cart, notes: orderNotes, companySlug: resolvedCompanySlug })
      setSentOrder(data?.order)
      if (data?.order) {
        const nextOrderIds = [data.order.id, ...sessionOrders.map(order => order.id)]
        localStorage.setItem(storageKeys.orders, JSON.stringify([...new Set(nextOrderIds)]))
      }
      setCart([])
      setOrderNotes('')
      setContext(prev => ({ ...prev, session: data?.session || prev?.session }))
      await loadSessionOrders(session.id, { silent: true })
      setShowComanda(true)
      toast.success('Pedido enviado para a cozinha')
    } catch (error) {
      console.error('Error creating QR table order:', error)
      toast.error(error.message || 'Nao foi possivel enviar o pedido')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingContext) {
    return (
      <div className="min-h-screen bg-dark-950 px-4 py-10 text-center text-white">
        Carregando mesa...
      </div>
    )
  }

  if (!context?.success) {
    return (
      <div className="min-h-screen bg-dark-950 px-4 py-10">
        <div className="mx-auto max-w-md rounded-xl border border-dark-700 bg-dark-900 p-6 text-center">
          <Utensils className="mx-auto mb-4 text-gray-400" size={36} />
          <h1 className="text-2xl font-bold text-white">Mesa indisponivel</h1>
          <p className="mt-2 text-gray-300">Esta mesa nao esta disponivel. Chame um atendente.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <header className="sticky top-0 z-20 border-b border-dark-700 bg-dark-950/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-400">Cardapio da mesa</p>
            <h1 className="text-2xl font-bold text-white">{table?.name || 'Mesa'}</h1>
          </div>
          <Badge variant="primary">QR Code</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {!canOrder ? (
          <form onSubmit={startSession} className="mx-auto max-w-md rounded-xl border border-dark-700 bg-dark-900 p-5">
            <h2 className="text-xl font-bold text-white">{hasOpenSession ? 'Identificar comanda' : 'Comecar pedido'}</h2>
            <p className="mt-1 text-sm text-gray-400">Informe apenas seu nome para usar a comanda desta mesa.</p>
            <Input
              label="Seu nome"
              value={customerName}
              onChange={event => setCustomerName(event.target.value)}
              className="mt-4"
              required
            />
            <Button type="submit" loading={submitting} className="mt-4 w-full min-h-12">
              Comecar pedido
            </Button>
          </form>
        ) : (
          <>
            {sentOrder && cart.length === 0 && (
              <section className="rounded-xl border border-green-700 bg-green-950/30 p-5 text-center">
                <CheckCircle className="mx-auto mb-3 text-green-300" size={42} />
                <h2 className="text-2xl font-bold text-white">Pedido enviado para a cozinha</h2>
                <p className="mt-2 text-gray-200">Em breve seu pedido sera servido.</p>
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button type="button" onClick={() => setSentOrder(null)} className="min-h-12">
                    Fazer novo pedido
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setShowComanda(prev => !prev)} className="min-h-12">
                    <ReceiptText size={18} className="mr-2" />
                    Ver meus pedidos
                  </Button>
                </div>
              </section>
            )}

            {showComanda && (
              <section className="rounded-xl border border-dark-700 bg-dark-900 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-white">Meus pedidos</h2>
                  {loadingOrders && <span className="text-xs text-gray-400">Atualizando...</span>}
                </div>
                {sessionOrders.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-400">Nenhum pedido enviado ainda.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {sessionOrders.map(order => {
                      const status = getClientStatus(order.status)
                      return (
                      <div key={order.id} className="rounded-lg border border-dark-700 bg-dark-950 p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-white">Pedido enviado</span>
                          <span className="text-white">{formatCurrency(order.total || 0)}</span>
                        </div>
                        <div className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${status.className}`}>
                          {status.label}
                        </div>
                        {order.order_items?.length > 0 && (
                          <div className="mt-3 space-y-1 text-gray-300">
                            {order.order_items.map(item => (
                              <p key={item.id}>
                                <span className="text-white">{item.quantity}x</span> {item.product_name}
                                {item.notes ? <span className="text-gray-500"> - {item.notes}</span> : null}
                              </p>
                            ))}
                          </div>
                        )}
                        {order.notes && (
                          <p className="mt-2 rounded-lg bg-dark-900 p-2 text-xs text-gray-400">Obs: {order.notes}</p>
                        )}
                      </div>
                    )})}
                  </div>
                )}
              </section>
            )}

            <section className="rounded-xl border border-dark-700 bg-dark-900 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-400">Comanda aberta para</p>
                  <h2 className="text-xl font-bold text-white">{session.customer_name || customerName || 'Cliente da mesa'}</h2>
                </div>
                {sentOrder && (
                  <div className="flex items-center gap-2 rounded-lg border border-green-700 bg-green-950/30 px-3 py-2 text-sm text-green-200">
                    <CheckCircle size={18} />
                    Pedido enviado para a cozinha
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId('all')}
                  className={`min-h-11 shrink-0 rounded-lg border px-4 text-sm font-medium ${
                    selectedCategoryId === 'all'
                      ? 'border-white bg-white text-dark-950'
                      : 'border-dark-600 bg-dark-900 text-gray-300'
                  }`}
                >
                  Todos
                </button>
                {!categoriesLoading && visibleCategories?.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={`min-h-11 shrink-0 rounded-lg border px-4 text-sm font-medium ${
                      selectedCategoryId === category.id
                        ? 'border-white bg-white text-dark-950'
                        : 'border-dark-600 bg-dark-900 text-gray-300'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <Input
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder="Buscar produto..."
                  className="pl-10"
                />
              </div>
            </section>

            {productsLoading ? (
              <div className="py-10 text-center text-gray-400">Carregando cardapio...</div>
            ) : (
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map(product => (
                  <article key={product.id} className="overflow-hidden rounded-xl border border-dark-700 bg-dark-900">
                    {product.image_url && (
                      <img src={product.image_url} alt={product.name} className="h-44 w-full object-cover" />
                    )}
                    <div className="space-y-3 p-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">{product.name}</h3>
                        {product.description && <p className="mt-1 line-clamp-2 text-sm text-gray-400">{product.description}</p>}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xl font-bold text-white">{formatCurrency(product.promotional_price || product.price)}</span>
                        <Button type="button" onClick={() => addProduct(product)} className="min-h-11">
                          <Plus size={18} className="mr-1" />
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </>
        )}
      </main>

      {canOrder && cart.length > 0 && (
        <aside className="sticky bottom-0 z-30 border-t border-dark-700 bg-dark-900/98 p-3 shadow-2xl backdrop-blur">
          <div className="mx-auto grid max-w-6xl gap-3 lg:grid-cols-[1fr_320px]">
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {cart.map((item, index) => (
                <div key={`${item.product_id}-${index}`} className="rounded-lg border border-dark-700 bg-dark-950 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{item.product_name}</p>
                      <p className="text-sm text-gray-400">{formatCurrency(item.unit_price)} cada</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => updateQuantity(index, item.quantity - 1)} className="grid h-9 w-9 place-items-center rounded-lg bg-dark-800 text-white">
                        <Minus size={16} />
                      </button>
                      <span className="min-w-8 text-center font-bold text-white">{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(index, item.quantity + 1)} className="grid h-9 w-9 place-items-center rounded-lg bg-dark-800 text-white">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  <Input
                    value={item.notes || ''}
                    onChange={event => updateNotes(index, event.target.value)}
                    placeholder="Observacao deste item"
                    className="mt-2"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Textarea
                rows={2}
                value={orderNotes}
                onChange={event => setOrderNotes(event.target.value)}
                placeholder="Observacao do pedido"
              />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-400">Total deste envio</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(subtotal)}</p>
                </div>
                <Button onClick={submitOrder} loading={submitting} disabled={cart.length === 0} className="min-h-12">
                  Enviar para cozinha
                </Button>
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}

export default TableQrMenu
