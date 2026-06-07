import { useCallback, useEffect, useRef, useState } from 'react'
import { searchByCEP } from '../services/viacep'
import {
  buildMapsUrl,
  formatLocationAccuracy,
  getCurrentBrowserPosition,
  reverseGeocodeCoordinates,
} from '../services/geolocation'

const cleanCep = (value = '') => String(value || '').replace(/\D/g, '').slice(0, 8)

export const formatCep = (value = '') => {
  const cep = cleanCep(value)
  if (cep.length <= 5) return cep
  return `${cep.slice(0, 5)}-${cep.slice(5)}`
}

export const useCheckoutLocation = ({
  zipCode,
  address,
  onCepAddress,
  debounceMs = 650,
} = {}) => {
  const [cepLoading, setCepLoading] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [cepError, setCepError] = useState('')
  const [gpsError, setGpsError] = useState('')
  const [gpsSuggestion, setGpsSuggestion] = useState(null)
  const [gpsWarning, setGpsWarning] = useState('')
  const [distanceWarning, setDistanceWarning] = useState('')
  const lastCepRef = useRef('')

  const searchCep = useCallback(async (cepValue) => {
    const cep = cleanCep(cepValue)
    if (cep.length !== 8) return null

    setCepLoading(true)
    setCepError('')

    try {
      const result = await searchByCEP(cep)
      lastCepRef.current = cep
      onCepAddress?.({
        ...result.address,
        zipCode: cleanCep(result.address.zipCode || cep),
      })
      return result.address
    } catch (error) {
      console.warn('CEP opcional nao encontrado; preenchimento manual liberado:', error)
      setCepError('')
      lastCepRef.current = cep
      return null
    } finally {
      setCepLoading(false)
    }
  }, [onCepAddress])

  useEffect(() => {
    const cep = cleanCep(zipCode)
    if (cep.length === 0) {
      setCepError('')
      lastCepRef.current = ''
      return undefined
    }
    if (cep.length !== 8 || cep === lastCepRef.current) return undefined

    const timeoutId = window.setTimeout(() => {
      searchCep(cep)
    }, debounceMs)

    return () => window.clearTimeout(timeoutId)
  }, [debounceMs, searchCep, zipCode])

  const useCurrentLocation = useCallback(async () => {
    setGpsLoading(true)
    setGpsError('')
    setGpsWarning('')
    setDistanceWarning('')

    try {
      const position = await getCurrentBrowserPosition()
      const { latitude, longitude, accuracy } = position.coords
      const numericAccuracy = Number(accuracy || 0)
      const reverseAddress = await reverseGeocodeCoordinates(latitude, longitude)
      const gpsMeta = {
        latitude,
        longitude,
        accuracy: numericAccuracy,
        accuracyLabel: formatLocationAccuracy(numericAccuracy),
        mapsUrl: buildMapsUrl(latitude, longitude),
        provider: reverseAddress.provider,
        formattedAddress: reverseAddress.formattedAddress || reverseAddress.fullAddress || '',
      }

      const suggestion = {
        ...reverseAddress,
        locationMeta: gpsMeta,
      }

      setGpsWarning('Confira se o endereco esta correto. A localizacao pode ser aproximada. Informe numero, complemento e ponto de referencia.')

      setGpsSuggestion({
        ...suggestion,
      })

      return {
        suggestion,
        hasDistanceWarning: false,
      }
    } catch (error) {
      const message = error?.code === 1
        ? 'Permissao de localizacao negada. Voce pode continuar preenchendo o endereco manualmente.'
        : error?.message || 'Nao conseguimos buscar sua localizacao. Preencha o endereco manualmente.'

      setGpsError(message)
      throw new Error(message)
    } finally {
      setGpsLoading(false)
    }
  }, [address, zipCode])

  const clearLocationFeedback = useCallback(() => {
    setGpsError('')
    setGpsWarning('')
    setDistanceWarning('')
  }, [])

  const clearSuggestion = useCallback(() => {
    setGpsSuggestion(null)
    clearLocationFeedback()
  }, [clearLocationFeedback])

  return {
    cepLoading,
    gpsLoading,
    cepError,
    gpsError,
    gpsSuggestion,
    gpsWarning,
    distanceWarning,
    searchCep,
    useCurrentLocation,
    clearLocationFeedback,
    clearSuggestion,
  }
}
