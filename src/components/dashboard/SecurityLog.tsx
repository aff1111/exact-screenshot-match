import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

const SecurityLog = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [blockedIps, setBlockedIps] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadEvents();
    loadBlockedIps();
  }, [filter]);

  const loadEvents = async () => {
    let query = supabase
      .from("security_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (filter !== "all") {
      query = query.eq("severity", filter);
    }

    const { data } = await query;
    setEvents(data || []);
  };

  const loadBlockedIps = async () => {
    const { data } = await supabase
      .from("blocked_ips")
      .select("*")
      .eq("is_active", true)
      .order("blocked_at", { ascending: false });
    setBlockedIps(data || []);
  };

  const unblockIp = async (id: string) => {
    await supabase
      .from("blocked_ips")
      .update({ is_active: false })
      .eq("id", id);
    loadBlockedIps();
  };

  const severityColors: Record<string, string> = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Blocked IPs Alert */}
      <AnimatePresence>
        {blockedIps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border-2 border-red-300 rounded-sm p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-red-600 text-lg">🚨</span>
              <h3 className="font-cinzel text-sm text-red-800 tracking-wider uppercase">
                عناوين IP محظورة تلقائياً ({blockedIps.length})
              </h3>
            </div>
            <div className="space-y-2">
              {blockedIps.map((ip) => (
                <div
                  key={ip.id}
                  className="flex items-center justify-between bg-red-100/50 rounded-sm px-3 py-2"
                >
                  <div>
                    <span className="font-mono text-sm text-red-900">{ip.ip_address}</span>
                    <p className="font-amiri text-xs text-red-700">{ip.reason}</p>
                    <p className="font-cinzel text-xs text-red-600">
                      ينتهي: {new Date(ip.expires_at).toLocaleString("ar")}
                    </p>
                  </div>
                  <button
                    onClick={() => unblockIp(ip.id)}
                    className="font-cinzel text-xs text-red-700 border border-red-300 px-3 py-1 rounded-sm hover:bg-red-200 transition-colors"
                  >
                    رفع الحظر
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter + Title */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-cinzel text-xl text-secondary">سجل الأمان</h2>
        <div className="flex gap-2">
          {["all", "low", "medium", "high", "critical"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`font-cinzel text-xs px-3 py-1 rounded-sm border transition-colors ${
                filter === s
                  ? "bg-secondary text-secondary-foreground border-gold"
                  : "bg-parchment/60 text-accent border-gold/20 hover:border-gold/50"
              }`}
            >
              {s === "all" ? "الكل" : s}
            </button>
          ))}
        </div>
      </div>

      {events.length === 0 ? (
        <p className="font-amiri text-muted-foreground text-center py-8">لا توجد أحداث أمنية</p>
      ) : (
        <div className="space-y-2">
          {events.map((e) => (
            <div key={e.id} className="bg-parchment/60 border border-gold/10 rounded-sm p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded font-cinzel ${severityColors[e.severity] || ""}`}>
                      {e.severity}
                    </span>
                    <span className="font-cinzel text-xs text-accent">{e.event_type}</span>
                    {e.event_type === "honeypot_triggered" && (
                      <span className="text-xs text-red-600">🍯 فخ</span>
                    )}
                    {e.event_type === "ip_auto_blocked" && (
                      <span className="text-xs text-red-600">🔒 حظر تلقائي</span>
                    )}
                  </div>
                  <p className="font-amiri text-xs text-muted-foreground">
                    IP: {e.ip_address || "—"} • {new Date(e.created_at).toLocaleString("ar")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SecurityLog;
