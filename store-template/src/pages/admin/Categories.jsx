import { useState } from 'react'
import { useCategories } from '../../hooks/useCategories'
import { railsCreateCategory, railsDeleteCategory, railsUpdateCategory } from '../../services/storeApi'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Edit, Eye, EyeOff, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const initialFormData = {
  name: '',
  slug: '',
  sort_order: 0,
  is_active: true,
}

const normalizeSlug = (value) => (
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
)

const Categories = () => {
  const { categories, setCategories, loading, refetch } = useCategories(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState({})
  const [formData, setFormData] = useState(initialFormData)

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setSaving(true)
      const data = {
        ...formData,
        slug: normalizeSlug(formData.slug || formData.name),
        sort_order: parseInt(formData.sort_order, 10) || 0,
        is_active: formData.is_active !== false,
      }

      if (editingCategory) {
        await railsUpdateCategory(editingCategory.id, data)
        toast.success('Categoria atualizada com sucesso!')
      } else {
        await railsCreateCategory(data)
        toast.success('Categoria criada com sucesso!')
      }

      setModalOpen(false)
      resetForm()
      refetch()
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error('Erro ao salvar categoria')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      sort_order: category.sort_order,
      is_active: category.is_active !== false,
    })
    setModalOpen(true)
  }

  const handleToggleActive = async (category) => {
    const nextActive = !category.is_active
    setActionLoading(prev => ({ ...prev, [category.id]: true }))

    try {
      const updated = await railsUpdateCategory(category.id, { is_active: nextActive })
      setCategories(prev => (prev || []).map(item => item.id === category.id ? { ...item, ...updated, is_active: nextActive } : item))
      toast.success(nextActive ? 'Categoria ativada' : 'Categoria desativada')
      refetch()
    } catch (error) {
      console.error('Error toggling category:', error)
      toast.error('Erro ao alterar status da categoria')
    } finally {
      setActionLoading(prev => ({ ...prev, [category.id]: false }))
    }
  }

  const handleDelete = async (category) => {
    const confirmed = confirm(
      `Excluir a categoria "${category.name}"?\n\n` +
      'Isso remove a categoria da listagem comum e do front. Os produtos vinculados continuam preservados.'
    )
    if (!confirmed) return

    setActionLoading(prev => ({ ...prev, [category.id]: true }))

    try {
      await railsDeleteCategory(category.id)
      setCategories(prev => (prev || []).filter(item => item.id !== category.id))
      toast.success('Categoria excluída com sucesso!')
      refetch()
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Erro ao excluir categoria')
    } finally {
      setActionLoading(prev => ({ ...prev, [category.id]: false }))
    }
  }

  const resetForm = () => {
    setEditingCategory(null)
    setFormData(initialFormData)
  }

  const openCreateModal = () => {
    resetForm()
    setModalOpen(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Categorias</h1>
          <p className="text-gray-400 mt-1">
            Desativar apenas oculta no cardapio. Excluir remove da listagem comum.
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus size={20} className="mr-2" />
          Nova Categoria
        </Button>
      </div>

      {loading ? (
        <div className="text-white text-center py-8">Carregando...</div>
      ) : categories?.length === 0 ? (
        <div className="text-gray-400 text-center py-8">Nenhuma categoria cadastrada.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories?.map((category) => (
            <Card key={category.id} className={!category.is_active ? 'opacity-70' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                      <Badge variant={category.is_active ? 'success' : 'default'}>
                        {category.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    <p className="text-gray-400 text-sm">{category.slug}</p>
                    <p className="text-gray-500 text-xs mt-2">Ordem: {category.sort_order}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-5">
                  <Button variant="secondary" size="sm" onClick={() => handleEdit(category)}>
                    <Edit size={16} className="mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant={category.is_active ? 'warning' : 'success'}
                    size="sm"
                    onClick={() => handleToggleActive(category)}
                    loading={actionLoading[category.id]}
                  >
                    {category.is_active ? (
                      <EyeOff size={16} className="mr-1" />
                    ) : (
                      <Eye size={16} className="mr-1" />
                    )}
                    {category.is_active ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(category)}
                    loading={actionLoading[category.id]}
                  >
                    <Trash2 size={16} className="mr-1" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome da categoria"
            required
            value={formData.name}
            onChange={(event) => {
              const name = event.target.value
              setFormData(prev => ({
                ...prev,
                name,
                slug: normalizeSlug(name),
              }))
            }}
          />

          <Input
            label="Slug (URL amigavel)"
            required
            value={formData.slug}
            onChange={(event) => setFormData(prev => ({ ...prev, slug: normalizeSlug(event.target.value) }))}
          />

          <Input
            label="Ordem de exibicao"
            type="number"
            value={formData.sort_order}
            onChange={(event) => setFormData(prev => ({ ...prev, sort_order: event.target.value }))}
          />

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(event) => setFormData(prev => ({ ...prev, is_active: event.target.checked }))}
              className="rounded"
            />
            <span className="text-white text-sm">Categoria ativa no cardapio</span>
          </label>

          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1" loading={saving}>
              {editingCategory ? 'Atualizar' : 'Criar'}
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

export default Categories
