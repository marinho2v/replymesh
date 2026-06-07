require "rails_helper"

RSpec.describe CompanyDomainService do
  describe ".normalize_slug" do
    it "removes accents, spaces and unsupported characters" do
      expect(described_class.normalize_slug("Joao Pizza")).to eq("joaopizza")
      expect(described_class.normalize_slug("Doceria da Lu")).to eq("doceriadalu")
      expect(described_class.normalize_slug("Açaí & Cia!")).to eq("acai-cia")
    end
  end

  describe ".domain_for" do
    it "uses the official replymesh.cloud domain" do
      expect(described_class.domain_for("demohamburgueria")).to eq("demohamburgueria.replymesh.cloud")
    end
  end

  describe ".reserved_slug?" do
    it "blocks infrastructure names" do
      expect(described_class.reserved_slug?("api")).to be(true)
      expect(described_class.reserved_slug?("support")).to be(true)
      expect(described_class.reserved_slug?("demohamburgueria")).to be(false)
    end
  end

  describe ".custom_domain_valid?" do
    it "accepts valid custom domains and rejects invalid values" do
      expect(described_class.custom_domain_valid?("www.pizzariadojoao.com.br")).to be(true)
      expect(described_class.custom_domain_valid?("https://loja.cliente.com.br/pedidos")).to be(true)
      expect(described_class.custom_domain_valid?("cliente")).to be(false)
      expect(described_class.custom_domain_valid?("http://")).to be(true)
    end
  end
end
