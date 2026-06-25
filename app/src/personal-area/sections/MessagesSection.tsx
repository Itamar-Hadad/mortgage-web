import { useEffect, useState } from 'react'
import { db } from '../../shared/firebase'
import { sendMessage, subscribeToMessages, type RequestMessage } from '../messages'

function Icon({ name, filled = false, className = '', style }: { name: string; filled?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0", ...style }} aria-hidden="true">
      {name}
    </span>
  )
}

interface Props {
  uid: string
}

export function MessagesSection({ uid }: Props) {
  const [messages, setMessages] = useState<RequestMessage[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!uid) return
    return subscribeToMessages(db, uid, setMessages)
  }, [uid])

  async function handleSend() {
    if (!draft.trim()) return
    setSending(true)
    try {
      await sendMessage(db, uid, 'consumer', draft.trim())
      setDraft('')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}>
          הודעות
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
          שלחו הודעה ליועץ/מתפעל התיק שלכם וקבלו תשובה כאן בזמן אמת
        </p>
      </div>

      <div className="glass-panel rounded-xl p-4 mb-4 flex flex-col gap-3" style={{ minHeight: 240 }}>
        {messages.length === 0 ? (
          <p className="text-sm text-center my-auto" style={{ color: 'var(--color-on-surface-variant)' }}>
            אין עדיין הודעות
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              data-testid={`message-${m.id}`}
              className="rounded-xl px-4 py-2 max-w-[80%]"
              style={{
                alignSelf: m.sender === 'consumer' ? 'flex-end' : 'flex-start',
                background: m.sender === 'consumer' ? 'var(--color-primary-container)' : 'var(--color-surface-container-low)',
                color: 'var(--color-on-surface)',
              }}
            >
              <p className="text-sm">{m.text}</p>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          className="ss-input flex-1"
          aria-label="כתבו הודעה"
          placeholder="כתבו הודעה..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          type="button"
          disabled={!draft.trim() || sending}
          onClick={handleSend}
          className="rounded-full font-bold px-6 transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
        >
          שליחה
          <Icon name="send" className="text-xl" />
        </button>
      </div>
    </div>
  )
}
