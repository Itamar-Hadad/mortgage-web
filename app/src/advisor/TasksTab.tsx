import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TaskGroup } from './TaskGroup'
import type { AdvisorTask, MortgageRequest } from './types'

interface TasksTabProps {
  clients: MortgageRequest[]
  tasks: AdvisorTask[]
  onAddTask: (requestUid: string | null, text: string) => void
  onUpdateTask: (taskId: string, patch: Partial<Pick<AdvisorTask, 'done' | 'notes'>>) => void
  onDeleteTask: (taskId: string) => void
}

function clientName(client: MortgageRequest) {
  return client.personal[0] ? `${client.personal[0].first} ${client.personal[0].last}` : client.uid
}

/** tasks for a group matching the query — by task text, or every task if the group's own title (client name) matches. */
function matchingTasks(tasks: AdvisorTask[], title: string, query: string): AdvisorTask[] {
  if (query === '') return tasks
  if (title.toLowerCase().includes(query)) return tasks
  return tasks.filter((task) => task.text.toLowerCase().includes(query))
}

export function TasksTab({ clients, tasks, onAddTask, onUpdateTask, onDeleteTask }: TasksTabProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const generalTasks = matchingTasks(tasks.filter((task) => task.requestUid === null), t('advisor.tasks.general'), q)
  const clientGroups = clients
    .map((client) => ({ client, title: clientName(client) }))
    .map(({ client, title }) => ({
      client,
      title,
      tasks: matchingTasks(tasks.filter((task) => task.requestUid === client.uid), title, q),
    }))
    .filter(({ tasks: groupTasks, title }) => q === '' || groupTasks.length > 0 || title.toLowerCase().includes(q))

  return (
    <div className="space-y-6">
      <input
        className="ss-input"
        aria-label={t('advisor.tasks.search')}
        placeholder={t('advisor.tasks.search')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {q === '' || generalTasks.length > 0 ? (
        <TaskGroup
          testId="tasks-group-general"
          title={t('advisor.tasks.general')}
          tasks={generalTasks}
          onAdd={(text) => onAddTask(null, text)}
          onUpdate={onUpdateTask}
          onDelete={onDeleteTask}
        />
      ) : null}

      {clientGroups.map(({ client, title, tasks: groupTasks }) => (
        <TaskGroup
          key={client.uid}
          testId={`tasks-group-${client.uid}`}
          title={title}
          tasks={groupTasks}
          onAdd={(text) => onAddTask(client.uid, text)}
          onUpdate={onUpdateTask}
          onDelete={onDeleteTask}
        />
      ))}
    </div>
  )
}