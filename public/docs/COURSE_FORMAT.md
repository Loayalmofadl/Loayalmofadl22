# صيغة ملفات المناهج - COURSE FORMAT

## نظرة عامة

كل مستوى تعليمي يتم تخزينه في ملف JSON مستقل. يجب أن يتبع الملف البنية المحددة أدناه.

## الإصدار المدعوم

الإصدار الحالي من صيغة المناهج هو: `1.0`

## البنية الكاملة

```json
{
  "id": "string (معرّف فريد)",
  "title": "string (عنوان المستوى)",
  "description": "string (وصف المستوى)",
  "levelNumber": "number (رقم المستوى)",
  "order": "number (ترتيب العرض)",
  "language": "string (لغة المحتوى - مثال: ar)",
  "schemaVersion": "string (إصدار الصيغة - مثال: 1.0)",
  "estimatedMinutes": "number (المدة التقديرية بالدقائق)",
  "units": "array (مصفوفة الوحدات)"
}
```

## الحقول المطلوبة

| الحقل | النوع | الوصف |
|-------|-------|-------|
| `id` | string | معرّف فريد للمستوى (لا يتكرر) |
| `title` | string | عنوان المستوى |
| `description` | string | وصف مختصر |
| `levelNumber` | number | رقم المستوى (1، 2، 3...) |
| `order` | number | ترتيب العرض في القائمة |
| `language` | string | لغة المحتوى |
| `schemaVersion` | string | يجب أن يكون "1.0" |
| `units` | array | مصفوفة الوحدات التعليمية |

## الوحدات (Units)

كل وحدة تحتوي على مجموعة دروس:

```json
{
  "id": "string (معرّف فريد للوحدة)",
  "title": "string (عنوان الوحدة)",
  "description": "string (وصف اختياري)",
  "order": "number (ترتيب الوحدة)",
  "lessons": "array (مصفوفة الدروس)"
}
```

## الدروس (Lessons)

```json
{
  "id": "string (معرّف فريد للدرس)",
  "title": "string (عنوان الدرس)",
  "objectives": "array of strings (الأهداف التعليمية)",
  "order": "number (ترتيب الدرس)",
  "contentBlocks": "array (محتوى الدرس)",
  "examples": "array (أمثلة - اختياري)",
  "exercises": "array (تمارين - اختياري)",
  "quiz": "array (أسئلة اختبار - اختياري)"
}
```

## أنواع محتوى الدرس (Content Blocks)

### paragraph - فقرة نصية
```json
{
  "type": "paragraph",
  "content": "نص الفقرة"
}
```

### heading - عنوان فرعي
```json
{
  "type": "heading",
  "content": "نص العنوان"
}
```

### list - قائمة
```json
{
  "type": "list",
  "items": ["العنصر الأول", "العنصر الثاني"]
}
```

### code - مثال برمجي
```json
{
  "type": "code",
  "language": "javascript",
  "content": "console.log('Hello');"
}
```

### note - ملاحظة
```json
{
  "type": "note",
  "content": "نص الملاحظة"
}
```

### warning - تنبيه
```json
{
  "type": "warning",
  "content": "نص التنبيه"
}
```

### image - صورة (للاستخدام المستقبلي)
```json
{
  "type": "image",
  "src": "path/to/image.png",
  "alt": "وصف الصورة"
}
```

## التمارين (Exercises)

```json
{
  "id": "string (معرّف فريد)",
  "title": "string (عنوان التمرين)",
  "description": "string (وصف التمرين)",
  "requirement": "string (المطلوب من الطالب)",
  "hint": "string (تلميح - اختياري)",
  "solution": "string (الحل النموذجي - اختياري)"
}
```

## الاختبارات (Quiz)

```json
{
  "id": "string (معرّف فريد للسؤال)",
  "question": "string (نص السؤال)",
  "options": "array of strings (خيارات الإجابة - خياران على الأقل)",
  "correctAnswer": "number (فهرس الإجابة الصحيحة - يبدأ من 0)",
  "explanation": "string (تفسير الإجابة)",
  "points": "number (درجة السؤال)"
}
```

## قواعد التحقق

عند استيراد ملف JSON، تتحقق المنصة من:

1. صحة بنية JSON
2. وجود جميع الحقول المطلوبة
3. تطابق `schemaVersion` مع الإصدارات المدعومة
4. صحة أنواع البيانات
5. وجود وحدات ودروس بمعرّفات فريدة
6. صحة بنية الاختبارات (خيارات، إجابة صحيحة)

## ملاحظات مهمة

- كل ملف JSON مستقل ويحتوي كل المحتوى المطلوب
- لا تعتمد على ملفات خارجية
- لا يتم تنفيذ أي JavaScript من ملفات المناهج
- يتم التعامل مع المحتوى كنص آمن فقط
- يمكن تحديث مستوى موجود دون فقدان التقدم (بناءً على معرّف الدرس)
- المعرّفات (`id`) يجب أن تكون فريدة داخل المستوى
