import { useState, useEffect } from 'react'
import { getCoupons, getCouponById, createCoupon, updateCoupon, deleteCoupon, validateCoupon } from '../services/coupons'
import { toast } from 'sonner'

export const useCoupons = (activeOnly = false) => {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoading(true)
        const data = await getCoupons(activeOnly)
        setCoupons(data)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCoupons()
  }, [activeOnly])

  const refetch = () => {
    setLoading(true)
    getCoupons(activeOnly)
      .then(setCoupons)
      .catch(setError)
      .finally(() => setLoading(false))
  }

  return { coupons, loading, error, refetch }
}

export const useCoupon = (couponId) => {
  const [coupon, setCoupon] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCoupon = async () => {
      try {
        setLoading(true)
        const data = await getCouponById(couponId)
        setCoupon(data)
      } catch (error) {
        console.error('Error fetching coupon:', error)
      } finally {
        setLoading(false)
      }
    }

    if (couponId) {
      fetchCoupon()
    }
  }, [couponId])

  return { coupon, loading }
}

export const useCouponActions = () => {
  const [loading, setLoading] = useState(false)

  const create = async (couponData) => {
    setLoading(true)
    try {
      const data = await createCoupon(couponData)
      toast.success('Cupom criado com sucesso')
      return { success: true, coupon: data }
    } catch (error) {
      console.error('Error creating coupon:', error)
      toast.error('Erro ao criar cupom')
      return { success: false }
    } finally {
      setLoading(false)
    }
  }

  const update = async (couponId, couponData) => {
    setLoading(true)
    try {
      const data = await updateCoupon(couponId, couponData)
      toast.success('Cupom atualizado com sucesso')
      return { success: true, coupon: data }
    } catch (error) {
      console.error('Error updating coupon:', error)
      toast.error('Erro ao atualizar cupom')
      return { success: false }
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async (couponId, isActive) => {
    setLoading(true)
    try {
      await updateCoupon(couponId, { is_active: isActive })
      toast.success(isActive ? 'Cupom ativado' : 'Cupom desativado')
      return { success: true }
    } catch (error) {
      console.error('Error toggling coupon status:', error)
      toast.error('Erro ao alterar status')
      return { success: false }
    } finally {
      setLoading(false)
    }
  }

  const remove = async (couponId) => {
    setLoading(true)
    try {
      await deleteCoupon(couponId)
      toast.success('Cupom removido')
      return { success: true }
    } catch (error) {
      console.error('Error deleting coupon:', error)
      toast.error('Erro ao remover cupom')
      return { success: false }
    } finally {
      setLoading(false)
    }
  }

  return { loading, create, update, toggleStatus, remove }
}

export const useCouponValidation = () => {
  const [validating, setValidating] = useState(false)

  const validate = async (code, orderTotal, customerId) => {
    setValidating(true)
    try {
      const result = await validateCoupon(code, orderTotal, customerId)
      return result
    } finally {
      setValidating(false)
    }
  }

  return { validate, validating }
}
