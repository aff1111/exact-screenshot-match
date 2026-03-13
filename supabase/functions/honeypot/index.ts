import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  const url = new URL(req.url);
  const path = url.pathname;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Log as critical security event - these endpoints should NEVER be accessed
    await supabase.rpc("log_security_event", {
      p_event_type: "honeypot_triggered",
      p_severity: "critical",
      p_ip: ip,
      p_user_agent: userAgent,
      p_metadata: { path, method: req.method },
    });

    // Check and auto-block
    await supabase.rpc("check_and_block_ip", { p_ip: ip });
  } catch {
    // Silent
  }

  // Return fake responses to waste attacker time
  await new Promise((r) => setTimeout(r, 1000 + Math.random() * 2000));

  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
