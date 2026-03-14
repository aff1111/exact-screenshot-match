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
    const { letter_id, session_token } = body;

    if (!letter_id || typeof letter_id !== "string" || !session_token || typeof session_token !== "string") {
      return errorResponse(400, "Invalid request");
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Rate limit: 20/min
    const { data: allowed } = await supabase.rpc("check_rate_limit", {
      p_ip: ip,
      p_endpoint: "read-letter",
      p_max: 20,
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

    const session = sessions[0];
    if (session.cooldown_until && new Date(session.cooldown_until) > new Date()) {
      return errorResponse(403, "Access denied");
    }

    // Get letter content (decrypt via service role)
    const encryptionKey = Deno.env.get("ENCRYPTION_KEY");
    if (!encryptionKey) {
      return errorResponse(500, "An error occurred");
    }

    const { data: letterData, error: letterError } = await supabase
      .from("letters")
      .select("id, title, content_encrypted, content_type, order_index, created_at, recipient_id, unlock_at, recipients(display_label, name_encrypted)")
      .eq("id", letter_id)
      .eq("is_active", true)
      .single();

    if (letterError || !letterData) {
      return new Response(JSON.stringify({ error: "Letter not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check Time-Lock
    if (letterData.unlock_at && new Date(letterData.unlock_at) > new Date()) {
      return new Response(
        JSON.stringify({
          error: "Letter is sealed",
          locked: true,
          unlock_at: letterData.unlock_at,
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Decrypt content using SQL
    const { data: decrypted } = await supabase.rpc("decrypt_letter_content", {
      p_letter_id: letter_id,
      p_session_token: session_token,
    });
    
    // Fallback if decryption returns null (e.g. no key configured)
    const finalContent = decrypted || letterData.content_encrypted;

    // Get recipient name
    const { data: recipientData } = await supabase
      .from("recipients")
      .select("display_label, name_encrypted")
      .eq("id", letterData.recipient_id)
      .single();

    const { data: decryptedName } = await supabase.rpc("decrypt_recipient_name", {
      p_recipient_id: letterData.recipient_id,
    });
    
    const finalName = decryptedName || (recipientData ? (recipientData.name_encrypted || recipientData.display_label) : "صديقي");

    // Get existing replies for this letter
    const { data: replies } = await supabase
      .from("replies")
      .select("id, sender_type, created_at")
      .eq("letter_id", letter_id)
      .order("created_at", { ascending: true });

    return new Response(
      JSON.stringify({
        letter: {
          id: letterData.id,
          title: letterData.title,
          content: finalContent,
          content_type: letterData.content_type,
          order_index: letterData.order_index,
          created_at: letterData.created_at,
          recipient_name: finalName
        },
        replies: replies || [],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch {
    return errorResponse(500, "An error occurred");
  }
});
