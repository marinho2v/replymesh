class User < ApplicationRecord
  has_secure_password

  GLOBAL_ROLES = %w[super_admin user motoboy].freeze
  STATUSES = %w[active inactive suspended].freeze

  has_many :company_members, dependent: :destroy
  has_many :companies, through: :company_members
  has_many :activity_logs, dependent: :nullify

  # ── Template da Loja (Fases 10-11) ────────────────────────────
  has_many :motoboys
  has_many :orders_as_attendant, class_name: "Order", foreign_key: :attendant_id
  has_many :table_sessions_opened, class_name: "TableSession", foreign_key: :opened_by_id
  has_many :table_sessions_as_attendant, class_name: "TableSession", foreign_key: :attendant_id
  has_many :table_sessions_closed, class_name: "TableSession", foreign_key: :closed_by_id
  has_many :cash_sessions_opened, class_name: "CashSession", foreign_key: :opened_by_id
  has_many :cash_sessions_closed, class_name: "CashSession", foreign_key: :closed_by_id
  has_many :cash_movements_created, class_name: "CashMovement", foreign_key: :created_by_id
  has_many :order_status_logs,    class_name: "OrderStatusLog",  foreign_key: :changed_by_id
  has_many :support_tickets, dependent: :nullify
  has_many :support_ticket_messages, dependent: :nullify
  has_many :ai_assistant_logs, dependent: :nullify
  has_many :ai_usage_logs, dependent: :nullify
  has_many :system_update_reads, dependent: :destroy
  belongs_to :master_role, optional: true
  has_many :master_invites_sent, class_name: "MasterInvite", foreign_key: :invited_by_id, dependent: :nullify
  has_many :master_impersonation_sessions, foreign_key: :master_user_id, dependent: :destroy
  has_many :master_audit_logs, foreign_key: :actor_id, dependent: :nullify

  normalizes :email, with: ->(email) { email.strip.downcase }

  validates :name, :email, :global_role, :status, presence: true
  validates :email, uniqueness: { case_sensitive: false }
  validates :global_role, inclusion: { in: GLOBAL_ROLES }
  validates :status, inclusion: { in: STATUSES }

  def super_admin? = global_role == "super_admin"
  def motoboy?     = global_role == "motoboy"
  def master_user? = super_admin? || master_role_id.present?

  def master_permission?(permission)
    super_admin? || master_role&.allows?(permission)
  end

  def release_email_for_reuse!
    original_email = email
    timestamp = Time.current.to_i

    self.email = "deleted+#{id}-#{timestamp}-#{original_email}"
    self.status = "inactive"
    self.master_role = nil
    self.password = SecureRandom.base58(32)
    save!
  end

  def as_json(options = {})
    super({ only: %i[id name email phone avatar_url global_role status last_sign_in_at created_at updated_at] }.merge(options))
      .merge(master_role: master_role&.as_json_safe)
  end
end
