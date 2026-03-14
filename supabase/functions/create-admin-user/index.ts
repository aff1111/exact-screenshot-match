import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(url, anonKey);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "ahmedromu4@gmail.com",
      password: "zarzor2006",
    });

    if (error) {
      return Response.json({ success: false, error: error.message, code: error.status });
    }

    // Also check admin_users
    const { data: admin, error: adminErr } = await supabase
      .from("admin_users")
      .select("id, email, auth_user_id, security_question_1, security_question_2")
      .single();

    return Response.json({ 
      success: true, 
      user_id: data.user?.id,
      admin,
      adminErr: adminErr?.message,
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
});
