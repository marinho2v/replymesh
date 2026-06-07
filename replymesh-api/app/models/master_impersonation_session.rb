require "digest"

class MasterImpersonationSession < ApplicationRecord
  STATUSES = %w[active revoked expired].freeze

  belongs_to :master_user, class_name: "User"
  belongs_to :company

  validates :token_hash, :expires_at, :status, presence: true
  validates :token_hash, uniqueness: true
  validates :status, inclusion: { in: STATUSES }

  scope :active, -> { where(status: "active", revoked_at: nil).where("expires_at > ?", Time.current) }

  def self.digest(token)
    Digest::SHA256.hexdigest(token.to_s)
  end

  def active?
    status == "active" && revoked_at.nil? && expires_at.future?
  end

  def revoke!
    update!(status: "revoked", revoked_at: Time.current)
  end

  def expire_if_needed!
    update!(status: "expired") if status == "active" && expires_at <= Time.current
  end
end
