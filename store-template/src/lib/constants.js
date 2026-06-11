export const ORDER_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  PREPARING: 'preparing',
  READY: 'ready',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUSES.PENDING]: 'Pendente',
  [ORDER_STATUSES.ACCEPTED]: 'Aceito',
  [ORDER_STATUSES.PREPARING]: 'Em preparo',
  [ORDER_STATUSES.READY]: 'Pronto',
  [ORDER_STATUSES.OUT_FOR_DELIVERY]: 'Saiu para entrega',
  [ORDER_STATUSES.COMPLETED]: 'Finalizado',
  [ORDER_STATUSES.CANCELLED]: 'Cancelado',
}

export const ORDER_STATUS_COLORS = {
  [ORDER_STATUSES.PENDING]: 'bg-yellow-500',
  [ORDER_STATUSES.ACCEPTED]: 'bg-blue-500',
  [ORDER_STATUSES.PREPARING]: 'bg-orange-500',
  [ORDER_STATUSES.READY]: 'bg-green-500',
  [ORDER_STATUSES.OUT_FOR_DELIVERY]: 'bg-purple-500',
  [ORDER_STATUSES.COMPLETED]: 'bg-green-600',
  [ORDER_STATUSES.CANCELLED]: 'bg-red-500',
}

export const USER_ROLES = {
  ADMIN: 'admin',
  ATTENDANT: 'attendant',
  WAITER: 'waiter',
  KITCHEN: 'kitchen',
  MOTOBOY: 'motoboy',
}

export const PAYMENT_METHODS = {
  MONEY: 'money',
  PIX: 'pix',
  CARD_ON_DELIVERY: 'card_on_delivery',
}

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.MONEY]: 'Dinheiro',
  [PAYMENT_METHODS.PIX]: 'Pix',
  [PAYMENT_METHODS.CARD_ON_DELIVERY]: 'Cartão na entrega',
}

export const ORDER_TYPES = {
  DELIVERY: 'delivery',
  PICKUP: 'pickup',
  DINE_IN: 'dine_in',
  POS: 'pos',
}

export const ORDER_TYPE_LABELS = {
  [ORDER_TYPES.DELIVERY]: 'Entrega',
  [ORDER_TYPES.PICKUP]: 'Retirada',
  [ORDER_TYPES.DINE_IN]: 'Mesa',
  [ORDER_TYPES.POS]: 'PDV / Balcao',
}

export const DISCOUNT_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
  FREE_SHIPPING: 'free_shipping',
  FREE_ITEM: 'free_item',
}

export const DISCOUNT_TYPE_LABELS = {
  [DISCOUNT_TYPES.PERCENTAGE]: 'Percentual',
  [DISCOUNT_TYPES.FIXED]: 'Valor fixo',
  [DISCOUNT_TYPES.FREE_SHIPPING]: 'Frete gratis',
  [DISCOUNT_TYPES.FREE_ITEM]: 'Brinde',
}

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
]
