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

interface Question {
  question: string;
  answer: string;
}

interface Props {
  adminId: string;
  recipients: Recipient[];
  onClose: () => void;
  onSuccess: () => void;
}

const ComposeLetterModal = ({ adminId, recipients, onClose, onSuccess }: Props) => {
  const [recipientId, setRecipientId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [contentType, setContentType] = useState<"letter" | "poetry">("letter");
  const [unlockAt, setUnlockAt] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([{ question: "", answer: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addQuestion = () => {
    if (questions.length >= 5) return;
    setQuestions([...questions, { question: "", answer: "" }]);
  };

  const removeQuestion = (i: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, idx) => idx !== i));
  };

  const updateQuestion = (i: number, field: "question" | "answer", value: string) => {
    const updated = [...questions];
    updated[i][field] = value;
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    if (!recipientId || !title.trim() || !content.trim() || questions.some((q) => !q.question.trim() || !q.answer.trim())) {
      setError("يرجى ملء جميع الحقول بما فيها عنوان الرسالة");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        recipient_id: recipientId,
        title: title.trim(),
        content: content.trim(),
        content_type: contentType,
        unlock_at: unlockAt || null,
        questions: questions.map((q) => ({
          question: q.question.trim(),
          answer: q.answer.trim(),
        })),
      };

      const { data, error: fnError } = await supabase.functions.invoke("admin-send-letter", {
        body: payload,
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      onSuccess();
    } catch (err: any) {
      setError(err.message || "حدث خطأ");
    }
    setLoading(false);
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
          <h2 className="font-cinzel text-xl text-secondary">كتابة رسالة جديدة</h2>
          <button onClick={onClose} className="text-accent hover:text-secondary text-xl">✕</button>
        </div>

        <div className="space-y-5">
          {/* Recipient */}
          <div>
            <label className="font-amiri text-sm text-accent block mb-1">المستلم</label>
            <select
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className="w-full bg-parchment border border-gold/30 rounded-sm px-3 py-2 font-amiri text-sm focus:outline-none focus:border-gold"
            >
              <option value="">اختر مستلمًا...</option>
              {recipients.filter(r => r.is_active).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.display_label || r.id}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="font-amiri text-sm text-accent block mb-1">عنوان الرسالة أو القصيدة</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: رسالة إلى صديقي، قصيدة عتاب..."
              className="w-full bg-parchment border border-gold/30 rounded-sm px-3 py-2 font-amiri text-sm focus:outline-none focus:border-gold"
              dir="rtl"
            />
          </div>

          {/* Content Type */}
          <div>
            <label className="font-amiri text-sm text-accent block mb-1">نوع الرسالة</label>
            <div className="flex gap-3">
              {(["letter", "poetry"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setContentType(type)}
                  className={`px-4 py-2 rounded-sm font-amiri text-sm border transition-colors ${
                    contentType === type
                      ? "bg-secondary text-secondary-foreground border-gold"
                      : "bg-parchment/60 text-accent border-gold/20"
                  }`}
                >
                  {type === "letter" ? "✉ رسالة" : "📝 شعر"}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="font-amiri text-sm text-accent block mb-1">محتوى الرسالة</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full bg-parchment border border-gold/30 rounded-sm px-3 py-2 font-amiri text-sm focus:outline-none focus:border-gold resize-none"
              placeholder={contentType === "poetry" ? "اكتب أبياتك هنا..." : "اكتب رسالتك هنا..."}
              dir="rtl"
            />
          </div>

          {/* Security Questions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-amiri text-sm text-accent">أسئلة الأمان</label>
              {questions.length < 5 && (
                <button
                  type="button"
                  onClick={addQuestion}
                  className="font-cinzel text-xs text-primary hover:underline"
                >
                  + إضافة سؤال
                </button>
              )}
            </div>
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={i} className="bg-parchment-dark/30 border border-gold/10 rounded-sm p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-cinzel text-xs text-accent">سؤال {i + 1}</span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(i)}
                        className="text-destructive text-xs hover:underline"
                      >
                        حذف
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => updateQuestion(i, "question", e.target.value)}
                    placeholder="السؤال..."
                    className="w-full bg-parchment border border-gold/20 rounded-sm px-3 py-1.5 font-amiri text-sm focus:outline-none focus:border-gold"
                    dir="rtl"
                  />
                  <input
                    type="text"
                    value={q.answer}
                    onChange={(e) => updateQuestion(i, "answer", e.target.value)}
                    placeholder="الإجابة الصحيحة..."
                    className="w-full bg-parchment border border-gold/20 rounded-sm px-3 py-1.5 font-amiri text-sm focus:outline-none focus:border-gold"
                    dir="rtl"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Vision 2035: Time-Locking */}
          <div className="space-y-2 pt-4 border-t border-gold/10">
            <label className="flex items-center gap-2 text-xs font-cinzel text-accent uppercase tracking-widest">
              <span className="text-gold">🔒</span> إقفال زمني (اختياري)
            </label>
            <input
              type="datetime-local"
              value={unlockAt}
              onChange={(e) => setUnlockAt(e.target.value)}
              className="w-full bg-parchment-dark/30 border border-gold/20 rounded-sm px-4 py-3 font-amiri text-sm focus:outline-none focus:border-gold transition-colors"
              dir="rtl"
            />
            <p className="text-[10px] text-muted-foreground font-amiri">
              لن يتمكن المستلم من فتح هذه الرسالة قبل الوقت المحدد أعلاه.
            </p>
          </div>

          {error && <p className="font-amiri text-destructive text-sm text-center">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 font-cinzel text-xs tracking-widest uppercase bg-transparent text-accent border border-gold/30 rounded-sm hover:bg-parchment-dark"
            >
              إلغاء
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-[2] py-3 font-cinzel text-sm tracking-widest uppercase bg-secondary text-secondary-foreground border border-gold shadow-seal hover:bg-burgundy-light transition-colors disabled:opacity-50 rounded-sm"
            >
              {loading ? "جارٍ الإرسال..." : "إرسال الرسالة ✦"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ComposeLetterModal;
