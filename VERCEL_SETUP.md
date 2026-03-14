# إعدادات Vercel

## ✅ خطوات التوافق مع Vercel

### 1️⃣ إضافة المتغيرات البيئية إلى Vercel

1. اذهب إلى [dashboard.vercel.com](https://dashboard.vercel.com)
2. اختر المشروع: `exact-screenshot-match`
3. اذهب إلى **Settings** → **Environment Variables**
4. أضف المتغيرات التالية:

```bash
VITE_SUPABASE_URL = https://ribugqwbqdvihnifnmwp.supabase.co
VITE_SUPABASE_ANON_KEY = sb_publishable_g3QbNEOeJrzHLQ9wj67ukw_5zRtqC92
VITE_SUPABASE_PROJECT_ID = ribugqwbqdvihnifnmwp
```

#### ⚠️ تحذير أمان:
- **لا تشارك المفاتيح الخاصة** (Secret Keys) مع أحد
- استخدم فقط **Publishable/Public Keys** في الكود الأمامي
- المفتاح `sb_publishable_g3...` آمن للنشر

### 2️⃣ تحديث Browserslist

تم إنشاء `.browserslistrc`:
```
last 2 versions
> 1%
not dead
not op_mini all
```

### 3️⃣ إصلاح تحذيرات npm

تم إضافة script لتحديث Browserslist:
```bash
npm run browserslist-update
```

### 4️⃣ إعدادات Build

ملف `vercel.json` تم تحديثه من:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "env": {
    "VITE_SUPABASE_URL": "@vite_supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@vite_supabase_anon_key"
  }
}
```

---

## 🚀 الخطوات النهائية:

### في الكمبيوتر المحلي:
```bash
npm run browserslist-update
npm run build
git add .
git commit -m "fix: Vercel environment variables and build configuration"
git push origin main
```

### على Vercel:
1. Deploy سيتم تلقائياً عند push
2. تحقق من **Vercel Dashboard** → **Deployments**
3. يجب أن تنجح الآن ✅

---

## 📊 ملخص التغييرات:

| الملف | التغيير |
|------|--------|
| `vercel.json` | ✅ أضيفت متغيرات البيئة والإعدادات |
| `.browserslistrc` | ✅ تم إنشاؤه |
| `package.json` | ✅ أضيف script liveness-update |
| `.gitignore` | ✅ تحديث الملفات المستثناة |

---

## 🔧 Troubleshooting:

### إذا استمرت المشاكل:

1. **امسح Build Cache في Vercel:**
   - Settings → Git → Ignore Build Cache
   - أعد Deployment

2. **تحقق من المتغيرات:**
   ```bash
   echo $VITE_SUPABASE_URL
   ```

3. **نظف node_modules محلياً:**
   ```bash
   rm -r node_modules package-lock.json
   npm install
   npm run build
   ```

4. **تحقق من أن .env.local لا يتم رفع على GitHub:**
   ```bash
   git check-ignore .env.local
   ```

---

## 📝 نصائح إضافية:

- ✅ استخدم Vercel Analytics لمراقبة الأداء
- ✅ استخدم Vercel CLI للـ testing محلياً:
  ```bash
  npm i -g vercel
  vercel dev
  ```
- ✅ راقب Build Logs يومياً
- ✅ استخدم Preview URLs للـ testing قبل الـ production
