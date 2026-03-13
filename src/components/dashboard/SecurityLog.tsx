import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const SecurityLog = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadEvents();
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

  const severityColors: Record<string, string> = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-4" dir="rtl">
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
