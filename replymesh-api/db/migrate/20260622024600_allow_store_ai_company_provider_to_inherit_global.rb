class AllowStoreAiCompanyProviderToInheritGlobal < ActiveRecord::Migration[8.1]
  def up
    change_column_default :store_ai_settings, :ai_provider, from: "anthropic", to: nil
    change_column_null :store_ai_settings, :ai_provider, true
    execute <<~SQL.squish
      UPDATE store_ai_settings
      SET ai_provider = NULL
      WHERE ai_provider = 'anthropic'
        AND (ai_model IS NULL OR ai_model = '')
    SQL
  end

  def down
    execute "UPDATE store_ai_settings SET ai_provider = 'anthropic' WHERE ai_provider IS NULL"
    change_column_null :store_ai_settings, :ai_provider, false
    change_column_default :store_ai_settings, :ai_provider, from: nil, to: "anthropic"
  end
end
