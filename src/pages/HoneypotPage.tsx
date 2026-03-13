import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const HoneypotPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Trigger honeypot edge function
    supabase.functions.invoke("honeypot", {
      body: { path: window.location.pathname },
    }).catch(() => {});
    
    // Redirect after delay
    setTimeout(() => navigate("/"), 3000);
  }, []);

  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center">
      <p className="font-amiri text-muted-foreground">404 — الصفحة غير موجودة</p>
    </div>
  );
};

export default HoneypotPage;
