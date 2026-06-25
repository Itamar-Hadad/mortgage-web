import { usePersonalArea } from './hooks/usePersonalArea'
import { TrackSelector } from './TrackSelector'
import { PersonalAreaLayout } from './PersonalAreaLayout'
import { PersonalDetailsSection } from './sections/PersonalDetailsSection'
import { MortgageDataSection } from './sections/MortgageDataSection'
import { CredentialsSection } from './sections/CredentialsSection'
import { DocumentsSection } from './sections/DocumentsSection'
import { PaymentSection } from './sections/PaymentSection'
import { MessagesSection } from './sections/MessagesSection'

export function PersonalArea() {
  const {
    uid, track, selectTrack,
    activeSection, setActiveSection,
    personalDone, mortgageDone, signatureDone, documentsDone, paymentDone,
    completePersonal, completeMortgage, signCredentials, completeDocuments, completePayment,
    signatureLoading, signatureError,
    isSectionUnlocked,
    draft,
  } = usePersonalArea()

  if (!track) {
    return <TrackSelector onSelect={selectTrack} />
  }

  const userName = draft.borrowers[0]?.first || undefined

  return (
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
  )
}
