class Notification < ApplicationRecord
  TYPES = %w[
    order ticket system_update whatsapp billing stock cash system_alert
  ].freeze

  belongs_to :company, optional: true
  belongs_to :user, optional: true

  validates :title, presence: true
  validates :notification_type, inclusion: { in: TYPES }

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :for_user, ->(uid) { where(user_id: uid) }
  scope :unread, -> { where(read_at: nil) }
  scope :read, -> { where.not(read_at: nil) }
  scope :recent, -> { order(created_at: :desc).limit(30) }

  def read?
    read_at.present?
  end

  def mark_read!
    update!(read_at: Time.current) unless read?
  end

  def as_notification_json
    {
      id: id,
      title: title,
      message: message,
      notification_type: notification_type,
      read: read?,
      read_at: read_at&.iso8601,
      link_url: link_url,
      metadata: metadata || {},
      created_at: created_at.iso8601,
    }
  end
end
