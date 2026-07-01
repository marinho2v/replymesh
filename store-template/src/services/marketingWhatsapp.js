import { request } from './replymeshApi'
import { STORE_COMPANY_ID } from './storeApi'

const headers = () => ({ 'X-Company-Id': localStorage.getItem('replymesh_store_company_id') || STORE_COMPANY_ID })

export const DEFAULT_MARKETING_MESSAGE = [
  'Ola, {nome}! 😊',
  '',
  'Temos uma oferta especial para voce.',
  '{cupom}',
  '',
  'Acesse:',
  '{link_loja}',
  '',
  'Responda SAIR para nao receber mais promocoes.',
].join('\n')

export const getMarketingCustomers = (filter = 'all') => request('/store/marketing/customers', {
  params: { filter }, headers: headers(),
}).then((payload) => payload.customers || [])

export const getMarketingCampaigns = () => request('/store/marketing/campaigns', {
  headers: headers(),
}).then((payload) => payload.campaigns || [])

export const createMarketingCampaign = (payload) => request('/store/marketing/campaigns', {
  method: 'POST', body: payload, headers: headers(),
}).then((response) => response.campaign)

export const sendIndividualMarketingMessage = (phone, message) => request('/store/marketing/send_individual', {
  method: 'POST', body: { phone, message }, headers: headers(),
})

export const sendMarketingCampaign = (id) => request(`/store/marketing/campaigns/${id}/send`, {
  method: 'POST', body: { confirm: true }, headers: headers(),
})

export const getSalesRecoveryCustomers = (days = 30) => request('/store/sales_recovery/customers', {
  params: { days }, headers: headers(),
}).then((payload) => payload.customers || [])

export const getSalesRecoveryAutomation = () => request('/store/sales_recovery', {
  headers: headers(),
})

export const updateSalesRecoverySettings = (settings) => request('/store/sales_recovery/settings', {
  method: 'PATCH', body: { settings }, headers: headers(),
}).then((payload) => payload.settings)

export const runSalesRecoveryEngine = () => request('/store/sales_recovery/run', {
  method: 'POST', headers: headers(),
})

export const formatMoney = (cents) => (Number(cents || 0) / 100).toLocaleString('pt-BR', {
  style: 'currency', currency: 'BRL',
})
