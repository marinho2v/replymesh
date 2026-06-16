import { useMemo, useState } from 'react'
import { useProducts } from '../../hooks/useProducts'
import { useCategories } from '../../hooks/useCategories'
import { useInventory } from '../../hooks/useInventory'
import {
  railsCreateProduct, railsUpdateProduct, railsDeleteProduct,
  railsUpdateProductsStatus, railsUpdateProductsSortOrder,
  railsGetOptionGroups, railsSaveOptionGroups,
} from '../../services/storeApi'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { formatCurrency } from '../../utils/currency'
import { Plus, Edit, Trash2, Star, Tag, Package, Search, Settings2, RotateCcw, ArrowUp, ArrowDown, ListOrdered, Pizza } from 'lucide-react'
import { toast } from 'sonner'

const pizzaGroupNames = ['Tamanho', 'Sabores', 'Borda', 'Massa']

const createPizzaOptionGroups = () => ([
  {
    name: 'Tamanho',
    type: 'single',
    required: true,
    min_select: 1,
    max_select: 1,
    sort_order: 0,
    items: [
      { name: 'Pequena - ate 1 sabor', additional_price: 0, is_active: true, sort_order: 0 },
      { name: 'Media - ate 2 sabores', additional_price: 10, is_active: true, sort_order: 1 },
      { name: 'Grande - ate 2 sabores', additional_price: 20, is_active: true, sort_order: 2 },
      { name: 'Familia - ate 3 sabores', additional_price: 30, is_active: true, sort_order: 3 },
    ],
  },
  {
    name: 'Sabores',
    type: 'multiple',
    required: true,
    min_select: 1,
    max_select: 2,
    sort_order: 1,
    items: [
      { name: 'Calabresa', additional_price: 0, is_active: true, sort_order: 0 },
      { name: 'Portuguesa', additional_price: 3, is_active: true, sort_order: 1 },
      { name: 'Mussarela', additional_price: 0, is_active: true, sort_order: 2 },
    ],
  },
  {
    name: 'Borda',
    type: 'single',
    required: false,
    min_select: 0,
    max_select: 1,
    sort_order: 2,
    items: [
      { name: 'Sem borda', additional_price: 0, is_active: true, sort_order: 0 },
      { name: 'Catupiry', additional_price: 8, is_active: true, sort_order: 1 },
      { name: 'Cheddar', additional_price: 8, is_active: true, sort_order: 2 },
      { name: 'Chocolate', additional_price: 10, is_active: true, sort_order: 3 },
    ],
  },
  {
    name: 'Massa',
    type: 'single',
    required: false,
    min_select: 0,
    max_select: 1,
    sort_order: 3,
    items: [
      { name: 'Tradicional', additional_price: 0, is_active: true, sort_order: 0 },
      { name: 'Fina', additional_price: 0, is_active: true, sort_order: 1 },
      { name: 'Grossa', additional_price: 0, is_active: true, sort_order: 2 },
      { name: 'Integral', additional_price: 5, is_active: true, sort_order: 3 },
    ],
  },
])

const inferProductType = (product, groups = []) => {
  const names = groups.map(group => group.name)
  if (names.some(name => pizzaGroupNames.includes(name))) return 'pizza'
  return product?.is_customizable ? 'customizable' : 'simple'
}

const Products = () => {
  const { products, loading, refetch } = useProducts({ activeOnly: false })
  const { categories } = useCategories(false)
  const { items: inventoryItems } = useInventory({ is_active: true })
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [featuredFilter, setFeaturedFilter] = useState(false)
  const [optionGroups, setOptionGroups] = useState([])
  const [selectedProductIds, setSelectedProductIds] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost_price: '',
    cost_method: 'average_cost',
    promotional_price: '',
    category_id: '',
    image_url: '',
    is_featured: false,
    is_promotional: false,
    is_combo: false,
    is_customizable: false,
    product_type: 'simple',
    combo_description: '',
    sort_order: 0,
    track_inventory: false,
    stock_item_id: '',
  })

  const clearProductsCache = () => {
    try {
      Object.keys(sessionStorage)
        .filter(key => key.startsWith('products:'))
        .forEach(key => sessionStorage.removeItem(key))
    } catch {
      // Cache is only a speed aid.
    }
  }

  const pastelOptionGroups = [
    {
      name: 'Proteina',
      type: 'single',
      required: true,
      min_select: 1,
      max_select: 1,
      sort_order: 0,
      items: ['Frango', 'Carne', 'Queijo', 'Presunto', 'Calabresa'].map((name, index) => ({
        name,
        additional_price: 0,
        is_active: true,
        sort_order: index,
      })),
    },
    {
      name: 'Complementos',
      type: 'multiple',
      required: false,
      min_select: 0,
      max_select: 5,
      sort_order: 1,
      items: ['Mucarela', 'Milho', 'Azeitona', 'Catupiry', 'Cebola', 'Tomate', 'Oregano', 'Ovo', 'Cheddar'].map((name, index) => ({
        name,
        additional_price: 0,
        is_active: true,
        sort_order: index,
      })),
    },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (!formData.name.trim()) {
        toast.error('Informe o nome do produto')
        return
      }
      if (!formData.category_id) {
        toast.error('Selecione uma categoria')
        return
      }
      if (!Number.isFinite(Number(formData.price)) || Number(formData.price) < 0) {
        toast.error('Informe um preco valido')
        return
      }

      const productType = formData.product_type || 'simple'
      const data = {
        ...formData,
        is_customizable: productType !== 'simple',
        category_id: formData.category_id || null,
        price: Number(formData.price),
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : 0,
        cost_method: formData.cost_method || 'average_cost',
        promotional_price: formData.promotional_price ? Number(formData.promotional_price) : null,
        sort_order: Number.isFinite(Number(formData.sort_order)) ? Number(formData.sort_order) : 0,
        track_inventory: formData.track_inventory,
        stock_item_id: formData.track_inventory ? (formData.stock_item_id || null) : null,
      }

      let savedProduct = null

      if (editingProduct) {
        savedProduct = await railsUpdateProduct(editingProduct.id, data)
        if (data.is_customizable) {
          await railsSaveOptionGroups(editingProduct.id, optionGroups)
        }
        toast.success('Produto atualizado com sucesso!')
      } else {
        savedProduct = await railsCreateProduct(data)
        if (data.is_customizable) {
          await railsSaveOptionGroups(savedProduct.id, optionGroups)
        }
        toast.success('Produto criado com sucesso!')
      }

      clearProductsCache()
      setCategoryFilter(savedProduct?.category_id || data.category_id || '')
      setModalOpen(false)
      resetForm()
      await refetch()
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error(error.message || 'Erro ao salvar produto')
    }
  }

  const handleEdit = async (product) => {
    setEditingProduct(product)
    let groups = []
    try {
      groups = await railsGetOptionGroups(product.id)
    } catch (error) {
      console.error('Error loading product option groups:', error)
      groups = []
    }

    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      cost_price: product.cost_price || '',
      cost_method: product.cost_method || 'average_cost',
      promotional_price: product.promotional_price || '',
      category_id: product.category_id || '',
      image_url: product.image_url || '',
      is_featured: product.is_featured,
      is_promotional: product.is_promotional,
      is_combo: product.is_combo,
      is_customizable: product.is_customizable || false,
      product_type: inferProductType(product, groups),
      combo_description: product.combo_description || '',
      sort_order: product.sort_order,
      track_inventory: product.track_inventory || false,
      stock_item_id: product.stock_item_id || '',
    })
    setOptionGroups(groups)
    setModalOpen(true)
  }

  const handleDelete = async (productId) => {
    if (!confirm('Tem certeza que deseja excluir definitivamente este produto? Essa acao nao pode ser desfeita.')) return

    try {
      await railsDeleteProduct(productId)
      clearProductsCache()
      toast.success('Produto excluido com sucesso!')
      setSelectedProductIds(prev => prev.filter(id => id !== productId))
      await refetch()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Erro ao excluir produto')
    }
  }

  const handleReactivate = async (productId) => {
    try {
      await railsUpdateProduct(productId, { is_active: true })
      clearProductsCache()
      toast.success('Produto ativado com sucesso!')
      await refetch()
    } catch (error) {
      console.error('Error reactivating product:', error)
      toast.error('Erro ao ativar produto')
    }
  }

  const resetForm = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      cost_price: '',
      cost_method: 'average_cost',
      promotional_price: '',
      category_id: '',
      image_url: '',
      is_featured: false,
      is_promotional: false,
      is_combo: false,
      is_customizable: false,
      product_type: 'simple',
      combo_description: '',
      sort_order: 0,
      track_inventory: false,
      stock_item_id: '',
    })
    setOptionGroups([])
  }

  const updateOptionGroup = (groupIndex, changes) => {
    setOptionGroups(prev => prev.map((group, index) => (
      index === groupIndex ? { ...group, ...changes } : group
    )))
  }

  const updateOptionItem = (groupIndex, itemIndex, changes) => {
    setOptionGroups(prev => prev.map((group, currentGroupIndex) => (
      currentGroupIndex === groupIndex
        ? {
            ...group,
            items: (group.items || []).map((item, currentItemIndex) => (
              currentItemIndex === itemIndex ? { ...item, ...changes } : item
            )),
          }
        : group
    )))
  }

  const addOptionGroup = () => {
    setOptionGroups(prev => ([
      ...prev,
      {
        name: '',
        type: 'single',
        required: false,
        min_select: 0,
        max_select: 1,
        sort_order: prev.length,
        items: [],
      },
    ]))
  }

  const removeOptionGroup = (groupIndex) => {
    setOptionGroups(prev => prev.filter((_, index) => index !== groupIndex))
  }

  const addOptionItem = (groupIndex) => {
    setOptionGroups(prev => prev.map((group, index) => (
      index === groupIndex
        ? {
            ...group,
            items: [
              ...(group.items || []),
              {
                name: '',
                additional_price: 0,
                is_active: true,
                sort_order: group.items?.length || 0,
              },
            ],
          }
        : group
    )))
  }

  const removeOptionItem = (groupIndex, itemIndex) => {
    setOptionGroups(prev => prev.map((group, index) => (
      index === groupIndex
        ? { ...group, items: (group.items || []).filter((_, currentItemIndex) => currentItemIndex !== itemIndex) }
        : group
    )))
  }

  const updateProductType = (productType) => {
    setFormData(prev => ({
      ...prev,
      product_type: productType,
      is_customizable: productType !== 'simple',
    }))

    if (productType === 'simple') {
      setOptionGroups([])
      return
    }

    if (productType === 'pizza' && optionGroups.length === 0) {
      setOptionGroups(createPizzaOptionGroups())
    }
  }

  const categoryOptions = categories?.map(cat => ({
    value: cat.id,
    label: cat.name,
  })) || []

  const stockItemOptions = inventoryItems?.map(item => ({
    value: item.id,
    label: `${item.name} (${item.unit})`,
  })) || []

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return (products || []).filter((product) => {
      const matchesCategory = !categoryFilter || product.category_id === categoryFilter
      const matchesFeatured = !featuredFilter || product.is_featured
      const matchesSearch = !term || (
        product.name?.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term) ||
        product.combo_description?.toLowerCase().includes(term)
      )

      return matchesCategory && matchesFeatured && matchesSearch
    })
  }, [products, searchTerm, categoryFilter, featuredFilter])

  const selectedCount = selectedProductIds.length
  const allVisibleSelected = filteredProducts.length > 0 &&
    filteredProducts.every(product => selectedProductIds.includes(product.id))

  const toggleProductSelection = (productId) => {
    setSelectedProductIds(prev => (
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    ))
  }

  const toggleAllVisibleProducts = () => {
    const visibleIds = filteredProducts.map(product => product.id)

    setSelectedProductIds(prev => {
      if (visibleIds.length === 0) return prev

      if (visibleIds.every(id => prev.includes(id))) {
        return prev.filter(id => !visibleIds.includes(id))
      }

      return [...new Set([...prev, ...visibleIds])]
    })
  }

  const handleBulkStatus = async (isActive) => {
    if (selectedProductIds.length === 0) return

    const actionText = isActive ? 'ativar' : 'desativar'
    if (!confirm(`Tem certeza que deseja ${actionText} ${selectedProductIds.length} produto(s)?`)) return

    try {
      await railsUpdateProductsStatus(selectedProductIds, isActive)
      clearProductsCache()
      toast.success(`Produtos ${isActive ? 'ativados' : 'desativados'} com sucesso!`)
      setSelectedProductIds([])
      await refetch()
    } catch (error) {
      console.error('Error updating products in bulk:', error)
      toast.error(`Erro ao ${actionText} produtos`)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return
    if (!confirm(`EXCLUIR DEFINITIVAMENTE ${selectedProductIds.length} produto(s)?\n\nEssa acao nao pode ser desfeita. Se o produto apenas acabou, use "Desativar selecionados".`)) return

    try {
      await Promise.all(selectedProductIds.map(id => railsDeleteProduct(id)))
      clearProductsCache()
      toast.success('Produtos excluidos com sucesso!')
      setSelectedProductIds([])
      await refetch()
    } catch (error) {
      console.error('Error deleting products in bulk:', error)
      toast.error('Erro ao excluir produtos')
    }
  }

  const persistVisibleOrder = async (orderedProducts, successMessage = 'Ordem dos produtos atualizada') => {
    try {
      const payload = orderedProducts.map((product, index) => ({
        id: product.id,
        sort_order: index * 10,
      }))

      await railsUpdateProductsSortOrder(payload)
      clearProductsCache()
      toast.success(successMessage)
      await refetch()
    } catch (error) {
      console.error('Error reordering products:', error)
      toast.error('Erro ao atualizar ordem dos produtos')
    }
  }

  const moveProduct = async (productId, direction) => {
    const currentIndex = filteredProducts.findIndex(product => product.id === productId)
    const nextIndex = currentIndex + direction
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= filteredProducts.length) return

    const orderedProducts = [...filteredProducts]
    const [product] = orderedProducts.splice(currentIndex, 1)
    orderedProducts.splice(nextIndex, 0, product)

    await persistVisibleOrder(orderedProducts, direction < 0 ? 'Produto subiu na ordem' : 'Produto desceu na ordem')
  }

  const normalizeVisibleOrder = async () => {
    if (filteredProducts.length === 0) return
    const scope = categoryFilter
      ? categories?.find(category => category.id === categoryFilter)?.name || 'categoria selecionada'
      : 'lista atual'

    if (!confirm(`Renumerar a ordem dos ${filteredProducts.length} produto(s) da ${scope}?`)) return
    await persistVisibleOrder(filteredProducts, 'Ordem renumerada com sucesso')
  }

  const calculateProfit = (salePrice, costPrice) => {
    const sale = Number(salePrice || 0)
    const cost = Number(costPrice || 0)
    const profit = sale - cost
    const margin = sale > 0 ? (profit / sale) * 100 : 0
    return { sale, cost, profit, margin }
  }

  const formProfit = calculateProfit(
    formData.promotional_price || formData.price,
    formData.cost_price
  )

  return (
    <div className="overflow-hidden">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Produtos</h1>
          <p className="mt-0.5 text-sm text-gray-400">{products?.length || 0} produto{products?.length !== 1 ? 's' : ''} cadastrado{products?.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true) }}>
          <Plus size={18} className="mr-2" />
          Novo produto
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Pesquisar produto pelo nome ou descricao..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-11"
              />
            </div>

            <Button
              variant={featuredFilter ? 'primary' : 'outline'}
              onClick={() => setFeaturedFilter(prev => !prev)}
              className="w-full lg:w-auto"
            >
              <Star size={18} className="mr-2" />
              Destaques
            </Button>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setCategoryFilter('')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors font-medium ${
                !categoryFilter
                  ? 'bg-white text-black'
                  : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
              }`}
            >
              Todos
            </button>
            {categories?.map((category) => (
              <button
                key={category.id}
                type="button"
                title={category.name}
                onClick={() => setCategoryFilter(category.id)}
                className={`max-w-[140px] truncate px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors text-sm font-medium ${
                  categoryFilter === category.id
                    ? 'bg-white text-black'
                    : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          <p className="mt-3 text-sm text-gray-400">
            Mostrando {filteredProducts.length} de {products?.length || 0} produtos
          </p>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex shrink-0 items-center gap-2 text-xs text-gray-300">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleAllVisibleProducts}
                className="rounded"
              />
              <span className="hidden sm:inline">Selecionar visíveis</span>
              <span className="sm:hidden">Selecionar</span>
            </label>
            {selectedCount > 0 && (
              <span className="shrink-0 rounded-full bg-dark-700 px-2 py-0.5 text-xs text-gray-300">
                {selectedCount} sel.
              </span>
            )}
            <div className="ml-auto flex flex-wrap gap-1.5">
              <Button type="button" variant="outline" size="sm" disabled={selectedCount === 0} onClick={() => handleBulkStatus(true)}>
                Ativar
              </Button>
              <Button type="button" variant="secondary" size="sm" disabled={selectedCount === 0} onClick={() => handleBulkStatus(false)}>
                Desativar
              </Button>
              <Button type="button" variant="danger" size="sm" disabled={selectedCount === 0} onClick={handleBulkDelete}>
                Excluir
              </Button>
              <Button type="button" variant="secondary" size="sm" disabled={filteredProducts.length === 0} onClick={normalizeVisibleOrder}>
                <ListOrdered size={14} className="mr-1" />
                Renumerar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Package size={18} className="mr-2 animate-pulse" />
          Carregando produtos...
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Package size={36} className="mb-2 text-gray-600" />
            <p className="text-sm font-medium text-gray-400">Nenhum produto encontrado com esses filtros.</p>
            {(searchTerm || categoryFilter) && (
              <Button variant="outline" size="sm" className="mt-3" onClick={() => { setSearchTerm(''); setCategoryFilter('') }}>
                Limpar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {filteredProducts.map((product, index) => (
            <Card key={product.id} className={!product.is_active ? 'opacity-50' : ''}>
              <CardContent className="p-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex flex-1 items-start gap-2">
                    <input
                      type="checkbox"
                      checked={selectedProductIds.includes(product.id)}
                      onChange={() => toggleProductSelection(product.id)}
                      className="mt-0.5 h-3.5 w-3.5 rounded"
                      aria-label={`Selecionar ${product.name}`}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">{product.name}</h3>
                        <Badge variant="default">Ordem {Number(product.sort_order || 0)}</Badge>
                      </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {product.is_featured && (
                        <Badge variant="primary">
                          <Star size={12} className="mr-1" />
                          Destaque
                        </Badge>
                      )}
                      {product.is_promotional && (
                        <Badge variant="warning">
                          <Tag size={12} className="mr-1" />
                          Promo
                        </Badge>
                      )}
                      {product.is_combo && (
                        <Badge variant="info">Combo</Badge>
                      )}
                      {product.is_customizable && (
                        <Badge variant="success">Customizavel</Badge>
                      )}
                      {!product.is_active && (
                        <Badge variant="danger">Inativo</Badge>
                      )}
                    </div>
                    </div>
                  </div>
                  <div className="grid shrink-0 grid-cols-2 gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveProduct(product.id, -1)}
                      disabled={index === 0}
                      title="Subir produto"
                    >
                      <ArrowUp size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveProduct(product.id, 1)}
                      disabled={index === filteredProducts.length - 1}
                      title="Descer produto"
                    >
                      <ArrowDown size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                      <Edit size={14} />
                    </Button>
                    {product.is_active ? (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)} title="Excluir produto">
                        <Trash2 size={14} className="text-red-500" />
                      </Button>
                    ) : (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => handleReactivate(product.id)} title="Ativar produto">
                          <RotateCcw size={14} className="text-green-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)} title="Excluir produto">
                          <Trash2 size={14} className="text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {product.description && (
                  <p className="mb-2 line-clamp-1 text-xs text-gray-400">{product.description}</p>
                )}

                {product.combo_description && (
                  <p className="mb-2 line-clamp-1 text-xs text-gray-400">{product.combo_description}</p>
                )}

                <div className="flex items-center gap-2 leading-none">
                  {product.promotional_price ? (
                    <>
                      <span className="text-base font-bold text-white">
                        {formatCurrency(product.promotional_price)}
                      </span>
                      <span className="text-xs text-gray-500 line-through">
                        {formatCurrency(product.price)}
                      </span>
                    </>
                  ) : (
                    <span className="text-base font-bold text-white">
                      {formatCurrency(product.price)}
                    </span>
                  )}
                </div>

                {(() => {
                  const numbers = calculateProfit(product.promotional_price || product.price, product.cost_price)
                  return (
                    <div className="mt-2 grid grid-cols-3 gap-1 text-[10px]">
                      <div className="rounded-md bg-dark-900 p-1.5">
                        <p className="text-gray-500">Custo</p>
                        <p className="text-gray-200 font-semibold">{formatCurrency(numbers.cost)}</p>
                      </div>
                      <div className="rounded-md bg-dark-900 p-1.5">
                        <p className="text-gray-500">Lucro un.</p>
                        <p className={numbers.profit >= 0 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                          {formatCurrency(numbers.profit)}
                        </p>
                      </div>
                      <div className="rounded-md bg-dark-900 p-1.5">
                        <p className="text-gray-500">Margem</p>
                        <p className={numbers.margin >= 0 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                          {numbers.margin.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  )
                })()}

                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="mt-2 h-16 w-full rounded-md object-cover 2xl:h-20"
                  />
                ) : (
                  <div className="mt-2 grid h-16 place-items-center rounded-md border border-dashed border-dark-600 bg-dark-900 text-[10px] text-gray-500 2xl:h-20">
                    Sem imagem
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'Editar Produto' : 'Novo Produto'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome do produto"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />

          <Textarea
            label="Descrição"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />

          <div className="rounded-lg border border-dark-600 bg-dark-900/60 p-4 space-y-3">
            <h3 className="text-white font-semibold">Preco, custo e lucro</h3>
            <p className="text-xs text-gray-400">
              Preco de custo e quanto a loja paga. Lucro bruto e o valor de venda menos o custo.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Preco de venda"
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              />
              <Input
                label="Preco de custo"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_price}
                onChange={(e) => setFormData(prev => ({ ...prev, cost_price: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Preco promocional (opcional)"
                type="number"
                step="0.01"
                value={formData.promotional_price}
                onChange={(e) => setFormData(prev => ({ ...prev, promotional_price: e.target.value }))}
              />
              <Select
                label="Como calcular custo"
                options={[
                  { value: 'average_cost', label: 'Custo medio do estoque' },
                  { value: 'manual', label: 'Custo manual fixo' },
                ]}
                value={formData.cost_method}
                onChange={(e) => setFormData(prev => ({ ...prev, cost_method: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg bg-dark-800 p-3">
                <p className="text-xs text-gray-400">Venda usada</p>
                <p className="text-white font-bold">{formatCurrency(formProfit.sale)}</p>
              </div>
              <div className="rounded-lg bg-dark-800 p-3">
                <p className="text-xs text-gray-400">Lucro por unidade</p>
                <p className={formProfit.profit >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                  {formatCurrency(formProfit.profit)}
                </p>
              </div>
              <div className="rounded-lg bg-dark-800 p-3">
                <p className="text-xs text-gray-400">Margem</p>
                <p className={formProfit.margin >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                  {formProfit.margin.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <Select
            label="Categoria"
            options={categoryOptions}
            value={formData.category_id}
            onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
          />

          <Input
            label="URL da imagem"
            value={formData.image_url}
            onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
          />

          <div className="grid grid-cols-3 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                className="rounded"
              />
              <span className="text-white text-sm">Destaque</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_promotional}
                onChange={(e) => setFormData(prev => ({ ...prev, is_promotional: e.target.checked }))}
                className="rounded"
              />
              <span className="text-white text-sm">Promocional</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_combo}
                onChange={(e) => setFormData(prev => ({ ...prev, is_combo: e.target.checked }))}
                className="rounded"
              />
              <span className="text-white text-sm">Combo</span>
            </label>
          </div>

          <div className="rounded-lg border border-dark-600 bg-dark-900/60 p-4">
            <div className="grid gap-3 sm:grid-cols-[240px_1fr]">
              <Select
                label="Tipo de produto"
                value={formData.product_type || 'simple'}
                onChange={(e) => updateProductType(e.target.value)}
                options={[
                  { value: 'simple', label: 'Simples' },
                  { value: 'customizable', label: 'Customizavel' },
                  { value: 'pizza', label: 'Pizza' },
                ]}
              />
              <div className="rounded-lg border border-dark-700 bg-dark-900 p-3 text-sm text-gray-300">
                {formData.product_type === 'pizza' ? (
                  <div className="flex items-start gap-3">
                    <Pizza className="mt-0.5 text-yellow-400" size={20} />
                    <div>
                      <p className="font-semibold text-white">Produto de pizzaria</p>
                      <p className="mt-1 text-xs text-gray-400">
                        Use tamanhos, sabores, bordas e massas. O preco final soma o preco base com os adicionais escolhidos.
                      </p>
                    </div>
                  </div>
                ) : formData.product_type === 'customizable' ? (
                  <p>Produtos customizaveis abrem um modal para o cliente escolher opcoes antes de adicionar ao carrinho.</p>
                ) : (
                  <p>Produto simples entra direto no carrinho, sem tela de opcoes.</p>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Para precificacao avancada de pizza por matriz tamanho/sabor, sera necessaria uma evolucao de banco em fase propria.
            </p>

            {(formData.product_type !== 'simple') && (
              <div className="mt-4 space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                    <Settings2 size={18} />
                    {formData.product_type === 'pizza' ? 'Tamanhos, sabores e complementos' : 'Grupos de opcoes'}
                  </h3>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button type="button" size="sm" variant="outline" onClick={() => setOptionGroups(createPizzaOptionGroups())}>
                      Modelo Pizzaria
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setOptionGroups(pastelOptionGroups)}>
                      Modelo Pastel
                    </Button>
                    <Button type="button" size="sm" onClick={addOptionGroup}>
                      <Plus size={16} className="mr-1" />
                      Grupo
                    </Button>
                  </div>
                </div>

                {optionGroups.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-dark-600 p-4 text-sm text-gray-400">
                    Nenhum grupo configurado. Use o modelo de pizzaria, modelo de pastel ou crie um grupo manualmente.
                  </div>
                ) : (
                  optionGroups.map((group, groupIndex) => (
                    <div key={group.id || groupIndex} className="rounded-lg border border-dark-600 bg-dark-800 p-4">
                      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Input
                          label="Nome do grupo"
                          value={group.name}
                          onChange={(e) => updateOptionGroup(groupIndex, { name: e.target.value })}
                        />
                        <Select
                          label="Tipo"
                          value={group.type}
                          onChange={(e) => updateOptionGroup(groupIndex, {
                            type: e.target.value,
                            max_select: e.target.value === 'single' ? 1 : group.max_select,
                          })}
                          options={[
                            { value: 'single', label: 'Escolha unica' },
                            { value: 'multiple', label: 'Multipla escolha' },
                          ]}
                        />
                        <Input
                          label="Minimo"
                          type="number"
                          min="0"
                          value={group.min_select}
                          onChange={(e) => updateOptionGroup(groupIndex, { min_select: e.target.value })}
                        />
                        <Input
                          label="Maximo"
                          type="number"
                          min="1"
                          value={group.max_select}
                          onChange={(e) => updateOptionGroup(groupIndex, { max_select: e.target.value })}
                        />
                      </div>

                      <div className="mb-3 flex items-center justify-between gap-3">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={group.required}
                            onChange={(e) => updateOptionGroup(groupIndex, { required: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-sm text-white">Obrigatorio</span>
                        </label>
                        <Button type="button" size="sm" variant="danger" onClick={() => removeOptionGroup(groupIndex)}>
                          Remover grupo
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {(group.items || []).map((item, itemIndex) => (
                          <div key={item.id || itemIndex} className="grid grid-cols-1 gap-2 rounded-lg bg-dark-900 p-3 sm:grid-cols-[1fr_140px_auto]">
                            <Input
                              placeholder="Nome da opcao"
                              value={item.name}
                              onChange={(e) => updateOptionItem(groupIndex, itemIndex, { name: e.target.value })}
                            />
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Adicional"
                              value={item.additional_price}
                              onChange={(e) => updateOptionItem(groupIndex, itemIndex, { additional_price: e.target.value })}
                            />
                            <Button type="button" size="sm" variant="ghost" onClick={() => removeOptionItem(groupIndex, itemIndex)}>
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => addOptionItem(groupIndex)}>
                        <Plus size={16} className="mr-1" />
                        Opcao
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {formData.is_combo && (
            <Textarea
              label="Descrição do combo"
              value={formData.combo_description}
              onChange={(e) => setFormData(prev => ({ ...prev, combo_description: e.target.value }))}
              rows={2}
            />
          )}

          <Input
            label="Ordem de exibição"
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData(prev => ({ ...prev, sort_order: e.target.value }))}
          />

          <div className="border-t border-dark-600 pt-4 mt-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Package size={20} />
              Controle de Estoque
            </h3>

            <label className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                checked={formData.track_inventory}
                onChange={(e) => setFormData(prev => ({ ...prev, track_inventory: e.target.checked }))}
                className="rounded"
              />
              <span className="text-white text-sm">Controlar estoque deste produto</span>
            </label>

            {formData.track_inventory && (
              <Select
                label="Item de Estoque"
                options={stockItemOptions}
                value={formData.stock_item_id}
                onChange={(e) => setFormData(prev => ({ ...prev, stock_item_id: e.target.value }))}
              />
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1">
              {editingProduct ? 'Atualizar' : 'Criar'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Products
