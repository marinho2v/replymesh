class AddSslStatusToCompanies < ActiveRecord::Migration[8.0]
  DEFAULT_DOMAIN = "replymesh.cloud"
  OLD_DOMAIN = "replymesh.com.br"

  def up
    add_column :companies, :ssl_status, :string, default: "pending", null: false unless column_exists?(:companies, :ssl_status)
    add_index :companies, :ssl_status unless index_exists?(:companies, :ssl_status)

    execute <<~SQL.squish
      UPDATE companies
      SET subdomain = REPLACE(subdomain, '.#{OLD_DOMAIN}', '.#{DEFAULT_DOMAIN}')
      WHERE subdomain LIKE '%.#{OLD_DOMAIN}'
    SQL

    execute <<~SQL.squish
      UPDATE companies
      SET primary_domain = REPLACE(primary_domain, '.#{OLD_DOMAIN}', '.#{DEFAULT_DOMAIN}')
      WHERE primary_domain LIKE '%.#{OLD_DOMAIN}'
    SQL

    execute <<~SQL.squish
      UPDATE companies
      SET ssl_status = COALESCE(NULLIF(ssl_status, ''), 'pending')
    SQL
  end

  def down
    remove_index :companies, :ssl_status if index_exists?(:companies, :ssl_status)
    remove_column :companies, :ssl_status if column_exists?(:companies, :ssl_status)
  end
end
