
-- Blocked IPs table
CREATE TABLE public.blocked_ips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL UNIQUE,
  reason text DEFAULT 'auto_block',
  blocked_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  is_active boolean DEFAULT true
);

ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin reads blocked_ips" ON public.blocked_ips
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admin manages blocked_ips" ON public.blocked_ips
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid()));

-- Function to check and auto-block IPs
CREATE OR REPLACE FUNCTION public.check_and_block_ip(p_ip text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_count integer;
  v_blocked boolean;
BEGIN
  -- Check if already blocked
  SELECT EXISTS(
    SELECT 1 FROM public.blocked_ips
    WHERE ip_address = p_ip AND is_active = true AND expires_at > now()
  ) INTO v_blocked;
  
  IF v_blocked THEN RETURN true; END IF;
  
  -- Count high/critical events in last 5 minutes
  SELECT count(*) INTO v_count
  FROM public.security_events
  WHERE ip_address = p_ip
    AND severity IN ('high', 'critical')
    AND created_at > (now() - interval '5 minutes');
  
  IF v_count >= 10 THEN
    INSERT INTO public.blocked_ips (ip_address, reason)
    VALUES (p_ip, 'auto_block: ' || v_count || ' high/critical events in 5 min')
    ON CONFLICT (ip_address) DO UPDATE SET
      is_active = true,
      blocked_at = now(),
      expires_at = now() + interval '24 hours',
      reason = EXCLUDED.reason;
    
    -- Log the block event
    INSERT INTO public.security_events (event_type, severity, ip_address, metadata)
    VALUES ('ip_auto_blocked', 'critical', p_ip, jsonb_build_object('event_count', v_count));
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;
