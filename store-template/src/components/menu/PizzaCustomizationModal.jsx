import { useEffect, useMemo, useState } from 'react'
import { Check, Pizza, ShoppingCart } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { formatCurrency } from '../../utils/currency'
import {
  PIZZA_PRICE_GROUP_NAME,
  buildPizzaFlavorName,
  buildPizzaPriceOptionName,
  buildPizzaSizeName,
  calculatePizzaPrice,
  parsePizzaConfigFromOptionGroups,
} from '../../utils/pizzaProduct'

const optionButtonClass = (active, blocked = false) => (
  `rounded-lg border px-3 py-2 text-left transition-colors ${
    active
      ? 'border-white bg-white text-black'
      : 'border-dark-600 bg-dark-800 text-gray-200 hover:border-dark-500'
  } ${blocked ? 'cursor-not-allowed opacity-45' : ''}`
)

const PizzaCustomizationModal = ({ isOpen, onClose, product, optionGroups = [], onConfirm }) => {
  const config = useMemo(
    () => parsePizzaConfigFromOptionGroups(optionGroups, product?.promotional_price || product?.price || 0),
    [optionGroups, product?.price, product?.promotional_price]
  )
  const activeSizes = config.sizes.filter(size => size.active !== false)
  const activeFlavors = config.flavors.filter(flavor => flavor.active !== false)
  const activeEdges = config.edges.filter(edge => edge.active !== false)
  const activeDoughs = config.doughs.filter(dough => dough.active !== false)

  const [sizeId, setSizeId] = useState('')
  const [flavorIds, setFlavorIds] = useState([])
  const [edgeId, setEdgeId] = useState('')
  const [doughId, setDoughId] = useState('')
  const [notes, setNotes] = useState('')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setSizeId(activeSizes[0]?.id || '')
    setFlavorIds([])
    setEdgeId(activeEdges[0]?.id || '')
    setDoughId(activeDoughs[0]?.id || '')
    setNotes('')
    setTouched(false)
  }, [isOpen, product?.id])

  const selectedSize = activeSizes.find(size => size.id === sizeId)
  const selectedFlavors = flavorIds
    .map(id => activeFlavors.find(flavor => flavor.id === id))
    .filter(Boolean)
  const selectedEdge = activeEdges.find(edge => edge.id === edgeId)
  const selectedDough = activeDoughs.find(dough => dough.id === doughId)
  const maxFlavors = Number(selectedSize?.max_flavors || 1)
  const finalPrice = calculatePizzaPrice({
    size: selectedSize,
    flavors: selectedFlavors,
    edge: selectedEdge,
    dough: selectedDough,
    pricingRule: config.pricing_rule,
  })
  const toggleFlavor = (flavor) => {
    setTouched(true)
    setFlavorIds(current => {
      if (current.includes(flavor.id)) return current.filter(id => id !== flavor.id)
      if (current.length >= maxFlavors) return current
      return [...current, flavor.id]
    })
  }

  const handleSize = (nextSizeId) => {
    setSizeId(nextSizeId)
    const nextSize = activeSizes.find(size => size.id === nextSizeId)
    const nextMax = Number(nextSize?.max_flavors || 1)
    setFlavorIds(current => current.slice(0, nextMax))
  }

  const handleConfirm = () => {
    setTouched(true)
    if (!selectedSize || selectedFlavors.length === 0) return

    const selectedOptions = [
      { group_name: 'Tamanho', options: [buildPizzaSizeName(selectedSize)] },
      { group_name: 'Sabores', options: selectedFlavors.map(buildPizzaFlavorName) },
    ]

    if (selectedEdge) selectedOptions.push({ group_name: 'Borda', options: [selectedEdge.name] })
    if (selectedDough) selectedOptions.push({ group_name: 'Massa', options: [selectedDough.name] })
    if (selectedSize && selectedFlavors.length > 0) {
      selectedOptions.push({
        group_name: PIZZA_PRICE_GROUP_NAME,
        options: [buildPizzaPriceOptionName(config.pricing_rule, selectedSize.id, selectedFlavors.map(flavor => flavor.id))],
      })
    }

    const flavorPrefix = selectedFlavors.length > 1 ? selectedFlavors.map(flavor => `1/${selectedFlavors.length} ${flavor.name}`).join(', ') : selectedFlavors[0]?.name
    const cartName = `${product.name} ${selectedSize.name}`

    onConfirm({
      product: {
        ...product,
        name: cartName,
        price: finalPrice,
        promotional_price: null,
      },
      selectedOptions,
      notes: notes.trim(),
      summary: flavorPrefix,
    })
  }

  const canConfirm = selectedSize && selectedFlavors.length > 0

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Monte sua pizza" size="lg">
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-yellow-500/15 text-yellow-300">
            <Pizza size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">{product?.name}</h3>
            {product?.description && <p className="mt-1 text-sm text-gray-400">{product.description}</p>}
            <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(finalPrice)}</p>
          </div>
        </div>

        <section className="rounded-xl border border-dark-600 bg-dark-900/60 p-4">
          <h4 className="font-semibold text-white">1. Escolha o tamanho</h4>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {activeSizes.map(size => (
              <button key={size.id} type="button" onClick={() => handleSize(size.id)} className={optionButtonClass(size.id === sizeId)}>
                <span className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{size.name}</span>
                  {size.id === sizeId && <Check size={18} />}
                </span>
                <span className="mt-1 block text-sm opacity-80">
                  {formatCurrency(size.base_price)} - ate {size.max_flavors} sabor{Number(size.max_flavors) > 1 ? 'es' : ''}
                  {size.slices ? ` - ${size.slices} fatias` : ''}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-dark-600 bg-dark-900/60 p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="font-semibold text-white">2. Escolha os sabores</h4>
            <span className="text-xs text-gray-400">{selectedFlavors.length} de {maxFlavors} selecionados</span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {activeFlavors.map(flavor => {
              const checked = flavorIds.includes(flavor.id)
              const blocked = !checked && flavorIds.length >= maxFlavors
              return (
                <button key={flavor.id} type="button" disabled={blocked} onClick={() => toggleFlavor(flavor)} className={optionButtonClass(checked, blocked)}>
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{flavor.name}</span>
                    {checked && <Check size={18} />}
                  </span>
                  {flavor.description && <span className="mt-1 block text-sm opacity-75">{flavor.description}</span>}
                  <span className="mt-1 block text-sm opacity-80">{formatCurrency(flavor.prices?.[selectedSize?.id] || selectedSize?.base_price || 0)}</span>
                </button>
              )
            })}
          </div>
          {touched && selectedFlavors.length === 0 && (
            <p className="mt-3 rounded-lg border border-red-700 bg-red-900/30 p-3 text-sm text-red-200">Escolha pelo menos um sabor.</p>
          )}
        </section>

        {activeEdges.length > 0 && (
          <section className="rounded-xl border border-dark-600 bg-dark-900/60 p-4">
            <h4 className="font-semibold text-white">3. Escolha a borda</h4>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {activeEdges.map(edge => (
                <button key={edge.id} type="button" onClick={() => setEdgeId(edge.id)} className={optionButtonClass(edge.id === edgeId)}>
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{edge.name}</span>
                    <span>{edge.price > 0 ? `+${formatCurrency(edge.price)}` : 'Incluso'}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {activeDoughs.length > 0 && (
          <section className="rounded-xl border border-dark-600 bg-dark-900/60 p-4">
            <h4 className="font-semibold text-white">4. Escolha a massa</h4>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {activeDoughs.map(dough => (
                <button key={dough.id} type="button" onClick={() => setDoughId(dough.id)} className={optionButtonClass(dough.id === doughId)}>
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{dough.name}</span>
                    <span>{dough.price > 0 ? `+${formatCurrency(dough.price)}` : 'Incluso'}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-xl border border-dark-600 bg-dark-900/60 p-4">
          <label className="text-sm font-semibold text-white" htmlFor="pizza-notes">Observacao</label>
          <textarea
            id="pizza-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-white outline-none focus:border-white"
            placeholder="Ex: sem cebola, massa bem assada..."
          />
        </section>

        <div className="sticky bottom-0 -mx-4 -mb-4 border-t border-dark-600 bg-dark-800 p-4 sm:-mx-6 sm:-mb-6 sm:px-6">
          <Button type="button" size="lg" className="w-full" disabled={!canConfirm} onClick={handleConfirm}>
            <ShoppingCart size={20} className="mr-2" />
            Adicionar por {formatCurrency(finalPrice)}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default PizzaCustomizationModal
