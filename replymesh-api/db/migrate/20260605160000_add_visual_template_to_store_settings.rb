class AddVisualTemplateToStoreSettings < ActiveRecord::Migration[7.1]
  def change
    add_column :store_settings, :visual_template_id, :string, default: 'hamburgueria-classic', null: false
  end
end
