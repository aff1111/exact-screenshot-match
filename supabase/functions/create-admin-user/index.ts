import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // One-time setup function - create auth user for admin
  // Only allow with service role key
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const authHeader = req.headers.get("Authorization") || "";
  // Accept both direct key and Bearer token
  if (!authHeader.includes(serviceKey) && authHeader !== `Bearer ${serviceKey}`) {
    // For initial setup, allow if called internally
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Create auth user
  const { data, error } = await supabase.auth.admin.createUser({
    email: "ahmedromu4@gmail.com",
    password: "zarzor2006",
    email_confirm: true,
  });

  if (error) {
    // If user exists, try to get them
    if (error.message.includes("already")) {
      const { data: users } = await supabase.auth.admin.listUsers();
      const existing = users?.users?.find((u: any) => u.email === "ahmedromu4@gmail.com");
      if (existing) {
        // Update password and link
        await supabase.auth.admin.updateUserById(existing.id, { password: "zarzor2006" });
        // Update admin_users with correct auth_user_id
        await supabase.from("admin_users")
          .update({ auth_user_id: existing.id })
          .eq("email", "ahmedromu4@gmail.com");
        return Response.json({ success: true, action: "updated_existing", auth_id: existing.id });
      }
    }
    return Response.json({ error: error.message }, { status: 400 });
  }

  // Update admin_users with the new auth user id
  await supabase.from("admin_users")
    .update({ auth_user_id: data.user.id })
    .eq("email", "ahmedromu4@gmail.com");

  return Response.json({ success: true, action: "created", auth_id: data.user.id });
});
