class UpdateCarinaDefaultModel < ActiveRecord::Migration[7.1]
  NEW_MODEL = "claude-haiku-4-5-20251001"

  def up
    change_column_default :ai_global_settings, :model, from: "claude-3-5-haiku-latest", to: NEW_MODEL
    execute <<~SQL.squish
      UPDATE ai_global_settings
      SET model = '#{NEW_MODEL}', updated_at = CURRENT_TIMESTAMP
      WHERE model IS NULL OR model = '' OR model = 'claude-3-5-haiku-latest'
    SQL
  end

  def down
    change_column_default :ai_global_settings, :model, from: NEW_MODEL, to: "claude-3-5-haiku-latest"
  end
end
