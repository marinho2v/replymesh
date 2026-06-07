export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export const parseCurrency = (value) => {
  if (typeof value === 'number') return value
  const cleaned = value.replace(/\D/g, '')
  return Number(cleaned) / 100
}
