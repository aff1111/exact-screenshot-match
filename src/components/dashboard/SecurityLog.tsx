import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ParchmentCard from "@/components/ui/ParchmentCard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SecurityLog = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

  const { data: events, isLoading } = useQuery({
    queryKey: ["security_events", filter],
    queryFn: async () => {
      let query = supabase
        .from("security_events")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (filter !== "all") {
        query = query.eq("severity", filter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: blockedIps } = useQuery({
    queryKey: ["blocked_ips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocked_ips")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("blocked_ips")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked_ips"] });
      toast.success("تم رفع الحظر عن عنوان IP بنجاح");
    },
  });

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-600 bg-red-50 border-red-200";
      case "high": return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium": return "text-blue-600 bg-blue-50 border-blue-200";
      default: return "text-gold/80 bg-gold/5 border-gold/10";
    }
  };

  return (
    <div className="space-y-8">
      {/* Blocked IPs Section */}
      <AnimatePresence>
        {blockedIps && blockedIps.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-red-50/50 border border-red-200 rounded-sm p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🚨</span>
                <h3 className="font-cinzel text-sm text-red-800 tracking-widest uppercase">تهديدات محظورة (IP)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {blockedIps.map((ip) => (
                  <div key={ip.id} className="bg-white/60 border border-red-100 rounded-sm p-3 flex justify-between items-center">
                    <div>
                      <p className="font-mono text-xs text-red-900">{ip.ip_address}</p>
                      <p className="font-amiri text-[10px] text-red-700 mt-0.5">{ip.reason}</p>
                    </div>
                    <button 
                      onClick={() => unblockMutation.mutate(ip.id)}
                      className="text-[9px] font-cinzel tracking-widest text-red-700 hover:text-red-950 underline underline-offset-4"
                    >
                      إلغاء الحظر
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Events Feed */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
          <h2 className="font-cinzel text-xl text-secondary flex items-center gap-3">
            <span className="text-gold opacity-50">🛡</span>
            سجل العمليات والرقابة
          </h2>
          
          <div className="flex gap-2">
            {["all", "low", "medium", "high", "critical"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  "px-3 py-1.5 rounded-sm font-cinzel text-[10px] tracking-widest uppercase transition-all border",
                  filter === s 
                    ? "bg-secondary text-white border-secondary shadow-md" 
                    : "bg-white/40 border-gold/10 text-ink/60 hover:border-gold/30"
                )}
              >
                {s === "all" ? "الكل" : s}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="h-60 flex items-center justify-center opacity-20">
              <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : events?.length === 0 ? (
            <ParchmentCard className="items-center justify-center py-20 opacity-50">
              <span className="text-4xl mb-4">🍃</span>
              <p className="font-amiri text-ink/60">لا توجد سجلات أمنية تطابق هذا المعيار</p>
            </ParchmentCard>
          ) : (
            events?.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="group relative bg-white/40 border border-gold/10 rounded-sm p-4 hover:border-gold/30 hover:bg-white/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "w-2 h-10 rounded-full border-r-2",
                    event.severity === "critical" ? "border-red-500 bg-red-50" : 
                    event.severity === "high" ? "border-orange-500 bg-orange-50" :
                    "border-gold/30 bg-gold/5"
                  )} />
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-cinzel text-[10px] uppercase tracking-wider text-secondary/70">
                        {event.event_type}
                      </span>
                      {event.event_type.includes("honeypot") && (
                        <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-amiri font-bold">🍯 فخ</span>
                      )}
                    </div>
                    <p className="font-amiri text-sm text-ink mt-1">{event.details}</p>
                    <div className="flex gap-4 mt-1 font-cinzel text-[9px] text-ink/40 uppercase tracking-tighter">
                      <span>IP: {event.ip_address}</span>
                      <span>•</span>
                      <span>{new Date(event.created_at).toLocaleString("ar")}</span>
                    </div>
                  </div>
                </div>
                
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="btn-royal py-1.5 px-4 text-[9px] border-gold/10 text-ink/50 hover:text-ink">عرض التفاصيل</button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityLog;
