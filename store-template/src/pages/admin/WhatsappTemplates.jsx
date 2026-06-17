import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle, ChefHat, Copy, MessageSquare, Package, Plus, Save, ToggleLeft, ToggleRight, Truck } from 'lucide-react'
import { useWhatsappTemplates } from '../../hooks/useWhatsappTemplates'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Textarea } from '../../components/ui/Textarea'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { ORDER_STATUS_FLOW_UPDATED_EVENT } from '../../hooks/useStoreSettings'
import {
  WHATSAPP_TEMPLATE_TYPES,
  WHATSAPP_VARIABLES,
  buildMockTemplateContext,
  normalizeTemplate,
  renderWhatsappTemplate,
} from '../../utils/whatsappTemplates'
import { getStoreSettings, updateStoreSettings } from '../../services/settings'

const defaultStatusFlow = {
  accepted: true,
  preparing: false,
  ready: false,
  out_for_delivery: true,
  completed: true,
}

const normalizeStatusFlow = (flow = {}) => ({
  accepted: flow?.accepted !== false,
  preparing: Boolean(flow?.preparing),
  ready: Boolean(flow?.ready),
  out_for_delivery: flow?.out_for_delivery !== false,
  completed: flow?.completed !== false,
})

const statusFlowSteps = [
  {
    key: 'accepted',
    label: 'Pedido aceito',
    description: 'Mostra o botao Aceitar e usa o template Pedido aceito.',
    icon: CheckCircle,
  },
  {
    key: 'preparing',
    label: 'Em preparo',
    description: 'Mostra o botao Em Preparo e usa o template Pedido em preparo.',
    icon: ChefHat,
  },
  {
    key: 'ready',
    label: 'Pronto',
    description: 'Mostra o botao Pronto e usa o template Pedido pronto.',
    icon: Package,
  },
  {
    key: 'out_for_delivery',
    label: 'Saiu para entrega',
    description: 'Mostra o botao Saiu para entrega e usa o template Saiu para entrega.',
    icon: Truck,
  },
  {
    key: 'completed',
    label: 'Finalizado',
    description: 'Mostra o botao Finalizar e usa o template Pedido finalizado.',
    icon: CheckCircle,
  },
]

const emptyTemplate = {
  name: 'Novo template',
  type: 'custom',
  content: '',
  active: true,
}

const WhatsappTemplates = () => {
  const { templates, loading, saveTemplate, createTemplate } = useWhatsappTemplates()
  const [localTemplates, setLocalTemplates] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [storeSettings, setStoreSettings] = useState(null)
  const [statusFlow, setStatusFlow] = useState(defaultStatusFlow)
  const [savingFlow, setSavingFlow] = useState(false)

  useEffect(() => {
    const normalized = (templates || []).map(normalizeTemplate)
    setLocalTemplates(normalized)
    setSelectedId(prev => prev || normalized[0]?.id || null)
  }, [templates])

  useEffect(() => {
    getStoreSettings()
      .then(settings => {
        setStoreSettings(settings)
        setStatusFlow(normalizeStatusFlow(settings?.order_status_flow || defaultStatusFlow))
      })
      .catch(error => console.warn('Nao foi possivel carregar fluxo de pedidos:', error))
  }, [])

  const selectedTemplate = useMemo(() => (
    localTemplates.find(template => template.id === selectedId) || null
  ), [localTemplates, selectedId])

  const preview = useMemo(() => {
    if (!selectedTemplate) return ''
    return renderWhatsappTemplate(selectedTemplate.content, buildMockTemplateContext())
  }, [selectedTemplate])

  const updateSelected = (changes) => {
    if (!selectedTemplate) return
    setLocalTemplates(prev => prev.map(template => (
      template.id === selectedTemplate.id
        ? { ...template, ...changes }
        : template
    )))
  }

  const handleCreate = async () => {
    setCreating(true)
    const result = await createTemplate(emptyTemplate)
    setCreating(false)

    if (result.success) {
      const template = normalizeTemplate(result.template)
      setSelectedId(template.id)
    }
  }

  const handleSave = async () => {
    if (!selectedTemplate || saving) return

    setSaving(true)
    const result = await saveTemplate(selectedTemplate.id, {
      key: selectedTemplate.key || selectedTemplate.type,
      title: selectedTemplate.name,
      message: selectedTemplate.content,
      name: selectedTemplate.name,
      type: selectedTemplate.type,
      content: selectedTemplate.content,
      active: selectedTemplate.active,
    })
    setSaving(false)

    if (result.success) {
      const saved = normalizeTemplate(result.template)
      setLocalTemplates(prev => prev.map(template => (
        template.id === saved.id ? saved : template
      )))
    }
  }

  const handleSaveFlow = async () => {
    setSavingFlow(true)
    try {
      const updated = await updateStoreSettings({
        ...(storeSettings || {}),
        order_status_flow: statusFlow,
      })
      setStoreSettings(updated)
      setStatusFlow(normalizeStatusFlow(updated?.order_status_flow || statusFlow))
      window.dispatchEvent(new CustomEvent(ORDER_STATUS_FLOW_UPDATED_EVENT, {
        detail: { settings: updated },
      }))
      toast.success('Fluxo dos pedidos salvo')
    } catch (error) {
      console.error('Erro ao salvar fluxo dos pedidos:', error)
      toast.error('Nao foi possivel salvar o fluxo dos pedidos')
    } finally {
      setSavingFlow(false)
    }
  }

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Texto copiado')
    } catch (error) {
      console.error('Error copying text:', error)
      toast.error('Nao foi possivel copiar')
    }
  }

  if (loading) {
    return <div className="text-white">Carregando templates...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Templates WhatsApp</h1>
          <p className="text-gray-400 mt-1">
            Mensagens reutilizaveis com variaveis dinamicas enviadas pelo WhatsApp da loja.
          </p>
        </div>
        <Button onClick={handleCreate} loading={creating}>
          <Plus size={18} className="mr-2" />
          Novo template
        </Button>
      </div>

      <Card className="border-blue-900/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Truck size={20} className="text-white" />
            <h2 className="text-xl font-bold text-white">Fluxo de mensagens do pedido</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-400">
            Escolha quais etapas aparecem no painel e geram mensagem para o cliente. As etapas marcadas estao ativas hoje; se desmarcar e salvar, elas somem do fluxo normal do pedido.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {statusFlowSteps.map(step => {
              const Icon = step.icon

              return (
                <label key={step.key} className="flex items-start gap-3 rounded-lg border border-dark-600 bg-dark-900 p-4 text-sm text-gray-200">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={Boolean(statusFlow[step.key])}
                    onChange={(event) => setStatusFlow(prev => ({ ...prev, [step.key]: event.target.checked }))}
                  />
                  <span>
                    <span className="flex items-center gap-2 font-semibold text-white">
                      <Icon size={16} />
                      {step.label}
                    </span>
                    <span className="mt-1 block text-xs text-gray-400">{step.description}</span>
                  </span>
                </label>
              )
            })}
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveFlow} loading={savingFlow}>
              <Save size={18} className="mr-2" />
              Salvar fluxo
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare size={20} className="text-white" />
              <h2 className="text-xl font-bold text-white">Biblioteca</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {localTemplates.length === 0 && (
              <p className="text-gray-400 text-sm">Nenhum template cadastrado.</p>
            )}

            {localTemplates.map(template => (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedId(template.id)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedId === template.id
                    ? 'border-white bg-dark-700'
                    : 'border-dark-600 bg-dark-900 hover:bg-dark-700'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-white font-semibold">{template.name}</p>
                  <Badge variant={template.active ? 'success' : 'default'}>
                    {template.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <p className="text-gray-400 text-sm mt-1">{template.type}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        {selectedTemplate ? (
          <div className="grid grid-cols-1 2xl:grid-cols-[1fr_360px] gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-bold text-white">Editor</h2>
                  <Button
                    variant={selectedTemplate.active ? 'success' : 'secondary'}
                    size="sm"
                    onClick={() => updateSelected({ active: !selectedTemplate.active })}
                  >
                    {selectedTemplate.active ? (
                      <ToggleRight size={18} className="mr-2" />
                    ) : (
                      <ToggleLeft size={18} className="mr-2" />
                    )}
                    {selectedTemplate.active ? 'Ativo' : 'Inativo'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nome do template"
                    value={selectedTemplate.name}
                    onChange={(event) => updateSelected({ name: event.target.value })}
                  />
                  <Select
                    label="Tipo"
                    value={selectedTemplate.type}
                    onChange={(event) => updateSelected({ type: event.target.value })}
                    options={WHATSAPP_TEMPLATE_TYPES}
                  />
                </div>

                <Textarea
                  label="Mensagem"
                  value={selectedTemplate.content}
                  onChange={(event) => updateSelected({ content: event.target.value })}
                  rows={10}
                />

                <div className="flex flex-col gap-3 md:flex-row md:justify-end">
                  <Button variant="secondary" onClick={() => copyText(selectedTemplate.content)}>
                    <Copy size={18} className="mr-2" />
                    Copiar modelo
                  </Button>
                  <Button variant="outline" onClick={() => copyText(preview)}>
                    <Copy size={18} className="mr-2" />
                    Copiar teste
                  </Button>
                  <Button onClick={handleSave} loading={saving}>
                    <Save size={18} className="mr-2" />
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-bold text-white">Preview com dados de teste</h2>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm text-gray-200 bg-dark-900 rounded-lg p-4 border border-dark-600 min-h-48">
                    {preview || 'Digite uma mensagem para visualizar o resultado.'}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="text-lg font-bold text-white">Variaveis disponiveis</h2>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {WHATSAPP_VARIABLES.map(variable => (
                      <button
                        key={variable.key}
                        type="button"
                        onClick={() => copyText(`{${variable.key}}`)}
                        className="px-3 py-2 rounded-lg bg-dark-900 border border-dark-600 text-gray-200 text-sm hover:bg-dark-700"
                        title={variable.label}
                      >
                        {`{${variable.key}}`}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent>
              <p className="text-gray-400">Selecione ou crie um template.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default WhatsappTemplates
