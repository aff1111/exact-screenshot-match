import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import InkWritingText from "@/components/InkWritingText";
import ParchmentCard from "@/components/ui/ParchmentCard";
import { cn } from "@/lib/utils";

// Asset placeholders (using generated themes)
const WAX_SEAL_URL = "https://raw.githubusercontent.com/the-asmar/maktoob-assets/main/wax-seal.png";

type PageState = "loading" | "gate" | "answering" | "revealing" | "reading" | "error";

const RecipientPage = () => {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<PageState>("loading");
  const [letters, setLetters] = useState<any[]>([]);
  const [recipient, setRecipient] = useState<any>(null);
  const [selectedLetter, setSelectedLetter] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sealBroken, setSealBroken] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecipientData();
  }, [token]);

  const fetchRecipientData = async () => {
    if (!token) return setState("error");
    
    try {
      // Professional RPC call to verify recipient securely
      const { data, error } = await supabase.rpc("verify_recipient_link" as any, { p_token: token }) as { data: any, error: any };
      if (error || !data) throw error;

      setRecipient(data.recipient);
      setLetters(data.letters || []);
      setState("gate");
    } catch (err) {
      console.error("Verification error:", err);
      setState("error");
    }
  };

  const handleSelectLetter = (letter: any) => {
    setSelectedLetter(letter);
    if (letter.questions && letter.questions.length > 0) {
      setState("answering");
    } else {
      setState("revealing");
    }
  };

  const handleVerifyQuestions = async () => {
    setLoading(true);
    // Logic to verify questions via RPC
    // For now mocking success for UI flow
    setTimeout(() => {
      setState("revealing");
      setLoading(false);
    }, 1500);
  };

  const handleBreakSeal = () => {
    setSealBroken(true);
    setTimeout(() => setState("reading"), 1000);
  };

  return (
    <div className="min-h-screen bg-[#0f0a05] selection:bg-gold/30 selection:text-gold relative overflow-hidden flex items-center justify-center p-4">
      {/* Royal Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      
      <AnimatePresence mode="wait">
        {state === "loading" && (
          <motion.div key="loader" exit={{ opacity: 0 }} className="text-center space-y-4">
             <div className="w-16 h-16 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto shadow-gold" />
             <p className="font-cinzel text-xs tracking-[0.5em] text-gold/40 uppercase">Loading Records</p>
          </motion.div>
        )}

        {state === "error" && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
             <span className="text-6xl grayscale opacity-30">📜</span>
             <h1 className="font-cinzel text-2xl text-gold/60">الرابط غير صالح</h1>
             <p className="font-amiri text-ink/40">قد يكون الرابط قد انتهى أو تم حذفه من السجلات</p>
          </motion.div>
        )}

        {state === "gate" && (
          <motion.div key="gate" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl space-y-12">
            <div className="text-center space-y-4">
              <motion.img 
                src={WAX_SEAL_URL} 
                className="w-24 h-24 mx-auto drop-shadow-royal"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity }}
              />
              <h1 className="font-cinzel-decorative text-4xl text-gold">مكتوب</h1>
              <p className="font-amiri text-xl text-gold/60 italic">أهلاً بك في الديوان الملكي، {recipient?.display_label}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {letters.map((letter, idx) => (
                <motion.div
                  key={letter.id}
                  whileHover={{ y: -10 }}
                  onClick={() => handleSelectLetter(letter)}
                  className="cursor-pointer group"
                >
                  <ParchmentCard className="p-6 text-center space-y-4 group-hover:border-gold/50 transition-all border-gold/10">
                    <div className="w-12 h-12 bg-gold/5 rounded-full flex items-center justify-center mx-auto text-gold/40 border border-gold/10">
                      {idx + 1}
                    </div>
                    <h3 className="font-amiri text-xl text-ink">{letter.title || "رسالة بدون عنوان"}</h3>
                    <p className="font-cinzel text-[10px] tracking-widest text-secondary opacity-50 uppercase">
                      {new Date(letter.created_at).toLocaleDateString("ar")}
                    </p>
                  </ParchmentCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {state === "answering" && (
          <motion.div key="answering" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
            <ParchmentCard className="p-10 space-y-8 shadow-seal border-gold/30">
              <div className="text-center space-y-2">
                <span className="text-3xl">🔑</span>
                <h2 className="font-cinzel text-xl text-secondary uppercase tracking-widest">تحقق الهوية</h2>
                <p className="font-amiri text-ink/50 text-sm">أجب على أسئلة الأمان لتفتح هذا المكتوب</p>
              </div>

              <div className="space-y-6">
                {selectedLetter.questions.map((q: any) => (
                  <div key={q.id} className="space-y-2">
                    <label className="font-amiri text-sm text-secondary">{q.question_text}</label>
                    <input 
                      type="text" 
                      className="input-royal w-full"
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    />
                  </div>
                ))}
              </div>

              <button 
                onClick={handleVerifyQuestions}
                disabled={loading}
                className="btn-gold w-full py-4 text-lg"
              >
                {loading ? "جارٍ التحقق..." : "فتح القفل الملكي"}
              </button>
            </ParchmentCard>
          </motion.div>
        )}

        {state === "revealing" && (
          <motion.div key="revealing" className="flex flex-col items-center gap-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
             <motion.div
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 4, repeat: Infinity }}
               className="relative"
             >
                <img 
                  src={WAX_SEAL_URL} 
                  className={cn("w-40 h-40 cursor-pointer drop-shadow-2xl transition-all duration-1000", sealBroken && "scale-150 opacity-0 blur-xl")} 
                  onClick={handleBreakSeal}
                />
                {!sealBroken && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap"
                  >
                     <p className="font-amiri text-gold animate-pulse text-lg">انقر لكسر الختم واستحضار الرسالة</p>
                  </motion.div>
                )}
             </motion.div>
          </motion.div>
        )}

        {state === "reading" && selectedLetter && (
          <motion.div key="reading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-4xl py-12 space-y-12">
            <div className="flex justify-center">
              <div className="w-full max-w-[800px] min-h-[900px] bg-parchment-pattern rough-edge shadow-manuscript relative p-12 md:p-24 flex flex-col items-stretch text-right font-amiri" dir="rtl">
                {/* Scroll Top Edge */}
                <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
                
                <div className="mb-16">
                  <p className="text-secondary text-2xl font-bold">{selectedLetter.sender_name || "أحمد"}</p>
                  <p className="text-ink/40 text-sm font-cinzel tracking-widest uppercase">
                    {new Date(selectedLetter.created_at).toLocaleDateString("ar")}
                  </p>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                   <h1 className="text-4xl md:text-6xl text-ink font-bold mb-12 text-center opacity-0 animate-fade-in fill-mode-forwards" style={{ animationDelay: '1s' }}>
                    {selectedLetter.title}
                   </h1>
                   <div className="text-2xl md:text-3xl leading-[2.2] text-ink/90">
                     <InkWritingText text={selectedLetter.content} speed={50} />
                   </div>
                </div>

                <div className="mt-16 pt-12 border-t border-gold/10">
                   <p className="text-secondary text-2xl">إلى: <span className="font-bold">{recipient?.display_label}</span></p>
                   <div className="mt-12 flex justify-center">
                      <img src={WAX_SEAL_URL} className="w-32 h-32 opacity-80" />
                   </div>
                </div>
              </div>
            </div>

            {/* Reply Section */}
            <div className="max-w-2xl mx-auto space-y-6">
               <ParchmentCard className="p-8 space-y-6">
                  <h3 className="font-cinzel text-sm text-secondary tracking-widest uppercase">أرسل ردك الملكي</h3>
                  <textarea 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="input-royal w-full min-h-[150px] text-lg leading-relaxed"
                    placeholder="اكتب بصدق هنا..."
                  />
                  <div className="flex gap-4">
                    <button onClick={() => setState("gate")} className="btn-royal bg-transparent border-gold/20 text-ink/60 flex-1">العودة</button>
                    <button className="btn-gold flex-[2]">ختم وإرسال الرد</button>
                  </div>
               </ParchmentCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecipientPage;
