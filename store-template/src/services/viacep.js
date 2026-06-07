import axios from 'axios'

const VIA_CEP_API = 'https://viacep.com.br/ws'
const CEP_NOT_FOUND_MESSAGE = 'CEP nao encontrado. Confira o numero ou preencha o endereco manualmente.'

export const searchByCEP = async (cepValue) => {
  try {
    const cleanCEP = String(cepValue || '').replace(/\D/g, '')
    if (cleanCEP.length !== 8) {
      throw new Error(CEP_NOT_FOUND_MESSAGE)
    }

    const response = await axios.get(`${VIA_CEP_API}/${cleanCEP}/json/`)

    if (response.data?.erro) {
      throw new Error(CEP_NOT_FOUND_MESSAGE)
    }

    return {
      address: {
        street: response.data.logradouro || '',
        neighborhood: response.data.bairro || '',
        city: response.data.localidade || '',
        state: response.data.uf || '',
        zipCode: String(response.data.cep || cleanCEP).replace(/\D/g, ''),
      },
    }
  } catch (error) {
    console.warn('CEP nao encontrado ou indisponivel:', error)
    throw new Error(error?.message || CEP_NOT_FOUND_MESSAGE)
  }
}
