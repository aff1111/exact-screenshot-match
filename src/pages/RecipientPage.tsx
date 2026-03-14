import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import parchmentBg from "@/assets/parchment-bg.jpg";
import waxSeal from "@/assets/wax-seal.png";
import { toast } from "sonner";

type PageState = "loading" | "gate" | "answering" | "revealing" | "letters" | "error";

interface LetterInfo {
  id: string;
  title?: string;
  content_type: "letter" | "poetry";
  created_at: string;
  unlock_at?: string | null;
  unlock_latitude?: number | null;
  unlock_longitude?: number | null;
  is_read: boolean;
  order_index: number;
  questions: { id: string; question_text: string; question_order: number }[];
}

interface LetterContent {
  id: string;
  title?: string;
  content: string;
  content_type: string;
  created_at: string;
  recipient_name?: string;
  sender_name?: string;
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

      if (!data) throw new Error("لم يتم العثور على الرسالة");
      
      if (data.locked) {
        toast.error(`هذه الرسالة مغلقة حتى ${new Date(data.unlock_at).toLocaleString("ar")}`, {
          icon: '🔒',
        });
        setScrollRevealed(false);
        setState("letters");
        return;
      }

      if (data.letter) {
        setLetterContent(data.letter);
      } else {
        setLetterContent({
          ...data,
          content: data.content || data.content_encrypted || "",
          sender_name: data.sender_name || "أحمد"
        });
      }
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
                {letters.map((letter, idx) => {
                  const isLocked = letter.unlock_at && new Date(letter.unlock_at) > new Date();
                  
                  return (
                    <motion.div
                      key={letter.id}
                      className={`group relative bg-parchment border border-gold/20 p-6 rounded-sm shadow-seal cursor-pointer hover:border-gold/50 transition-all ${
                        isLocked ? "opacity-70 grayscale-[0.5]" : ""
                      }`}
                      onClick={() => !isLocked && handleSelectLetter(letter)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + idx * 0.1 }}
                      whileHover={isLocked ? {} : { y: -4, scale: 1.02 }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <img 
                          src={waxSeal} 
                          alt="" 
                          className={`w-10 h-10 transition-transform group-hover:rotate-12 ${isLocked ? "sepia grayscale" : ""}`} 
                        />
                        <div className="text-left">
                          <span className={`font-cinzel text-[10px] tracking-widest px-2 py-0.5 border rounded-full ${
                            letter.content_type === "poetry" 
                              ? "bg-burgundy/10 text-secondary border-gold/30" 
                              : "bg-secondary/10 text-secondary border-gold/30"
                          }`}>
                            {letter.content_type === "poetry" ? "POETRY" : "LETTER"}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-amiri text-xl text-ink mb-1 group-hover:text-secondary transition-colors">
                        {letter.title || `رسالة رقم ${idx + 1}`}
                      </h3>
                      <div className="flex justify-between items-center mt-2">
                        <p className="font-amiri text-xs text-accent italic">
                          {new Date(letter.created_at).toLocaleDateString("ar")}
                        </p>
                        {letter.is_read ? (
                          <span className="text-[10px] text-green-600 font-amiri">✓ مقروءة</span>
                        ) : (
                          <span className="text-[10px] text-primary font-amiri animate-glow-pulse">جديدة ✦</span>
                        )}
                      </div>
                      
                      {isLocked ? (
                        <div className="mt-4 flex items-center gap-2 text-secondary font-amiri text-sm">
                          <span className="animate-pulse">🔒 مغلقة حتى {new Date(letter.unlock_at!).toLocaleString("ar")}</span>
                        </div>
                      ) : (
                        <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-gold font-cinzel text-[10px] tracking-widest uppercase">
                          Open Letter <span className="animate-bounce">⤖</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
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
              className="w-full max-w-4xl mx-auto flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
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
                <div className="w-full flex flex-col items-center gap-8 pb-12">
                  <motion.div
                    className="mx-auto shadow-2xl relative flex flex-col"
                    style={{
                      width: 'min(95vw, 650px)',
                      minHeight: 'min(140vw, 850px)',
                      backgroundImage: "url('/manuscript-bg.png')",
                      backgroundSize: "100% 100%",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "center",
                    }}
                    initial={{ opacity: 0, scale: 0.9, rotateX: -20 }}
                    animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                    dir="rtl"
                  >
                    <div className="flex-1 flex flex-col items-stretch relative z-10 w-full h-full p-[18%_14%_18%_14%]">
                      {letterContent ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5, duration: 1 }}
                          className="flex flex-col h-full overflow-hidden"
                        >
                          {/* Letter Header: Sender (Right) & Date (Left) */}
                          <div className="flex justify-between items-start mb-8 text-right underline-offset-4">
                            <div className="flex flex-col items-start order-2">
                              <p className="font-amiri text-base md:text-lg text-secondary font-bold">
                                من: {letterContent.sender_name || "أحمد"}
                              </p>
                            </div>
                            <div className="flex flex-col items-end order-1">
                              <p className="font-amiri text-[10px] md:text-xs text-accent opacity-70">
                                {new Date(letterContent.created_at).toLocaleDateString("ar-EG", { year: 'numeric', month: 'long', day: 'numeric' })}
                              </p>
                            </div>
                          </div>

                          {/* Center Top: Title */}
                          {letterContent.title && (
                            <div className="text-center mb-10">
                              <h2 className="font-amiri text-2xl md:text-3xl text-ink font-bold border-b-2 border-gold/10 inline-block px-12 pb-2">
                                {letterContent.title}
                              </h2>
                            </div>
                          )}

                          {/* Middle: Letter Body content */}
                          <div className={`flex-1 font-amiri text-xl md:text-2xl text-ink leading-[1.8] md:leading-[2.2] whitespace-pre-wrap overflow-y-auto scrollbar-hide text-right px-2 min-h-[200px]`}>
                            {letterContent.content || "الرسالة في طريقها للتجلي..."}
                          </div>

                          {/* Lower: Recipient Name */}
                          <div className="mt-10 mb-6 text-right">
                            <p className="font-amiri text-lg md:text-xl text-secondary border-r-4 border-gold/40 pr-3 py-1 font-bold">
                              إلى: {letterContent.recipient_name || "صديق مخلص"}
                            </p>
                          </div>

                          {/* Bottom Center: Wax Seal */}
                          <div className="text-center mt-auto pt-4 pb-2">
                            <motion.img 
                              src={waxSeal} 
                              alt="Royal Wax Seal" 
                              className="w-16 h-16 md:w-20 md:h-20 mx-auto opacity-100 drop-shadow-md" 
                              initial={{ scale: 0, rotate: -45 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", stiffness: 200, delay: 2 }}
                            />
                            <p className="font-amiri text-[8px] mt-2 text-accent opacity-30 uppercase tracking-widest text-center">Maktoob © 2026</p>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-center">
                          <p className="font-amiri text-xl text-muted-foreground animate-pulse">
                            جارٍ فك التشفير...
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {letterContent && (
                    <motion.div
                      className="w-full max-w-[650px] bg-parchment/60 backdrop-blur-md border border-gold/30 rounded-sm p-6 shadow-seal relative overflow-hidden mx-auto"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.5 }}
                      dir="rtl"
                    >
                      <div className="absolute top-0 left-0 w-24 h-24 bg-gold/5 blur-2xl rounded-full -translate-x-12 -translate-y-12" />
                      
                      {replySent ? (
                        <motion.div
                          className="text-center py-6"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                        >
                          <img src={waxSeal} alt="" className="w-14 h-14 mx-auto mb-3" />
                          <p className="font-amiri text-xl text-secondary font-bold">تَمّ بَحثُ الرَدّ بنَجاح ✦</p>
                          <p className="font-amiri text-sm text-accent mt-2">سَيتم إخطار مُرسِل الرسالة برَدّك.</p>
                          <button 
                            onClick={goBackToLetters}
                            className="mt-6 font-cinzel text-xs tracking-widest text-secondary hover:underline"
                          >
                            العودة إلى الديوان
                          </button>
                        </motion.div>
                      ) : (
                        <div className="space-y-4 relative z-10 w-full">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-gold text-xl">📜</span>
                            <h3 className="font-cinzel text-sm text-secondary tracking-widest uppercase">الرد على المكتوب</h3>
                          </div>
                          
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={4}
                            className="w-full bg-parchment/40 border border-gold/20 rounded-sm px-4 py-4 font-amiri text-lg text-ink focus:outline-none focus:border-gold transition-all resize-none placeholder:text-accent/30 shadow-inner"
                            placeholder="اكتب ردّك هنا بكلماتٍ تليق..."
                            dir="rtl"
                          />
                          
                          <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                              onClick={goBackToLetters}
                              className="flex-1 py-3 font-cinzel text-xs text-accent border border-gold/30 rounded-sm hover:bg-parchment-dark transition-colors uppercase tracking-widest"
                            >
                              العودة للرسائل
                            </button>
                            <motion.button
                              onClick={handleReply}
                              disabled={loading || !replyText.trim()}
                              className="flex-[2] py-3 font-cinzel text-sm bg-secondary text-secondary-foreground border border-gold shadow-seal hover:bg-burgundy-light disabled:opacity-50 rounded-sm transition-all relative overflow-hidden group"
                              whileTap={{ scale: 0.98 }}
                            >
                              <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? "جارٍ الإرسال..." : "إرسال الرَد الملكي ✦"}
                              </span>
                              <div className="absolute inset-0 bg-gold/10 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                            </motion.button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RecipientPage;
