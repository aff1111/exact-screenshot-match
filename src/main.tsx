import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeSupabase } from "@/integrations/supabase/test";
import { Logger } from "@/lib/errors";

/**
 * Initialize Supabase connection on app startup
 */
initializeSupabase().catch((error) => {
  Logger.error('Failed to initialize Supabase', { error });
  // Show error to user but continue app initialization
});

createRoot(document.getElementById("root")!).render(<App />);
