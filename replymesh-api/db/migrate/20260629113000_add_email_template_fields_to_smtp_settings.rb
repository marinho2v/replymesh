class AddEmailTemplateFieldsToSmtpSettings < ActiveRecord::Migration[7.1]
  def change
    add_column :smtp_settings, :email_template_brand_name, :string
    add_column :smtp_settings, :email_template_logo_url, :string
    add_column :smtp_settings, :email_template_primary_color, :string, default: "#090a0d", null: false
    add_column :smtp_settings, :email_template_footer_text, :string
    add_column :smtp_settings, :confirmation_email_subject, :string
    add_column :smtp_settings, :confirmation_email_title, :string
    add_column :smtp_settings, :confirmation_email_intro, :text
    add_column :smtp_settings, :password_reset_email_subject, :string
    add_column :smtp_settings, :password_reset_email_title, :string
    add_column :smtp_settings, :password_reset_email_intro, :text
  end
end
