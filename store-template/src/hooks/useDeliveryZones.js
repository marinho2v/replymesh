import { useState, useCallback, useEffect } from 'react'
import { railsGetDeliveryZones } from '../services/storeApi'

export const useDeliveryZones = (activeOnly = true) => {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchZones = useCallback(async () => {
    try {
      setLoading(true)
      const data = await railsGetDeliveryZones()
      const next = activeOnly ? data.filter(z => z.is_active) : data
      setZones(next)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [activeOnly])

  useEffect(() => { fetchZones() }, [fetchZones])

  return { zones, loading, error, refetch: fetchZones }
}
