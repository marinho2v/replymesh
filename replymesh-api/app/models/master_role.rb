class MasterRole < ApplicationRecord
  STATUSES = %w[active inactive].freeze
  PERMISSION_KEYS = %w[
    companies.view companies.create companies.edit companies.suspend companies.delete
    tickets.view tickets.reply tickets.status
    finance.subscriptions finance.change_plan finance.payments
    settings.ai settings.brand settings.updates
    users.create users.edit users.permissions
    logs.audit impersonate_company view_audit_logs manage_audit_logs
  ].freeze

  has_many :users, dependent: :restrict_with_error
  has_many :master_invites, dependent: :restrict_with_error

  validates :name, :key, :status, presence: true
  validates :key, uniqueness: true
  validates :status, inclusion: { in: STATUSES }
  validate :permissions_are_known

  before_validation :normalize_key

  scope :active, -> { where(status: "active") }

  def allows?(permission)
    active? && ActiveModel::Type::Boolean.new.cast(permissions.to_h[permission.to_s])
  end

  def active? = status == "active"

  def as_json_safe
    {
      id: id,
      name: name,
      key: key,
      description: description,
      permissions: permissions,
      status: status,
      users_count: users.count,
      created_at: created_at,
      updated_at: updated_at
    }
  end

  private

  def normalize_key
    self.key = key.to_s.parameterize(separator: "_")
  end

  def permissions_are_known
    unknown = permissions.to_h.keys - PERMISSION_KEYS
    errors.add(:permissions, "contem permissoes desconhecidas: #{unknown.join(', ')}") if unknown.any?
  end
end
