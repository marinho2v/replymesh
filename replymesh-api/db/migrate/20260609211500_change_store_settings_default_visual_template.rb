class ChangeStoreSettingsDefaultVisualTemplate < ActiveRecord::Migration[8.1]
  def change
    change_column_default :store_settings,
                          :visual_template_id,
                          from: "hamburgueria-classic",
                          to: "hamburgueria-premium"
  end
end
