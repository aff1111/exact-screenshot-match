import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import waxSeal from "@/assets/wax-seal.png";
import parchmentBg from "@/assets/parchment-bg.jpg";

const OrnamentDivider = () => (
  <div className="flex items-center gap-4 my-8">
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
    <span className="text-gold text-2xl">✦</span>
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
  </div>
);

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-parchment-pattern overflow-hidden">
      {/* Dynamic Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.05) 100%)" />

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center px-6 max-w-2xl text-center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        {/* Wax Seal */}
        <motion.img
          src={waxSeal}
          alt="Royal wax seal"
          className="w-28 h-28 md:w-36 md:h-36 mb-6 drop-shadow-lg"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.3, type: "spring", stiffness: 120 }}
        />

        {/* Title */}
        <motion.h1
          className="font-cinzel-decorative text-4xl md:text-6xl text-secondary tracking-wider mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          Maktoob
        </motion.h1>

        <motion.p
          className="font-amiri text-3xl md:text-4xl text-secondary mb-2"
          dir="rtl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          مكتوب
        </motion.p>

        <OrnamentDivider />

        {/* Arabic description */}
        <motion.p
          className="font-amiri text-xl md:text-2xl text-ink leading-relaxed mb-4"
          dir="rtl"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.8 }}
        >
          رسائلُ تُكتبُ بالحبرِ وتُختمُ بالشمع، لا يفتحُها إلّا من كُتبت له
        </motion.p>

        {/* English description */}
        <motion.p
          className="font-cinzel text-sm md:text-base text-accent tracking-wide mb-10"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.8 }}
        >
          Letters sealed in wax, meant only for the one they were written for
        </motion.p>

        <OrnamentDivider />

        {/* Login button */}
        <motion.button
          onClick={() => navigate("/login")}
          className="mt-4 px-10 py-3 font-cinzel text-sm md:text-base tracking-widest uppercase
                     bg-secondary text-secondary-foreground
                     border border-gold
                     shadow-seal
                     hover:bg-burgundy-light transition-colors duration-300
                     rounded-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.6 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          تسجيل الدخول — Sign In
        </motion.button>
      </motion.div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-gold opacity-40"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        />
      ))}
    </div>
  );
};

export default Index;
