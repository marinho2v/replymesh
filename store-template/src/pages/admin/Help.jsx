import { useState, useMemo } from 'react'
import { Search, ChevronRight, HelpCircle, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { KB, KB_TOPICS } from '../../knowledge_base/index.js'

const TOPIC_ICONS = {
  introducao: '🏠',
  primeiros_passos: '🚀',
  dashboard: '📊',
  pedidos: '🛍️',
  mesas: '🪑',
  estoque: '📦',
  caixa: '💰',
  pdv: '🖥️',
  motoboy: '🏍️',
  whatsapp: '💬',
  marketing: '📣',
  recuperador: '🔄',
  cupons: '🎟️',
  roleta: '🎡',
  relatorios: '📈',
  configuracoes: '⚙️',
  usuarios: '👥',
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-dark-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-white hover:bg-dark-800 transition-colors"
      >
        <span>{question}</span>
        {open ? <ChevronUp size={16} className="text-gray-400 shrink-0 ml-2" /> : <ChevronDown size={16} className="text-gray-400 shrink-0 ml-2" />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-gray-300 leading-relaxed border-t border-dark-700 pt-3 bg-dark-800/50">
          {answer}
        </div>
      )}
    </div>
  )
}

function SectionBlock({ section }) {
  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold text-white mb-2">{section.title}</h3>
      {section.content && (
        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{section.content}</p>
      )}
      {section.steps && (
        <ol className="mt-2 space-y-2">
          {section.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-300">
              <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400/15 text-xs font-bold text-yellow-300">
                {i + 1}
              </span>
              <span className="leading-relaxed pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function TopicContent({ topicKey }) {
  const entry = KB[topicKey]
  if (!entry) return null

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{TOPIC_ICONS[topicKey] || '📄'}</span>
          <h2 className="text-xl font-bold text-white">{entry.title}</h2>
        </div>
        {entry.description && (
          <p className="text-sm text-gray-400 leading-relaxed">{entry.description}</p>
        )}
      </div>

      {entry.sections && entry.sections.length > 0 && (
        <div className="mb-8">
          {entry.sections.map((section, i) => (
            <SectionBlock key={i} section={section} />
          ))}
        </div>
      )}

      {entry.faq && entry.faq.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <HelpCircle size={16} className="text-yellow-400" />
            Perguntas Frequentes
          </h3>
          <div className="space-y-2">
            {entry.faq.map((item, i) => (
              <FaqItem key={i} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SearchResults({ query }) {
  const results = useMemo(() => {
    if (!query || query.trim().length < 2) return []
    const q = query.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

    return KB_TOPICS.flatMap(key => {
      const entry = KB[key]
      const matched = []

      if (entry.title.toLowerCase().includes(q)) {
        matched.push({ topicKey: key, type: 'title', text: entry.title, entry })
      }

      ;(entry.faq || []).forEach(({ q: question, a: answer }) => {
        if (
          question.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q) ||
          answer.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q)
        ) {
          matched.push({ topicKey: key, type: 'faq', text: question, entry })
        }
      })

      ;(entry.sections || []).forEach(section => {
        const haystack = (section.title + ' ' + (section.content || '') + ' ' + (section.steps || []).join(' ')).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        if (haystack.includes(q)) {
          matched.push({ topicKey: key, type: 'section', text: section.title, entry })
        }
      })

      return matched
    })
  }, [query])

  if (!query || query.trim().length < 2) return null

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <BookOpen size={36} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">Nenhum resultado para &ldquo;{query}&rdquo;</p>
        <p className="text-xs mt-1">Tente palavras como: pedido, caixa, PDV, whatsapp, estoque</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">{results.length} resultado(s) para &ldquo;{query}&rdquo;</p>
      <div className="space-y-2">
        {results.map((result, i) => (
          <div key={i} className="p-3 rounded-lg bg-dark-800 border border-dark-700">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{TOPIC_ICONS[result.topicKey] || '📄'}</span>
              <span className="text-xs text-yellow-400 font-medium">{result.entry.title}</span>
              {result.type === 'faq' && <span className="text-xs text-gray-500 ml-1">• FAQ</span>}
              {result.type === 'section' && <span className="text-xs text-gray-500 ml-1">• Seção</span>}
            </div>
            <p className="text-sm text-white">{result.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Help() {
  const [activeTopic, setActiveTopic] = useState('introducao')
  const [search, setSearch] = useState('')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const isSearching = search.trim().length >= 2

  const handleTopicSelect = (key) => {
    setActiveTopic(key)
    setSearch('')
    setMobileSidebarOpen(false)
  }

  return (
    <div className="flex flex-col h-full min-h-screen bg-dark-950">
      {/* Header */}
      <div className="border-b border-dark-700 bg-dark-900 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400/15">
              <HelpCircle size={18} className="text-yellow-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">Central de Ajuda</h1>
              <p className="text-xs text-gray-400">Tutoriais e documentação ReplyMesh</p>
            </div>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(v => !v)}
            className="lg:hidden flex items-center gap-1.5 text-xs text-gray-400 border border-dark-700 rounded-lg px-3 py-1.5 hover:bg-dark-800"
          >
            <BookOpen size={14} />
            Tópicos
          </button>
        </div>

        {/* Search */}
        <div className="mt-3 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar na documentação..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-gray-500 outline-none focus:border-yellow-400/60"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — tópicos */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 w-64 bg-dark-900 border-r border-dark-700 overflow-y-auto pt-16 pb-4 px-3 transition-transform duration-200
            ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:static lg:translate-x-0 lg:z-auto lg:pt-0 lg:w-56 xl:w-64 lg:shrink-0
          `}
        >
          {mobileSidebarOpen && (
            <div className="flex items-center justify-between px-2 py-3 border-b border-dark-700 mb-2 lg:hidden">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tópicos</span>
              <button onClick={() => setMobileSidebarOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
          )}
          <div className="hidden lg:block px-2 pt-4 pb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tópicos</span>
          </div>
          <nav className="space-y-0.5 mt-1">
            {KB_TOPICS.map(key => {
              const entry = KB[key]
              const active = activeTopic === key && !isSearching
              return (
                <button
                  key={key}
                  onClick={() => handleTopicSelect(key)}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left
                    ${active
                      ? 'bg-yellow-400/10 text-yellow-300 font-medium'
                      : 'text-gray-400 hover:text-white hover:bg-dark-800'
                    }
                  `}
                >
                  <span className="text-base leading-none shrink-0">{TOPIC_ICONS[key] || '📄'}</span>
                  <span className="truncate">{entry.title}</span>
                  {active && <ChevronRight size={14} className="ml-auto shrink-0 text-yellow-400" />}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Overlay mobile */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Conteúdo */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-3xl">
            {isSearching
              ? <SearchResults query={search} />
              : <TopicContent topicKey={activeTopic} />
            }
          </div>
        </main>
      </div>
    </div>
  )
}
