# Memory: index.md

تطبيق "مكتوب" - رسائل ملكية مشفرة بثيم مخطوطات عربية

## التصميم
- ألوان: رق #F5F0E8, ذهبي #C9A84C, عنابي #6B0F1A, بني #8B5E3C
- خطوط: Amiri (عربي), Cinzel (إنجليزي), Cinzel Decorative (عناوين)
- حركات: Framer Motion (scroll unrolling, wax seal break, ink writing)
- جميع الألوان معرّفة كـ CSS variables في index.css بصيغة HSL
- ختم الشمع عليه كلمة "لك" بالذهبي

## البنية
- المشرف: أحمد (ahmedromu4@gmail.com) - مستخدم واحد فقط
- المستلمون: يصلون عبر روابط مشفرة /s/[token]
- الأمان: honeypot, canary fields, rate limiting, pgcrypto encryption, auto IP blocking
- قاعدة البيانات: 10 جداول (+ blocked_ips) + 11 دالة SQL
- Edge Functions: verify-recipient, answer-questions, read-letter, submit-reply, admin-send-letter, admin-reply, honeypot
- نقاط وهمية: /api/users, /api/admin/export, /api/backup → honeypot

## القواعد
- لا localStorage للمصادقة - HttpOnly cookies فقط
- RLS مفعّلة على جميع الجداول
- الزوار: لا وصول مباشر للجداول - فقط عبر Edge Functions
- أعمدة Canary: canary_field_x9, canary_field_z3, canary_field_q7, canary_field_m2
- robots.txt: Disallow all
- ENCRYPTION_KEY secret مطلوب للتشفير
- حظر IP تلقائي: 10+ أحداث عالية/حرجة في 5 دقائق = حظر 24 ساعة
- التسجيل معطّل (disable_signup = true)
- أسئلة أمان أحمد: bcrypt مع lower(trim())
