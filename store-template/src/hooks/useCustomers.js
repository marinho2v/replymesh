import { useState, useEffect } from 'react'
import { getCustomers, getCustomerById, getCustomerByPhone, getCustomerOrders, exportCustomersToCsv, syncCustomersFromOrders } from '../services/customers'
import { toast } from 'sonner'

export const useCustomers = (filters = {}) => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true)
        await syncCustomersFromOrders()
        const data = await getCustomers(filters)
        setCustomers(data)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [JSON.stringify(filters)])

  const refetch = () => {
    setLoading(true)
    syncCustomersFromOrders()
      .then(() => getCustomers(filters))
      .then(setCustomers)
      .catch(setError)
      .finally(() => setLoading(false))
  }

  const exportToCsv = async () => {
    try {
      await exportCustomersToCsv(customers)
      toast.success('Clientes exportados com sucesso')
    } catch (error) {
      toast.error('Erro ao exportar clientes')
    }
  }

  return { customers, loading, error, refetch, exportToCsv }
}

export const useCustomer = (customerId) => {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true)
        const data = await getCustomerById(customerId)
        setCustomer(data)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (customerId) {
      fetchCustomer()
    }
  }, [customerId])

  return { customer, loading, error }
}

export const useCustomerOrders = (customerId) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        const data = await getCustomerOrders(customerId)
        setOrders(data)
      } catch (error) {
        console.error('Error fetching customer orders:', error)
      } finally {
        setLoading(false)
      }
    }

    if (customerId) {
      fetchOrders()
    }
  }, [customerId])

  return { orders, loading }
}

export const useCustomerByPhone = (phone) => {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (phone) {
      setLoading(true)
      getCustomerByPhone(phone)
        .then(setCustomer)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [phone])

  return { customer, loading }
}
