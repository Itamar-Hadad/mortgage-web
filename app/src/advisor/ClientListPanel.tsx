import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { nextActionDate, searchClients } from './clientList'
import type { MortgageRequest } from './types'

interface ClientListProps {
  clients: MortgageRequest[]
  selectedUid: string | null
  onSelect: (uid: string) => void
}

export function ClientList({ clients, selectedUid, onSelect }: ClientListProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const visibleClients = searchClients(clients.filter((client) => client.archived === showArchived), query)

  if (clients.length === 0) {
    return <p style={{ color: 'var(--color-on-surface-variant)' }}>{t('advisor.client_list.empty')}</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {([false, true] as const).map((archived) => (
          <button
            key={String(archived)}
            type="button"
            onClick={() => setShowArchived(archived)}
            className="flex-1 font-semibold px-3 py-1.5 rounded-full text-sm"
            style={{
              background: showArchived === archived ? 'var(--color-primary)' : 'var(--color-surface-container-low)',
              color: showArchived === archived ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)',
            }}
          >
            {archived ? t('advisor.client_list.archived') : t('advisor.client_list.active')}
          </button>
        ))}
      </div>

      <input
        className="ss-input"
        aria-label={t('advisor.client_list.search')}
        placeholder={t('advisor.client_list.search')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {visibleClients.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
          {t('advisor.client_list.no_results')}
        </p>
      ) : (
        <ul className="space-y-2">
          {visibleClients.map((client) => {
            const due = nextActionDate(client)
            const name = client.personal[0] ? `${client.personal[0].first} ${client.personal[0].last}` : client.uid
            return (
              <li key={client.uid}>
                <button
                  type="button"
                  onClick={() => onSelect(client.uid)}
                  className={`option-card w-full text-right rounded-xl p-4 ${selectedUid === client.uid ? 'active' : ''}`}
                >
                  <div className="font-bold" style={{ color: 'var(--color-on-surface)' }}>
                    {name}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                    {due
                      ? `${t('advisor.client_list.next_action')}: ${due.toLocaleDateString('he-IL')}`
                      : t('advisor.client_list.no_pending_action')}
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}