# frozen_string_literal: true

class CreateReplymeshBrainKnowledge < ActiveRecord::Migration[7.1]
  def change
    create_table :replymesh_brain_knowledge do |t|
      t.string :scope, null: false, default: "global"
      t.references :company, foreign_key: true
      t.string :segment
      t.string :metric_key, null: false
      t.string :dimension, null: false
      t.string :dimension_value, null: false
      t.integer :sample_size, null: false, default: 0
      t.integer :success_count, null: false, default: 0
      t.decimal :conversion_rate, precision: 8, scale: 4, null: false, default: 0
      t.integer :estimated_value_cents, null: false, default: 0
      t.datetime :calculated_at
      t.jsonb :metadata_json, null: false, default: {}

      t.timestamps
    end

    add_index :replymesh_brain_knowledge,
              %i[scope company_id segment metric_key dimension dimension_value],
              unique: true,
              name: "index_replymesh_brain_unique_knowledge"
    add_index :replymesh_brain_knowledge, %i[metric_key dimension]
    add_index :replymesh_brain_knowledge, :calculated_at
  end
end
