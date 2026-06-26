# ADR-0007: דף הבית כנתיב שורש + redirect לפי role לאחר כניסה

**תאריך:** 2026-06-26  
**סטטוס:** מאושר ומיושם

---

## הקשר

עד סשן 2, נתיב `/` הפנה ישירות לשאלון (`Questionnaire`). המוצר מבוסס על הפרדה ברורה בין 3 קהלי יעד:
- **משתמש סקרן** — מגיע לדף הבית ובוחר שירות
- **לקוח רשום** — חוזר לאזור האישי
- **צוות (מנהל/יועץ)** — נכנס דרך אותה כניסה, ומנותב לדשבורד הנכון אוטומטית

בנוסף, לא הייתה כל דרך להגיע לנתיבי `/admin` ו-`/advisor` מהממשק — הם היו נגישים רק בכתיבה ידנית ב-URL.

---

## ההחלטה

### 1. מבנה נתיבים חדש

| נתיב | לפני | אחרי |
|---|---|---|
| `/` | `Questionnaire` | `HomePage` (חדש) |
| `/questionnaire` | לא היה | `Questionnaire` |
| `/home` | לא היה | `<Navigate to="/" replace />` (legacy redirect) |

### 2. Redirect לפי role לאחר כניסה

`SignInPage` קורא ל-`getUserRole()` (→ `auth.currentUser.getIdTokenResult()`) לאחר כל כניסה מוצלחת (email ו-Google), ומפנה:

```
role: 'admin'   → /admin
role: 'advisor' → /advisor
else            → /personal-area
```

זה מאפשר לכל הצוות להיכנס דרך `SignInPage` יחיד — אין נתיב כניסה נפרד לצוות.

### 3. "כניסת צוות" בדף הבית

ניווט בדף הבית כולל קישור "כניסת צוות" (→ `/sign-in`) עם איקון `admin_panel_settings`. מיועד לאדמין/יועץ שמגיע לדף הבית.

### 4. Greeting cascade באזור האישי

שם הלקוח מוצג לפי סדר עדיפות:
1. `draft.borrowers[0].first` — שם שמילא בשאלון
2. `auth.currentUser.displayName` — שם Google (אם נכנס עם Google)
3. `auth.currentUser.email.split('@')[0]` — prefix מייל כ-fallback
4. ללא שם — מוצג "האזור האישי" בלי ברכה אישית

הברכה מוצגת בשני מקומות: header עליון (תמיד גלוי) + sidebar (עם avatar עם האות הראשונה של השם).

---

## חלופות שנשקלו

**לא — נתיב כניסה נפרד לצוות (`/staff-login`):** מכביד על UX ויוצר שני flows תחזוקה עם קוד כמעט זהה. Redirect לפי role הוא הפתרון הסטנדרטי ב-Firebase Auth.

**לא — redirect לפי role ב-Cloud Function:** עושה round-trip מיותר; `getIdTokenResult()` קורא את ה-JWT המקומי ללא רשת.

---

## השלכות

- **מנהל/יועץ עם role:'admin'/'advisor' ב-custom claims** — מנותבים אוטומטית לאחר כניסה. כל שנדרש הוא הגדרת ה-claim ב-Firebase Console / Cloud Function ייעודי.
- **Auth guard ב-`/advisor` ו-`/admin`** — עדיין לא מיושם (נטענים עם seed data). הוספת guard `<Navigate to="/sign-in">` תוסיף בשורה אחת כשיהיו users אמיתיים עם roles.
- **`getUserRole()` ב-`authService.ts`** — פונקציה ציבורית שניתן לקרוא לה מכל קומפוננטה. לא ל-cache ידני; Firebase SDK מנהל את ה-token cache אוטומטית.
