import { useState, useCallback } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../../shared/firebase'
import { readDraft } from '../../consumer-flow/questionnaire/draftStorage'
import type { QuestionnaireDraft } from '../../consumer-flow/questionnaire/types'

export type Track = 'רכישת תמהיל' | 'ליווי אינטרנטי' | 'יועץ אישי'
export type SectionKey = 'personal' | 'mortgage' | 'credentials' | 'documents' | 'payment'

const TRACK_KEY = 'simplesave:track:v1'

function isBorrowerComplete(b: QuestionnaireDraft['borrowers'][0]): boolean {
  return !!(b.first && b.last && b.birth && b.income !== '')
}

export function usePersonalArea() {
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

  const uid = auth.currentUser?.uid ?? ''
  const draft = readDraft()

  const selectTrack = useCallback((t: Track) => {
    localStorage.setItem(TRACK_KEY, t)
    setTrackState(t)
  }, [])

  const completePersonal = useCallback(() => {
    setPersonalDone(true)
    setActiveSection('mortgage')
  }, [])

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
  }, [uid, track])

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
    borrowersComplete,
  }
}
