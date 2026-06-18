import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ShoppingCart, Star } from 'lucide-react'
import { toast } from 'sonner'
import { usePublicMenu } from '../../hooks/usePublicMenu'
import { useCart } from '../../hooks/useCart'
import { formatCurrency } from '../../utils/currency'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import ProductCustomizationModal from './ProductCustomizationModal'

const isPublicCategory = (category) => {
  const value = String(category?.slug || category?.name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  return !['adicionais', 'adicional', 'extras'].includes(value)
}

const ProductCard = ({ product, featured = false, onAddToCart }) => (
  <div className="bg-dark-800 rounded-xl border border-dark-600 overflow-hidden hover:border-white transition-colors">
    {product.image_url && (
      <img
        src={product.image_url}
        alt={product.name}
        loading="lazy"
        decoding="async"
        className="w-full h-48 object-cover"
      />
    )}
    <div className="p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-lg font-semibold text-white">{product.name}</h3>
        {(featured || product.is_featured) && (
          <Badge variant="primary">
            <Star size={12} className="mr-1" />
            Destaque
          </Badge>
        )}
      </div>

      {product.is_promotional && (
        <Badge variant="warning" className="mb-2">
          Promocao
        </Badge>
      )}

      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{product.description}</p>

      <div className="flex items-center justify-between mb-4">
        <div>
          {product.promotional_price ? (
            <>
              <span className="text-xl font-bold text-white">
                {formatCurrency(product.promotional_price)}
              </span>
              <span className="text-sm text-gray-500 line-through ml-2">
                {formatCurrency(product.price)}
              </span>
            </>
          ) : (
            <span className="text-xl font-bold text-white">
              {formatCurrency(product.price)}
            </span>
          )}
        </div>
      </div>

      <Button onClick={() => onAddToCart(product)} className="w-full">
        <ShoppingCart size={20} className="mr-2" />
        Adicionar
      </Button>
    </div>
  </div>
)

const MenuSection = ({
  title = 'Cardapio',
  showTitle = true,
  showSearch = true,
  showFeaturedFilter = true,
  showHomeFilter = false,
  showCategoryFilters = true,
  showAllCategoryFilter = true,
  showFeaturedBlock = true,
  showProductGrid = true,
  featuredOnly = false,
  className = '',
}) => {
  const [searchParams] = useSearchParams()
  const categorySlug = searchParams.get('category')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(categorySlug || '')
  const [showFeatured, setShowFeatured] = useState(false)
  const [customizingProduct, setCustomizingProduct] = useState(null)
  const [optionGroups, setOptionGroups] = useState([])

  const {
    categories,
    products,
    loading,
    error,
  } = usePublicMenu()
  const categoriesLoading = loading
  const { addToCart } = useCart()
  const visibleCategories = useMemo(() => (categories || []).filter(isPublicCategory), [categories])

  const filters = useMemo(() => {
    const nextFilters = {}
    if (selectedCategory && !showFeatured) {
      const category = visibleCategories?.find(item => item.slug === selectedCategory)
      if (category) nextFilters.category_id = category.id
    }
    if (featuredOnly || showFeatured) nextFilters.is_featured = true
    return nextFilters
  }, [featuredOnly, selectedCategory, showFeatured, visibleCategories])

  const menuProducts = useMemo(() => (
    (products || []).filter((product) => {
      if (filters.category_id && product.category?.id !== filters.category_id) return false
      if (filters.is_featured && !product.is_featured) return false
      return true
    })
  ), [filters.category_id, filters.is_featured, products])

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return menuProducts || []

    return (menuProducts || []).filter(product => (
      product.name?.toLowerCase().includes(term) ||
      product.description?.toLowerCase().includes(term)
    ))
  }, [menuProducts, searchTerm])

  const featuredProducts = useMemo(() => (
    (products || []).filter(product => product.is_featured)
  ), [products])

  const selectedCategoryName = selectedCategory
    ? visibleCategories?.find(item => item.slug === selectedCategory)?.name
    : 'Todos os Produtos'

  const handleAddToCart = async (product) => {
    if (product.is_customizable && !product.is_local) {
      setCustomizingProduct(product)
      setOptionGroups(product.option_groups || [])
      return
    }

    addToCart(product, 1)
    toast.success(`${product.name} adicionado ao carrinho`)
  }

  const handleConfirmCustomization = ({ product, selectedOptions }) => {
    addToCart(product, 1, '', selectedOptions)
    toast.success(`${product.name} adicionado ao carrinho`)
    setCustomizingProduct(null)
    setOptionGroups([])
  }

  return (
    <section className={`py-12 px-4 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {showTitle && (
          <h2 className="text-3xl font-bold text-white mb-6 text-center">{title}</h2>
        )}

        {(showCategoryFilters || showFeaturedFilter) && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 sticky top-0 bg-dark-950/95 backdrop-blur z-10 py-2">
            {showHomeFilter && (
              <button
                onClick={() => {
                  setSelectedCategory('')
                  setShowFeatured(false)
                }}
                className={`px-4 py-3 rounded-lg whitespace-nowrap transition-colors font-medium ${
                  !selectedCategory && !showFeatured
                    ? 'bg-white text-black'
                    : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
                }`}
              >
                Inicio
              </button>
            )}
            {showFeaturedFilter && (
              <button
                onClick={() => {
                  setShowFeatured(true)
                  setSelectedCategory('')
                }}
                className={`px-4 py-3 rounded-lg whitespace-nowrap transition-colors font-medium ${
                  showFeatured
                    ? 'bg-white text-black'
                    : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
                }`}
              >
                Destaques
              </button>
            )}
            {showCategoryFilters && (
              <>
                {showAllCategoryFilter && (
                  <button
                    onClick={() => {
                      setSelectedCategory('')
                      setShowFeatured(false)
                    }}
                    className={`px-4 py-3 rounded-lg whitespace-nowrap transition-colors font-medium ${
                      !selectedCategory && !showFeatured
                        ? 'bg-white text-black'
                        : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
                    }`}
                  >
                    Inicio
                  </button>
                )}
                {!categoriesLoading && visibleCategories?.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.slug)
                      setShowFeatured(false)
                    }}
                    className={`px-4 py-3 rounded-lg whitespace-nowrap transition-colors font-medium ${
                      selectedCategory === category.slug && !showFeatured
                        ? 'bg-white text-black'
                        : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </>
            )}
          </div>
        )}

        {(showSearch || showFeaturedFilter) && (
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            {showSearch && (
              <div className="flex-1">
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            )}
            {showFeaturedFilter && (
              <Button
                variant={showFeatured ? 'primary' : 'outline'}
                onClick={() => setShowFeatured(prev => !prev)}
              >
                <Star size={20} className="mr-2" />
                Destaques
              </Button>
            )}
          </div>
        )}

        {showFeaturedBlock && !showFeatured && !selectedCategory && (
          <div className={showProductGrid ? 'mb-8' : ''}>
            <h3 className="text-2xl font-bold text-white mb-4">Destaques</h3>
            {error ? (
              <div className="text-center text-gray-400 py-12">{error}</div>
            ) : loading ? (
              <div className="text-center text-gray-400 py-12">Carregando destaques...</div>
            ) : featuredProducts.length === 0 ? (
              <div className="text-center text-gray-400 py-12">Nenhum produto em destaque encontrado</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {featuredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    featured
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {showProductGrid && (showAllCategoryFilter || showFeatured || selectedCategory) && (
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">
              {showFeatured ? 'Produtos em Destaque' : selectedCategoryName}
            </h3>

            {error ? (
              <div className="text-center text-gray-400 py-12">{error}</div>
            ) : loading ? (
              <div className="text-center text-gray-400 py-12">Carregando cardapio...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center text-gray-400 py-12">Nenhum produto encontrado</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    featured={showFeatured}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ProductCustomizationModal
        isOpen={Boolean(customizingProduct)}
        onClose={() => setCustomizingProduct(null)}
        product={customizingProduct}
        optionGroups={optionGroups}
        loading={false}
        onConfirm={handleConfirmCustomization}
      />
    </section>
  )
}

export default MenuSection
