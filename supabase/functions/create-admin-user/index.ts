import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Try to create auth user
  const { data, error } = await supabase.auth.admin.createUser({
    email: "ahmedromu4@gmail.com",
    password: "zarzor2006",
    email_confirm: true,
  });

  if (error) {
    // If user already exists, update password and link
    const { data: users } = await supabase.auth.admin.listUsers();
    const existing = users?.users?.find((u: any) => u.email === "ahmedromu4@gmail.com");
    if (existing) {
      await supabase.auth.admin.updateUserById(existing.id, { password: "zarzor2006", email_confirm: true });
      const { error: updateErr } = await supabase.from("admin_users")
        .update({ auth_user_id: existing.id })
        .eq("email", "ahmedromu4@gmail.com");
      return Response.json({ success: true, action: "updated_existing", auth_id: existing.id, updateErr });
    }
    return Response.json({ error: error.message }, { status: 400 });
  }

  // Link new user
  const { error: updateErr } = await supabase.from("admin_users")
    .update({ auth_user_id: data.user.id })
    .eq("email", "ahmedromu4@gmail.com");

  return Response.json({ success: true, action: "created", auth_id: data.user.id, updateErr });
});
