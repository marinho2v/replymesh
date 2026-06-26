class CompanyModuleAssignment
  def self.apply!(company:, module_keys:, actor:, internal_note: nil)
    selected = CompanyModuleCatalog.normalize_selection(module_keys)
    selected_features = CompanyModuleCatalog.all
                                            .select { |company_module| selected.include?(company_module.key) }
                                            .flat_map(&:features)
                                            .uniq
    all_features = CompanyModuleCatalog.all.flat_map(&:features).uniq
    feature_modes = all_features.index_with do |feature_key|
      selected_features.include?(feature_key) || CompanyModuleCatalog.core_feature?(feature_key) ? "allow" : "block"
    end

    CompanyFeatureOverride.transaction do
      feature_modes.each do |feature_key, mode|
        override = company.company_feature_overrides.find_or_initialize_by(feature_key:)
        override.mode = mode
        override.internal_note = internal_note.presence || "Modulo personalizado pelo Painel Master"
        override.expires_at = nil
        override.created_by ||= actor
        override.save!
      end
    end

    sync_whatsapp_mode!(company, selected)
    selected
  end

  def self.sync_whatsapp_mode!(company, selected)
    setting = company.store_setting
    return unless setting

    mode = if selected.include?("whatsapp_automatic")
      "automatic"
    elsif selected.include?("whatsapp_manual")
      "manual"
    else
      "disabled"
    end
    setting.update!(whatsapp_mode: mode)
  end
  private_class_method :sync_whatsapp_mode!
end
