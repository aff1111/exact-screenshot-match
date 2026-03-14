-- Reconciliation Migration: Tracking Fixes & Replies Helpers

-- 1. Fix verify_token to track visits
CREATE OR REPLACE FUNCTION public.verify_token(raw_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_recipient_id uuid;
BEGIN
    PERFORM pg_sleep(random() * 0.2);
    
    SELECT id INTO v_recipient_id
    FROM public.recipients
    WHERE token_hash = crypt(raw_token, token_hash)
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND (max_uses IS NULL OR use_count < max_uses);
    
    IF v_recipient_id IS NOT NULL THEN
        UPDATE public.recipients 
        SET use_count = COALESCE(use_count, 0) + 1 
        WHERE id = v_recipient_id;
    END IF;
    
    RETURN v_recipient_id;
END;
$$;

-- 2. Add function to read decrypted replies
CREATE OR REPLACE FUNCTION public.get_decrypted_replies(p_admin_id uuid)
RETURNS TABLE (
    id uuid,
    letter_id uuid,
    letter_title text,
    recipient_name text,
    content text,
    sender_type text,
    is_read_by_admin boolean,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_encryption_key text;
BEGIN
    v_encryption_key := current_setting('app.settings.encryption_key', true);
    
    RETURN QUERY
    SELECT 
        r.id,
        r.letter_id,
        l.title as letter_title,
        rec.display_label as recipient_name,
        CASE 
            WHEN v_encryption_key IS NOT NULL THEN pgp_sym_decrypt(r.content_encrypted::bytea, v_encryption_key)
            ELSE r.content_encrypted
        END as content,
        r.sender_type,
        r.is_read_by_admin,
        r.created_at
    FROM public.replies r
    JOIN public.letters l ON r.letter_id = l.id
    JOIN public.recipients rec ON l.recipient_id = rec.id
    WHERE l.admin_id = p_admin_id
    ORDER BY r.created_at DESC;
END;
$$;

-- 3. Add helper to mark reply as read
CREATE OR REPLACE FUNCTION public.mark_reply_read(p_reply_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    UPDATE public.replies
    SET is_read_by_admin = true
    WHERE id = p_reply_id;
END;
$$;
