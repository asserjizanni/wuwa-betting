# WuWa Betting — دليل الإعداد والتشغيل

منصة توقعات وتحديات **Wuthering Waves** تفاعلية، تتيح للاعبين المراهنة على الشخصيات بنقاط افتراضية.

---

## المتطلبات الأساسية

- Node.js الإصدار 18 أو أحدث
- npm الإصدار 9 أو أحدث  
- حساب Supabase (مجاني)

---

## خطوات الإعداد الكاملة

### 1. تثبيت المكتبات

```bash
cd wuwa-betting
npm install
```

### 2. إعداد Supabase

#### أ. إنشاء مشروع Supabase جديد

1. اذهب إلى [supabase.com](https://supabase.com)
2. سجّل دخولك وأنشئ مشروعاً جديداً
3. احتفظ بـ **Project URL** و **anon key** من Settings > API

#### ب. إنشاء قاعدة البيانات

افتح **SQL Editor** في لوحة Supabase ونفّذ الملفات بالترتيب:

```sql
-- أولاً: ملف المخطط الكامل
-- انسخ محتوى الملف: supabase/schema.sql وشغّله
```

```sql
-- ثانياً: إعداد التخزين
-- انسخ محتوى الملف: supabase/storage.sql وشغّله
```

#### ج. إعداد حاويات التخزين (Storage Buckets)

في لوحة Supabase:
1. اذهب إلى **Storage**
2. أنشئ حاوية: `character-images` (Public: ✅)
3. أنشئ حاوية: `event-covers` (Public: ✅)

### 3. إعداد متغيرات البيئة

```bash
cp .env.example .env
```

افتح `.env` وضع قيم Supabase الحقيقية:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. إنشاء حساب المدير الأول

#### أ. إنشاء مستخدم في Supabase Auth

1. في لوحة Supabase، اذهب إلى **Authentication > Users**
2. اضغط **"Add user"** وأدخل البريد الإلكتروني وكلمة المرور
3. احتفظ بـ **User ID** (UUID)

#### ب. تسجيل المدير في قاعدة البيانات

في **SQL Editor** نفّذ:

```sql
INSERT INTO admins (auth_id, username, role, is_active)
VALUES (
  'YOUR-AUTH-USER-UUID-HERE',  -- UUID من الخطوة السابقة
  'admin',                     -- اسم المدير
  'super_admin',
  true
);
```

#### ج. تسجيل الدخول للإدارة

اذهب إلى `http://localhost:5173/admin` وسجّل دخولك بنفس بيانات Supabase Auth.

### 5. تشغيل المشروع محلياً

```bash
npm run dev
```

الموقع سيعمل على: **http://localhost:5173**  
لوحة الإدارة: **http://localhost:5173/admin**

---

## بناء نسخة الإنتاج

```bash
npm run build
```

الملفات ستكون في مجلد `dist/`.

---

## النشر على Netlify

### طريقة 1: عبر واجهة Netlify

1. اذهب إلى [app.netlify.com](https://app.netlify.com)
2. اضغط **"Add new site" > "Import an existing project"**
3. اختر مستودعك من GitHub/GitLab
4. الإعدادات:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. في **Environment variables** أضف:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### طريقة 2: عبر Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

---

## رفع صور الشخصيات الموجودة (مجلد characters)

يمكن رفع صور الشخصيات من مجلد `characters/` إلى Supabase Storage:

```bash
# طريقة يدوية: من لوحة الإدارة
# 1. اذهب إلى /admin/characters
# 2. أضف كل شخصية واضغط "رفع صورة"
# 3. اختر الصورة من مجلد characters/
```

أو استخدم **Supabase CLI** لرفع جماعي:

```bash
# تثبيت Supabase CLI
npm install -g supabase

# رفع الصور (بعد تكوين المشروع)
supabase storage cp --recursive ./characters/* ss://character-images/
```

---

## النسخ الاحتياطي

### تصدير قاعدة البيانات

```bash
# استخدام Supabase CLI
supabase db dump -f backup.sql
```

### استعادة قاعدة البيانات

```bash
psql -h db.xxxx.supabase.co -U postgres -f backup.sql
```

---

## هيكل المشروع

```
wuwa-betting/
├── src/
│   ├── components/
│   │   ├── admin/          # مكونات لوحة الإدارة
│   │   └── shared/         # مكونات مشتركة
│   ├── hooks/              # React hooks
│   ├── lib/                # Supabase client + utilities
│   ├── pages/              # صفحات الجمهور
│   ├── store/              # Zustand state management
│   └── types/              # TypeScript types
├── supabase/
│   ├── schema.sql          # مخطط قاعدة البيانات الكامل
│   └── storage.sql         # سياسات التخزين
├── characters/             # صور الشخصيات (لرفعها يدوياً)
└── public/                 # الملفات الثابتة
```

---

## الميزات المنفَّذة

| الميزة | الحالة |
|--------|--------|
| تسجيل اللاعبين مع رمز استرداد | ✅ |
| نظام نقاط ابتدائية (500 نقطة) | ✅ |
| إدارة الشخصيات مع رفع الصور | ✅ |
| إنشاء الإيفنتات والتحكم في الحالة | ✅ |
| نظام الرهانات مع منع التكرار | ✅ |
| السماح بالرصيد السالب | ✅ |
| تسوية تلقائية في قاعدة البيانات | ✅ |
| حماية من تكرار التوزيع | ✅ |
| استرداد الرهانات عند الإلغاء | ✅ |
| لوحة المتصدرين | ✅ |
| تحديثات مباشرة (Realtime) | ✅ |
| لوحة إدارة كاملة | ✅ |
| RLS على جميع الجداول | ✅ |
| سجل المعاملات الكامل | ✅ |
| سجل العمليات الإدارية | ✅ |
| دعم RTL كامل | ✅ |
| تصميم متجاوب | ✅ |
| مؤثرات احتفالية عند الفوز | ✅ |

---

## الأمان

- ✅ RLS مفعّل على جميع الجداول
- ✅ عمليات التسوية تتم في PostgreSQL (وليس في المتصفح)
- ✅ لا يمكن للمستخدمين تعديل أرصدتهم مباشرة
- ✅ حماية من تكرار التسوية (idempotency)
- ✅ رموز الجلسة لا تظهر في الصفحات العامة
- ✅ مفاتيح service_role غير مُدرجة في الواجهة الأمامية
- ✅ رفع الصور مقيّد بالمديرين فقط

---

## ملاحظات مهمة

1. **لا تضع `.env` في GitHub** — المخفي في `.gitignore` تلقائياً
2. **رمز الاسترداد** — يجب أن يحتفظ به اللاعب؛ لا يمكن استعادته إذا ضاع
3. **صور الشخصيات** — يجب رفعها يدوياً من لوحة الإدارة
4. **حساب المدير الأول** — يُنشأ عبر SQL مباشرة في Supabase، وليس عبر واجهة الموقع
