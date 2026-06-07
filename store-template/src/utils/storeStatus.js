import { isStoreOpen } from '../services/settings'

export const checkStoreStatus = async () => {
  try {
    const result = await isStoreOpen()
    return result
  } catch (error) {
    console.error('Error checking store status:', error)
    return { isOpen: false, message: 'Erro ao verificar status da loja' }
  }
}
