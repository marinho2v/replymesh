class FeatureGate
  Result = Struct.new(:enabled, :feature, :required_plan, :source, :subscription_status, keyword_init: true) do
    def enabled? = enabled
  end

  ACTIVE_STATUSES = %w[active trial].freeze

  class << self
    def enabled?(company, feature_key)
      check(company, feature_key).enabled?
    end

    def check(company, feature_key)
      feature = FeatureCatalog.find(feature_key)
      return result(false, feature_key, "pro", "unknown_feature", company) unless company && feature

      override = company.company_feature_overrides.find_by(feature_key: feature.key)
      return result(false, feature.key, feature.minimum_plan, "manual_block", company) if override&.mode == "block"

      subscription = current_subscription(company)
      return result(false, feature.key, feature.minimum_plan, "subscription_inactive", company, subscription) unless subscription_active?(company, subscription)
      return result(true, feature.key, feature.minimum_plan, "manual_allow", company, subscription) if override&.mode == "allow" && !override.expired?

      plan = subscription&.plan
      plan_key = FeatureCatalog.normalize_plan_slug(plan&.slug)
      enabled = plan_allows?(plan, plan_key, feature.key)
      result(enabled, feature.key, feature.minimum_plan, enabled ? "plan" : "plan_missing", company, subscription)
    end

    def access_map(company)
      features = FeatureCatalog.all.map do |feature|
        gate = check(company, feature.key)
        feature.to_h.merge(
          enabled: gate.enabled?,
          source: gate.source,
          required_plan_label: FeatureCatalog.required_plan_label(gate.required_plan)
        )
      end

      {
        plan: current_subscription(company)&.plan&.as_json(only: %i[id name slug price_cents billing_cycle description]),
        subscription_status: current_subscription(company)&.status || company&.plan_status,
        features: features,
        allowed: features.select { |item| item[:enabled] }.map { |item| item[:key] },
        blocked: features.reject { |item| item[:enabled] }.map { |item| item[:key] },
        inherited: features.select { |item| item[:enabled] && item[:source] == "plan" }.map { |item| item[:key] },
        manual_allowed: features.select { |item| item[:enabled] && item[:source] == "manual_allow" }.map { |item| item[:key] },
        manual_blocked: features.select { |item| item[:source] == "manual_block" }.map { |item| item[:key] },
        expired_overrides: company.company_feature_overrides.select(&:expired?).map(&:as_json_safe),
        overrides: company.company_feature_overrides.order(:feature_key).map(&:as_json_safe)
      }
    end

    private

    def current_subscription(company)
      company.subscriptions.includes(:plan).order(created_at: :desc).first
    end

    def subscription_active?(company, subscription)
      status = subscription&.status || company.plan_status
      return false unless status.in?(ACTIVE_STATUSES)
      return false if status == "trial" && company.trial_ends_at.present? && company.trial_ends_at.past?

      true
    end

    def plan_allows?(plan, plan_key, feature_key)
      configured = plan&.plan_features&.loaded? ? plan.plan_features : plan&.plan_features
      if configured&.exists?
        return configured.where(feature_key: FeatureCatalog.canonical_key(feature_key), enabled: true).exists?
      end

      FeatureCatalog.features_for_plan(plan_key).include?(feature_key)
    end

    def result(enabled, feature, required_plan, source, company, subscription = nil)
      Result.new(
        enabled: enabled,
        feature: feature.to_s,
        required_plan: required_plan,
        source: source,
        subscription_status: subscription&.status || company&.plan_status
      )
    end
  end
end
