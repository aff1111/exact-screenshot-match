
CREATE OR REPLACE FUNCTION public.verify_admin_answers(p_answer_1 text, p_answer_2 text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_hash_1 text;
  v_hash_2 text;
  v_admin_id uuid;
BEGIN
  SELECT id, security_answer_1_hash, security_answer_2_hash
  INTO v_admin_id, v_hash_1, v_hash_2
  FROM public.admin_users
  WHERE auth_user_id = auth.uid();
  
  IF v_admin_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN (
    v_hash_1 = crypt(lower(trim(p_answer_1)), v_hash_1) AND
    v_hash_2 = crypt(lower(trim(p_answer_2)), v_hash_2)
  );
END;
$$;
