import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLetters } from "@/hooks/useLetters";
import { toast } from "sonner";
import ParchmentCard from "@/components/ui/ParchmentCard";
import { cn } from "@/lib/utils";

interface Props {
  adminId: string;
  recipients: any[];
  onClose: () => void;
  onSuccess: () => void;
}

const ComposeLetterModal = ({ adminId, recipients, onClose, onSuccess }: Props) => {
  const { sendLetter, isSending } = useLetters(adminId);
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [securityQuestions, setSecurityQuestions] = useState<Array<{ question: string; answer: string }>>([
    { question: "", answer: "" },
    { question: "", answer: "" },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipient || !title || !content) {
      return toast.error("يرجى ملء جميع البيانات الملكية");
    }

    try {
      const questions = securityQuestions
        .filter((q) => q.question.trim() && q.answer.trim())
        .map((q) => ({ question: q.question.trim(), answer: q.answer.trim() }));

      await sendLetter({
        recipientId: selectedRecipient,
        title,
        content,
        securityQuestions: questions,
      });

      toast.success("تم إرسال الرسالة إلى الخزنة الملكية");
      onSuccess();
    } catch (err: any) {
      toast.error(`خطأ: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
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
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl rounded-sm"
      >
        <ParchmentCard className="p-0 flex flex-col h-full overflow-y-auto">
          {/* Header */}
          <div className="p-8 border-b border-gold/10 flex justify-between items-center sticky top-0 bg-parchment/80 backdrop-blur-sm z-20">
            <div>
              <h2 className="font-cinzel text-2xl text-secondary">إنشاء وثيقة ملكية</h2>
              <p className="font-amiri text-ink/50">صِغ كلماتك بعناية لتُحفظ في الخزنة</p>
            </div>
            <button onClick={onClose} className="text-2xl text-ink/40 hover:text-secondary p-2 transition-colors">✕</button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="font-cinzel text-[10px] tracking-widest uppercase text-ink/40">المستلم المقصود</label>
                <select 
                  value={selectedRecipient}
                  onChange={(e) => setSelectedRecipient(e.target.value)}
                  className="input-royal w-full appearance-none"
                >
                  <option value="">اختر المستلم...</option>
                  {recipients.map(r => (
                    <option key={r.id} value={r.id}>{r.display_label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="font-cinzel text-[10px] tracking-widest uppercase text-ink/40">عنوان الوثيقة</label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثلاً: مرسوم ملكي عاجل"
                  className="input-royal w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {securityQuestions.map((item, index) => (
                <div key={index} className="space-y-2">
                  <label className="font-cinzel text-[10px] tracking-widest uppercase text-ink/40">سؤال أمان {index + 1}</label>
                  <input
                    type="text"
                    value={item.question}
                    onChange={(e) => {
                      const updated = [...securityQuestions];
                      updated[index].question = e.target.value;
                      setSecurityQuestions(updated);
                    }}
                    placeholder="ما هو اسمك المفضل..."
                    className="input-royal w-full"
                    dir="rtl"
                  />
                  <input
                    type="text"
                    value={item.answer}
                    onChange={(e) => {
                      const updated = [...securityQuestions];
                      updated[index].answer = e.target.value;
                      setSecurityQuestions(updated);
                    }}
                    placeholder="الإجابة السرية..."
                    className="input-royal w-full"
                    dir="rtl"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <label className="font-cinzel text-[10px] tracking-widest uppercase text-ink/40">محتوى الرسالة</label>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="اكتب هنا بمداد الذهب..."
                className="input-royal w-full min-h-[300px] resize-none leading-relaxed text-lg"
                dir="rtl"
              />
            </div>

            <div className="pt-6 border-t border-gold/10 flex justify-end gap-4">
              <button 
                type="button" 
                onClick={onClose}
                className="btn-royal bg-transparent border-gold/20 text-ink/60 px-8"
              >
                إلغاء
              </button>
              <button 
                type="submit"
                disabled={isSending}
                className="btn-gold px-12 py-4"
              >
                {isSending ? "جارٍ التوثيق..." : "ختم وإرسال الرسالة"}
              </button>
            </div>
          </form>
        </ParchmentCard>
      </motion.div>
    </div>
  );
};

export default ComposeLetterModal;
