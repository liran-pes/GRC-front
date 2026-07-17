# עץ הזית — מערכת GRC ארגונית

אפליקציית SPA בעברית לניהול רגולציה, סיכונים, בקרות וציות. הממשק מבוסס על המוקאפ המקורי, אך רץ כעת כאפליקציית React מלאה עם Vite, Tailwind CSS ו־shadcn/ui. כל נתוני המסכים נטענים דרך API מפרויקט האחות `GRC-BACKEND`.

## הרצה מקומית

```bash
npm install
npm run dev
```

האפליקציה זמינה כברירת מחדל ב־`http://127.0.0.1:5173`.

לפני הרצת ה־Frontend יש להפעיל את `GRC-BACKEND` בפורט `8000`. ניתן לפתוח את `GRC.code-workspace` ולהריץ את המשימה `GRC: Full Stack` כדי להפעיל את שני הפרויקטים יחד.

כתובת ה־API ניתנת לשינוי באמצעות `VITE_API_BASE_URL`; דוגמה נמצאת ב־`.env.example`.

## פקודות

- `npm run dev` — שרת פיתוח מקומי
- `npm run build` — יצירת build לייצור בתיקיית `dist`
- `npm run preview` — צפייה מקומית ב־build
- `npm run lint` — בדיקת קוד

## מבנה מרכזי

- `src/App.jsx` — ניהול ה־SPA, ניווט, חיפוש ואינטראקציות
- `src/components` — מעטפת האפליקציה ורכיבי shadcn/ui
- `src/services/api.js` — לקוח ה־API של `GRC-BACKEND`
- `src/legacy` — ספריית אייקוני SVG שנשמרה כדי לשמור על התאמה חזותית
- `css/styles.css` — שפת העיצוב המקורית של המערכת

הניווט תומך בכתובות hash כגון `#projects`, `#risks`, `#standards` ו־`#requirements`.
