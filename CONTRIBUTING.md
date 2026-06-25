# איך עובדים על הריפו הזה — צוות של 3

מסמך זה מסביר את זרימת העבודה ב-git לצוות (Itamar, liadnave25, RubiDan) על `github.com/Itamar-Hadad/mortgage-web`. כל אחד עובד על המחשב שלו, עם branch נפרד; הסנכרון בין שלושתכם קורה דרך GitHub (issues + PRs), לא רק בשיחה.

## זרימת עבודה, צעד-צעד

1. **Clone פעם אחת** (אם עוד לא):
   ```
   git clone https://github.com/Itamar-Hadad/mortgage-web.git
   ```
   הרצה מקומית של האפליקציה (`npm install` וכו') מתועדת ב-[app/README.md](app/README.md).
2. **לפני שמתחילים issue חדש — מסנכרנים `main`:**
   ```
   git checkout main && git pull origin main
   ```
3. **פותחים branch ייעודי ל-issue שלקחתם**, עם שם שמקודד גם track וגם מספר issue, כדי שאפשר לדעת מה זה בלי לפתוח כלום:
   ```
   git checkout -b track-a/2-anonymous-questionnaire
   git checkout -b track-b/4-registration
   git checkout -b track-c/8-advisor-dashboard
   ```
4. **קומיטים תכופים, לא קומיט-מונסטר אחד בסוף.** זו לא רק היגיינה — המחוון מחייב 40% מהציון על הספק עם **timestamp-history אמיתי על פני 24+ שעות**. קומיט קטן בכל פעם שמשהו עובד = הוכחת עבודה.
5. **דחיפה + PR מול `main` עם `Closes #<מספר>`** בגוף ה-PR, כדי שה-issue יסגר אוטומטית במיזוג:
   ```
   git push -u origin track-a/2-anonymous-questionnaire
   gh pr create --title "..." --body "Closes #2"
   ```
6. **מיזוג** רק אחרי שמישהו עבר על ה-PR (`/code-review` או עין אדם). אחרי המיזוג, שני האחרים מקבלים את השינוי בפעם הבאה ש-`git pull origin main`.

## מי לוקח מה

ה-issues ב-tracker מחולקים ל-3 tracks מקבילים (anonymous flow+results / registration+personal area / admin-advisor+calc engine) פלוס שני issues של תשתית שחוסמים את כולם (#0 scaffolding, #1 פורטינג מנוע החישוב) — לעבוד עליהם ראשון, למזג ל-`main`, ואז להתפצל לשלושת ה-tracks במקביל. לפרטי הפירוק והתלויות ראו issue #1 (PRD) וה-issues שנפתחו ממנו.

## איך כל אחד יודע את הכל בלי לקרוא את כל הקוד של כולם

- **כל issue הוא עצמאי** — מה לבנות, acceptance criteria, ומה הוא תלוי בו. אין צורך ב-context שלא כתוב בו.
- **"חוזים משותפים" כתובים בכל issue רלוונטי**: חתימת מנוע החישוב (`route/params in → calc object out`), צורת `requests/{uid}` (`personal[]`/`financial`/`loans`/`mixes`), וצורת חוקי Firestore (`assignedAdvisorUid` + custom claim `role`). מי שחייב לשנות אחד מהם כותב את זה בפירוש ב-PR/ב-issue — לא משנה בשקט.
- **`CONTEXT.md` / `ARCHITECTURE.md` / `docs/adr/`** הם מילון המונחים וההחלטות המשותף. אם לא בטוחים באיזה שם שדה להשתמש או מה ההחלטה הקיימת — זה נמצא שם.
- אם המימוש בפועל מגלה סתירה מול אחד מהמסמכים האלה — מעדכנים את המסמך המקורי, לא סוטים ממנו בשקט (אותו כלל כמו ב-PRD).