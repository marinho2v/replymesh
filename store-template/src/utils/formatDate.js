import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) return ''
  return format(parseISO(date), formatStr, { locale: ptBR })
}

export const formatDateTime = (date) => {
  if (!date) return ''
  return format(parseISO(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export const formatTime = (date) => {
  if (!date) return ''
  return format(parseISO(date), 'HH:mm', { locale: ptBR })
}

export const formatRelativeTime = (date) => {
  if (!date) return ''
  return formatDistanceToNow(parseISO(date), { locale: ptBR, addSuffix: true })
}

export const formatTimeOnly = (time) => {
  if (!time) return ''
  return time
}
