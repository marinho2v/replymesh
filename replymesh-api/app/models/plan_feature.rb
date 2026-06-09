class PlanFeature < ApplicationRecord
  belongs_to :plan

  before_validation :normalize_feature_key

  validates :feature_key, presence: true, inclusion: { in: FeatureCatalog.keys }
  validates :feature_key, uniqueness: { scope: :plan_id }

  private

  def normalize_feature_key
    self.feature_key = FeatureCatalog.canonical_key(feature_key)
  end
end
