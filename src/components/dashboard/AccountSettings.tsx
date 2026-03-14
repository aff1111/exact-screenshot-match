import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  adminId: string;
}

const AccountSettings = ({ adminId }: Props) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { data: admin, isLoading } = useQuery({
    queryKey: ["admin_user", adminId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_users")
        .select("*")
        .eq("id", adminId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (pwd: string) => {
      const { error } = await supabase.auth.updateUser({ password: pwd });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تحديث كلمة المرور الملكية بنجاح");
      setPassword("");
      setConfirmPassword("");
    },
    onError: (err) => toast.error(`خطأ: ${err.message}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error("كلمات المرور غير متطابقة");
    }
    if (password.length < 8) {
      return toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
    }
    updatePasswordMutation.mutate(password);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="px-2">
        <h2 className="font-cinzel text-xl text-secondary flex items-center gap-3">
          <span className="text-gold opacity-50">⚙️</span>
          إعدادات الحصن الملكي
        </h2>
        <p className="font-amiri text-ink/50 mt-1">أدر بيانات دخولك وإعدادات أمان حسابك</p>
      </div>

      <div className="space-y-6">
        {/* Profile Info */}
        <div className="bg-white/40 border border-gold/10 rounded-sm p-6 space-y-4">
          <h3 className="font-cinzel text-xs text-ink/40 tracking-widest uppercase">البيانات العامة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="font-amiri text-sm text-ink/60 block">اسم العرض</label>
              <div className="font-amiri text-lg text-secondary">{admin?.display_name || "المسؤول الملكي"}</div>
            </div>
            <div className="space-y-1">
              <label className="font-amiri text-sm text-ink/60 block">المستوى</label>
              <div className="font-cinzel text-xs text-gold tracking-widest uppercase">SUPREME ADMIN</div>
            </div>
          </div>
        </div>

        {/* Security / Password Change */}
        <form onSubmit={handleSubmit} className="bg-white/40 border border-gold/10 rounded-sm p-6 space-y-6">
          <h3 className="font-cinzel text-xs text-ink/40 tracking-widest uppercase">تغيير السر الملكي</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="font-amiri text-sm text-ink/70">كلمة المرور الجديدة</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-royal w-full"
                placeholder="********"
              />
            </div>
            
            <div className="space-y-2">
              <label className="font-amiri text-sm text-ink/70">تأكيد كلمة المرور</label>
              <input 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-royal w-full"
                placeholder="********"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={updatePasswordMutation.isPending}
            className="btn-gold w-full py-3"
          >
            {updatePasswordMutation.isPending ? "جارٍ التحديث..." : "حفظ التغييرات الملكية"}
          </button>
        </form>

        {/* Audit / Sessions Info */}
        <div className="p-4 border border-gold/5 bg-gold/5 rounded-sm">
          <p className="font-amiri text-[11px] text-ink/40 text-center leading-relaxed">
            يتم تسجيل كافة العمليات الإدارية في سجل الأمان الملكي.<br />
            تغيير كلمة المرور سيقوم بإنهاء كافة الجلسات النشطة الأخرى فوراً.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
