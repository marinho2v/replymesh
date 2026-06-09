import { ORDER_STATUSES, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../lib/constants'

export const DEFAULT_ORDER_STATUS_FLOW = {
  accepted: true,
  preparing: false,
  ready: false,
  out_for_delivery: true,
  completed: true,
  cancelled: false,
}

export const STATUS_TEMPLATE_KEYS = {
  [ORDER_STATUSES.ACCEPTED]: 'pedido_aceito',
  [ORDER_STATUSES.PREPARING]: 'pedido_em_preparo',
  [ORDER_STATUSES.READY]: 'pedido_pronto',
  [ORDER_STATUSES.OUT_FOR_DELIVERY]: 'saiu_para_entrega',
  [ORDER_STATUSES.COMPLETED]: 'pedido_finalizado',
  [ORDER_STATUSES.CANCELLED]: 'pedido_cancelado',
}

export const normalizeOrderStatusFlow = (flow = {}) => ({
  accepted: true,
  preparing: Boolean(flow?.preparing),
  ready: Boolean(flow?.ready),
  out_for_delivery: flow?.out_for_delivery !== false,
  completed: flow?.completed !== false,
  cancelled: Boolean(flow?.cancelled),
})

export const flowFromWhatsappTemplates = (templates = []) => {
  const byKey = new Map((templates || []).map(template => [template.template_key, template]))
  const flow = Object.entries(STATUS_TEMPLATE_KEYS).reduce((acc, [status, templateKey]) => ({
    ...acc,
    [status]: Boolean(byKey.get(templateKey)?.enabled),
  }), {})

  return normalizeOrderStatusFlow(flow)
}

const getStatusSequence = (orderType, flow = DEFAULT_ORDER_STATUS_FLOW) => {
  const normalizedFlow = normalizeOrderStatusFlow(flow)
  const sequence = [
    ORDER_STATUSES.PENDING,
  ]

  if (normalizedFlow.accepted) sequence.push(ORDER_STATUSES.ACCEPTED)
  if (normalizedFlow.preparing) sequence.push(ORDER_STATUSES.PREPARING)
  if (normalizedFlow.ready) sequence.push(ORDER_STATUSES.READY)

  if (orderType === 'delivery' && normalizedFlow.out_for_delivery) {
    sequence.push(ORDER_STATUSES.OUT_FOR_DELIVERY)
  }

  if (normalizedFlow.completed) sequence.push(ORDER_STATUSES.COMPLETED)
  return sequence
}

const getCanonicalSequence = (orderType) => {
  const sequence = [
    ORDER_STATUSES.PENDING,
    ORDER_STATUSES.ACCEPTED,
    ORDER_STATUSES.PREPARING,
    ORDER_STATUSES.READY,
  ]

  if (orderType === 'delivery') {
    sequence.push(ORDER_STATUSES.OUT_FOR_DELIVERY)
  }

  sequence.push(ORDER_STATUSES.COMPLETED)
  return sequence
}

export const getNextFlowStatus = (currentStatus, orderType, flow = DEFAULT_ORDER_STATUS_FLOW) => {
  const sequence = getStatusSequence(orderType, flow)
  const currentIndex = sequence.indexOf(currentStatus)

  if (currentIndex >= 0) return sequence[currentIndex + 1] || null

  const canonicalSequence = getCanonicalSequence(orderType)
  const canonicalIndex = canonicalSequence.indexOf(currentStatus)
  if (canonicalIndex < 0) return null

  return sequence.find(status => canonicalSequence.indexOf(status) > canonicalIndex) || null
}

export const getOrderStatusLabel = (status) => {
  return ORDER_STATUS_LABELS[status] || status
}

export const getOrderStatusColor = (status) => {
  return ORDER_STATUS_COLORS[status] || 'bg-gray-500'
}

export const getOrderStatusBadge = (status) => {
  const label = getOrderStatusLabel(status)
  const colorClass = getOrderStatusColor(status)
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} text-white`}>
      {label}
    </span>
  )
}

export const getOrderStatusMeta = (status) => {
  const meta = {
    [ORDER_STATUSES.PENDING]: {
      label: 'Pendente',
      color: 'bg-yellow-500',
      borderColor: 'border-yellow-500',
      bgColor: 'bg-yellow-500/10',
      textColor: 'text-yellow-500',
      description: 'Aguardando aceitação',
      icon: 'Clock',
    },
    [ORDER_STATUSES.ACCEPTED]: {
      label: 'Aceito',
      color: 'bg-blue-500',
      borderColor: 'border-blue-500',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-500',
      description: 'Pedido aceito',
      icon: 'CheckCircle',
    },
    [ORDER_STATUSES.PREPARING]: {
      label: 'Em Preparo',
      color: 'bg-orange-500',
      borderColor: 'border-orange-500',
      bgColor: 'bg-orange-500/10',
      textColor: 'text-orange-500',
      description: 'Em preparação',
      icon: 'ChefHat',
    },
    [ORDER_STATUSES.READY]: {
      label: 'Pronto',
      color: 'bg-purple-500',
      borderColor: 'border-purple-500',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-500',
      description: 'Pronto para entrega/retirada',
      icon: 'Package',
    },
    [ORDER_STATUSES.OUT_FOR_DELIVERY]: {
      label: 'Saiu para Entrega',
      color: 'bg-cyan-500',
      borderColor: 'border-cyan-500',
      bgColor: 'bg-cyan-500/10',
      textColor: 'text-cyan-500',
      description: 'Em rota de entrega',
      icon: 'Truck',
    },
    [ORDER_STATUSES.COMPLETED]: {
      label: 'Finalizado',
      color: 'bg-green-500',
      borderColor: 'border-green-500',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-500',
      description: 'Entregue',
      icon: 'CheckCircle2',
    },
    [ORDER_STATUSES.CANCELLED]: {
      label: 'Cancelado',
      color: 'bg-red-500',
      borderColor: 'border-red-500',
      bgColor: 'bg-red-500/10',
      textColor: 'text-red-500',
      description: 'Pedido cancelado',
      icon: 'X',
    },
  }

  return meta[status] || {
    label: status,
    color: 'bg-gray-500',
    borderColor: 'border-gray-500',
    bgColor: 'bg-gray-500/10',
    textColor: 'text-gray-500',
    description: '',
    icon: 'Circle',
  }
}

export const canTransitionTo = (currentStatus, newStatus, orderType, userRole, flow = DEFAULT_ORDER_STATUS_FLOW) => {
  if ([ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED].includes(currentStatus)) return false

  if (newStatus === ORDER_STATUSES.CANCELLED) return normalizeOrderStatusFlow(flow).cancelled

  const nextStatus = getNextFlowStatus(currentStatus, orderType, flow)

  if (newStatus !== nextStatus) return false

  if (userRole === 'kitchen') {
    const kitchenAllowed = [
      ORDER_STATUSES.ACCEPTED,
      ORDER_STATUSES.PREPARING,
      ORDER_STATUSES.READY,
    ].includes(newStatus)

    if (!kitchenAllowed) return false
  }

  return true
}

export const getNextStatuses = (currentStatus, orderType, userRole, flow = DEFAULT_ORDER_STATUS_FLOW) => {
  const nextStatus = getNextFlowStatus(currentStatus, orderType, flow)
  const allStatuses = [
    ...(nextStatus ? [nextStatus] : []),
    ...(normalizeOrderStatusFlow(flow).cancelled ? [ORDER_STATUSES.CANCELLED] : []),
  ]

  return allStatuses.filter(status => 
    canTransitionTo(currentStatus, status, orderType, userRole, flow)
  )
}

export const getTemplateKeyByStatus = (status, orderType) => {
  if (orderType === 'dine_in') return null

  const templates = {
    [ORDER_STATUSES.PENDING]: 'pedido_recebido',
    ...STATUS_TEMPLATE_KEYS,
  }

  return templates[status] || null
}

export const getElapsedTime = (createdAt) => {
  if (!createdAt) return '0 min'

  const created = new Date(createdAt)
  const now = new Date()
  const diffMs = now - created
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'agora'
  if (diffMins < 60) return `${diffMins} min`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ${diffMins % 60}min`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ${diffHours % 24}h`
}

export const isOrderDelayed = (createdAt, thresholdMinutes = 30) => {
  if (!createdAt) return false

  const created = new Date(createdAt)
  const now = new Date()
  const diffMins = Math.floor((now - created) / 60000)

  return diffMins > thresholdMinutes
}
