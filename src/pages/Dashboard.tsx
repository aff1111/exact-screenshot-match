import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import parchmentBg from "@/assets/parchment-bg.jpg";
import waxSeal from "@/assets/wax-seal.png";
import ComposeLetterModal from "@/components/dashboard/ComposeLetterModal";
import RecipientsList from "@/components/dashboard/RecipientsList";
import SecurityLog from "@/components/dashboard/SecurityLog";
import ConversationThread from "@/components/dashboard/ConversationThread";
import AddRecipientModal from "@/components/dashboard/AddRecipientModal";
import AccountSettings from "@/components/dashboard/AccountSettings";

type Tab = "compose" | "recipients" | "security" | "sessions" | "analytics" | "settings";

interface Recipient {
  id: string;
  display_label: string;
  is_active: boolean;
  created_at: string;
  use_count: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("recipients");
  const [user, setUser] = useState<any>(null);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [showAddRecipient, setShowAddRecipient] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }
    setUser(session.user);

    const { data: admin } = await supabase
      .from("admin_users")
      .select("id")
      .eq("auth_user_id", session.user.id)
      .single();

    if (!admin) {
      navigate("/login");
      return;
    }

    setAdminId(admin.id);
    setLoading(false);
    loadRecipients();
  };

  const loadRecipients = async () => {
    const { data } = await supabase
      .from("recipients")
      .select("id, display_label, is_active, created_at, use_count")
      .order("created_at", { ascending: false });
    setRecipients(data || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <img src={waxSeal} alt="" className="w-16 h-16 animate-float mb-4" />
          <p className="font-amiri text-accent">جارٍ التحميل...</p>
        </motion.div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; labelEn: string; icon: string }[] = [
    { key: "recipients", label: "المستلمون", labelEn: "Recipients", icon: "📜" },
    { key: "compose", label: "رسالة جديدة", labelEn: "Compose", icon: "✍" },
    { key: "security", label: "سجل الأمان", labelEn: "Security", icon: "🛡" },
    { key: "sessions", label: "الجلسات", labelEn: "Sessions", icon: "🔑" },
    { key: "analytics", label: "التحليلات", labelEn: "Analytics", icon: "📊" },
    { key: "settings", label: "الإعدادات", labelEn: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundImage: `url(${parchmentBg})`, backgroundSize: "cover", backgroundAttachment: "fixed" }}>
      <div className="min-h-screen bg-parchment/80">
        {/* Header */}
        <header className="border-b border-gold/20 bg-parchment/90 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={waxSeal} alt="" className="w-8 h-8" />
              <h1 className="font-cinzel-decorative text-lg text-secondary">مكتوب</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-amiri text-sm text-accent hidden md:block">
                أهلاً، أحمد
              </span>
              <button
                onClick={handleLogout}
                className="font-cinzel text-xs text-accent hover:text-secondary transition-colors tracking-widest uppercase border border-gold/30 px-3 py-1.5 rounded-sm"
              >
                خروج
              </button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6">
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-8 border-b border-gold/20 pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  if (tab.key === "compose") {
                    setShowCompose(true);
                  } else {
                    setActiveTab(tab.key);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-sm font-amiri text-sm transition-all duration-200
                  ${activeTab === tab.key && tab.key !== "compose"
                    ? "bg-secondary text-secondary-foreground border border-gold"
                    : "bg-parchment/60 text-accent border border-gold/20 hover:border-gold/50"
                  }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
            <button
              onClick={() => setShowAddRecipient(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-sm font-amiri text-sm bg-primary/20 text-accent border border-gold/30 hover:bg-primary/30 transition-all ml-auto"
            >
              <span>➕</span>
              <span>مستلم جديد</span>
            </button>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {selectedRecipient ? (
              <motion.div
                key="thread"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button
                  onClick={() => setSelectedRecipient(null)}
                  className="font-amiri text-accent hover:text-secondary mb-4 flex items-center gap-2"
                >
                  → العودة للمستلمين
                </button>
                <ConversationThread
                  recipient={selectedRecipient}
                  adminId={adminId!}
                />
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === "recipients" && (
                  <RecipientsList
                    recipients={recipients}
                    onSelectRecipient={setSelectedRecipient}
                    onRefresh={loadRecipients}
                  />
                )}
                {activeTab === "security" && <SecurityLog />}
                {activeTab === "sessions" && <SessionsPanel />}
                {activeTab === "analytics" && <AnalyticsPanel recipients={recipients} />}
                {activeTab === "settings" && <AccountSettings adminId={adminId!} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Compose Modal */}
        {showCompose && (
          <ComposeLetterModal
            adminId={adminId!}
            recipients={recipients}
            onClose={() => setShowCompose(false)}
            onSuccess={() => { setShowCompose(false); loadRecipients(); }}
          />
        )}

        {/* Add Recipient Modal */}
        {showAddRecipient && (
          <AddRecipientModal
            adminId={adminId!}
            onClose={() => setShowAddRecipient(false)}
            onSuccess={() => { setShowAddRecipient(false); loadRecipients(); }}
          />
        )}
      </div>
    </div>
  );
};

const SessionsPanel = () => {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const { data } = await supabase
      .from("admin_sessions")
      .select("*")
      .order("created_at", { ascending: false });
    setSessions(data || []);
  };

  const revokeSession = async (id: string) => {
    await supabase
      .from("admin_sessions")
      .update({ is_revoked: true })
      .eq("id", id);
    loadSessions();
  };

  return (
    <div className="space-y-4">
      <h2 className="font-cinzel text-xl text-secondary">الجلسات النشطة</h2>
      {sessions.length === 0 ? (
        <p className="font-amiri text-muted-foreground">لا توجد جلسات نشطة</p>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="bg-parchment/60 border border-gold/20 rounded-sm p-4 flex justify-between items-center">
              <div>
                <p className="font-amiri text-sm text-ink">{s.ip_address || "غير معروف"}</p>
                <p className="font-cinzel text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString("ar")}</p>
                <p className="text-xs text-muted-foreground">{s.is_revoked ? "🔴 ملغاة" : "🟢 نشطة"}</p>
              </div>
              {!s.is_revoked && (
                <button
                  onClick={() => revokeSession(s.id)}
                  className="font-cinzel text-xs text-destructive border border-destructive/30 px-3 py-1 rounded-sm hover:bg-destructive/10"
                >
                  إنهاء
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AnalyticsPanel = ({ recipients }: { recipients: Recipient[] }) => {
  return (
    <div className="space-y-6">
      <h2 className="font-cinzel text-xl text-secondary">التحليلات</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-parchment/60 border border-gold/20 rounded-sm p-6 text-center">
          <p className="font-cinzel text-3xl text-secondary">{recipients.length}</p>
          <p className="font-amiri text-sm text-muted-foreground mt-1">إجمالي المستلمين</p>
        </div>
        <div className="bg-parchment/60 border border-gold/20 rounded-sm p-6 text-center">
          <p className="font-cinzel text-3xl text-secondary">
            {recipients.filter(r => r.is_active).length}
          </p>
          <p className="font-amiri text-sm text-muted-foreground mt-1">روابط نشطة</p>
        </div>
        <div className="bg-parchment/60 border border-gold/20 rounded-sm p-6 text-center">
          <p className="font-cinzel text-3xl text-secondary">
            {recipients.reduce((sum, r) => sum + (r.use_count || 0), 0)}
          </p>
          <p className="font-amiri text-sm text-muted-foreground mt-1">إجمالي الزيارات</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
