export const formatPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  
  return phone
}

export const formatPhoneForWhatsApp = (phone) => {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 11) {
    return `55${cleaned}`
  }
  
  if (cleaned.length === 10) {
    return `55${cleaned}`
  }
  
  if (cleaned.startsWith('55')) {
    return cleaned
  }
  
  return cleaned
}
