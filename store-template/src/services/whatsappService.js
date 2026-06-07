import { supabase } from './supabase'
import { getStoreSettings } from './settings'

export const normalizeWhatsAppPhone = (phone = '') => {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('55') && digits.length >= 12) return digits
  return `55${digits}`
}

const normalizeProviderName = (provider = 'manual') => {
  const normalized = String(provider || 'manual').trim().toLowerCase()
  if (normalized === 'evolution') return 'evolution'
  return 'evolution'
}

const logWhatsappMessage = async (payload) => {
  try {
    const { error } = await supabase
      .from('whatsapp_message_logs')
      .insert(payload)

    if (error) {
      console.warn('Erro ao registrar log WhatsApp:', error)
    }
  } catch (error) {
    console.warn('Erro ao registrar log WhatsApp:', error)
  }
}

const hasSentMessage = async ({ orderId, status, provider }) => {
  if (!orderId || !status) return false

  try {
    const { data, error } = await supabase
      .from('whatsapp_message_logs')
      .select('id')
      .eq('order_id', orderId)
      .eq('status_do_pedido', status)
      .eq('provider', provider)
      .eq('send_status', 'sent')
      .limit(1)
      .maybeSingle()

    if (error) return false
    return Boolean(data?.id)
  } catch {
    return false
  }
}

export const getWhatsappProviderSettings = async () => {
  const settings = await getStoreSettings()
  return {
    settings,
    provider: 'evolution',
    autoSendEnabled: true,
    evolutionBaseUrl: settings?.evolution_base_url || 'https://marinho.replymesh.cloud',
    evolutionApiKey: settings?.evolution_api_key || '',
    evolutionInstance: settings?.evolution_instance || '',
  }
}

const getProvidedProviderSettings = (providedSettings = {}) => ({
  settings: providedSettings,
  provider: 'evolution',
  autoSendEnabled: true,
  evolutionBaseUrl: providedSettings.evolution_base_url || 'https://marinho.replymesh.cloud',
  evolutionApiKey: providedSettings.evolution_api_key || '',
  evolutionInstance: providedSettings.evolution_instance || '',
})

export const sendWhatsappMessage = async ({
  phone,
  message,
  orderId = null,
  status = null,
  templateKey = null,
  createdBy = null,
  settings: providedSettings = null,
  allowResend = false,
} = {}) => {
  const providerSettings = providedSettings
    ? getProvidedProviderSettings(providedSettings)
    : await getWhatsappProviderSettings()

  const provider = providerSettings.provider
  const normalizedPhone = normalizeWhatsAppPhone(phone)

  console.log('[whatsappService] provider atual:', {
    provider,
    autoSendEnabled: providerSettings.autoSendEnabled,
    evolutionBaseUrl: providerSettings.evolutionBaseUrl,
    evolutionApiKey: Boolean(providerSettings.evolutionApiKey),
    evolutionInstance: providerSettings.evolutionInstance,
    orderId,
    status,
    templateKey,
    phone: normalizedPhone,
  })

  if (!normalizedPhone || !message) {
    return { success: false, provider, error: 'Telefone ou mensagem invalida' }
  }

  if (!allowResend) {
    const alreadySent = await hasSentMessage({ orderId, status, provider })
    if (alreadySent) {
      return { success: true, provider, skipped: true, reason: 'already_sent' }
    }
  }

  try {
    // Ensure we have a valid session before calling the edge function.
    // getSession() auto-refreshes if the access token is expired (as long as
    // the refresh token is still valid). A missing session here means the user
    // was signed out — they need to log in again.
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData?.session?.access_token) {
      console.warn('[whatsappService] Sessao ausente ao tentar enviar WhatsApp')
      return {
        success: false,
        provider,
        fallbackManual: true,
        error: 'Sessao expirada. Faca logout e login novamente para enviar mensagens.',
      }
    }

    const functionName = 'evolution-send-text'
    const functionPayload = {
      phone: normalizedPhone,
      message,
      baseUrl: providerSettings.evolutionBaseUrl,
      apiKey: providerSettings.evolutionApiKey,
      instance: providerSettings.evolutionInstance,
      orderId,
      status,
    }

    console.log('[whatsappService] enviando para Edge Function:', {
      ...functionPayload,
      provider,
      functionName,
      messagePreview: message.slice(0, 120),
      message: undefined,
      sessionUser: sessionData.session.user?.email,
    })

    const { data, error } = await supabase.functions.invoke(functionName, {
      body: functionPayload,
    })

    if (error) throw error

    console.log('[whatsappService] resposta Edge Function:', data)

    if (!data?.success) {
      const errorMessage = data?.error || data?.response?.message || `Erro ao enviar pelo provider ${provider}`
      await logWhatsappMessage({
        order_id: orderId,
        provider,
        phone: normalizedPhone,
        status_do_pedido: status,
        template_key: templateKey,
        message,
        send_status: 'error',
        response: data?.response || data || null,
        error_message: errorMessage,
        created_by: createdBy,
      })

      return { success: false, provider, fallbackManual: true, error: errorMessage, response: data }
    }

    await logWhatsappMessage({
      order_id: orderId,
      provider,
      phone: normalizedPhone,
      status_do_pedido: status,
      template_key: templateKey,
      message,
      send_status: 'sent',
      response: data?.response || null,
      created_by: createdBy,
    })

    return { success: true, provider, response: data?.response }
  } catch (error) {
    console.error(`Erro ao enviar WhatsApp pelo provider ${provider}:`, error)
    await logWhatsappMessage({
      order_id: orderId,
      provider,
      phone: normalizedPhone,
      status_do_pedido: status,
      template_key: templateKey,
      message,
      send_status: 'error',
      error_message: error.message || `Erro ao enviar pelo provider ${provider}`,
      created_by: createdBy,
    })

    return { success: false, provider, fallbackManual: true, error: error.message || `Erro ao enviar pelo provider ${provider}` }
  }
}

export const testEvolutionConnection = async ({ settings: providedSettings = null } = {}) => {
  const providerSettings = providedSettings
    ? getProvidedProviderSettings({
        ...providedSettings,
        whatsapp_provider: 'evolution',
        whatsapp_auto_send_enabled: true,
      })
    : await getWhatsappProviderSettings()

  const { data, error } = await supabase.functions.invoke('evolution-send-text', {
    body: {
      action: 'status',
      baseUrl: providerSettings.evolutionBaseUrl,
      apiKey: providerSettings.evolutionApiKey,
    },
  })

  if (error) throw error
  return data
}
