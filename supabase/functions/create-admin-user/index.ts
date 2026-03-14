import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // One-time setup function - create auth user for admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.includes(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "NONE")) {
    return new Response("Unauthorized", { status: 401 });
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
