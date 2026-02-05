# codespher - موقع تعريفي

موقع تعريفي لشركة codespher المتخصصة في تطوير المواقع والتطبيقات والحلول الرقمية.

## المميزات

- **صفحة رئيسية** مع عرض الخدمات والإحصائيات
- **خدمات** تفصيلية (تطوير مواقع، تطبيقات، أنظمة، تصميم)
- **معرض مشاريع** مع معاينة وتفاصيل
- **دردشة AI** لاستقبال طلبات العملاء وتوجيههم
- **لوحة تحكم** لإدارة المشاريع وطلبات AI
- **تكامل Firebase** (Analytics)

## التقنيات

- HTML5, CSS3, JavaScript
- LocalStorage لتخزين المشاريع والطلبات
- Firebase (Analytics)

## التشغيل محلياً

1. استنساخ المستودع:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
   cd YOUR_REPO
   ```

2. افتح `index.html` في المتصفح أو استخدم خادم محلي:
   ```bash
   # باستخدام Python
   python -m http.server 8000

   # أو باستخدام npx
   npx serve .
   ```

3. افتح `http://localhost:8000` في المتصفح.

## هيكل المشروع

```
├── index.html          # الصفحة الرئيسية
├── services.html       # الخدمات
├── projects.html       # المشاريع
├── plans.html          # الخطط
├── chat.html           # مراسلة AI
├── dashboard.html      # لوحة التحكم
├── assets/
│   ├── css/
│   └── js/
└── projects/           # مشاريع مرفوعة (ملفات محلية)
```

## الإعدادات

- **Firebase**: عدّل `assets/js/firebase-init.js` بإعدادات مشروعك.
- **Firestore** (لتخزين المشاريع بين المتصفحات والأجهزة):
  1. افتح [Firebase Console](https://console.firebase.google.com) → مشروعك
  2. من القائمة: Build → Firestore Database → Create database
  3. اختر وضع التطوير (للاختبار) أو الإنتاج وحدد قواعد الأمان
  4. المجموعة `projects` تُنشأ تلقائياً عند إضافة أول مشروع
- **Firebase Storage** (لتخزين ملفات المشاريع المرفوعة):
  1. من القائمة: Build → Storage → Get started
  2. اختر قواعد الأمان (للاختبار: allow read, write)
  3. الملفات تُخزن في المسار `project-files/{projectId}/{fileName}`
- **API Key (OpenAI)**: اختياري – يُضبط من لوحة التحكم → الإعدادات لتفعيل الدردشة الذكية.

## الترخيص

جميع الحقوق محفوظة © codespher
