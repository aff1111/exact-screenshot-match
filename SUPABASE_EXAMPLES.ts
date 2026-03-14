/**
 * أمثلة عملية لاستخدام Supabase في المشروع
 * Copy & Paste ready examples
 */

// ======================================
// 1️⃣ Authentication (المصادقة)
// ======================================

import { AuthService } from '@/services/api';

// تسجيل مستخدم جديد
async function registerUser() {
  try {
    const { user, session } = await AuthService.signUp(
      'user@example.com',
      'Password123!'
    );
    console.log('✅ User registered:', user);
  } catch (error) {
    console.error('❌ Registration failed:', error);
  }
}

// تسجيل الدخول
async function loginUser() {
  try {
    const { user, session } = await AuthService.signIn(
      'user@example.com',
      'Password123!'
    );
    console.log('✅ Logged in:', user);
  } catch (error) {
    console.error('❌ Login failed:', error);
  }
}

// الحصول على المستخدم الحالي
async function getCurrentUser() {
  try {
    const user = await AuthService.getCurrentUser();
    if (user) {
      console.log('✅ Current user:', user.email);
    } else {
      console.log('⚠️ No user logged in');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// تسجيل الخروج
async function logoutUser() {
  try {
    await AuthService.signOut();
    console.log('✅ Logged out');
  } catch (error) {
    console.error('❌ Logout failed:', error);
  }
}

// ======================================
// 2️⃣ Recipients (المستقبلون)
// ======================================

import { RecipientService } from '@/services/api';

// الحصول على جميع المستقبلين
async function getMyRecipients() {
  try {
    const userId = 'user-id-here'; // Replace with actual user ID
    const result = await RecipientService.getRecipients(userId, 1, 20);
    console.log('✅ Recipients:', result.data);
    console.log(`📊 Total: ${result.total}`);
  } catch (error) {
    console.error('❌ Error fetching recipients:', error);
  }
}

// إضافة مستقبل جديد
async function addNewRecipient() {
  try {
    const adminId = 'admin-id-here'; // Replace with actual admin ID
    const recipient = await RecipientService.createRecipient(
      adminId,
      'recipient@example.com'
    );
    console.log('✅ Recipient created:', recipient);
  } catch (error) {
    console.error('❌ Error creating recipient:', error);
  }
}

// حذف مستقبل
async function deleteRecipient() {
  try {
    const recipientId = 'recipient-id-here';
    await RecipientService.deleteRecipient(recipientId);
    console.log('✅ Recipient deleted');
  } catch (error) {
    console.error('❌ Error deleting recipient:', error);
  }
}

// ======================================
// 3️⃣ Letters (الرسائل)
// ======================================

import { LetterService } from '@/services/api';

// الحصول على جميع الرسائل
async function getMyLetters() {
  try {
    const adminId = 'admin-id-here';
    const result = await LetterService.getLetters(adminId, 1, 20);
    console.log('✅ Letters:', result.data);
  } catch (error) {
    console.error('❌ Error fetching letters:', error);
  }
}

// كتابة رسالة جديدة
async function writeLetter() {
  try {
    const adminId = 'admin-id-here';
    const recipientId = 'recipient-id-here';

    const letter = await LetterService.createLetter(
      adminId,
      recipientId,
      'أهلاً وسهلاً',
      'محتوى الرسالة هنا...'
    );

    console.log('✅ Letter created:', letter.id);
  } catch (error) {
    console.error('❌ Error creating letter:', error);
  }
}

// الكشف عن رسالة (إرسالها)
async function revealLetter() {
  try {
    const letterId = 'letter-id-here';
    const adminId = 'admin-id-here';

    const letter = await LetterService.revealLetter(letterId, adminId);
    console.log('✅ Letter revealed at:', letter.revealed_at);
  } catch (error) {
    console.error('❌ Error revealing letter:', error);
  }
}

// ======================================
// 4️⃣ Letter Replies (الردود)
// ======================================

import { LetterReplyService } from '@/services/api';

// الحصول على الردود
async function getReplies() {
  try {
    const letterId = 'letter-id-here';
    const replies = await LetterReplyService.getReplies(letterId);
    console.log('✅ Replies:', replies);
  } catch (error) {
    console.error('❌ Error fetching replies:', error);
  }
}

// إضافة رد
async function addReply() {
  try {
    const letterId = 'letter-id-here';
    const recipientId = 'recipient-id-here';

    const reply = await LetterReplyService.createReply(
      letterId,
      recipientId,
      'شكراً على الرسالة الجميلة!'
    );

    console.log('✅ Reply created:', reply.id);
  } catch (error) {
    console.error('❌ Error creating reply:', error);
  }
}

// حفظ مسودة رد
async function saveDraft() {
  try {
    const letterId = 'letter-id-here';
    const recipientId = 'recipient-id-here';

    const draft = await LetterReplyService.saveDraft(
      letterId,
      recipientId,
      'هذه مسودة الرد...'
    );

    console.log('✅ Draft saved:', draft.id);
  } catch (error) {
    console.error('❌ Error saving draft:', error);
  }
}

// ======================================
// 5️⃣ Security & Logging
// ======================================

import { SecurityService } from '@/services/api';

// تسجيل إجراء أمني
async function logSecurityAction() {
  try {
    const userId = 'user-id-here';
    await SecurityService.logAction(userId, 'login', {
      timestamp: new Date(),
      ip: '192.168.1.1',
    });
    console.log('✅ Action logged');
  } catch (error) {
    console.error('❌ Error logging action:', error);
  }
}

// الحصول على سجل الأمان
async function getSecurityLog() {
  try {
    const userId = 'user-id-here';
    const logs = await SecurityService.getSecurityLogs(userId, 50);
    console.log('✅ Security logs:', logs);
  } catch (error) {
    console.error('❌ Error fetching logs:', error);
  }
}

// التحقق من إجابات الأسئلة الأمنية
async function verifySecurityAnswers() {
  try {
    const recipientId = 'recipient-id-here';
    const answers = [
      { questionId: 'q1', answer: 'الإجابة الأولى' },
      { questionId: 'q2', answer: 'الإجابة الثانية' },
    ];

    const isCorrect = await SecurityService.verifySecurityAnswers(
      recipientId,
      answers
    );

    if (isCorrect) {
      console.log('✅ Security verification passed');
    } else {
      console.log('❌ Security verification failed');
    }
  } catch (error) {
    console.error('❌ Error verifying answers:', error);
  }
}

// ======================================
// 6️⃣ استخدام مباشر (عند الضرورة)
// ======================================

import { supabase } from '@/integrations/supabase/client';

// لا يفضل لكن يمكن استخدامه عند الضرورة
async function directSupabaseCall() {
  try {
    // اختبار الاتصال
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Query error:', error);
      return;
    }

    console.log('✅ Data:', data);
  } catch (error) {
    console.error('❌ Connection error:', error);
  }
}

// ======================================
// 7️⃣ في Hooks (الاستخدام داخل Components)
// ======================================

import { useAsync } from '@/hooks/useApp';
import React from 'react';

function MyComponent() {
  // استخدام useAsync للعمليات غير المتزامنة
  const {
    data: recipients,
    isLoading,
    error,
    refetch,
  } = useAsync(
    async () => {
      const userId = 'user-id';
      const result = await RecipientService.getRecipients(userId);
      return result.data;
    },
    true // immediate execution
  );

  if (isLoading) return <div>جاري التحميل...</div>;
  if (error) return <div>حدث خطأ: {error.message}</div>;

  return (
    <div>
      <ul>
        {recipients?.map((r) => (
          <li key={r.id}>{r.email}</li>
        ))}
      </ul>
      <button onClick={refetch}>تحديث</button>
    </div>
  );
}

// ======================================
// 📝 تصدير جميع الأمثلة
// ======================================

export {
  // Auth
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  // Recipients
  getMyRecipients,
  addNewRecipient,
  deleteRecipient,
  // Letters
  getMyLetters,
  writeLetter,
  revealLetter,
  // Replies
  getReplies,
  addReply,
  saveDraft,
  // Security
  logSecurityAction,
  getSecurityLog,
  verifySecurityAnswers,
  // Direct calls
  directSupabaseCall,
};
