/**
 * Supabase Connection Test
 * يختبر الاتصال بـ Supabase والتحقق من البيانات
 */

import { supabase } from '@/integrations/supabase/client';
import { Logger } from '@/lib/errors';

/**
 * اختبار الاتصال الأساسي بـ Supabase
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    Logger.info('🔍 جاري اختبار الاتصال بـ Supabase...');

    // اختبار 1: الحصول على جلسة المستخدم الحالية
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      Logger.warn('⚠️ خطأ في الحصول على الجلسة', {
        error: sessionError.message,
      });
    }

    // اختبار 2: عمل استعلام بسيط على جدول موجود
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      Logger.error('❌ فشل الاتصال بجدول users', {
        error: countError.message,
      });
      return false;
    }

    // اختبار 3: الحصول على معلومات الحساب
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError && userError.message !== 'Auth session missing!') {
      Logger.warn('⚠️ تحذير:', userError.message);
    }

    // النتائج النهائية
    Logger.info('✅ الاتصال بـ Supabase نجح!', {
      connectedTables: ['users'],
      hasSession: !!session,
      recordCount: count,
      isAuthenticated: !!user,
    });

    return true;
  } catch (error) {
    Logger.error('❌ فشل اختبار الاتصال:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * الحصول على معلومات الاتصال (للـ debugging)
 */
export async function getSupabaseInfo() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return {
      isConnected: true,
      url: import.meta.env.VITE_SUPABASE_URL,
      hasApiKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      isAuthenticated: !!user,
      hasSession: !!session,
      user: user
        ? {
            id: user.id,
            email: user.email,
          }
        : null,
    };
  } catch (error) {
    return {
      isConnected: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * اختبار العملية كاملة
 * يمكن استدعاؤها عند بدء التطبيق
 */
export async function initializeSupabase(): Promise<void> {
  Logger.info('🚀 جاري تهيئة Supabase...');

  const isConnected = await testSupabaseConnection();

  if (isConnected) {
    const info = await getSupabaseInfo();
    Logger.info('📊 معلومات الاتصال:', info);
  } else {
    throw new Error('فشل الاتصال بـ Supabase');
  }
}
