/**
 * Service Layer - Core business logic
 * All API calls and database operations should go through services
 */

import { ApplicationError, ErrorCode, Logger } from '@/lib/errors';
import { supabase } from '@/integrations/supabase/client';
import type {
  User,
  Recipient,
  Letter,
  LetterReply,
  SecurityQuestion,
  SecurityLogEntry,
} from '@/types';

/**
 * Auth Service - Handle authentication and user management
 */
export class AuthService {
  static async getCurrentUser(): Promise<User | null> {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) return null;

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*, security_questions(*)')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;
      return data as User;
    } catch (error) {
      Logger.error(error);
      return null;
    }
  }

  static async signUp(email: string, password: string): Promise<{ user: User; session: any }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw new ApplicationError(
          ErrorCode.AUTH_INVALID_CREDENTIALS,
          error.message,
          'فشل التسجيل. تحقق من بيانات الدخول'
        );
      }

      if (!data.user) throw new Error('No user returned from signup');

      // Create user record in database
      const { data: userData, error: createError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
        })
        .select()
        .single();

      if (createError) throw createError;

      return {
        user: userData as User,
        session: data.session,
      };
    } catch (error) {
      Logger.error(error);
      throw error;
    }
  }

  static async signIn(email: string, password: string): Promise<{ user: User; session: any }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new ApplicationError(
          ErrorCode.AUTH_INVALID_CREDENTIALS,
          error.message,
          'بيانات الدخول غير صحيحة'
        );
      }

      const user = await this.getCurrentUser();
      if (!user) throw new Error('Failed to fetch user data');

      return {
        user,
        session: data.session,
      };
    } catch (error) {
      Logger.error(error);
      throw error;
    }
  }

  static async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      Logger.error(error);
      throw error;
    }
  }

  static async updateSecurityQuestions(
    userId: string,
    questions: Array<{ question: string; answer: string }>
  ): Promise<SecurityQuestion[]> {
    try {
      // Delete old questions
      await supabase.from('security_questions').delete().eq('user_id', userId);

      // Insert new questions
      const { data, error } = await supabase
        .from('security_questions')
        .insert(
          questions.map((q) => ({
            user_id: userId,
            question: q.question,
            answer_hash: btoa(q.answer.toLowerCase()), // Simple hash - should use better method
          }))
        )
        .select();

      if (error) throw error;
      return data as SecurityQuestion[];
    } catch (error) {
      Logger.error(error);
      throw error;
    }
  }
}

/**
 * Recipient Service
 */
export class RecipientService {
  static async getRecipients(adminId: string, page: number = 1, limit: number = 20) {
    try {
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('recipients')
        .select('*', { count: 'exact' })
        .eq('admin_id', adminId)
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        data: (data || []) as Recipient[],
        total: count || 0,
        page,
        limit,
      };
    } catch (error) {
      Logger.error(error);
      throw error;
    }
  }

  static async getRecipient(id: string): Promise<Recipient> {
    try {
      const { data, error } = await supabase
        .from('recipients')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        throw new ApplicationError(
          ErrorCode.RECIPIENT_NOT_FOUND,
          'Recipient not found',
          'المستقبل غير موجود'
        );
      }

      return data as Recipient;
    } catch (error) {
      Logger.error(error);
      throw error;
    }
  }

  static async createRecipient(
    adminId: string,
    displayLabel: string,
    maxUses?: number | null,
    expiresAt?: string | null
  ): Promise<{ recipient: Recipient; token: string }> {
    try {
      const token = this.generateToken();

      const { data: tokenHash, error: hashError } = await supabase.rpc("hash_answer", {
        p_answer: token,
      });

      if (hashError) throw hashError;

      const { data, error } = await supabase
        .from('recipients')
        .insert({
          admin_id: adminId,
          name_encrypted: displayLabel,
          display_label: displayLabel,
          token_hash: (tokenHash as string) || '',
          max_uses: maxUses || null,
          expires_at: expiresAt || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      return { recipient: data as Recipient, token };
    } catch (error) {
      Logger.error(error);
      throw error;
    }
  }

  static async deleteRecipient(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('recipients').delete().eq('id', id);

      if (error) throw error;
    } catch (error) {
      Logger.error(error);
      throw error;
    }
  }

  static async regenerateRecipientToken(recipientId: string): Promise<string> {
    try {
      const { data: token, error } = await supabase.rpc('regenerate_recipient_token', {
        p_recipient_id: recipientId,
      });

      if (error) throw error;
      if (!token) throw new Error('Unable to generate a new token');

      return token as string;
    } catch (error) {
      Logger.error(error);
      throw error;
    }
  }

  private static generateToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 32);
  }
}

/**
 * Letter Service
 */
export class LetterService {
  static async getLetters(
    adminId: string,
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('letters')
        .select('*, recipients(*)', { count: 'exact' })
        .eq('admin_id', adminId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        data: (data || []) as Letter[],
        total: count || 0,
        page,
        limit,
      };
    } catch (error) {
      Logger.error(error);
      throw error;
    }
  }

  static async getLetter(id: string): Promise<Letter> {
    try {
      const { data, error } = await supabase
        .from('letters')
        .select('*, recipients(*)')
        .eq('id', id)
        .single();

      if (error || !data) {
        throw new ApplicationError(
          ErrorCode.LETTER_NOT_FOUND,
          'Letter not found',
          'الرسالة غير موجودة'
        );
      }

      return data as Letter;
    } catch (error) {
      Logger.error(error);
      throw error;
    }
  }

  static async createLetter(
    adminId: string,
    recipientId: string,
    title: string,
    content: string,
    securityQuestions: Array<{ question: string; answer: string }> = []
  ): Promise<Letter> {
    try {
      // Encrypt content through SQL function if configured
      let encryptedContent = content;
      const { data: encrypted, error: encryptError } = await supabase.rpc('encrypt_content', {
        p_content: content,
      });

      if (!encryptError && encrypted) {
        encryptedContent = encrypted as string;
      }

      const { data, error } = await supabase
        .from('letters')
        .insert({
          admin_id: adminId,
          recipient_id: recipientId,
          title,
          content_encrypted: encryptedContent,
          content_type: 'letter',
          is_read: false,
          is_active: true,
          order_index: 1,
        })
        .select()
        .single();

      if (error || !data) throw error || new Error('Failed to create letter');

      const letter = data as Letter;

      if (securityQuestions.length > 0) {
        for (let i = 0; i < securityQuestions.length; i++) {
          const q = securityQuestions[i];
          if (!q.question.trim() || !q.answer.trim()) continue;

          const { data: answerHash, error: hashError } = await supabase.rpc('hash_answer', {
            p_answer: q.answer.trim(),
          });

          if (hashError) throw hashError;

          const { error: qError } = await supabase.from('security_questions').insert({
            letter_id: letter.id,
            question_text: q.question.trim(),
            answer_hash: (answerHash as string) || '',
            question_order: i + 1,
          });

          if (qError) throw qError;
        }
      }

      // Log action
      await SecurityService.logAction(adminId, 'letter_created', { letter_id: letter.id });

      return letter;
    } catch (error) {
      Logger.error(error);
      throw error;
    }
  }

  static async revealLetter(
    letterId: string,
    adminId: string
  ): Promise<Letter> {
    try {
      const { data, error } = await supabase
        .from('letters')
        .update({
          is_revealed: true,
          revealed_at: new Date().toISOString(),
        })
        .eq('id', letterId)
        .select()
        .single();

      if (error) throw error;

      // Log action
      await SecurityService.logAction(adminId, 'letter_revealed', { letter_id: letterId });

      return data as Letter;
    } catch (error) {
      Logger.error(error);
      throw error;
    }
  }

  static async deleteLetter(letterId: string, adminId: string): Promise<void> {
    try {
      const { error } = await supabase.from('letters').delete().eq('id', letterId);

      if (error) throw error;

      // Log action
      await SecurityService.logAction(adminId, 'letter_deleted', { letter_id: letterId });
    } catch (error) {
      Logger.error(error);
      throw error;
    }
  }
}

/**
 * Letter Reply Service
 */
export class LetterReplyService {
  static async getReplies(letterId: string) {
    try {
      const { data, error } = await supabase
        .from('letter_replies')
        .select('*')
        .eq('letter_id', letterId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []) as LetterReply[];
    } catch (error) {
      Logger.error(error);
      throw error;
    }
  }

  static async createReply(
    letterId: string,
    recipientId: string,
    content: string
  ): Promise<LetterReply> {
    try {
      const { data, error } = await supabase
        .from('letter_replies')
        .insert({
          letter_id: letterId,
          recipient_id: recipientId,
          content,
          is_draft: false,
        })
        .select()
        .single();

      if (error) throw error;

      return data as LetterReply;
    } catch (error) {
      Logger.error(error);
      throw error;
    }
  }

  static async saveDraft(
    letterId: string,
    recipientId: string,
    content: string,
    draftId?: string
  ): Promise<LetterReply> {
    try {
      if (draftId) {
        // Update existing draft
        const { data, error } = await supabase
          .from('letter_replies')
          .update({ content })
          .eq('id', draftId)
          .select()
          .single();

        if (error) throw error;
        return data as LetterReply;
      } else {
        // Create new draft
        const { data, error } = await supabase
          .from('letter_replies')
          .insert({
            letter_id: letterId,
            recipient_id: recipientId,
            content,
            is_draft: true,
          })
          .select()
          .single();

        if (error) throw error;
        return data as LetterReply;
      }
    } catch (error) {
      Logger.error(error);
      throw error;
    }
  }
}

/**
 * Security Service
 */
export class SecurityService {
  static async logAction(
    userId: string,
    action: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      await supabase.from('security_logs').insert({
        user_id: userId,
        action,
        details: details || {},
        user_agent: navigator.userAgent,
        ip_address: null, // Get from backend
      });
    } catch (error) {
      Logger.error(error);
      // Don't throw - logging failures shouldn't break the app
    }
  }

  static async getSecurityLogs(userId: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('security_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []) as SecurityLogEntry[];
    } catch (error) {
      Logger.error(error);
      return [];
    }
  }

  static async verifySecurityAnswers(
    recipientId: string,
    answers: Array<{ questionId: string; answer: string }>
  ): Promise<boolean> {
    try {
      const { data: recipient, error: recipientError } = await supabase
        .from('recipients')
        .select('*')
        .eq('id', recipientId)
        .single();

      if (recipientError || !recipient) {
        throw new ApplicationError(
          ErrorCode.RECIPIENT_NOT_FOUND,
          'Recipient not found',
          'المستقبل غير موجود'
        );
      }

      const { data: questions, error: questionsError } = await supabase
        .from('security_questions')
        .select('*')
        .in(
          'id',
          answers.map((a) => a.questionId)
        );

      if (questionsError) throw questionsError;

      // Verify answers
      for (const answer of answers) {
        const question = questions?.find((q) => q.id === answer.questionId);
        if (!question) {
          throw new ApplicationError(
            ErrorCode.VERIFICATION_FAILED,
            'Question not found',
            'السؤال غير موجود'
          );
        }

        const answerHash = btoa(answer.answer.toLowerCase());
        if (answerHash !== question.answer_hash) {
          throw new ApplicationError(
            ErrorCode.VERIFICATION_FAILED,
            'Answer is incorrect',
            'الإجابة غير صحيحة'
          );
        }
      }

      return true;
    } catch (error) {
      Logger.error(error);
      throw error;
    }
  }
}

export { supabase };
