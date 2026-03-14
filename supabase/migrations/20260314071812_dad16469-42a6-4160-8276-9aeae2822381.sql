CREATE OR REPLACE FUNCTION public.hash_answer(p_answer text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
    RETURN extensions.crypt(lower(trim(p_answer)), extensions.gen_salt('bf', 12));
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_token(raw_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    v_recipient_id uuid;
BEGIN
    PERFORM pg_sleep(random() * 0.2);

    SELECT id INTO v_recipient_id
    FROM public.recipients
    WHERE token_hash = extensions.crypt(raw_token, token_hash)
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND (max_uses IS NULL OR use_count < max_uses);

    RETURN v_recipient_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_security_answer(p_letter_id uuid, p_question_id uuid, p_answer text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    v_stored_hash text;
BEGIN
    SELECT answer_hash INTO v_stored_hash
    FROM public.security_questions
    WHERE id = p_question_id AND letter_id = p_letter_id;

    IF v_stored_hash IS NULL THEN
        RETURN false;
    END IF;

    RETURN (v_stored_hash = extensions.crypt(lower(trim(p_answer)), v_stored_hash));
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrypt_letter_content(p_letter_id uuid, p_session_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    v_content text;
    v_session_valid boolean;
    v_encryption_key text;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM public.letter_access_sessions
        WHERE letter_id = p_letter_id
          AND session_token_hash = extensions.crypt(p_session_token, session_token_hash)
          AND expires_at > now()
          AND (cooldown_until IS NULL OR cooldown_until < now())
    ) INTO v_session_valid;

    IF NOT v_session_valid THEN
        RETURN NULL;
    END IF;

    v_encryption_key := current_setting('app.settings.encryption_key', true);

    IF v_encryption_key IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT extensions.pgp_sym_decrypt(content_encrypted::bytea, v_encryption_key)
    INTO v_content
    FROM public.letters
    WHERE id = p_letter_id AND is_active = true;

    UPDATE public.letters
    SET is_read = true, read_at = COALESCE(read_at, now())
    WHERE id = p_letter_id;

    RETURN v_content;
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrypt_recipient_name(p_recipient_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    v_name text;
    v_encryption_key text;
BEGIN
    v_encryption_key := current_setting('app.settings.encryption_key', true);

    IF v_encryption_key IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT extensions.pgp_sym_decrypt(name_encrypted::bytea, v_encryption_key)
    INTO v_name
    FROM public.recipients
    WHERE id = p_recipient_id;

    RETURN v_name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.encrypt_content(p_content text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    v_encryption_key text;
BEGIN
    v_encryption_key := current_setting('app.settings.encryption_key', true);
    IF v_encryption_key IS NULL THEN
        RETURN p_content;
    END IF;
    RETURN extensions.pgp_sym_encrypt(p_content, v_encryption_key);
END;
$function$;