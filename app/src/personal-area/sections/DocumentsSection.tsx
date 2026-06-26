import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useDocuments } from '../hooks/useDocuments'
import type { QuestionnaireDraft } from '../../consumer-flow/questionnaire/types'
import type { RequestDocument } from '../../advisor/types'

function Icon({ name, filled = false, className = '', style }: { name: string; filled?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0", ...style }} aria-hidden="true">
      {name}
    </span>
  )
}

function getRequiredDocTypes(draft: QuestionnaireDraft): string[] {
  const types: string[] = []
  // תעודת זהות per borrower
  draft.borrowers.forEach((_b, i) => {
    types.push(draft.borrowers.length > 1 ? `תעודת זהות — לווה ${i + 1}` : 'תעודת זהות')
  })
  // תלוש שכר if any borrower has income
  if (draft.borrowers.some((b) => b.income !== '' && Number(b.income) > 0)) {
    types.push('תלוש שכר')
  }
  // אישור יתרת הלוואה if existing loans
  if (draft.loans.length > 0) {
    types.push('אישור יתרת הלוואה')
  }
  // חוזה שכירות if rental income
  if (draft.additionalIncome.some((inc) => inc.type === 'שכירות')) {
    types.push('חוזה שכירות')
  }
  return types
}

interface Props {
  uid: string
  draft: QuestionnaireDraft
  onComplete: () => void
}

export function DocumentsSection({ uid, draft, onComplete }: Props) {
  const { t } = useTranslation()
  const { docs, uploading, errors, uploadDocument, allApproved, uploadedCount } = useDocuments(uid)
  const requiredTypes = getRequiredDocTypes(draft)
  const completeCalled = useRef(false)

  useEffect(() => {
    if (allApproved && !completeCalled.current) {
      completeCalled.current = true
      onComplete()
    }
  }, [allApproved, onComplete])

  // Find uploaded doc for a given type
  function docForType(type: string): RequestDocument | undefined {
    return docs.find((d) => d.type === type)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}>
          {t('documents.title')}
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
          {t('documents.subtitle')}
        </p>
      </div>

      {/* Counter */}
      <div className="glass-panel rounded-xl px-5 py-3 mb-5 flex items-center gap-3">
        <Icon name="folder_open" className="text-xl" style={{ color: 'var(--color-primary)' }} />
        <span className="font-semibold text-sm" style={{ color: 'var(--color-on-surface)' }}>
          {t('documents.counter', { uploaded: uploadedCount, total: requiredTypes.length })}
        </span>
        {allApproved && (
          <span className="mr-auto text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: 'rgba(34,197,94,0.15)', color: '#16a34a' }}>
            {t('documents.all_approved')}
          </span>
        )}
      </div>

      {/* Document list */}
      <div className="flex flex-col gap-3">
        {requiredTypes.map((type) => {
          const uploaded = docForType(type)
          const isUploading = uploading[type]
          const uploadError = errors[type]

          return (
            <DocCard
              key={type}
              type={type}
              doc={uploaded}
              isUploading={isUploading}
              error={uploadError}
              onUpload={(file) => uploadDocument(type, file)}
              t={t}
            />
          )
        })}
      </div>

      {allApproved && (
        <div className="glass-panel rounded-xl p-10 text-center mt-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(34,197,94,0.15)' }}>
            <Icon name="check_circle" filled className="text-4xl" style={{ color: '#22c55e' }} />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}>
            {t('documents.all_approved_title')}
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
            {t('documents.all_approved_body')}
          </p>
        </div>
      )}
    </div>
  )
}

interface DocCardProps {
  type: string
  doc: RequestDocument | undefined
  isUploading: boolean | undefined
  error: string | undefined
  onUpload: (file: File) => void
  t: (key: string, opts?: Record<string, unknown>) => string
}

function DocCard({ type, doc, isUploading, error, onUpload, t }: DocCardProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  const statusColor = doc?.status === 'אושר'
    ? '#16a34a'
    : doc?.status === 'נדחה'
    ? 'var(--color-error)'
    : 'var(--color-on-surface-variant)'

  const statusIcon = doc?.status === 'אושר'
    ? 'check_circle'
    : doc?.status === 'נדחה'
    ? 'cancel'
    : 'hourglass_empty'

  return (
    <div className="glass-panel rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <Icon name="description" className="text-xl flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
        <span className="font-semibold flex-1" style={{ color: 'var(--color-on-surface)' }}>{type}</span>

        {doc && (
          <span className="flex items-center gap-1 text-xs font-bold">
            <Icon name={statusIcon} filled className="text-base" style={{ color: statusColor }} />
            <span style={{ color: statusColor }}>{doc.status}</span>
          </span>
        )}
      </div>

      {/* Rejection reason */}
      {doc?.status === 'נדחה' && doc.rejectionReason && (
        <div className="rounded-lg px-4 py-3 mb-3 text-sm"
          style={{ background: 'var(--color-error-container)', color: 'var(--color-on-error-container)' }}>
          <span className="font-bold">{t('documents.rejection_reason')}: </span>
          {doc.rejectionReason}
        </div>
      )}

      {/* Upload progress */}
      {isUploading && (
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-container)' }}>
            <div className="h-full rounded-full animate-pulse" style={{ width: '60%', background: 'var(--color-primary)' }} />
          </div>
          <span className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>{t('documents.uploading')}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs mb-3 font-semibold" style={{ color: 'var(--color-error)' }}>{error}</p>
      )}

      {/* Upload button — show if not uploaded yet, or rejected (re-upload) */}
      {(!doc || doc.status === 'נדחה') && !isUploading && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onUpload(file)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-full font-bold py-2 px-6 text-sm transition-all hover:brightness-110 active:scale-95"
            style={{ background: doc?.status === 'נדחה' ? 'var(--color-error-container)' : 'var(--color-primary-container)', color: doc?.status === 'נדחה' ? 'var(--color-on-error-container)' : 'var(--color-on-primary-container)' }}>
            <Icon name="upload" className="text-sm ml-1" />
            {doc?.status === 'נדחה' ? t('documents.reupload') : t('documents.upload')}
          </button>
        </>
      )}
    </div>
  )
}
