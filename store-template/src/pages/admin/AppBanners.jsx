import { useCallback, useEffect, useState } from 'react'
import { Edit, Image, MessageCircle, Plus, Send, Smartphone, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { request } from '../../services/replymeshApi'
import {
  railsCreateBanner, railsDeleteBanner, railsGetBanners, railsUpdateBanner, STORE_COMPANY_ID,
} from '../../services/storeApi'
import { sendIndividualMarketingMessage } from '../../services/marketingWhatsapp'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'

const headers = () => ({ 'X-Company-Id': localStorage.getItem('replymesh_store_company_id') || STORE_COMPANY_ID })
const emptyApp = { app_name: '', display_name: '', logo_url: '', icon_url: '', splash_url: '', primary_color: '#f59e0b', secondary_color: '#111111', support_whatsapp: '', notes: '' }
const emptyBanner = { title: '', image_url: '', link_url: '', is_active: true, sort_order: 0 }

export default function AppBanners() {
  const [section, setSection] = useState('app')
  const [form, setForm] = useState(emptyApp)
  const [record, setRecord] = useState(null)
  const [banners, setBanners] = useState([])
  const [bannerForm, setBannerForm] = useState(emptyBanner)
  const [editingBanner, setEditingBanner] = useState(null)
  const [message, setMessage] = useState({ phone: '', text: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const [appData, bannerData] = await Promise.all([
        request('/store/android_app', { headers: headers() }),
        railsGetBanners(),
      ])
      if (appData.android_app) { setRecord(appData.android_app); setForm(appData.android_app) }
      setBanners(bannerData)
    } catch (error) { toast.error(error.message) }
  }, [])
  useEffect(() => { load() }, [load])

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const saveApp = async () => {
    setSaving(true)
    try {
      const data = await request('/store/android_app', { method: 'POST', body: { android_app: form }, headers: headers() })
      setRecord(data.android_app); setForm(data.android_app); toast.success('Solicitacao salva')
    } catch (error) { toast.error(error.message) } finally { setSaving(false) }
  }

  const saveBanner = async () => {
    if (!bannerForm.title || !bannerForm.image_url) return toast.error('Informe titulo e imagem')
    try {
      if (editingBanner) await railsUpdateBanner(editingBanner.id, bannerForm)
      else await railsCreateBanner(bannerForm)
      toast.success(editingBanner ? 'Banner atualizado' : 'Banner criado')
      setEditingBanner(null); setBannerForm(emptyBanner); await load()
    } catch (error) { toast.error(error.message) }
  }
  const editBanner = (banner) => { setEditingBanner(banner); setBannerForm(banner) }
  const removeBanner = async (banner) => {
    if (!confirm(`Excluir o banner "${banner.title}"?`)) return
    try { await railsDeleteBanner(banner.id); toast.success('Banner excluido'); await load() }
    catch (error) { toast.error(error.message) }
  }

  const sendMessage = async () => {
    if (!message.phone || !message.text) return toast.error('Informe telefone e mensagem')
    if (!confirm('Enviar esta mensagem pelo WhatsApp conectado da loja?')) return
    try {
      await sendIndividualMarketingMessage(message.phone, message.text)
      toast.success('Mensagem enviada pela Evolution e registrada')
      setMessage({ phone: '', text: '' })
    } catch (error) { toast.error(error.message) }
  }

  return <div className="space-y-6">
    <div><h1 className="text-3xl font-bold text-white">Aplicativo Android</h1><p className="text-gray-400">Solicitacao, banners e comunicacao do aplicativo em uma unica area.</p></div>
    <div className="flex flex-wrap gap-2">
      {[['app', Smartphone, 'Solicitacao'], ['banners', Image, 'Banners do App'], ['messages', MessageCircle, 'Mensagens automaticas']].map(([key, Icon, label]) =>
        <Button key={key} variant={section === key ? 'primary' : 'secondary'} onClick={() => setSection(key)}><Icon size={16} className="mr-2" />{label}</Button>)}
    </div>

    {section === 'app' && <>
      {record && <Card><CardContent className="p-5 flex items-center gap-4"><Smartphone className="text-amber-400" /><div><strong className="text-white">Status: {record.status}</strong><p className="text-sm text-gray-400">Solicitado em {new Date(record.requested_at).toLocaleString('pt-BR')}</p></div></CardContent></Card>}
      <Card><CardContent className="p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Nome do aplicativo" value={form.app_name || ''} onChange={(e) => set('app_name', e.target.value)} />
          <Input label="Nome exibido" value={form.display_name || ''} onChange={(e) => set('display_name', e.target.value)} />
          <Input label="Logo do app (URL)" value={form.logo_url || ''} onChange={(e) => set('logo_url', e.target.value)} />
          <Input label="Icone do app (URL)" value={form.icon_url || ''} onChange={(e) => set('icon_url', e.target.value)} />
          <Input label="Imagem splash (URL)" value={form.splash_url || ''} onChange={(e) => set('splash_url', e.target.value)} />
          <Input label="WhatsApp de suporte" value={form.support_whatsapp || ''} onChange={(e) => set('support_whatsapp', e.target.value)} />
          <Input label="Cor principal" type="color" value={form.primary_color || '#f59e0b'} onChange={(e) => set('primary_color', e.target.value)} />
          <Input label="Cor secundaria" type="color" value={form.secondary_color || '#111111'} onChange={(e) => set('secondary_color', e.target.value)} />
        </div>
        <Textarea label="Observacoes" rows={4} value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} />
        <p className="text-xs text-gray-400">Icone: 512x512. Splash: 1024x1024. PNG, JPG ou WEBP. Nenhum APK e gerado automaticamente nesta fase.</p>
        <Button loading={saving} onClick={saveApp}>Salvar solicitacao</Button>
      </CardContent></Card>
    </>}

    {section === 'banners' && <div className="grid xl:grid-cols-[380px_1fr] gap-6">
      <Card><CardContent className="p-5 space-y-4">
        <h2 className="text-white font-semibold">{editingBanner ? 'Editar banner' : 'Novo banner do aplicativo'}</h2>
        <Input label="Titulo" value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} />
        <Input label="URL da imagem" value={bannerForm.image_url} onChange={(e) => setBannerForm({ ...bannerForm, image_url: e.target.value })} />
        <Input label="Link ao tocar" value={bannerForm.link_url || ''} onChange={(e) => setBannerForm({ ...bannerForm, link_url: e.target.value })} />
        <Input label="Ordem" type="number" value={bannerForm.sort_order || 0} onChange={(e) => setBannerForm({ ...bannerForm, sort_order: e.target.value })} />
        <label className="flex gap-2 text-sm text-white"><input type="checkbox" checked={bannerForm.is_active !== false} onChange={(e) => setBannerForm({ ...bannerForm, is_active: e.target.checked })} />Banner ativo</label>
        <div className="flex gap-2"><Button onClick={saveBanner}><Plus size={16} className="mr-2" />{editingBanner ? 'Atualizar' : 'Adicionar'}</Button>{editingBanner && <Button variant="secondary" onClick={() => { setEditingBanner(null); setBannerForm(emptyBanner) }}>Cancelar</Button>}</div>
      </CardContent></Card>
      <div className="grid md:grid-cols-2 gap-4">{banners.map((banner) => <Card key={banner.id}><CardContent className="p-4">
        {banner.image_url && <img src={banner.image_url} alt={banner.title} className="h-36 w-full rounded-lg object-cover mb-3" />}
        <strong className="text-white">{banner.title}</strong><p className="text-xs text-gray-400 mb-3">{banner.is_active ? 'Ativo' : 'Inativo'} · Ordem {banner.sort_order}</p>
        <div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => editBanner(banner)}><Edit size={14} /></Button><Button size="sm" variant="danger" onClick={() => removeBanner(banner)}><Trash2 size={14} /></Button></div>
      </CardContent></Card>)}
      {!banners.length && <Card><CardContent className="p-8 text-center text-gray-400">Nenhum banner cadastrado.</CardContent></Card>}</div>
    </div>}

    {section === 'messages' && <Card><CardContent className="p-5 space-y-4">
      <h2 className="text-white font-semibold">Mensagens para usuarios do aplicativo</h2>
      <p className="text-sm text-gray-400">Nesta fase a mensagem e entregue pelo WhatsApp da loja usando Evolution Go. Notificacao push nativa sera adicionada quando o aplicativo Android existir.</p>
      <div className="grid md:grid-cols-[280px_1fr] gap-4">
        <Input label="Telefone do usuario" value={message.phone} onChange={(e) => setMessage({ ...message, phone: e.target.value })} />
        <Textarea label="Mensagem" rows={4} value={message.text} onChange={(e) => setMessage({ ...message, text: e.target.value })} />
      </div>
      <Button onClick={sendMessage}><Send size={16} className="mr-2" />Enviar pela Evolution</Button>
      <p className="text-xs text-amber-300">Mensagens em massa continuam no Marketing WhatsApp e sempre exigem confirmacao.</p>
    </CardContent></Card>}
  </div>
}
