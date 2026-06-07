class WhatsappRemoteInstance < ApplicationRecord
  validates :instance_name, presence: true, uniqueness: true
  validates :instance_uuid, uniqueness: true, allow_blank: true
end
