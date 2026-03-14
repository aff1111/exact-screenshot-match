import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RoyalScrollProps {
  children: React.ReactNode;
  className?: string;
  rollerClassName?: string;
}

const RoyalScroll = ({ children, className, rollerClassName }: RoyalScrollProps) => {
  return (
    <div className={cn("relative w-full max-w-4xl mx-auto flex flex-col items-center", className)}>
      {/* Top Roller */}
      <div className={cn("relative w-[110%] -mb-4 z-20", rollerClassName)}>
        <svg viewBox="0 0 800 80" className="w-full drop-shadow-2xl">
          <defs>
            <linearGradient id="rollerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2D1B0D" />
              <stop offset="30%" stopColor="#5D3E24" />
              <stop offset="50%" stopColor="#8B6E4B" />
              <stop offset="70%" stopColor="#5D3E24" />
              <stop offset="100%" stopColor="#2D1B0D" />
            </linearGradient>
            <linearGradient id="goldCapGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8C6A3B" />
              <stop offset="20%" stopColor="#D4AF37" />
              <stop offset="50%" stopColor="#F9E076" />
              <stop offset="80%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#8C6A3B" />
            </linearGradient>
            <filter id="innerShadow">
              <feOffset dx="0" dy="2" />
              <feGaussianBlur stdDeviation="2" result="offset-blur" />
              <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
              <feFlood floodColor="black" floodOpacity="0.5" result="color" />
              <feComposite operator="in" in="color" in2="inverse" result="shadow" />
              <feComposite operator="over" in="shadow" in2="SourceGraphic" />
            </filter>
          </defs>
          {/* Main Wood Cylinder */}
          <rect x="45" y="15" width="710" height="50" rx="4" fill="url(#rollerGradient)" filter="url(#innerShadow)" />
          {/* Gold Decorative Ends */}
          <rect x="15" y="10" width="35" height="60" rx="8" fill="url(#goldCapGradient)" />
          <rect x="750" y="10" width="35" height="60" rx="8" fill="url(#goldCapGradient)" />
          {/* Decorative Rings */}
          <rect x="55" y="15" width="5" height="50" fill="#D4AF37" fillOpacity="0.3" />
          <rect x="740" y="15" width="5" height="50" fill="#D4AF37" fillOpacity="0.3" />
        </svg>
      </div>

      {/* Parchment Body */}
      <div className="relative w-full bg-parchment-pattern rough-edge shadow-manuscript p-12 md:p-20 z-10 min-h-[600px] overflow-visible">
        {/* Dynamic Inner Border */}
        <div className="absolute inset-8 border border-gold/10 pointer-events-none rounded-sm" />
        <div className="absolute inset-10 border-[0.5px] border-gold/5 pointer-events-none rounded-sm" />
        
        {/* Light Shimmer Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
        
        <div className="relative z-10">
          {children}
        </div>

        {/* Shadow for the fold */}
        <div className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>

      {/* Bottom Roller */}
      <div className={cn("relative w-[110%] -mt-4 z-20", rollerClassName)}>
        <svg viewBox="0 0 800 60" className="w-full drop-shadow-xl">
          <use href="#rollerGradient" />
          <use href="#goldGradient" />
          {/* Main Wood Cylinder */}
          <rect x="40" y="10" width="720" height="40" rx="4" fill="url(#rollerGradient)" />
          {/* Gold Ends */}
          <rect x="20" y="5" width="30" height="50" rx="4" fill="url(#goldGradient)" />
          <rect x="750" y="5" width="30" height="50" rx="4" fill="url(#goldGradient)" />
        </svg>
      </div>
    </div>
  );
};

export default RoyalScroll;
