import { useEffect, useRef, useState } from 'react'
import { auth } from '../../shared/firebase'

const AGENT_URL = import.meta.env.VITE_EXPLAINER_URL ?? 'http://localhost:7777'

export interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  text: string
}

async function fetchAgentId(): Promise<string | null> {
  try {
    const res = await fetch(`${AGENT_URL}/agents`)
    if (!res.ok) return null
    const agents: { id: string }[] = await res.json()
    return agents[0]?.id ?? null
  } catch {
    return null
  }
}

export function useExplainerChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const agentIdRef = useRef<string | null>(null)

  useEffect(() => {
    fetchAgentId().then(id => { agentIdRef.current = id })
  }, [])

  async function send() {
    const text = input.trim()
    if (!text) return
    if (!auth.currentUser) {
      setError('error')
      return
    }
    const uid = auth.currentUser.uid
    const agentId = agentIdRef.current ?? (await fetchAgentId())
    if (!agentId) {
      setError('error')
      return
    }
    agentIdRef.current = agentId

    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', text }])
    setInput('')
    setIsTyping(true)
    setError(null)

    try {
      const form = new FormData()
      form.append('message', text)
      form.append('user_id', uid)
      form.append('stream', 'false')

      const res = await fetch(`${AGENT_URL}/agents/${agentId}/runs`, {
        method: 'POST',
        body: form,
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
