class WhatsappInstance < ApplicationRecord
  PROVIDERS = %w[evolution_go].freeze
  STATUSES = %w[not_created created connecting connected disconnected error].freeze

  belongs_to :company
  has_many :whatsapp_logs, dependent: :nullify

  validates :provider, :instance_name, :status, presence: true
  validates :provider, inclusion: { in: PROVIDERS }
  validates :status, inclusion: { in: STATUSES }
  validates :instance_name, uniqueness: { scope: :company_id }
  validates :instance_uuid, uniqueness: true, allow_blank: true

  scope :canonical_order, lambda {
    order(
      Arel.sql("CASE status WHEN 'connected' THEN 0 WHEN 'connecting' THEN 1 WHEN 'disconnected' THEN 2 WHEN 'created' THEN 3 ELSE 4 END"),
      Arel.sql("CASE WHEN instance_token IS NULL OR instance_token = '' THEN 1 ELSE 0 END"),
      updated_at: :desc
    )
  }

  def self.primary_for_company(company)
    where(company_id: company.id).canonical_order.first
  end

  def safe_json
    {
      id: id,
      provider: provider,
      instance_name: instance_name,
      instance_uuid: instance_uuid,
      status: status,
      remote_status: remote_status,
      base_url: base_url,
      connected_number: connected_number,
      last_connected_at: last_connected_at,
      last_disconnected_at: last_disconnected_at,
      last_remote_sync_at: last_remote_sync_at,
      created_at: created_at,
      updated_at: updated_at,
      source: "local",
      remote_linked: remote_status.present? || remote_data.present?,
      raw_status: remote_status.presence || status
    }
  end
end
