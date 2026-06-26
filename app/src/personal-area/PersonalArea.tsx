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

  if (!auth.currentUser) {
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
    </>
  )
}
