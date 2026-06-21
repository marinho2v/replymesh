import { COMPANY_SLUG, request } from './replymeshApi'
import { getEffectiveStoreStatus } from '../utils/storeSchedule'
import { DEFAULT_TEMPLATE_ID } from '../templates'

const currentCompanyId = () => localStorage.getItem('replymesh_store_company_id') || import.meta.env.VITE_REPLYMESH_COMPANY_ID || '4'
const currentCompanySlug = () => localStorage.getItem('replymesh_store_company_slug') || COMPANY_SLUG
const companyHeaders = () => ({ 'X-Company-Id': String(currentCompanyId()) })

export const getStoreSettings = async () => {
  try {
    const payload = await request('/company/settings', {
      params: { company_id: currentCompanyId() },
      headers: companyHeaders(),
    })
    const settings = payload.settings || {}
    return {
      ...settings,
      store_name: settings.trade_name || settings.company_name || settings.store_name || '',
      phone: settings.phone || settings.whatsapp || settings.whatsapp_number || '',
      whatsapp_number: settings.whatsapp || settings.whatsapp_number || '',
      logo_url: settings.logo_url || '',
      banner_url: settings.banner_url || settings.cover_url || '',
      cover_url: settings.cover_url || settings.banner_url || '',
      visual_template_id: settings.visual_template_id || DEFAULT_TEMPLATE_ID,
    }
  } catch (error) {
    console.error('Error fetching Rails store settings:', error)
    throw error
  }
}

export const getPublicStoreSettings = async () => {
  try {
    const payload = await request(`/public/${encodeURIComponent(COMPANY_SLUG)}/store`, { token: null })
    return {
      ...(payload.store || {}),
      ...(payload.store_settings || {}),
      logo_url: payload.store?.logo_url || payload.store_settings?.logo_url || '',
      visual_template_id: payload.store?.visual_template_id || payload.store_settings?.visual_template_id || DEFAULT_TEMPLATE_ID,
    }
  } catch (error) {
    console.error('Error fetching public Rails store settings:', error)
    throw error
  }
}

export const publishAppUpdate = async () => {
  window.dispatchEvent(new CustomEvent('replymesh-store-settings-updated'))
  return { success: true }
}

const optionalStoreSettingsColumns = [
  'phone',
  'address',
  'default_order_message',
  'default_support_message',
  'pix_key_type',
  'pix_payload',
  'pix_receiver_city',
  'print_footer',
  'whatsapp_provider',
  'whatsapp_auto_send_enabled',
  'whatsapp_mode',
  'wasender_base_url',
  'wasender_session_id',
  'evolution_base_url',
  'evolution_api_key',
  'evolution_instance',
  'order_status_flow',
]

const missingColumnCodes = ['42703', 'PGRST204']

const emptyToNull = (value) => {
  if (value === undefined) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed === '' ? null : trimmed
  }
  return value
}

const numberOrDefault = (value, fallback = 0) => {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : fallback
}

const integerOrDefault = (value, fallback = 1) => {
  const number = parseInt(value, 10)
  return Number.isFinite(number) && number >= 1 ? number : fallback
}

export const DEFAULT_ORDER_STATUS_FLOW = {
  accepted: true,
  preparing: false,
  ready: false,
  out_for_delivery: true,
  completed: true,
}

export const normalizeOrderStatusFlow = (flow = {}) => ({
  accepted: flow?.accepted !== false,
  preparing: Boolean(flow?.preparing),
  ready: Boolean(flow?.ready),
  out_for_delivery: flow?.out_for_delivery !== false,
  completed: flow?.completed !== false,
})

const sanitizeStoreSettings = (settingsData = {}, includeOptionalColumns = true) => {
  const payload = {
    store_name: emptyToNull(settingsData.store_name),
    logo_url: emptyToNull(settingsData.logo_url),
    banner_url: emptyToNull(settingsData.banner_url || settingsData.cover_url),
    cover_url: emptyToNull(settingsData.cover_url || settingsData.banner_url),
    hero_title: emptyToNull(settingsData.hero_title),
    hero_highlight: emptyToNull(settingsData.hero_highlight),
    hero_subtitle: emptyToNull(settingsData.hero_subtitle),
    hero_image_url: emptyToNull(settingsData.hero_image_url),
    hero_image_position: emptyToNull(settingsData.hero_image_position) || 'center',
    hero_image_zoom: integerOrDefault(settingsData.hero_image_zoom, 100),
    hero_overlay_opacity: integerOrDefault(settingsData.hero_overlay_opacity, 65),
    hero_height: integerOrDefault(settingsData.hero_height, 480),
    theme_primary_color: emptyToNull(settingsData.theme_primary_color || settingsData.primary_color) || '#f7a325',
    whatsapp_number: emptyToNull(settingsData.whatsapp_number),
    delivery_fee_default: numberOrDefault(settingsData.delivery_fee_default),
    minimum_order_amount: numberOrDefault(settingsData.minimum_order_amount),
    average_delivery_time: emptyToNull(settingsData.average_delivery_time),
    business_hours: emptyToNull(settingsData.business_hours),
    store_status: settingsData.store_status === 'closed' ? 'closed' : 'open',
    closed_message: emptyToNull(settingsData.closed_message),
    primary_color: emptyToNull(settingsData.primary_color) || '#F60670',
    pix_key: emptyToNull(settingsData.pix_key),
    pix_receiver_name: emptyToNull(settingsData.pix_receiver_name),
    pix_qr_code_url: emptyToNull(settingsData.pix_qr_code_url),
    allow_pickup: settingsData.allow_pickup !== false,
    block_outside_delivery_area: settingsData.block_outside_delivery_area !== false,
    block_orders_when_closed: settingsData.block_orders_when_closed !== false,
    recurring_customer_min_orders: integerOrDefault(settingsData.recurring_customer_min_orders, 2),
  }

  if (includeOptionalColumns) {
    payload.phone = emptyToNull(settingsData.phone)
    payload.city = emptyToNull(settingsData.city)
    payload.state = emptyToNull(settingsData.state)
    payload.zip_code = emptyToNull(settingsData.zip_code)
    payload.address = emptyToNull(settingsData.address)
    payload.default_order_message = emptyToNull(settingsData.default_order_message)
    payload.default_support_message = emptyToNull(settingsData.default_support_message)
    payload.pix_key_type = emptyToNull(settingsData.pix_key_type)
    payload.pix_payload = emptyToNull(settingsData.pix_payload)
    payload.pix_receiver_city = emptyToNull(settingsData.pix_receiver_city)
    payload.print_footer = emptyToNull(settingsData.print_footer)
    payload.whatsapp_provider = ['wasender', 'evolution'].includes(settingsData.whatsapp_provider)
      ? settingsData.whatsapp_provider
      : 'evolution'
    payload.whatsapp_auto_send_enabled = settingsData.whatsapp_auto_send_enabled !== false
    payload.whatsapp_mode = ['automatic', 'manual', 'disabled'].includes(settingsData.whatsapp_mode)
      ? settingsData.whatsapp_mode
      : 'automatic'
    payload.wasender_base_url = emptyToNull(settingsData.wasender_base_url) || 'https://www.wasenderapi.com'
    payload.wasender_session_id = emptyToNull(settingsData.wasender_session_id)
    payload.evolution_base_url = emptyToNull(settingsData.evolution_base_url) || 'https://marinho.replymesh.cloud'
    payload.evolution_api_key = emptyToNull(settingsData.evolution_api_key)
    payload.evolution_instance = emptyToNull(settingsData.evolution_instance)
    payload.order_status_flow = normalizeOrderStatusFlow(settingsData.order_status_flow || DEFAULT_ORDER_STATUS_FLOW)
    payload.visual_template_id = settingsData.visual_template_id || DEFAULT_TEMPLATE_ID
    payload.pix_provider = settingsData.pix_provider || 'manual'
    payload.mercadopago_public_key = emptyToNull(settingsData.mercadopago_public_key)
    // Só envia o token se o usuário digitou algo novo (não é o token mascarado)
    if (settingsData.mercadopago_access_token && !settingsData.mercadopago_access_token.includes('****')) {
      payload.mercadopago_access_token = emptyToNull(settingsData.mercadopago_access_token)
    }
    payload.mercadopago_enabled = Boolean(settingsData.mercadopago_enabled)
  }

  return payload
}

export const updateStoreSettings = async (settingsData) => {
  try {
    const payload = sanitizeStoreSettings(settingsData, true)
    const response = await request('/company/settings', {
      method: 'PUT',
      params: { company_id: currentCompanyId() },
      headers: companyHeaders(),
      body: {
        settings: {
          ...payload,
          company_id: currentCompanyId(),
          company_name: settingsData.company_name || settingsData.store_name,
          trade_name: settingsData.store_name || settingsData.trade_name,
          whatsapp: settingsData.whatsapp_number || settingsData.whatsapp,
          delivery_fee_default: settingsData.delivery_fee_default,
          minimum_order_amount: settingsData.minimum_order_amount,
        },
      },
    })
    const settings = response.settings || {}
    return {
      ...settings,
      store_name: settings.trade_name || settings.company_name || settingsData.store_name,
      phone: settings.phone || settings.whatsapp || settingsData.phone,
      whatsapp_number: settings.whatsapp || settingsData.whatsapp_number,
      logo_url: settings.logo_url || '',
      banner_url: settings.banner_url || settings.cover_url || settingsData.banner_url || settingsData.cover_url || '',
      cover_url: settings.cover_url || settings.banner_url || settingsData.cover_url || settingsData.banner_url || '',
    }
  } catch (error) {
    console.error('Error updating Rails store settings:', error)
    throw error
  }
}

export const getBusinessHours = async () => {
  try {
    const payload = await request('/store/business_hours', { headers: companyHeaders() })
    return payload.business_hours || []
  } catch (error) {
    console.error('Error fetching Rails business hours:', error)
    throw error
  }
}

const normalizeBusinessHourPayload = (hour) => ({
  ...hour,
  open_time: normalizeTime(hour.open_time),
  close_time: normalizeTime(hour.close_time),
  break_start: normalizeTime(hour.break_start),
  break_end: normalizeTime(hour.break_end),
  closed_message: emptyToNull(hour.closed_message),
})

export const updateBusinessHours = async (hoursData) => {
  try {
    const normalizedHours = (hoursData || []).map(normalizeBusinessHourPayload)
    let existing = await getBusinessHours()
    if (!existing.length) {
      await request('/store/business_hours/bulk_create', {
        method: 'POST',
        headers: companyHeaders(),
      })
      existing = await getBusinessHours()
    }
    await Promise.all(normalizedHours.map((hour) => {
      const current = existing.find(item => Number(item.day_of_week) === Number(hour.day_of_week))
      if (!current?.id) return Promise.resolve()
      return request(`/store/business_hours/${current.id}`, {
        method: 'PATCH',
        headers: companyHeaders(),
        body: {
          business_hour: {
            is_open: Boolean(hour.is_open),
            open_time: hour.open_time || null,
            close_time: hour.close_time || null,
            break_start: hour.break_start || null,
            break_end: hour.break_end || null,
            closed_message: hour.closed_message || null,
          },
        },
      })
    }))
    return true
  } catch (error) {
    console.error('Error updating Rails business hours:', error)
    throw error
  }
}

export const getBusinessHourExceptions = async () => {
  const payload = await request('/store/business_hour_exceptions', {
    headers: companyHeaders(),
  })
  return payload.business_hour_exceptions || payload.exceptions || []
}

export const getWhatsappTemplates = async () => {
  const payload = await request('/store/whatsapp/templates', {
    headers: companyHeaders(),
  })
  return (payload.templates || []).map((template) => ({
    ...template,
    key: template.template_key || template.key,
    type: template.template_key || template.type,
    name: template.title || template.name,
    content: template.message || template.content,
    active: template.enabled !== false,
  }))
}

export const getWhatsappTemplateByKey = async (key) => {
  const templateKeyAliases = {
    order_received: ['pedido_recebido'],
    order_accepted: ['pedido_aceito'],
    order_preparing: ['pedido_preparo'],
    order_ready: ['pedido_pronto'],
    order_out_for_delivery: ['saiu_entrega'],
    order_completed: ['pedido_finalizado'],
    order_delivered: ['pedido_finalizado'],
    order_cancelled: ['pedido_cancelado'],
  }
  const keysToTry = [key, ...(templateKeyAliases[key] || [])].filter(Boolean)

  const templates = await getWhatsappTemplates()
  return templates.find((template) => keysToTry.includes(template.key) || keysToTry.includes(template.type)) || null
}

export const updateWhatsappTemplate = async (templateId, templateData) => {
  const payload = await request(`/store/whatsapp/templates/${encodeURIComponent(templateId)}`, {
    method: 'PATCH',
    headers: companyHeaders(),
    body: {
      template: {
        title: templateData.name || templateData.title,
        message: templateData.content || templateData.message,
        enabled: templateData.active !== false,
      },
    },
  })
  const template = payload.template || {}
  return {
    ...template,
    key: template.template_key || template.key,
    type: template.template_key || template.type,
    title: templateData.name || templateData.title,
    name: template.title || templateData.name || templateData.title,
    content: template.message || templateData.content || templateData.message,
    active: template.enabled !== false,
  }
}

export const createWhatsappTemplate = async (templateData) => {
  console.warn('Templates sao provisionados automaticamente pelo onboarding Rails.', templateData)
  throw new Error('Templates novos sao criados automaticamente no onboarding.')
}

const normalizeTime = (value) => {
  if (!value) return null
  const match = String(value).match(/^(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]}` : null
}

const timeToMinutes = (value) => {
  const normalized = normalizeTime(value)
  if (!normalized) return null

  const [hours, minutes] = normalized.split(':').map(Number)
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null
  }

  return hours * 60 + minutes
}

const formatLocalDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const getPreviousDate = (date) => {
  const previous = new Date(date)
  previous.setDate(previous.getDate() - 1)
  return previous
}

const buildWindow = (openTime, closeTime) => {
  const openMinutes = timeToMinutes(openTime)
  const closeMinutes = timeToMinutes(closeTime)

  if (openMinutes === null || closeMinutes === null) {
    return null
  }

  const closesNextDay = closeMinutes < openMinutes

  return {
    openMinutes,
    closeMinutes,
    openAbsolute: openMinutes,
    closeAbsolute: closeMinutes + (closesNextDay ? 24 * 60 : 0),
    closesNextDay,
  }
}

const isInsideBreak = (schedule, currentAbsolute, scheduleWindow) => {
  const breakStart = timeToMinutes(schedule.break_start)
  const breakEnd = timeToMinutes(schedule.break_end)

  if (breakStart === null || breakEnd === null || !scheduleWindow) return false

  let breakStartAbsolute = breakStart
  let breakEndAbsolute = breakEnd

  if (scheduleWindow.closesNextDay && breakStartAbsolute < scheduleWindow.openMinutes) {
    breakStartAbsolute += 24 * 60
  }

  if (breakEndAbsolute < breakStartAbsolute) {
    breakEndAbsolute += 24 * 60
  } else if (scheduleWindow.closesNextDay && breakEndAbsolute < scheduleWindow.openMinutes) {
    breakEndAbsolute += 24 * 60
  }

  return currentAbsolute >= breakStartAbsolute && currentAbsolute <= breakEndAbsolute
}

const buildClosedResponse = (message, nextOpenAt) => ({
  isOpen: false,
  message,
  nextOpenAt,
})

const evaluateSchedule = (schedule, settings, currentTime, dayOffset = 0) => {
  if (!schedule || !schedule.is_open) {
    return buildClosedResponse(
      schedule?.closed_message || schedule?.message || settings.closed_message || 'Loja fechada hoje'
    )
  }

  const openTime = normalizeTime(schedule.open_time)
  const closeTime = normalizeTime(schedule.close_time)
  const scheduleWindow = buildWindow(openTime, closeTime)

  if (!scheduleWindow) {
    return {
      isOpen: true,
      closesAt: closeTime,
    }
  }

  const currentMinutes = timeToMinutes(currentTime)
  const currentAbsolute = currentMinutes === null ? null : currentMinutes + dayOffset
  const isInsideHours =
    currentAbsolute !== null &&
    currentAbsolute >= scheduleWindow.openAbsolute &&
    currentAbsolute <= scheduleWindow.closeAbsolute

  if (!isInsideHours) {
    return buildClosedResponse(
      schedule.closed_message || schedule.message || settings.closed_message || 'Fora do horario de funcionamento',
      openTime
    )
  }

  const breakEnd = normalizeTime(schedule.break_end)

  if (isInsideBreak(schedule, currentAbsolute, scheduleWindow)) {
    return buildClosedResponse(
      schedule.closed_message || schedule.message || settings.closed_message || `Voltamos as ${breakEnd}`,
      breakEnd
    )
  }

  return {
    isOpen: true,
    closesAt: closeTime,
  }
}

const evaluateOvernightCarryover = (schedule, settings, currentTime) => {
  const openTime = normalizeTime(schedule?.open_time)
  const closeTime = normalizeTime(schedule?.close_time)
  const scheduleWindow = buildWindow(openTime, closeTime)

  if (!schedule?.is_open || !scheduleWindow?.closesNextDay) return null

  const result = evaluateSchedule(schedule, settings, currentTime, 24 * 60)
  return result.isOpen ? result : null
}

export const isStoreOpen = async () => {
  try {
    const settings = await getPublicStoreSettings()
    const payload = await request(`/public/${encodeURIComponent(currentCompanySlug())}/business_hours`, { token: null })
    const status = getEffectiveStoreStatus(settings, payload.business_hours || [])

    return {
      isOpen: status.isOpen,
      message: status.message || settings?.closed_message || '',
      closesAt: status.closesAt,
      opensAt: status.opensAt,
    }
  } catch (error) {
    console.error('Error checking store status:', error)
    return { isOpen: false, message: 'Erro ao verificar status' }
  }
}
