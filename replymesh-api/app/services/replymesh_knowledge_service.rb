class ReplymeshKnowledgeService
  KNOWLEDGE_PATH = Rails.root.join("docs", "REPLYMESH_AI_KNOWLEDGE_BASE.md")
  CURATED_KNOWLEDGE_PATH = Rails.root.join("docs", "REPLYMESH_CARINA_ARTICLES.md")
  UNKNOWN = "Nao encontrei isso na base da Replymesh. Posso ajudar com outra duvida ou orientar voce a abrir um ticket."
  OUT_OF_SCOPE = "Eu consigo ajudar apenas com duvidas sobre a plataforma Replymesh. Para outro assunto, recomendo abrir um ticket com o suporte."
  MINIMUM_FALLBACK_SCORE = 6

  GREETINGS = /\A(oi+|ola|bom dia|boa tarde|boa noite|tudo bem|como vai|e ai|opa)[!,.?\s]*\z/i
  CONTINUATION_PATTERNS = [
    /\A(e|mas|entao|depois|agora)\b/,
    /\b(isso|nisso|esse|essa|ele|ela|ali|la)\b/,
    /\b(como faco|onde fica|qual deles|e depois)\b/
  ].freeze
  STOP_WORDS = %w[
    a ao aos as com como da das de do dos e em eu isso me meu minha o os ou para
    por que qual quais se sem sua suas seu seus um uma voce voces
  ].freeze
  OUT_OF_SCOPE_PATTERNS = [
    /receita|bolo|namoro|politica|medic|doenca|futebol|resultado do jogo|programacao generica|previsao do tempo/,
    /capital d[aeo]|presidente d[aeo]|historia d[aeo]|geografia|traduz|filme|serie|musica|celebridade/
  ].freeze

  SYNONYM_GROUPS = [
    %w[produto produtos cardapio item itens lanche comida preco imagem adicional opcionais],
    %w[categoria categorias secao secoes organizar cardapio],
    %w[pedido pedidos venda vendas status cozinha kds aceitar preparo pronto cancelar],
    %w[whatsapp evolution conexao qrcode qr mensagem mensagens template templates marketing],
    %w[mercadopago mercado pago pagamento pix cobranca qr webhook access token],
    %w[entrega entregas regiao regioes bairro bairros zona zonas taxa frete],
    %w[motoboy motoboys entregador entregadores delivery],
    %w[cupom cupons desconto promocao promocoes],
    %w[estoque inventario movimentacao entrada saida ajuste insumo],
    %w[caixa financeiro suprimento sangria fechamento abertura],
    %w[relatorio relatorios indicadores faturamento receita],
    %w[mesa mesas comanda qrcode atendimento local],
    %w[ticket tickets suporte ajuda problema erro],
    %w[roleta premio premios giro giros],
    %w[configuracao configuracoes logo identidade horario horarios loja],
    %w[cliente clientes telefone endereco enderecos historico],
    %w[banner banners capa aplicativo],
    %w[usuario usuarios atendente cozinha permissao acesso],
    %w[dominio dominios dns ssl subdominio],
    %w[plano planos assinatura assinaturas mensalidade]
  ].freeze

  INTENT_TITLES = {
    /ticket|suporte|chamado|falar com suporte|pedir ajuda/ => ["Suporte / Tickets", "Suporte e tickets"],
    /foto|imagem|tamanho|proporcao|resolucao/ => ["Imagens do cardapio", "Produtos"],
    /conect|desconect|qrcode|qr code/ => ["QR Code WhatsApp", "WhatsApp / Evolution", "WhatsApp e Evolution Go"],
    /mensagem|template|texto automatic/ => ["Templates WhatsApp"],
    /campanha|marketing|disparo/ => ["Marketing WhatsApp"],
    /recuperador|recuperacao|carrinho abandonado|automacao inteligente/ => ["Automacao Inteligente"],
    /aceit|cancel|status do pedido|pedido/ => ["Pedidos"],
    /cozinha|kds|preparo/ => ["KDS / Cozinha", "Pedidos"],
    /relatorio|faturamento|indicador/ => ["Relatorios"],
    /horario|abre|fecha|funcionamento/ => ["Horarios", "Horarios e status da loja"],
    /regiao|bairro|area de entrega|taxa de entrega/ => ["Regioes de entrega", "Areas de entrega"],
    /ia da loja|assistente da loja/ => ["IA da loja"],
    /produto|preco|cardapio/ => ["Produtos"],
    /cupom|desconto/ => ["Cupons"],
    /roleta|giro|premio/ => ["Roleta"],
    /motoboy|entregador/ => ["Motoboy", "Motoboys"],
    /mercado pago|mercadopago/ => ["Mercado Pago / Pix", "Mercado Pago e Pix automatico"],
    /pix manual|chave pix/ => ["Pix manual"],
    /dominio|dns|ssl|subdominio/ => ["Dominios"],
    /aplicativo|android|app da loja/ => ["Aplicativo Android"],
    /permiss|usuario|atendente|cozinha/ => ["Seguranca / permissoes", "Usuarios e permissoes"]
  }.freeze

  def self.context_for(question, previous_questions: [])
    new(question, previous_questions: previous_questions).context
  end

  def self.local_answer(question, user_name: nil)
    new(question).local_answer(user_name: user_name)
  end

  def self.fallback_answer(question, previous_questions: [])
    new(question, previous_questions: previous_questions).fallback_answer
  end

  def self.greeting?(question)
    normalize(question).match?(GREETINGS)
  end

  def self.continuation?(question)
    normalized = normalize(question)
    normalized.split.length <= 7 && CONTINUATION_PATTERNS.any? { |pattern| normalized.match?(pattern) }
  end

  def self.normalize(text)
    I18n.transliterate(text.to_s).downcase.gsub(/[^a-z0-9\s]/, " ").squish
  end

  def initialize(question, previous_questions: [])
    @question = self.class.normalize(question)
    @previous_questions = Array(previous_questions).map { |item| self.class.normalize(item) }.reject(&:blank?)
  end

  def context
    ranked_sections.first(6).map do |section|
      "## #{section[:title]}\n#{section[:body]}"
    end.join("\n\n")
  end

  def local_answer(user_name: nil)
    return greeting_answer(user_name) if @question.match?(GREETINGS)
    return OUT_OF_SCOPE if OUT_OF_SCOPE_PATTERNS.any? { |pattern| @question.match?(pattern) }

    nil
  end

  def relevant_topics
    ranked_sections.first(6).map { |section| section[:title] }
  end

  def fallback_answer
    section = ranked_sections.first
    return UNKNOWN unless section && section[:score] >= MINIMUM_FALLBACK_SCORE

    pairs = section[:body].scan(
      /\*\*Pergunta:\*\*\s*(.+?)\n\n\*\*Resposta ideal(?: da Carina)?:\*\*\s*(.+?)(?=\n\n\*\*Pergunta:|\n#|\z)/m
    )
    answer = pairs.max_by { |question, _answer| question_similarity(question) }&.last
    answer ||= section[:body][/\*\*Resposta ideal(?: da Carina)?:\*\*\s*(.+?)(?=\n\n\*\*Pergunta:|\n#|\z)/m, 1]
    answer ||= section[:body][/\*\*Resposta ideal:\*\*\s*(.+?)(?=\n\n|\z)/m, 1]
    answer.to_s.gsub(/\s+/, " ").strip.presence || UNKNOWN
  end

  private

  def greeting_answer(user_name)
    period = if @question.include?("bom dia")
               "Bom dia"
             elsif @question.include?("boa tarde")
               "Boa tarde"
             elsif @question.include?("boa noite")
               "Boa noite"
             else
               case Time.current.hour
               when 5...12 then "Bom dia"
               when 12...18 then "Boa tarde"
               else "Boa noite"
               end
             end
    first_name = user_name.to_s.split.first
    greeting = first_name.present? ? "#{period}, #{first_name}!" : "#{period}!"
    "#{greeting} Tudo bem? Como posso ajudar voce hoje com a Replymesh?"
  end

  def ranked_sections
    terms = expanded_terms
    knowledge_sections
      .map { |section| section.merge(score: score(section, terms)) }
      .select { |section| section[:score].positive? }
      .sort_by { |section| -section[:score] }
  end

  def expanded_terms
    source_questions = self.class.continuation?(@question) ? @previous_questions.last(1) + [@question] : [@question]
    original = source_questions.join(" ").split.uniq - STOP_WORDS
    expanded = original.dup

    SYNONYM_GROUPS.each do |group|
      expanded.concat(group) if (group & original).any?
    end

    expanded.select { |term| term.length > 2 }.uniq
  end

  def score(section, terms)
    title = self.class.normalize(section[:title])
    keywords = self.class.normalize(section[:keywords])
    body = self.class.normalize(section[:body])

    lexical_score = terms.sum do |term|
      next 8 if title.split.include?(term)
      next 5 if keywords.split.include?(term)
      next 2 if title.include?(term) || keywords.include?(term)
      next 1 if body.include?(term)

      0
    end

    intent_pattern = INTENT_TITLES.find { |pattern, _titles| @question.match?(pattern) }
    intent_boost = if intent_pattern
      titles = intent_pattern.last
      title_index = titles.index(section[:title])
      if title_index
        (title_index.zero? ? 200 : 20) + (section.fetch(:priority, 0).positive? ? 50 : 0)
      else
        0
      end
    else
      0
    end

    lexical_score + intent_boost + section.fetch(:priority, 0)
  end

  def question_similarity(candidate)
    candidate_terms = self.class.normalize(candidate).split
    current_terms.count { |term| candidate_terms.include?(term) }
  end

  def knowledge_sections
    [CURATED_KNOWLEDGE_PATH, KNOWLEDGE_PATH].filter_map.with_index do |path, index|
      next unless File.exist?(path)

      priority = index.zero? ? 1 : 0
      File.read(path, encoding: "UTF-8").split(/^# /).filter_map do |chunk|
        next if chunk.strip.blank? || chunk.start_with?("#")

        title, *body_lines = chunk.lines
        body = body_lines.join.strip
        keywords = body[/<!--\s*keywords:\s*(.*?)\s*-->/m, 1].to_s
        {
          title: title.to_s.strip,
          keywords: keywords,
          body: body.gsub(/<!--.*?-->/m, "").strip,
          priority: priority
        }
      end
    end
      .flatten
  end

  def current_terms
    @current_terms ||= begin
      original = @question.split.uniq - STOP_WORDS
      expanded = original.dup
      SYNONYM_GROUPS.each { |group| expanded.concat(group) if (group & original).any? }
      expanded.select { |term| term.length > 2 }.uniq
    end
  end
end
