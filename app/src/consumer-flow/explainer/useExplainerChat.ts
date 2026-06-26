import { useState } from 'react'
import { auth } from '../../shared/firebase'

const AGENT_URL = import.meta.env.VITE_EXPLAINER_URL ?? 'http://localhost:7777'

export interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  text: string
}

export function useExplainerChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send() {
    const text = input.trim()
    if (!text) return
    if (!auth.currentUser) {
      setError('error')
      return
    }
    const uid = auth.currentUser.uid

    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', text }])
    setInput('')
    setIsTyping(true)
    setError(null)

    try {
      const res = await fetch(`${AGENT_URL}/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, uid }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const agentText: string = data?.content ?? data?.message ?? JSON.stringify(data)
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'agent', text: agentText }])
    } catch (err) {
      console.error('[ExplainerChat] fetch error:', err)
      setError('error')
    } finally {
      setIsTyping(false)
    }
  }

  return { messages, input, setInput, isTyping, error, send }
}
