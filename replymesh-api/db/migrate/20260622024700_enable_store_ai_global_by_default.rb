class EnableStoreAiGlobalByDefault < ActiveRecord::Migration[8.1]
  def up
    change_column_default :ai_global_settings, :store_ai_enabled, from: false, to: true
    execute "UPDATE ai_global_settings SET store_ai_enabled = TRUE WHERE store_ai_enabled = FALSE"
  end

  def down
    change_column_default :ai_global_settings, :store_ai_enabled, from: true, to: false
  end
end
