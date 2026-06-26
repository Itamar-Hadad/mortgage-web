import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db, auth } from '../shared/firebase'
import { clientsForAdvisor, sortClientsForAdvisor } from './clientList'
import { ClientList } from './ClientListPanel'
import { ClientProfile } from './ClientProfile'
import { DocumentsTab } from './DocumentsTab'
import { TasksTab } from './TasksTab'
import { MessagesTab } from './MessagesTab'
import type { ChatMessage } from './MessagesTab'
import { docToMortgageRequest } from './firestoreRequests'
import { PageShell } from '../shared/AppLayout'
import type { AdvisorTask, MortgageRequest } from './types'

type View = 'clients' | 'tasks'
type ClientTab = 'profile' | 'documents' | 'messages'

const CLIENT_TABS = ['profile', 'documents', 'messages'] as const

export function AdvisorScreen() {
  const { t } = useTranslation()
  const advisorUid = auth.currentUser?.uid ?? ''
  const [requests, setRequests] = useState<MortgageRequest[]>([])
  const [tasks, setTasks] = useState<AdvisorTask[]>([])
  const [messagesByUid, setMessagesByUid] = useState<Record<string, ChatMessage[]>>({})
  const [selectedUid, setSelectedUid] = useState<string | null>(null)
  const [view, setView] = useState<View>('clients')
  const [clientTab, setClientTab] = useState<ClientTab>('profile')

  useEffect(() => {
    if (!advisorUid) return
    const q = query(collection(db, 'requests'), where('assignedAdvisorUid', '==', advisorUid))
    return onSnapshot(q, (snap) => {
      setRequests(snap.docs.map((d) => docToMortgageRequest(d.id, d.data())))
    })
  }, [advisorUid])

  const clients = sortClientsForAdvisor(clientsForAdvisor(requests, advisorUid))
  const selected = clients.find((client) => client.uid === selectedUid) ?? clients[0] ?? null

  // Pin the default selection once — otherwise an action that changes sort
  // order (e.g. approving a client's last pending doc) would silently swap
  // who's shown, since `selected` would keep falling back to clients[0].
  useEffect(() => {
    if (selectedUid === null && selected) setSelectedUid(selected.uid)
  }, [selectedUid, selected])

  function updateClient(uid: string, patch: Partial<MortgageRequest>) {
    setRequests((prev) => prev.map((r) => (r.uid === uid ? { ...r, ...patch } : r)))
  }

  function addTask(requestUid: string | null, text: string) {
    setTasks((prev) => [
      ...prev,
      {
        id: `task-${prev.length}-${requestUid ?? 'general'}`,
        advisorUid,
        requestUid,
        text,
        done: false,
        createdAt: new Date().toISOString(),
      },
    ])
  }

  function updateTask(taskId: string, patch: Partial<Pick<AdvisorTask, 'done' | 'notes'>>) {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, ...patch } : task)))
  }

  function deleteTask(taskId: string) {
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
  }

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}>
          {t('advisor.title')}
        </h1>

        <div className="flex gap-2 mb-6 border-b" style={{ borderColor: 'rgba(188,201,204,0.4)' }}>
          {(['clients', 'tasks'] as const).map((viewKey) => (
            <button
              key={viewKey}
              type="button"
              onClick={() => setView(viewKey)}
              className="font-bold px-4 py-2 -mb-px border-b-2"
              style={{
                borderColor: view === viewKey ? 'var(--color-primary)' : 'transparent',
                color: view === viewKey ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
              }}
            >
              {t(`advisor.views.${viewKey}`)}
            </button>
          ))}
        </div>

        {view === 'clients' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <ClientList clients={clients} selectedUid={selected?.uid ?? null} onSelect={setSelectedUid} />
            </div>
            <div className="md:col-span-2">
              <div className="flex gap-2 mb-4 border-b" style={{ borderColor: 'rgba(188,201,204,0.3)' }}>
                {CLIENT_TABS.map((tabKey) => (
                  <button
                    key={tabKey}
                    type="button"
                    onClick={() => setClientTab(tabKey)}
                    className="font-semibold px-3 py-1.5 -mb-px border-b-2 text-sm"
                    style={{
                      borderColor: clientTab === tabKey ? 'var(--color-primary)' : 'transparent',
                      color: clientTab === tabKey ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                    }}
                  >
                    {t(`advisor.tabs.${tabKey}`)}
                  </button>
                ))}
              </div>

              {clientTab === 'profile' && selected && (
                <ClientProfile
                  client={selected}
                  onUpdateClient={(patch) => updateClient(selected.uid, patch)}
                  tasks={tasks}
                  onAddTask={(text) => addTask(selected.uid, text)}
                  onUpdateTask={updateTask}
                  onDeleteTask={deleteTask}
                />
              )}
              {clientTab === 'documents' && (
                <DocumentsTab
                  client={selected}
                  onUpdateClient={(patch) => selected && updateClient(selected.uid, patch)}
                />
              )}
              {clientTab === 'messages' && selected && (
                <MessagesTab
                  clientName={selected.personal[0] ? `${selected.personal[0].first} ${selected.personal[0].last}` : 'לקוח'}
                  messages={messagesByUid[selected.uid] ?? []}
                  onSend={(text) => {
                    const msg: ChatMessage = {
                      id: `msg-${Date.now()}`,
                      senderRole: 'advisor',
                      senderName: 'היועץ שלי',
                      text,
                      sentAt: new Date().toISOString(),
                    }
                    setMessagesByUid(prev => ({
                      ...prev,
                      [selected.uid]: [...(prev[selected.uid] ?? []), msg],
                    }))
                  }}
                />
              )}
            </div>
          </div>
        )}

        {view === 'tasks' && (
          <TasksTab clients={clients} tasks={tasks} onAddTask={addTask} onUpdateTask={updateTask} onDeleteTask={deleteTask} />
        )}
      </div>
    </PageShell>
  )
}