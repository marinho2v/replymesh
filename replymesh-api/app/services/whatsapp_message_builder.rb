class WhatsappMessageBuilder
  def self.text(body)
    { type: "text", body: body.to_s }
  end

  def self.quick_replies(body:, replies:)
    fallback = numbered_fallback(body, replies)
    { type: "quick_replies", body: body.to_s, replies: Array(replies), fallback_text: fallback }
  end

  def self.list(body:, items:)
    fallback = numbered_fallback(body, items)
    { type: "list", body: body.to_s, items: Array(items), fallback_text: fallback }
  end

  def self.image(url:, caption: nil, fallback_url: nil)
    {
      type: "image",
      url: url.to_s,
      caption: caption.to_s.presence,
      fallback_text: [caption, fallback_url || url].compact_blank.join("\n")
    }
  end

  def self.link(body:, url:)
    { type: "link", body: body.to_s, url: url.to_s, fallback_text: [body, url].join("\n") }
  end

  def self.fallback_text(payload)
    payload[:fallback_text].presence || payload[:body].to_s
  end

  def self.numbered_fallback(body, entries)
    lines = Array(entries).each_with_index.map do |entry, index|
      label = entry.is_a?(Hash) ? (entry[:label] || entry["label"] || entry[:title] || entry["title"]) : entry
      "#{index + 1} - #{label}"
    end
    [body, lines.join("\n"), "Digite o numero da opcao."].compact_blank.join("\n\n")
  end
end
