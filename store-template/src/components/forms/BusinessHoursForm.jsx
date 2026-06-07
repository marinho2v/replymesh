import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Clock } from 'lucide-react'

const BusinessHoursForm = ({ hours, onChange, onSave, loading }) => {
  const daysOfWeek = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda' },
    { value: 2, label: 'Terça' },
    { value: 3, label: 'Quarta' },
    { value: 4, label: 'Quinta' },
    { value: 5, label: 'Sexta' },
    { value: 6, label: 'Sábado' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={20} className="text-gray-400" />
        <h3 className="text-lg font-bold text-white">Horário de Funcionamento</h3>
      </div>

      {daysOfWeek.map((day) => {
        const dayHours = hours?.find(h => h.day_of_week === day.value) || {
          day_of_week: day.value,
          is_open: false,
          open_time: '',
          close_time: '',
        }
        
        return (
          <div key={day.value} className="flex items-center gap-4 p-3 bg-dark-900 rounded-lg">
            <span className="text-white w-24">{day.label}</span>
            <label className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                checked={dayHours.is_open} 
                onChange={(e) => {
                  onChange(hours?.map(h => 
                    h.day_of_week === day.value 
                      ? { ...h, is_open: e.target.checked } 
                      : h
                  ))
                }}
                className="rounded" 
              />
              <span className="text-white text-sm">Aberto</span>
            </label>
            {dayHours.is_open && (
              <>
                <Input 
                  type="time" 
                  value={dayHours.open_time || ''} 
                  onChange={(e) => {
                    onChange(hours?.map(h => 
                      h.day_of_week === day.value 
                        ? { ...h, open_time: e.target.value } 
                        : h
                    ))
                  }}
                  className="w-32"
                />
                <span className="text-gray-400">às</span>
                <Input 
                  type="time" 
                  value={dayHours.close_time || ''} 
                  onChange={(e) => {
                    onChange(hours?.map(h => 
                      h.day_of_week === day.value 
                        ? { ...h, close_time: e.target.value } 
                        : h
                    ))
                  }}
                  className="w-32"
                />
              </>
            )}
          </div>
        )
      })}

      <Button onClick={onSave} loading={loading} className="w-full">
        Salvar Horários
      </Button>
    </div>
  )
}

export default BusinessHoursForm
