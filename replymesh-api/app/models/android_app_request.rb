class AndroidAppRequest < ApplicationRecord
  STATUSES = %w[requested under_review in_development publishing published adjustments_requested update_pending updated].freeze

  belongs_to :company
  belongs_to :responsible, class_name: "User", optional: true

  validates :app_name, :display_name, presence: true
  validates :company_id, uniqueness: true
  validates :status, inclusion: { in: STATUSES }

  scope :recent, -> { order(updated_at: :desc) }

  def as_json_safe
    {
      id: id, company_id: company_id, app_name: app_name, display_name: display_name,
      logo_url: logo_url, icon_url: icon_url, splash_url: splash_url,
      primary_color: primary_color, secondary_color: secondary_color,
      support_whatsapp: support_whatsapp, notes: notes, status: status,
      requested_at: requested_at, approved_at: approved_at, published_at: published_at,
      responsible: responsible && { id: responsible.id, name: responsible.name },
      created_at: created_at, updated_at: updated_at
    }
  end
end
