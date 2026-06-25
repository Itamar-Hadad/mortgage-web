// requests/{uid}/messages subcollection — shared contract with issue #8
// (advisor side, currently a placeholder there — see ARCHITECTURE.md §13).
// Document shape is fixed: {sender, text, timestamp}. Don't rename without
// updating the advisor-side consumer too.
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore'

export type MessageSender = 'consumer' | 'advisor'

export interface RequestMessage {
  id: string
  sender: MessageSender
  text: string
  timestamp: Date | null
}

export async function sendMessage(
  db: Firestore,
  requestUid: string,
  sender: MessageSender,
  text: string,
): Promise<void> {
  await addDoc(collection(db, 'requests', requestUid, 'messages'), {
    sender,
    text,
    timestamp: serverTimestamp(),
  })
}

export function subscribeToMessages(
  db: Firestore,
  requestUid: string,
  callback: (messages: RequestMessage[]) => void,
): Unsubscribe {
  const messagesQuery = query(collection(db, 'requests', requestUid, 'messages'), orderBy('timestamp', 'asc'))
  return onSnapshot(messagesQuery, (snapshot) => {
    callback(
      snapshot.docs.map((docSnap) => {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          sender: data.sender,
          text: data.text,
          timestamp: data.timestamp?.toDate() ?? null,
        }
      }),
    )
  })
}
