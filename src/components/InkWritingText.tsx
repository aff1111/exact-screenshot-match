import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface InkWritingTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

const InkWritingText = ({ 
  text, 
  speed = 30, 
  className = "", 
  onComplete 
}: InkWritingTextProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i++;
      if (i > text.length) {
        clearInterval(interval);
        setIsComplete(true);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      {displayedText}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="inline-block w-1 h-6 bg-ink/30 ml-1 align-middle"
        />
      )}
    </motion.div>
  );
};

export default InkWritingText;
