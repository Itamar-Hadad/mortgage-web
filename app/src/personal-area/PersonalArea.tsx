import { usePersonalArea } from './hooks/usePersonalArea'
import { TrackSelector } from './TrackSelector'
import { PersonalAreaLayout } from './PersonalAreaLayout'
import { PersonalDetailsSection } from './sections/PersonalDetailsSection'
import { MortgageDataSection } from './sections/MortgageDataSection'
import { CredentialsSection } from './sections/CredentialsSection'
import { DocumentsSection } from './sections/DocumentsSection'
import { PaymentSection } from './sections/PaymentSection'
import { MessagesSection } from './sections/MessagesSection'
import { Navigate } from 'react-router-dom'
import { auth } from '../shared/firebase'
import { CompletionPopup } from './CompletionPopup'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ExplainerChat } from '../consumer-flow/explainer/ExplainerChat'
import type { User } from 'firebase/auth'

export function PersonalArea() {
  const {
    uid, track, selectTrack,
    activeSection, setActiveSection,
    personalDone, mortgageDone, signatureDone, documentsDone, paymentDone,
    completePersonal, completeMortgage, signCredentials, completeDocuments, completePayment,
    signatureLoading, signatureError,
    isSectionUnlocked,
    draft,
    loadingDraft,
    showCompletionPopup,
    dismissCompletionPopup,
  } = usePersonalArea()

  const [explainerOpen, setExplainerOpen] = useState(false)
  const { t } = useTranslation()

  // Wait for Firebase to restore the session before redirecting
  const [authUser, setAuthUser] = useState<User | null | undefined>(undefined)
  useEffect(() => auth.onAuthStateChanged(setAuthUser), [])

  if (authUser === undefined) {
    // Firebase hasn't resolved auth state yet — show spinner
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-background)' }}>
        <span className="material-symbols-outlined text-5xl animate-spin" style={{ color: 'var(--color-primary)' }}>progress_activity</span>
      </div>
    )
  }

  if (!authUser) {
    return <Navigate to="/sign-in" replace />
  }

  if (loadingDraft) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-background)' }}>
        <span className="material-symbols-outlined text-5xl animate-spin" style={{ color: 'var(--color-primary)' }}>progress_activity</span>
      </div>
    )
  }

  if (!track) {
    return <TrackSelector onSelect={selectTrack} />
  }

  // Name cascade: filled form → Google displayName → email prefix
  const currentUser = auth.currentUser
  const userName =
    draft.borrowers[0]?.first ||
    currentUser?.displayName?.split(' ')[0] ||
    currentUser?.email?.split('@')[0] ||
    undefined

  return (
    <>
    {showCompletionPopup && <CompletionPopup onClose={dismissCompletionPopup} />}
    <PersonalAreaLayout
      track={track}
      activeSection={activeSection}
      isSectionUnlocked={isSectionUnlocked}
      onSelectSection={setActiveSection}
      userName={userName}
    >
      {activeSection === 'personal' && (
        <PersonalDetailsSection
          draft={draft}
          onComplete={completePersonal}
        />
      )}

      {activeSection === 'mortgage' && personalDone && (
        <MortgageDataSection
          draft={draft}
          onComplete={completeMortgage}
        />
      )}

      {activeSection === 'credentials' && mortgageDone && (
        <CredentialsSection
          onSign={signCredentials}
          loading={signatureLoading}
          error={signatureError}
          done={signatureDone}
        />
      )}

      {activeSection === 'documents' && signatureDone && (
        <DocumentsSection
          uid={uid}
          draft={draft}
          onComplete={completeDocuments}
        />
      )}

      {activeSection === 'payment' && documentsDone && track === 'רכישת תמהיל' && (
        <PaymentSection
          onComplete={completePayment}
          done={paymentDone}
        />
      )}

      {activeSection === 'messages' && (
        <MessagesSection uid={uid} />
      )}
    </PersonalAreaLayout>

      <button
        onClick={() => setExplainerOpen(true)}
        className="fixed bottom-6 left-6 z-40 px-5 py-3 rounded-full text-white font-semibold text-sm shadow-lg hover:opacity-90 transition-opacity"
        style={{ backgroundColor: '#006875', fontFamily: 'Assistant, sans-serif' }}
      >
        {t('explainer.button_label')}
      </button>

      <ExplainerChat
        isOpen={explainerOpen}
        onClose={() => setExplainerOpen(false)}
      />
    </>
  )
}
