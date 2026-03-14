import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ParchmentCard from "@/components/ui/ParchmentCard";
import RoyalScroll from "@/components/ui/RoyalScroll";
import { cn } from "@/lib/utils";

interface Reply {
  id: string;
  letter_id: string;
  letter_title: string;
  recipient_name: string;
  content: string;
  sender_type: string;
  is_read_by_admin: boolean;
  created_at: string;
}

interface Props {
  adminId: string;
}

const RepliesView = ({ adminId }: Props) => {
  const queryClient = useQueryClient();
  const [selectedReply, setSelectedReply] = useState<Reply | null>(null);

  const { data: replies, isLoading } = useQuery({
    queryKey: ["replies", adminId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_decrypted_replies", { p_admin_id: adminId });
      if (error) throw error;
      return data as Reply[];
    },
    enabled: !!adminId,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.rpc as any)("mark_reply_read", { p_reply_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["replies", adminId] });
    },
  });

  const handleOpenReply = (reply: Reply) => {
    setSelectedReply(reply);
    if (!reply.is_read_by_admin) {
      markReadMutation.mutate(reply.id);
    }
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!replies || replies.length === 0) {
    return (
      <ParchmentCard className="items-center justify-center text-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <span className="text-6xl grayscale opacity-20">✉️</span>
          <h3 className="font-amiri text-2xl text-ink/70">لا توجد ردود بعد</h3>
          <p className="font-amiri text-ink/40">عندما يصلك رد ملكي، سيظهر هنا في هذا الديوان</p>
        </motion.div>
      </ParchmentCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2 px-2">
        <h2 className="font-cinzel text-xl text-secondary flex items-center gap-3">
          <span className="text-gold opacity-50">✦</span>
          الديوان الوارد
          <span className="text-gold opacity-50">✦</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {replies.map((reply, idx) => (
          <motion.div
            key={reply.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => handleOpenReply(reply)}
            className={cn(
              "group cursor-pointer relative overflow-hidden rounded-sm border p-6 transition-all duration-300",
              reply.is_read_by_admin 
                ? "bg-white/20 border-gold/10 opacity-70" 
                : "bg-white/40 border-gold/30 shadow-md border-r-4 border-r-gold"
            )}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {!reply.is_read_by_admin && <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />}
                  <h4 className="font-amiri text-xl text-secondary">{reply.recipient_name}</h4>
                </div>
                <p className="font-amiri text-ink/60 text-sm italic">بشأن: {reply.letter_title}</p>
              </div>
              <div className="text-[10px] font-cinzel text-ink/40 tracking-widest uppercase text-right">
                {new Date(reply.created_at).toLocaleDateString("ar")}
              </div>
            </div>
            
            <p className="mt-4 font-amiri text-ink/80 line-clamp-1 leading-relaxed">
              {reply.content}
            </p>

            <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </motion.div>
        ))}
      </div>

      {/* Reply Reader Modal */}
      <AnimatePresence>
        {selectedReply && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReply(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="relative w-full max-w-4xl"
            >
              <RoyalScroll className="max-h-[85vh] overflow-y-auto hide-scrollbar">
                <div className="p-8 space-y-8 font-amiri text-right" dir="rtl">
                  <div className="border-b border-gold/20 pb-6 flex justify-between items-end">
                    <div>
                      <h3 className="text-3xl text-secondary font-bold">من: {selectedReply.recipient_name}</h3>
                      <p className="text-ink/60 mt-2 text-lg">بشأن: {selectedReply.letter_title}</p>
                    </div>
                    <div className="text-sm font-cinzel text-gold tracking-widest uppercase">
                      {new Date(selectedReply.created_at).toLocaleDateString("ar")}
                    </div>
                  </div>
                  
                  <div className="text-2xl leading-[2] text-ink py-8 min-h-[300px]">
                    {selectedReply.content}
                  </div>

                  <div className="pt-8 border-t border-gold/10 flex justify-center">
                    <button 
                      onClick={() => setSelectedReply(null)}
                      className="btn-royal px-12"
                    >
                      إغلاق المكتوب
                    </button>
                  </div>
                </div>
              </RoyalScroll>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RepliesView;
