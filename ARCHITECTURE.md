# SimpleSave — ארכיטקטורה: מסע "משכנתא חדשה"

מסמך זה מתעד את הארכיטקטורה המוסכמת לבניית מחדש (re-platform) של SimpleSave ב-React + Firebase, בסקופ שהוגדר בסשן הגריל: **מההתחלה של `עיצוב מערכת 6.26((.docx` ועד ובכלל מסע "משכנתא חדשה" המלא** (כולל מסך שעונים, אזור אישי, אזור מנהל ואזור יועץ), **לא כולל** את תוכן השאלונים של מחזור משכנתא וביטוח משכנתא (אלו ייבנו בסבב נפרד).

למינוח מלא ראו [CONTEXT.md](./CONTEXT.md). להחלטות שהתקבלו בעקבות שקילת חלופות אמיתיות ראו [docs/adr/](./docs/adr/).

**עקרון מנחה:** כל מודול נבנה פשוט כפי שצריך להאקתון, אבל עם **נקודת הרחבה מתועדת ומפורשת** — לא implicit. כשמחליטים על גרסה מקוצרת/MVP, רושמים בדיוק מה הממשק/החוזה שצריך להישאר קבוע כדי שההחלפה העתידית לא תדרוש שינוי בצרכנים של המודול. ראו טבלה בסעיף 13.

## 1. תפקידים (Roles)

| תפקיד | מקור | הערות |
|---|---|---|
| **משתמש סקרן** | doc | ללא חשבון. שאלון + שעונים + פירוט — בלי הרשמה. |
| **משתמש רשום** | doc | uid אחד ב-Firebase Auth, בעלים של **בקשה** אחת. נבחר אחד מ-3 **מסלולים**: רכישת תמהיל+הוצאת אישורים / ליווי אינטרנטי / יועץ אישי. |
| **יועץ** | doc + Base44 | מטופל ע"י מנהל. מקבל **לקוחות משויכים** (`assignedAdvisorUid`), לא רואה לקוחות של יועצים אחרים. |
| **מנהל** | doc + Base44 | שליטה מלאה: לקוחות, יועצים (כולל שיוך לקוח→יועץ), ריביות שוק, תמהילים (תבניות קבועות), הגדרות מערכת. |

מימוש: **Firebase Auth custom claims** (`role: 'consumer' | 'advisor' | 'admin'`), לא טבלת הרשאות נפרדת.

## 2. מודל הבעלות על נתונים

- **בקשה** (`requests/{uid}`) — האג'רגט המרכזי. בבעלות **uid רשום אחד** (הבעלים/המגיש), לא לווים נפרדים. מכילה מערך **לווים** (1-5) — תואם ל-`state.personal[]` בסימולטור הקיים.
- לווים נוספים (כולל בני/בנות זוג) הם **רשומות מידע** בתוך הבקשה, לא חשבונות Auth נפרדים.
- **יועץ/מנהל** ניגשים לבקשות **שאינן שלהם** — לכן הרשאות Firestore נשענות על `assignedAdvisorUid` בכל מסמך בקשה + custom claim של role, לא רק על "uid הבעלים == uid המשתמש".

## 3. שלב טרום-הרשמה (משתמש סקרן) — שאלון "משכנתא חדשה"

**החלטה (ADR-0001): שום נגיעה ב-Firebase לפני הרשמה בפועל.**
התקדמות השאלון (10 שאלות לפי המסמך) נשמרת **רק ב-localStorage** של הדפדפן. רק בלחיצה על הרשמה (טלפון/מייל + OTP, uid אמיתי נוצר) — תוכן ה-**טיוטה** מועבר בכתיבה חד-פעמית ל-`requests/{uid}` ב-Firestore.
מי שלא נרשם — אין לו שום רישום בשום מקום אצלנו, אף פעם (לא Firestore, לא Firebase Anonymous Auth). מדידת נשירה בשאלון (איפה אנשים עוזבים) — דרך אנליטיקת-צעדים ללא PII (לדוגמה אירוע `question_answered{step}`), לא דרך שמירת הטיוטה עצמה.

**החלטה: שאלות "כל לווה בנפרד" (תאריך לידה+שם, הכנסות נטו) מוצגות במסך/טבלה אחת לכל הלווים בבת אחת**, לא מסך נפרד לכל לווה — בדומה ל-`personalTbl` הקיים בסימולטור. סיבה: עם 2-5 לווים, מסך-לכל-שדה-לכל-לווה היה מנפח את "10 השלבים" המוצהרים למעל 20 מסכים בפועל — סיכון נשירה אמיתי שזוהה.

מסך השעונים (5 הצעות תמהיל) ומסך הפירוט **גלויים למשתמש הסקרן בלי הרשמה** — ההרשמה מגיעה רק כשהוא מבקש פירוט נוסף/להמשיך, אחרי שכבר קיבל ערך. אין שער הרשמה לפני תוצאות.

**תוספת בידול: המשתמש בוחר טופס *או* סוכן-שיחה למילוי השאלון** (שניהם קיימים, לא מחליפים זה את זה) — ראו סעיף 14.

## 4. שלב אחרי הרשמה

לפי המסמך, 3 מסלולים מתפצלים מ"הרשמה ראשונית":

1. **רכישת תמהיל + הוצאת אישורים** — זיהוי → תשלום → מילוי פרטים → בקשה לאישור עקרוני → מסמכים → אישורים.
2. **ליווי אינטרנטי** — הרשמה+חתימה על תנאים → נתונים נוספים (אפשרות לפנות להודעות-עזרה) → מתפעל יוצר קשר, ובמקביל בקשה לאישור עקרוני → מסמכים → **מסך בחירת בנק (מכרז ריביות)** → בחירת בנק.
3. **יועץ אישי** — כמו (2), אך תיאום פגישה (יומן) עם יועץ מלווה אישית, גם פרונטלית.

אם משתמש רשום לא בחר מסלול — נשאר על מסך מילוי פרטים באזור האישי, שאר המסכים נעולים, אבל **נתוני השעונים מהזרימה האנונימית נשארים גלויים לו**.

**אזור אישי — נעילה מדורגת (מאומת מול Base44 בפועל, IMG_9305/9308/9309):** פרטים אישיים → נתוני משכנתא → (נעול עד שניתן) כתבי הסמכה → (נעול עד שנחתם) העלאת מסמכים → (נעול עד שהושלם) אישור עקרוני. כל מסמך שמועלה מקבל סטטוס `ממתין לבדיקה` עד אישור/דחייה ע"י יועץ. תבנית זו ב-Base44 תקינה ולא הבעיה — לשמר אותה.

## 4א. דף הבית ומיפוי נתיבים (ADR-0007)

נוסף בסשן 2 — לפני כן `"/"` הפנה ישירות לשאלון.

| נתיב | קומפוננטה | הרשאה |
|---|---|---|
| `/` | `HomePage` | ציבורי |
| `/questionnaire` | `Questionnaire` | ציבורי (טיוטה ב-localStorage) |
| `/sign-in` | `SignInPage` | ציבורי (לקוחות) |
| `/sign-up` | `SignUpPage` | ציבורי |
| `/staff-sign-in` | `StaffSignInPage` | ציבורי (צוות בלבד — בחירת תפקיד + כניסה) |
| `/personal-area` | `PersonalArea` | `auth.currentUser` — redirect `/sign-in` |
| `/advisor` | `AdvisorScreen` | `RequireRole role="advisor"` — redirect `/staff-sign-in` |
| `/admin` | `AdminScreen` | `RequireRole role="admin"` — redirect `/staff-sign-in` |

**ניתוב לאחר כניסה:**
- `SignInPage` (לקוחות): לאחר כניסה → `/personal-area`
- `StaffSignInPage` (צוות): בחירת תפקיד → כניסה → `/admin` או `/advisor`
- בשניהם: אם קיים Firebase custom claim, הוא גובר על הבחירה ב-UI

**Guard מימוש (`RequireRole`):**
`app/src/shared/RequireRole.tsx` — קורא `getIdTokenResult()`, מציג spinner בבדיקה, מנתב ל-`/staff-sign-in` כשנכשל. מנהל (`admin`) מורשה גם לנתיב `/advisor`.

**דף הבית מכיל:**
- Hero section עם בית SVG מונפש + כרטיסיות צפות (floating data-cards)
- כרטיסי 3 שירותים (משכנתא חדשה → `/questionnaire`, מחזור / ביטוח → "בקרוב")
- "כניסת צוות" בניווט → `/staff-sign-in`
- Aware ל-auth state: מציג "האזור האישי שלי" כשמחובר, "כניסה/הרשמה" כשלא מחובר
- סקציות: How-it-works, Stats (מונים אנימטיביים), Testimonials, בנקים, CTA

## 4ב. Firestore Security Rules — תיקון הרשמה

**בעיה שנמצאה ותוקנה (סשן 4):**
`migrateDraftOnSignup` כותב ל-`requests/{uid}` לפני ש-`claimConsumerRole` מגדיר `role:'consumer'`.
החוקים המקוריים דרשו `role == 'consumer'` לכל write — כולל create — מה שחסם את הכתיבה הראשונה.

**חוקים מעודכנים:**
```
allow create: if auth.uid == requestId  // ללא דרישת role — למשתמש חדש לפני הגדרת role
allow read:   if auth.uid == requestId  // קריאה ללא role — לחלון שבין signup ל-token refresh
allow update: if auth.uid == requestId && role == 'consumer'  // עדכונים — אחרי role
```
תת-קולקציה `events/{eventId}` (חתימות) נוספה לכללים במפורש.

**`claimConsumerRole` ב-SignUpPage** עוטף ב-try/catch — אם נכשל, ה-signup לא נחסם.

## 5. מסכי מנהל ויועץ

מאומתים מול הטאבים הקיימים בסימולטור (`סימולטור_משכנתא.html`) ומול מסכי Base44 (`/AdminDashboard`, `/AdvisorDashboard`):

| טאב בסימולטור הקיים | מסך Admin/Advisor תואם |
|---|---|
| נתונים אישיים, נתונים כלכליים | פרופיל לקוח (Advisor) |
| תמהילים, תבניות קבועות (CLOCK_TEMPLATES) | טאב "תמהילים" (Admin) |
| לוחות סילוקין | "המשכנתא שלי" / "עדכון משכנתא סופית" (Advisor) |
| טבלאות עזר, generalRates, datedRateBands | טאב "ריביות שוק" (Admin) |
| params (מדד שנתי), monthlyIndices | טאב "הגדרות" (Admin) |
| riskRules | טבלאות עזר (Admin/Advisor) |

מנהל: מסך "לקוחות" + "יועצים" — שיוך לקוח (uid הבקשה) ליועץ (`assignedAdvisorUid`), מעבר בין יועצים לראות את הלקוחות שלהם.

**יצירת יועץ (issue #11, נחת):**
- `AdvisorsView.tsx` — טאב "יועצים" באדמין: רשימת יועצים + טופס יצירה (שם פרטי/משפחה/מייל/סיסמה)
- `createAdvisorCallable` (Cloud Function, `functions/src/createAdvisor.ts`) — מאמת `role:'admin'`, קורא `Auth.createUser`, מגדיר claim `role:'advisor'`, כותב ל-`advisors/{uid}` ב-Firestore
- `AdminScreen` מאזין ל-`onSnapshot(collection(db,'advisors'))` — רשימת יועצים זמינה בזמן אמת ברשימת הלקוחות ובdashboard עומס-יועצים
- **חובה לפרוס בנפרד:** `firebase deploy --only functions` לאחר שינוי בפונקציה, `firebase deploy --only firestore:rules` לאחר שינוי בחוקים — push לגיט לא מפרוס ל-Firebase אוטומטית

## 6. מנוע החישוב — היכן הוא רץ ולמה

**אילוץ קריטי (ללא שינוי): נוסחאות `calcRoute`/`calcMix`/`PMT`/`mixRisk` מהסימולטור הקיים נשארות בדיוק כפי שהן.**

**החלטה: ההסתרה ("הלקוח לא רואה את החישוב מאחורי הקלעים") חלה רק על משתמש הקצה (סקרן/רשום), לא על מנהל/יועץ.**

- **מסך מנהל/יועץ** (השעתוק הדיגיטלי של הסימולטור) — ממשיך להרצי`recalc()` **client-side בדפדפן**, בדיוק כמו היום (debounce על כל הקלדה). הם משתמשים מורשים שמותר להם לראות/לערוך פרמטרים (ריביות, מדדים, תבניות) — אין סיבה להאט אותם ב-round-trip לרשת על כל הקלדה.
- **משתמש קצה** (סקרן/רשום) — כל חישוב (שעונים, פירוט, לוח סילוקין שמוצג לו) עובר דרך **Cloud Function** ש"בולעת" את אותו קוד `calcRoute`/`calcMix` (לא שכפול/ניחוש מחדש של הנוסחה) ומחזירה רק תוצאות. שום קובץ JS עם הנוסחאות לא נשלח לדפדפן הצרכן.

## 7. Firestore בלבד — אין מסד רלציוני (ADR-0002)

הקשרים בדומיין (בקשה←לווים, בקשה←מסלולים) הם "מכיל" (מקונן, כמו `state.personal[]` היום) או "חיפוש לפי id" (`assignedAdvisorUid`) — לא joins חופשיים. דוחות/BI מורכבים בעתיד → Firestore→BigQuery export, לא DB רלציוני מקביל.

## 8. פערים שנסגרו בסיבוב שני (לא נדונו בסיבוב הראשון)

קריאה חוזרת של המסמך העלתה 5 נושאים שלא נגענו בהם כלל. נסגרו כך:

1. **מסך תשלום (מסלול רכישת תמהיל)** — כפתור ריק שמקדם למסך הבא, **בלי שום לוגיקה מאחוריו** (לא Cloud Function, לא כתיבה ל-Firestore). ראו ADR-0003 (מעודכן). אחרי ההאקתון: להחביר Cloud Function אמיתי + PayPlus (מומלץ לשוק הישראלי) מאחורי אותו כפתור.
2. **כתבי הסמכה ("חתימה")** — לא אינטגרציית e-signature מלאה (DocuSign וכו', יקר/איטי לבנות בזמן הקיים). פתרון קל: הצגת המסמך + checkbox "קראתי ואני מאשר/חותם" שנשמר ב-Firestore עם uid+timestamp כ"אירוע חתימה". אם הלקוח מעלה גם עותק סרוק חתום-ביד — מתקבל כתיעוד נוסף, לא דורש.
3. **הודעות ליועץ** — thread פשוט מבוסס Firestore (`requests/{uid}/messages` — sender, text, timestamp), מאזין בזמן אמת (`onSnapshot`). אין צורך ב-SDK chat חיצוני (Twilio/Sendbird) לסקופ הזה.
4. **ריבוי שפות לעתיד** — כל מחרוזת UI עוברת דרך i18next מ-day 1 (גם כשרק עברית קיימת בפועל). ראו ADR-0004.
5. **נגישות נכים (תקן נגישות)** — לא מנוהלת בסבב ההאקתון (ADR-0005) — אין widget נגישות, אין QA נגישות ייעודי. **בנפרד מזה**: איכות UX/חווית-משתמש כללית (ייעול זרימת השאלון, שמירת לקוחות, עיצוב שמושך) נשארת בעדיפות גבוהה ולא נחתכה.

## 9. Firebase — מפת רכיבים לתפקיד בפועל

| רכיב | תפקיד בפרויקט הזה |
|---|---|
| **Firebase Auth** | התחברות (טלפון/מייל+OTP לפי המסמך), custom claims לתפקיד (consumer/advisor/admin) |
| **Firestore** | `requests/{uid}` (כולל מערך לווים, תמהילים נבחרים, מצב מסלול), מסמכי מטא-דאטה למסמכים, `templates`/`generalRates`/`riskRules`/`monthlyIndices` (קונפיג מנוהל ע"י מנהל), `advisors`, סטטוס אישור מסמך |
| **Storage** | קבצים פיזיים (תלושי שכר, ת"ז, כתבי הסמכה...), Security Rules לפי uid הבעלים + role |
| **Cloud Functions (Node/TS)** | (1) מנוע החישוב הציבורי (סעיף 6) (2) ולידציית קובץ + Signed URL (`uploadDocumentCallable`) (3) הגדרת `role:'consumer'` בהרשמה (`claimConsumerRoleOnRegistration`) (4) יצירת יועץ + הגדרת `role:'advisor'` (`createAdvisorCallable`) |
| **Cloud Functions (Python, Agno)** | (5) סוכן-קבלה (6) סוכן-הסבר — ראו סעיף 14, ADR-0006. Runtime נפרד מכוון, לא טעות. |

## 10. פיצ'רים שנדחו במכוון מהסבב הזה

- **5 ה-parsers של דוחות בנק** (`parseHapoalimReport` וכו') ו"דוח יתרות לסילוק" — אלו פיצ'ר של **מחזור משכנתא** (`דוח יתרות משכנתא — במחזור משכנתא חובה`, לפי רשימת המסמכים במסמך), שמוחרג מהסקופ הנוכחי. לא לפרט/לבנות אותם עכשיו; ינועו לסבב הארכיטקטורה של מחזור משכנתא.
- תוכן שאלוני מחזור משכנתא וביטוח משכנתא.

## 11. החלטות-ברירת-מחדל סגורות (לא דורשות grilling נוסף)

- **ולידציית קובץ ב-Cloud Function**: allowlist סוג קובץ (pdf/jpg/png), max size (~15MB), סקאן מאלוור/וירוסים בסיסי. דחייה = סטטוס `rejected`+סיבה ב-Firestore, לא רק 4xx שקט.
- **OTP**: טלפון (Firebase Phone Auth) כראשי, מייל+סיסמה כחלופה — תואם "מייל/טלפון/חפ" שבמסמך עבור משתמש רשום.

## 11א. מימושים שנחתו בסשן 2 (לא היו בסקופ הסשן הראשון)

### Auth & UX (PR #25, merged)
- Google sign-in/up בשני מסכי הכניסה
- קישורים הדדיים `/sign-up` ↔ `/sign-in`
- כפתור "כניסה" ב-`ResultsPage` לאחר הצגת התוצאות
- Auth guard ב-`PersonalArea` — redirect ל-`/sign-in` אם לא מחובר
- כפתור התנתקות ב-`PersonalAreaLayout`

### Firestore persistence ב-PersonalArea
- `usePersonalArea`: טוען `requests/{uid}` מ-Firestore ב-mount; fallback ל-localStorage; spinner בטעינה
- `PersonalDetailsSection.onComplete`: שומר לווים ל-`requests/{uid}.personal` ב-Firestore
- Google sign-in: יוצר `requests/{uid}` אם לא קיים

### CompletionPopup + workflow מנהל
- `CompletionPopup.tsx`: דיאלוג חגיגה מונפש כאשר המשתמש משלים את כל סקציות האזור האישי; כותב `status: 'pending_advisor'` ל-`requests/{uid}`
- `adminFirestore.assignAdvisorInFirestore`: יוצר אוטומטית 2 משימות ליועץ המשויך:
  1. "לעבור על פרטי הלקוח ולאשר את המסמכים"
  2. "ליצור קשר עם הלקוח לתיאום המשך התהליך"

### Global Design System
- `index.css`: אנימציות כניסה (`fade-up`, `scale-in`, `slide-right`, `float`, `glow-pulse`), stagger delays, shimmer CTA, `card-hover` lift, `gradient-text`, `glass-panel-deep`

### הקבצים שנוספו/שונו בסשן 2
| קובץ | שינוי |
|---|---|
| `app/src/pages/HomePage.tsx` | חדש — דף נחיתה מלא |
| `app/src/App.tsx` | `/` → `HomePage`, `/questionnaire` → `Questionnaire` |
| `app/src/shared/AppLayout.tsx` | לוגו אמיתי, clickable → `/` |
| `app/src/personal-area/PersonalAreaLayout.tsx` | לוגו אמיתי, greeting עם avatar ושם |
| `app/src/personal-area/PersonalArea.tsx` | cascade שם: draft → displayName → email |
| `app/src/personal-area/auth/SignInPage.tsx` | redirect לפי role לאחר כניסה |
| `app/src/personal-area/auth/authService.ts` | `getUserRole()` חדש |
| `app/src/personal-area/CompletionPopup.tsx` | חדש — popup חגיגה |
| `app/public/logo.png` | לוגו SimpleSave האמיתי |

## 12. שאלה פתוחה אחת שנותרה — לא ניתנת לפתרון טכני

- **"הטמעת 5 סעיפי וריפיקציה" (10% מהמחוון)** — `מחוון לציון הפרוייקט (3).docx` לא מגדיר בפועל מה הם 5 הסעיפים. יש לברר עם קרן כליף/הנחיות ההאקתון — זו לא החלטה ארכיטקטונית, אלא פרט-הגשה חיצוני שחסר.

## 13. נקודות הרחבה ידועות (Known Extension Points)

כל שורה: מה בנינו עכשיו (MVP/האקתון), מה החוזה שצריך להישאר קבוע, ומה ההרחבה העתידית. **בכל פעם שמחליטים על גרסה מקוצרת חדשה — מוסיפים שורה כאן**, לא משאירים implicit.

| מודול | המימוש עכשיו | החוזה הקבוע (לא משתנה בהרחבה) | ההרחבה העתידית |
|---|---|---|---|
| תשלום (ADR-0003) | כפתור UI ריק, אין לוגיקה כלל | מיקום הכפתור בזרימת מסלול-רכישת-תמהיל | Cloud Function + PayPlus אמיתי מאחורי אותו כפתור — אין עדיין חוזה API לשמר |
| נגישות נכים (ADR-0005) | לא מנוהל — defaults של הספרייה בלבד | — | widget נגישות + audit לפני production אמיתי |
| כתבי הסמכה | checkbox "קראתי ואני מאשר" + uid+timestamp ב-Firestore | שדה `signatureEvent{uid, timestamp, docVersion}` | ספק e-signature אמיתי (כמו DocuSign) כותב לאותו שדה |
| התקדמות סקרן (ADR-0001) | localStorage בלבד, אין Firebase לפני הרשמה | שכבת ה-state בצד הקליינט (hook אחד שעוטף read/write) | Firebase Anonymous Auth + TTL אם יתעורר צורך ברציפות בין מכשירים — הוערך ונדחה, אך השכבה מבודדת |
| הודעות ליועץ — צד צרכן (#10) | `requests/{uid}/messages` + `onSnapshot` ממומשים במלואם באזור האישי (שכבת דאטה+UI, נבדק מול Emulator); `firestore.rules` מאפשרים גם לבעלים וגם ליועץ המשויך לכתוב, עם אימות `sender` מול זהות הקורא — אבל אין עדיין UI בצד היועץ (#8 השאיר placeholder, ראו שורה למטה), כך שתשובת יועץ אמיתית דורשת היום כתיבה ידנית ל-Firestore | מבנה מסמך `{sender: 'consumer'\|'advisor', text, timestamp}`, חתימת `sendMessage(db, requestUid, sender, text)`/`subscribeToMessages(db, requestUid, callback)` | שכבת push notifications / SDK chat חיצוני אם הנפח יגדל; UI בצד היועץ מחליף את `MessagesPlaceholder` בקריאה לאותן פונקציות בלי לשנות שכבת דאטה/חוקים |
| שפה (ADR-0004) | i18next עם `he.json` בלבד | כל מחרוזת עוברת `t('key')`, אין hardcoded inline | הוספת `ru.json`/`fr.json`/`en.json` — אפס refactor בקומפוננטות |
| דוחות בנק למחזור (סעיף 10) | לא בנוי בסבב הזה | — | 5 ה-parsers הקיימים מהסימולטור עוברים כמו שהם ל-Cloud Function ייעודי כשנבנה מחזור משכנתא |
| מנוע חישוב (סעיף 6) | `calcRoute`/`calcMix` רץ client-side (מנהל/יועץ) + Cloud Function (קצה) מאותו קוד מקור | חתימת הפונקציות (route/params in → calc object out) | הוספת board/route type חדש נכנסת בתוך `calcRoute` בלי לשבור את הפיצול client/Cloud Function |
| מיון רשימת לקוחות ליועץ (#8) | `nextActionDate(request)` מחשב לפי המסמך הממתין-לבדיקה הישן ביותר בלבד — אין עדיין מקור-נתונים ל"הודעות חדשות" (#10 חסום) | חתימת `nextActionDate(request): Date \| null`, ערך נמוך יותר = דחוף יותר | כש-#10 (הודעות ליועץ) ייבנה — הפונקציה תקבל קלט שני (תאריך הודעה לא-נקראת) ותחזיר את המוקדם מבין השניים, בלי לשנות צרכנים קיימים |
| משימות-מעקב ליועץ (#8) | קולקשיין `tasks` נפרד, נוצר רק ידנית ע"י היועץ (`requestUid` אופציונלי לקישור ללקוח) | מבנה מסמך `{advisorUid, requestUid\|null, text, dueDate?, done, createdAt}` | יצירה אוטומטית של משימת-מעקב כששיוך לקוח↔יועץ חדש נקבע (#11, מנהל) — לא נבנה כרגע, אין AC שדורש זאת |
| מסך יועץ (#8) | `AdvisorScreen` עדיין רץ מול נתוני seed ב-local state (`seedRequests.ts`). Auth ל-role:'advisor' כבר אמיתי (דרך `createAdvisorCallable`), ו-`assignedAdvisorUid` ניתן להקצות מטאב "לקוחות" של מנהל — אבל `AdvisorScreen` עצמו עדיין לא שולף נתונים מ-Firestore לפי המשתמש המחובר | `approveDocument`/`rejectDocument`/`addTask`/`listTasksForAdvisor`/`updateTask` ו-`firestore.rules` כבר אמיתיים; `MortgageRequest` מותאם לצורה שכותב `migrateDraftOnSignup.ts`; ה-seam היחיד הוא מקור הנתונים | `seedRequests()` מוחלף ב-`onSnapshot` שמסנן לפי `assignedAdvisorUid == auth.currentUser.uid`; `setRequests`/`setTasks` מוחלפים בקריאות ל-`*InFirestore` הקיימים — שום שינוי בקומפוננטות |
| Roles (סעיף 1-2) | 3 ערכי custom claim: consumer/advisor/admin. `getUserRole()` ב-`authService.ts` מחזיר את ה-role מה-ID token. `SignInPage` מפנה לפי role בכל כניסה (email/Google). | שם השדה `role` ב-custom claims + `assignedAdvisorUid` בכל בקשה | תפקיד נוסף (לדוגמה "responsible compliance") = ערך claim חדש + ענף חדש בחוקי Firestore, לא מודל חדש |
| auth guard מנהל/יועץ | **מומש במלואו:** `RequireRole` guard ב-`app/src/shared/RequireRole.tsx` עוטף את `/admin` ו-`/advisor`; `StaffSignInPage` מנתב לפי role claim; `createAdvisorCallable` מגדיר `role:'advisor'` לאנשי צוות שנוצרו ע"י מנהל — לא נדרשת הגדרה ידנית ב-Firebase Console | — | — |
| צפייה בקובץ מסמך (#8) | `RequestDocument.fileUrl` לא מוגדר ב-seed; טאב "מסמכים" מציג "צפייה במסמך" מנוטרל/ללא קישור כשהוא חסר | שדה `fileUrl?: string` על `RequestDocument` | כש-#9 (העלאת מסמכים, חסום) יעלה קובץ אמיתי ל-Storage ויכתוב Signed URL לשדה הזה — שום שינוי ב-DocumentsTab |
| הודעות/מסמכים בטאבים פנימיים ללקוח (#8) | "הודעות" placeholder, "מסמכים"/"פרופיל לקוח" משויכים ל-`selected` (הלקוח הנבחר בסיידבר) | טאבים פנימיים תחת תצוגת לקוח יחיד, לא אגרגציה חוצה-לקוחות | כש-issue חדש ייפתח לצד-יועץ של הודעות (אין כיום — #10 הוא "צד צרכן" בלבד) — אותו מיקום בטאב הפנימי, לא טאב עליון נפרד |

## 14. סוכני AI (תוספת בידול — לא במסמך הלקוח המקורי, ADR-0006)

שני פיצ'רים חדשים, **לא** מתוך `עיצוב מערכת 6.26((.docx` — בידול-מוצר שהצוות בחר ביזמתו כדי לבלוט מול מתחרים. שניהם בנויים ב-**Agno (Python)**, לא LangChain — ראו נימוק מלא ב-ADR-0006.

- **סוכן-קבלה**: אופציה חלופית לטופס המדורג של שאלון "משכנתא חדשה" (סעיף 3) — המשתמש בוחר טופס *או* סוכן, שניהם פעילים במקביל. הסוכן חייב לאסוף את **כל** השדות הנדרשים בדיוק כמו הטופס; שלמות-המילוי מנוהלת ע"י tool דטרמיניסטי בקוד (לא שיקול-דעת LLM), כך שכללי-החובה זהים לטופס ולא יכולים "להישחק" בפרומפט. הפלט נכתב לאותו מבנה `לווים`/`financial` ונשמר ב-localStorage ע"י הקליינט בדיוק כמו הטופס (ADR-0001) — לא ערוץ-נתונים נפרד.
- **סוכן-הסבר** ("הסבר לי את המשכנתא שלי"): RAG על מילון המושגים (נספח א') + tool שקורא לאותו Cloud Function המוסתר של מנוע החישוב (סעיף 6) כדי להביא את הנתונים האמיתיים של המשתמש. מסביר רק מה שמעוגן בגלוסר+בנתונים האמיתיים — לא ידע כללי.
- **Human-in-the-loop כאן ≠ `requires_confirmation` של Agno** (זה מיועד לפעולות-עם-תופעת-לוואי בתוך הסוכן, כמו שליחת מייל). השמירה בפועל קורית בקליינט, אז הפתרון הוא מסך recap/אישור ב-UI לפני שכל שדה שחולץ נחשב סופי.
- **תוצאה ארכיטקטונית**: Cloud Functions בריפו ישתמשו בשני runtimes — Node/TS (ללא שינוי) ו-Python (שתי פונקציות הסוכנים בלבד). מכוון, לא לאחד runtime "כדי שיהיה אחיד".
- **פתוח**: ספק embeddings ל-RAG (דוגמת הקורס משתמשת ב-OpenAI embedder גם כש-Claude הוא המודל) — להחליט אם להוסיף תלות ב-OpenAI key רק לשם זה, או embedder אחר שAgno תומך בו.