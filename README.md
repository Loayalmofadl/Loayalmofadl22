# مِنصّة - منصة تعليم البرمجة

منصة تعليم برمجة باللغة العربية، تعمل كتطبيق PWA قابل للتثبيت ويعمل دون إنترنت.

## 🎯 المميزات

- ✅ واجهة عربية RTL احترافية
- ✅ تعمل كتطبيق مستقل على Android (PWA)
- ✅ تعمل دون إنترنت بعد التثبيت
- ✅ نظام استيراد مناهج ديناميكي من ملفات JSON
- ✅ حفظ التقدم محلياً (IndexedDB)
- ✅ نظام اختبارات وتمارين تفاعلية
- ✅ تصدير واستيراد المناهج

## 📁 بنية المشروع

```
├── index.html                    # الصفحة الرئيسية
├── public/
│   ├── manifest.webmanifest      # إعدادات PWA
│   ├── sw.js                     # Service Worker
│   ├── icons/                    # أيقونات التطبيق
│   ├── courses/
│   │   ├── catalog.json          # فهرس المناهج
│   │   ├── course-template.json  # قالب المنهج
│   │   └── levels/               # مجلد ملفات المستويات
│   └── docs/
│       ├── COURSE_FORMAT.md      # دليل صيغة المناهج
│       └── HOW_TO_ADD_COURSES.md # دليل إضافة المناهج
├── src/
│   ├── App.tsx                   # المكون الرئيسي
│   ├── main.tsx                  # نقطة الدخول
│   ├── index.css                 # الأنماط
│   ├── pages/
│   │   ├── HomePage.tsx          # الصفحة الرئيسية
│   │   ├── LevelsPage.tsx        # قائمة المستويات
│   │   ├── LevelDetailPage.tsx   # تفاصيل المستوى
│   │   ├── LessonPage.tsx        # صفحة الدرس
│   │   ├── ProgressPage.tsx      # صفحة التقدم
│   │   └── ManageCoursesPage.tsx # إدارة المناهج
│   └── utils/
│       ├── database.ts           # IndexedDB
│       └── courseImporter.ts     # استيراد/تصدير المناهج
└── dist/                         # ملفات البناء (تُنشر)
```

## 🚀 النشر على GitHub Pages

### الطريقة الأساسية:

1. ارفع المشروع على GitHub
2. فعّل GitHub Pages من إعدادات المستودع
3. اختر الفرع `main` والمجلد `/dist` (أو `/root`)

### للنشر في مسار فرعي:

إذا كان المستودع باسم `my-repo`، سيكون الرابط:
`https://username.github.io/my-repo/`

في هذه الحالة، عدّل `vite.config.js`:
```js
export default defineConfig({
  base: '/my-repo/',
  plugins: [react(), tailwindcss()],
});
```

ثم أعد البناء: `npm run build`

## 📱 التثبيت على Android

1. افتح رابط المنصة في متصفح Chrome
2. اضغط على القائمة (⋮) في أعلى المتصفح
3. اختر "إضافة إلى الشاشة الرئيسية" أو "تثبيت التطبيق"
4. سيظهر التطبيق كأيقونة مستقلة

## 📝 إضافة منهج جديد

### 1. أنشئ ملف JSON

استخدم `course-template.json` كقالب. الملف يجب أن يحتوي على:

```json
{
  "id": "level-01",
  "title": "عنوان المستوى",
  "description": "وصف المستوى",
  "levelNumber": 1,
  "order": 1,
  "language": "ar",
  "schemaVersion": "1.0",
  "estimatedMinutes": 120,
  "units": [...]
}
```

### 2. استورد الملف

1. افتح المنصة → إدارة المناهج
2. اضغط "اختر ملف JSON"
3. راجع المعاينة
4. أكد الاستيراد

### 3. ابدأ التعلم!

سيظهر المستوى تلقائياً في قائمة المستويات.

## 📋 صيغة المنهج (Schema v1.0)

### أنواع المحتوى المدعومة:

| النوع | الوصف | الحقول |
|-------|-------|---------|
| `paragraph` | فقرة نصية | `content` |
| `heading` | عنوان فرعي | `content` |
| `list` | قائمة | `items` |
| `code` | مثال برمجي | `content`, `language` |
| `note` | ملاحظة | `content` |
| `warning` | تنبيه | `content` |
| `image` | صورة | `src`, `alt` |

### القواعد:

- كل ملف JSON مستقل
- `schemaVersion` يجب أن يكون `"1.0"`
- المعرّفات (`id`) فريدة داخل المستوى
- الاختبارات تحتاج `options` (خياران على الأقل) و `correctAnswer`
- لا يتم تنفيذ أي JavaScript من الملفات

## 🔧 التقنيات

- React 18 + TypeScript
- Tailwind CSS 4
- IndexedDB (تخزين محلي)
- Service Worker (عمل دون إنترنت)
- Web App Manifest (PWA)
- Vite (أداة البناء)

## 📄 الرخصة

هذا المشروع مفتوح المصدر.
