import { useState } from 'react'
import { openWhatsApp, generateOrderMessage } from '../services/whatsapp'
import { getWhatsappTemplateByKey } from '../services/settings'

export const useWhatsapp = () => {
  const [loading, setLoading] = useState(false)

  const sendOrderUpdate = async (order, templateKey, storeSettings) => {
    try {
      setLoading(true)
      const template = await getWhatsappTemplateByKey(templateKey)
      
      if (!template) {
        console.error(`Template not found: ${templateKey}`)
        return false
      }

      const message = generateOrderMessage(order, template.content || template.message, storeSettings)
      openWhatsApp(order.customer_whatsapp || order.customer_phone, message)
      return true
    } catch (error) {
      console.error('Error sending WhatsApp message:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const openWhatsAppDirect = (phone, message) => {
    openWhatsApp(phone, message)
  }

  return { sendOrderUpdate, openWhatsAppDirect, loading }
}
