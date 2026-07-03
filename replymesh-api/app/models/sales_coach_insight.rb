# frozen_string_literal: true

class SalesCoachInsight < ApplicationRecord
  include ReplymeshCacheInvalidation

  STATUSES = %w[new viewed accepted ignored archived manual_executed].freeze
  FEEDBACK_RESULTS = %w[worked not_worked].freeze

  invalidates_replymesh_cache :dashboard, :sales_coach, :sales_coach_learning, :business_intelligence, :replymesh_strategy

  belongs_to :company

  before_validation :ensure_public_id, on: :create
  before_validation :normalize_values

  validates :public_id, :stable_key, :title, :category, :priority, :status, presence: true
  validates :public_id, uniqueness: { scope: :company_id }
  validates :stable_key, uniqueness: { scope: :company_id }
  validates :status, inclusion: { in: STATUSES }
  validates :feedback_result, inclusion: { in: FEEDBACK_RESULTS }, allow_blank: true
  validates :confidence, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validates :estimated_value_cents, :feedback_impact_cents, numericality: { greater_than_or_equal_to: 0 }

  scope :recent, -> { order(generated_at: :desc, created_at: :desc) }
  scope :active, -> { where.not(status: "archived") }
  scope :accepted, -> { where(status: "accepted") }
  scope :ignored, -> { where(status: "ignored") }
  scope :worked, -> { where(feedback_result: "worked") }

  def mark_status!(new_status)
    normalized = new_status.to_s
    raise ArgumentError, "Status invalido" unless STATUSES.include?(normalized)

    updates = { status: normalized }
    case normalized
    when "viewed" then updates[:viewed_at] = Time.current
    when "accepted" then updates[:accepted_at] = Time.current
    when "ignored" then updates[:ignored_at] = Time.current
    when "archived" then updates[:archived_at] = Time.current
    when "manual_executed" then updates[:manual_executed_at] = Time.current
    end
    update!(updates)
  end

  def mark_feedback!(result, impact_cents: nil)
    normalized = result.to_s
    raise ArgumentError, "Feedback invalido" unless FEEDBACK_RESULTS.include?(normalized)

    updates = {
      feedback_result: normalized,
      feedback_impact_cents: [impact_cents.to_i, 0].max
    }
    updates[normalized == "worked" ? :worked_at : :failed_at] = Time.current
    update!(updates)
  end

  def as_learning_json
    {
      id: public_id,
      title: title,
      category: category,
      priority: priority,
      status: status,
      feedback_result: feedback_result,
      estimated_value_cents: estimated_value_cents,
      feedback_impact_cents: feedback_impact_cents,
      confidence: confidence,
      origin: origin,
      suggested_action: suggested_action,
      generated_at: generated_at&.iso8601,
      updated_at: updated_at&.iso8601
    }
  end

  private

  def ensure_public_id
    self.public_id ||= "coach_#{SecureRandom.hex(10)}"
  end

  def normalize_values
    self.status = status.to_s.presence || "new"
    self.category = category.to_s.presence || "Geral"
    self.priority = priority.to_s.presence || "Baixa"
    self.confidence = confidence.to_i.clamp(0, 100)
    self.estimated_value_cents = [estimated_value_cents.to_i, 0].max
    self.feedback_impact_cents = [feedback_impact_cents.to_i, 0].max
    self.metadata_json = {} unless metadata_json.is_a?(Hash)
  end
end
