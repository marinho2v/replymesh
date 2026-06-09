class CompanyFeatureOverride < ApplicationRecord
  MODES = %w[allow block].freeze

  belongs_to :company
  belongs_to :created_by, class_name: "User", optional: true

  before_validation :normalize_feature_key

  validates :feature_key, presence: true, inclusion: { in: FeatureCatalog.keys }
  validates :feature_key, uniqueness: { scope: :company_id }
  validates :mode, inclusion: { in: MODES }

  scope :allowed, -> { where(mode: "allow") }
  scope :blocked, -> { where(mode: "block") }
  scope :active, -> { where("expires_at IS NULL OR expires_at > ?", Time.current) }

  def expired?
    expires_at.present? && expires_at <= Time.current
  end

  def as_json_safe
    as_json(only: %i[id feature_key mode internal_note expires_at created_by_id created_at updated_at])
      .merge(feature_label: FeatureCatalog.find(feature_key)&.label, expired: expired?)
  end

  private

  def normalize_feature_key
    self.feature_key = FeatureCatalog.canonical_key(feature_key)
  end
end
