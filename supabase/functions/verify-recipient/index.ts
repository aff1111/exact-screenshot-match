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
    const token = body?.token;

    if (!token || typeof token !== "string" || token.length > 500) {
      return errorResponse(400, "Invalid request");
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Rate limit: 10 requests/minute per IP
    const { data: allowed } = await supabase.rpc("check_rate_limit", {
      p_ip: ip,
      p_endpoint: "verify-recipient",
      p_max: 10,
      p_window_seconds: 60,
    });

    if (!allowed) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
      });
    }

    // Verify token
    const { data: recipientId } = await supabase.rpc("verify_token", {
      raw_token: token,
    });

    if (!recipientId) {
      await supabase.rpc("log_security_event", {
        p_event_type: "invalid_token",
        p_severity: "medium",
        p_ip: ip,
        p_user_agent: userAgent,
        p_token_prefix: token.substring(0, 8),
      });
      // Random delay to prevent timing attacks
      await new Promise((r) => setTimeout(r, 50 + Math.random() * 150));
      return errorResponse(403, "Access denied");
    }

    // Increment use_count
    await supabase
      .from("recipients")
      .update({ use_count: undefined }) // We'll use raw SQL via rpc instead
      .eq("id", recipientId);

    // Get letters for this recipient with their questions (no content)
    const { data: letters } = await supabase
      .from("letters")
      .select("id, title, content_type, is_read, order_index, created_at, unlock_at, unlock_latitude, unlock_longitude")
      .eq("recipient_id", recipientId)
      .eq("is_active", true)
      .order("order_index", { ascending: true });

    // Get questions for each letter
    const lettersWithQuestions = [];
    for (const letter of letters || []) {
      const { data: questions } = await supabase
        .from("security_questions")
        .select("id, question_text, question_order")
        .eq("letter_id", letter.id)
        .order("question_order", { ascending: true });

      lettersWithQuestions.push({
        id: letter.id,
        title: letter.title,
        content_type: letter.content_type,
        is_read: letter.is_read,
        order_index: letter.order_index,
        created_at: letter.created_at,
        unlock_at: letter.unlock_at,
        unlock_latitude: letter.unlock_latitude,
        unlock_longitude: letter.unlock_longitude,
        questions: questions || [],
      });
    }

    return new Response(
      JSON.stringify({
        recipient_id: recipientId,
        letters: lettersWithQuestions,
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
