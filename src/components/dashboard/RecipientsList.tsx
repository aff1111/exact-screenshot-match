import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

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

const RecipientsList = ({ recipients, onSelectRecipient, onRefresh }: Props) => {
  const [toggling, setToggling] = useState<string | null>(null);

  const toggleActive = async (id: string, currentState: boolean) => {
    setToggling(id);
    await supabase
      .from("recipients")
      .update({ is_active: !currentState })
      .eq("id", id);
    onRefresh();
    setToggling(null);
  };

  return (
    <div className="space-y-4">
      <h2 className="font-cinzel text-xl text-secondary" dir="rtl">المستلمون</h2>

      {recipients.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-amiri text-lg text-muted-foreground">لا يوجد مستلمون بعد</p>
          <p className="font-cinzel text-xs text-accent mt-2">أضف مستلمًا جديدًا للبدء</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full" dir="rtl">
            <thead>
              <tr className="border-b border-gold/30">
                <th className="font-cinzel text-xs text-accent py-3 px-4 text-right">المستلم</th>
                <th className="font-cinzel text-xs text-accent py-3 px-4 text-center">الزيارات</th>
                <th className="font-cinzel text-xs text-accent py-3 px-4 text-center">تاريخ الإنشاء</th>
                <th className="font-cinzel text-xs text-accent py-3 px-4 text-center">الحالة</th>
                <th className="font-cinzel text-xs text-accent py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {recipients.map((r, i) => (
                <motion.tr
                  key={r.id}
                  className="border-b border-gold/10 hover:bg-parchment-dark/30 cursor-pointer transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onSelectRecipient(r)}
                >
                  <td className="font-amiri text-sm text-ink py-3 px-4">
                    {r.display_label || "بدون اسم"}
                  </td>
                  <td className="font-cinzel text-sm text-center py-3 px-4">
                    {r.use_count || 0}
                  </td>
                  <td className="font-cinzel text-xs text-muted-foreground text-center py-3 px-4">
                    {new Date(r.created_at).toLocaleDateString("ar")}
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`inline-block text-xs px-2 py-1 rounded-sm font-cinzel ${
                      r.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {r.is_active ? "نشط" : "معطّل"}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleActive(r.id, r.is_active)}
                      disabled={toggling === r.id}
                      className="font-cinzel text-xs text-accent border border-gold/30 px-3 py-1 rounded-sm hover:bg-parchment-dark transition-colors disabled:opacity-50"
                    >
                      {toggling === r.id ? "..." : r.is_active ? "تعطيل" : "تفعيل"}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecipientsList;
