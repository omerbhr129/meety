# Meety - מערכת ניהול פגישות

מערכת Meety היא פלטפורמה לניהול פגישות המאפשרת למשתמשים לקבוע, לנהל ולעקוב אחר פגישות בצורה יעילה.

## תכונות עיקריות

- מערכת אימות משתמשים מאובטחת
- ניהול סוגי פגישות שונים (וידאו, טלפון, פנים אל פנים)
- מעקב אחר פגישות מתוזמנות
- ניהול משתתפים
- ממשק משתמש אינטואיטיבי בעברית
- בדיקת זמינות חכמה למניעת התנגשויות
- תצוגת יומן ורשימה לפגישות
- סטטוס אוטומטי 'התקיימה' לפגישות שעברו
- אפשרות לעריכת פרטי פגישה (תאריך, שעה, משתתף)

## טכנולוגיות

### צד לקוח
- Next.js
- TypeScript
- Tailwind CSS
- Lucide Icons
- ShadcnUI Components
- Framer Motion לאנימציות

### צד שרת
- Node.js
- Express
- MongoDB
- JWT Authentication
- Socket.IO

## API Endpoints

### אותנטיקציה
```
POST /auth/register
- תיאור: הרשמת משתמש חדש
- גוף הבקשה: { email, password, fullName }
- תגובה: { token, user }

POST /auth/login
- תיאור: התחברות למערכת
- גוף הבקשה: { email, password }
- תגובה: { token, user }
```

### פגישות
```
GET /meetings
- תיאור: קבלת כל הפגישות של המשתמש המחובר
- נדרש: Authorization header
- תגובה: { meetings: Meeting[] }

POST /meetings
- תיאור: יצירת פגישה חדשה
- נדרש: Authorization header
- גוף הבקשה: { 
    title: string,
    duration: number,
    type: 'video' | 'phone' | 'in-person',
    availability: {
      type: 'custom',
      workingHours: { start: string, end: string },
      days: { [day: string]: boolean }
    }
  }
- תגובה: { meeting: Meeting }

GET /meetings/:id
- תיאור: קבלת פרטי פגישה ספציפית
- פרמטרים: id (מזהה הפגישה או קישור שיתוף)
- תגובה: { meeting: Meeting }

PUT /meetings/:id
- תיאור: עדכון פרטי פגישה
- נדרש: Authorization header
- גוף הבקשה: כמו ב-POST /meetings
- תגובה: { meeting: Meeting }

DELETE /meetings/:id
- תיאור: מחיקת פגישה
- נדרש: Authorization header
- תגובה: { message: string }

POST /meetings/:id/book
- תיאור: הזמנת פגישה
- פרמטרים: id (מזהה הפגישה או קישור שיתוף)
- גוף הבקשה: { date: string, time: string, participant: string }
- תגובה: { booking: Booking }

PATCH /meetings/:meetingId/slots/:slotId
- תיאור: עדכון פרטי פגישה (תאריך, שעה, משתתף)
- נדרש: Authorization header
- גוף הבקשה: { date?: string, time?: string, participant?: string }
- תגובה: { meeting: Meeting }

PATCH /meetings/:meetingId/slots/:slotId/status
- תיאור: עדכון סטטוס פגישה
- נדרש: Authorization header
- גוף הבקשה: { status: 'completed' | 'missed' }
- תגובה: { meeting: Meeting }
```

### משתתפים
```
GET /participants
- תיאור: קבלת כל המשתתפים של המשתמש המחובר
- נדרש: Authorization header
- תגובה: Participant[]

POST /participants
- תיאור: יצירת משתתף חדש
- גוף הבקשה: { name: string, email: string, phone: string }
- תגובה: { participant: Participant }

DELETE /participants/:id
- תיאור: מחיקת משתתף
- נדרש: Authorization header
- תגובה: { message: string }
```

### משתמש
```
GET /user
- תיאור: קבלת פרטי המשתמש המחובר
- נדרש: Authorization header
- תגובה: { user: User }

PUT /user
- תיאור: עדכון פרטי משתמש
- נדרש: Authorization header
- גוף הבקשה: { fullName?, email?, currentPassword?, newPassword? }
- תגובה: { user: User }

POST /user/profile-image
- תיאור: העלאת תמונת פרופיל
- נדרש: Authorization header
- גוף הבקשה: FormData עם שדה 'image'
- תגובה: { user: User }

DELETE /user
- תיאור: מחיקת חשבון משתמש
- נדרש: Authorization header
- תגובה: { message: string }
```

## שיפורים אחרונים

### מערכת זמינות חכמה
- שיפור ביצועים בבדיקת זמינות פגישות
- מניעת התנגשויות בזמני פגישות
- מטמון יעיל לזמנים תפוסים
- בדיקה כפולה לפני קביעת פגישה

### עדכונים בניהול פגישות
- הוספת אפשרות לעריכת פרטי פגישה
- סטטוס אוטומטי 'התקיימה' לפגישות שעברו
- שיפור בתצוגת היומן והרשימה
- תיקון באפשרות לעריכת פגישות
- מניעת קביעת פגישות בתאריכים שעברו
- הצגת זמנים פנויים בלבד בלוח השנה
- שיפור בממשק קביעת פגישות בודדות

### עדכונים בניהול משתתפים (2024)
- הוספת רענון אוטומטי של הדף לאחר פעולות עריכה ומחיקה
- שיפור חווית המשתמש בעת עדכון פרטי משתתף
- מניעת מצבי מירוץ בעת עדכון נתונים
- רענון מיידי של המידע לאחר כל פעולה
- תמיכה בסגירת דיאלוגים עם עדכון אוטומטי של המידע

### פגישות בודדות
- הוספת נתיב חדש `/meetings/:id/book-single` לקביעת פגישות בודדות
- בדיקת זמינות משופרת למניעת התנגשויות
- סינון אוטומטי של תאריכים שעברו
- הצגת זמנים תפוסים בצורה ברורה
- בדיקה כפולה של זמינות לפני קביעת פגישה

## שינויים קריטיים מתוכננים (2024)

### שיפורי אבטחה
- הוספת rate limiting למניעת התקפות DDoS
```javascript
const rateLimit = require('express-rate-limit');
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 דקות
  max: 100 // הגבלה ל-100 בקשות לכל IP
}));
```

- הוספת הגנת CSRF
```javascript
const csrf = require('csurf');
app.use(csrf());
```

- הוספת סניטציה לקלט משתמש
```javascript
const sanitize = require('express-mongo-sanitize');
app.use(sanitize());
```

### שיפור טיפול בשגיאות
- הוספת מערכת לוגים מרכזית
- ניהול שגיאות גלובלי בשרת
```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  // שליחת לוג לשירות חיצוני
  res.status(500).json({ error: 'Internal server error' });
});
```

### מערכת גיבויים
- הוספת גיבוי אוטומטי של נתוני פגישות
- מנגנון שחזור במקרה של מחיקה בטעות
- שמירת היסטוריית שינויים

### שיפורי ביצועים
- הוספת מטמון לשאילתות נפוצות
- אופטימיזציה של שאילתות מורכבות
- שיפור זמני טעינה

### דוגמה לשימוש במערכת הזמינות
```typescript
// יצירת מטמון יעיל לזמנים תפוסים
const meetingCache = {
  bookedSlots: new Map<string, Set<string>>(),
  availability: meeting.availability,
  duration: meeting.duration
};

// בדיקת זמינות
const checkAvailability = (date: string, time: string): boolean => {
  // בדיקה אם התאריך עבר
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  if (checkDate < today) {
    return false;
  }

  // בדיקה אם הזמן תפוס
  const bookedTimes = meetingCache.bookedSlots.get(date) || new Set();
  return !bookedTimes.has(time);
};

// קביעת פגישה עם וידוא זמינות
const bookMeeting = async (date: string, time: string) => {
  // בדיקה שהזמן עדיין פנוי
  if (!checkAvailability(date, time)) {
    throw new Error('השעה המבוקשת כבר תפוסה או שהתאריך עבר');
  }
  // המשך תהליך ההזמנה...
};
```

### דוגמה למימוש רענון אוטומטי
```typescript
// דיאלוג עריכת משתתף עם רענון אוטומטי
const EditParticipantDialog = () => (
  <Dialog 
    open={!!participantToEdit} 
    onOpenChange={(open) => {
      if (!open) {
        setParticipantToEdit(null);
        // רענון מלא של הדף בעת סגירת הדיאלוג
        window.location.reload();
      }
    }}
  >
    <DialogContent>
      <EditParticipantForm
        onSave={async (data) => {
          await updateParticipant(data);
          // רענון מלא של הדף לאחר שמירה
          window.location.reload();
        }}
        onCancel={() => {
          setParticipantToEdit(null);
          // רענון מלא של הדף בעת ביטול
          window.location.reload();
        }}
      />
    </DialogContent>
  </Dialog>
);
```

### יתרונות הרענון האוטומטי
1. **עקביות נתונים** - הבטחת הצגת המידע העדכני ביותר למשתמש
2. **מניעת באגים** - מניעת מצבים של נתונים לא מסונכרנים
3. **חווית משתמש משופרת** - המשתמש רואה מיד את השינויים שביצע
4. **פשטות המימוש** - שימוש ב-`window.location.reload()` מבטיח רענון מלא ואמין
5. **תחזוקה קלה** - קל לאתר ולתקן בעיות כשהמידע תמיד מסונכרן

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

## פתרון תקלות נפוצות

### בעיות התחברות
- וודא שה-JWT_SECRET זהה בקובץ .env של הפרונטאנד והבקאנד
- בדוק שהטוקן נשלח בכותרת Authorization
- וודא שהמשתמש פעיל במערכת

### בעיות בקביעת פגישות
- וודא שהתאריך והשעה המבוקשים זמינים
- בדוק שהמשתתף קיים במערכת
- וודא שאין התנגשות עם פגישות קיימות

### בעיות בעריכת פגישות
- וודא שיש הרשאות מתאימות
- בדוק שכל הפרטים הנדרשים נשלחים
- וודא שהפגישה עדיין קיימת במערכת

### בעיות CORS
- וודא שהדומיין שלך מורשה ב-allowedOrigins
- בדוק שכל הבקשות כוללות את הכותרות הנדרשות
- וודא שה-credentials מוגדרים נכון

## תרומה לפרויקט

1. צרו fork לפרויקט
2. צרו branch חדש (`git checkout -b feature/amazing-feature`)
3. בצעו commit לשינויים (`git commit -m 'Add amazing feature'`)
4. דחפו ל-branch (`git push origin feature/amazing-feature`)
5. פתחו Pull Request
