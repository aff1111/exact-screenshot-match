
-- Fix: request_logs and letter_access_sessions are only accessed via SECURITY DEFINER functions
-- Add restrictive policies that deny all direct access
CREATE POLICY "No direct access to request_logs" ON public.request_logs
  FOR ALL TO authenticated USING (false);

CREATE POLICY "No direct access to letter_access_sessions" ON public.letter_access_sessions
  FOR ALL TO authenticated USING (false);

-- Remove the duplicate ALL policy on blocked_ips (keep only SELECT + the ALL)
DROP POLICY IF EXISTS "Admin reads blocked_ips" ON public.blocked_ips;
