const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org'

export const LOCATION_DISTANCE_WARNING_METERS = 2500

export const formatLocationAccuracy = (accuracy) => {
  const numericAccuracy = Number(accuracy || 0)
  if (!Number.isFinite(numericAccuracy) || numericAccuracy <= 0) return ''
  if (numericAccuracy >= 1000) return `${(numericAccuracy / 1000).toFixed(1).replace('.', ',')} km`
  return `${Math.round(numericAccuracy)} m`
}

export const formatDistance = (distance) => {
  const numericDistance = Number(distance || 0)
  if (!Number.isFinite(numericDistance) || numericDistance <= 0) return ''
  if (numericDistance >= 1000) return `${(numericDistance / 1000).toFixed(1).replace('.', ',')} km`
  return `${Math.round(numericDistance)} m`
}

export const buildMapsUrl = (latitude, longitude) => (
  `https://www.google.com/maps?q=${latitude},${longitude}`
)

export const getCurrentBrowserPosition = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) {
    reject(new Error('Seu navegador nao suporta localizacao'))
    return
  }

  navigator.geolocation.getCurrentPosition(
    resolve,
    reject,
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    }
  )
})

export const reverseGeocodeCoordinates = async (latitude, longitude) => {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(latitude),
    lon: String(longitude),
    addressdetails: '1',
    'accept-language': 'pt-BR',
  })

  const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error('Nao foi possivel converter sua localizacao em endereco')
  }

  const data = await response.json()
  const address = data.address || {}

  return {
    street: address.road || address.pedestrian || address.residential || '',
    number: address.house_number || '',
    neighborhood: address.suburb || address.neighbourhood || address.city_district || address.village || '',
    city: address.city || address.town || address.municipality || '',
    state: address.state || '',
    zipCode: String(address.postcode || '').replace(/\D/g, ''),
    formattedAddress: data.display_name || '',
    provider: 'nominatim',
  }
}

export const geocodeAddress = async ({
  zipCode,
  street,
  number,
  neighborhood,
  city,
  state,
}) => {
  const query = [
    street,
    number,
    neighborhood,
    city,
    state,
    zipCode,
    'Brasil',
  ].filter(Boolean).join(', ')

  if (!query.trim()) return null

  const params = new URLSearchParams({
    format: 'jsonv2',
    q: query,
    limit: '1',
    addressdetails: '1',
    countrycodes: 'br',
    'accept-language': 'pt-BR',
  })

  const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error('Nao foi possivel validar o CEP informado')
  }

  const data = await response.json()
  const result = data?.[0]
  if (!result?.lat || !result?.lon) return null

  return {
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    formattedAddress: result.display_name || '',
  }
}

export const calculateDistanceMeters = (origin, destination) => {
  if (!origin || !destination) return null

  const lat1 = Number(origin.latitude)
  const lon1 = Number(origin.longitude)
  const lat2 = Number(destination.latitude)
  const lon2 = Number(destination.longitude)

  if ([lat1, lon1, lat2, lon2].some(value => !Number.isFinite(value))) {
    return null
  }

  const toRadians = value => (value * Math.PI) / 180
  const earthRadiusMeters = 6371000
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) ** 2

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
