namespace :payments do
  desc "Expira pedidos Pix pending_payment com mais de 3 minutos"
  task expire_pending_pix: :environment do
    result = PaymentExpirationService.expire_pending_pix!

    puts "Pedidos Pix verificados: #{result.checked}"
    puts "Pedidos Pix expirados: #{result.expired}"

    if result.errors.any?
      puts "Erros:"
      result.errors.each do |error|
        puts "- order_id=#{error[:order_id]} #{error[:error]}"
      end
      exit 1
    end
  end
end
