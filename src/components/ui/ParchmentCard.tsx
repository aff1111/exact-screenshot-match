import React from "react";
import { cn } from "@/lib/utils";
import parchmentBg from "@/assets/parchment-bg.jpg";

interface ParchmentCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  containerClassName?: string;
  withSeal?: boolean;
}

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const ParchmentCard = ({ 
  children, 
  className, 
  containerClassName,
  withSeal = false,
  ...props 
}: ParchmentCardProps) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["1deg", "-1deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-1deg", "1deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <>
      <svg className="hidden">
        <filter id="rough-paper">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
        </filter>
      </svg>
      
      <motion.div 
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "relative w-full h-full min-h-[600px] flex flex-col shadow-royal rounded-sm overflow-hidden bg-parchment-pattern rough-edge transition-shadow duration-500 hover:shadow-2xl",
          containerClassName
        )}
      >
        <div className="absolute inset-0 bg-gold/5 mix-blend-multiply pointer-events-none" />
        
        <div 
          className={cn(
            "relative z-10 flex-1 flex flex-col p-8 md:p-12 lg:p-16",
            className
          )}
          {...props}
        >
          {children}
        </div>
        
        {/* Decorative Internal Border */}
        <div className="absolute inset-4 border border-gold/10 pointer-events-none rounded-sm" />
        
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/5 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
      </motion.div>
    </>
  );
};

export default ParchmentCard;
