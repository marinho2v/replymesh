# frozen_string_literal: true

class ReplymeshBrainKnowledge < ApplicationRecord
  SCOPES = %w[global company segment].freeze

  belongs_to :company, optional: true

  validates :scope, inclusion: { in: SCOPES }
  validates :metric_key, :dimension, :dimension_value, presence: true
  validates :sample_size, :success_count, :estimated_value_cents, numericality: { greater_than_or_equal_to: 0 }
  validates :conversion_rate, numericality: { greater_than_or_equal_to: 0 }

  scope :recent, -> { order(calculated_at: :desc, updated_at: :desc) }
  scope :global_scope, -> { where(scope: "global", company_id: nil) }
  scope :for_company, ->(company) { where(scope: "company", company_id: company) }

  def as_brain_json
    {
      scope: scope,
      company_id: company_id,
      segment: segment,
      metric_key: metric_key,
      dimension: dimension,
      dimension_value: dimension_value,
      sample_size: sample_size,
      success_count: success_count,
      conversion_rate: conversion_rate.to_f.round(4),
      conversion_percent: (conversion_rate.to_f * 100).round(1),
      estimated_value_cents: estimated_value_cents,
      calculated_at: calculated_at&.iso8601
    }
  end
end
