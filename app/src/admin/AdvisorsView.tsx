import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createAdvisor } from './adminAuth'
import type { Advisor } from '../advisor/types'

interface Props {
  advisors: Advisor[]
}

export function AdvisorsView({ advisors }: Props) {
  const { t } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function resetForm() {
    setFirstName('')
    setLastName('')
    setEmail('')
    setPassword('')
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await createAdvisor({ firstName, lastName, email, password })
      resetForm()
      setShowForm(false)
    } catch {
      setError(t('admin.advisors.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}>
          {t('admin.advisors.title')}
        </h2>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            {t('admin.advisors.add')}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-panel rounded-xl p-5 mb-5 space-y-3" style={{ border: '1px solid rgba(188,201,204,0.3)' }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="advisor-first-name" className="ss-label">{t('admin.advisors.first_name')}</label>
              <input
                id="advisor-first-name"
                className="ss-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="advisor-last-name" className="ss-label">{t('admin.advisors.last_name')}</label>
              <input
                id="advisor-last-name"
                className="ss-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="advisor-email" className="ss-label">{t('admin.advisors.email')}</label>
              <input
                id="advisor-email"
                type="email"
                className="ss-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="advisor-password" className="ss-label">{t('admin.advisors.password')}</label>
              <input
                id="advisor-password"
                type="password"
                className="ss-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-sm font-semibold" style={{ color: 'var(--color-error)' }}>{error}</p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl font-bold text-sm disabled:opacity-50"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              {t('admin.advisors.submit')}
            </button>
            <button
              type="button"
              onClick={() => { resetForm(); setShowForm(false) }}
              className="px-5 py-2 rounded-xl font-bold text-sm"
              style={{ color: 'var(--color-on-surface-variant)' }}
            >
              {t('admin.advisors.cancel')}
            </button>
          </div>
        </form>
      )}

      {advisors.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>{t('admin.advisors.empty')}</p>
      ) : (
        <div className="space-y-2">
          {advisors.map((advisor) => (
            <div key={advisor.uid} className="glass-panel rounded-xl p-4 flex items-center justify-between" style={{ border: '1px solid rgba(188,201,204,0.3)' }}>
              <span className="font-bold" style={{ color: 'var(--color-on-surface)' }}>
                {advisor.firstName} {advisor.lastName}
              </span>
              <span className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>{advisor.email}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}