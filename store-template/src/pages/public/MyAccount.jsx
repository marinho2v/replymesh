import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Gift, MapPin, Phone, RotateCw, Search, ShoppingCart, Ticket, User } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import {
  clearCustomerSession,
  getCustomerProfileByPhone,
  getSavedCustomerSession,
  normalizePhone,
  saveCustomerSession,
} from '../../services/customers'
import { formatCurrency } from '../../utils/currency'
import { formatDateTime } from '../../utils/formatDate'
import { getOrderStatusLabel } from '../../utils/orderStatus.jsx'
import { useCompanyBasePath, useCompanySlug } from '../../contexts/CompanySlugContext'

const MyAccount = () => {
  const companySlug = useCompanySlug()
  const basePath = useCompanyBasePath()
  const [phone, setPhone] = useState('')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadProfile = async (phoneToSearch) => {
    const normalized = normalizePhone(phoneToSearch)
    if (normalized.length < 10) {
      toast.error('Digite um telefone valido')
      return
    }

    setLoading(true)
    try {
      const data = await getCustomerProfileByPhone(normalized, companySlug)
      if (!data?.found) {
        setProfile(null)
        toast.error('Nenhum cadastro encontrado para esse telefone')
        return
      }

      setProfile(data)
      saveCustomerSession(data.customer, companySlug)
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel localizar o cadastro')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const saved = getSavedCustomerSession(companySlug)
    if (saved?.customer_phone) {
      setPhone(saved.customer_phone)
      loadProfile(saved.customer_phone)
    }
  }, [companySlug])

  const customer = profile?.customer
  const addresses = profile?.addresses || []
  const orders = profile?.orders || []
  const wheelSpins = profile?.wheel_spins || { available: 0, used: 0 }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Minha conta</h1>
          <p className="mt-2 text-gray-400">
            Localize seus pedidos pelo telefone usado no pedido.
          </p>
        </div>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Input
                label="Telefone"
                placeholder="(21) 99999-9999"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
              <Button className="self-end" onClick={() => loadProfile(phone)} loading={loading}>
                <Search size={18} className="mr-2" />
                Localizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {customer && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <User className="text-gray-400" size={22} />
                    <div>
                      <p className="text-sm text-gray-400">Cliente</p>
                      <p className="text-lg font-semibold text-white">{customer.name || customer.full_name}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <Phone className="text-gray-400" size={18} />
                    <p className="text-white">{customer.phone || customer.whatsapp}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="text-gray-400" size={22} />
                    <div>
                      <p className="text-sm text-gray-400">Pedidos</p>
                      <p className="text-2xl font-bold text-white">{customer.total_orders || 0}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-300">
                    Total gasto: {formatCurrency(customer.total_spent || 0)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <RotateCw className="text-gray-400" size={22} />
                    <div>
                      <p className="text-sm text-gray-400">Roleta</p>
                      <p className="text-2xl font-bold text-white">{wheelSpins.available || 0}</p>
                    </div>
                  </div>
                  <Link to={`${basePath}/roleta`} className="mt-4 inline-flex text-sm font-semibold text-white underline underline-offset-4">
                    Abrir roleta
                  </Link>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold text-white">Enderecos salvos</h2>
                </CardHeader>
                <CardContent className="space-y-3">
                  {addresses.length === 0 ? (
                    <p className="text-gray-400">Nenhum endereco salvo ainda.</p>
                  ) : addresses.map(address => (
                    <div key={address.id} className="rounded-lg border border-dark-600 bg-dark-900 p-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-1 text-gray-400" size={18} />
                        <div>
                          <p className="font-semibold text-white">
                            {address.street || 'Rua nao informada'}, {address.number || 's/n'}
                          </p>
                          <p className="text-sm text-gray-400">{address.neighborhood}</p>
                          {address.reference && <p className="mt-1 text-sm text-gray-300">Ref.: {address.reference}</p>}
                          {address.is_default && <Badge className="mt-2">Principal</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold text-white">Cupons e roleta</h2>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg border border-dark-600 bg-dark-900 p-4">
                    <div className="flex items-center gap-3">
                      <Ticket className="text-gray-400" size={20} />
                      <div>
                        <p className="font-semibold text-white">Cupons disponiveis</p>
                        <p className="text-sm text-gray-400">{profile?.coupons?.length || 0} cupons da roleta ativos.</p>
                      </div>
                    </div>
                    {profile?.coupons?.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {profile.coupons.map(coupon => (
                          <div key={coupon.id} className="rounded-lg bg-black/20 p-3">
                            <p className="font-bold text-white">{coupon.code}</p>
                            <p className="text-xs text-gray-400">{coupon.title || coupon.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg border border-dark-600 bg-dark-900 p-4">
                    <div className="flex items-center gap-3">
                      <Gift className="text-gray-400" size={20} />
                      <div>
                        <p className="font-semibold text-white">Giros da roleta</p>
                        <p className="text-sm text-gray-400">{wheelSpins.available || 0} giros disponiveis.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-white">Ultimos pedidos</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                {orders.length === 0 ? (
                  <p className="text-gray-400">Nenhum pedido encontrado.</p>
                ) : orders.map(order => (
                  <div key={order.id} className="flex items-center justify-between gap-4 rounded-lg border border-dark-600 bg-dark-900 p-4">
                    <div>
                      <p className="font-semibold text-white">{getOrderStatusLabel(order.status)}</p>
                      <p className="text-sm text-gray-400">{formatDateTime(order.created_at)}</p>
                    </div>
                    <p className="font-bold text-white">{formatCurrency(order.total || 0)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-3">
              <Link
                to={`${basePath}/menu`}
                className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 font-medium text-black transition-colors hover:bg-gray-200"
              >
                Fazer novo pedido
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  clearCustomerSession(companySlug)
                  setProfile(null)
                  setPhone('')
                }}
              >
                Sair deste perfil
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MyAccount
