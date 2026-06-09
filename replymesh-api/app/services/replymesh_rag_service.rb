class ReplymeshRagService
  KNOWLEDGE_PATH = Rails.root.join("docs", "REPLYMESH_AI_KNOWLEDGE_BASE.md")
  CURATED_KNOWLEDGE_PATH = Rails.root.join("docs", "REPLYMESH_CARINA_ARTICLES.md")
  DEFAULT_TOP_K = 5
  MAX_CHUNK_CHARS = 1_800

  Result = Struct.new(:chunks, :estimated_tokens, :source_chars, :selected_chars, keyword_init: true)

  SYNONYMS = ReplymeshKnowledgeService::SYNONYM_GROUPS

  def self.search(query, previous_questions: [], top_k: DEFAULT_TOP_K)
    new(query, previous_questions: previous_questions, top_k: top_k).search
  end

  def initialize(query, previous_questions: [], top_k: DEFAULT_TOP_K)
    @query = normalize(query)
    @previous_questions = Array(previous_questions).last(2).map { |item| normalize(item) }
    @top_k = [[top_k.to_i, 1].max, 8].min
  end

  def search
    source = [CURATED_KNOWLEDGE_PATH, KNOWLEDGE_PATH]
      .select { |path| File.exist?(path) }
      .map { |path| File.read(path, encoding: "UTF-8") }
      .join("\n\n")
    ranked = chunks(source)
      .map { |chunk| chunk.merge(score: score(chunk)) }
      .select { |chunk| chunk[:score].positive? }
      .sort_by { |chunk| [-chunk[:score], chunk[:module], chunk[:index]] }
      .first(@top_k)

    selected_chars = ranked.sum { |chunk| chunk[:content].length }
    Result.new(
      chunks: ranked,
      estimated_tokens: (selected_chars / 4.0).ceil,
      source_chars: source.length,
      selected_chars: selected_chars
    )
  end

  private

  def chunks(content)
    module_name = "Geral"
    index = 0
    result = []
    buffer = []

    content.each_line do |line|
      if line.start_with?("# ")
        flush_chunk(result, buffer, module_name, index)
        index += 1 unless buffer.empty?
        buffer = []
        module_name = line.delete_prefix("# ").strip
      end

      if buffer.join.length + line.length > MAX_CHUNK_CHARS && buffer.any?
        flush_chunk(result, buffer, module_name, index)
        index += 1
        buffer = []
      end
      buffer << line
    end
    flush_chunk(result, buffer, module_name, index)
    result
  end

  def flush_chunk(result, buffer, module_name, index)
    content = buffer.join.strip
    return if content.blank?

    keywords = content[/<!--\s*keywords:\s*(.*?)\s*-->/m, 1].to_s
    result << {
      id: "#{normalize(module_name).parameterize}-#{index}",
      module: module_name,
      keywords: keywords,
      content: content.gsub(/<!--.*?-->/m, "").strip
    }
  end

  def terms
    source_questions = ReplymeshKnowledgeService.continuation?(@query) ? @previous_questions.last(1) + [@query] : [@query]
    original = source_questions.join(" ").split.uniq - ReplymeshKnowledgeService::STOP_WORDS
    expanded = original.dup
    SYNONYMS.each { |group| expanded.concat(group) if (group & original).any? }
    expanded.select { |term| term.length > 2 }.uniq
  end

  def score(chunk)
    title = normalize(chunk[:module])
    keywords = normalize(chunk[:keywords])
    body = normalize(chunk[:content])

    terms.sum do |term|
      next 12 if title.split.include?(term)
      next 8 if keywords.split.include?(term)
      next 4 if title.include?(term) || keywords.include?(term)
      next 1 if body.include?(term)

      0
    end
  end

  def normalize(value)
    ReplymeshKnowledgeService.normalize(value)
  end
end
