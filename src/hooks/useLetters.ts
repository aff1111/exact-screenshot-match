import { useState, useEffect, useCallback } from 'react';
import { RecipientService, LetterService } from '@/services/api';

interface SendPayload {
  recipientId: string;
  title: string;
  content: string;
}

export function useLetters(adminId?: string | null) {
  const [recipients, setRecipients] = useState<any[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecipients = useCallback(async () => {
    if (!adminId) return;
    setIsLoadingRecipients(true);
    try {
      const res = await RecipientService.getRecipients(adminId, 1, 200);
      setRecipients(res.data || []);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoadingRecipients(false);
    }
  }, [adminId]);

  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  const sendLetter = useCallback(
    async (payload: SendPayload) => {
      if (!adminId) throw new Error('adminId is required to send letters');
      setIsSending(true);
      try {
        const letter = await LetterService.createLetter(
          adminId,
          payload.recipientId,
          payload.title,
          payload.content
        );
        // refresh recipients/letters if needed
        await fetchRecipients();
        return letter;
      } finally {
        setIsSending(false);
      }
    },
    [adminId, fetchRecipients]
  );

  return {
    recipients,
    isLoadingRecipients,
    isSending,
    error,
    fetchRecipients,
    sendLetter,
  } as const;
}
