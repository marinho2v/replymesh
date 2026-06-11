import { request } from './replymeshApi'

const toCents = (value) => Math.round(Number(value || 0) * 100)

export const createPosSale = async ({
  items,
  paymentMethod,
  discountCents = 0,
  discountPercent = 0,
  changeForCents = 0,
  customerName = '',
  customerPhone = '',
  notes = '',
}) => {
  const payload = await request('/store/pos/sale', {
    method: 'POST',
    body: {
      items: items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price_cents: item.unit_price_cents,
        notes: item.notes || null,
      })),
      payment_method: paymentMethod,
      discount_cents: discountCents,
      discount_percent: discountPercent > 0 ? discountPercent : undefined,
      change_for_cents: changeForCents,
      customer_name: customerName || undefined,
      customer_phone: customerPhone || undefined,
      notes: notes || undefined,
    },
  })
  return payload.order
}

export const getPosMenu = async (companySlug) => {
  const payload = await request(`/public/${companySlug}/menu`)
  return payload.menu || []
}
