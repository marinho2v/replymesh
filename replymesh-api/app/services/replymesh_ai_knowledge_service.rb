class ReplymeshAiKnowledgeService
  FALLBACK = ReplymeshKnowledgeService::UNKNOWN

  def self.call(question:)
    ReplymeshKnowledgeService.context_for(question)
  end

  def initialize(question:)
    @question = question
  end

  def call
    ReplymeshKnowledgeService.context_for(@question)
  end

  def local_answer
    ReplymeshKnowledgeService.local_answer(@question)
  end
end
