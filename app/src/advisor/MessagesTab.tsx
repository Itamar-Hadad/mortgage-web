import { useEffect, useRef, useState } from 'react'

export interface ChatMessage {
  id: string
  senderRole: 'advisor' | 'client'
  senderName: string
  text: string
  sentAt: string // ISO
}

interface Props {
  clientName: string
  messages: ChatMessage[]
  onSend: (text: string) => void
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return time
  return `${d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })} ${time}`
}

export function MessagesTab({ clientName, messages, onSend }: Props) {
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    const text = draft.trim()
    if (!text) return
    onSend(text)
    setDraft('')
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: 520,
      borderRadius: '1rem', overflow: 'hidden',
      border: '1px solid rgba(188,201,204,0.3)',
      background: 'rgba(255,255,255,0.55)',
      backdropFilter: 'blur(8px)',
    }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.9rem 1.2rem',
        borderBottom: '1px solid rgba(188,201,204,0.25)',
        background: 'rgba(0,153,187,0.06)',
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'var(--color-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: '1rem',
        }}>
          {clientName[0] ?? '?'}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-on-surface)' }}>
            {clientName}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-on-surface-variant)' }}>
            שיחה עם הלקוח
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {messages.length === 0 && (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--color-on-surface-variant)', fontSize: '0.85rem' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: 8 }}>💬</span>
            עדיין אין הודעות — שלחו הודעה ראשונה ללקוח
          </div>
        )}

        {messages.map((msg) => {
          const isAdvisor = msg.senderRole === 'advisor'
          return (
            <div key={msg.id} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isAdvisor ? 'flex-end' : 'flex-start',
            }}>
              <div style={{
                maxWidth: '72%',
                padding: '0.6rem 0.95rem',
                borderRadius: isAdvisor ? '1rem 1rem 0.2rem 1rem' : '1rem 1rem 1rem 0.2rem',
                background: isAdvisor
                  ? 'var(--color-primary)'
                  : 'rgba(255,255,255,0.9)',
                color: isAdvisor ? '#fff' : 'var(--color-on-surface)',
                fontSize: '0.9rem',
                lineHeight: 1.55,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                border: isAdvisor ? 'none' : '1px solid rgba(188,201,204,0.3)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {msg.text}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-on-surface-variant)', marginTop: 3, paddingInline: 4 }}>
                {msg.senderName} · {formatTime(msg.sentAt)}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', gap: '0.6rem', alignItems: 'flex-end',
        padding: '0.85rem 1.2rem',
        borderTop: '1px solid rgba(188,201,204,0.25)',
        background: 'rgba(255,255,255,0.7)',
      }}>
        <textarea
          dir="rtl"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKey}
          placeholder="כתבו הודעה ללקוח… (Enter לשליחה)"
          rows={1}
          style={{
            flex: 1,
            resize: 'none',
            borderRadius: '0.85rem',
            border: '1px solid rgba(188,201,204,0.4)',
            padding: '0.6rem 0.9rem',
            fontSize: '0.9rem',
            lineHeight: 1.5,
            fontFamily: 'inherit',
            color: 'var(--color-on-surface)',
            background: 'rgba(255,255,255,0.95)',
            outline: 'none',
            overflowY: 'hidden',
          }}
          onInput={e => {
            const el = e.currentTarget
            el.style.height = 'auto'
            el.style.height = Math.min(el.scrollHeight, 120) + 'px'
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!draft.trim()}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
            background: draft.trim() ? 'var(--color-primary)' : 'rgba(188,201,204,0.3)',
            color: draft.trim() ? '#fff' : 'rgba(188,201,204,0.6)',
            border: 'none', cursor: draft.trim() ? 'pointer' : 'default',
            transition: 'background 0.18s',
            fontSize: '1.2rem',
          }}
          aria-label="שלח הודעה"
        >
          ←
        </button>
      </div>
    </div>
  )
}

/* seed messages for demo */
export function makeSeedMessages(clientName: string): ChatMessage[] {
  const now = Date.now()
  return [
    {
      id: 'seed-1',
      senderRole: 'client',
      senderName: clientName,
      text: 'שלום, רציתי לשאול מה הסטטוס של הבקשה שלי?',
      sentAt: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      id: 'seed-2',
      senderRole: 'advisor',
      senderName: 'היועץ שלי',
      text: 'שלום! הבקשה נמצאת בבדיקה. העלית את כל המסמכים הנדרשים — נעדכן תוך 2 ימי עסקים.',
      sentAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: 'seed-3',
      senderRole: 'client',
      senderName: clientName,
      text: 'תודה רבה! האם צריך להעלות גם את תלוש השכר האחרון?',
      sentAt: new Date(now - 1000 * 60 * 30).toISOString(),
    },
  ]
}
