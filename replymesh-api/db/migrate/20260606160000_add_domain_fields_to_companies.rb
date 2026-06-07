class AddDomainFieldsToCompanies < ActiveRecord::Migration[8.0]
  DEFAULT_DOMAIN = "replymesh.cloud"

  def up
    add_column :companies, :subdomain, :string unless column_exists?(:companies, :subdomain)
    add_column :companies, :custom_domain, :string unless column_exists?(:companies, :custom_domain)
    add_column :companies, :primary_domain, :string unless column_exists?(:companies, :primary_domain)
    add_column :companies, :domain_status, :string, default: "pending", null: false unless column_exists?(:companies, :domain_status)
    add_column :companies, :custom_domain_status, :string, default: "pending", null: false unless column_exists?(:companies, :custom_domain_status)
    add_column :companies, :dns_verified_at, :datetime unless column_exists?(:companies, :dns_verified_at)

    execute <<~SQL.squish
      UPDATE companies
      SET subdomain = slug || '.#{DEFAULT_DOMAIN}',
          primary_domain = slug || '.#{DEFAULT_DOMAIN}',
          domain_status = COALESCE(NULLIF(domain_status, ''), 'pending'),
          custom_domain_status = COALESCE(NULLIF(custom_domain_status, ''), 'pending')
    SQL

    change_column_null :companies, :subdomain, false
    change_column_null :companies, :primary_domain, false

    add_index :companies, :subdomain, unique: true unless index_exists?(:companies, :subdomain)
    add_index :companies, :primary_domain, unique: true unless index_exists?(:companies, :primary_domain)
    add_index :companies, :custom_domain, unique: true, where: "custom_domain IS NOT NULL" unless index_exists?(:companies, :custom_domain)
    add_index :companies, :domain_status unless index_exists?(:companies, :domain_status)
  end

  def down
    remove_index :companies, :domain_status if index_exists?(:companies, :domain_status)
    remove_index :companies, :custom_domain if index_exists?(:companies, :custom_domain)
    remove_index :companies, :primary_domain if index_exists?(:companies, :primary_domain)
    remove_index :companies, :subdomain if index_exists?(:companies, :subdomain)

    remove_column :companies, :dns_verified_at if column_exists?(:companies, :dns_verified_at)
    remove_column :companies, :custom_domain_status if column_exists?(:companies, :custom_domain_status)
    remove_column :companies, :domain_status if column_exists?(:companies, :domain_status)
    remove_column :companies, :primary_domain if column_exists?(:companies, :primary_domain)
    remove_column :companies, :custom_domain if column_exists?(:companies, :custom_domain)
    remove_column :companies, :subdomain if column_exists?(:companies, :subdomain)
  end
end
