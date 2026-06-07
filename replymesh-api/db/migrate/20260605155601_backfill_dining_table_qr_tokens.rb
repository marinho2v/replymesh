class BackfillDiningTableQrTokens < ActiveRecord::Migration[7.1]
  class MigrationDiningTable < ActiveRecord::Base
    self.table_name = "dining_tables"
  end

  def up
    MigrationDiningTable.where(qr_token: [nil, ""]).find_each do |table|
      token = nil
      loop do
        token = SecureRandom.urlsafe_base64(18).delete("-_")[0, 24].downcase
        break unless MigrationDiningTable.where(company_id: table.company_id, qr_token: token).exists?
      end

      table.update_columns(
        qr_token: token,
        qr_generated_at: Time.current,
        qr_updated_at: Time.current
      )
    end
  end

  def down
    # Mantem tokens gerados; remover quebraria QR Codes ja impressos.
  end
end
