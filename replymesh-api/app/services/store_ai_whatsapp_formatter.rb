class StoreAiWhatsappFormatter
  MAX_LENGTH = 1_200

  def self.format(text)
    new(text).format
  end

  def initialize(text)
    @text = text.to_s
  end

  def format
    cleaned = @text
      .gsub(/\*\*(.*?)\*\*/, '\1')
      .gsub(/^[#]{1,6}\s*/, "")
      .gsub(/```.*?```/m, "")
      .gsub(/\b(?:AUD|HOMO)[A-Z0-9_-]{5,}\b/i, "")
      .gsub(/[ \t]*-\s*Use o cupom\s*\*{0,2}\s*\*{0,2}\s*$/i, "")
      .gsub(/^[ \t]*Cupom:\s*$/i, "")
      .gsub(/[ \t]+/, " ")
      .gsub(/\n{3,}/, "\n\n")
      .strip

    cleaned.truncate(MAX_LENGTH, omission: "\n\nPosso ajudar com mais alguma informacao da loja?")
  end
end
