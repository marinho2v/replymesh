module Api
  module V1
    module Public
      class CustomersController < BaseController
        # GET /api/v1/public/:company_slug/customers/lookup?phone=...
        def lookup
          phone = normalize_phone(params[:phone])
          variants = phone_variants(phone)
          return render_error("Telefone invalido") if variants.none? { |value| value.length >= 10 }

          customer = current_company.customers
                                    .includes(:customer_addresses)
                                    .where(
                                      "regexp_replace(coalesce(phone, ''), '\\D', '', 'g') IN (:phones)
                                       OR regexp_replace(coalesce(whatsapp, ''), '\\D', '', 'g') IN (:phones)",
                                      phones: variants
                                    )
                                    .order(Arel.sql("total_orders DESC, total_spent_cents DESC, updated_at DESC"))
                                    .first

          return render_ok(found: false, customer: nil) unless customer

          addresses = customer.customer_addresses.default_first.limit(3)

          render_ok(
            found: true,
            customer: {
              full_name: customer.full_name,
              phone: customer.phone,
              whatsapp: customer.whatsapp.presence || customer.phone,
              public_notes: customer.notes,
              last_address: addresses.first ? serialize_address(addresses.first) : nil,
              addresses: addresses.map { |address| serialize_address(address) },
              coupons: serialize_coupons(
                current_company.coupons.valid_now
                               .where("customer_id IS NULL OR customer_id = ?", customer.id)
                               .order(created_at: :desc)
                               .limit(10)
              )
            }
          )
        end

        private

        def normalize_phone(value)
          value.to_s.gsub(/\D/, "")
        end

        def phone_variants(value)
          digits = normalize_phone(value)
          without_country = digits.sub(/\A55/, "")
          without_leading_zero = digits.sub(/\A0/, "")
          local_number = without_country.sub(/\A0/, "")

          [
            digits,
            without_country,
            without_leading_zero,
            local_number,
            local_number.length >= 10 ? "55#{local_number}" : nil,
            local_number.length >= 10 ? "0#{local_number}" : nil
          ].compact.map { |phone| normalize_phone(phone) }.reject(&:blank?).uniq
        end

        def serialize_address(address)
          {
            id: address.id,
            zip_code: address.zip_code,
            cep: address.zip_code,
            street: address.street,
            number: address.number,
            complement: address.complement,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
            reference: address.reference
          }
        end

        def serialize_coupons(coupons)
          coupons.reject(&:exhausted?).map do |coupon|
            coupon.as_json(only: %i[id code title description discount_type discount_value minimum_order_cents expires_at source customer_id])
          end
        end
      end
    end
  end
end
