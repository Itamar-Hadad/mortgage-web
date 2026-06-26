import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useExplainerChat } from './useExplainerChat'
import { ChatMessage } from './ChatMessage'
import { Icon } from '../../shared/AppLayout'

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
        style={{ background: 'var(--color-surface)', fontFamily: 'var(--font-rounded)' }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ background: 'var(--color-primary)' }}
        >
          <span className="font-bold text-lg" style={{ color: 'var(--color-on-primary)', fontFamily: 'var(--font-headline)' }}>
            {t('explainer.drawer_title')}
          </span>
          <button
            onClick={onClose}
            className="hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-on-primary)' }}
            aria-label={t('explainer.close')}
          >
            <Icon name="close" className="text-2xl" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {isTyping && (
            <div className="flex justify-end mb-3">
              <div
                className="flex items-center gap-1 px-4 py-3 rounded-[18px]"
                style={{ background: 'var(--color-primary)' }}
              >
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full opacity-80"
                    style={{
                      background: 'var(--color-on-primary)',
                      animation: 'bounce 1.2s infinite',
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-center text-sm mt-2" style={{ color: 'var(--color-error)' }}>
              {t('explainer.error')}
            </p>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="px-4 py-3" style={{ borderTop: '1px solid var(--color-outline-variant)', background: 'var(--color-surface)' }}>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('explainer.input_placeholder')}
              className="ss-input flex-1 rounded-full"
              dir="rtl"
            />
            <button
              onClick={send}
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 transition-opacity"
              style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
              aria-label={t('explainer.send')}
            >
              <Icon name="send" className="text-xl" />
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
