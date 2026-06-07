import {
  railsCreateDeliveryZone,
  railsDeleteDeliveryZone,
  railsGetDeliveryZones,
  railsUpdateDeliveryZone,
} from './storeApi'

export const normalizeDeliveryText = (value = '') => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const parseAliases = (aliases) => Array.isArray(aliases)
  ? aliases.filter(Boolean)
  : String(aliases || '').split(/[\n,;]+/).map((value) => value.trim()).filter(Boolean)

const addressCandidates = (address = {}) => [
  address.neighborhood,
  address.complement,
  address.street,
  address.city,
  address.zipCode || address.zip_code || address.cep,
].filter(Boolean).map(normalizeDeliveryText)

const scoreZone = (zone, address) => {
  const names = [zone.name, zone.slug, ...parseAliases(zone.aliases)].map(normalizeDeliveryText).filter(Boolean)
  const candidates = addressCandidates(address)
  let score = 0
  names.forEach((name) => candidates.forEach((candidate) => {
    if (candidate === name) score = Math.max(score, 100)
    else if (candidate.includes(name)) score = Math.max(score, 85)
    else if (name.includes(candidate) && candidate.length >= 4) score = Math.max(score, 75)
  }))
  return score
}

export const getDeliveryZones = async (activeOnly = true) => {
  const zones = await railsGetDeliveryZones()
  return activeOnly ? zones.filter((zone) => zone.is_active !== false) : zones
}

export const getDeliveryZoneById = async (id) =>
  (await getDeliveryZones(false)).find((zone) => String(zone.id) === String(id)) || null

export const createDeliveryZone = railsCreateDeliveryZone
export const updateDeliveryZone = railsUpdateDeliveryZone
export const deleteDeliveryZone = railsDeleteDeliveryZone

export const matchDeliveryZone = async (addressOrNeighborhood) => {
  const address = typeof addressOrNeighborhood === 'string'
    ? { neighborhood: addressOrNeighborhood }
    : addressOrNeighborhood || {}
  const zones = await getDeliveryZones(true)
  const matches = zones
    .map((zone) => ({ zone, score: scoreZone(zone, address) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || Number(a.zone.match_priority || 100) - Number(b.zone.match_priority || 100))
  return { zone: matches[0]?.zone || null, match: matches[0] || null, candidates: addressCandidates(address), matches }
}

export const getDeliveryZoneByName = async (name) => (await matchDeliveryZone(name)).zone
export const getDeliveryZoneByNeighborhoodFuzzy = getDeliveryZoneByName
