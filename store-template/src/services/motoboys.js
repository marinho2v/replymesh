import { request } from './replymeshApi'
import { STORE_COMPANY_ID, railsAssignMotoboyToOrder } from './storeApi'

const companyId = () => localStorage.getItem('replymesh_store_company_id') || STORE_COMPANY_ID
const headers = () => ({ 'X-Company-Id': companyId() })

const dateOnly = (value) => value ? String(value).slice(0, 10) : undefined

const deliveryParams = (filters = {}) => ({
  start_date: filters.startDate,
  end_date: filters.endDate,
  motoboy_id: filters.motoboyId,
  status: filters.status,
  search: filters.search,
  limit: filters.limit || 200,
})

export const listMotoboys = ({ activeOnly = false } = {}) =>
  request('/store/motoboys', {
    params: activeOnly ? { active: true } : {},
    headers: headers(),
  }).then((payload) => payload.motoboys || [])

export const createMotoboy = (motoboy) =>
  request('/store/motoboys', {
    method: 'POST',
    body: { motoboy },
    headers: headers(),
  }).then((payload) => payload.motoboy)

export const updateMotoboy = (motoboyId, motoboy) =>
  request(`/store/motoboys/${encodeURIComponent(motoboyId)}`, {
    method: 'PATCH',
    body: { motoboy },
    headers: headers(),
  }).then((payload) => payload.motoboy)

export const deleteMotoboy = (motoboyId) =>
  request(`/store/motoboys/${encodeURIComponent(motoboyId)}`, {
    method: 'DELETE',
    headers: headers(),
  })

export const listMotoboyAdjustments = (filters = {}) =>
  request('/store/motoboy_adjustments', {
    params: {
      start_date: dateOnly(filters.startDate),
      end_date: dateOnly(filters.endDate),
      motoboy_id: filters.motoboyId,
      limit: filters.limit || 200,
    },
    headers: headers(),
  }).then((payload) => payload.adjustments || [])

export const createMotoboyAdjustment = (adjustment) =>
  request('/store/motoboy_adjustments', {
    method: 'POST',
    body: { adjustment },
    headers: headers(),
  }).then((payload) => payload.adjustment)

export const deleteMotoboyAdjustment = (adjustmentId) =>
  request(`/store/motoboy_adjustments/${encodeURIComponent(adjustmentId)}`, {
    method: 'DELETE',
    headers: headers(),
  })

export const assignMotoboyToOrder = (orderId, motoboyId, notes = null) =>
  railsAssignMotoboyToOrder(orderId, motoboyId, { companyId: companyId(), notes })

export const updateDeliveryStatus = (deliveryId, status) =>
  request(`/store/deliveries/${encodeURIComponent(deliveryId)}/status`, {
    method: 'PATCH',
    body: { delivery_status: status },
    headers: headers(),
  }).then((payload) => payload.delivery)

export const listDeliveryHistory = (filters = {}) =>
  request('/store/deliveries', {
    params: deliveryParams(filters),
    headers: headers(),
  }).then((payload) => payload.deliveries || [])

export const getDeliveryReport = (startDate, endDate) =>
  request('/store/motoboys/report', {
    params: { start_date: startDate, end_date: endDate },
    headers: headers(),
  }).then((payload) => payload.report || { summary: {}, ranking: [] })
