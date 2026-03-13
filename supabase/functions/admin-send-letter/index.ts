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
    // Verify admin auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return errorResponse(401, "Unauthorized");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return errorResponse(401, "Unauthorized");
    }

    // Verify user is admin
    const { data: admin } = await supabase
      .from("admin_users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!admin) {
      return errorResponse(403, "Access denied");
    }

    const body = await req.json();
    const { recipient_id, content, content_type, questions } = body;

    // Validate
    if (
      !recipient_id || typeof recipient_id !== "string" ||
      !content || typeof content !== "string" || content.length > 50000 ||
      !["letter", "poetry"].includes(content_type || "letter") ||
      !Array.isArray(questions) || questions.length < 1 || questions.length > 5
    ) {
      return errorResponse(400, "Invalid request");
    }

    for (const q of questions) {
      if (!q.question || typeof q.question !== "string" || !q.answer || typeof q.answer !== "string") {
        return errorResponse(400, "Invalid question format");
      }
    }

    const encryptionKey = Deno.env.get("ENCRYPTION_KEY");
    if (!encryptionKey) {
      return errorResponse(500, "An error occurred");
    }

    // Get next order_index
    const { data: lastLetter } = await supabase
      .from("letters")
      .select("order_index")
      .eq("recipient_id", recipient_id)
      .order("order_index", { ascending: false })
      .limit(1);

    const nextOrder = (lastLetter?.[0]?.order_index ?? 0) + 1;

    // Encrypt content via SQL
    const { data: encryptedContent } = await supabase.rpc("encrypt_content", {
      p_content: content,
    });

    // Insert letter
    const { data: letter, error: letterError } = await supabase
      .from("letters")
      .insert({
        recipient_id,
        admin_id: admin.id,
        content_encrypted: encryptedContent || content,
        content_type: content_type || "letter",
        order_index: nextOrder,
      })
      .select("id")
      .single();

    if (letterError || !letter) {
      console.error("Letter insert error:", letterError);
      return errorResponse(500, "An error occurred");
    }

    // Insert security questions with hashed answers
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      // Hash answer using crypt via SQL
      const { data: hashedAnswer } = await supabase.rpc("hash_answer", {
        p_answer: q.answer.toLowerCase().trim(),
      });

      await supabase.from("security_questions").insert({
        letter_id: letter.id,
        question_text: q.question,
        answer_hash: hashedAnswer || q.answer,
        question_order: i + 1,
      });
    }

    return new Response(
      JSON.stringify({ success: true, letter_id: letter.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch {
    return errorResponse(500, "An error occurred");
  }
});
