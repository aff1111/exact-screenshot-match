import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userId = "67b197a8-eb67-46de-9341-a65b2550f981";
    
    // Update password directly
    const res = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
        "apikey": key,
      },
      body: JSON.stringify({ 
        password: "zarzor2006",
        email_confirm: true,
      }),
    });

    const result = await res.json();
    return Response.json({ success: res.ok, result });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
});
