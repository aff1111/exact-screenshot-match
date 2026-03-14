import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

const InkWritingText = ({ text, speed = 50, className, onComplete }: Props) => {
  const [displayedText, setDisplayedText] = useState("");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setComplete(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <div className={cn("relative leading-relaxed", className)}>
      {/* Invisible text for layout sizing */}
      <span className="invisible select-none pointer-events-none">{text}</span>
      
      {/* Animated text layer */}
      <div className="absolute inset-0">
        {displayedText.split("").map((char, i) => (
          <motion.span
            key={i}
            initial={{ 
              opacity: 0, 
              filter: "blur(4px)",
              scale: 0.8,
              y: 2
            }}
            animate={{ 
              opacity: 1, 
              filter: "blur(0px)",
              scale: 1,
              y: 0
            }}
            transition={{ 
              duration: 0.4,
              ease: "easeOut"
            }}
            className={cn(
              "inline-block",
              char === "\n" ? "block w-full h-0" : ""
            )}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </div>

      {/* Decorative Ink Feather Cursor (Optional) */}
      {!complete && displayedText.length > 0 && (
         <motion.span
           animate={{ 
             opacity: [0, 1, 0],
             scale: [1, 1.2, 1]
           }}
           transition={{ duration: 0.6, repeat: Infinity }}
           className="ml-1 inline-block w-1 h-6 bg-gold/40 align-middle blur-[1px]"
         />
      )}
    </div>
  );
};

export default InkWritingText;
