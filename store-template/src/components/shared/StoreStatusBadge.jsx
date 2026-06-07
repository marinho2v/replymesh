import { useMemo, useState } from 'react'
import { ChevronDown, Clock } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { usePublicStoreInfo } from '../../hooks/usePublicStoreInfo'
import { formatStoreHour, getEffectiveStoreStatus, normalizeTime } from '../../utils/storeSchedule'

const DAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
]

const StoreStatusBadge = ({ className = '' }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const { store, businessHours, loading } = usePublicStoreInfo()

  const today = new Date().getDay()
  const status = getEffectiveStoreStatus(store, businessHours)
  const orderedHours = useMemo(() => (
    DAYS.map(day => ({
      ...day,
      hour: businessHours?.find(item => Number(item.day_of_week) === day.value),
      isToday: day.value === today,
    }))
  ), [businessHours, today])

  const isOpen = Boolean(status?.isOpen)
  const closeTime = normalizeTime(status?.closesAt)
  const nextOpenAt = normalizeTime(status?.opensAt)
  const label = loading
    ? 'Verificando loja'
    : isOpen
      ? 'Loja aberta'
      : 'Loja fechada'
  const helper = isOpen && closeTime
    ? `Aberto até ${closeTime}`
    : !isOpen && nextOpenAt
      ? `Abre às ${nextOpenAt}`
      : status?.message || 'Ver horários'

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 text-left shadow-lg backdrop-blur transition-colors ${
          isOpen
            ? 'border-green-400/40 bg-green-950/55 hover:bg-green-950/75'
            : 'border-red-400/40 bg-red-950/55 hover:bg-red-950/75'
        } ${className}`}
      >
        <span className={`h-3 w-3 rounded-full ${isOpen ? 'bg-green-400' : 'bg-red-400'}`} />
        <span className="leading-tight">
          <span className="block text-sm font-semibold text-white">{label}</span>
          <span className="block text-xs text-gray-200">{helper}</span>
        </span>
        <ChevronDown size={18} className="text-gray-200" />
      </button>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Horário de funcionamento"
        size="sm"
      >
        <div className="space-y-4">
          <div className={`rounded-lg border p-4 ${
            isOpen ? 'border-green-700 bg-green-950/35' : 'border-red-700 bg-red-950/35'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${isOpen ? 'bg-green-400' : 'bg-red-400'}`} />
              <p className="font-semibold text-white">{label}</p>
            </div>
            <p className="mt-1 text-sm text-gray-300">{helper}</p>
          </div>

          <div className="space-y-2">
            {orderedHours.map(({ value, label: dayLabel, hour, isToday }) => (
              <div
                key={value}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                  isToday ? 'border-white/25 bg-white/10' : 'border-dark-600 bg-dark-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-gray-400" />
                  <span className="text-sm font-medium text-white">{dayLabel}</span>
                </div>
                <span className={`text-sm ${hour?.is_open ? 'text-gray-200' : 'text-red-300'}`}>
                  {loading ? 'Carregando' : formatStoreHour(hour)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </>
  )
}

export default StoreStatusBadge
