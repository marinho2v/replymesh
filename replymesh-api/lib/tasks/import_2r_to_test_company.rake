# Importa o cardápio real do 2R (Lanche do 2R) para a company empresa-teste.
#
# Uso:
#   rails import_2r:run
#   rails import_2r:run RESET_TEST_DATA=true   # limpa dados antigos antes de reimportar
#
# Fontes de dados: M:\temple1\supabase\migrations\20260422_import_hubt_menu.sql
#                  M:\temple1\supabase\migrations\20260426_traditional_burger_combos.sql
#                  M:\temple1\supabase\migrations\20260427_artisanal_burger_combos.sql
#                  M:\temple1\supabase\migrations\20240420_add_delivery_zones.sql
#                  M:\temple1\supabase\migrations\20240420_add_initial_settings.sql
#
# Dados NÃO importados: pedidos, clientes, caixa, logs, motoboys, estoque real.

namespace :import_2r do
  desc "Importa cardapio real do 2R para company empresa-teste"
  task run: :environment do
    LEGACY_SOURCE = "supabase_2r"

    puts "=== Importação 2R → empresa-teste ==="

    # ── 1. Empresa-teste ─────────────────────────────────────────────────────

    company = Company.find_by(slug: "empresa-teste")

    if company.nil?
      puts "  → Criando company empresa-teste..."
      company = Company.create!(
        name: "Lanche do 2R",
        slug: "empresa-teste",
        responsible_name: "Admin Teste",
        responsible_email: "teste@replymesh.com.br",
        status: "active",
        plan_status: "trial",
        timezone: "America/Sao_Paulo"
      )
      puts "  ✓ Company criada: #{company.id}"
    else
      puts "  ✓ Company existente: #{company.id} (#{company.name})"
    end

    # ── 2. Reset opcional ───────────────────────────────────────────────────

    if ENV["RESET_TEST_DATA"] == "true"
      puts "  → RESET_TEST_DATA=true: limpando catálogo antigo..."
      company.products.delete_all
      company.categories.delete_all
      company.delivery_zones.delete_all
      company.business_hours.delete_all
      company.whatsapp_templates.delete_all
      puts "  ✓ Dados antigos removidos"
    end

    # ── 3. StoreSetting ──────────────────────────────────────────────────────

    setting = company.store_setting || StoreSetting.new(company: company)
    setting.assign_attributes(
      store_name:             "Lanche do 2R",
      trade_name:             "Lanche do 2R",
      company_name:           "Lanche do 2R",
      whatsapp:               "5521977149837",
      whatsapp_number:        "5521977149837",
      store_status:           "open",
      default_delivery_fee_cents: 1000,
      delivery_fee_cents:     1000,
      estimated_delivery_minutes: 40,
      pickup_enabled:         true,
      delivery_enabled:       true,
      pix_enabled:            false,
      accepted_payment_methods: %w[cash pix debit_card credit_card]
    )
    setting.save!
    puts "  ✓ StoreSetting atualizada"

    # ── 4. BusinessHours ─────────────────────────────────────────────────────

    hours_data = [
      { day_of_week: 0, is_open: false, open_time: nil, close_time: nil },
      { day_of_week: 1, is_open: true, open_time: "10:00", close_time: "22:00" },
      { day_of_week: 2, is_open: true, open_time: "10:00", close_time: "22:00" },
      { day_of_week: 3, is_open: true, open_time: "10:00", close_time: "22:00" },
      { day_of_week: 4, is_open: true, open_time: "10:00", close_time: "22:00" },
      { day_of_week: 5, is_open: true, open_time: "10:00", close_time: "22:00" },
      { day_of_week: 6, is_open: true, open_time: "10:00", close_time: "22:00" },
    ]

    hours_data.each do |h|
      bh = company.business_hours.find_or_initialize_by(day_of_week: h[:day_of_week])
      bh.update!(h.except(:day_of_week))
    end
    puts "  ✓ Horários de funcionamento (#{hours_data.size} dias)"

    # ── 5. WhatsApp Templates ─────────────────────────────────────────────────

    WhatsappTemplate::DEFAULT_TEMPLATES.each do |attrs|
      t = company.whatsapp_templates.find_or_initialize_by(template_key: attrs[:template_key])
      t.title   = attrs[:title]   if t.title.blank?
      t.message = attrs[:message] if t.message.blank?
      t.enabled = attrs[:enabled] if t.new_record?
      t.save!
    end
    puts "  ✓ WhatsApp templates (#{WhatsappTemplate::DEFAULT_TEMPLATES.size})"

    # ── 6. Delivery Zones ────────────────────────────────────────────────────

    zones_data = [
      { name: "Apollo 1",       slug: "apollo-1",       delivery_fee_cents: 800,  estimated_minutes: 40, is_active: true },
      { name: "Apollo 2",       slug: "apollo-2",       delivery_fee_cents: 800,  estimated_minutes: 40, is_active: true },
      { name: "Apollo 3",       slug: "apollo-3",       delivery_fee_cents: 800,  estimated_minutes: 40, is_active: true },
      { name: "Manilha",        slug: "manilha",        delivery_fee_cents: 900,  estimated_minutes: 45, is_active: true },
      { name: "Itaboraí",       slug: "itaborai",       delivery_fee_cents: 1000, estimated_minutes: 55, is_active: true },
      { name: "São Gonçalo",    slug: "sao-goncalo",    delivery_fee_cents: 1200, estimated_minutes: 65, is_active: true },
      { name: "Rio de Janeiro", slug: "rio-de-janeiro", delivery_fee_cents: 1500, estimated_minutes: 80, is_active: true },
    ]

    zones_data.each do |z|
      zone = company.delivery_zones.find_or_initialize_by(slug: z[:slug])
      zone.assign_attributes(z.except(:slug).merge(legacy_source: LEGACY_SOURCE))
      zone.save!
    end
    puts "  ✓ Zonas de entrega (#{zones_data.size})"

    # ── 7. Categorias ────────────────────────────────────────────────────────

    categories_data = [
      { name: "Pastel",                    slug: "pastel",                sort_order: 1 },
      { name: "Pão de alho",               slug: "pao-de-alho",           sort_order: 2 },
      { name: "Hambúrguer",                slug: "hamburguer",             sort_order: 3 },
      { name: "Hambúrguer Artesanal",      slug: "hamburguer-artesanal",   sort_order: 4 },
      { name: "Combos hambúrguer trad.",   slug: "combos",                 sort_order: 5 },
      { name: "Acompanhamentos",           slug: "acompanhamentos",        sort_order: 6 },
      { name: "Açaí na garrafa",           slug: "acai-na-garrafa",        sort_order: 7 },
      { name: "Bebidas",                   slug: "bebidas",                sort_order: 8 },
    ]

    cat_map = {}
    categories_data.each do |c|
      cat = company.categories.find_or_initialize_by(slug: c[:slug])
      cat.assign_attributes(c.except(:slug).merge(is_active: true, legacy_source: LEGACY_SOURCE))
      cat.save!
      cat_map[c[:slug]] = cat.id
    end
    puts "  ✓ Categorias (#{cat_map.size})"

    # ── 8. Produtos ──────────────────────────────────────────────────────────

    # Helper: (price_float * 100).round → price_cents
    def to_cents(price)
      (price.to_f * 100).round
    end

    products_data = [

      # ── Pastel ──────────────────────────────────────────────────────────────
      {
        category_slug: "pastel", slug: "mundel", name: "Mundel",
        description: "Mussarela, presunto, bacon, orégano e cheddar ou catupiry",
        price: 16.00, featured: true, sort_order: 1,
        image_url: "https://lh3.googleusercontent.com/dSyLCnUK30Z7QvEzIDhonMQcEpQzTdh2F0knDtUyj_A4wguHT8fOdVjWNjENQruxinAFf1IA4SCeSsrgEd8XwmijDx7rRr4aLg",
      },
      {
        category_slug: "pastel", slug: "brejal", name: "Brejal",
        description: "Carne moída, mussarela, milho, azeitona, bacon, orégano e cheddar ou catupiry",
        price: 18.00, featured: true, sort_order: 2,
        image_url: "https://lh3.googleusercontent.com/Wgimg-gCds2rnVxvlMFgJg_r9oD9jb1_W39Zto2xDc_WeZlQhzo1VNrwxljzP0sPWWqVL_EXUOiB7C8IjPBCGr5D7Jef5PNJwA",
      },
      {
        category_slug: "pastel", slug: "viuva", name: "Viúva",
        description: "Frango, mussarela, presunto, milho, azeitona, bacon e cheddar ou catupiry",
        price: 18.00, sort_order: 3,
        image_url: "https://lh3.googleusercontent.com/_P4BJZIsBCFFUOf8Rg4oNsOOYld5lNfgugMEZrv8KMKetr_AQy-psspPQI7EJh11-tZBzpdUF15jbgfy-Uq7vVE48gIysmIi9g",
      },
      {
        category_slug: "pastel", slug: "morrao", name: "Morrão",
        description: "Carne moída, bacon, mussarela, presunto, milho, orégano e cheddar ou catupiry",
        price: 18.00, sort_order: 4,
        image_url: "https://lh3.googleusercontent.com/0TFK1FuwdHl_W8KHSsoaocDKAMPonCP7uxBpcMDGgQvoaL-Ghe_0uXOTiSxEoQsH_S_dj-y8cA7SdfF36638gxlBd1UYoB8OTw",
      },
      {
        category_slug: "pastel", slug: "bnh", name: "BNH",
        description: "Frango, mussarela, bacon, ovo mexido, orégano e cheddar ou catupiry",
        price: 18.00, sort_order: 5,
        image_url: "https://lh3.googleusercontent.com/rvWg9pAHZgKRl1eSgNLZttSGklTYfPyVX7r_UY1k0SR4yNrAUrWGZALC2pzyT-zlgaDVr1VnEF3K_HoxPPhoJjkGueYgbjCC2w",
      },
      {
        category_slug: "pastel", slug: "guindias", name: "Guindias",
        description: "Frango, carne moída, mussarela, milho, azeitona, orégano e cheddar ou catupiry",
        price: 20.00, sort_order: 6,
        image_url: "https://lh3.googleusercontent.com/SlfaZYP7ojocUslqWCvtVcMwYi6UAdwSdaSTKoX9zrg_Hpze0ivwcgVK6agrlvecFb1ZQ6Zi8p8DYBV10jb9ojkYwUJ8mqDCXQ",
      },
      {
        category_slug: "pastel", slug: "santa-luzia", name: "Santa Luzia",
        description: "Romeu e Julieta", price: 18.00, sort_order: 7,
        image_url: "https://lh3.googleusercontent.com/loV0YaY9DkdWACMG1cM9ZKOvVHBpxhTyKfQnigCNXrwnsPUWZGN2VwHfwy-mP-tfsIc9dv9FrhvXIIYqUegoe17gUviECvojFMk",
      },
      {
        category_slug: "pastel", slug: "monjolos", name: "Monjolos",
        description: "Banana com creme de avelã", price: 18.00, sort_order: 8,
        image_url: "https://lh3.googleusercontent.com/cjcWGJQRbnfMaorqqjomovbDilq2DP1PysZZqitr2xZiKZ4fyqOHpC0NvPckUyaAhmj5NALJsJg7bSoES6-M4NpDwEieOnwdpN4",
      },
      {
        category_slug: "pastel", slug: "vista-alegre", name: "Vista Alegre",
        description: "Banana com canela", price: 18.00, sort_order: 9,
        image_url: "https://lh3.googleusercontent.com/Cj0mE9s3LODf1rGsvqCcd7IXNmPgtCSwR0pLLuauMR5P6z_7XEJ6JgPARvJ7zUcl619zSemT4H5ZqgONy8Xct-6veXTrHU_YJg",
      },
      {
        category_slug: "pastel", slug: "conga", name: "Conga",
        description: "Creme de avelã com confete", price: 18.00, sort_order: 10,
        image_url: "https://lh3.googleusercontent.com/1VyNbY2JB5I2sB-RkNaq5r5xblhP2lW_13XgzEbe0AjnHlJfSCK96sYl8dIw7tBaZ-gUAsYTQ-yPZ4VrBKTpM_6wQEwGqT2WCw",
      },
      {
        category_slug: "pastel", slug: "so-pra-mim", name: "Só pra mim",
        description: "1 pastel salgado + 1 pastel doce + 1 guaracrack",
        price: 32.00, sort_order: 11,
        image_url: "https://lh3.googleusercontent.com/Y4urPbRfkj3ZZkK0joEGYT4uP64hoU_cjFjGP9tWpzcitgqRiO0FB17XFYTCW2wTFLtxjjvkxtSa5oFRoi86JotxT0n6CQfwaA",
      },
      {
        category_slug: "pastel", slug: "dois-e-bom", name: "Dois é bom",
        description: "2 pastéis salgados + 2 guaracrack",
        price: 36.00, sort_order: 12,
        image_url: "https://lh3.googleusercontent.com/vwrTVJCvVjFZDxNOULcpW2P5YoxlT0M_3qqaI_jsk7ZbWL0n03XtcLBpfrX3NXnumid1zok0Cghsxhl7sCGvdKctxHDqEL1hog",
      },

      # ── Pão de alho ─────────────────────────────────────────────────────────
      {
        category_slug: "pao-de-alho", slug: "atletico-de-madri", name: "Atlético de Madri",
        description: "Baguete artesanal de 20 cm, creme de alho, linguiça mineira e piscina de mussarela",
        price: 15.00, featured: true, sort_order: 1,
        image_url: "https://lh3.googleusercontent.com/I5lryfaDrqzb8-z2gnjdSjyba6-OV-aXf8TBCZZb-wEZ0vBeqfzFkMAWeBcZnID1EXJMdgdI7qBsoabHn33_wWWMW45MDT-ta8Y",
      },
      {
        category_slug: "pao-de-alho", slug: "milam", name: "Milam",
        description: "Baguete artesanal de 20 cm, creme de alho, frango desfiado e piscina de mussarela",
        price: 16.00, featured: true, sort_order: 2,
        image_url: "https://lh3.googleusercontent.com/_QeSjaDTDN_0I8ituuBK280TNXiAytFZD4FSPpTwojbV8aBX5K1d_IAOtAkKYpt2_TZMX3qjZo5DC0l0LDY6xsQq4gKluZ2i",
      },
      {
        category_slug: "pao-de-alho", slug: "barcelona", name: "Barcelona",
        description: "Baguete artesanal de 20 cm, creme de alho, coração e piscina de mussarela",
        price: 20.00, sort_order: 3,
        image_url: "https://lh3.googleusercontent.com/OG43TAFxVe2GbinJHaWg6Vhx6HxVjmx1TT0dTX1gSOaDl9hRkbH6Gfr7MrwR5HddUl1yDz-cxoa1at79dltm0ALC5CZDSAthjDM",
      },
      {
        category_slug: "pao-de-alho", slug: "psg", name: "PSG",
        description: "Baguete artesanal de 20 cm, creme de alho, alcatra e piscina de mussarela",
        price: 20.00, sort_order: 4,
        image_url: "https://lh3.googleusercontent.com/SeIwYETD4NJu0V_rrykEiJXdhrJld991UBc8LG8aL2Uzf7fCBkvWxuwP-vYsXUGuFHsfNccXcK1Yy50SHTu4qbQBC9aOcJ9_",
      },
      {
        category_slug: "pao-de-alho", slug: "inter-de-milao", name: "Inter de Milão",
        description: "Baguete artesanal de 20 cm, creme de alho, frango cremoso e piscina de mussarela",
        price: 22.00, sort_order: 5,
        image_url: "https://lh3.googleusercontent.com/JNW8MoAXTNn5iEGTvlIOstyYzsL-X0y9y0mR1NSv-VFx4IEAGw55zYyP0w1j0gH-hlpv6Fg8c82mv4wGwvxOxScnzOu7M-4U0lQ",
      },
      {
        category_slug: "pao-de-alho", slug: "real-madri", name: "Real Madri",
        description: "Baguete artesanal de 20 cm, creme de alho, alcatra, queijo coalho e piscina de mussarela",
        price: 22.00, sort_order: 6,
        image_url: "https://lh3.googleusercontent.com/1Ocm9L6_cqlsiIfMO-rrabH6QsVSpDeJxaSttL7-kB9dlrnJNx7uvCBWCuH18593MaJB33YzJx46gIfM_6VYh2gfstaJDZ8_9Q",
      },
      {
        category_slug: "pao-de-alho", slug: "liverpool", name: "Liverpool",
        description: "Baguete artesanal de 20 cm, creme de alho, coração, queijo coalho e piscina de mussarela",
        price: 22.00, sort_order: 7,
        image_url: "https://lh3.googleusercontent.com/H6NmuY9UwkgDus2Nqv5VGUuYjn0LTMcBOh4p_1gBr3s-SZTB-ee0nTzV0YXH4_kjkoCguMkxKiy3oLpSxy3Fj7B8MZaPceNEH_0",
      },
      {
        category_slug: "pao-de-alho", slug: "chelsea", name: "Chelsea",
        description: "Baguete artesanal de 20 cm, 100gr de costela desfiada, piscina de mussarela, creme de alho e maionese temperada",
        price: 20.00, sort_order: 8,
        image_url: "https://lh3.googleusercontent.com/YkaPgQ0jqILELoKIZLlCURjpptpClYJWnZTuPGPcPbSqyL2si_iPq-ujY7r3a66ARoi1FWZQu6MNYOupobAkMnvG3F19-sMB",
      },
      {
        category_slug: "pao-de-alho", slug: "borussia", name: "Borússia",
        description: "Baguete artesanal 20cm, creme de alho, costela desfiada, maionese temperada, piscina de mussarela e queijo coalho",
        price: 22.00, sort_order: 9,
        image_url: "https://lh3.googleusercontent.com/2m1xqQyAnvziKpVs44AhhWOrPIeohDozkSKasdn7XTAqDi9jsu4DhVbPEJUgW-ZAGkAZceq-or1km8VOim6eAjhohERE1HVz",
      },

      # ── Hambúrguer ───────────────────────────────────────────────────────────
      {
        category_slug: "hamburguer", slug: "x-burguer", name: "X-burguer",
        description: "Pão, carne e queijo", price: 13.00, featured: true, sort_order: 1,
      },
      {
        category_slug: "hamburguer", slug: "x-tudo", name: "X-tudo",
        description: "Pão, carne, ovo, presunto, queijo cheddar, cheddar, bacon, maionese temperada e salada",
        price: 15.00, featured: true, sort_order: 2,
      },
      {
        category_slug: "hamburguer", slug: "x-duplo", name: "X-Duplo",
        description: "Pão, 2 carnes, 2 ovos, 2 presuntos, 2 queijos cheddar, bacon, cheddar, maionese temperada e salada",
        price: 18.00, sort_order: 3,
      },
      {
        category_slug: "hamburguer", slug: "x-triplo", name: "X-triplo",
        description: "Pão, 3 carnes, 3 ovos, 3 presuntos, 3 queijos cheddar, cheddar, bacon, maionese temperada e salada",
        price: 22.00, sort_order: 4,
      },
      {
        category_slug: "hamburguer", slug: "duplo-cheddar-bacon", name: "Duplo cheddar bacon",
        description: "Pão, 2 carne, bacon, 2 queijo cheddar e cheddar",
        price: 20.00, sort_order: 5,
      },
      {
        category_slug: "hamburguer", slug: "triplo-cheddar-bacon", name: "Triplo cheddar bacon",
        description: "Pão, 3 carnes, 3 queijos cheddar, bacon e cheddar",
        price: 22.00, sort_order: 6,
      },
      {
        category_slug: "hamburguer", slug: "x-picanha", name: "X-PICANHA",
        description: "Pão, carne de picanha, queijo, presunto, ovo, molho e salada",
        price: 20.00, sort_order: 7,
      },
      {
        category_slug: "hamburguer", slug: "super-cheddar-picanha", name: "SUPER CHEDDAR PICANHA",
        description: "Pão, carne de picanha, queijo cheddar, molho cheddar, bacon e salada",
        price: 22.00, sort_order: 8,
      },
      {
        category_slug: "hamburguer", slug: "x-duplo-picanha", name: "X-DUPLO PICANHA",
        description: "Pão, 2 carnes de picanha, 2 ovos, 2 presuntos, 2 queijos cheddar, bacon, maionese temperada e salada",
        price: 24.00, sort_order: 9,
      },
      {
        category_slug: "hamburguer", slug: "super-duplo-cheddar-picanha", name: "SUPER DUPLO CHEDDAR PICANHA",
        description: "Pão, 2 carnes de picanha, 2 queijos cheddar, bacon, molho cheddar e salada",
        price: 24.00, sort_order: 10,
      },
      {
        category_slug: "hamburguer", slug: "x-quarteto-novidade", name: "X-Quarteto (Novidade)",
        description: "Pão, 4 carnes, 4 queijos, bacon e maionese temperada",
        price: 22.00, sort_order: 11,
      },

      # ── Hambúrguer Artesanal ─────────────────────────────────────────────────
      {
        category_slug: "hamburguer-artesanal", slug: "kids-pop-100-hamburguer", name: "Kids pop 100 - Hambúrguer",
        description: "Pão brioche, queijo cheddar e maionese temperada",
        price: 17.00, featured: true, sort_order: 1,
      },
      {
        category_slug: "hamburguer-artesanal", slug: "kids-pop-100-trio-batata-e-guaracrack", name: "Kids pop 100 - Trio",
        description: "Pão brioche, queijo cheddar, maionese temperada + batata + guaracrack",
        price: 29.00, featured: true, sort_order: 2,
      },
      {
        category_slug: "hamburguer-artesanal", slug: "fazer-250-hamburguer", name: "Fazer 250 - Hambúrguer",
        description: "Pão brioche, 120gr de blend bovino, queijo cheddar, maionese temperada, alface, tomate e cebola roxa",
        price: 25.00, sort_order: 3,
      },
      {
        category_slug: "hamburguer-artesanal", slug: "fazer-250-trio-batata-e-guaracrack", name: "Fazer 250 - Trio",
        description: "Pão brioche, 120gr blend bovino, queijo cheddar, maionese temperada, alface, tomate e cebola roxa + batata + guaracrack",
        price: 37.00, sort_order: 4,
      },
      {
        category_slug: "hamburguer-artesanal", slug: "twistter-hamburguer", name: "Twistter - Hambúrguer",
        description: "Pão brioche, 120gr de blend bovino, queijo cheddar, farofa de bacon, cebola caramelizada e maionese temperada",
        price: 27.00, sort_order: 5,
      },
      {
        category_slug: "hamburguer-artesanal", slug: "twistter-trio-batata-e-guaracrack", name: "Twistter - Trio",
        description: "Pão brioche, 120gr blend bovino, queijo cheddar, farofa de bacon, cebola caramelizada e maionese temperada + batata + guaracrack",
        price: 39.00, sort_order: 6,
      },
      {
        category_slug: "hamburguer-artesanal", slug: "lander-mussarela-empanada-hamburguer", name: "Lander (mussarela empanada) - Hambúrguer",
        description: "Pão brioche, mussarela empanada, 120gr de blend bovino, queijo cheddar, maionese temperada, alface, tomate e cebola",
        price: 30.00, sort_order: 7,
      },
      {
        category_slug: "hamburguer-artesanal", slug: "lander-mussarela-empanada-trio-batata-e-guaracrack", name: "Lander - Trio",
        description: "Pão brioche, mussarela empanada, 120gr de blend bovino, queijo cheddar, maionese temperada, alface, tomate e cebola + batata + guaracrack",
        price: 42.00, sort_order: 8,
      },
      {
        category_slug: "hamburguer-artesanal", slug: "kawasaki-ninja-novidade-hamburguer", name: "Kawasaki ninja (Novidade) - Hambúrguer",
        description: "Pão brioche, 120gr de blend bovino, queijo cheddar, 100gr de mussarela empanada, bacon fatiado crocante e maionese temperada",
        price: 32.00, sort_order: 9,
      },
      {
        category_slug: "hamburguer-artesanal", slug: "kawasaki-ninja-novidade-trio-batata-e-guaracrack", name: "Kawasaki ninja - Trio",
        description: "Pão brioche, 120gr blend bovino, queijo cheddar, 100gr mussarela empanada, bacon fatiado crocante e maionese temperada + batata + guaracrack",
        price: 44.00, sort_order: 10,
      },
      {
        category_slug: "hamburguer-artesanal", slug: "xj6-hamburguer", name: "XJ6 - Hambúrguer",
        description: "Pão brioche, 2 blends 120gr, queijo cheddar, bacon fatiado, maionese temperada e cheddar especial da casa",
        price: 32.00, featured: true, sort_order: 11,
      },
      {
        category_slug: "hamburguer-artesanal", slug: "xj6-trio-batata-e-guaracrack", name: "XJ6 - Trio",
        description: "Pão brioche, 2 blends 120gr, queijo cheddar, bacon fatiado, maionese temperada e cheddar especial da casa + batata + guaracrack",
        price: 44.00, sort_order: 12,
      },
      {
        category_slug: "hamburguer-artesanal", slug: "hornet-onion-rings-hamburguer", name: "Hornet (onion rings) - Hambúrguer",
        description: "Pão brioche, 2 blends 120gr, queijo cheddar, onion rings, queijo cheddar, bacon fatiado e maionese temperada",
        price: 32.00, featured: true, sort_order: 13,
      },
      {
        category_slug: "hamburguer-artesanal", slug: "hornet-onion-rings-trio-batata-e-guaracrack", name: "Hornet - Trio",
        description: "Pão brioche, 2 blends 120gr, queijo cheddar, onion rings, bacon fatiado e maionese temperada + batata + guaracrack",
        price: 44.00, sort_order: 14,
      },
      {
        category_slug: "hamburguer-artesanal", slug: "sahara-queijo-coalho-hamburguer", name: "Sahara (queijo coalho) - Hambúrguer",
        description: "Pão brioche, 2 blends 120gr bovino, queijo coalho, queijo mussarela, bacon fatiado e maionese temperada",
        price: 35.00, sort_order: 15,
      },
      {
        category_slug: "hamburguer-artesanal", slug: "sahara-queijo-coalho-trio-batata-e-guaracrack", name: "Sahara - Trio",
        description: "Pão brioche, 2 blends 120gr bovino, queijo coalho, queijo mussarela, bacon fatiado e maionese temperada + batata + guaracrack",
        price: 47.00, sort_order: 16,
      },
      {
        category_slug: "hamburguer-artesanal", slug: "harley-davidson-novidade", name: "Harley-Davidson (Novidade)",
        description: "Pão brioche, 1 blend de 120gr de costela desfiada, 1 blend de 120gr bovino, queijo mussarela, barbecue, maionese temperada, queijo coalho e salada verde",
        price: 30.00, sort_order: 17,
      },
      {
        category_slug: "hamburguer-artesanal", slug: "african-twin-hamburguer", name: "African Twin - Hambúrguer",
        description: "Pão brioche, 3 blends de 120gr bovinos, bacon fatiado, queijo cheddar, cebola caramelizada e maionese temperada",
        price: 38.00, featured: true, sort_order: 18,
      },
      {
        category_slug: "hamburguer-artesanal", slug: "african-twin-trio-batata-e-guaracrack", name: "African Twin - Trio",
        description: "Pão brioche, 3 blends 120gr bovinos, bacon fatiado, queijo cheddar, cebola caramelizada e maionese temperada + batata + guaracrack",
        price: 50.00, sort_order: 19,
      },
      {
        category_slug: "hamburguer-artesanal", slug: "bmw-1250-hamburguer", name: "BMW 1250 - Hambúrguer",
        description: "Pão brioche, 3 blends 120gr bovinos, queijo cheddar, bacon fatiado, maionese temperada, cheddar especial da casa, alface, tomate e cebola roxa",
        price: 40.00, featured: true, sort_order: 20,
      },
      {
        category_slug: "hamburguer-artesanal", slug: "bmw-1250-trio-batata-e-guaracrack", name: "BMW 1250 - Trio",
        description: "Pão brioche, 3 blends 120gr bovinos, queijo cheddar, bacon fatiado, maionese temperada, cheddar especial, alface, tomate e cebola roxa + batata + guaracrack",
        price: 52.00, sort_order: 21,
      },
      {
        category_slug: "hamburguer-artesanal", slug: "cinquentinha-artesanal-doce", name: "Cinquentinha (Artesanal Doce)",
        description: "Pão brioche, recheio de nutella com confete",
        price: 20.00, sort_order: 22,
      },

      # ── Combos hambúrguer tradicional ────────────────────────────────────────
      {
        category_slug: "combos", slug: "combo-solteiro-x-tudo", name: "Combo Solteiro X-tudo",
        description: "1 x-tudo + batata turbinada P + 1 Guaracrack",
        price: 25.00, promotional: true, combo: true, sort_order: 101,
      },
      {
        category_slug: "combos", slug: "combo-solteiro-x-duplo", name: "Combo Solteiro X-duplo",
        description: "1 x-duplo + batata turbinada P + 1 Guaracrack",
        price: 30.00, promotional: true, combo: true, sort_order: 102,
      },
      {
        category_slug: "combos", slug: "combo-solteiro-x-triplo", name: "Combo Solteiro X-triplo",
        description: "1 x-triplo + batata turbinada P + 1 Guaracrack",
        price: 35.00, promotional: true, combo: true, sort_order: 103,
      },
      {
        category_slug: "combos", slug: "combo-casal-x-tudo", name: "Combo Casal X-tudo",
        description: "2 x-tudo + batata turbinada P + 1 Flexa Guarana",
        price: 55.00, promotional: true, combo: true, sort_order: 104,
      },
      {
        category_slug: "combos", slug: "combo-casal-x-duplo", name: "Combo Casal X-duplo",
        description: "2 x-duplo + batata turbinada P + 1 Flexa Guarana",
        price: 60.00, promotional: true, combo: true, sort_order: 105,
      },
      {
        category_slug: "combos", slug: "combo-casal-x-triplo", name: "Combo Casal X-triplo",
        description: "2 x-triplo + batata turbinada P + 1 Flexa Guarana",
        price: 65.00, promotional: true, combo: true, sort_order: 106,
      },
      {
        category_slug: "combos", slug: "combo-galera-3-x-tudo", name: "Combo Galera 3 X-tudo",
        description: "3 x-tudo + batata turbinada M + 1 Flexa Guarana",
        price: 75.00, promotional: true, combo: true, sort_order: 107,
      },
      {
        category_slug: "combos", slug: "combo-galera-3-x-duplo", name: "Combo Galera 3 X-duplo",
        description: "3 x-duplo + batata turbinada M + 1 Flexa Guarana",
        price: 80.00, promotional: true, combo: true, sort_order: 108,
      },
      {
        category_slug: "combos", slug: "combo-galera-3-x-triplo", name: "Combo Galera 3 X-triplo",
        description: "3 x-triplo + batata turbinada M + 1 Flexa Guarana",
        price: 85.00, promotional: true, combo: true, sort_order: 109,
      },
      {
        category_slug: "combos", slug: "combo-galera-4-x-tudo", name: "Combo Galera 4 X-tudo",
        description: "4 x-tudo + batata turbinada G + 1 Flexa Guarana",
        price: 95.00, promotional: true, combo: true, sort_order: 110,
      },
      {
        category_slug: "combos", slug: "combo-galera-4-x-duplo", name: "Combo Galera 4 X-duplo",
        description: "4 x-duplo + batata turbinada G + 1 Flexa Guarana",
        price: 100.00, promotional: true, combo: true, sort_order: 111,
      },
      {
        category_slug: "combos", slug: "combo-galera-4-x-triplo", name: "Combo Galera 4 X-triplo",
        description: "4 x-triplo + batata turbinada G + 1 Flexa Guarana",
        price: 105.00, promotional: true, combo: true, sort_order: 112,
      },

      # ── Combos artesanais ────────────────────────────────────────────────────
      {
        category_slug: "hamburguer-artesanal", slug: "combo-artesanal-hornet-sahara-2-guaracrack", name: "Hornet + Sahara + 2 Guaracrack",
        description: "1 Hornet + 1 Sahara + 2 Guaracrack",
        price: 55.00, promotional: true, combo: true, sort_order: 200,
      },
      {
        category_slug: "hamburguer-artesanal", slug: "combo-artesanal-2-fazer-2-guaracrack", name: "2 Fazer + 2 Guaracrack",
        description: "2 hamburgueres Fazer 250 + 2 Guaracrack",
        price: 40.00, promotional: true, combo: true, sort_order: 201,
      },
      {
        category_slug: "hamburguer-artesanal", slug: "combo-artesanal-bmw-1250-hornet-2-guaracrack", name: "BMW 1250 + Hornet + 2 Guaracrack",
        description: "1 BMW 1250 + 1 Hornet + 2 Guaracrack",
        price: 56.00, promotional: true, combo: true, sort_order: 202,
      },
      {
        category_slug: "hamburguer-artesanal", slug: "combo-artesanal-fazer-xj6-2-guaracrack", name: "Fazer + XJ6 + 2 Guaracrack",
        description: "1 Fazer 250 + 1 XJ6 + 2 Guaracrack",
        price: 48.00, promotional: true, combo: true, sort_order: 203,
      },
      {
        category_slug: "hamburguer-artesanal", slug: "combo-artesanal-twister-african-twin-2-guaracrack", name: "Twister + African Twin + 2 Guaracrack",
        description: "1 Twister + 1 African Twin + 2 Guaracrack",
        price: 55.00, promotional: true, combo: true, sort_order: 204,
      },

      # ── Acompanhamentos ──────────────────────────────────────────────────────
      {
        category_slug: "acompanhamentos", slug: "batata-simples-pequeno", name: "Batata Simples - Pequeno",
        description: nil, price: 10.00, featured: true, sort_order: 1,
      },
      {
        category_slug: "acompanhamentos", slug: "batata-simples-medio", name: "Batata Simples - Médio",
        description: nil, price: 15.00, featured: true, sort_order: 2,
      },
      {
        category_slug: "acompanhamentos", slug: "batata-simples-grande", name: "Batata Simples - Grande",
        description: nil, price: 20.00, sort_order: 3,
      },
      {
        category_slug: "acompanhamentos", slug: "batata-turbinada-pequeno", name: "Batata Turbinada - Pequeno",
        description: "Batata, cheddar especial da casa, farofa de bacon e ovo de codorna",
        price: 15.00, sort_order: 4,
      },
      {
        category_slug: "acompanhamentos", slug: "batata-turbinada-medio", name: "Batata Turbinada - Médio",
        description: "Batata, cheddar especial da casa, farofa de bacon e ovo de codorna",
        price: 20.00, sort_order: 5,
      },
      {
        category_slug: "acompanhamentos", slug: "batata-turbinada-grande", name: "Batata Turbinada - Grande",
        description: "Batata, cheddar especial da casa, farofa de bacon e ovo de codorna",
        price: 25.00, sort_order: 6,
      },
      {
        category_slug: "acompanhamentos", slug: "onion-rings-pequeno", name: "Onion rings - Pequeno",
        description: "10 unidades", price: 15.00, sort_order: 7,
      },
      {
        category_slug: "acompanhamentos", slug: "onion-rings-medio", name: "Onion rings - Médio",
        description: "15 unidades", price: 22.50, sort_order: 8,
      },

      # ── Açaí na garrafa ──────────────────────────────────────────────────────
      {
        category_slug: "acai-na-garrafa", slug: "natural-300ml", name: "Natural 300ml",
        description: "Açaí natural batido na garrafa com calda de morango ou chocolate",
        price: 13.00, featured: true, sort_order: 1,
        image_url: "https://lh3.googleusercontent.com/bRygIOLJxv3z6ZIO_8Z1oELD8mT_S9YS-bTNC-WPXdrBv3I1HAgRLVlL6w5nKcyOPERnKYI1ytDZOJ7G6r0r14UtV9uk_kdeZyM",
      },
      {
        category_slug: "acai-na-garrafa", slug: "morango-300ml", name: "Morango 300ml",
        description: "Açaí batido com morango na garrafa com calda de morango ou chocolate",
        price: 15.00, featured: true, sort_order: 2,
        image_url: "https://lh3.googleusercontent.com/hRPcTblHRgSvdyoi0qwpS-0iHdjz6g_jt3n09cEMjL9CW_C5-E4F5U8ldLQUC4iamfGFfqGHYi2YiEyTmwaM9sIBXBtY5_4nLw",
      },
      {
        category_slug: "acai-na-garrafa", slug: "banana-300ml", name: "Banana 300ml",
        description: "Açaí batido com banana na garrafa, calda de morango ou chocolate",
        price: 15.00, sort_order: 3,
        image_url: "https://lh3.googleusercontent.com/K779q-R10TdSFXu3B9j_BgjKREHPvPn6-A2KXtdh2RaGgf8UZmUsHzQ21t_ynGVJ_gE04634HU81KxlMoxoq9PDYm_CbcEbqAyk",
      },
      {
        category_slug: "acai-na-garrafa", slug: "raffaello", name: "Raffaello",
        description: "Açaí de Raffaello na garrafa com calda de morango ou chocolate",
        price: 15.00, sort_order: 4,
        image_url: "https://lh3.googleusercontent.com/VX785QdW2h64oFsGqjwh1scKmwdYberCqrzUeBMWBsLU_abl6zwghW6q8cEpqsGQ04yadblVOy8M70vtm07dBwaJ1SZbvUh7Kw",
      },
      {
        category_slug: "acai-na-garrafa", slug: "natural-500ml", name: "Natural 500ml",
        description: "Açaí natural batido na garrafa com calda de morango ou chocolate",
        price: 18.00, sort_order: 5,
        image_url: "https://lh3.googleusercontent.com/yFGgPr7tWHFd3tvP9VBNRFMm9vdB35A5RxBe3-ZKAtNEkYe_U-n7ka0_fqtm0TRxzSYcTBX1bgK1jgqent1g3zCtKBAPaWbN",
      },
      {
        category_slug: "acai-na-garrafa", slug: "morango-500ml", name: "Morango 500ml",
        description: "Açaí batido com morango na garrafa com calda de morango ou chocolate",
        price: 20.00, sort_order: 6,
        image_url: "https://lh3.googleusercontent.com/wdl2IS0GpvBEEpBJZrJuSBOXLKtUUiZ8j1ggdXvqNZ9KQiilKKS3WSHb2TvHevaUuq3z8J3qrlMUBV7LKo45bXj1NtlCYQ",
      },
      {
        category_slug: "acai-na-garrafa", slug: "banana-500ml", name: "Banana 500ml",
        description: "Açaí batido com banana na garrafa, calda de morango ou chocolate",
        price: 20.00, sort_order: 7,
        image_url: "https://lh3.googleusercontent.com/7Z-kq77Xmosd8cZsXxk7nicu2Od7caZl7-gxEQf7z1sNC7WHV8PowPQnkyCAZcSOyu0q6HrBU_DfvKgB-eLgM3iv5yeiR9l3",
      },
      {
        category_slug: "acai-na-garrafa", slug: "raffaello-500ml", name: "Raffaello 500ml",
        description: "Açaí de Raffaello na garrafa com calda de morango ou chocolate",
        price: 20.00, sort_order: 8,
        image_url: "https://lh3.googleusercontent.com/bDFwA3tshktnGzfuPHrM4WodEndFoSMAyIm18D_4VFHniGn3tG01ZlxStW5B2n0LPvVrhz6ujRTbNeSD9lxS-Lljp-LmpM3_qWg",
      },
      {
        category_slug: "acai-na-garrafa", slug: "nutella-300ml", name: "Nutella 300ml",
        description: "Açaí de nutella com cobertura de nutella",
        price: 15.00, sort_order: 9,
        image_url: "https://lh3.googleusercontent.com/brCZuIC2lcCvHrHyKbVKl4RVejFTI-1ZmrRS4oNWDq8Im9DEvHq5YMwHsy4gFMOoOvDwA2RzWCTR-GXxqfDdjGYuCUBLctx2pr4",
      },
      {
        category_slug: "acai-na-garrafa", slug: "nutella-500ml", name: "Nutella 500ml",
        description: "Açaí de nutella com cobertura de nutella",
        price: 20.00, sort_order: 10,
        image_url: "https://lh3.googleusercontent.com/Da9kBmx87WlQGxTeviBVEcdxeilUgHZtpVeGDVcdopFy_Dmt0NElkKS6YBdHJ3bq-StaDDe33FItdYE1sWHDEinX7oIRtRdf",
      },

      # ── Bebidas ──────────────────────────────────────────────────────────────
      {
        category_slug: "bebidas", slug: "guaracrack", name: "Guaracrack",
        description: nil, price: 2.00, featured: true, sort_order: 1,
      },
      {
        category_slug: "bebidas", slug: "coca-cola-lata", name: "Coca cola lata",
        description: nil, price: 6.50, featured: true, sort_order: 2,
      },
      {
        category_slug: "bebidas", slug: "flexa-2lt", name: "Flexa 2lt",
        description: nil, price: 9.00, sort_order: 3,
      },
      {
        category_slug: "bebidas", slug: "coca-cola-2lt", name: "Coca cola 2lt",
        description: nil, price: 15.00, sort_order: 4,
      },
      {
        category_slug: "bebidas", slug: "guarana-antartica-1lt", name: "Guaraná Antártica 1lt",
        description: nil, price: 8.00, sort_order: 5,
      },
      {
        category_slug: "bebidas", slug: "coca-cola-zero-2lt", name: "Coca cola zero 2lt",
        description: nil, price: 15.00, sort_order: 6,
      },
    ]

    product_count = 0

    products_data.each do |p|
      cat_id = cat_map[p[:category_slug]]
      unless cat_id
        puts "  ⚠ Categoria não encontrada: #{p[:category_slug]} (produto #{p[:name]} ignorado)"
        next
      end

      product = company.products.find_or_initialize_by(slug: p[:slug])
      product.assign_attributes(
        name:                     p[:name],
        description:              p[:description],
        category_id:              cat_id,
        price_cents:              to_cents(p[:price]),
        promotional_price_cents:  p[:promotional_price] ? to_cents(p[:promotional_price]) : nil,
        image_url:                p[:image_url],
        is_featured:              p[:featured] || false,
        is_promotional:           p[:promotional] || false,
        is_combo:                 p[:combo] || false,
        is_active:                true,
        sort_order:               p[:sort_order] || 0,
        legacy_source:            LEGACY_SOURCE
      )
      product.save!
      product_count += 1
    end

    puts "  ✓ Produtos (#{product_count})"

    # ── Resumo ───────────────────────────────────────────────────────────────

    puts ""
    puts "=== Importação concluída ==="
    puts "  Company:    #{company.name} (slug: #{company.slug})"
    puts "  Categorias: #{company.categories.count}"
    puts "  Produtos:   #{company.products.count}"
    puts "  Zonas:      #{company.delivery_zones.count}"
    puts "  Templates:  #{company.whatsapp_templates.count}"
    puts ""
    puts "Para testar:"
    puts "  Menu público: http://localhost:5173/<seu-slug>/menu"
    puts "  Admin:        http://localhost:5173/admin/dashboard"
  end
end
