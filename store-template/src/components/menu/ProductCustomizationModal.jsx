import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Check, ShoppingCart } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { formatCurrency } from '../../utils/currency'

const getSelectedIds = (selected, groupId) => selected[groupId] || []

const getGroupInstruction = (group) => {
  if (group.type === 'single') {
    return group.required ? 'Escolha 1 opcao' : 'Escolha ate 1 opcao'
  }

  if (group.required && Number(group.min_select || 0) > 0) {
    return `Escolha de ${group.min_select} ate ${group.max_select} opcoes`
  }

  return `Escolha ate ${group.max_select} opcoes`
}

const ProductCustomizationModal = ({
  isOpen,
  onClose,
  product,
  optionGroups = [],
  loading = false,
  onConfirm,
}) => {
  const [selected, setSelected] = useState({})
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSelected({})
      setTouched(false)
    }
  }, [isOpen, product?.id])

  const validation = useMemo(() => {
    const errors = []

    optionGroups.forEach(group => {
      const selectedCount = getSelectedIds(selected, group.id).length
      const minSelect = group.required ? Math.max(Number(group.min_select || 1), 1) : Number(group.min_select || 0)
      const maxSelect = Number(group.max_select || (group.type === 'single' ? 1 : 999))

      if (selectedCount < minSelect) {
        errors.push(`Escolha ${minSelect} opcao em ${group.name}`)
      }

      if (selectedCount > maxSelect) {
        errors.push(`${group.name} permite no maximo ${maxSelect} opcoes`)
      }
    })

    return {
      valid: errors.length === 0,
      errors,
    }
  }, [optionGroups, selected])

  const selectedItems = useMemo(() => (
    optionGroups.flatMap(group => {
      const selectedIds = getSelectedIds(selected, group.id)
      return (group.items || []).filter(item => selectedIds.includes(item.id))
    })
  ), [optionGroups, selected])

  const additionalTotal = selectedItems.reduce((sum, item) => sum + Number(item.additional_price || 0), 0)
  const basePrice = Number(product?.promotional_price || product?.price || 0)
  const finalPrice = basePrice + additionalTotal

  const toggleOption = (group, option) => {
    setTouched(true)

    setSelected(prev => {
      const current = getSelectedIds(prev, group.id)

      if (group.type === 'single') {
        return {
          ...prev,
          [group.id]: current.includes(option.id) ? [] : [option.id],
        }
      }

      if (current.includes(option.id)) {
        return {
          ...prev,
          [group.id]: current.filter(id => id !== option.id),
        }
      }

      if (current.length >= Number(group.max_select || 999)) {
        return prev
      }

      return {
        ...prev,
        [group.id]: [...current, option.id],
      }
    })
  }

  const handleConfirm = () => {
    setTouched(true)
    if (!validation.valid) return

    const selectedOptions = optionGroups
      .map(group => {
        const selectedIds = getSelectedIds(selected, group.id)
        const options = (group.items || [])
          .filter(item => selectedIds.includes(item.id))
          .map(item => item.name)

        return {
          group_name: group.name,
          options,
        }
      })
      .filter(group => group.options.length > 0)

    onConfirm({
      product: {
        ...product,
        price: finalPrice,
        promotional_price: null,
      },
      selectedOptions,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Monte seu produto" size="lg">
      <div className="space-y-5">
        <div>
          <h3 className="text-2xl font-bold text-white">{product?.name}</h3>
          {product?.description && (
            <p className="mt-1 text-sm text-gray-400">{product.description}</p>
          )}
          <p className="mt-3 text-xl font-bold text-white">{formatCurrency(finalPrice)}</p>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-400">Carregando opcoes...</div>
        ) : optionGroups.length === 0 ? (
          <div className="rounded-lg border border-yellow-700 bg-yellow-900/20 p-4 text-sm text-yellow-200">
            Este produto esta marcado como customizavel, mas ainda nao possui grupos de opcoes.
          </div>
        ) : (
          optionGroups.map(group => {
            const selectedIds = getSelectedIds(selected, group.id)
            const maxSelect = Number(group.max_select || (group.type === 'single' ? 1 : 999))
            const showError = touched && group.required && selectedIds.length === 0

            return (
              <section key={group.id} className={`rounded-xl border p-4 ${showError ? 'border-red-600 bg-red-950/20' : 'border-dark-600 bg-dark-900/60'}`}>
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{group.name}</h4>
                    <p className="text-sm text-gray-400">{getGroupInstruction(group)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {group.required && <Badge variant="warning">Obrigatorio</Badge>}
                    {group.type === 'multiple' && (
                      <span className="rounded-full bg-dark-700 px-3 py-1 text-xs text-gray-200">
                        {selectedIds.length} de {maxSelect} selecionados
                      </span>
                    )}
                  </div>
                </div>

                {showError && (
                  <div className="mb-3 flex items-center gap-2 text-sm text-red-300">
                    <AlertCircle size={16} />
                    Escolha uma opcao para continuar.
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(group.items || []).map(option => {
                    const checked = selectedIds.includes(option.id)
                    const blocked = group.type === 'multiple' && !checked && selectedIds.length >= maxSelect

                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={blocked}
                        onClick={() => toggleOption(group, option)}
                        className={`flex min-h-12 items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${
                          checked
                            ? 'border-white bg-white text-black'
                            : 'border-dark-600 bg-dark-800 text-gray-200 hover:border-dark-500'
                        } ${blocked ? 'cursor-not-allowed opacity-45' : ''}`}
                      >
                        <span className="font-medium">{option.name}</span>
                        <span className="flex items-center gap-2 text-sm">
                          {Number(option.additional_price || 0) > 0 && (
                            <span>+{formatCurrency(option.additional_price)}</span>
                          )}
                          {checked && <Check size={18} />}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })
        )}

        {touched && !validation.valid && (
          <div className="rounded-lg border border-red-700 bg-red-900/30 p-3 text-sm text-red-200">
            {validation.errors[0]}
          </div>
        )}

        <div className="sticky bottom-0 -mx-4 -mb-4 border-t border-dark-600 bg-dark-800 p-4 sm:-mx-6 sm:-mb-6 sm:px-6">
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={loading || optionGroups.length === 0 || !validation.valid}
            onClick={handleConfirm}
          >
            <ShoppingCart size={20} className="mr-2" />
            Adicionar ao carrinho
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ProductCustomizationModal

