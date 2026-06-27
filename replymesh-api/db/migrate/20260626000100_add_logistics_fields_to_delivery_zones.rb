class AddLogisticsFieldsToDeliveryZones < ActiveRecord::Migration[8.1]
  def change
    add_column :delivery_zones, :estimated_distance_km, :decimal, precision: 8, scale: 2
    add_column :delivery_zones, :logistics_group, :string
    add_column :delivery_zones, :latitude, :decimal, precision: 10, scale: 7
    add_column :delivery_zones, :longitude, :decimal, precision: 10, scale: 7
    add_column :delivery_zones, :internal_note, :text

    add_index :delivery_zones, [:company_id, :logistics_group], name: "idx_delivery_zones_company_logistics_group"
  end
end
