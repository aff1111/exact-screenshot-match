
-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ========================================
-- Table 1: admin_users
-- ========================================
CREATE TABLE public.admin_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    security_question_1 text NOT NULL,
    security_answer_1_hash text NOT NULL,
    security_question_2 text NOT NULL,
    security_answer_2_hash text NOT NULL,
    failed_login_attempts integer DEFAULT 0,
    locked_until timestamptz,
    canary_field_x9 text DEFAULT 'SYSTEM_RESERVED',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin reads own row" ON public.admin_users
    FOR SELECT TO authenticated
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Admin updates own row" ON public.admin_users
    FOR UPDATE TO authenticated
    USING (auth.uid() = auth_user_id);

-- ========================================
-- Table 2: admin_sessions
-- ========================================
CREATE TABLE public.admin_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid REFERENCES public.admin_users(id) ON DELETE CASCADE,
    session_token_hash text UNIQUE NOT NULL,
    ip_address text,
    user_agent text,
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz NOT NULL,
    last_active_at timestamptz DEFAULT now(),
    is_revoked boolean DEFAULT false
);

ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin reads own sessions" ON public.admin_sessions
    FOR SELECT TO authenticated
    USING (admin_id IN (SELECT id FROM public.admin_users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admin revokes own sessions" ON public.admin_sessions
    FOR UPDATE TO authenticated
    USING (admin_id IN (SELECT id FROM public.admin_users WHERE auth_user_id = auth.uid()));

-- ========================================
-- Table 3: recipients
-- ========================================
CREATE TABLE public.recipients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid REFERENCES public.admin_users(id) ON DELETE CASCADE NOT NULL,
    name_encrypted text NOT NULL,
    display_label text,
    token_hash text UNIQUE NOT NULL,
    max_uses integer DEFAULT NULL,
    use_count integer DEFAULT 0,
    expires_at timestamptz DEFAULT NULL,
    is_active boolean DEFAULT true,
    canary_field_z3 text DEFAULT 'INTERNAL_USE',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to recipients" ON public.recipients
    FOR ALL TO authenticated
    USING (admin_id IN (SELECT id FROM public.admin_users WHERE auth_user_id = auth.uid()));

-- ========================================
-- Table 4: letters
-- ========================================
CREATE TABLE public.letters (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id uuid REFERENCES public.recipients(id) ON DELETE CASCADE NOT NULL,
    admin_id uuid REFERENCES public.admin_users(id) ON DELETE CASCADE NOT NULL,
    content_encrypted text NOT NULL,
    content_type text CHECK (content_type IN ('letter', 'poetry')) DEFAULT 'letter',
    is_read boolean DEFAULT false,
    read_at timestamptz,
    is_active boolean DEFAULT true,
    order_index integer NOT NULL,
    canary_field_q7 text DEFAULT 'DO_NOT_ACCESS',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to letters" ON public.letters
    FOR ALL TO authenticated
    USING (admin_id IN (SELECT id FROM public.admin_users WHERE auth_user_id = auth.uid()));

-- ========================================
-- Table 5: security_questions
-- ========================================
CREATE TABLE public.security_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    letter_id uuid REFERENCES public.letters(id) ON DELETE CASCADE NOT NULL,
    question_text text NOT NULL,
    answer_hash text NOT NULL,
    question_order integer NOT NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.security_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to security_questions" ON public.security_questions
    FOR ALL TO authenticated
    USING (letter_id IN (
        SELECT l.id FROM public.letters l
        JOIN public.admin_users a ON l.admin_id = a.id
        WHERE a.auth_user_id = auth.uid()
    ));

-- ========================================
-- Table 6: replies
-- ========================================
CREATE TABLE public.replies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    letter_id uuid REFERENCES public.letters(id) ON DELETE CASCADE NOT NULL,
    content_encrypted text NOT NULL,
    sender_type text CHECK (sender_type IN ('recipient', 'admin')) NOT NULL,
    is_read_by_admin boolean DEFAULT false,
    canary_field_m2 text DEFAULT 'RESERVED',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin reads replies" ON public.replies
    FOR SELECT TO authenticated
    USING (letter_id IN (
        SELECT l.id FROM public.letters l
        JOIN public.admin_users a ON l.admin_id = a.id
        WHERE a.auth_user_id = auth.uid()
    ));

CREATE POLICY "Admin updates replies" ON public.replies
    FOR UPDATE TO authenticated
    USING (letter_id IN (
        SELECT l.id FROM public.letters l
        JOIN public.admin_users a ON l.admin_id = a.id
        WHERE a.auth_user_id = auth.uid()
    ));

CREATE POLICY "Admin inserts replies" ON public.replies
    FOR INSERT TO authenticated
    WITH CHECK (letter_id IN (
        SELECT l.id FROM public.letters l
        JOIN public.admin_users a ON l.admin_id = a.id
        WHERE a.auth_user_id = auth.uid()
    ));

-- ========================================
-- Table 7: security_events (append-only)
-- ========================================
CREATE TABLE public.security_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL,
    severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    ip_address text,
    user_agent text,
    token_hash_prefix text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin reads security events" ON public.security_events
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_users WHERE auth_user_id = auth.uid()));

-- ========================================
-- Table 8: letter_access_sessions
-- ========================================
CREATE TABLE public.letter_access_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    letter_id uuid REFERENCES public.letters(id) ON DELETE CASCADE NOT NULL,
    session_token_hash text NOT NULL,
    attempts_used integer DEFAULT 0,
    cooldown_until timestamptz,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.letter_access_sessions ENABLE ROW LEVEL SECURITY;

-- ========================================
-- Table 9: request_logs (rate limiting)
-- ========================================
CREATE TABLE public.request_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address text NOT NULL,
    endpoint text NOT NULL,
    token_hash_prefix text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.request_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- Security-definer Functions
-- ========================================

-- 1. verify_token
CREATE OR REPLACE FUNCTION public.verify_token(raw_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    
    RETURN v_recipient_id;
END;
$$;

-- 2. verify_security_answer
CREATE OR REPLACE FUNCTION public.verify_security_answer(
    p_letter_id uuid,
    p_question_id uuid,
    p_answer text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_stored_hash text;
BEGIN
    SELECT answer_hash INTO v_stored_hash
    FROM public.security_questions
    WHERE id = p_question_id AND letter_id = p_letter_id;
    
    IF v_stored_hash IS NULL THEN
        RETURN false;
    END IF;
    
    RETURN (v_stored_hash = crypt(lower(trim(p_answer)), v_stored_hash));
END;
$$;

-- 3. log_security_event
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_event_type text,
    p_severity text,
    p_ip text,
    p_user_agent text,
    p_token_prefix text DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.security_events (event_type, severity, ip_address, user_agent, token_hash_prefix, metadata)
    VALUES (p_event_type, p_severity, p_ip, p_user_agent, p_token_prefix, p_metadata);
END;
$$;

-- 4. check_rate_limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_ip text,
    p_endpoint text,
    p_max int,
    p_window_seconds int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count integer;
BEGIN
    SELECT count(*) INTO v_count
    FROM public.request_logs
    WHERE ip_address = p_ip
      AND endpoint = p_endpoint
      AND created_at > (now() - (p_window_seconds || ' seconds')::interval);
    
    INSERT INTO public.request_logs (ip_address, endpoint)
    VALUES (p_ip, p_endpoint);
    
    RETURN v_count < p_max;
END;
$$;

-- 5. cleanup_old_request_logs
CREATE OR REPLACE FUNCTION public.cleanup_old_request_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.request_logs
    WHERE created_at < (now() - interval '1 hour');
END;
$$;

-- 6. decrypt_letter_content
CREATE OR REPLACE FUNCTION public.decrypt_letter_content(
    p_letter_id uuid,
    p_session_token text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_content text;
    v_session_valid boolean;
    v_encryption_key text;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM public.letter_access_sessions
        WHERE letter_id = p_letter_id
          AND session_token_hash = crypt(p_session_token, session_token_hash)
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
    
    SELECT pgp_sym_decrypt(content_encrypted::bytea, v_encryption_key)
    INTO v_content
    FROM public.letters
    WHERE id = p_letter_id AND is_active = true;
    
    UPDATE public.letters
    SET is_read = true, read_at = COALESCE(read_at, now())
    WHERE id = p_letter_id;
    
    RETURN v_content;
END;
$$;

-- 7. decrypt_recipient_name
CREATE OR REPLACE FUNCTION public.decrypt_recipient_name(p_recipient_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_name text;
    v_encryption_key text;
BEGIN
    v_encryption_key := current_setting('app.settings.encryption_key', true);
    
    IF v_encryption_key IS NULL THEN
        RETURN NULL;
    END IF;
    
    SELECT pgp_sym_decrypt(name_encrypted::bytea, v_encryption_key)
    INTO v_name
    FROM public.recipients
    WHERE id = p_recipient_id;
    
    RETURN v_name;
END;
$$;

-- Revoke all from anon
REVOKE ALL ON public.admin_users FROM anon;
REVOKE ALL ON public.admin_sessions FROM anon;
REVOKE ALL ON public.recipients FROM anon;
REVOKE ALL ON public.letters FROM anon;
REVOKE ALL ON public.security_questions FROM anon;
REVOKE ALL ON public.replies FROM anon;
REVOKE ALL ON public.security_events FROM anon;
REVOKE ALL ON public.letter_access_sessions FROM anon;
REVOKE ALL ON public.request_logs FROM anon;

-- Grant authenticated access excluding canary fields
GRANT SELECT (id, email, auth_user_id, security_question_1, security_question_2, failed_login_attempts, locked_until, created_at) ON public.admin_users TO authenticated;
GRANT UPDATE (security_question_1, security_answer_1_hash, security_question_2, security_answer_2_hash, failed_login_attempts, locked_until) ON public.admin_users TO authenticated;

GRANT ALL ON public.admin_sessions TO authenticated;

GRANT SELECT (id, admin_id, display_label, token_hash, max_uses, use_count, expires_at, is_active, created_at) ON public.recipients TO authenticated;
GRANT INSERT (admin_id, name_encrypted, display_label, token_hash, max_uses, expires_at) ON public.recipients TO authenticated;
GRANT UPDATE (display_label, token_hash, max_uses, is_active, use_count, expires_at) ON public.recipients TO authenticated;
GRANT DELETE ON public.recipients TO authenticated;

GRANT SELECT (id, recipient_id, admin_id, content_type, is_read, read_at, is_active, order_index, created_at) ON public.letters TO authenticated;
GRANT INSERT (recipient_id, admin_id, content_encrypted, content_type, order_index) ON public.letters TO authenticated;
GRANT UPDATE (is_read, read_at, is_active) ON public.letters TO authenticated;

GRANT ALL ON public.security_questions TO authenticated;

GRANT SELECT (id, letter_id, sender_type, is_read_by_admin, created_at) ON public.replies TO authenticated;
GRANT INSERT (letter_id, content_encrypted, sender_type) ON public.replies TO authenticated;
GRANT UPDATE (is_read_by_admin) ON public.replies TO authenticated;

GRANT SELECT ON public.security_events TO authenticated;
