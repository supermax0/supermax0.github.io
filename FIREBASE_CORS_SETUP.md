# إعداد CORS لـ Firebase Storage

## المشكلة
عند محاولة جلب الملفات من Firebase Storage، قد تواجهك أخطاء CORS مثل:
```
Access to fetch at 'https://firebasestorage.googleapis.com/...' from origin 'https://supermax.space' 
has been blocked by CORS policy
```

## الحل: تكوين CORS في Firebase Storage

### الطريقة 1: استخدام gsutil (الأفضل)

1. **تثبيت Google Cloud SDK** (إذا لم يكن مثبتاً):
   - تحميل من: https://cloud.google.com/sdk/docs/install

2. **تسجيل الدخول**:
   ```bash
   gcloud auth login
   ```

3. **إنشاء ملف CORS configuration** (`cors.json`):
   ```json
   [
     {
       "origin": ["https://supermax.space", "https://supermax0.github.io", "http://localhost:8000"],
       "method": ["GET", "HEAD"],
       "maxAgeSeconds": 3600,
       "responseHeader": ["Content-Type"]
     }
   ]
   ```

4. **تطبيق إعدادات CORS**:
   ```bash
   gsutil cors set cors.json gs://supermax-8f827.firebasestorage.app
   ```

### الطريقة 2: استخدام Firebase Console

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. اختر مشروعك: `supermax-8f827`
3. اذهب إلى **Storage** > **Rules**
4. أضف قاعدة CORS في قسم Rules (لكن هذا لا يكفي، يجب استخدام gsutil)

### الطريقة 3: استخدام Firebase CLI

```bash
# تثبيت Firebase CLI
npm install -g firebase-tools

# تسجيل الدخول
firebase login

# إنشاء ملف cors.json (انظر الطريقة 1)

# تطبيق CORS
gsutil cors set cors.json gs://supermax-8f827.firebasestorage.app
```

## التحقق من الإعدادات

```bash
gsutil cors get gs://supermax-8f827.firebasestorage.app
```

## ملاحظات مهمة

- تأكد من إضافة جميع النطاقات التي ستستخدم الملفات (production, staging, localhost)
- `maxAgeSeconds` يحدد مدة تخزين إعدادات CORS في المتصفح
- بعد تطبيق الإعدادات، قد تحتاج إلى الانتظار بضع دقائق حتى تصبح فعالة

## بديل مؤقت

إذا لم تستطع تكوين CORS فوراً، يمكنك:
1. استخدام base64 encoding بدلاً من Firebase Storage URLs
2. رفع الملفات على خادم يدعم CORS
3. استخدام Firebase Storage SDK مع authentication (لكن هذا معقد أكثر)
