class SystemUpdate < ApplicationRecord
  UPDATE_TYPES = %w[news improvement fix warning maintenance].freeze
  STATUSES = %w[draft published].freeze
  AUDIENCES = %w[all plan company].freeze

  belongs_to :company, optional: true
  has_many :system_update_reads, dependent: :destroy

  validates :title, :short_description, :content, :version, presence: true
  validates :update_type, inclusion: { in: UPDATE_TYPES }
  validates :status, inclusion: { in: STATUSES }
  validates :audience_type, inclusion: { in: AUDIENCES }
  validates :company, presence: true, if: -> { audience_type == "company" }
  validates :plan_key, presence: true, if: -> { audience_type == "plan" }

  scope :published, -> { where(status: "published").where("published_at <= ?", Time.current) }
  scope :recent_first, -> { order(is_featured: :desc, published_at: :desc, created_at: :desc) }

  before_destroy :remove_notifications

  def visible_to?(target_company)
    return false unless status == "published" && published_at.present? && published_at <= Time.current

    case audience_type
    when "all"
      true
    when "company"
      company_id == target_company.id
    when "plan"
      target_company.subscriptions.joins(:plan).where(plans: { slug: plan_key }).exists?
    else
      false
    end
  end

  def publish!
    update!(status: "published", published_at: published_at || Time.current)
  end

  def unpublish!
    update!(status: "draft")
  end

  private

  def remove_notifications
    Notification.where(notification_type: "system_update")
      .where("metadata ->> 'system_update_id' = ?", id.to_s)
      .delete_all
  end
end
