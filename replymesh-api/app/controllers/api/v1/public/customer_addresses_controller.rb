module Api
  module V1
    module Public
      class CustomerAddressesController < BaseController
        # DELETE /api/v1/public/:company_slug/customers/addresses/:id?phone=...
        def destroy
          phone = params[:phone].to_s.gsub(/\D/, "")
          return render_error("Telefone invalido") if phone.length < 10

          customer = current_company.customers.find_by(phone: phone)
          return render_error("Cliente nao encontrado", status: :not_found) unless customer

          address = customer.customer_addresses.find_by(id: params[:id])
          return render_error("Endereco nao encontrado", status: :not_found) unless address

          address.destroy!
          render_ok(message: "Endereco removido")
        end
      end
    end
  end
end
