-- Create helper function to regenerate recipient token without exposing raw token in table
CREATE OR REPLACE FUNCTION public.regenerate_recipient_token(p_recipient_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_token text;
  v_token_hash text;
  v_exists boolean;
BEGIN
  SELECT TRUE INTO v_exists
  FROM public.recipients
  WHERE id = p_recipient_id;

  IF NOT v_exists THEN
    RAISE EXCEPTION 'Recipient not found';
  END IF;

  v_token := substr(md5(gen_random_uuid()::text || clock_timestamp()::text || random()::text), 1, 32);
  v_token_hash := extensions.crypt(v_token, extensions.gen_salt('bf', 12));

  UPDATE public.recipients
  SET token_hash = v_token_hash,
      use_count = 0,
      updated_at = now()
  WHERE id = p_recipient_id;

  RETURN v_token;
END;
$$;
