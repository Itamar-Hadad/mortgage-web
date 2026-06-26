import { usePersonalArea } from './hooks/usePersonalArea'
import { TrackSelector } from './TrackSelector'
import { PersonalAreaLayout } from './PersonalAreaLayout'
import { PersonalDetailsSection } from './sections/PersonalDetailsSection'
import { MortgageDataSection } from './sections/MortgageDataSection'
import { CredentialsSection } from './sections/CredentialsSection'
import { DocumentsSection } from './sections/DocumentsSection'
import { PaymentSection } from './sections/PaymentSection'
import { MessagesSection } from './sections/MessagesSection'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ExplainerChat } from '../consumer-flow/explainer/ExplainerChat'
import { Icon } from '../shared/AppLayout'

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

  const [explainerOpen, setExplainerOpen] = useState(false)
  const { t } = useTranslation()

  if (!track) {
    return <TrackSelector onSelect={selectTrack} />
  }

  const userName = draft.borrowers[0]?.first || undefined

  return (
    <>
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
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm shadow-lg transition-all hover:brightness-110 active:scale-95"
        style={{
          background: 'var(--color-primary)',
          color: 'var(--color-on-primary)',
          fontFamily: 'var(--font-rounded)',
          boxShadow: '0 8px 20px -6px rgba(0,104,117,0.35)',
        }}
      >
        <Icon name="chat" className="text-lg" />
        {t('explainer.button_label')}
      </button>

      <ExplainerChat
        isOpen={explainerOpen}
        onClose={() => setExplainerOpen(false)}
      />
    </>
  )
}
