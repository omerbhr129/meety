# Meety - מערכת ניהול פגישות

מערכת Meety היא פלטפורמה לניהול פגישות המאפשרת למשתמשים לקבוע, לנהל ולעקוב אחר פגישות בצורה יעילה.

## תכונות עיקריות

- מערכת אימות משתמשים מאובטחת
- ניהול סוגי פגישות שונים (וידאו, טלפון, פנים אל פנים)
- מעקב אחר פגישות מתוזמנות
- ניהול משתתפים
- ממשק משתמש אינטואיטיבי בעברית

## טכנולוגיות

### צד לקוח
- Next.js
- TypeScript
- Tailwind CSS
- Lucide Icons
- ShadcnUI Components

### צד שרת
- Node.js
- Express
- MongoDB
- JWT Authentication

## ארכיטקטורה

המערכת בנויה בארכיטקטורת Monorepo המכילה שני חלקים עיקריים:

1. **Frontend (/)** - אפליקציית Next.js
2. **Backend (/meety-backend)** - שרת Express

## התקנה והרצה

1. התקנת dependencies:
```bash
# התקנת dependencies של הפרונטאנד
npm install

# התקנת dependencies של הבקאנד
cd meety-backend
npm install
```

2. הגדרת משתני סביבה:
```bash
# בתיקיית השורש
cp .env.example .env

# בתיקיית הבקאנד
cd meety-backend
cp .env.example .env
```

3. הרצת המערכת:
```bash
# הרצת הבקאנד
cd meety-backend
npm run dev

# הרצת הפרונטאנד (בטרמינל נפרד)
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/login` - התחברות למערכת
- `POST /api/register` - הרשמה למערכת

### Meetings
- `GET /api/user/:userId/meetings` - קבלת פגישות של משתמש
- `POST /api/meetings` - יצירת פגישה חדשה
- `PATCH /api/meetings/:id` - עדכון פגישה
- `DELETE /api/meetings/:id` - מחיקת פגישה

### Participants
- `GET /api/participants` - קבלת רשימת משתתפים
- `POST /api/participants` - הוספת משתתף חדש
- `PATCH /api/participants/:id` - עדכון משתתף
- `DELETE /api/participants/:id` - מחיקת משתתף

## פתרון תקלות נפוצות (Troubleshooting)

### 1. בעיות התחברות

#### סיסמה שגויה
**תסמין**: המשתמש מקבל שגיאת התחברות
**פתרון**: 
- בדוק את קובץ `src/services/api.ts` וודא שקיים טיפול שגיאות ב-interceptor:
```typescript
api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response?.status === 401) {
    if (error.config?.url?.includes('/auth/login')) {
      toast({
        variant: "destructive",
        title: "שגיאת התחברות",
        description: "שם משתמש או סיסמה לא נכונים",
      });
    }
  }
  return Promise.reject(error);
});
```

### 2. בעיות קישוריות API

#### שגיאת CORS
**תסמין**: בקשות API נכשלות עם שגיאת CORS
**פתרון**: 
1. בדוק את הגדרות ה-CORS בשרת (`meety-backend/server.js`):
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```
2. וודא שה-`baseURL` מוגדר נכון ב-`src/services/api.ts`:
```typescript
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5004',
  withCredentials: true
});
```

#### שגיאת פורט תפוס
**תסמין**: השרת לא עולה עם שגיאת "port already in use"
**פתרון**:
1. הרג את התהליך הקיים:
```bash
pkill -f "node server.js"
```
2. הפעל מחדש את השרת:
```bash
npm run dev
```

### 3. בעיות במודלים

#### שגיאות Mongoose Transform
**תסמין**: שגיאות בעת המרת אובייקטים של Mongoose ל-JSON
**פתרון**:
1. בדוק את ה-transform function במודל:
```javascript
toJSON: {
  transform: function(doc, ret) {
    if (ret.meetings && Array.isArray(ret.meetings)) {
      ret.meetings = ret.meetings.map(id => id?.toString() || id);
    } else {
      ret.meetings = [];
    }
    delete ret.__v;
    return ret;
  }
}
```

#### שגיאות פופולציה
**תסמין**: מידע חסר בתוצאות של populate
**פתרון**:
1. וודא שהשדות הנדרשים מוגדרים ב-schema
2. בדוק את הגדרות ה-populate בקריאה:
```javascript
await Meeting.findById(id).populate('participant', 'fullName email phone');
```

### 4. בעיות בתצוגת נתונים

#### אובייקטים ריקים בתצוגה
**תסמין**: חלק מהנתונים מוצגים כאובייקטים ריקים או [Object]
**פתרון**:
1. וודא שה-schema מגדיר את כל השדות הנדרשים
2. בדוק את ה-transform functions במודלים הרלוונטיים
3. וודא שכל השדות מטופלים נכון בעת המרה ל-JSON

#### בעיות בפורמט תאריכים
**תסמין**: תאריכים מוצגים בפורמט לא נכון או כ-Invalid Date
**פתרון**:
1. וודא שהתאריכים נשמרים בפורמט ISO בבסיס הנתונים
2. השתמש ב-dayjs או date-fns לפורמוט תאריכים בצד הלקוח:
```typescript
import dayjs from 'dayjs';
const formattedDate = dayjs(date).format('DD/MM/YYYY HH:mm');
```

## מבנה הפרויקט

```
/
├── src/
│   ├── components/     # קומפוננטות React
│   ├── lib/           # פונקציות עזר
│   ├── pages/         # דפי Next.js
│   ├── services/      # שירותי API
│   └── types/         # טיפוסי TypeScript
│
└── meety-backend/
    ├── middlewares/   # middleware של Express
    ├── models/        # מודלים של Mongoose
    └── server.js      # הגדרות השרת
```

## שיפורים עתידיים

1. **ביצועים**
   - הוספת מנגנון caching לקריאות API
   - שימוש ב-React Query לניהול מצב שרת
   - אופטימיזציה של קריאות כפולות

2. **אבטחה**
   - הוספת מנגנון refresh token
   - הוספת rate limiting
   - שיפור validation בצד השרת

3. **ניטור ותחזוקה**
   - הוספת מערכת logging מקיפה
   - הוספת monitoring לביצועי המערכת
   - שיפור ניהול שגיאות

4. **חווית משתמש**
   - הוספת אנימציות ומעברים
   - שיפור תמיכה במובייל
   - הוספת dark mode

## תרומה לפרויקט

1. צרו fork לפרויקט
2. צרו branch חדש (`git checkout -b feature/amazing-feature`)
3. בצעו commit לשינויים (`git commit -m 'Add amazing feature'`)
4. דחפו ל-branch (`git push origin feature/amazing-feature`)
5. פתחו Pull Request
