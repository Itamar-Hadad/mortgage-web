import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AdvisorTask } from './types'

interface TaskGroupProps {
  testId: string
  title: string
  tasks: AdvisorTask[]
  onAdd: (text: string) => void
  onUpdate: (taskId: string, patch: Partial<Pick<AdvisorTask, 'done' | 'notes'>>) => void
  onDelete: (taskId: string) => void
}

function TaskRow({
  task,
  onUpdate,
  onDelete,
}: {
  task: AdvisorTask
  onUpdate: (patch: Partial<Pick<AdvisorTask, 'done' | 'notes'>>) => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const [showNotes, setShowNotes] = useState(Boolean(task.notes))
  return (
    <li className="space-y-1">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          aria-label={t('advisor.tasks.done_label')}
          checked={task.done}
          onChange={(e) => onUpdate({ done: e.target.checked })}
        />
        <span
          className="text-sm flex-1"
          style={{ color: 'var(--color-on-surface)', textDecoration: task.done ? 'line-through' : 'none' }}
        >
          {task.text}
        </span>
        {!showNotes && (
          <button
            type="button"
            onClick={() => setShowNotes(true)}
            className="text-xs font-semibold"
            style={{ color: 'var(--color-on-surface-variant)' }}
          >
            {t('advisor.tasks.add_note')}
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          aria-label={`${t('advisor.tasks.delete')} — ${task.text}`}
          className="text-xs font-semibold"
          style={{ color: 'var(--color-error)' }}
        >
          {t('advisor.tasks.delete')}
        </button>
      </div>
      {showNotes && (
        <input
          className="ss-input"
          aria-label={`${t('advisor.tasks.notes_label')} — ${task.text}`}
          placeholder={t('advisor.tasks.notes_label')}
          value={task.notes ?? ''}
          onChange={(e) => onUpdate({ notes: e.target.value })}
        />
      )}
    </li>
  )
}

export function TaskGroup({ testId, title, tasks, onAdd, onUpdate, onDelete }: TaskGroupProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState('')
  const openTasks = tasks.filter((task) => !task.done)
  const doneTasks = tasks.filter((task) => task.done)

  function submit() {
    if (draft.trim() === '') return
    onAdd(draft)
    setDraft('')
  }

  return (
    <div data-testid={testId} className="glass-panel rounded-xl p-5 space-y-4">
      <h3 className="font-bold" style={{ color: 'var(--color-on-surface)' }}>
        {title}
      </h3>

      <div className="flex gap-2">
        <input
          className="ss-input"
          aria-label={`${t('advisor.tasks.text_label')} — ${title}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button
          type="button"
          onClick={submit}
          className="font-bold px-4 py-2 rounded-full whitespace-nowrap"
          style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
        >
          {t('advisor.tasks.add')}
        </button>
      </div>

      {openTasks.length > 0 && (
        <ul className="space-y-3" aria-label={t('advisor.tasks.open_label')}>
          {openTasks.map((task) => (
            <TaskRow key={task.id} task={task} onUpdate={(patch) => onUpdate(task.id, patch)} onDelete={() => onDelete(task.id)} />
          ))}
        </ul>
      )}

      {doneTasks.length > 0 && (
        <details>
          <summary className="text-sm font-semibold cursor-pointer" style={{ color: 'var(--color-on-surface-variant)' }}>
            {t('advisor.tasks.done_section', { count: doneTasks.length })}
          </summary>
          <ul className="space-y-3 mt-3">
            {doneTasks.map((task) => (
              <TaskRow key={task.id} task={task} onUpdate={(patch) => onUpdate(task.id, patch)} onDelete={() => onDelete(task.id)} />
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}