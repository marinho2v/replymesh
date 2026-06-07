import { useState, useEffect } from 'react'
import {
  getCashReport,
  getDashboardStats,
  getOrdersByStatus,
  getReportOrders,
  getSalesByPeriod,
  getTopProducts,
} from '../services/reports'

const calculateProfitSummary = (orders = []) => {
  const receivedOrders = orders.filter(order => order.status === 'completed')
  const totalCost = receivedOrders.reduce((sum, order) => (
    sum + Number(order.total_cost || 0) +
    ((Number(order.total_cost || 0) > 0) ? 0 : (order.order_items || []).reduce((itemSum, item) => itemSum + Number(item.total_cost_at_sale || 0), 0))
  ), 0)
  const grossProfit = receivedOrders.reduce((sum, order) => (
    sum + Number(order.gross_profit || 0) +
    ((Number(order.gross_profit || 0) !== 0) ? 0 : (order.order_items || []).reduce((itemSum, item) => itemSum + Number(item.gross_profit_at_sale || 0), 0))
  ), 0)
  const revenue = receivedOrders.reduce((sum, order) => sum + Number(order.total || 0), 0)

  return {
    totalCost,
    grossProfit,
    profitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
  }
}

export const getReportDateRange = (filters = {}) => {
  const now = new Date()
  const end = filters.endDate ? new Date(`${filters.endDate}T23:59:59.999`) : now
  const start = filters.startDate ? new Date(`${filters.startDate}T00:00:00`) : new Date(now)

  if (!filters.startDate) {
    switch (filters.period) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        break
      case '7days':
        start.setDate(now.getDate() - 7)
        break
      case 'week':
        start.setDate(now.getDate() - 7)
        break
      case 'month':
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        break
      case '90days':
        start.setDate(now.getDate() - 90)
        break
      case '30days':
      default:
        start.setDate(now.getDate() - 30)
        break
    }
  }

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  }
}

export const useReports = (filters = {}) => {
  const [summary, setSummary] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [ordersByStatus, setOrdersByStatus] = useState({})
  const [paymentTotals, setPaymentTotals] = useState({})
  const [hourlySales, setHourlySales] = useState([])
  const [reportOrders, setReportOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true)
        
        const { startDate, endDate } = getReportDateRange(filters)

        const [summaryData, topProductsData, ordersByStatusData, cashReport, ordersData] = await Promise.all([
          getDashboardStats(startDate, endDate),
          getTopProducts(startDate, endDate, 10),
          getOrdersByStatus(startDate, endDate),
          getCashReport(startDate, endDate),
          getReportOrders(startDate, endDate),
        ])

        const profitSummary = calculateProfitSummary(ordersData || [])
        setSummary({
          ...summaryData,
          ...(cashReport.summary || {}),
          ...profitSummary,
        })
        setTopProducts(cashReport.topProducts?.length ? cashReport.topProducts : topProductsData)
        setOrdersByStatus(cashReport.statusTotals || ordersByStatusData)
        setPaymentTotals(cashReport.paymentTotals || {})
        setHourlySales(cashReport.hourlySales || [])
        setReportOrders(ordersData || [])
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [JSON.stringify(filters)])

  const refetch = () => {
    setLoading(true)
    const { startDate, endDate } = getReportDateRange(filters)

    Promise.all([
      getDashboardStats(startDate, endDate),
      getTopProducts(startDate, endDate, 10),
      getOrdersByStatus(startDate, endDate),
      getCashReport(startDate, endDate),
      getReportOrders(startDate, endDate),
    ])
      .then(([summaryData, topProductsData, ordersByStatusData, cashReport, ordersData]) => {
        const profitSummary = calculateProfitSummary(ordersData || [])
        setSummary({
          ...summaryData,
          ...(cashReport.summary || {}),
          ...profitSummary,
        })
        setTopProducts(cashReport.topProducts?.length ? cashReport.topProducts : topProductsData)
        setOrdersByStatus(cashReport.statusTotals || ordersByStatusData)
        setPaymentTotals(cashReport.paymentTotals || {})
        setHourlySales(cashReport.hourlySales || [])
        setReportOrders(ordersData || [])
        setError(null)
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }

  return {
    summary,
    topProducts,
    ordersByStatus,
    paymentTotals,
    hourlySales,
    reportOrders,
    loading,
    error,
    refetch,
  }
}

export const useSalesChart = (period = '30days') => {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true)
        
        let startDate
        const endDate = new Date().toISOString()
        
        switch (period) {
          case '7days':
            startDate = new Date(new Date().setDate(new Date().getDate() - 7)).toISOString()
            break
          case '30days':
            startDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString()
            break
          case '90days':
            startDate = new Date(new Date().setDate(new Date().getDate() - 90)).toISOString()
            break
          default:
            startDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString()
        }

        const data = await getSalesByPeriod(startDate, endDate)
        setSales(data)
      } catch (error) {
        console.error('Error fetching sales chart:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSales()
  }, [period])

  return { sales, loading }
}
