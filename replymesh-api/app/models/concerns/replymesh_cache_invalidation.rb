# frozen_string_literal: true

module ReplymeshCacheInvalidation
  extend ActiveSupport::Concern

  included do
    after_commit :invalidate_replymesh_cache
  end

  private

  def invalidate_replymesh_cache
    ReplymeshCacheService.invalidate_record(self, groups: self.class.replymesh_cache_groups)
  end

  class_methods do
    def invalidates_replymesh_cache(*groups)
      @replymesh_cache_groups = groups.flatten.map { |group| group.to_s.tr("-", "_").to_sym }.uniq
    end

    def replymesh_cache_groups
      @replymesh_cache_groups.presence || %i[store menu settings dashboard ai_context]
    end
  end
end
