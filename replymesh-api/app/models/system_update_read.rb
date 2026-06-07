class SystemUpdateRead < ApplicationRecord
  belongs_to :system_update
  belongs_to :company
  belongs_to :user

  validates :system_update_id, uniqueness: { scope: %i[company_id user_id] }
end
