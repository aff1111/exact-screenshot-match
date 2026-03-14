import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import waxSeal from "@/assets/wax-seal.png";
import parchmentBg from "@/assets/parchment-bg.jpg";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  // Placeholder security questions (will come from DB later)
  const [questions] = useState({
    q1: "ما اسم أول كتاب قرأته؟",
    q2: "في أي مدينة وُلدت؟",
  });

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return; // honeypot triggered
    setError("");
    setLoading(true);

    // TODO: integrate with Supabase auth
    // For now, simulate step transition
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    setError("");
    setLoading(true);

    // TODO: verify security answers via Edge Function
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    // For now, navigate to dashboard
    navigate("/dashboard");
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
                {/* Honeypot - hidden */}
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

                {/* Honeypot */}
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
                    onClick={() => setStep(1)}
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

        {/* Back to home */}
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
