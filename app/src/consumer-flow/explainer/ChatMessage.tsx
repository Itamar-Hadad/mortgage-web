import ReactMarkdown from 'react-markdown'
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
          isUser
            ? 'bg-white shadow-sm text-[#111c2c]'
            : 'text-white',
        ].join(' ')}
        style={isUser ? undefined : { backgroundColor: '#006875' }}
      >
        {isUser ? (
          message.text
        ) : (
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-bold">{children}</strong>,
              h3: ({ children }) => <h3 className="font-bold text-base mb-1 mt-2">{children}</h3>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li>{children}</li>,
              table: ({ children }) => (
                <div className="overflow-x-auto my-2">
                  <table className="text-xs border-collapse w-full">{children}</table>
                </div>
              ),
              th: ({ children }) => <th className="border border-white/40 px-2 py-1 font-bold">{children}</th>,
              td: ({ children }) => <td className="border border-white/40 px-2 py-1">{children}</td>,
            }}
          >
            {message.text}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}
