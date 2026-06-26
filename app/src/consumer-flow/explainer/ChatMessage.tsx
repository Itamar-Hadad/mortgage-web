import type { ChatMessage as ChatMessageType } from './useExplainerChat'

interface Props {
  message: ChatMessageType
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'
  return (
    <div
      className={`flex w-full mb-3 ${isUser ? 'justify-start' : 'justify-end'}`}
    >
      <div
        className={[
          'max-w-[75%] px-4 py-3 text-sm leading-relaxed',
          'rounded-[18px]',
          isUser ? 'bg-white shadow-sm' : '',
        ].join(' ')}
        style={
          isUser
            ? { color: 'var(--color-on-surface)' }
            : { background: 'var(--color-primary)', color: 'var(--color-on-primary)' }
        }
      >
        {message.text}
      </div>
    </div>
  )
}
