import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  recipientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface QuestionState {
  id: string;
  question: string;
  answer: string;
}

const EditSecurityQuestionsModal = ({ recipientId, onClose, onSuccess }: Props) => {
  const [questions, setQuestions] = useState<QuestionState[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [letterId, setLetterId] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoadingContent(true);
        setError("");
        
        // Fetch the most recent letter for this recipient
        const { data: letters, error: lettersError } = await supabase
          .from("letters")
          .select("id")
          .eq("recipient_id", recipientId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (lettersError) throw lettersError;

        if (!letters || letters.length === 0) {
          setError("لا توجد رسالة مرفقة بأسئلة لهذا المستلم.");
          setLoadingContent(false);
          return;
        }

        const lId = letters[0].id;
        setLetterId(lId);

        // Fetch security questions for this letter
        const { data: qs, error: qsError } = await supabase
          .from("security_questions")
          .select("id, question_text, question_order")
          .eq("letter_id", lId)
          .order("question_order", { ascending: true });

        if (qsError) throw qsError;

        if (qs) {
          setQuestions(
            qs.map((q) => ({
              id: q.id,
              question: q.question_text,
              answer: "", // Empty to indicate no change to the password hash
            }))
          );
        }
      } catch (err: any) {
        setError(err.message || "فشل في تحميل الأسئلة.");
      }
      setLoadingContent(false);
    };

    fetchQuestions();
  }, [recipientId]);

  const updateQuestion = (i: number, field: "question" | "answer", value: string) => {
    const updated = [...questions];
    updated[i][field] = value;
    setQuestions(updated);
  };

  const handleSave = async () => {
    if (!letterId) return;
    
    // Validate that questions are not empty
    if (questions.some((q) => !q.question.trim())) {
      setError("لا يمكن ترك نص السؤال فارغاً.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      for (const q of questions) {
        const updateData: any = { question_text: q.question.trim() };

        if (q.answer.trim()) {
          // Hash new answer if provided
          const { data: hash, error: hashError } = await supabase.rpc("hash_answer", {
            p_answer: q.answer.toLowerCase().trim(),
          });
          
          if (hashError) throw hashError;
          updateData.answer_hash = hash;
        }

        const { error: updateError } = await supabase
          .from("security_questions")
          .update(updateData)
          .eq("id", q.id);

        if (updateError) throw updateError;
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء حفظ الأسئلة.");
    }

    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        className="bg-parchment border border-gold/30 rounded-sm p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-seal"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        dir="rtl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-cinzel text-xl text-secondary">تعديل أسئلة الأمان</h2>
          <button onClick={onClose} className="text-accent hover:text-secondary text-xl">✕</button>
        </div>

        {loadingContent ? (
          <div className="text-center py-10 font-amiri text-accent animate-pulse">
            جاري التنزيل...
          </div>
        ) : error ? (
          <div className="space-y-6 text-center">
            <p className="font-amiri text-destructive text-lg">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 font-cinzel text-sm text-accent border border-gold/30 rounded-sm hover:bg-parchment-dark"
            >
              إغلاق
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="font-amiri text-sm text-ink/70">
              يمكنك تعديل نصوص الأسئلة. إذا قمت بكتابة إجابة جديدة سيتم تشفيرها واستبدال الإجابة القديمة. (اترك حقل الإجابة فارغاً للإبقاء على الإجابة الحالية كما هي).
            </p>

            <div className="space-y-4">
              {questions.map((q, i) => (
                <div key={q.id} className="bg-parchment-dark/30 border border-gold/20 rounded-sm p-4 space-y-3 relative">
                  <span className="absolute top-2 left-3 font-cinzel text-[10px] text-accent/50">ID: {q.id.split('-')[0]}</span>
                  <label className="font-cinzel text-sm text-secondary block">سؤال {i + 1}</label>
                  
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => updateQuestion(i, "question", e.target.value)}
                    placeholder="السؤال..."
                    className="w-full bg-parchment border border-gold/30 rounded-sm px-3 py-2 font-amiri text-sm focus:outline-none focus:border-gold"
                  />
                  
                  <input
                    type="text"
                    value={q.answer}
                    onChange={(e) => updateQuestion(i, "answer", e.target.value)}
                    placeholder="إجابة جديدة (اختياري)..."
                    className="w-full bg-parchment border border-gold/30 rounded-sm px-3 py-2 font-amiri text-sm focus:outline-none focus:border-gold"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gold/20">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 py-3 font-cinzel text-xs uppercase bg-transparent text-accent border border-gold/30 rounded-sm hover:bg-parchment-dark disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-[2] py-3 font-cinzel text-sm uppercase bg-secondary text-secondary-foreground border border-gold shadow-seal hover:bg-burgundy-light transition-colors disabled:opacity-50 rounded-sm"
              >
                {isSaving ? "جارٍ الحفظ..." : "حفظ التعديلات ✦"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default EditSecurityQuestionsModal;
