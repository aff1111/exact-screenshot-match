import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ParchmentCard from "@/components/ui/ParchmentCard";
import { cn } from "@/lib/utils";

interface Recipient {
  id: string;
  display_label: string;
  is_active: boolean;
  created_at: string;
  use_count: number;
}

interface Props {
  recipients: Recipient[];
  onSelectRecipient: (r: Recipient) => void;
  onRefresh: () => void;
}

const RecipientsList = ({ recipients }: Props) => {
  const queryClient = useQueryClient();
  const [editingQuestions, setEditingQuestions] = useState<string | null>(null);

  // Mutations
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
        {recipients.map((recipient, idx) => (
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
                  <div className="w-12 h-12 rounded-full border border-gold/20 flex items-center justify-center bg-parchment shadow-inner text-xl">
                    👤
                  </div>
                  <div>
                    <h4 className="font-amiri text-xl text-secondary">{recipient.display_label}</h4>
                    <div className="flex gap-4 mt-1 font-cinzel text-[10px] text-ink/50 uppercase tracking-wider">
                      <span>الزيارات: {recipient.use_count}</span>
                      <span>•</span>
                      <span>{new Date(recipient.created_at).toLocaleDateString("ar")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => toggleActiveMutation.mutate({ id: recipient.id, isActive: recipient.is_active })}
                    disabled={toggleActiveMutation.isPending}
                    className={cn(
                      "btn-royal py-2 px-5 text-[10px]",
                      !recipient.is_active && "bg-ink/10 border-ink/10 text-ink/50"
                    )}
                  >
                    {recipient.is_active ? "تعطيل" : "تفعيل"}
                  </button>
                  
                  <button className="btn-royal py-2 px-5 text-[10px] border-gold/20 bg-parchment/50 text-ink hover:bg-parchment">
                    أدوات الرابط
                  </button>
                  
                  <button className="btn-gold py-2 px-5 text-[10px] shadow-sm">
                    تعديل الأمان
                  </button>
                </div>
              </div>

              {/* Decorative Shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RecipientsList;
