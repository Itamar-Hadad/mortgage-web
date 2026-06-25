import { useState, useCallback, useEffect } from 'react'
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../../shared/firebase'
import { readDraft } from '../../consumer-flow/questionnaire/draftStorage'
import type { QuestionnaireDraft } from '../../consumer-flow/questionnaire/types'

export type Track = 'רכישת תמהיל' | 'ליווי אינטרנטי' | 'יועץ אישי'
export type SectionKey = 'personal' | 'mortgage' | 'credentials' | 'documents' | 'payment' | 'messages'

const TRACK_KEY = 'simplesave:track:v1'

function isBorrowerComplete(b: QuestionnaireDraft['borrowers'][0]): boolean {
  return !!(b.first && b.last && b.birth && b.income !== '')
}

/** Map Firestore requests/{uid} doc back to QuestionnaireDraft shape */
function requestToLocalDraft(data: Record<string, unknown>): Partial<QuestionnaireDraft> {
  const financial = (data.financial as Record<string, unknown> | undefined) ?? {}
  const pv = financial.propertyValue
  const eq = financial.equity
  const mp = financial.minPay
  const mpd = financial.maxPayDesired
  return {
    borrowers: (data.personal as QuestionnaireDraft['borrowers']) ?? [],
    propertyValue: (typeof pv === 'number' ? pv : pv === '' ? '' : Number(pv) || ''),
    equity:        (typeof eq === 'number' ? eq : eq === '' ? '' : Number(eq) || ''),
    minPay:        (typeof mp === 'number' ? mp : mp === '' ? '' : Number(mp) || ''),
    maxPayDesired: (typeof mpd === 'number' ? mpd : mpd === '' ? '' : Number(mpd) || ''),
    loanPurpose:   (data.loanPurpose as QuestionnaireDraft['loanPurpose']) ?? '',
    propertySource: (data.propertySource as QuestionnaireDraft['propertySource']) ?? '',
    additionalIncome: (data.additionalIncome as QuestionnaireDraft['additionalIncome']) ?? [],
    loans: (data.loans as QuestionnaireDraft['loans']) ?? [],
    mixes: (data.mixes as QuestionnaireDraft['mixes']) ?? [],
    currentStep: (data.questionnaireStep as number) ?? 0,
  }
}

export function usePersonalArea() {
  const uid = auth.currentUser?.uid ?? ''

  const [track, setTrackState] = useState<Track | null>(
    () => (localStorage.getItem(TRACK_KEY) as Track | null)
  )
  const [activeSection, setActiveSection] = useState<SectionKey>('personal')
  const [personalDone, setPersonalDone] = useState(false)
  const [mortgageDone, setMortgageDone] = useState(false)
  const [signatureDone, setSignatureDone] = useState(false)
  const [documentsDone, setDocumentsDone] = useState(false)
  const [paymentDone, setPaymentDone] = useState(false)
  const [signatureLoading, setSignatureLoading] = useState(false)
  const [signatureError, setSignatureError] = useState('')

  // The working draft — populated from Firestore on mount, falls back to localStorage
  const [draft, setDraft] = useState<QuestionnaireDraft>(() => readDraft())
  const [loadingDraft, setLoadingDraft] = useState(true)

  useEffect(() => {
    if (!uid) { setLoadingDraft(false); return }
    getDoc(doc(db, 'requests', uid))
      .then((snap) => {
        if (snap.exists()) {
          const partial = requestToLocalDraft(snap.data() as Record<string, unknown>)
          setDraft((prev) => ({ ...prev, ...partial }))
          // Mark personal as done if data exists and is complete
          const borrowers = (partial.borrowers ?? []) as QuestionnaireDraft['borrowers']
          if (borrowers.length > 0 && borrowers.every(isBorrowerComplete)) {
            setPersonalDone(true)
          }
        }
      })
      .catch(() => { /* network error — stay on localStorage draft */ })
      .finally(() => setLoadingDraft(false))
  }, [uid])

  const selectTrack = useCallback((t: Track) => {
    localStorage.setItem(TRACK_KEY, t)
    setTrackState(t)
  }, [])

  // Saves updated borrowers to Firestore and advances to the next section
  const completePersonal = useCallback(async (updatedBorrowers: QuestionnaireDraft['borrowers']) => {
    setDraft((prev) => ({ ...prev, borrowers: updatedBorrowers }))
    if (uid) {
      try {
        const ref = doc(db, 'requests', uid)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          await updateDoc(ref, { personal: updatedBorrowers })
        } else {
          // Edge case: doc not yet created (e.g. Google sign-in without draft)
          await setDoc(ref, { personal: updatedBorrowers, createdAt: serverTimestamp() }, { merge: true })
        }
      } catch {
        // Non-fatal — local state is already updated, Firestore will sync on next load
      }
    }
    setPersonalDone(true)
    setActiveSection('mortgage')
  }, [uid])

  const completeMortgage = useCallback(() => {
    setMortgageDone(true)
    setActiveSection('credentials')
  }, [])

  const signCredentials = useCallback(async () => {
    setSignatureLoading(true)
    setSignatureError('')
    try {
      await setDoc(doc(db, 'requests', uid, 'events', 'signature'), {
        uid,
        timestamp: serverTimestamp(),
        docVersion: '1.0',
      })
      setSignatureDone(true)
      setActiveSection('documents')
    } catch (e) {
      setSignatureError((e as Error).message)
    } finally {
      setSignatureLoading(false)
    }
  }, [uid])

  const completeDocuments = useCallback(() => {
    setDocumentsDone(true)
    if (track === 'רכישת תמהיל') setActiveSection('payment')
  }, [track])

  const completePayment = useCallback(() => {
    setPaymentDone(true)
  }, [])

  const isSectionUnlocked = useCallback((section: SectionKey): boolean => {
    switch (section) {
      case 'personal': return true
      case 'mortgage': return personalDone
      case 'credentials': return mortgageDone
      case 'documents': return signatureDone
      case 'payment': return track === 'רכישת תמהיל' && documentsDone
      case 'messages': return true
    }
  }, [personalDone, mortgageDone, signatureDone, documentsDone, track])

  const borrowersComplete = draft.borrowers.every(isBorrowerComplete)

  return {
    uid, track, selectTrack,
    activeSection, setActiveSection,
    personalDone, mortgageDone, signatureDone, documentsDone, paymentDone,
    completePersonal, completeMortgage, signCredentials, completeDocuments, completePayment,
    signatureLoading, signatureError,
    isSectionUnlocked,
    draft,
    loadingDraft,
    borrowersComplete,
  }
}
