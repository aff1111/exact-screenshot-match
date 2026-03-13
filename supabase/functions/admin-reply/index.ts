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

    // Verify admin
    const { data: admin } = await supabase
      .from("admin_users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!admin) {
      return errorResponse(403, "Access denied");
    }

    const body = await req.json();
    const { letter_id, content } = body;

    if (
      !letter_id || typeof letter_id !== "string" ||
      !content || typeof content !== "string" || content.length > 50000 || content.trim().length === 0
    ) {
      return errorResponse(400, "Invalid request");
    }

    // Verify letter belongs to admin
    const { data: letter } = await supabase
      .from("letters")
      .select("id, admin_id")
      .eq("id", letter_id)
      .eq("admin_id", admin.id)
      .single();

    if (!letter) {
      return errorResponse(404, "Not found");
    }

    const encryptionKey = Deno.env.get("ENCRYPTION_KEY");
    if (!encryptionKey) {
      return errorResponse(500, "An error occurred");
    }

    // Encrypt reply
    const { data: encryptedContent } = await supabase.rpc("encrypt_content", {
      p_content: content.trim(),
    });

    const { error: insertError } = await supabase
      .from("replies")
      .insert({
        letter_id,
        content_encrypted: encryptedContent || content.trim(),
        sender_type: "admin",
        is_read_by_admin: true,
      });

    if (insertError) {
      console.error("Reply insert error:", insertError);
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
