import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import ParchmentCard from "@/components/ui/ParchmentCard";
import { cn } from "@/lib/utils";

interface Props {
  adminId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AddRecipientModal = ({ adminId, onClose, onSuccess }: Props) => {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return toast.error("يرجى إدخال اسم المستلم");

    setLoading(true);
    try {
      // Professional RPC call to generate recipient with token securely
      const { data, error } = await supabase.from("recipients").insert({
        display_label: label.trim(),
        admin_id: adminId,
        is_active: true
      }).select().single();

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["recipients"] });
      toast.success(`تم تسجيل ${label} كمتلقٍ ملكي`);
      onSuccess();
    } catch (err: any) {
      toast.error(`خطأ: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg shadow-2xl rounded-sm overflow-hidden"
      >
        <ParchmentCard className="p-8 space-y-8">
          <div className="text-center">
            <h2 className="font-cinzel text-xl text-secondary">إضافة مستلم ملكي</h2>
            <p className="font-amiri text-ink/50 mt-1">سجل اسماً جديداً في دفاتر المملكة</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="font-amiri text-sm text-ink/70">اللقب أو الاسم الرسمي</label>
              <input 
                autoFocus
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="مثلاً: الملك خالد، الأميرة ريما..."
                className="input-royal w-full"
                dir="rtl"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={onClose}
                className="btn-royal flex-1 bg-transparent border-gold/20 text-ink/60"
              >
                إلغاء
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="btn-gold flex-[2] py-3"
              >
                {loading ? "جارٍ التسجيل..." : "تسجيل في الدفاتر"}
              </button>
            </div>
          </form>
        </ParchmentCard>
      </motion.div>
    </div>
  );
};

export default AddRecipientModal;
