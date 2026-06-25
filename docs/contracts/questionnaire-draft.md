# חוזה: טיוטת השאלון האנונימי (`QuestionnaireDraft`)

> נקודת המפגש בין **issue #2** (השאלון — *כותב* את הטיוטה), **issue #3** (מנוע
> החישוב — *מוסיף* את 5 התמהילים), ו-**issue #4/#5** (הרשמה — *קורא* את הטיוטה
> ושומר ל-Firestore). אף אחד מהם לא צריך לקרוא את הקוד של האחר — רק את המסמך הזה.
> מקור האמת בקוד: [`app/src/consumer-flow/questionnaire/types.ts`](../../app/src/consumer-flow/questionnaire/types.ts).
> אם משנים את החוזה — מעדכנים את `types.ts` **ואת** המסמך הזה, לא בשקט (כלל ה-repo).

## איפה הטיוטה חיה

- **אחסון:** `localStorage` בלבד (ADR-0001 — אפס נגיעה ב-Firebase לפני הרשמה).
- **מפתח:** `simplesave:newMortgageDraft:v1` (קבוע `DRAFT_STORAGE_KEY` ב-`types.ts`).
- **ערך:** JSON של `QuestionnaireDraft` (ראו מבנה למטה).

## מי כותב / קורא

| Issue | תפקיד | מה עושה |
|---|---|---|
| #2 (השאלון) | כותב | ממלא את כל השדות **חוץ מ-`mixes`**, autosave על כל שינוי. |
| #3 (calc) | מוסיף | מחשב ודוחף את `mixes` (5 תמהילים) לאותה טיוטה. |
| #4/#5 (הרשמה) | קורא | ברגע שנוצר `uid` — קורא את הטיוטה, כותב פעם אחת ל-`requests/{uid}`, ואז מנקה. |

## מבנה (`QuestionnaireDraft`)

```ts
{
  version: 1,
  loanPurpose: 'נכס יחיד' | 'נכס נוסף' | 'לכל מטרה' | 'שיפור דיור' | '',
  propertySource: 'קבלן' | 'יד 2' | 'מחיר למשתכן' | 'בנייה עצמית' | '',
  propertyValue: number | '',          // שווי הנכס
  equity: number | '',                 // הון עצמי
  borrowers: Array<{
    first: string, last: string,
    birth: string,                     // ISO yyyy-mm-dd
    income: number | '',               // הכנסה נטו חודשית
    isPropertyOwner: boolean,          // לא-בעלים → 50% מההכנסה בכושר ההחזר
  }>,
  additionalIncome: Array<{ type: 'קצבה'|'שכירות'|'אחר', amount: number | '' }>,
  loans: Array<{
    remain: number | '', monthlyPayment: number | '',
    endDate: string /* ISO */, rate: number | '', source: string,
  }>,
  minPay: number | '',                 // מינ׳ החזר חודשי רצוי
  maxPayDesired: number | '',          // מקס׳ החזר חודשי רצוי
  mixes: ProposedMix[],                // ריק עד ש-#3 ממלא; ראו ProposedMix ב-types.ts
}
```

> שמות השדות תואמים בכוונה ל-`state.personal[]`/`financial`/`loans` של הסימולטור
> הקיים, כדי שהמיפוי ל-`requests/{uid}` יהיה 1:1.
> שדות חדשים שאין בסימולטור: `propertyValue`, `propertySource`, `loanPurpose`,
> `isPropertyOwner`, `additionalIncome[]` — ולכן מתועדים כאן במפורש.

## איך #4/#5 קוראים את זה (בלי לגעת ב-localStorage ישירות)

קיים entry point מוכן ב-[`draftStorage.ts`](../../app/src/consumer-flow/questionnaire/draftStorage.ts):

```ts
import { readDraftForMigration, clearDraft } from '@/consumer-flow/questionnaire/draftStorage'

// אחרי שהרשמה הצליחה ויש uid:
const draft = readDraftForMigration()   // QuestionnaireDraft | null
if (draft) {
  await setDoc(doc(db, 'requests', uid), toRequest(draft))  // המיפוי בצד #5
  clearDraft()                          // הטיוטה כבר ב-Firestore
}
```

- `readDraftForMigration()` → מחזיר את הטיוטה, או `null` אם לא מולא שאלון בדפדפן הזה.
- `clearDraft()` → מוחק את הטיוטה מ-localStorage אחרי שמירה מוצלחת.

## הצד של #4/#5: צורת `requests/{uid}`

> זה הצד שלך (#4/#5) — לא מוגדר בקובץ הזה, אבל ARCHITECTURE.md §2/§9 קובע:
> אג'רגט `requests/{uid}` בבעלות uid אחד, מכיל `personal[]` (= `borrowers`),
> `financial` (= `propertyValue`/`equity`/`minPay`/`maxPayDesired`), `loans`,
> ו-`mixes`. בנוסף צריך `assignedAdvisorUid` + custom claim `role` לחוקי Firestore.
> פונקציית המיפוי `toRequest(draft)` נכתבת בצד ההרשמה.
