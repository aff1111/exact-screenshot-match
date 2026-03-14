import React from "react";
import { cn } from "@/lib/utils";
import parchmentBg from "@/assets/parchment-bg.jpg";

interface ParchmentCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  containerClassName?: string;
  withSeal?: boolean;
}

const ParchmentCard = ({ 
  children, 
  className, 
  containerClassName,
  withSeal = false,
  ...props 
}: ParchmentCardProps) => {
  return (
    <div 
      className={cn(
        "relative w-full h-full min-h-[600px] flex flex-col shadow-royal rounded-sm overflow-hidden",
        containerClassName
      )}
      style={{ 
        backgroundImage: `url(${parchmentBg})`, 
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      <div className="absolute inset-0 bg-parchment/10 mix-blend-multiply" />
      
      <div 
        className={cn(
          "relative z-10 flex-1 flex flex-col p-8 md:p-12 lg:p-16",
          className
        )}
        {...props}
      >
        {children}
      </div>
      
      {/* Decorative Overlays */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/5 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
    </div>
  );
};

export default ParchmentCard;
