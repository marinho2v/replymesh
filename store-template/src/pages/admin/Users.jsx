import { useEffect, useState } from 'react'
import { getUsers, createUser, updateUser, deleteUser } from '../../services/auth'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Plus, Edit, Trash2, User } from 'lucide-react'
import { USER_ROLES } from '../../lib/constants'
import { toast } from 'sonner'

const emptyForm = {
  full_name: '',
  email: '',
  password: '',
  role: USER_ROLES.ATTENDANT,
  is_active: true,
}

const roleOptions = [
  { value: 'owner', label: 'Proprietario' },
  { value: USER_ROLES.ADMIN, label: 'Administrador' },
  { value: USER_ROLES.ATTENDANT, label: 'Atendente' },
  { value: USER_ROLES.KITCHEN, label: 'Cozinha' },
  { value: USER_ROLES.MOTOBOY, label: 'Motoboy' },
]

const roleLabel = (role) => roleOptions.find(option => option.value === role)?.label || role

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState(emptyForm)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await getUsers()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error(error.message || 'Erro ao carregar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingUser(null)
    setFormData(emptyForm)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          full_name: formData.full_name,
          role: formData.role,
          is_active: formData.is_active,
          ...(formData.password ? { password: formData.password } : {}),
        })
        toast.success('Usuario atualizado')
      } else {
        await createUser(formData)
        toast.success('Usuario criado')
      }

      setModalOpen(false)
      resetForm()
      fetchUsers()
    } catch (error) {
      console.error('[Users] Erro ao salvar usuario:', error)
      toast.error(error.message || 'Erro ao salvar usuario')
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      full_name: user.full_name || user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || USER_ROLES.ATTENDANT,
      is_active: user.is_active !== false,
    })
    setModalOpen(true)
  }

  const handleDelete = async (userId) => {
    if (!confirm('Desativar este usuario?')) return
    try {
      await deleteUser(userId)
      toast.success('Usuario desativado')
      fetchUsers()
    } catch (error) {
      toast.error(error.message || 'Erro ao desativar usuario')
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Usuarios</h1>
          <p className="mt-1 text-sm text-gray-400">Proprietario, administrador, atendente, cozinha e motoboy.</p>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true) }}>
          <Plus size={20} className="mr-2" />
          Novo usuario
        </Button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-white">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {users?.map((user) => (
            <Card key={user.id} className={!user.is_active ? 'opacity-50' : ''}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-dark-700">
                    <User size={24} className="text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{user.full_name || user.name}</h3>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>
                  <Badge variant={user.role === USER_ROLES.ADMIN || user.role === 'owner' ? 'primary' : 'default'}>
                    {roleLabel(user.role)}
                  </Badge>
                  <Badge variant={user.is_active !== false ? 'success' : 'danger'}>
                    {user.is_active !== false ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                    <Edit size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)}>
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? 'Editar usuario' : 'Novo usuario'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nome completo" required value={formData.full_name} onChange={(event) => setFormData({ ...formData, full_name: event.target.value })} />
          <Input label="Email" type="email" required value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} disabled={!!editingUser} />
          <Input
            label={editingUser ? 'Nova senha (opcional)' : 'Senha'}
            type="password"
            required={!editingUser}
            value={formData.password}
            onChange={(event) => setFormData({ ...formData, password: event.target.value })}
          />
          <Select label="Perfil" options={roleOptions} value={formData.role} onChange={(event) => setFormData({ ...formData, role: event.target.value })} />
          <label className="flex items-center gap-3 text-sm text-gray-200">
            <input
              type="checkbox"
              checked={formData.is_active !== false}
              onChange={(event) => setFormData({ ...formData, is_active: event.target.checked })}
            />
            Usuario ativo
          </label>
          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1">{editingUser ? 'Atualizar' : 'Criar'}</Button>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Users
