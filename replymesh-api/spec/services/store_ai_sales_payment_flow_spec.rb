require "rails_helper"

RSpec.describe StoreAiSalesService do
  let!(:company) { create_company(name: "QA Pagamentos IA", slug: "qa-pagamentos-ia") }
  let!(:store) { create_store(company, delivery_fee_cents: 500) }
  let!(:category_and_product) { create_catalog(company, price_cents: 2_500) }
  let!(:product) { category_and_product.last }
  let!(:settings) do
    StoreAiSetting.for_company(company).tap do |record|
      record.update!(
        enabled: true,
        ai_mode: "auto_seller",
        ai_sales_mode_enabled: true,
        create_order_after_confirmation: true,
        offer_cash: true,
        offer_pix: true
      )
    end
  end
  let(:phone) { "5521999990001" }

  before do
    allow(FeatureGate).to receive(:enabled?).and_return(true)
    allow(WhatsappStatusDispatcher).to receive(:call)
  end

  def prepare_payment_cart
    conversation = company.store_ai_conversations.create!(
      phone: phone,
      channel: "whatsapp",
      status: "open",
      last_message_at: Time.current
    )
    company.store_ai_carts.create!(
      store_ai_conversation: conversation,
      customer_phone: phone,
      stage: "payment_selection",
      items: [
        {
          "product_id" => product.id,
          "name" => product.name,
          "quantity" => 1,
          "unit_price_cents" => product.price_cents,
          "total_cents" => product.price_cents,
          "selected_options" => []
        }
      ],
      delivery_address: {
        "street" => "Rua QA",
        "number" => "10",
        "neighborhood" => "Centro",
        "city" => "Rio de Janeiro",
        "state" => "RJ"
      },
      subtotal_cents: product.price_cents,
      delivery_fee_cents: 500,
      total_cents: product.price_cents + 500,
      expires_at: 2.hours.from_now
    )
  end

  def send_message(message)
    described_class.call(
      company: company,
      user: nil,
      question: message,
      phone: phone,
      settings: settings,
      global: nil,
      simulate: false
    )
  end

  it "uses Mercado Pago for Pix when the same automatic checkout configuration is active" do
    prepare_payment_cart
    store.update!(
      pix_enabled: true,
      pix_provider: "mercadopago",
      mercadopago_enabled: true,
      mercadopago_access_token: "TEST-QA-TOKEN"
    )
    result = MercadoPagoPixService::Result.new(
      success?: true,
      payment_id: "mp-ai-1",
      qr_code: "000201PIX-AI",
      qr_code_base64: "base64",
      ticket_url: "https://mercadopago.test/pix-ai",
      status: "pending"
    )
    allow_any_instance_of(MercadoPagoPixService).to receive(:create_pix_payment).and_return(result)

    selection = send_message("pix")
    expect(selection[:answer]).to include("Pix automatico Mercado Pago", "CONFIRMAR")
    expect(company.orders.count).to eq(0)

    confirmation = send_message("CONFIRMAR")
    order = company.orders.last

    expect(order.payment_method).to eq("pix")
    expect(order.payment_status).to eq("pending_payment")
    expect(order.external_payment_id).to eq("mp-ai-1")
    expect(order.pix_copy_paste).to eq("000201PIX-AI")
    expect(confirmation[:answer]).to include("000201PIX-AI", "confirma automaticamente")
    expect(company.orders.count).to eq(1)

    status = send_message("qual o status do pagamento?")
    expect(status[:answer]).to eq("Seu Pix esta aguardando pagamento.")
  end

  it "uses manual Pix instructions without calling Mercado Pago" do
    prepare_payment_cart
    store.update!(
      pix_enabled: true,
      pix_provider: "manual",
      pix_key: "pix@qa.test",
      pix_receiver_name: "QA Pagamentos"
    )
    expect_any_instance_of(MercadoPagoPixService).not_to receive(:create_pix_payment)

    expect(send_message("pix")[:answer]).to include("Pix manual", "CONFIRMAR")
    confirmation = send_message("confirmar")
    order = company.orders.last

    expect(order.payment_method).to eq("pix")
    expect(order.payment_status).to eq("pending")
    expect(order.external_payment_id).to be_nil
    expect(order.notes).to include("Pix manual")
    expect(confirmation[:answer]).to include(
      "pix@qa.test",
      "QA Pagamentos",
      "envie o comprovante",
      "confirmar seu pedido"
    )

    status = send_message("paguei o pix")
    expect(status[:answer]).to include("aguardando a confirmacao da loja")
  end

  it "does not offer or create Pix when no Pix mode is configured" do
    prepare_payment_cart
    store.update!(
      pix_enabled: false,
      pix_provider: "manual",
      pix_key: nil,
      pix_payload: nil,
      mercadopago_enabled: false,
      mercadopago_access_token: nil
    )

    result = send_message("pix")

    expect(result[:status]).to eq("blocked")
    expect(result[:answer]).to include("Pix nao esta disponivel", "dinheiro", "cartao")
    expect(company.orders.count).to eq(0)
  end

  it "records cash without change only after final confirmation" do
    prepare_payment_cart

    expect(send_message("dinheiro")[:answer]).to include("precisar de troco")
    summary = send_message("nao")
    expect(summary[:answer]).to include("Troco: nao precisa", "CONFIRMAR")
    expect(company.orders.count).to eq(0)

    send_message("confirma")
    order = company.orders.last
    expect(order.payment_method).to eq("money")
    expect(order.needs_change).to be(false)
    expect(order.change_for_cents).to be_nil
    expect(send_message("quero pedir mais")[:answer]).to include("Pedido recebido")
  end

  it "records the requested cash change amount" do
    prepare_payment_cart

    send_message("dinheiro")
    summary = send_message("troco para 100")
    expect(summary[:answer]).to include("Troco para: R$ 100,00")

    send_message("confirmar")
    order = company.orders.last
    expect(order.needs_change).to be(true)
    expect(order.change_for_cents).to eq(10_000)
  end

  it "asks for credit or debit and stores the card type in the order" do
    prepare_payment_cart

    expect(send_message("cartao")[:answer]).to include("credito", "debito")
    summary = send_message("credito")
    expect(summary[:answer]).to include("Cartao na entrega - credito", "CONFIRMAR")

    send_message("confirmar")
    order = company.orders.last
    expect(order.payment_method).to eq("card_on_delivery")
    expect(order.notes).to include("Cartao na entrega: credito")
  end

  it "collects a new customer name before address and creates only one customer after confirmation" do
    conversation = company.store_ai_conversations.create!(
      phone: phone,
      channel: "whatsapp",
      status: "open",
      last_message_at: Time.current
    )
    company.store_ai_carts.create!(
      store_ai_conversation: conversation,
      customer_phone: phone,
      stage: "customer_identification",
      items: [
        {
          "product_id" => product.id,
          "name" => product.name,
          "quantity" => 1,
          "unit_price_cents" => product.price_cents,
          "total_cents" => product.price_cents,
          "selected_options" => []
        }
      ],
      subtotal_cents: product.price_cents,
      total_cents: product.price_cents,
      expires_at: 2.hours.from_now
    )

    expect(send_message("Maria da Silva")[:answer]).to include("Obrigado, Maria da Silva", "endereco")
    expect(company.customers.where(phone: phone).count).to eq(0)

    send_message("Rua QA, 10, Centro")
    send_message("dinheiro")
    send_message("nao")
    send_message("confirmar")

    customer = company.customers.find_by!(phone: phone)
    order = company.orders.last
    expect(customer.full_name).to eq("Maria da Silva")
    expect(order.customer_id).to eq(customer.id)
    expect(order.customer_name).to eq("Maria da Silva")
    expect(company.customers.where(phone: phone).count).to eq(1)
  end

  it "recommends real active products prioritizing sales, featured and promotional products" do
    featured = Product.create!(
      company: company,
      category: product.category,
      name: "Costela Destaque",
      slug: "costela-destaque",
      price_cents: 3_500,
      is_active: true,
      is_featured: true
    )
    promotional = Product.create!(
      company: company,
      category: product.category,
      name: "Batata Promocional",
      slug: "batata-promocional",
      price_cents: 1_500,
      promotional_price_cents: 1_200,
      is_active: true,
      is_promotional: true
    )
    customer = create_customer(company, phone: "21911112222")
    sold_order = create_order(company: company, customer: customer, status: "completed")
    sold_order.order_items.create!(
      company: company,
      product: featured,
      product_name: featured.name,
      unit_price_cents: featured.price_cents,
      quantity: 4,
      total_price_cents: featured.price_cents * 4
    )

    result = send_message("qual voce recomenda?")
    names = result[:products].map { |item| item[:name] }

    expect(names.first).to eq("Costela Destaque")
    expect(names).to include("Batata Promocional", product.name)
    expect(result[:answer]).to include("R$ 35,00", "R$ 12,00")
  end

  it "accepts a public product link and returns a safe public link for its photo" do
    company.update_column(:primary_domain, "qa-pagamentos-ia.replymesh.cloud")
    product.update!(image_url: "/produtos/interno/x-tudo.jpg")

    selection = send_message("quero https://qa-pagamentos-ia.replymesh.cloud/menu?produto=x-tudo")
    expect(selection[:cart][:items].last["product_id"]).to eq(product.id)

    photo = send_message("manda foto")
    expect(photo[:answer]).to include("https://qa-pagamentos-ia.replymesh.cloud/menu?produto=x-tudo")
    expect(photo[:answer]).not_to include("/produtos/interno/x-tudo.jpg")
  end

  it "starts as a seller, asks a new customer name and then shows real recommendations" do
    featured = Product.create!(
      company: company,
      category: product.category,
      name: "Smash Destaque",
      slug: "smash-destaque",
      price_cents: 3_100,
      is_active: true,
      is_featured: true
    )

    greeting = send_message("boa noite")
    expect(greeting[:answer]).to include("qual seu nome")

    recommendations = send_message("Joao")
    expect(recommendations[:answer]).to include("Obrigado, Joao", "Smash Destaque", "Qual voce gostaria")
    expect(recommendations[:products].map { |item| item[:id] }).to include(featured.id)
  end

  it "offers one complementary item without insisting" do
    beverage = Product.create!(
      company: company,
      category: product.category,
      name: "Coca-Cola",
      slug: "coca-cola",
      description: "Refrigerante gelado",
      price_cents: 800,
      is_active: true
    )
    customer = create_customer(company, phone: phone)
    customer.customer_addresses.create!(
      company: company,
      street: "Rua Salva",
      number: "20",
      neighborhood: "Centro",
      city: "Rio de Janeiro",
      state: "RJ",
      is_default: true
    )

    offer = send_message("quero x tudo")
    expect(offer[:answer]).to include("Coca-Cola", "R$ 8,00", "sim", "nao")

    continuation = send_message("sim")
    expect(continuation[:answer]).to include("Coca-Cola foi adicionado", "endereco salvo")
    expect(continuation[:cart][:items].map { |item| item["product_id"] }).to include(product.id, beverage.id)
  end

  it "confirms the saved address with yes instead of searching for a product" do
    customer = create_customer(company, phone: phone)
    customer.customer_addresses.create!(
      company: company,
      street: "Rua Salva",
      number: "20",
      neighborhood: "Centro",
      city: "Rio de Janeiro",
      state: "RJ",
      is_default: true
    )

    selection = send_message("quero x tudo")
    expect(selection[:answer]).to include("endereco salvo")

    confirmation = send_message("Sim")
    expect(confirmation[:answer]).to include("Forma de pagamento")
    expect(confirmation[:answer]).not_to include("Nao encontrei esse produto")
    expect(confirmation[:cart][:stage]).to eq("payment_selection")
  end

  it "does not treat a generic answer in payment selection as a product search" do
    prepare_payment_cart

    result = send_message("sim")

    expect(result[:status]).to eq("blocked")
    expect(result[:answer]).to include("Escolha a forma de pagamento")
    expect(result[:answer]).not_to include("Nao encontrei esse produto")
  end

  it "answers order status questions without falling back to product search" do
    customer = create_customer(company, phone: phone)
    order = create_order(company: company, customer: customer, status: "accepted", total_cents: 3_000)

    status = send_message("consulta meu pedido")
    expect(status[:answer]).to include("pedido ##{order.order_number}", "aceito", "R$ 30,00")
    expect(status[:answer]).not_to include("Nao encontrei esse produto")

    by_number = send_message("Pedido número ##{order.order_number}")
    expect(by_number[:answer]).to include("pedido ##{order.order_number}")
    expect(by_number[:answer]).not_to include("Nao encontrei esse produto")
  end

  it "explains the open cart when the customer asks about the current order" do
    customer = create_customer(company, phone: phone)
    customer.customer_addresses.create!(
      company: company,
      street: "Rua Salva",
      number: "20",
      neighborhood: "Centro",
      city: "Rio de Janeiro",
      state: "RJ",
      is_default: true
    )

    send_message("quero x tudo")
    result = send_message("eu tenho pedido aberto?")

    expect(result[:answer]).to include("pedido em atendimento", "confirmar o endereco")
    expect(result[:answer]).not_to include("Nao encontrei esse produto")
  end

  it "does not create an AI order when the store is closed" do
    prepare_payment_cart
    store.update!(store_status: "closed", block_orders_when_closed: true)

    send_message("dinheiro")
    send_message("nao")
    result = send_message("confirmar")

    expect(result[:status]).to eq("fallback")
    expect(result[:answer]).to include("Nao consegui finalizar")
    expect(company.orders.count).to eq(0)
  end
end
