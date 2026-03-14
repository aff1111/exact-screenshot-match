import React, { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLetters } from "@/hooks/useLetters";
import waxSeal from "@/assets/wax-seal.png";
import { cn } from "@/lib/utils";

// Lazy Load Tab Content
const RecipientsList = React.lazy(() => import("@/components/dashboard/RecipientsList"));
const SecurityLog = React.lazy(() => import("@/components/dashboard/SecurityLog"));
const AccountSettings = React.lazy(() => import("@/components/dashboard/AccountSettings"));
const ComposeLetterModal = React.lazy(() => import("@/components/dashboard/ComposeLetterModal"));
const AddRecipientModal = React.lazy(() => import("@/components/dashboard/AddRecipientModal"));
const RepliesView = React.lazy(() => import("@/components/dashboard/RepliesView"));

type Tab = "recipients" | "replies" | "security" | "settings" | "analytics";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("recipients");
  const [adminId, setAdminId] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [showAddRecipient, setShowAddRecipient] = useState(false);
  
  const { recipients, isLoadingRecipients } = useLetters(adminId ?? undefined);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate("/login");

      const { data: admin } = await supabase
        .from("admin_users")
        .select("id")
        .eq("auth_user_id", session.user.id)
        .single();

      if (!admin) return navigate("/login");
      setAdminId(admin.id);
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "recipients", label: "المستلمون", icon: "📜" },
    { key: "replies", label: "الردود الواردة", icon: "✉️" },
    { key: "security", label: "سجل الأمان", icon: "🛡" },
    { key: "settings", label: "الإعدادات", icon: "⚙️" },
    { key: "analytics", label: "التحليلات", icon: "📊" },
  ];

  if (!adminId) return (
    <div className="min-h-screen bg-parchment-pattern flex items-center justify-center">
      <motion.img 
        src={waxSeal} 
        animate={{ rotate: 360 }} 
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 opacity-20"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-parchment-pattern overflow-x-hidden pt-24 pb-12">
      {/* Royal Header */}
      <header className="fixed top-0 inset-x-0 h-16 bg-white/10 backdrop-blur-xl border-b border-gold/10 z-50 flex items-center shadow-lg">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={waxSeal} className="w-8 h-8 drop-shadow-md" alt="" />
            <span className="font-cinzel-decorative text-xl tracking-widest text-secondary">MAKTOOB</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleLogout} className="btn-royal py-1.5 px-4 text-[10px]">خروج</button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 max-w-6xl">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Sidebar Nav */}
          <nav className="w-full md:w-64 flex flex-col gap-2 sticky top-24">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-4 px-6 py-4 rounded-sm transition-all duration-500 group relative overflow-hidden",
                  activeTab === tab.key 
                    ? "bg-secondary text-white shadow-royal" 
                    : "bg-white/40 hover:bg-white/60 text-ink/70"
                )}
              >
                <span className="text-xl relative z-10">{tab.icon}</span>
                <span className="font-amiri text-lg relative z-10">{tab.label}</span>
                {activeTab === tab.key && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute right-0 top-0 bottom-0 w-1 bg-gold rounded-r-full z-20"
                  />
                )}
                {/* Gold Shimmer effect on active tab */}
                {activeTab === tab.key && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/10 to-transparent -translate-x-full animate-shimmer pointer-events-none" />
                )}
              </button>
            ))}
            
            <div className="mt-8 pt-8 border-t border-gold/10 space-y-3">
              <button 
                onClick={() => setShowCompose(true)}
                className="btn-gold w-full text-[11px] py-4 shadow-xl"
              >
                ✍ رسالة جديدة
              </button>
              <button 
                onClick={() => setShowAddRecipient(true)}
                className="btn-royal w-full bg-white/40 border-gold/10 hover:border-gold/30 text-ink text-[11px] py-4"
              >
                👤 مستلم جديد
              </button>
            </div>
          </nav>

          {/* Content Area */}
          <div className="flex-1 w-full min-h-[700px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full"
              >
                <Suspense fallback={
                  <div className="h-96 flex items-center justify-center opacity-20">
                    <img src={waxSeal} className="w-12 h-12 animate-pulse" alt="" />
                  </div>
                }>
                  {activeTab === "recipients" && (
                    <RecipientsList 
                      recipients={recipients} 
                      onSelectRecipient={() => {}} 
                      onRefresh={() => {}} 
                      onViewReplies={() => setActiveTab("replies")}
                    />
                  )}
                  {activeTab === "replies" && <RepliesView adminId={adminId} />}
                  {activeTab === "security" && <SecurityLog />}
                  {activeTab === "settings" && <AccountSettings adminId={adminId} />}
                  {activeTab === "analytics" && <div className="card-parchment h-96 flex items-center justify-center font-amiri text-ink/40">قريباً: تحليلات ملكية مفصلة</div>}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Modals */}
      <Suspense fallback={null}>
        {showCompose && (
          <ComposeLetterModal 
            adminId={adminId} 
            recipients={recipients} 
            onClose={() => setShowCompose(false)} 
            onSuccess={() => setShowCompose(false)} 
          />
        )}
        {showAddRecipient && (
          <AddRecipientModal 
            adminId={adminId} 
            onClose={() => setShowAddRecipient(false)} 
            onSuccess={() => setShowAddRecipient(false)} 
          />
        )}
      </Suspense>
    </div>
  );
};

export default Dashboard;
