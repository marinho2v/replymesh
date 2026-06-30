import {
  REPLYMESH_API_URL,
  ReplymeshApiError,
  currentStoreCompanySlug,
  getReplymeshAuthToken,
} from './replymeshApi'

const parsePayload = async (response) => {
  const contentType = response.headers.get('content-type') || ''
  return contentType.includes('application/json') ? response.json() : response.text()
}

const assertOk = async (response) => {
  const payload = await parsePayload(response)
  if (!response.ok || payload?.success === false) {
    throw new ReplymeshApiError(
      payload?.message || payload?.errors?.[0] || payload?.error || 'Nao foi possivel enviar a imagem.',
      { status: response.status, payload },
    )
  }
  return payload
}

export const uploadCloudMedia = async ({ file, mediaType, ownerType, ownerId }) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('media_type', mediaType)
  if (ownerType) formData.append('owner_type', ownerType)
  if (ownerId) formData.append('owner_id', ownerId)

  const response = await fetch(`${REPLYMESH_API_URL}/store/media`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${getReplymeshAuthToken()}`,
      'X-Company-Slug': currentStoreCompanySlug(),
    },
    body: formData,
  })

  const payload = await assertOk(response)
  return payload.media
}

export const deleteCloudMedia = async (storageKey) => {
  const response = await fetch(`${REPLYMESH_API_URL}/store/media`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getReplymeshAuthToken()}`,
      'X-Company-Slug': currentStoreCompanySlug(),
    },
    body: JSON.stringify({ storage_key: storageKey }),
  })

  return assertOk(response)
}
