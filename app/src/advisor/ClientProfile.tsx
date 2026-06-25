import { useTranslation } from 'react-i18next'
import { checklistStatus } from './checklist'
import { ClientDetails } from './ClientDetails'
import { MixEditor } from './MixEditor'
import { TaskGroup } from './TaskGroup'
import type { AdvisorTask, MortgageRequest } from './types'

interface ClientProfileProps {
  client: MortgageRequest
  onUpdateClient: (patch: Partial<MortgageRequest>) => void
  tasks: AdvisorTask[]
  onAddTask: (text: string) => void
  onUpdateTask: (taskId: string, patch: Partial<Pick<AdvisorTask, 'done' | 'notes'>>) => void
  onDeleteTask: (taskId: string) => void
}

const CHECKLIST_STAGES = ['personal', 'mortgage', 'documents', 'approval'] as const

export function ClientProfile({ client, onUpdateClient, tasks, onAddTask, onUpdateTask, onDeleteTask }: ClientProfileProps) {
  const { t } = useTranslation()
  const checklist = checklistStatus(client)

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onUpdateClient({ archived: !client.archived })}
          className="text-sm font-semibold px-3 py-1.5 rounded-full"
          style={{ border: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface-variant)' }}
        >
          {client.archived ? t('advisor.client_list.restore') : t('advisor.client_list.archive')}
        </button>
      </div>

      <div className="glass-panel rounded-xl p-5 grid grid-cols-2 gap-3">
        {CHECKLIST_STAGES.map((stage) => (
          <div key={stage} className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-xl"
              style={{ color: checklist[stage] ? 'var(--color-primary)' : 'var(--color-outline-variant)' }}
              aria-hidden="true"
            >
              {checklist[stage] ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
              {t(`advisor.checklist.${stage}`)}
            </span>
          </div>
        ))}
      </div>

      <ClientDetails client={client} onUpdateClient={onUpdateClient} />

      {client.mixes[0] ? (
        <MixEditor
          routes={client.mixes[0].routes}
          onChange={(routes) =>
            onUpdateClient({ mixes: client.mixes.map((mix, i) => (i === 0 ? { ...mix, routes } : mix)) })
          }
        />
      ) : (
        <p style={{ color: 'var(--color-on-surface-variant)' }}>{t('advisor.no_mix_yet')}</p>
      )}

      <TaskGroup
        testId={`tasks-group-${client.uid}`}
        title={t('advisor.tasks.title')}
        tasks={tasks.filter((task) => task.requestUid === client.uid)}
        onAdd={onAddTask}
        onUpdate={onUpdateTask}
        onDelete={onDeleteTask}
      />
    </div>
  )
}