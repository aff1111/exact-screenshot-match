import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import waxSeal from "@/assets/wax-seal.png";
import parchmentBg from "@/assets/parchment-bg.jpg";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const LoginPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [answer1, setAnswer1] = useState("");
  const [answer2, setAnswer2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [questions, setQuestions] = useState({ q1: "", q2: "" });

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    setError("");
    setLoading(true);

    try {
      // Random delay for timing attack prevention
      await new Promise((r) => setTimeout(r, 50 + Math.random() * 150));

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("بيانات الدخول غير صحيحة");
        setLoading(false);
        return;
      }

      // Check if user is admin and get security questions
      const { data: admin } = await supabase
        .from("admin_users")
        .select("security_question_1, security_question_2, failed_login_attempts, locked_until")
        .single();

      if (!admin) {
        await supabase.auth.signOut();
        setError("بيانات الدخول غير صحيحة");
        setLoading(false);
        return;
      }

      // Check if locked
      if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
        await supabase.auth.signOut();
        setError("تم قفل الحساب مؤقتاً. حاول لاحقاً.");
        setLoading(false);
        return;
      }

      setQuestions({
        q1: admin.security_question_1,
        q2: admin.security_question_2,
      });
      setStep(2);
    } catch {
      setError("حدث خطأ. حاول مرة أخرى.");
    }
    setLoading(false);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    setError("");
    setLoading(true);

    try {
      await new Promise((r) => setTimeout(r, 50 + Math.random() * 150));

      const { data: admin } = await supabase
        .from("admin_users")
        .select("id, security_answer_1_hash, security_answer_2_hash, failed_login_attempts")
        .single();

      if (!admin) {
        setError("حدث خطأ");
        setLoading(false);
        return;
      }

      // Verify answers server-side using RPC
      const { data: match1 } = await supabase.rpc("hash_answer", { p_answer: answer1.trim() });
      const { data: match2 } = await supabase.rpc("hash_answer", { p_answer: answer2.trim() });

      // We need to compare hashes - use a verify function
      // Since bcrypt hashes are salted, we need to verify via SQL
      const { data: verified } = await supabase
        .from("admin_users")
        .select("id")
        .eq("id", admin.id)
        .filter("security_answer_1_hash", "eq", admin.security_answer_1_hash)
        .single();

      // Use edge function or direct SQL comparison via RPC
      // Let's do a simple server-side check via raw comparison
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/verify_admin_answers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            p_answer_1: answer1.trim(),
            p_answer_2: answer2.trim(),
          }),
        }
      );

      const result = await res.json();

      if (result === true) {
        // Reset failed attempts
        await supabase
          .from("admin_users")
          .update({ failed_login_attempts: 0 })
          .eq("id", admin.id);
        navigate("/dashboard");
      } else {
        // Increment failed attempts
        await supabase
          .from("admin_users")
          .update({ failed_login_attempts: (admin.failed_login_attempts || 0) + 1 })
          .eq("id", admin.id);

        if ((admin.failed_login_attempts || 0) + 1 >= 5) {
          await supabase
            .from("admin_users")
            .update({ locked_until: new Date(Date.now() + 30 * 60 * 1000).toISOString() })
            .eq("id", admin.id);
          await supabase.auth.signOut();
          setStep(1);
          setError("تم قفل الحساب لمدة 30 دقيقة بسبب محاولات فاشلة متعددة");
        } else {
          setError("إجابات الأمان غير صحيحة");
        }
      }
    } catch {
      setError("حدث خطأ. حاول مرة أخرى.");
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: `url(${parchmentBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-parchment/60" />

      <motion.div
        className="relative z-10 w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <motion.img
            src={waxSeal}
            alt="Seal"
            className="w-20 h-20 mb-4"
            animate={{ rotate: [0, 2, -2, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <h1 className="font-cinzel-decorative text-2xl text-secondary">
            {step === 1 ? "تسجيل الدخول" : "تحقّق الهوية"}
          </h1>
          <p className="font-cinzel text-xs text-accent mt-1 tracking-widest uppercase">
            {step === 1 ? "Sign In" : "Identity Verification"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-parchment/80 backdrop-blur-sm border border-gold/30 rounded-sm p-8 shadow-parchment">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form
                key="step1"
                onSubmit={handleStep1}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className="space-y-5"
              >
                <input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  className="absolute -left-[9999px] opacity-0"
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div className="space-y-2">
                  <Label className="font-cinzel text-sm text-accent" htmlFor="email">
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    dir="ltr"
                    className="bg-parchment border-gold/30 font-amiri focus:ring-gold focus:border-gold"
                    placeholder="admin@maktoob.app"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-cinzel text-sm text-accent" htmlFor="password">
                    كلمة المرور
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    dir="ltr"
                    className="bg-parchment border-gold/30 font-amiri focus:ring-gold focus:border-gold"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <p className="text-destructive text-sm font-amiri text-center">{error}</p>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 font-cinzel text-sm tracking-widest uppercase
                             bg-secondary text-secondary-foreground border border-gold
                             shadow-seal hover:bg-burgundy-light transition-colors duration-300
                             disabled:opacity-50 rounded-sm"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? "جارٍ التحقق..." : "متابعة — Continue"}
                </motion.button>
              </motion.form>
            ) : (
              <motion.form
                key="step2"
                onSubmit={handleStep2}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className="space-y-5"
              >
                <p className="font-amiri text-center text-accent text-sm mb-4" dir="rtl">
                  أجب على أسئلة الأمان للمتابعة
                </p>

                <input
                  type="text"
                  name="company"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  className="absolute -left-[9999px] opacity-0"
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div className="space-y-2">
                  <Label className="font-amiri text-sm text-ink" dir="rtl">
                    {questions.q1}
                  </Label>
                  <Input
                    value={answer1}
                    onChange={(e) => setAnswer1(e.target.value)}
                    required
                    dir="rtl"
                    className="bg-parchment border-gold/30 font-amiri focus:ring-gold focus:border-gold"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-amiri text-sm text-ink" dir="rtl">
                    {questions.q2}
                  </Label>
                  <Input
                    value={answer2}
                    onChange={(e) => setAnswer2(e.target.value)}
                    required
                    dir="rtl"
                    className="bg-parchment border-gold/30 font-amiri focus:ring-gold focus:border-gold"
                  />
                </div>

                {error && (
                  <p className="text-destructive text-sm font-amiri text-center">{error}</p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(""); }}
                    className="flex-1 py-3 font-cinzel text-xs tracking-widest uppercase
                               bg-transparent text-accent border border-gold/30
                               hover:bg-parchment-dark transition-colors duration-300 rounded-sm"
                  >
                    رجوع
                  </button>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] py-3 font-cinzel text-sm tracking-widest uppercase
                               bg-secondary text-secondary-foreground border border-gold
                               shadow-seal hover:bg-burgundy-light transition-colors duration-300
                               disabled:opacity-50 rounded-sm"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? "جارٍ التحقق..." : "دخول — Enter"}
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/")}
            className="font-cinzel text-xs text-accent hover:text-secondary transition-colors tracking-widest"
          >
            ← العودة للرئيسية
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
