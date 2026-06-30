module CloudStorageBacked
  extend ActiveSupport::Concern

  included do
    after_destroy_commit :delete_cloud_storage_assets
  end

  class_methods do
    def cloud_storage_fields(*fields)
      @cloud_storage_fields = fields.map(&:to_s)

      fields.each do |field|
        before_update do
          next unless will_save_change_to_attribute?(field)

          changed = attribute_change_to_be_saved(field)
          @cloud_storage_keys_to_delete ||= []
          @cloud_storage_keys_to_delete << changed.first if changed&.first.present?
        end
      end

      after_update_commit :delete_replaced_cloud_storage_assets
    end

    def cloud_storage_field_names
      @cloud_storage_fields || []
    end
  end

  def cloud_storage_url_for(field, fallback: nil)
    CloudStorageService.public_url_or_fallback(public_send(field), fallback) if respond_to?(field)
  end

  private

  def delete_replaced_cloud_storage_assets
    Array(@cloud_storage_keys_to_delete).uniq.each { |key| safe_delete_cloud_storage_key(key) }
    @cloud_storage_keys_to_delete = []
  end

  def delete_cloud_storage_assets
    self.class.cloud_storage_field_names.each do |field|
      next unless respond_to?(field)

      safe_delete_cloud_storage_key(public_send(field))
    end
  end

  def safe_delete_cloud_storage_key(key)
    return if key.blank?

    CloudStorageService.delete(key, company: cloud_storage_company)
  rescue StandardError => e
    Rails.logger.warn("Cloud storage cleanup skipped for #{self.class.name}##{id}: #{e.class}")
    nil
  end

  def cloud_storage_company
    respond_to?(:company) ? company : nil
  end
end
