
-- encrypt_content function for edge functions
CREATE OR REPLACE FUNCTION public.encrypt_content(p_content text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_encryption_key text;
BEGIN
    v_encryption_key := current_setting('app.settings.encryption_key', true);
    IF v_encryption_key IS NULL THEN
        RETURN p_content;
    END IF;
    RETURN pgp_sym_encrypt(p_content, v_encryption_key);
END;
$$;

-- hash_answer function for edge functions
CREATE OR REPLACE FUNCTION public.hash_answer(p_answer text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    RETURN crypt(p_answer, gen_salt('bf', 12));
END;
$$;
