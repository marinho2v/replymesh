import { request } from './replymeshApi'
import { STORE_COMPANY_ID } from './storeApi'

const headers = () => ({
  'X-Company-Id': localStorage.getItem('replymesh_store_company_id') || STORE_COMPANY_ID,
})

let cachedKey = ''
let cachedPromise = null

const fetchReport = (startDate, endDate) => {
  const key = `${startDate || ''}:${endDate || ''}`
  if (key !== cachedKey || !cachedPromise) {
    cachedKey = key
    cachedPromise = request('/store/reports', {
      params: { date_from: startDate, date_to: endDate },
      headers: headers(),
    }).catch((error) => {
      cachedPromise = null
      throw error
    })
  }
  return cachedPromise
}

export const getDashboardStats = async (startDate, endDate) => {
  const report = await fetchReport(startDate, endDate)
  return {
    totalRevenue: report.summary.received_revenue,
    grossRevenue: report.summary.gross_sales,
    cancelledRevenue: report.summary.cancelled_revenue,
    totalOrders: report.summary.total_orders,
    completedOrders: report.summary.completed_orders,
    cancelledOrders: report.summary.cancelled_orders,
    openOrders: report.summary.open_orders,
    averageTicket: report.summary.average_ticket,
  }
}

export const getSalesByPeriod = async (startDate, endDate) =>
  (await fetchReport(startDate, endDate)).orders.filter((order) => order.status === 'completed')

export const getTopProducts = async (startDate, endDate, limit = 10) =>
  (await fetchReport(startDate, endDate)).top_products.slice(0, limit)

export const getOrdersByStatus = async (startDate, endDate) =>
  (await fetchReport(startDate, endDate)).status_totals

export const getReportOrders = async (startDate, endDate) =>
  (await fetchReport(startDate, endDate)).orders

export const getCashReport = async (startDate, endDate) => {
  const report = await fetchReport(startDate, endDate)
  return {
    summary: {
      grossSales: report.summary.gross_sales,
      receivedRevenue: report.summary.received_revenue,
      totalCost: report.summary.total_cost,
      grossProfit: report.summary.gross_profit,
      profitMargin: report.summary.profit_margin,
      cancelledRevenue: report.summary.cancelled_revenue,
      totalOrders: report.summary.total_orders,
      completedOrders: report.summary.completed_orders,
      cancelledOrders: report.summary.cancelled_orders,
      openOrders: report.summary.open_orders,
      averageTicket: report.summary.average_ticket,
      totalProductsSold: report.summary.total_products_sold,
    },
    statusTotals: report.status_totals,
    paymentTotals: report.payment_totals,
    topProducts: report.top_products,
    hourlySales: report.hourly_sales,
  }
}
