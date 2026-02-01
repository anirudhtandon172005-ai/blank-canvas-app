import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const loadingTexts = [
  "Curating Heritage...",
  "Preparing Your Exclusive Collection...",
  "Weaving Elegance...",
  "Finishing Royal Touches...",
];

interface LuxuryLoaderProps {
  progress?: number;
  showProgress?: boolean;
}

export default function LuxuryLoader({ progress, showProgress = true }: LuxuryLoaderProps) {
  const [textIndex, setTextIndex] = useState(0);
  const [internalProgress, setInternalProgress] = useState(0);

  useEffect(() => {
    const textInterval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 2500);

    return () => clearInterval(textInterval);
  }, []);

  useEffect(() => {
    if (progress === undefined) {
      const progressInterval = setInterval(() => {
        setInternalProgress((prev) => {
          if (prev >= 95) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);

      return () => clearInterval(progressInterval);
    }
  }, [progress]);

  const displayProgress = progress ?? internalProgress;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Background with gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, hsl(40 30% 96%) 0%, hsl(35 25% 92%) 100%)",
        }}
      />

      {/* Subtle texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Corner mandala motifs */}
      <div className="absolute top-0 left-0 w-48 h-48 opacity-[0.06]">
        <svg viewBox="0 0 100 100" className="w-full h-full text-amber-600">
          <circle cx="0" cy="0" r="80" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="0" cy="0" r="60" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="0" cy="0" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
          {[...Array(8)].map((_, i) => (
            <line key={i} x1="0" y1="0" x2="80" y2="0" stroke="currentColor" strokeWidth="0.3" transform={`rotate(${i * 45})`} />
          ))}
        </svg>
      </div>
      <div className="absolute bottom-0 right-0 w-48 h-48 opacity-[0.06] rotate-180">
        <svg viewBox="0 0 100 100" className="w-full h-full text-amber-600">
          <circle cx="0" cy="0" r="80" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="0" cy="0" r="60" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="0" cy="0" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
          {[...Array(8)].map((_, i) => (
            <line key={i} x1="0" y1="0" x2="80" y2="0" stroke="currentColor" strokeWidth="0.3" transform={`rotate(${i * 45})`} />
          ))}
        </svg>
      </div>

      {/* Floating gold particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: "linear-gradient(135deg, #CFAE70, #F4D38A)",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-sm">
        {/* Logo with glow */}
        <div className="relative">
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 blur-xl opacity-40"
            style={{
              background: "radial-gradient(circle, #F4D38A 0%, transparent 70%)",
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Lotus/Jewel Logo */}
          <motion.div
            className="relative w-24 h-24"
            animate={{
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#CFAE70" />
                  <stop offset="50%" stopColor="#F4D38A" />
                  <stop offset="100%" stopColor="#B8964F" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              
              {/* Lotus petals */}
              <g filter="url(#glow)">
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                  <ellipse
                    key={i}
                    cx="50"
                    cy="30"
                    rx="8"
                    ry="20"
                    fill="url(#goldGradient)"
                    opacity="0.9"
                    transform={`rotate(${angle} 50 50)`}
                  />
                ))}
                {/* Center jewel */}
                <circle cx="50" cy="50" r="12" fill="url(#goldGradient)" />
                <circle cx="50" cy="50" r="6" fill="#F4D38A" opacity="0.8" />
              </g>
            </svg>

            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 overflow-hidden rounded-full"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
              }}
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                repeatDelay: 1,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        </div>

        {/* Brand name */}
        <div className="text-center">
          <h1 
            className="font-heading text-3xl font-semibold tracking-wide"
            style={{ color: "#2B2B2B" }}
          >
            Kala Ethnic
          </h1>
          <p 
            className="mt-2 font-heading text-sm italic tracking-widest"
            style={{ color: "#6A5A44" }}
          >
            Unveiling Timeless Elegance...
          </p>
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div className="w-full max-w-xs">
            <div 
              className="h-1 rounded-full overflow-hidden"
              style={{ backgroundColor: "#E8DCC8" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, #CFAE70, #F4D38A, #B8964F)",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(displayProgress, 100)}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Loading text */}
        <div className="h-6 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={textIndex}
              className="text-sm tracking-wide"
              style={{ color: "#6A5A44" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              {loadingTexts[textIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
