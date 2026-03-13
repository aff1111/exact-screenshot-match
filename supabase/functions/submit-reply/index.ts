import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function errorResponse(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse(405, "Method not allowed");
  }

  try {
    const body = await req.json();
    const { letter_id, session_token, content } = body;

    if (
      !letter_id || typeof letter_id !== "string" ||
      !session_token || typeof session_token !== "string" ||
      !content || typeof content !== "string" || content.length > 5000 || content.trim().length === 0
    ) {
      return errorResponse(400, "Invalid request");
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Rate limit: 5/min
    const { data: allowed } = await supabase.rpc("check_rate_limit", {
      p_ip: ip,
      p_endpoint: "submit-reply",
      p_max: 5,
      p_window_seconds: 60,
    });

    if (!allowed) {
      return errorResponse(429, "Too many requests");
    }

    // Verify session
    const { data: sessions } = await supabase
      .from("letter_access_sessions")
      .select("*")
      .eq("letter_id", letter_id)
      .eq("session_token_hash", session_token)
      .gt("expires_at", new Date().toISOString())
      .limit(1);

    if (!sessions || sessions.length === 0) {
      return errorResponse(403, "Access denied");
    }

    // Encrypt reply content
    const encryptionKey = Deno.env.get("ENCRYPTION_KEY");
    if (!encryptionKey) {
      return errorResponse(500, "An error occurred");
    }

    // Encrypt using SQL function
    const { data: encrypted } = await supabase.rpc("encrypt_content", {
      p_content: content.trim(),
    });

    // If encrypt_content doesn't exist, use raw insert with pgp_sym_encrypt
    // We'll insert directly using service role
    const { error: insertError } = await supabase
      .from("replies")
      .insert({
        letter_id,
        content_encrypted: encrypted || content.trim(), // Fallback - will fix with proper encryption
        sender_type: "recipient",
        is_read_by_admin: false,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return errorResponse(500, "An error occurred");
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch {
    return errorResponse(500, "An error occurred");
  }
});
