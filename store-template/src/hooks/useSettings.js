import { useState, useEffect } from 'react'
import { getStoreSettings, updateStoreSettings, getBusinessHours, updateBusinessHours } from '../services/settings'
import { toast } from 'sonner'

export const useSettings = () => {
  const [settings, setSettings] = useState(null)
  const [businessHours, setBusinessHours] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const [settingsData, hoursData] = await Promise.all([
          getStoreSettings(),
          getBusinessHours(),
        ])
        setSettings(settingsData)
        setBusinessHours(hoursData || [])
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const saveSettings = async (settingsData) => {
    try {
      const data = await updateStoreSettings(settingsData)
      setSettings(data)
      toast.success('Configuracoes salvas com sucesso')
      return { success: true, data }
    } catch (error) {
      console.error('Error saving settings:', error)
      const message = error.message || 'Erro ao salvar configuracoes'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const saveBusinessHours = async (hoursData) => {
    try {
      await updateBusinessHours(hoursData)
      const updatedHours = await getBusinessHours()
      setBusinessHours(updatedHours)
      toast.success('Horarios salvos com sucesso')
      return { success: true }
    } catch (error) {
      console.error('Error saving business hours:', error)
      const message = error.message || 'Erro ao salvar horarios'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  return { settings, businessHours, loading, error, saveSettings, saveBusinessHours }
}

export const useStoreStatus = () => {
  const [status, setStatus] = useState({ isOpen: false, message: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { isStoreOpen } = await import('../services/settings')
        const result = await isStoreOpen()
        setStatus(result)
      } catch (error) {
        console.error('Error checking store status:', error)
      } finally {
        setLoading(false)
      }
    }

    checkStatus()

    const interval = setInterval(checkStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  return { status, loading }
}
