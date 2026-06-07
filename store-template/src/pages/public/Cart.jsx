import { useState } from 'react'
import { useCart } from '../../hooks/useCart'
import { useCouponValidation } from '../../hooks/useCoupons'
import { formatCurrency } from '../../utils/currency'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import SelectedOptionsSummary from '../../components/shared/SelectedOptionsSummary'
import { useCompanyBasePath } from '../../contexts/CompanySlugContext'

const Cart = () => {
  const basePath = useCompanyBasePath()
  const { cart, removeFromCart, updateQuantity, coupon, discount, applyCoupon, removeCoupon, getSubtotal } = useCart()
  const { validate, validating } = useCouponValidation()
  const [couponCode, setCouponCode] = useState('')

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Digite um codigo de cupom')
      return
    }

    const subtotal = getSubtotal()
    const result = await validate(couponCode, subtotal)

    if (result.valid) {
      applyCoupon(result.coupon, result.discountAmount)
      toast.success('Cupom aplicado com sucesso!')
      setCouponCode('')
    } else {
      toast.error(result.message)
    }
  }

  const handleRemoveCoupon = () => {
    removeCoupon()
    toast.info('Cupom removido')
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingBag size={64} className="mx-auto text-gray-600 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Seu carrinho esta vazio</h2>
          <p className="text-gray-400 mb-8">Adicione produtos ao carrinho para continuar</p>
          <Link to={`${basePath}/menu`}>
            <Button size="lg">Ver Cardapio</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Carrinho</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item, index) => (
              <div
                key={`${item.product_id}-${index}`}
                className="bg-dark-800 rounded-xl border border-dark-600 p-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words font-semibold text-white sm:line-clamp-2">
                      {item.product_name}
                    </h3>
                    <SelectedOptionsSummary selectedOptions={item.selected_options} />
                    {item.notes && (
                      <p className="mt-1 break-words text-sm text-gray-400">Obs: {item.notes}</p>
                    )}
                    <p className="mt-2 font-semibold text-white">
                      {formatCurrency(item.unit_price)}
                    </p>
                  </div>

                  <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-dark-700 text-white hover:bg-dark-600"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-medium text-white">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-dark-700 text-white hover:bg-dark-600"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="min-w-0 text-right">
                      <p className="whitespace-nowrap font-bold text-white">{formatCurrency(item.total_price)}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(index)}
                      className="shrink-0 text-red-500 transition-colors hover:text-red-400"
                      aria-label={`Remover ${item.product_name}`}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="bg-dark-800 rounded-xl border border-dark-600 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Resumo</h2>

              {!coupon ? (
                <div className="mb-4">
                  <Input
                    placeholder="Codigo do cupom"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  />
                  <Button
                    onClick={handleApplyCoupon}
                    loading={validating}
                    className="w-full mt-2"
                    variant="outline"
                  >
                    Aplicar Cupom
                  </Button>
                </div>
              ) : (
                <div className="mb-4 bg-green-900/30 border border-green-700 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-400 font-medium">{coupon.code}</p>
                      <p className="text-xs text-green-300">{coupon.title}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(getSubtotal())}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Desconto</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}

                <div className="border-t border-dark-600 pt-2 flex justify-between text-xl font-bold text-white">
                  <span>Total</span>
                  <span className="text-white">{formatCurrency(getSubtotal() - discount)}</span>
                </div>
              </div>

              <Link to={`${basePath}/checkout`} className="block mt-6">
                <Button size="lg" className="w-full">
                  Finalizar Pedido
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
