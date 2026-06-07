import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'

const StoreSettingsForm = ({ settings, onChange, onSave, loading }) => {
  const statusOptions = [
    { value: 'open', label: 'Aberta' },
    { value: 'closed', label: 'Fechada' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Informações da Loja</h3>
        <div className="space-y-4">
          <Input 
            label="Nome da loja" 
            value={settings?.store_name || ''} 
            onChange={(e) => onChange({ ...settings, store_name: e.target.value })} 
          />
          <Input 
            label="Telefone WhatsApp" 
            value={settings?.whatsapp_number || ''} 
            onChange={(e) => onChange({ ...settings, whatsapp_number: e.target.value })} 
          />
          <Input 
            label="URL da Logo" 
            value={settings?.logo_url || ''} 
            onChange={(e) => onChange({ ...settings, logo_url: e.target.value })} 
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-white mb-4">Funcionamento</h3>
        <div className="space-y-4">
          <Select 
            label="Status da loja" 
            options={statusOptions} 
            value={settings?.store_status || 'open'} 
            onChange={(e) => onChange({ ...settings, store_status: e.target.value })} 
          />
          <Textarea 
            label="Mensagem de loja fechada" 
            value={settings?.closed_message || ''} 
            onChange={(e) => onChange({ ...settings, closed_message: e.target.value })} 
            rows={2} 
          />
          <Input 
            label="Tempo médio de entrega" 
            value={settings?.average_delivery_time || ''} 
            onChange={(e) => onChange({ ...settings, average_delivery_time: e.target.value })} 
          />
          <Input 
            label="Mínimo de pedidos para cliente recorrente" 
            type="number" 
            value={settings?.recurring_customer_min_orders || 3} 
            onChange={(e) => onChange({ ...settings, recurring_customer_min_orders: parseInt(e.target.value) })} 
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-white mb-4">Pagamento Pix</h3>
        <div className="space-y-4">
          <Input 
            label="Chave Pix" 
            value={settings?.pix_key || ''} 
            onChange={(e) => onChange({ ...settings, pix_key: e.target.value })} 
          />
          <Input 
            label="Nome do recebedor" 
            value={settings?.pix_receiver_name || ''} 
            onChange={(e) => onChange({ ...settings, pix_receiver_name: e.target.value })} 
          />
          <Input 
            label="URL do QR Code Pix" 
            value={settings?.pix_qr_code_url || ''} 
            onChange={(e) => onChange({ ...settings, pix_qr_code_url: e.target.value })} 
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-white mb-4">Regras de Entrega</h3>
        <div className="space-y-4">
          <Input 
            label="Taxa de entrega padrão" 
            type="number" 
            step="0.01" 
            value={settings?.delivery_fee_default || 0} 
            onChange={(e) => onChange({ ...settings, delivery_fee_default: parseFloat(e.target.value) })} 
          />
          <Input 
            label="Valor mínimo do pedido" 
            type="number" 
            step="0.01" 
            value={settings?.minimum_order_amount || 0} 
            onChange={(e) => onChange({ ...settings, minimum_order_amount: parseFloat(e.target.value) })} 
          />
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={settings?.allow_pickup} 
              onChange={(e) => onChange({ ...settings, allow_pickup: e.target.checked })} 
              className="rounded" 
            />
            <span className="text-white text-sm">Permitir retirada</span>
          </label>
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={settings?.block_outside_delivery_area} 
              onChange={(e) => onChange({ ...settings, block_outside_delivery_area: e.target.checked })} 
              className="rounded" 
            />
            <span className="text-white text-sm">Bloquear pedidos fora da área</span>
          </label>
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={settings?.block_orders_when_closed} 
              onChange={(e) => onChange({ ...settings, block_orders_when_closed: e.target.checked })} 
              className="rounded" 
            />
            <span className="text-white text-sm">Bloquear pedidos quando fechado</span>
          </label>
        </div>
      </div>

      <Button onClick={onSave} loading={loading} className="w-full">
        Salvar Configurações
      </Button>
    </div>
  )
}

export default StoreSettingsForm
