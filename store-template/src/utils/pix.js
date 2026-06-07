export const PIX_KEY_TYPE_LABELS = {
  cpf: 'CPF',
  email: 'E-mail',
  phone: 'Telefone',
  random: 'Chave aleatoria',
}

const safeSettings = (settings) => settings || {}

export const getPixCopyText = (settings = {}) => {
  settings = safeSettings(settings)
  if (settings.pix_payload) return settings.pix_payload.trim()
  if (settings.pix_key) return settings.pix_key.trim()
  return ''
}

export const getPixMode = (settings = {}) => {
  settings = safeSettings(settings)
  if (settings.pix_payload) return 'payload'
  if (settings.pix_key) return 'key'
  return 'none'
}

export const hasPixConfig = (settings = {}) => {
  settings = safeSettings(settings)
  return Boolean(
    settings.pix_payload ||
    settings.pix_key ||
    settings.pix_qr_code_url
  )
}

export const copyPixToClipboard = async (settings = {}) => {
  const text = getPixCopyText(settings)
  if (!text) return false

  await navigator.clipboard.writeText(text)
  return true
}

export const isMercadoPagoEnabled = (settings = {}) =>
  safeSettings(settings).pix_provider === 'mercadopago' && Boolean(safeSettings(settings).mercadopago_enabled)

export const isMercadoPagoConfigured = (settings = {}) =>
  Boolean(safeSettings(settings).mercadopago_public_key && safeSettings(settings).mercadopago_access_token)

export const maskToken = (token) => {
  if (!token) return ''
  const s = String(token)
  if (s.length <= 8) return s
  return `${s.slice(0, 4)}${'*'.repeat(Math.min(s.length - 8, 20))}${s.slice(-4)}`
}
