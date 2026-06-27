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

const zoneTerms = (zone) => [
  { label: zone.name, source: 'nome' },
  { label: zone.slug, source: 'slug' },
  ...parseAliases(zone.aliases).map((label) => ({ label, source: 'alias' })),
].map((term) => ({ ...term, normalized: normalizeDeliveryText(term.label) })).filter(term => term.normalized)

const scoreZone = (zone, address) => {
  const terms = zoneTerms(zone)
  const candidates = addressCandidates(address)
  let score = 0
  let reason = null
  terms.forEach((term) => candidates.forEach((candidate) => {
    let nextScore = 0
    if (candidate === term.normalized) nextScore = 100
    else if (candidate.includes(term.normalized)) nextScore = 85
    else if (term.normalized.includes(candidate) && candidate.length >= 4) nextScore = 75

    if (nextScore > score) {
      score = nextScore
      reason = { source: term.source, label: term.label, candidate }
    }
  }))
  return { score, reason }
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
    .map((zone) => {
      const scored = scoreZone(zone, address)
      return { zone, score: scored.score, reason: scored.reason }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || Number(a.zone.match_priority || 100) - Number(b.zone.match_priority || 100))
  return { zone: matches[0]?.zone || null, match: matches[0] || null, candidates: addressCandidates(address), matches }
}

export const getDeliveryZoneByName = async (name) => (await matchDeliveryZone(name)).zone
export const getDeliveryZoneByNeighborhoodFuzzy = getDeliveryZoneByName
