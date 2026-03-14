Deno.serve(async () => {
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Call GoTrue directly
    const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
      },
      body: JSON.stringify({
        email: "ahmedromu4@gmail.com",
        password: "zarzor2006",
      }),
    });

    const result = await res.json();
    return Response.json({ status: res.status, result });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
});
