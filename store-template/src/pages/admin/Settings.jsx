import { useEffect, useMemo, useState } from 'react'
import { useSettings } from '../../hooks/useSettings'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { PIX_KEY_TYPE_LABELS } from '../../utils/pix'
import { getEffectiveStoreStatus, normalizeTime } from '../../utils/storeSchedule'
import {
  Check,
  ChevronDown,
  Clock,
  CreditCard,
  ExternalLink,
  Image,
  MessageCircle,
  Palette,
  Printer,
  Settings as SettingsIcon,
  Store,
  Truck,
} from 'lucide-react'
import { DEFAULT_TEMPLATE_ID, getAllTemplates, getTemplateById, getTemplateCategories } from '../../templates'
import CloudImageUploader from '../../components/media/CloudImageUploader'

const TEMPLATE_CATEGORY_LABELS = {
  hamburgueria: 'Hamburgueria',
  pizzaria: 'Pizzaria',
  doceria: 'Doceria',
  bebidas: 'Bebidas',
  acai: 'Acai',
  restaurante: 'Restaurante',
}

const STATUS_LABELS = {
  active: null,
  preview: 'Preview',
  coming_soon: 'Em breve',
}

const TemplatePreviewCard = ({ template, isCurrent, onSelect }) => {
  const isComingSoon = template.status === 'coming_soon'
  const accentColor = template.previewAccentColor || '#FFFFFF'
  const bgDark = template.colors?.background || '#0A0A0A'
  const bgSurface = template.colors?.card || '#1A1A1A'
  const isDarkTemplate = template.features?.darkMode !== false

  return (
    <div
      className={`relative rounded-xl border-2 overflow-hidden transition-all ${
        isComingSoon
          ? 'opacity-60 cursor-not-allowed border-dark-700'
          : isCurrent
          ? 'border-white shadow-lg shadow-white/10 cursor-pointer'
          : 'border-dark-600 hover:border-dark-400 cursor-pointer'
      }`}
      onClick={() => !isComingSoon && onSelect(template.id)}
    >
      {/* Preview visual gerado por CSS */}
      <div
        className="relative aspect-[16/9] flex flex-col overflow-hidden"
        style={{ backgroundColor: bgDark }}
      >
        {/* header simulado */}
        <div className="flex items-center justify-between px-3 py-2" style={{ backgroundColor: bgSurface }}>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: accentColor, opacity: 0.9 }} />
            <div className="h-2 w-16 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.5 }} />
          </div>
          <div className="flex gap-1.5">
            <div className="h-1.5 w-6 rounded-full bg-white/20" />
            <div className="h-1.5 w-6 rounded-full bg-white/20" />
            <div className="h-1.5 w-6 rounded-full bg-white/20" />
          </div>
        </div>
        {/* hero */}
        <div className="relative flex-1 flex items-center px-3 py-2" style={{ background: `linear-gradient(135deg, ${bgDark} 40%, ${accentColor}22 100%)` }}>
          <div className="space-y-1.5 flex-1">
            <div className="h-2 w-20 rounded-full" style={{ backgroundColor: accentColor }} />
            <div className="h-1.5 w-14 rounded-full bg-white/20" />
            <div className="mt-2 h-4 w-12 rounded-md" style={{ backgroundColor: accentColor, opacity: 0.9 }} />
          </div>
          <div className="h-12 w-12 rounded-lg opacity-30" style={{ backgroundColor: accentColor }} />
        </div>
        {/* produto cards */}
        <div className="flex gap-1.5 px-3 pb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 rounded-md overflow-hidden" style={{ backgroundColor: bgSurface }}>
              <div className="h-5 w-full opacity-20" style={{ backgroundColor: accentColor }} />
              <div className="p-1 space-y-0.5">
                <div className="h-1.5 w-full rounded-full bg-white/20" />
                <div className="h-1.5 w-2/3 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.5 }} />
              </div>
            </div>
          ))}
        </div>

        {/* badges */}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
          {isCurrent && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md">
              <Check size={11} className="text-black" />
            </div>
          )}
          {template.status && STATUS_LABELS[template.status] && (
            <span className="rounded-full bg-dark-900/80 px-1.5 py-0.5 text-[9px] font-medium text-gray-300 border border-dark-600">
              {STATUS_LABELS[template.status]}
            </span>
          )}
        </div>
      </div>

      {/* info */}
      <div className="p-3 bg-dark-800">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{template.name}</p>
            <p className="text-xs text-gray-400">{TEMPLATE_CATEGORY_LABELS[template.category] || template.category}</p>
          </div>
          {isCurrent && (
            <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium text-black" style={{ backgroundColor: accentColor }}>
              Atual
            </span>
          )}
        </div>
        <p className="mt-1.5 text-xs text-gray-500 line-clamp-2">{template.description}</p>
        {!isCurrent && !isComingSoon && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSelect(template.id) }}
            className="mt-2 w-full rounded-lg border border-dark-500 bg-dark-900 px-3 py-1.5 text-xs font-medium text-gray-200 hover:border-white hover:text-white transition-colors"
          >
            Usar este template
          </button>
        )}
        {isComingSoon && (
          <div className="mt-2 w-full rounded-lg border border-dark-700 bg-dark-900/50 px-3 py-1.5 text-center text-xs text-gray-500">
            Em breve
          </div>
        )}
      </div>
    </div>
  )
}

const TemplateSelectorSection = ({ currentTemplateId, onSelect, openSection, setOpenSection }) => {
  const [activeCategory, setActiveCategory] = useState('all')
  const allTemplates = getAllTemplates()
  const categories = getTemplateCategories()

  const visibleTemplates = activeCategory === 'all'
    ? allTemplates
    : allTemplates.filter((t) => t.category === activeCategory)

  const currentTemplate = allTemplates.find((t) => t.id === currentTemplateId) || getTemplateById(currentTemplateId)

  return (
    <SettingsSection
      id="template"
      icon={Palette}
      title="Template da loja"
      description={`Visual da loja publica. Atual: ${currentTemplate?.name || 'Hamburgueria Premium'}`}
      openSection={openSection}
      setOpenSection={setOpenSection}
    >
      <div className="rounded-xl border border-dark-600 bg-dark-900/60 p-3 text-sm text-gray-300">
        <p className="text-xs text-gray-400">
          Cada template e um visual completo da loja publica. Nao afeta pedidos, pagamentos, WhatsApp nem o painel admin.
          Apenas templates ativos aparecem para novas escolhas.
        </p>
      </div>

      {/* Filtro por categoria */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const count = cat.id === 'all'
            ? allTemplates.length
            : allTemplates.filter((t) => t.category === cat.id).length
          if (count === 0 && cat.id !== 'all') return null
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-white text-black'
                  : 'bg-dark-800 text-gray-300 hover:bg-dark-700 border border-dark-600'
              }`}
            >
              {cat.label}
              {cat.id !== 'all' && count > 0 && (
                <span className={`ml-1.5 rounded-full px-1 text-[10px] ${activeCategory === cat.id ? 'bg-black/20 text-black' : 'bg-dark-600 text-gray-400'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <p className="text-xs text-gray-500">
        {visibleTemplates.length} template{visibleTemplates.length !== 1 ? 's' : ''} encontrado{visibleTemplates.length !== 1 ? 's' : ''}
        {activeCategory !== 'all' && ` em ${categories.find((c) => c.id === activeCategory)?.label}`}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleTemplates.map((template) => (
          <TemplatePreviewCard
            key={template.id}
            template={template}
            isCurrent={currentTemplateId === template.id}
            onSelect={onSelect}
          />
        ))}
        {visibleTemplates.length === 0 && (
          <div className="col-span-3 rounded-xl border border-dashed border-dark-600 py-8 text-center text-sm text-gray-500">
            Nenhum template nesta categoria ainda.
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Apos selecionar um template, clique em <strong className="text-gray-300">"Salvar configuracoes"</strong> para aplicar.
      </p>
    </SettingsSection>
  )
}

const defaultSettings = {
  store_name: '',
  phone: '',
  whatsapp_number: '+55 21 97714-9837',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  logo_url: '',
  logo_storage_key: '',
  banner_url: '',
  banner_storage_key: '',
  cover_url: '',
  cover_storage_key: '',
  hero_title: '',
  hero_highlight: '',
  hero_subtitle: '',
  hero_image_url: '',
  hero_image_storage_key: '',
  hero_image_position: 'center',
  hero_image_zoom: 100,
  hero_overlay_opacity: 65,
  hero_height: 480,
  theme_primary_color: '#f7a325',
  store_status: 'open',
  closed_message: '',
  average_delivery_time: '',
  delivery_fee_default: 0,
  minimum_order_amount: 0,
  allow_pickup: true,
  block_outside_delivery_area: true,
  block_orders_when_closed: true,
  whatsapp_provider: 'evolution',
  whatsapp_auto_send_enabled: true,
  whatsapp_mode: 'automatic',
  pix_key: '',
  pix_key_type: '',
  pix_receiver_name: '',
  pix_receiver_city: '',
  pix_payload: '',
  pix_qr_code_url: '',
  print_footer: '',
  recurring_customer_min_orders: 2,
  app_cache_version: '1',
  app_cache_updated_at: '',
  visual_template_id: DEFAULT_TEMPLATE_ID,
  pix_provider: 'manual',
  mercadopago_public_key: '',
  mercadopago_access_token: '',
  mercadopago_enabled: false,
}

const daysOfWeek = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terca' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sabado' },
]

const createDefaultHours = () => daysOfWeek.map((day) => ({
  day_of_week: day.value,
  is_open: day.value !== 0,
  open_time: '08:00',
  close_time: '18:00',
  break_start: '',
  break_end: '',
  closed_message: '',
}))

const normalizeHours = (hours = []) => {
  const defaults = createDefaultHours()
  return defaults.map((day) => {
    const current = hours.find((hour) => Number(hour.day_of_week) === day.day_of_week)
    return current ? { ...day, ...current } : day
  })
}

const toNumberInput = (value) => (value === null || value === undefined ? '' : value)

const SettingsSection = ({ id, icon: Icon, title, description, openSection, setOpenSection, children }) => {
  const isOpen = openSection === id

  return (
    <Card>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
        onClick={() => setOpenSection(isOpen ? '' : id)}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-dark-900 text-white">
            <Icon size={20} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
          </div>
        </div>
        <ChevronDown
          size={20}
          className={`shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && <CardContent className="space-y-4 border-t border-dark-700 pt-5">{children}</CardContent>}
    </Card>
  )
}

const compactCheckboxClass = 'flex items-center gap-3 rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-gray-200'

const Settings = () => {
  const { settings, businessHours, loading, error, saveSettings, saveBusinessHours } = useSettings()
  const [localSettings, setLocalSettings] = useState(defaultSettings)
  const [localHours, setLocalHours] = useState(createDefaultHours)
  const [savingSettings, setSavingSettings] = useState(false)
  const [savingHours, setSavingHours] = useState(false)
  const [openSection, setOpenSection] = useState('general')
  const [lastError, setLastError] = useState('')
  const [lastSaved, setLastSaved] = useState('')

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        ...defaultSettings,
        ...settings,
        banner_url: settings.banner_url || settings.cover_url || '',
        cover_url: settings.cover_url || settings.banner_url || '',
        whatsapp_provider: 'evolution',
        whatsapp_auto_send_enabled: settings.whatsapp_mode !== 'manual',
        whatsapp_mode: settings.whatsapp_mode || 'automatic',
      })
    }
  }, [settings])

  useEffect(() => {
    setLocalHours(normalizeHours(businessHours))
  }, [businessHours])

  const pixKeyTypeOptions = useMemo(() => [
    { value: '', label: 'Selecione' },
    ...Object.entries(PIX_KEY_TYPE_LABELS).map(([value, label]) => ({ value, label })),
  ], [])

  const companySlug = localStorage.getItem('replymesh_store_company_slug') || ''
  const publicUrl = companySlug ? `${window.location.origin}/loja/${companySlug}` : window.location.origin
  const whatsappAdminUrl = companySlug ? `/loja/${companySlug}/admin/whatsapp` : '/admin/whatsapp'
  const effectiveWhatsappMode = ['automatic', 'manual', 'disabled'].includes(localSettings.whatsapp_mode)
    ? localSettings.whatsapp_mode
    : 'manual'
  const manualWhatsappMode = effectiveWhatsappMode === 'manual'
  const automaticWhatsappMode = effectiveWhatsappMode === 'automatic'
  const disabledWhatsappMode = effectiveWhatsappMode === 'disabled'
  const effectiveStatus = getEffectiveStoreStatus(localSettings, localHours)
  const effectiveStatusText = effectiveStatus.isOpen ? 'Loja aberta agora' : 'Loja fechada agora'
  const effectiveStatusHelper = effectiveStatus.isOpen && effectiveStatus.closesAt
    ? `Fecha automaticamente as ${normalizeTime(effectiveStatus.closesAt)}`
    : !effectiveStatus.isOpen && effectiveStatus.opensAt
      ? `Abre automaticamente as ${normalizeTime(effectiveStatus.opensAt)}`
      : 'Status calculado pelos horarios cadastrados.'

  const updateSetting = (field, value) => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }))
    setLastSaved('')
  }

  const updateHour = (dayOfWeek, field, value) => {
    setLocalHours((prev) => prev.map((hour) => (
      Number(hour.day_of_week) === Number(dayOfWeek)
        ? { ...hour, [field]: value }
        : hour
    )))
    setLastSaved('')
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    setLastError('')
    setLastSaved('')
    const settingsPayload = {
      ...localSettings,
    }
    delete settingsPayload.whatsapp_mode
    const result = await saveSettings(settingsPayload)
    setSavingSettings(false)
    if (!result.success) {
      setLastError(result.error || 'Nao foi possivel salvar as configuracoes.')
      return
    }
    setLastSaved('Configuracoes salvas com sucesso.')
  }

  const handleSaveHours = async () => {
    setSavingHours(true)
    setLastError('')
    setLastSaved('')
    const result = await saveBusinessHours(localHours)
    setSavingHours(false)
    if (!result.success) {
      setLastError(result.error || 'Nao foi possivel salvar os horarios.')
      return
    }
    setLastSaved('Horarios salvos com sucesso.')
  }

  if (loading) return <div className="text-white">Carregando configuracoes...</div>

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Configuracoes</h1>
          <p className="mt-1 text-sm text-gray-400">
            Ajustes principais da loja. Abra uma secao por vez e salve ao finalizar.
          </p>
        </div>
        <Button onClick={handleSaveSettings} loading={savingSettings}>
          <SettingsIcon size={18} className="mr-2" />
          Salvar configuracoes
        </Button>
      </div>

      {(error || lastError) && (
        <div className="rounded-lg border border-red-700 bg-red-900/30 p-4 text-sm text-red-200">
          {lastError || error}
        </div>
      )}

      {lastSaved && (
        <div className="rounded-lg border border-green-700 bg-green-900/30 p-4 text-sm text-green-100">
          {lastSaved}
        </div>
      )}

      <div className="space-y-3">
        <SettingsSection
          id="general"
          icon={Store}
          title="Geral"
          description="Nome, contato, endereco e status da loja."
          openSection={openSection}
          setOpenSection={setOpenSection}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Nome da loja"
              value={localSettings.store_name || ''}
              onChange={(e) => updateSetting('store_name', e.target.value)}
            />
            <Input
              label="Telefone"
              value={localSettings.phone || ''}
              onChange={(e) => updateSetting('phone', e.target.value)}
            />
          </div>
          <Input
            label="Endereco"
            value={localSettings.address || ''}
            onChange={(e) => updateSetting('address', e.target.value)}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              label="Cidade"
              value={localSettings.city || ''}
              onChange={(e) => updateSetting('city', e.target.value)}
            />
            <Input
              label="Estado"
              maxLength={2}
              value={localSettings.state || ''}
              onChange={(e) => updateSetting('state', e.target.value.toUpperCase())}
            />
            <Input
              label="CEP"
              value={localSettings.zip_code || ''}
              onChange={(e) => updateSetting('zip_code', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="URL publica da loja" value={publicUrl} readOnly />
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">Status automatico da loja</label>
              <div className={`rounded-lg border px-4 py-3 ${
                effectiveStatus.isOpen
                  ? 'border-green-700 bg-green-950/30'
                  : 'border-red-700 bg-red-950/30'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${effectiveStatus.isOpen ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="font-semibold text-white">{effectiveStatusText}</span>
                </div>
                <p className="mt-1 text-xs text-gray-300">{effectiveStatusHelper}</p>
              </div>
            </div>
          </div>
          <Textarea
            label="Mensagem quando estiver fechada"
            rows={2}
            value={localSettings.closed_message || ''}
            onChange={(e) => updateSetting('closed_message', e.target.value)}
          />
        </SettingsSection>

        <SettingsSection
          id="visual"
          icon={Image}
          title="Identidade visual"
          description="Logo e imagem de capa usadas nas telas da loja."
          openSection={openSection}
          setOpenSection={setOpenSection}
        >
          <div className="rounded-lg border border-yellow-700 bg-yellow-950/20 p-3 text-sm text-yellow-100">
            A logo aparece no cardapio, checkout, roleta, motoboy, login e impressao.
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CloudImageUploader
              label="Logo da loja"
              mediaType="logo"
              valueUrl={localSettings.logo_url || ''}
              storageKey={localSettings.logo_storage_key || ''}
              onError={setLastError}
              onChange={(media) => {
                updateSetting('logo_url', media.url)
                updateSetting('logo_storage_key', media.storageKey)
              }}
            />

            <CloudImageUploader
              label="Imagem de capa/banner"
              mediaType="banner"
              helper="Use uma imagem horizontal. O sistema otimiza automaticamente para a melhor exibicao."
              valueUrl={localSettings.banner_url || localSettings.cover_url || ''}
              storageKey={localSettings.banner_storage_key || localSettings.cover_storage_key || ''}
              onError={setLastError}
              onChange={(media) => {
                updateSetting('banner_url', media.url)
                updateSetting('cover_url', media.url)
                updateSetting('banner_storage_key', media.storageKey)
                updateSetting('cover_storage_key', media.storageKey)
              }}
            />
          </div>
          <div className="rounded-lg border border-dark-700 bg-dark-900 p-4">
            <div className="mb-3 text-sm font-semibold text-white">Texto principal da home</div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Input
                label="Titulo do hero"
                value={localSettings.hero_title || ''}
                placeholder="O MELHOR LANCHE"
                onChange={(e) => updateSetting('hero_title', e.target.value)}
              />
              <Input
                label="Destaque do hero"
                value={localSettings.hero_highlight || ''}
                placeholder="DA REGIAO!"
                onChange={(e) => updateSetting('hero_highlight', e.target.value)}
              />
            </div>
            <div className="mt-4">
              <Textarea
                label="Subtitulo do hero"
                rows={2}
                value={localSettings.hero_subtitle || ''}
                placeholder="Peca agora e receba no conforto da sua casa!"
                onChange={(e) => updateSetting('hero_subtitle', e.target.value)}
              />
            </div>
          </div>
          <div className="rounded-lg border border-dark-700 bg-dark-900 p-4">
            <div className="mb-3 text-sm font-semibold text-white">Ajustes do banner premium</div>
            <div className="mb-4 rounded-lg border border-blue-900/50 bg-blue-950/20 p-3 text-sm text-blue-100">
              Estes ajustes usam a imagem de capa/banner cadastrada acima. Para trocar a foto, altere a imagem de capa em Identidade visual.
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Select
                label="Posicao da imagem"
                value={localSettings.hero_image_position || 'center'}
                onChange={(e) => updateSetting('hero_image_position', e.target.value)}
                options={[
                  { value: 'center', label: 'Centro' },
                  { value: 'top', label: 'Topo' },
                  { value: 'bottom', label: 'Baixo' },
                  { value: 'left', label: 'Esquerda' },
                  { value: 'right', label: 'Direita' },
                ]}
              />
              <Input
                label="Zoom da imagem (%)"
                type="number"
                min="80"
                max="160"
                value={localSettings.hero_image_zoom || 100}
                onChange={(e) => updateSetting('hero_image_zoom', e.target.value)}
              />
              <Input
                label="Escurecimento (%)"
                type="number"
                min="0"
                max="90"
                value={localSettings.hero_overlay_opacity ?? 65}
                onChange={(e) => updateSetting('hero_overlay_opacity', e.target.value)}
              />
              <Input
                label="Altura do hero (px)"
                type="number"
                min="360"
                max="760"
                value={localSettings.hero_height || 480}
                onChange={(e) => updateSetting('hero_height', e.target.value)}
              />
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-200">Cor principal do template</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={localSettings.theme_primary_color || localSettings.primary_color || '#f7a325'}
                    onChange={(e) => {
                      updateSetting('theme_primary_color', e.target.value)
                      updateSetting('primary_color', e.target.value)
                    }}
                    className="h-11 w-16 rounded-lg border border-dark-600 bg-dark-800 p-1"
                  />
                  <Input
                    value={localSettings.theme_primary_color || localSettings.primary_color || '#f7a325'}
                    onChange={(e) => {
                      updateSetting('theme_primary_color', e.target.value)
                      updateSetting('primary_color', e.target.value)
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Formatos aceitos: PNG, JPG, WEBP ou SVG. Tamanho maximo: 1 MB. Sem logo, o sistema usa /logo.png.
          </p>
        </SettingsSection>

        <SettingsSection
          id="delivery"
          icon={Truck}
          title="Entrega"
          description="Taxas, minimo, retirada e regras basicas."
          openSection={openSection}
          setOpenSection={setOpenSection}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Taxa de entrega padrao"
              type="number"
              step="0.01"
              min="0"
              value={toNumberInput(localSettings.delivery_fee_default)}
              onChange={(e) => updateSetting('delivery_fee_default', e.target.value)}
            />
            <Input
              label="Pedido minimo"
              type="number"
              step="0.01"
              min="0"
              value={toNumberInput(localSettings.minimum_order_amount)}
              onChange={(e) => updateSetting('minimum_order_amount', e.target.value)}
            />
            <Input
              label="Tempo medio de preparo/entrega"
              value={localSettings.average_delivery_time || ''}
              onChange={(e) => updateSetting('average_delivery_time', e.target.value)}
            />
            <Input
              label="Minimo para cliente recorrente"
              type="number"
              min="1"
              value={toNumberInput(localSettings.recurring_customer_min_orders)}
              onChange={(e) => updateSetting('recurring_customer_min_orders', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className={compactCheckboxClass}>
              <input
                type="checkbox"
                checked={localSettings.allow_pickup !== false}
                onChange={(e) => updateSetting('allow_pickup', e.target.checked)}
              />
              Permitir retirada
            </label>
            <label className={compactCheckboxClass}>
              <input
                type="checkbox"
                checked={localSettings.block_outside_delivery_area !== false}
                onChange={(e) => updateSetting('block_outside_delivery_area', e.target.checked)}
              />
              Bloquear fora da area
            </label>
            <label className={compactCheckboxClass}>
              <input
                type="checkbox"
                checked={localSettings.block_orders_when_closed !== false}
                onChange={(e) => updateSetting('block_orders_when_closed', e.target.checked)}
              />
              Bloquear loja fechada
            </label>
          </div>
        </SettingsSection>

        <SettingsSection
          id="payments"
          icon={CreditCard}
          title="Pagamentos / PIX"
          description="Dados basicos de pagamento e PIX no checkout."
          openSection={openSection}
          setOpenSection={setOpenSection}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select
              label="Tipo da chave PIX"
              options={pixKeyTypeOptions}
              value={localSettings.pix_key_type || ''}
              onChange={(e) => updateSetting('pix_key_type', e.target.value)}
            />
            <Input
              label="Chave PIX"
              value={localSettings.pix_key || ''}
              onChange={(e) => updateSetting('pix_key', e.target.value)}
            />
            <Input
              label="Nome do recebedor"
              value={localSettings.pix_receiver_name || ''}
              onChange={(e) => updateSetting('pix_receiver_name', e.target.value)}
            />
            <Input
              label="Cidade do recebedor"
              value={localSettings.pix_receiver_city || ''}
              onChange={(e) => updateSetting('pix_receiver_city', e.target.value)}
            />
            <Input
              label="URL da imagem do QR Code"
              value={localSettings.pix_qr_code_url || ''}
              onChange={(e) => updateSetting('pix_qr_code_url', e.target.value)}
            />
          </div>
          <Textarea
            label="Payload PIX copia e cola"
            rows={2}
            value={localSettings.pix_payload || ''}
            onChange={(e) => updateSetting('pix_payload', e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Se preencher o payload, o checkout mostra o copia e cola. Se nao preencher, usa a chave PIX como fallback.
          </p>

          {/* â”€â”€ Mercado Pago â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="mt-2 rounded-xl border border-dark-600 bg-dark-900/60 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Mercado Pago - Pix automatico</p>
                <p className="text-xs text-gray-400 mt-0.5">Quando ativo, o Pix e processado automaticamente via API.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${localSettings.mercadopago_enabled ? 'bg-green-400' : 'bg-gray-600'}`} />
                <span className="text-xs text-gray-400">{localSettings.mercadopago_enabled ? 'Ativo' : 'Inativo'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Select
                  label="Modo Pix"
                  options={[
                    { value: 'manual', label: 'Manual - chave Pix acima' },
                    { value: 'mercadopago', label: 'Mercado Pago - automatico' },
                  ]}
                  value={localSettings.pix_provider || 'manual'}
                  onChange={(e) => updateSetting('pix_provider', e.target.value)}
                />
                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-2 text-sm text-gray-200">
                    <input
                      type="checkbox"
                      checked={Boolean(localSettings.mercadopago_enabled)}
                      onChange={(e) => updateSetting('mercadopago_enabled', e.target.checked)}
                      className="rounded"
                    />
                    Habilitar Mercado Pago
                  </label>
                </div>
              </div>

              {localSettings.pix_provider === 'mercadopago' && (
                <>
                  <Input
                    label="Public Key (comeca com APP_USR- ou TEST-)"
                    value={localSettings.mercadopago_public_key || ''}
                    onChange={(e) => updateSetting('mercadopago_public_key', e.target.value)}
                    placeholder="APP_USR-xxxxxxxx-xxxx-xxxx..."
                  />
                  <Input
                    label="Access Token (nao sera exibido apos salvar)"
                    type="password"
                    value={localSettings.mercadopago_access_token || ''}
                    onChange={(e) => updateSetting('mercadopago_access_token', e.target.value)}
                    placeholder="TEST-xxxxxxxxxxxxxxxx... ou APP_USR-..."
                  />
                </>
              )}
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          id="hours"
          icon={Clock}
          title="Horarios"
          description="Funcionamento por dia da semana."
          openSection={openSection}
          setOpenSection={setOpenSection}
        >
          <div className="space-y-2">
            {daysOfWeek.map((day) => {
              const dayHours = localHours.find((hour) => Number(hour.day_of_week) === day.value)

              return (
                <div key={day.value} className="rounded-lg border border-dark-700 bg-dark-900 p-3">
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-[110px_100px_1fr] lg:items-center">
                    <span className="font-medium text-white">{day.label}</span>
                    <label className="flex items-center gap-2 text-sm text-gray-200">
                      <input
                        type="checkbox"
                        checked={Boolean(dayHours?.is_open)}
                        onChange={(e) => updateHour(day.value, 'is_open', e.target.checked)}
                      />
                      Aberto
                    </label>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <Input
                        label="Abre"
                        type="time"
                        value={dayHours?.open_time?.slice(0, 5) || ''}
                        onChange={(e) => updateHour(day.value, 'open_time', e.target.value)}
                        disabled={!dayHours?.is_open}
                      />
                      <Input
                        label="Fecha"
                        type="time"
                        value={dayHours?.close_time?.slice(0, 5) || ''}
                        onChange={(e) => updateHour(day.value, 'close_time', e.target.value)}
                        disabled={!dayHours?.is_open}
                      />
                      <Input
                        label="Pausa inicio"
                        type="time"
                        value={dayHours?.break_start?.slice(0, 5) || ''}
                        onChange={(e) => updateHour(day.value, 'break_start', e.target.value)}
                        disabled={!dayHours?.is_open}
                      />
                      <Input
                        label="Pausa fim"
                        type="time"
                        value={dayHours?.break_end?.slice(0, 5) || ''}
                        onChange={(e) => updateHour(day.value, 'break_end', e.target.value)}
                        disabled={!dayHours?.is_open}
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <Input
                      label="Mensagem quando fechado"
                      value={dayHours?.closed_message || ''}
                      onChange={(e) => updateHour(day.value, 'closed_message', e.target.value)}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveHours} variant="outline" loading={savingHours}>
              Salvar horarios
            </Button>
          </div>
        </SettingsSection>

        <SettingsSection
          id="print"
          icon={Printer}
          title="Impressao / Nota"
          description="Texto simples para o rodape do comprovante."
          openSection={openSection}
          setOpenSection={setOpenSection}
        >
          <Textarea
            label="Rodape do comprovante"
            rows={2}
            value={localSettings.print_footer || ''}
            onChange={(e) => updateSetting('print_footer', e.target.value)}
          />
        </SettingsSection>

        <TemplateSelectorSection
          currentTemplateId={localSettings.visual_template_id || DEFAULT_TEMPLATE_ID}
          onSelect={(id) => updateSetting('visual_template_id', id)}
          openSection={openSection}
          setOpenSection={setOpenSection}
        />

        <SettingsSection
          id="whatsapp"
          icon={MessageCircle}
          title="WhatsApp basico"
          description="Contato da loja e acesso rapido ao modulo WhatsApp."
          openSection={openSection}
          setOpenSection={setOpenSection}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="WhatsApp da loja"
              value={localSettings.whatsapp_number || ''}
              onChange={(e) => updateSetting('whatsapp_number', e.target.value)}
            />
            <div className="rounded-lg border border-dark-700 bg-dark-900 p-4">
              <p className="text-sm text-gray-400">Modo atual</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${disabledWhatsappMode ? 'bg-gray-500' : manualWhatsappMode ? 'bg-blue-400' : 'bg-green-400'}`} />
                <span className="font-semibold text-white">
                  {disabledWhatsappMode
                    ? 'WhatsApp desativado'
                    : manualWhatsappMode
                      ? 'Manual pelo WhatsApp Web/App'
                      : 'Automatico com Replymesh Connect'}
                </span>
              </div>
            </div>
          </div>
          <div className="grid gap-3">
            {automaticWhatsappMode && (
            <div className="rounded-xl border border-yellow-400 bg-yellow-400/5 p-4">
              <div className="flex items-start gap-3">
                <span className="mt-1 h-3 w-3 rounded-full bg-yellow-400" />
                <div>
                  <strong className="text-white">Automatico com Replymesh Connect</strong>
                  <p className="mt-1 text-sm text-gray-400">As mensagens sao enviadas automaticamente pelo Replymesh Connect.</p>
                </div>
              </div>
            </div>
            )}
            {manualWhatsappMode && (
            <div className="rounded-xl border border-blue-400 bg-blue-400/5 p-4">
              <div className="flex items-start gap-3">
                <span className="mt-1 h-3 w-3 rounded-full bg-blue-400" />
                <div>
                  <strong className="text-white">Manual pelo WhatsApp Web/App</strong>
                  <p className="mt-1 text-sm text-gray-400">O sistema abre o WhatsApp com a mensagem pronta. Voce confere e envia manualmente.</p>
                </div>
              </div>
            </div>
            )}
            {disabledWhatsappMode && (
            <div className="rounded-xl border border-dark-700 bg-dark-900 p-4">
              <div className="flex items-start gap-3">
                <span className="mt-1 h-3 w-3 rounded-full bg-gray-500" />
                <div>
                  <strong className="text-white">WhatsApp desativado</strong>
                  <p className="mt-1 text-sm text-gray-400">O módulo WhatsApp não está liberado para esta empresa.</p>
                </div>
              </div>
            </div>
            )}
          </div>
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-100">
            O modo operacional do WhatsApp é definido no Painel Master. A loja pode alterar apenas o número de contato.
          </div>
          <div className="rounded-lg border border-dark-700 bg-dark-900 p-4 text-sm text-gray-300">
            {disabledWhatsappMode
              ? 'WhatsApp desativado para esta empresa.'
              : manualWhatsappMode
              ? 'Modo manual ativo. As mensagens devem ser enviadas pelo atendente.'
              : 'As mensagens automaticas sao configuradas na area WhatsApp.'}
          </div>
          <Button type="button" variant="secondary" onClick={() => window.location.assign(whatsappAdminUrl)}>
            <ExternalLink size={16} className="mr-2" />
            Ir para Comunicacao &gt; WhatsApp
          </Button>
        </SettingsSection>

      </div>
    </div>
  )
}

export default Settings
