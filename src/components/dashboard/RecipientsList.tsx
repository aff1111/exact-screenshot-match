import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RecipientService } from "@/services/api";
import { toast } from "sonner";
import ParchmentCard from "@/components/ui/ParchmentCard";
import { cn } from "@/lib/utils";

interface Recipient {
  id: string;
  display_label: string;
  token: string;
  is_active: boolean;
  created_at: string;
  use_count: number;
}

interface LetterInfo {
  is_read: boolean;
  read_at: string | null;
}

interface Props {
  recipients: Recipient[];
  onSelectRecipient: (r: Recipient) => void;
  onRefresh: () => void;
  onViewReplies?: () => void;
}

const RecipientsList = ({ recipients, onViewReplies }: Props) => {
  const queryClient = useQueryClient();

  // Fetch read status for all letters
  const { data: readStatuses } = useQuery({
    queryKey: ["letters_read_status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("letters")
        .select("recipient_id, is_read, read_at");
      if (error) return {};
      
      const statusMap: Record<string, LetterInfo> = {};
      data.forEach(l => {
        if (!statusMap[l.recipient_id] || (l.read_at && (!statusMap[l.recipient_id].read_at || l.read_at > statusMap[l.recipient_id].read_at!))) {
          statusMap[l.recipient_id] = { is_read: l.is_read, read_at: l.read_at };
        }
      });
      return statusMap;
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("recipients")
        .update({ is_active: !isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipients"] });
      toast.success("تم تحديث حالة المستلم بنجاح");
    },
    onError: (err) => toast.error(`خطأ: ${err.message}`),
  });

  if (recipients.length === 0) {
    return (
      <ParchmentCard className="items-center justify-center text-center">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <span className="text-6xl grayscale opacity-20">📜</span>
          <h3 className="font-amiri text-2xl text-ink/70">لا يوجد مستلمون حتى الآن</h3>
          <p className="font-amiri text-ink/40">ابدأ بإضافة أول مستلم ملكي لرسائلك</p>
        </motion.div>
      </ParchmentCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2 px-2">
        <h2 className="font-cinzel text-xl text-secondary flex items-center gap-3">
          <span className="text-gold opacity-50">✦</span>
          المستلمون المصرح لهم
          <span className="text-gold opacity-50">✦</span>
        </h2>
        <div className="text-[10px] uppercase font-cinzel text-ink/40 tracking-widest">
          إجمالي المستلمين: {recipients.length}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {recipients.map((recipient, idx) => {
          const status = readStatuses?.[recipient.id];
          const hasRead = status?.is_read;
          
          return (
            <motion.div
              key={recipient.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div className={cn(
                "group relative overflow-hidden rounded-sm border transition-all duration-500",
                recipient.is_active 
                  ? "bg-white/40 border-gold/10 hover:border-gold/30 hover:shadow-royal" 
                  : "bg-black/5 border-transparent opacity-60 grayscale"
              )}>
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-14 h-14 rounded-full border flex items-center justify-center bg-parchment shadow-inner text-2xl relative",
                      hasRead ? "border-gold/40" : "border-ink/10"
                    )}>
                      👤
                      {hasRead && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white">
                          ✓
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-amiri text-2xl text-secondary">{recipient.display_label}</h4>
                      <div className="flex flex-wrap gap-4 mt-1 font-cinzel text-[10px] text-ink/50 uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <span className="text-gold">👁</span> {recipient.use_count || 0} زيارة
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <span className="text-gold">🕒</span> {new Date(recipient.created_at).toLocaleDateString("ar")}
                        </span>
                        {hasRead && (
                          <>
                            <span>•</span>
                            <span className="text-green-600 font-bold">تم الاطلاع {status.read_at ? `(${new Date(status.read_at).toLocaleTimeString("ar", { hour: '2-digit', minute: '2-digit' })})` : ""}</span>
                          </>
                        )}
                        {!hasRead && recipient.use_count > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-orange-600 font-bold">لم يقرأ بعد</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button 
                      onClick={async () => {
                        try {
                          const token = await RecipientService.regenerateRecipientToken(recipient.id);
                          const link = `${window.location.origin}/s/${token}`;
                          await navigator.clipboard.writeText(link);
                          toast.success("تم تحديث الرابط ونسخه بنجاح");
                        } catch (err: any) {
                          toast.error(`فشل الحصول على الرابط: ${err.message}`);
                        }
                      }}
                      className="btn-royal py-2 px-5 text-[10px] border-gold/40 bg-gold/10 text-gold hover:bg-gold hover:text-white"
                    >
                      تجديد ونسخ الرابط
                    </button>
                    
                    <button 
                      onClick={onViewReplies}
                      className="btn-royal py-2 px-5 text-[10px] border-gold/20 bg-white/40 text-ink hover:bg-parchment"
                    >
                      الردود المستلمة
                    </button>
                    
                    <button 
                      onClick={() => toggleActiveMutation.mutate({ id: recipient.id, isActive: recipient.is_active })}
                      disabled={toggleActiveMutation.isPending}
                      className={cn(
                        "btn-royal py-2 px-5 text-[10px]",
                        !recipient.is_active ? "bg-ink/10 border-ink/10 text-ink/50" : "border-red-500/20 text-red-500/60 hover:bg-red-500 hover:text-white"
                      )}
                    >
                      {recipient.is_active ? "تعطيل" : "تفعيل"}
                    </button>
                  </div>
                </div>

                {/* Decorative Shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default RecipientsList;
