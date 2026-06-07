class StoreAiMessage < ApplicationRecord
  belongs_to :store_ai_conversation

  validates :role, inclusion: { in: %w[user assistant system] }
  validates :content, presence: true
end
