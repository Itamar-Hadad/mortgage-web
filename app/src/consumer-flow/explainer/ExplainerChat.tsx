import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useExplainerChat } from './useExplainerChat'
import { ChatMessage } from './ChatMessage'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function ExplainerChat({ isOpen, onClose }: Props) {
  const { t } = useTranslation()
  const { messages, input, setInput, isTyping, error, send } = useExplainerChat()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
      onClick={onClose}
    >
      <div
        dir="rtl"
        className="relative flex flex-col w-full max-w-md h-full shadow-2xl"
        style={{ backgroundColor: '#f0f3ff', fontFamily: 'Assistant, sans-serif' }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-[#bcc9cc]"
          style={{ backgroundColor: '#006875' }}
        >
          <span className="text-white font-bold text-lg">
            {t('explainer.drawer_title')}
          </span>
          <button
            onClick={onClose}
            className="text-white text-2xl leading-none hover:opacity-70 transition-opacity"
            aria-label={t('explainer.close')}
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {isTyping && (
            <div className="flex justify-end mb-3">
              <div
                className="flex items-center gap-1 px-4 py-3 rounded-[18px] text-white"
                style={{ backgroundColor: '#006875' }}
              >
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-white opacity-80"
                    style={{
                      animation: 'bounce 1.2s infinite',
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-center text-sm text-red-600 mt-2">
              {t('explainer.error')}
            </p>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="px-4 py-3 border-t border-[#bcc9cc] bg-white">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('explainer.input_placeholder')}
              className="flex-1 px-4 py-2 rounded-full border border-[#bcc9cc] text-sm outline-none focus:border-[#006875] transition-colors"
              style={{ fontFamily: 'Assistant, sans-serif' }}
              dir="rtl"
            />
            <button
              onClick={send}
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-opacity"
              style={{ backgroundColor: '#006875' }}
              aria-label={t('explainer.send')}
            >
              ➤
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}
