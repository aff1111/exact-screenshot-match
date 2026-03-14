import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import parchmentBg from "@/assets/parchment-bg.jpg";
import waxSeal from "@/assets/wax-seal.png";

type PageState = "loading" | "gate" | "answering" | "revealing" | "letters" | "error";

interface LetterInfo {
  id: string;
  content_type: string;
  is_read: boolean;
  order_index: number;
  created_at: string;
  questions: { id: string; question_text: string; question_order: number }[];
}

interface LetterContent {
  id: string;
  content: string;
  content_type: string;
  created_at: string;
  recipient_name?: string;
}

const RecipientPage = () => {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<PageState>("loading");
  const [letters, setLetters] = useState<LetterInfo[]>([]);
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<LetterInfo | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [letterContent, setLetterContent] = useState<LetterContent | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replySent, setReplySent] = useState(false);
  const [sealBroken, setSealBroken] = useState(false);
  const [scrollRevealed, setScrollRevealed] = useState(false);

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    if (!token) {
      setState("error");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("verify-recipient", {
        body: { token },
      });

      if (error || data?.error) {
        setState("error");
        return;
      }

      setRecipientId(data.recipient_id);
      setLetters(data.letters || []);
      setState("letters");
    } catch {
      setState("error");
    }
  };

  const handleSelectLetter = (letter: LetterInfo) => {
    setSelectedLetter(letter);
    setAnswers({});
    setSessionToken(null);
    setLetterContent(null);
    setSealBroken(false);
    setScrollRevealed(false);
    setReplySent(false);
    setReplyText("");
    setState("answering");
  };

  const handleAnswerSubmit = async () => {
    if (!selectedLetter) return;

    const allAnswered = selectedLetter.questions.every(
      (q) => answers[q.id]?.trim()
    );
    if (!allAnswered) {
      setError("يرجى الإجابة على جميع الأسئلة");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("answer-questions", {
        body: {
          letter_id: selectedLetter.id,
          answers: selectedLetter.questions.map((q) => ({
            question_id: q.id,
            answer: answers[q.id].trim(),
          })),
        },
      });

      if (fnError || data?.error) {
        setError(data?.error || "إجابات خاطئة. حاول مرة أخرى.");
        setLoading(false);
        return;
      }

      setSessionToken(data.session_token);
      setState("revealing");

      // Start seal break animation
      setTimeout(() => setSealBroken(true), 500);
      setTimeout(() => {
        setScrollRevealed(true);
        readLetter(selectedLetter.id, data.session_token);
      }, 2000);
    } catch {
      setError("حدث خطأ. حاول مرة أخرى.");
    }
    setLoading(false);
  };

  const readLetter = async (letterId: string, st: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("read-letter", {
        body: { letter_id: letterId, session_token: st },
      });

      if (error || data?.error) return;

      setLetterContent(data.letter);
    } catch {
      // Silent fail
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedLetter || !sessionToken) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-reply", {
        body: {
          letter_id: selectedLetter.id,
          session_token: sessionToken,
          content: replyText.trim(),
        },
      });

      if (!error && !data?.error) {
        setReplySent(true);
        setReplyText("");
      }
    } catch {
      // Silent fail
    }
    setLoading(false);
  };

  const goBackToLetters = () => {
    setSelectedLetter(null);
    setLetterContent(null);
    setSessionToken(null);
    setSealBroken(false);
    setScrollRevealed(false);
    setState("letters");
  };

  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundImage: `url(${parchmentBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="min-h-screen bg-parchment/70 flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {state === "loading" && (
            <motion.div
              key="loading"
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <img src={waxSeal} alt="" className="w-20 h-20 mx-auto animate-float mb-4" />
              <p className="font-amiri text-lg text-accent">جارٍ التحميل...</p>
            </motion.div>
          )}

          {state === "error" && (
            <motion.div
              key="error"
              className="text-center max-w-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <img src={waxSeal} alt="" className="w-20 h-20 mx-auto mb-4 grayscale opacity-50" />
              <p className="font-amiri text-xl text-secondary mb-2">عذراً</p>
              <p className="font-amiri text-muted-foreground">
                هذا الرابط غير صالح أو منتهي الصلاحية
              </p>
            </motion.div>
          )}

          {state === "letters" && (
            <motion.div
              key="letters"
              className="w-full max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              dir="rtl"
            >
              <div className="text-center mb-8">
                <img src={waxSeal} alt="" className="w-16 h-16 mx-auto mb-4" />
                <h1 className="font-cinzel-decorative text-2xl text-secondary mb-1">مكتوب</h1>
                <p className="font-amiri text-accent">لديك رسائل في انتظارك...</p>
              </div>

              <div className="grid gap-4">
                {letters.map((letter, i) => (
                  <motion.button
                    key={letter.id}
                    onClick={() => handleSelectLetter(letter)}
                    className="bg-parchment/80 border border-gold/30 rounded-sm p-6 text-right hover:border-gold hover:shadow-gold transition-all duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15 }}
                    whileHover={{ y: -3 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={waxSeal} alt="" className="w-10 h-10" />
                        <div>
                          <p className="font-amiri text-lg text-secondary">
                            {letter.content_type === "poetry" ? "📝 قصيدة" : "✉ رسالة"} #{i + 1}
                          </p>
                          <p className="font-cinzel text-xs text-muted-foreground">
                            {new Date(letter.created_at).toLocaleDateString("ar")}
                          </p>
                        </div>
                      </div>
                      {letter.is_read ? (
                        <span className="text-xs text-green-600 font-amiri">✓ مقروءة</span>
                      ) : (
                        <span className="text-xs text-primary font-amiri animate-glow-pulse">جديدة ✦</span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {state === "answering" && selectedLetter && (
            <motion.div
              key="answering"
              className="w-full max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              dir="rtl"
            >
              <div className="text-center mb-6">
                <motion.img
                  src={waxSeal}
                  alt=""
                  className="w-20 h-20 mx-auto mb-4"
                  animate={{ rotate: [0, 3, -3, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <h2 className="font-cinzel-decorative text-xl text-secondary mb-1">
                  بوابة الأسئلة
                </h2>
                <p className="font-amiri text-sm text-accent">
                  أجب على الأسئلة التالية لفتح الرسالة
                </p>
              </div>

              <div className="bg-parchment/80 border border-gold/30 rounded-sm p-6 space-y-4 shadow-parchment">
                {selectedLetter.questions.map((q, i) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.2 }}
                    className="space-y-1"
                  >
                    <label className="font-amiri text-sm text-ink block">{q.question_text}</label>
                    <input
                      type="text"
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      className="w-full bg-parchment border border-gold/30 rounded-sm px-3 py-2 font-amiri text-sm focus:outline-none focus:border-gold"
                      dir="rtl"
                    />
                  </motion.div>
                ))}

                {error && <p className="font-amiri text-destructive text-sm text-center">{error}</p>}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={goBackToLetters}
                    className="flex-1 py-2 font-cinzel text-xs text-accent border border-gold/30 rounded-sm hover:bg-parchment-dark"
                  >
                    رجوع
                  </button>
                  <motion.button
                    onClick={handleAnswerSubmit}
                    disabled={loading}
                    className="flex-[2] py-2 font-cinzel text-sm bg-secondary text-secondary-foreground border border-gold shadow-seal hover:bg-burgundy-light disabled:opacity-50 rounded-sm"
                    whileTap={{ scale: 0.97 }}
                  >
                    {loading ? "جارٍ التحقق..." : "افتح الرسالة ✦"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {state === "revealing" && (
            <motion.div
              key="revealing"
              className="w-full max-w-2xl text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Wax Seal Break Animation */}
              {!sealBroken && (
                <motion.div className="flex justify-center mb-8">
                  <motion.img
                    src={waxSeal}
                    alt=""
                    className="w-32 h-32"
                    animate={{
                      rotate: [0, -5, 5, -10, 10, 0],
                      scale: [1, 1.05, 1, 1.1, 0.9, 1],
                    }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                  />
                </motion.div>
              )}

              {sealBroken && !scrollRevealed && (
                <motion.div
                  className="flex justify-center mb-8"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0, scale: 1.5, rotate: 45 }}
                  transition={{ duration: 0.8 }}
                >
                  <img src={waxSeal} alt="" className="w-32 h-32" />
                </motion.div>
              )}

              {scrollRevealed && (
                <motion.div
                  className="bg-parchment/90 border border-gold/30 rounded-sm shadow-seal overflow-hidden"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  dir="rtl"
                >
                  <div className="p-8 md:p-12">
                    {/* Ornamental top */}
                    <div className="flex items-center gap-4 mb-8">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
                      <span className="text-gold text-xl">❈</span>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
                    </div>

                    {letterContent ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="relative"
                      >
                        {/* Royal Header */}
                        <div className="text-right mb-10 border-b-2 border-double border-gold/30 pb-6 pr-4 border-r-4 border-r-gold/40">
                          <p className="font-cinzel-decorative text-2xl text-secondary mb-2">من: أحمد</p>
                          <p className="font-amiri text-xl text-ink">
                            إلى: {letterContent.recipient_name || "صديقي الغالي"}
                          </p>
                          <p className="font-amiri text-sm text-accent mt-3">
                            حُرر في: {new Date(letterContent.created_at).toLocaleDateString("ar")}
                          </p>
                        </div>

                        {/* Letter Content */}
                        <div className={`font-amiri text-2xl text-ink leading-[2.5] whitespace-pre-wrap px-4 md:px-8 py-6 min-h-[200px] ${
                          letterContent.content_type === "poetry" ? "text-center" : "text-justify"
                        }`}>
                          {letterContent.content || "الرسالة فارغة..."}
                        </div>

                        {/* Royal Footer / Signature */}
                        <div className="mt-12 pt-6 border-t-2 border-double border-gold/30 text-center">
                          <img src={waxSeal} alt="" className="w-12 h-12 mx-auto mb-3 opacity-80" />
                          <p className="font-cinzel-decorative text-xl text-secondary">
                            أحمد
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="font-amiri text-muted-foreground animate-pulse">
                          جارٍ فك التشفير...
                        </p>
                      </div>
                    )}

                    {/* Ornamental bottom */}
                    <div className="flex items-center gap-4 mt-8">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
                      <span className="text-gold text-xl">❈</span>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
                    </div>

                    {/* Reply section */}
                    {letterContent && (
                      <motion.div
                        className="mt-8 pt-6 border-t border-gold/20"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5 }}
                      >
                        {replySent ? (
                          <motion.div
                            className="text-center py-4"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                          >
                            <img src={waxSeal} alt="" className="w-12 h-12 mx-auto mb-3" />
                            <p className="font-amiri text-lg text-secondary">تم إرسال ردّك بنجاح ✦</p>
                          </motion.div>
                        ) : (
                          <>
                            <p className="font-amiri text-sm text-accent mb-3">اكتب ردك:</p>
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              rows={4}
                              className="w-full bg-parchment border border-gold/30 rounded-sm px-4 py-3 font-amiri text-sm focus:outline-none focus:border-gold resize-none"
                              placeholder="ردّك هنا..."
                              dir="rtl"
                            />
                            <div className="flex gap-3 mt-3">
                              <button
                                onClick={goBackToLetters}
                                className="flex-1 py-2 font-cinzel text-xs text-accent border border-gold/30 rounded-sm hover:bg-parchment-dark"
                              >
                                العودة للرسائل
                              </button>
                              <motion.button
                                onClick={handleReply}
                                disabled={loading || !replyText.trim()}
                                className="flex-[2] py-2 font-cinzel text-sm bg-secondary text-secondary-foreground border border-gold shadow-seal hover:bg-burgundy-light disabled:opacity-50 rounded-sm"
                                whileTap={{ scale: 0.97 }}
                              >
                                {loading ? "جارٍ الإرسال..." : "إرسال الرد ✦"}
                              </motion.button>
                            </div>
                          </>
                        )}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RecipientPage;
