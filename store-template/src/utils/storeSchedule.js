const normalizeTime = (value) => {
  if (!value) return ''
  const match = String(value).match(/^(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]}` : ''
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

  return (hours * 60) + minutes
}

const scheduleForDay = (businessHours = [], day) => (
  businessHours.find(hour => Number(hour.day_of_week) === Number(day))
)

const previousDay = (day) => (day === 0 ? 6 : day - 1)

const evaluateSchedule = (schedule, date, carryover = false) => {
  if (!schedule) return null
  if (!schedule.is_open) return { isOpen: false, message: schedule.closed_message || 'Fechado hoje' }

  const openTime = normalizeTime(schedule.open_time)
  const closeTime = normalizeTime(schedule.close_time)
  const openMinutes = timeToMinutes(openTime)
  const closeMinutes = timeToMinutes(closeTime)

  if (openMinutes === null || closeMinutes === null) {
    return { isOpen: true, message: 'Aberto', opensAt: openTime, closesAt: closeTime }
  }

  const currentMinutes = (date.getHours() * 60) + date.getMinutes()
  const closesAfterMidnight = closeMinutes < openMinutes

  if (carryover && !closesAfterMidnight) return null

  const isOpen = closesAfterMidnight
    ? carryover
      ? currentMinutes <= closeMinutes
      : currentMinutes >= openMinutes || currentMinutes <= closeMinutes
    : currentMinutes >= openMinutes && currentMinutes <= closeMinutes

  return {
    isOpen,
    opensAt: openTime,
    closesAt: closeTime,
    message: isOpen ? '' : 'Fora do horário de atendimento',
  }
}

export const getEffectiveStoreStatus = (store, businessHours = [], date = new Date()) => {
  const day = date.getDay()
  const carryoverStatus = evaluateSchedule(scheduleForDay(businessHours, previousDay(day)), date, true)
  if (carryoverStatus?.isOpen) return { ...carryoverStatus, source: 'business_hours' }

  const todayStatus = evaluateSchedule(scheduleForDay(businessHours, day), date)
  if (todayStatus) return { ...todayStatus, source: 'business_hours' }

  return {
    isOpen: store?.store_status === 'open',
    message: 'Ver horários',
    source: 'store_status',
  }
}

export const formatStoreHour = (hour) => {
  if (!hour?.is_open) return 'Fechado'

  const openTime = normalizeTime(hour.open_time)
  const closeTime = normalizeTime(hour.close_time)

  if (!openTime || !closeTime) return 'Aberto'
  return `${openTime} às ${closeTime}`
}

export { normalizeTime }
