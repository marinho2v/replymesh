class MasterInvite < ApplicationRecord
  STATUSES = %w[pending accepted canceled expired].freeze

  belongs_to :master_role
  belongs_to :invited_by, class_name: "User", optional: true

  normalizes :email, with: ->(email) { email.strip.downcase }

  validates :email, :token, :status, :expires_at, presence: true
  validates :token, uniqueness: true
  validates :status, inclusion: { in: STATUSES }

  before_validation :set_defaults, on: :create

  scope :recent, -> { order(created_at: :desc) }

  def refresh_expiration!
    update!(
      status: "pending",
      expires_at: 7.days.from_now,
      last_sent_at: Time.current,
      resend_count: resend_count + 1
    )
  end

  def expire_if_needed!
    update_column(:status, "expired") if status == "pending" && expires_at.past?
  end

  def as_json_safe(base_url: nil)
    expire_if_needed!
    {
      id: id,
      name: name,
      email: email,
      role: { id: master_role.id, name: master_role.name, key: master_role.key },
      status: status,
      expires_at: expires_at,
      last_sent_at: last_sent_at,
      resend_count: resend_count,
      invite_url: base_url ? "#{base_url}/convite-master/#{token}" : nil,
      created_at: created_at
    }
  end

  private

  def set_defaults
    self.token ||= SecureRandom.urlsafe_base64(24)
    self.expires_at ||= 7.days.from_now
    self.last_sent_at ||= Time.current
  end
end
