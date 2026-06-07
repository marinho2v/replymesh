import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  getCustomerAddresses,
  getCustomerById,
  getCustomerOrders,
  exportCustomersToCsv,
  updateCustomer,
} from '../../services/customers'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { ArrowLeft, Download, User, Phone, MapPin, ShoppingCart, DollarSign, Star, Calendar, Edit, Save, X } from 'lucide-react'
import { formatCurrency } from '../../utils/currency'
import { formatDateTime } from '../../utils/formatDate'
import { getOrderStatusLabel, getOrderStatusColor } from '../../utils/orderStatus.jsx'

const emptyEditData = {
  full_name: '',
  phone: '',
  whatsapp: '',
  email: '',
  notes: '',
}

const CustomerDetails = () => {
  const { customerId } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [orders, setOrders] = useState([])
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState(emptyEditData)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customerData, ordersData, addressesData] = await Promise.all([
          getCustomerById(customerId),
          getCustomerOrders(customerId),
          getCustomerAddresses(customerId),
        ])

        setCustomer(customerData)
        setEditData({
          full_name: customerData.full_name || '',
          phone: customerData.phone || '',
          whatsapp: customerData.whatsapp || '',
          email: customerData.email || '',
          notes: customerData.notes || '',
        })
        setOrders(ordersData)
        setAddresses(addressesData)
      } catch (error) {
        console.error('Error fetching customer data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (customerId) fetchData()
  }, [customerId])

  const handleExport = () => {
    exportCustomersToCsv([customer])
  }

  const handleCancelEdit = () => {
    setEditData({
      full_name: customer.full_name || '',
      phone: customer.phone || '',
      whatsapp: customer.whatsapp || '',
      email: customer.email || '',
      notes: customer.notes || '',
    })
    setEditing(false)
  }

  const handleSaveCustomer = async () => {
    setSaving(true)
    try {
      const updated = await updateCustomer(customerId, editData)
      setCustomer({ ...customer, ...updated })
      setEditing(false)
      toast.success('Cliente atualizado')
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel atualizar o cliente')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-white">Carregando...</div>
  if (!customer) return <div className="text-white">Cliente nao encontrado</div>

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin/customers')}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-3xl font-bold text-white">{customer.full_name}</h1>
        {customer.is_recurring && (
          <Badge variant="primary">
            <Star size={12} className="mr-1" />
            Recorrente
          </Badge>
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-xl font-bold text-white">Informacoes</h2>
            {editing ? (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={handleCancelEdit} disabled={saving}>
                  <X size={16} />
                </Button>
                <Button size="sm" onClick={handleSaveCustomer} disabled={saving}>
                  <Save size={16} />
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                <Edit size={16} />
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <div className="space-y-3">
                <Input value={editData.full_name} onChange={(event) => setEditData({ ...editData, full_name: event.target.value })} placeholder="Nome" />
                <Input value={editData.phone} onChange={(event) => setEditData({ ...editData, phone: event.target.value })} placeholder="Telefone" />
                <Input value={editData.whatsapp} onChange={(event) => setEditData({ ...editData, whatsapp: event.target.value })} placeholder="WhatsApp" />
                <Input value={editData.email} onChange={(event) => setEditData({ ...editData, email: event.target.value })} placeholder="Email" />
                <Textarea value={editData.notes} onChange={(event) => setEditData({ ...editData, notes: event.target.value })} placeholder="Observacoes" rows={3} />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <User size={18} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Nome</p>
                    <p className="text-white">{customer.full_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Phone size={18} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Telefone</p>
                    <p className="text-white">{customer.phone}</p>
                  </div>
                </div>

                {customer.whatsapp && customer.whatsapp !== customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={18} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">WhatsApp</p>
                      <p className="text-white">{customer.whatsapp}</p>
                    </div>
                  </div>
                )}

                {customer.neighborhood && (
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Bairro</p>
                      <p className="text-white">{customer.neighborhood}</p>
                    </div>
                  </div>
                )}

                {customer.city && (
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Cidade</p>
                      <p className="text-white">{customer.city}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Estatisticas</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Total de Pedidos</p>
                <p className="text-xl font-bold text-white">{customer.total_orders}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Total Gasto</p>
                <p className="text-xl font-bold text-white">{formatCurrency(customer.total_spent)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Primeiro Pedido</p>
                <p className="text-white">{customer.first_order_at ? formatDateTime(customer.first_order_at) : '-'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Ultimo Pedido</p>
                <p className="text-white">{customer.last_order_at ? formatDateTime(customer.last_order_at) : '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Acoes</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleExport} className="w-full" variant="outline">
              <Download size={20} className="mr-2" />
              Exportar Dados
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-bold text-white">Enderecos salvos</h2>
        </CardHeader>
        <CardContent>
          {addresses.length === 0 ? (
            <p className="text-gray-400">Nenhum endereco salvo.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {addresses.map(address => (
                <div key={address.id} className="rounded-lg border border-dark-600 bg-dark-900 p-4">
                  <p className="font-semibold text-white">
                    {address.street || 'Rua nao informada'}, {address.number || 's/n'}
                  </p>
                  <p className="text-sm text-gray-400">{address.neighborhood || '-'}</p>
                  {address.reference && <p className="mt-1 text-sm text-gray-300">Ref.: {address.reference}</p>}
                  {address.is_default && <Badge className="mt-2">Principal</Badge>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-white">Historico de Pedidos</h2>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="py-8 text-center text-gray-400">Nenhum pedido encontrado</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="flex items-start justify-between rounded-lg bg-dark-900 p-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="font-semibold text-white">Pedido #{order.order_number}</span>
                      <Badge className={getOrderStatusColor(order.status)}>
                        {getOrderStatusLabel(order.status)}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-400">{formatDateTime(order.created_at)}</p>

                    <div className="mt-2 space-y-1">
                      {order.order_items?.map((item, index) => (
                        <p key={index} className="text-sm text-gray-300">
                          {item.quantity}x {item.product_name}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold text-white">{formatCurrency(order.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default CustomerDetails
