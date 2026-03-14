import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import EditSecurityQuestionsModal from "./EditSecurityQuestionsModal";

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
  const [regeneratingFor, setRegeneratingFor] = useState<Recipient | null>(null);
  const [generatedLink, setGeneratedLink] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [deletingFor, setDeletingFor] = useState<Recipient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingQuestionsFor, setEditingQuestionsFor] = useState<Recipient | null>(null);

  const toggleActive = async (id: string, currentState: boolean) => {
    setToggling(id);
    await supabase
      .from("recipients")
      .update({ is_active: !currentState })
      .eq("id", id);
    onRefresh();
    setToggling(null);
  };

  const handleRegenerateClick = (e: React.MouseEvent, r: Recipient) => {
    e.stopPropagation();
    setRegeneratingFor(r);
    setGeneratedLink("");
    setError("");
  };

  const handleConfirmRegenerate = async () => {
    if (!regeneratingFor) return;
    setIsGenerating(true);
    setError("");

    try {
      const rawToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const { data: tokenHash, error: hashError } = await supabase.rpc("hash_answer", {
        p_answer: rawToken,
      });

      if (hashError) throw hashError;

      const { error: updateError } = await supabase
        .from("recipients")
        .update({ token_hash: tokenHash })
        .eq("id", regeneratingFor.id);

      if (updateError) throw updateError;

      const baseUrl = window.location.origin;
      setGeneratedLink(`${baseUrl}/s/${rawToken}`);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء إنشاء الرابط");
    }
    
    setIsGenerating(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, r: Recipient) => {
    e.stopPropagation();
    setDeletingFor(r);
    setError("");
  };

  const handleConfirmDelete = async () => {
    if (!deletingFor) return;
    setIsDeleting(true);
    setError("");

    try {
      const { error: deleteError } = await supabase
        .from("recipients")
        .delete()
        .eq("id", deletingFor.id);

      if (deleteError) throw deleteError;

      onRefresh();
      setDeletingFor(null);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء الحذف");
    }
    
    setIsDeleting(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
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
                  <td className="text-center py-3 px-4 flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleActive(r.id, r.is_active);
                      }}
                      disabled={toggling === r.id}
                      className="font-cinzel text-xs text-accent border border-gold/30 px-3 py-1 rounded-sm hover:bg-parchment-dark transition-colors disabled:opacity-50"
                    >
                      {toggling === r.id ? "..." : r.is_active ? "تعطيل" : "تفعيل"}
                    </button>
                    <button
                      onClick={(e) => handleRegenerateClick(e, r)}
                      className="font-cinzel text-xs text-secondary border border-secondary/50 px-3 py-1 rounded-sm hover:bg-secondary/10 transition-colors"
                    >
                      رابط جديد
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingQuestionsFor(r); }}
                      className="font-cinzel text-xs text-primary border border-primary/50 px-3 py-1 rounded-sm hover:bg-primary/10 transition-colors"
                    >
                      تعديل الأسئلة
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, r)}
                      className="font-cinzel text-xs text-destructive border border-destructive/50 px-3 py-1 rounded-sm hover:bg-destructive/10 transition-colors"
                    >
                      حذف
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Regenerate Link Modal */}
      {regeneratingFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            className="bg-parchment border border-gold/30 rounded-sm p-6 w-full max-w-md shadow-seal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-cinzel text-xl text-secondary">إعادة إنشاء رابط</h2>
              {generatedLink ? null : (
                <button onClick={() => setRegeneratingFor(null)} className="text-accent hover:text-secondary text-xl">✕</button>
              )}
            </div>

            {generatedLink ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-sm p-4">
                  <p className="font-amiri text-green-800 text-sm mb-2">✓ تم إنشاء رابط جديد بنجاح للمستلم!</p>
                  <p className="font-amiri text-xs text-muted-foreground mb-3">
                    انسخ الرابط وأرسله للمستلم. الرابط القديم لن يعمل بعد الآن.
                  </p>
                  <div className="bg-parchment border border-gold/30 rounded-sm p-2 break-all font-mono text-xs text-left" dir="ltr">
                    {generatedLink}
                  </div>
                  <button
                    onClick={copyLink}
                    className="mt-3 w-full py-2 font-cinzel text-xs bg-secondary text-secondary-foreground border border-gold rounded-sm hover:bg-burgundy-light"
                  >
                    نسخ الرابط
                  </button>
                </div>
                <button
                  onClick={() => {
                    setRegeneratingFor(null);
                    setGeneratedLink("");
                    onRefresh();
                  }}
                  className="w-full py-2 font-cinzel text-xs text-accent border border-gold/30 rounded-sm hover:bg-parchment-dark"
                >
                  إغلاق
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="font-amiri text-sm text-ink mb-4">
                  هل أنت متأكد من إنشاء رابط جديد لـ <span className="font-bold text-secondary">{regeneratingFor.display_label}</span>؟
                  <br /><br />
                  <span className="text-destructive">الرابط القديم سيتوقف عن العمل فوراً، ولن يتمكن المستلم من الدخول إلا بالرابط الجديد.</span>
                </p>

                {error && <p className="font-amiri text-destructive text-sm text-center">{error}</p>}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setRegeneratingFor(null)}
                    disabled={isGenerating}
                    className="flex-1 py-2 font-cinzel text-xs text-accent border border-gold/30 rounded-sm hover:bg-parchment-dark disabled:opacity-50"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleConfirmRegenerate}
                    disabled={isGenerating}
                    className="flex-[2] py-2 font-cinzel text-sm bg-destructive text-destructive-foreground border border-destructive/50 shadow-seal hover:bg-destructive/90 transition-colors disabled:opacity-50 rounded-sm"
                  >
                    {isGenerating ? "جارٍ الإنشاء..." : "إنشاء رابط جديد"}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            className="bg-parchment border border-destructive/50 rounded-sm p-6 w-full max-w-md shadow-seal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-cinzel text-xl text-destructive">تأكيد الحذف</h2>
              <button onClick={() => setDeletingFor(null)} className="text-accent hover:text-secondary text-xl">✕</button>
            </div>

            <div className="space-y-4">
              <p className="font-amiri text-sm text-ink mb-4">
                هل أنت متأكد من حذف المستلم <span className="font-bold text-destructive">{deletingFor.display_label}</span>؟
                <br /><br />
                <span className="text-destructive font-bold">هذا الإجراء سيقوم بحذف جميع الرسائل وأسئلة الأمان المرتبطة بهذا المستلم بشكل نهائي! لا يمكن التراجع عن هذا الإجراء.</span>
              </p>

              {error && <p className="font-amiri text-destructive text-sm text-center">{error}</p>}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setDeletingFor(null)}
                  disabled={isDeleting}
                  className="flex-1 py-2 font-cinzel text-xs text-accent border border-gold/30 rounded-sm hover:bg-parchment-dark disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-[2] py-2 font-cinzel text-sm bg-destructive text-destructive-foreground border border-destructive/50 shadow-seal hover:bg-destructive/90 transition-colors disabled:opacity-50 rounded-sm"
                >
                  {isDeleting ? "جارٍ الحذف..." : "تأكيد الحذف ✕"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Security Questions Modal */}
      {editingQuestionsFor && (
        <EditSecurityQuestionsModal
          recipientId={editingQuestionsFor.id}
          onClose={() => setEditingQuestionsFor(null)}
          onSuccess={() => {
            setEditingQuestionsFor(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

export default RecipientsList;
