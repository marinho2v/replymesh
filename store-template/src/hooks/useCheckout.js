import { useState } from 'react'
import { useCart } from '../contexts/CartContext'
import { createPublicOrder } from '../services/orders'
import { validateCoupon } from '../services/coupons'
import { getPublicStoreSettings, isStoreOpen } from '../services/settings'
import { calculateDeliveryFee } from '../utils/calculateDeliveryFee'
import { generateOrderMessage, openWhatsApp } from '../services/whatsapp'
import { toast } from 'sonner'
import { DISCOUNT_TYPES } from '../lib/constants'

const buildLocationNote = (locationMeta) => {
  if (!locationMeta?.latitude || !locationMeta?.longitude) return ''

  const accuracy = Number(locationMeta.accuracy || 0)
  const accuracyText = accuracy > 0
    ? `${Math.round(accuracy)}m`
    : 'nao informada'

  return [
    'Localizacao enviada pelo cliente:',
    `Precisao: ${accuracyText}`,
    `Mapa: ${locationMeta.mapsUrl || `https://www.google.com/maps?q=${locationMeta.latitude},${locationMeta.longitude}`}`,
  ].join('\n')
}

export const useCheckout = () => {
  const { cart, coupon, discount, getSubtotal, clearCart, applyCoupon, removeCoupon } = useCart()
  const [loading, setLoading] = useState(false)
  const [loadingCEP, setLoadingCEP] = useState(false)
  const [loadingCoupon, setLoadingCoupon] = useState(false)

  const submitCheckout = async (formData) => {
    console.log('Iniciando checkout...')
    setLoading(true)

    try {
      console.log('Validando carrinho...')
      if (cart.length === 0) {
        throw new Error('Carrinho vazio')
      }

      const invalidCartItem = cart.find(item => !item.product_id)
      if (invalidCartItem) {
        throw new Error('Seu carrinho tem item antigo sem cadastro valido. Remova e adicione o produto novamente.')
      }

      const subtotal = getSubtotal()
      console.log('Subtotal:', subtotal)

      console.log('Verificando se loja esta aberta...')
      const storeStatus = await isStoreOpen()
      console.log('Status da loja:', storeStatus)
      if (!storeStatus.isOpen) {
        throw new Error(storeStatus.message || 'Loja fechada no momento')
      }

      console.log('Calculando taxa de entrega...')
      let deliveryFee = 0
      let deliveryZone = null
      let isDeliverable = true

      if (formData.orderType === 'delivery' && formData.neighborhood) {
        const deliveryResult = await calculateDeliveryFee(formData)
        deliveryFee = deliveryResult.fee
        deliveryZone = deliveryResult.zone
        isDeliverable = deliveryResult.isDeliverable
        console.log('Resultado entrega:', deliveryResult)

        if (!isDeliverable) {
          const settings = await getPublicStoreSettings()
          if (settings?.block_outside_delivery_area) {
            throw new Error('Regiao fora da area de entrega')
          }
          deliveryFee = 0
        }
      }

      let couponData = null
      let discountAmount = 0

      if (coupon) {
        const validation = await validateCoupon(
          coupon.code,
          subtotal,
          formData.whatsapp
        )

        if (!validation.valid) {
          throw new Error(validation.message)
        }

        couponData = validation.coupon
        discountAmount = validation.discountAmount

        if (couponData.discount_type === DISCOUNT_TYPES.FREE_SHIPPING) {
          discountAmount = deliveryFee
        } else if (couponData.discount_type === DISCOUNT_TYPES.FREE_ITEM) {
          discountAmount = 0
        }
      }

      console.log('Cupom:', couponData, 'Desconto:', discountAmount)

      const total = subtotal + deliveryFee - discountAmount
      console.log('Total calculado:', total)

      console.log('Validando troco...')
      if (formData.paymentMethod === 'money' && formData.needsChange && !formData.changeFor) {
        throw new Error('Informe o valor para troco')
      }

      if (formData.paymentMethod === 'money' && formData.changeFor) {
        const changeFor = parseFloat(formData.changeFor)
        if (changeFor < total) {
          throw new Error('Troco deve ser maior ou igual ao total')
        }
      }

      const locationNote = buildLocationNote(formData.locationMeta)
      const orderNotes = [formData.notes, locationNote].filter(Boolean).join('\n\n')
      const secureResult = await createPublicOrder({
        formData: {
          ...formData,
          delivery_zone_id: deliveryZone?.id || formData.delivery_zone_id || null,
          notes: orderNotes,
        },
        items: cart,
        totals: {
          subtotal,
          discount: discountAmount,
          deliveryFee,
          total,
        },
        couponCode: couponData?.code || coupon?.code || '',
      })

      clearCart()
      console.log('Checkout finalizado com sucesso')
      return secureResult
    } catch (error) {
      console.error('Checkout error:', error)
      console.error('Error details:', error.message, error.stack)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const applyCouponCode = async (code, customerPhone = null) => {
    setLoadingCoupon(true)

    try {
      const subtotal = getSubtotal()

      if (subtotal === 0) {
        throw new Error('Carrinho vazio')
      }

      const validation = await validateCoupon(code, subtotal, customerPhone)

      if (!validation.valid) {
        throw new Error(validation.message)
      }

      applyCoupon(validation.coupon, validation.discountAmount)
      toast.success(validation.coupon.discount_type === DISCOUNT_TYPES.FREE_SHIPPING
        ? 'Cupom aplicado: frete gratis'
        : validation.coupon.discount_type === DISCOUNT_TYPES.FREE_ITEM
          ? 'Brinde da roleta aplicado'
          : `Cupom aplicado: ${validation.discountAmount > 0 ? 'R$ ' + validation.discountAmount.toFixed(2) : validation.discountAmount + '%'}`)

      return { success: true, coupon: validation.coupon, discount: validation.discountAmount }
    } catch (error) {
      console.error('Coupon error:', error)
      throw error
    } finally {
      setLoadingCoupon(false)
    }
  }

  const searchCEP = async (cep) => {
    setLoadingCEP(true)

    try {
      const { searchByCEP } = await import('../services/viacep')

      const cleanCEP = cep.replace(/\D/g, '')
      if (cleanCEP.length !== 8) {
        throw new Error('CEP invalido')
      }

      const result = await searchByCEP(cleanCEP)

      return {
        success: true,
        address: result.address,
      }
    } catch (error) {
      console.error('CEP error:', error)
      throw error
    } finally {
      setLoadingCEP(false)
    }
  }

  const calculateFeeForNeighborhood = async (addressOrNeighborhood) => {
    try {
      const result = await calculateDeliveryFee(addressOrNeighborhood)
      return result
    } catch (error) {
      console.error('Delivery fee error:', error)
      return { fee: 0, zone: null, isDeliverable: false }
    }
  }

  const sendOrderWhatsApp = async (order, storeSettings) => {
    try {
      const template = await (await import('../services/settings')).getWhatsappTemplateByKey('order_received')

      if (!template) {
        throw new Error('Template nao encontrado')
      }

      const message = generateOrderMessage(order, template.content || template.message, storeSettings)

      if (!storeSettings?.whatsapp_number) {
        throw new Error('WhatsApp nao configurado')
      }

      openWhatsApp(storeSettings.whatsapp_number, message)

      return { success: true }
    } catch (error) {
      console.error('WhatsApp error:', error)
      throw error
    }
  }

  return {
    loading,
    loadingCEP,
    loadingCoupon,
    submitCheckout,
    applyCouponCode,
    searchCEP,
    calculateFeeForNeighborhood,
    sendOrderWhatsApp,
    removeCoupon,
  }
}
