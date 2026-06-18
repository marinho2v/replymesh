import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ShoppingCart, ArrowLeft, Star } from 'lucide-react'
import { toast } from 'sonner'
import { getPublicProduct } from '../../services/publicApi'
import { useCart } from '../../hooks/useCart'
import { useCompanyBasePath, useCompanySlug } from '../../contexts/CompanySlugContext'
import { useStoreTemplate } from '../../contexts/StoreTemplateContext'
import { formatCurrency } from '../../utils/currency'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import ProductCustomizationModal from '../../components/menu/ProductCustomizationModal'

const ProductDetails = () => {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const slug = useCompanySlug()
  const basePath = useCompanyBasePath()
  const { templateId } = useStoreTemplate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [customizing, setCustomizing] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const data = await getPublicProduct(productId, slug)
        setProduct(data?.is_active === false ? null : data)
      } catch (error) {
        console.error('Error fetching public product:', error)
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }

    if (productId) fetchProduct()
  }, [productId, slug])

  const handleQuantityChange = (delta) => {
    setQuantity(prev => Math.max(1, prev + delta))
  }

  const handleAddToCart = () => {
    if (!product) return

    if (product.is_customizable && product.option_groups?.length > 0) {
      setCustomizing(true)
      return
    }

    addToCart(product, quantity)
    toast.success(`${product.name} adicionado ao carrinho`)
    navigate(`${basePath}/menu`)
  }

  const handleConfirmCustomization = ({ product: customizedProduct, selectedOptions }) => {
    addToCart(customizedProduct, quantity, '', selectedOptions)
    toast.success(`${customizedProduct.name} adicionado ao carrinho`)
    setCustomizing(false)
    navigate(`${basePath}/cart`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Carregando produto...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div>
          <p className="mb-6 text-gray-400">Produto nao encontrado</p>
          <Button variant="outline" onClick={() => navigate(`${basePath}/menu`)}>
            Voltar ao Cardapio
          </Button>
        </div>
      </div>
    )
  }

  if (templateId === 'hamburgueria-premium') {
    const price = product.promotional_price || product.price || 0
    const originalPrice = product.promotional_price ? product.price : null

    return (
      <div style={{ minHeight: '100vh', background: '#0c0c0e', color: '#f4f3f1', padding: '34px 24px 70px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <button
            onClick={() => navigate(`${basePath}/menu`)}
            style={{
              border: '1px solid #26262a',
              background: '#121214',
              color: '#f4f3f1',
              borderRadius: 12,
              padding: '10px 16px',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 22,
            }}
          >
            Voltar ao Cardápio
          </button>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.1fr) minmax(320px, .9fr)',
              gap: 28,
              background: '#1a1a1d',
              border: '1px solid #26262a',
              borderRadius: 22,
              overflow: 'hidden',
            }}
            className="premium-product-detail"
          >
            <div style={{ minHeight: 420, background: '#121214' }}>
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div
                  style={{
                    height: '100%',
                    minHeight: 420,
                    display: 'grid',
                    placeItems: 'center',
                    background: 'radial-gradient(120% 120% at 70% 20%, #3a2a18 0%, #241a12 45%, #15110d 100%)',
                    color: 'rgba(255,255,255,.35)',
                    fontWeight: 800,
                    textAlign: 'center',
                    padding: 24,
                  }}
                >
                  {product.name}
                </div>
              )}
            </div>

            <div style={{ padding: '34px 30px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {product.is_featured && <span style={{ background: '#f7a325', color: '#2a1a05', borderRadius: 999, padding: '5px 11px', fontSize: 12, fontWeight: 800 }}>Destaque</span>}
                {product.is_promotional && <span style={{ background: '#3a2a18', color: '#f7a325', border: '1px solid rgba(247,163,37,.35)', borderRadius: 999, padding: '5px 11px', fontSize: 12, fontWeight: 800 }}>Promoção</span>}
              </div>

              <h1 style={{ fontSize: 'clamp(30px,4vw,46px)', lineHeight: 1.05, fontWeight: 800, margin: 0 }}>
                {product.name}
              </h1>

              {product.description && (
                <p style={{ color: '#b8b8bd', lineHeight: 1.65, fontSize: 16, marginTop: 16 }}>
                  {product.description}
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 20 }}>
                <span style={{ fontSize: 34, fontWeight: 800 }}>{formatCurrency(price)}</span>
                {originalPrice && (
                  <span style={{ color: '#9a9aa0', textDecoration: 'line-through', fontSize: 18 }}>
                    {formatCurrency(originalPrice)}
                  </span>
                )}
              </div>

              <div style={{ marginTop: 26 }}>
                <div style={{ color: '#9a9aa0', fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Quantidade</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid #26262a', background: '#121214', color: '#f7a325', fontSize: 22, cursor: 'pointer' }}
                  >
                    -
                  </button>
                  <span style={{ width: 42, textAlign: 'center', fontSize: 22, fontWeight: 800 }}>{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid #26262a', background: '#121214', color: '#f7a325', fontSize: 22, cursor: 'pointer' }}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                style={{
                  marginTop: 'auto',
                  background: '#f7a325',
                  color: '#2a1a05',
                  border: 'none',
                  borderRadius: 14,
                  padding: '15px 18px',
                  fontWeight: 800,
                  fontSize: 16,
                  cursor: 'pointer',
                }}
              >
                Adicionar ao Carrinho
              </button>
            </div>
          </div>
        </div>

        <ProductCustomizationModal
          isOpen={customizing}
          onClose={() => setCustomizing(false)}
          product={product}
          optionGroups={product.option_groups || []}
          loading={false}
          onConfirm={handleConfirmCustomization}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={() => navigate(`${basePath}/menu`)}
          className="mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          Voltar ao Cardapio
        </Button>

        <div className="bg-dark-800 rounded-xl border border-dark-600 overflow-hidden">
          {product.image_url && (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-64 md:h-96 object-cover"
            />
          )}

          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl font-bold text-white">{product.name}</h1>
              <div className="flex gap-2">
                {product.is_featured && (
                  <Badge variant="primary">
                    <Star size={12} className="mr-1" />
                    Destaque
                  </Badge>
                )}
                {product.is_promotional && (
                  <Badge variant="warning">
                    Promocao
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-gray-400 text-lg mb-6">{product.description}</p>

            <div className="mb-6">
              {product.promotional_price ? (
                <>
                  <span className="text-3xl font-bold text-white">
                    {formatCurrency(product.promotional_price)}
                  </span>
                  <span className="text-xl text-gray-500 line-through ml-3">
                    {formatCurrency(product.price)}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-white">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Quantidade
              </label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="text-xl font-semibold text-white w-12 text-center">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  onClick={() => handleQuantityChange(1)}
                >
                  +
                </Button>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleAddToCart}
                className="flex-1"
              >
                <ShoppingCart size={20} className="mr-2" />
                Adicionar ao Carrinho
              </Button>
            </div>

            {product.ingredients && (
              <div className="mt-6 pt-6 border-t border-dark-600">
                <h3 className="text-lg font-semibold text-white mb-2">Ingredientes</h3>
                <p className="text-gray-400">{product.ingredients}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProductCustomizationModal
        isOpen={customizing}
        onClose={() => setCustomizing(false)}
        product={product}
        optionGroups={product.option_groups || []}
        loading={false}
        onConfirm={handleConfirmCustomization}
      />
    </div>
  )
}

export default ProductDetails
