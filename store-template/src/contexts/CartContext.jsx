import { createContext, useContext, useState, useEffect } from 'react'
import { selectedOptionsKey } from '../utils/productOptions'

const CartContext = createContext(null)

const getItemUnitPrice = (item) => Number(item.unit_price || 0)
const getItemQuantity = (item) => Number(item.quantity || 0)
const getItemTotal = (item) => getItemUnitPrice(item) * getItemQuantity(item)

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart')
    if (!saved) return []

    try {
      return JSON.parse(saved)
        .filter(item => item?.product_id)
        .map(item => ({
          ...item,
          product_key: item.product_id,
          total_price: getItemTotal(item),
        }))
    } catch {
      return []
    }
  })
  const [coupon, setCoupon] = useState(null)
  const [discount, setDiscount] = useState(0)

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (product, quantity = 1, notes = '', selectedOptions = []) => {
    if (!product?.id) {
      throw new Error('Produto sem cadastro valido. Atualize o cardapio e tente novamente.')
    }

    setCart(prev => {
      const productKey = product.id
      const persistedProductId = product.id
      const optionsKey = selectedOptionsKey(selectedOptions)
      const existing = prev.find(item => (
        (item.product_key || item.product_id) === productKey &&
        item.notes === notes &&
        selectedOptionsKey(item.selected_options) === optionsKey
      ))
      
      if (existing) {
        return prev.map(item =>
          (item.product_key || item.product_id) === productKey &&
          item.notes === notes &&
          selectedOptionsKey(item.selected_options) === optionsKey
            ? {
                ...item,
                quantity: getItemQuantity(item) + quantity,
                total_price: getItemUnitPrice(item) * (getItemQuantity(item) + quantity),
              }
            : item
        )
      }

      return [
        ...prev,
        {
          product_id: persistedProductId,
          product_key: productKey,
          product_name: product.name,
          unit_price: product.promotional_price || product.price,
          quantity,
          total_price: (product.promotional_price || product.price) * quantity,
          notes,
          selected_options: selectedOptions,
        },
      ]
    })
  }

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index))
  }

  const updateQuantity = (index, quantity) => {
    if (quantity <= 0) {
      removeFromCart(index)
      return
    }

    setCart(prev => prev.map((item, i) =>
      i === index
        ? { ...item, quantity, total_price: item.unit_price * quantity }
        : item
    ))
  }

  const clearCart = () => {
    setCart([])
    setCoupon(null)
    setDiscount(0)
  }

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + getItemTotal(item), 0)
  }

  const getTotal = (deliveryFee = 0) => {
    return getSubtotal() - discount + deliveryFee
  }

  const applyCoupon = (couponData, discountAmount) => {
    setCoupon(couponData)
    setDiscount(discountAmount)
  }

  const removeCoupon = () => {
    setCoupon(null)
    setDiscount(0)
  }

  const value = {
    cart,
    coupon,
    discount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTotal,
    applyCoupon,
    removeCoupon,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
