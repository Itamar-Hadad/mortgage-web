import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { approveDocument, rejectDocument } from './documents'
import type { MortgageRequest } from './types'

interface DocumentsTabProps {
  client: MortgageRequest | null
  onUpdateClient: (patch: Partial<MortgageRequest>) => void
}

export function DocumentsTab({ client, onUpdateClient }: DocumentsTabProps) {
  const { t } = useTranslation()
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [reasonDraft, setReasonDraft] = useState('')

  if (!client) {
    return <p style={{ color: 'var(--color-on-surface-variant)' }}>{t('advisor.documents_tab.no_client_selected')}</p>
  }

  function handleApprove(docId: string) {
    onUpdateClient({ documents: approveDocument(client!.documents, docId) })
  }

  function handleReject(docId: string) {
    if (reasonDraft.trim() === '') return
    onUpdateClient({ documents: rejectDocument(client!.documents, docId, reasonDraft) })
    setRejectingId(null)
    setReasonDraft('')
  }

  return (
    <div className="space-y-3">
      {client.documents.map((docItem) => (
        <div
          key={docItem.id}
          data-testid={`document-${docItem.id}`}
          className="rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap"
          style={{ background: 'var(--color-surface-container-low)' }}
        >
          <div>
            <div className="font-semibold" style={{ color: 'var(--color-on-surface)' }}>
              {docItem.type}
            </div>
            <div className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
              {docItem.status}
            </div>
            {docItem.rejectionReason && (
              <div className="text-sm" style={{ color: 'var(--color-error)' }}>
                {docItem.rejectionReason}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {docItem.fileUrl ? (
              <a
                href={docItem.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="font-bold px-3 py-1.5 rounded-full text-sm"
                style={{ border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }}
              >
                {t('advisor.documents.view')}
              </a>
            ) : (
              <span className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                {t('advisor.documents.view_unavailable')}
              </span>
            )}
            {docItem.status === 'ממתין לבדיקה' && (
              <>
                {rejectingId === docItem.id && (
                  <input
                    className="ss-input"
                    aria-label={t('advisor.documents.reject_reason_label')}
                    value={reasonDraft}
                    onChange={(e) => setReasonDraft(e.target.value)}
                  />
                )}
                <button
                  type="button"
                  onClick={() => handleApprove(docItem.id)}
                  className="font-bold px-3 py-1.5 rounded-full text-sm"
                  style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
                >
                  {t('advisor.documents.approve')}
                </button>
                <button
                  type="button"
                  onClick={() => (rejectingId === docItem.id ? handleReject(docItem.id) : setRejectingId(docItem.id))}
                  className="font-bold px-3 py-1.5 rounded-full text-sm"
                  style={{ border: '1px solid var(--color-error)', color: 'var(--color-error)' }}
                >
                  {t('advisor.documents.reject')}
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}