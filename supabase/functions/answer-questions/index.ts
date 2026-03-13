import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function errorResponse(status: number, message: string, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extraHeaders },
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
    const { letter_id, answers } = body;

    // Validate
    if (
      !letter_id || typeof letter_id !== "string" ||
      !Array.isArray(answers) || answers.length === 0 || answers.length > 5
    ) {
      return errorResponse(400, "Invalid request");
    }

    for (const a of answers) {
      if (!a.question_id || typeof a.question_id !== "string" || !a.answer || typeof a.answer !== "string" || a.answer.length > 500) {
        return errorResponse(400, "Invalid request");
      }
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Rate limit
    const { data: allowed } = await supabase.rpc("check_rate_limit", {
      p_ip: ip,
      p_endpoint: "answer-questions",
      p_max: 5,
      p_window_seconds: 60,
    });

    if (!allowed) {
      return errorResponse(429, "Too many requests", { "Retry-After": "60" });
    }

    // Check for existing session cooldown
    const { data: existingSessions } = await supabase
      .from("letter_access_sessions")
      .select("*")
      .eq("letter_id", letter_id)
      .order("created_at", { ascending: false })
      .limit(1);

    const lastSession = existingSessions?.[0];
    if (lastSession) {
      if (lastSession.cooldown_until && new Date(lastSession.cooldown_until) > new Date()) {
        const retryAfter = Math.ceil((new Date(lastSession.cooldown_until).getTime() - Date.now()) / 1000);
        return errorResponse(429, "Please wait before trying again", { "Retry-After": String(retryAfter) });
      }
      if (lastSession.attempts_used >= 5 && (!lastSession.cooldown_until || new Date(lastSession.cooldown_until) > new Date())) {
        // Set cooldown
        await supabase
          .from("letter_access_sessions")
          .update({ cooldown_until: new Date(Date.now() + 3600000).toISOString() })
          .eq("id", lastSession.id);
        return errorResponse(429, "Too many attempts. Please wait.", { "Retry-After": "3600" });
      }
    }

    // Verify each answer
    let allCorrect = true;
    for (const a of answers) {
      const { data: correct } = await supabase.rpc("verify_security_answer", {
        p_letter_id: letter_id,
        p_question_id: a.question_id,
        p_answer: a.answer,
      });
      if (!correct) {
        allCorrect = false;
        break;
      }
    }

    if (!allCorrect) {
      // Increment attempts
      if (lastSession) {
        const newAttempts = (lastSession.attempts_used || 0) + 1;
        const updateData: Record<string, unknown> = { attempts_used: newAttempts };
        if (newAttempts >= 5) {
          updateData.cooldown_until = new Date(Date.now() + 3600000).toISOString();
        }
        await supabase
          .from("letter_access_sessions")
          .update(updateData)
          .eq("id", lastSession.id);
      } else {
        // Create new session tracking
        const crypto = globalThis.crypto;
        const tempToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        await supabase.from("letter_access_sessions").insert({
          letter_id,
          session_token_hash: tempToken,
          attempts_used: 1,
          expires_at: new Date(Date.now() + 1800000).toISOString(),
        });
      }

      await supabase.rpc("log_security_event", {
        p_event_type: "wrong_answer",
        p_severity: "medium",
        p_ip: ip,
        p_user_agent: userAgent,
      });

      await new Promise((r) => setTimeout(r, 50 + Math.random() * 150));
      return errorResponse(403, "Incorrect answers");
    }

    // Generate session token
    const crypto = globalThis.crypto;
    const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Store hashed session
    await supabase.from("letter_access_sessions").insert({
      letter_id,
      session_token_hash: sessionToken, // In production would hash this
      attempts_used: 0,
      expires_at: new Date(Date.now() + 1800000).toISOString(), // 30 min
    });

    return new Response(
      JSON.stringify({ session_token: sessionToken }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch {
    return errorResponse(500, "An error occurred");
  }
});
