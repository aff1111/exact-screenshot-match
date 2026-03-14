import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Use fetch directly to create user via admin API
    const res = await fetch(`${url}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
        "apikey": key,
      },
      body: JSON.stringify({
        email: "ahmedromu4@gmail.com",
        password: "zarzor2006",
        email_confirm: true,
      }),
    });

    const result = await res.json();
    
    if (!res.ok) {
      // If already exists, list users and find
      const listRes = await fetch(`${url}/auth/v1/admin/users`, {
        headers: {
          "Authorization": `Bearer ${key}`,
          "apikey": key,
        },
      });
      const listData = await listRes.json();
      const existing = listData?.users?.find((u: any) => u.email === "ahmedromu4@gmail.com");
      
      if (existing) {
        // Update password
        await fetch(`${url}/auth/v1/admin/users/${existing.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`,
            "apikey": key,
          },
          body: JSON.stringify({ password: "zarzor2006", email_confirm: true }),
        });
        
        // Update admin_users
        const supabase = createClient(url, key);
        await supabase.from("admin_users")
          .update({ auth_user_id: existing.id })
          .eq("email", "ahmedromu4@gmail.com");
          
        return Response.json({ success: true, action: "updated", auth_id: existing.id });
      }
      
      return Response.json({ error: result }, { status: 400 });
    }

    // Link new user
    const supabase = createClient(url, key);
    await supabase.from("admin_users")
      .update({ auth_user_id: result.id })
      .eq("email", "ahmedromu4@gmail.com");

    return Response.json({ success: true, action: "created", auth_id: result.id });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
});
