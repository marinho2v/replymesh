import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Loader2, MessageCircle, Send, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { railsChatWithAi, railsGetAiSettings } from '../../services/storeApi'

const FALLBACK_NAME = 'Carina'

function InlineText({ children }) {
  const parts = String(children || '').split(/(\*\*[^*]+\*\*)/g)

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${part}-${index}`} className="font-semibold text-white">{part.slice(2, -2)}</strong>
    }

    return <span key={`${part}-${index}`}>{part}</span>
  })
}

function AssistantMessage({ text }) {
  const normalizedText = String(text || '')
    .replace(/\s+(?=\d+\.\s+\*\*)/g, '\n')
    .replace(/\s+(?=\*\*[^*]+:\*\*)/g, '\n\n')
  const lines = normalizedText.split(/\r?\n/)

  return (
    <div className="space-y-2.5">
      {lines.map((line, index) => {
        const content = line.trim()
        if (!content) return <div key={`space-${index}`} className="h-0.5" />

        const orderedItem = content.match(/^(\d+)\.\s+(.*)$/)
        if (orderedItem) {
          return (
            <div key={`${content}-${index}`} className="grid grid-cols-[22px_1fr] gap-2">
              <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-yellow-400/15 text-xs font-bold text-yellow-300">
                {orderedItem[1]}
              </span>
              <p className="min-w-0 leading-5"><InlineText>{orderedItem[2]}</InlineText></p>
            </div>
          )
        }

        const bulletItem = content.match(/^[-•]\s+(.*)$/)
        if (bulletItem) {
          return (
            <div key={`${content}-${index}`} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-400" />
              <p className="min-w-0 leading-5"><InlineText>{bulletItem[1]}</InlineText></p>
            </div>
          )
        }

        return <p key={`${content}-${index}`} className="leading-5"><InlineText>{content}</InlineText></p>
      })}
    </div>
  )
}

export default function AiFloatingChat() {
  const location = useLocation()
  const [settings, setSettings] = useState(null)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    let alive = true

    railsGetAiSettings()
      .then((data) => {
        if (!alive) return
        setSettings(data)
        setMessages([
          {
            role: 'assistant',
            text: data?.initial_message || 'Oi! Posso ajudar voce a usar o sistema Replymesh.',
          },
        ])
      })
      .catch(() => {
        if (alive) setSettings(null)
      })

    return () => {
      alive = false
    }
  }, [])

  const enabled = settings?.enabled
  const assistantName = settings?.assistant_name || FALLBACK_NAME

  const canSend = useMemo(() => input.trim().length > 1 && !loading, [input, loading])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading, open])

  const handleSend = async () => {
    if (!canSend) return

    const text = input.trim()
    setInput('')
    setMessages((current) => [...current, { role: 'user', text }])
    setLoading(true)

    try {
      const response = await railsChatWithAi({ message: text, page: location.pathname })
      setMessages((current) => [...current, { role: 'assistant', text: response.answer || response.error || 'Nao consegui responder agora.' }])
    } catch (error) {
      setMessages((current) => [...current, { role: 'assistant', text: error.message || 'Nao consegui conectar a IA agora.' }])
    } finally {
      setLoading(false)
    }
  }

  if (!enabled) return null

  return (
    <div className="fixed bottom-5 right-5 z-[70]">
      {open && (
        <div className="mb-3 flex h-[min(620px,calc(100vh-110px))] w-[min(430px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-dark-700 bg-dark-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-dark-700 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 text-black">
                {settings?.assistant_avatar_url ? (
                  <img src={settings.assistant_avatar_url} alt={assistantName} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <Bot size={20} />
                )}
              </div>
              <div>
                <p className="font-bold text-white">{assistantName}</p>
                <p className="text-xs text-gray-400">Assistente Replymesh</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-gray-400 hover:bg-dark-800 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'max-w-[82%] bg-yellow-400 text-black'
                    : 'max-w-[94%] bg-dark-800 text-gray-100'
                }`}>
                  {message.role === 'assistant'
                    ? <AssistantMessage text={message.text} />
                    : <p className="whitespace-pre-wrap">{message.text}</p>}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-dark-800 px-3 py-2 text-sm text-gray-300">
                  <Loader2 size={15} className="animate-spin" />
                  Pensando...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-dark-700 p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleSend()
                }}
                placeholder="Pergunte sobre o sistema..."
                className="min-w-0 flex-1 rounded-xl border border-dark-700 bg-dark-950 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400"
              />
              <button
                onClick={handleSend}
                disabled={!canSend}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={17} />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((current) => !current)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400 text-black shadow-lg shadow-yellow-500/20 transition hover:scale-105"
        title={`Abrir ${assistantName}`}
      >
        <MessageCircle size={25} />
      </button>
    </div>
  )
}
