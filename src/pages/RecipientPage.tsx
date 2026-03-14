import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import parchmentBg from "@/assets/parchment-bg.jpg";
import waxSeal from "@/assets/wax-seal.png";
import { toast } from "sonner";
import InkWritingText from "@/components/InkWritingText";

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
      
      // We no longer auto-reveal the scroll. 
      // The user must click the seal to break it.
    } catch {
      setError("حدث خطأ. حاول مرة أخرى.");
    }
    setLoading(false);
  };

  const handleBreakSeal = () => {
    setSealBroken(true);
    setTimeout(() => {
      setScrollRevealed(true);
      if (selectedLetter && sessionToken) {
        readLetter(selectedLetter.id, sessionToken);
      }
    }, 1000);
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
              {!scrollRevealed && (
                <div className="flex flex-col items-center gap-6 mt-20">
                  <motion.div
                    className="relative cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={!sealBroken ? handleBreakSeal : undefined}
                  >
                    <AnimatePresence>
                      {!sealBroken ? (
                        <motion.img
                          key="seal-intact"
                          src={waxSeal}
                          alt="Click to break seal"
                          className="w-40 h-40 drop-shadow-2xl"
                          animate={{
                            rotate: [0, -2, 2, 0],
                            y: [0, -5, 0],
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                      ) : (
                        <motion.img
                          key="seal-broken"
                          src={waxSeal}
                          alt="Seal broken"
                          className="w-40 h-40 drop-shadow-2xl grayscale opacity-50"
                          initial={{ scale: 1, rotate: 0 }}
                          animate={{ 
                            scale: [1, 1.2, 1.5], 
                            rotate: [0, 10, -10], 
                            opacity: 0 
                          }}
                          transition={{ duration: 0.8 }}
                        />
                      )}
                    </AnimatePresence>
                    
                    {!sealBroken && (
                      <motion.div 
                        className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                      >
                        <p className="font-amiri text-secondary animate-pulse text-lg">انقر لكسر الختم الملكي</p>
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              )}

              {scrollRevealed && (
                <div className="w-full flex flex-col items-center gap-8 pb-12 overflow-hidden">
                  <motion.div
                    className="mx-auto shadow-2xl relative flex flex-col origin-top"
                    style={{
                      width: 'min(95vw, 700px)',
                      minHeight: 'min(140vw, 900px)',
                      backgroundImage: "url('/manuscript-bg.png')",
                      backgroundSize: "100% 100%",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "center",
                    }}
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                    dir="rtl"
                  >
                    <div className="flex-1 flex flex-col items-stretch relative z-10 w-full h-full px-12 pt-16 pb-12 md:px-20 md:pt-24 md:pb-16 text-right">
                      {letterContent ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1, duration: 1 }}
                          className="flex flex-col h-full"
                        >
                          {/* Top Section: Sender & Date (Right Aligned) */}
                          <div className="mb-8 space-y-1">
                            <p className="font-amiri text-lg md:text-xl text-secondary font-bold leading-none">
                              {letterContent.sender_name || "أحمد"}
                            </p>
                            <p className="font-amiri text-xs md:text-sm text-accent/60">
                              {new Date(letterContent.created_at).toLocaleDateString("ar-EG", { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>

                          {/* Center Section: Title */}
                          {letterContent.title && (
                            <div className="text-center mb-12">
                              <h2 className="font-amiri text-3xl md:text-4xl text-ink font-bold border-b border-gold/20 inline-block px-12 pb-4 italic">
                                {letterContent.title}
                              </h2>
                            </div>
                          )}

                          {/* Content Section: Ink Writing effect */}
                          <div className="flex-1 font-amiri text-xl md:text-2xl text-ink leading-[1.8] md:leading-[2.2] whitespace-pre-wrap mb-12">
                            <InkWritingText 
                              text={letterContent.content || "الرسالة في طريقها للتجلي..."} 
                              speed={40}
                            />
                          </div>

                          {/* Recipient Section */}
                          <div className="mb-10">
                            <p className="font-amiri text-lg md:text-xl text-secondary">
                              إلى: <span className="font-bold border-b border-gold/30 pb-1">{letterContent.recipient_name || "صديق مخلص"}</span>
                            </p>
                          </div>

                          {/* Bottom Section: Decorative Wax Seal */}
                          <div className="mt-auto text-center pt-8">
                            <motion.img 
                              src={waxSeal} 
                              alt="Royal Wax Seal" 
                              className="w-20 h-20 md:w-24 md:h-24 mx-auto opacity-90 drop-shadow-lg" 
                              initial={{ scale: 0, rotate: -45, opacity: 0 }}
                              animate={{ scale: 1, rotate: 0, opacity: 1 }}
                              transition={{ type: "spring", stiffness: 100, delay: 2 }}
                            />
                            <p className="font-amiri text-[10px] mt-4 text-accent/40 uppercase tracking-[0.2em] text-center">
                              سري للغاية • ٢٠٢٦
                            </p>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                          <motion.div
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="space-y-4"
                          >
                            <img src={waxSeal} alt="" className="w-12 h-12 mx-auto opacity-20" />
                            <p className="font-amiri text-xl text-accent/50 italic">
                              جارٍ استحضار المكتوب...
                            </p>
                          </motion.div>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {letterContent && (
                    <motion.div
                      className="w-full max-w-[700px] bg-parchment/80 backdrop-blur-md border border-gold/30 rounded-sm p-8 shadow-seal relative overflow-hidden mx-auto mt-4"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 2.5 }}
                      dir="rtl"
                    >
                      {replySent ? (
                        <motion.div
                          className="text-center py-8"
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                        >
                          <img src={waxSeal} alt="" className="w-16 h-16 mx-auto mb-4" />
                          <h3 className="font-amiri text-2xl text-secondary font-bold mb-2">تَمّ بَحثُ الرَدّ بنَجاح ✦</h3>
                          <p className="font-amiri text-base text-accent">سَيتم إخطار مُرسِل الرسالة برَدّك الملكي.</p>
                          <button 
                            onClick={goBackToLetters}
                            className="mt-8 font-cinzel text-xs tracking-widest text-secondary hover:text-secondary/80 underline decoration-gold/30 underline-offset-8"
                          >
                            العودة إلى الديوان الملكي
                          </button>
                        </motion.div>
                      ) : (
                        <div className="space-y-6 relative z-10 w-full">
                          <div className="flex items-center gap-4 mb-2">
                            <span className="text-secondary text-2xl">✒️</span>
                            <h3 className="font-amiri text-xl text-secondary font-bold tracking-wide">الـرد على المكتـوب</h3>
                          </div>
                          
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={4}
                            className="w-full bg-parchment/50 border border-gold/20 rounded-sm px-6 py-5 font-amiri text-xl text-ink focus:outline-none focus:border-gold/50 transition-all resize-none placeholder:text-accent/30 shadow-inner leading-relaxed"
                            placeholder="اكتب ردّك هنا بكلماتٍ تليق بمقام المُرسل..."
                            dir="rtl"
                          />
                          
                          <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            <button
                              onClick={goBackToLetters}
                              className="flex-1 py-4 font-amiri text-lg text-accent border border-gold/20 rounded-sm hover:bg-parchment-dark transition-colors"
                            >
                              العودة للرسائل
                            </button>
                            <motion.button
                              onClick={handleReply}
                              disabled={loading || !replyText.trim()}
                              className="flex-[2] py-4 font-amiri text-lg bg-secondary text-secondary-foreground border border-gold transition-all relative overflow-hidden group rounded-sm shadow-xl"
                              whileTap={{ scale: 0.98 }}
                            >
                              <span className="relative z-10 flex items-center justify-center gap-3">
                                {loading ? "جارٍ الإرسال..." : "إرسال الرَد الملكي ✦"}
                              </span>
                              <div className="absolute inset-0 bg-white/5 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
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
