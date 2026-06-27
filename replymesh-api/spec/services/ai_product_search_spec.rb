require "rails_helper"

RSpec.describe AiProductSearch do
  let!(:company) { create_company(name: "QA Busca IA", slug: "qa-busca-ia") }
  let!(:store) { create_store(company) }
  let!(:category) { Category.create!(company: company, name: "Lanches", slug: "lanches-busca", is_active: true) }
  let!(:drinks) { Category.create!(company: company, name: "Bebidas", slug: "bebidas-busca", is_active: true) }
  let!(:xbacon) do
    Product.create!(
      company: company,
      category: category,
      name: "X-Bacon",
      slug: "x-bacon-busca",
      description: "Hamburguer artesanal com bacon e cheddar",
      price_cents: 2_900,
      is_active: true,
      is_featured: true
    )
  end
  let!(:costela) do
    Product.create!(
      company: company,
      category: category,
      name: "Costela Artesanal",
      slug: "costela-artesanal-busca",
      description: "Lanche de costela com queijo",
      price_cents: 3_500,
      is_active: true
    )
  end
  let!(:coca) do
    Product.create!(
      company: company,
      category: drinks,
      name: "Coca-Cola Lata",
      slug: "coca-cola-lata-busca",
      description: "Refrigerante gelado",
      price_cents: 800,
      is_active: true
    )
  end

  it "finds products by slang, description, category and fuzzy text" do
    expect(search("tem bacon?")).to include(xbacon)
    expect(search("tem cheddar?")).to include(xbacon)
    expect(search("tem costela?")).to include(costela)
    expect(search("tem refri?")).to include(coca)
    expect(search("qro xbacon")).to include(xbacon)
    expect(search("me ve um costla")).to include(costela)
  end

  it "returns recommendations without inventing products" do
    result = described_class.call(company: company, query: "qual mais sai?", recommendation: true)

    expect(result.products).to all(be_persisted)
    expect(result.products.map(&:company_id).uniq).to eq([company.id])
    expect(result.products.map(&:name)).to include("X-Bacon", "Costela Artesanal")
  end

  def search(query)
    described_class.call(company: company, query: query).products
  end
end
