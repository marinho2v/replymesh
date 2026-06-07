module Api
  module V1
    module Store
      class CustomerAddressesController < BaseController
        before_action :set_customer
        before_action :set_address, only: %i[show update destroy]

        def index
          addresses = @customer.customer_addresses.default_first
          render_ok(addresses: addresses.as_json(only: %i[id zip_code street number complement neighborhood city state reference is_default]))
        end

        def show
          render_ok(address: @address.as_json(only: %i[id zip_code street number complement neighborhood city state reference is_default]))
        end

        def create
          address = @customer.customer_addresses.build(address_params)
          if address.save
            render_created(address: address.as_json(only: %i[id zip_code street number complement neighborhood city state reference is_default]))
          else
            render_record_errors(address)
          end
        end

        def update
          if @address.update(address_params)
            render_ok(address: @address.as_json(only: %i[id zip_code street number complement neighborhood city state reference is_default]))
          else
            render_record_errors(@address)
          end
        end

        def destroy
          @address.destroy
          render_ok(message: "Endereço removido")
        end

        private

        def set_customer
          @customer = company_scope(Customer).find_by(id: params[:customer_id])
          render_not_found("Cliente") unless @customer
        end

        def set_address
          @address = @customer.customer_addresses.find_by(id: params[:id])
          render_not_found("Endereço") unless @address
        end

        def address_params
          params.require(:address).permit(:zip_code, :street, :number, :complement, :neighborhood, :city, :state, :reference, :is_default)
                .merge(company_id: current_company.id)
        end
      end
    end
  end
end
