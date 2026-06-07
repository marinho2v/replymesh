import { Textarea } from '../ui/Textarea'
import { Button } from '../ui/Button'
import { MessageSquare, Save } from 'lucide-react'

const WhatsappTemplateForm = ({ template, onChange, onSave, loading }) => {
  const placeholders = '{cliente}, {total}, {bairro}, {endereco}, {itens}, {taxa_entrega}, {forma_pagamento}, {cupom}, {desconto}, {subtotal}'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={20} className="text-gray-400" />
        <h3 className="text-lg font-bold text-white">{template.title}</h3>
        <span className="text-gray-400 text-sm">({template.key})</span>
      </div>

      <Textarea
        value={template.message}
        onChange={(e) => onChange({ ...template, message: e.target.value })}
        rows={6}
        placeholder="Digite a mensagem do template..."
      />

      <div className="p-3 bg-dark-900 rounded-lg">
        <p className="text-gray-400 text-xs mb-2">Placeholders disponíveis:</p>
        <p className="text-gray-300 text-sm">{placeholders}</p>
      </div>

      <Button onClick={onSave} loading={loading} className="w-full">
        <Save size={20} className="mr-2" />
        Salvar Template
      </Button>
    </div>
  )
}

export default WhatsappTemplateForm
