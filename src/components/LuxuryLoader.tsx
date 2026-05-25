import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BrandLogo from "./BrandLogo";

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
      {/* Deep royal red gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, #8B1538 0%, #5C0A24 40%, #3D0516 70%, #2A040F 100%)",
        }}
      />

      {/* Soft radial glow in center */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 50% 45%, rgba(180, 40, 70, 0.3) 0%, transparent 50%)",
        }}
      />

      {/* Zari pattern texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23FFD700' stroke-width='0.5'/%3E%3Cpath d='M30 10L50 30L30 50L10 30Z' fill='none' stroke='%23FFD700' stroke-width='0.3'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Corner mandala motifs - darker red */}
      <div className="absolute top-0 left-0 w-56 h-56 opacity-[0.08]">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="mandalaCrimson" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#B8405E" />
              <stop offset="100%" stopColor="#6B1A34" />
            </linearGradient>
          </defs>
          <circle cx="0" cy="0" r="90" fill="none" stroke="url(#mandalaCrimson)" strokeWidth="0.5" />
          <circle cx="0" cy="0" r="70" fill="none" stroke="url(#mandalaCrimson)" strokeWidth="0.5" />
          <circle cx="0" cy="0" r="50" fill="none" stroke="url(#mandalaCrimson)" strokeWidth="0.5" />
          <circle cx="0" cy="0" r="30" fill="none" stroke="url(#mandalaCrimson)" strokeWidth="0.5" />
          {[...Array(12)].map((_, i) => (
            <line key={i} x1="0" y1="0" x2="90" y2="0" stroke="url(#mandalaCrimson)" strokeWidth="0.3" transform={`rotate(${i * 30})`} />
          ))}
          {[...Array(12)].map((_, i) => (
            <circle key={`dot-${i}`} cx="45" cy="0" r="2" fill="url(#mandalaCrimson)" transform={`rotate(${i * 30})`} />
          ))}
        </svg>
      </div>
      <div className="absolute bottom-0 right-0 w-56 h-56 opacity-[0.08] rotate-180">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="0" cy="0" r="90" fill="none" stroke="url(#mandalaCrimson)" strokeWidth="0.5" />
          <circle cx="0" cy="0" r="70" fill="none" stroke="url(#mandalaCrimson)" strokeWidth="0.5" />
          <circle cx="0" cy="0" r="50" fill="none" stroke="url(#mandalaCrimson)" strokeWidth="0.5" />
          <circle cx="0" cy="0" r="30" fill="none" stroke="url(#mandalaCrimson)" strokeWidth="0.5" />
          {[...Array(12)].map((_, i) => (
            <line key={i} x1="0" y1="0" x2="90" y2="0" stroke="url(#mandalaCrimson)" strokeWidth="0.3" transform={`rotate(${i * 30})`} />
          ))}
        </svg>
      </div>

      {/* Floating shimmer particles - silk reflections */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              background: `linear-gradient(135deg, rgba(255, 200, 200, ${0.4 + Math.random() * 0.3}), rgba(180, 64, 94, 0.6))`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              boxShadow: "0 0 4px rgba(255, 180, 180, 0.5)",
            }}
            animate={{
              y: [0, -40, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.2, 0.7, 0.2],
              scale: [0.8, 1.3, 0.8],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-10 px-6 max-w-sm">
        {/* Logo with ruby glow */}
        <div className="relative">
          {/* Soft cinematic glow */}
          <motion.div
            className="absolute -inset-8 blur-2xl opacity-50"
            style={{
              background: "radial-gradient(circle, rgba(180, 64, 94, 0.6) 0%, rgba(139, 21, 56, 0.3) 50%, transparent 70%)",
            }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Animated logo */}
          <motion.div
            className="relative w-32 h-32"
            animate={{
              scale: [1, 1.03, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <BrandLogo
              className="h-full w-full"
              imgClassName="rounded-xl bg-white/95 p-2 shadow-2xl"
              alt="Kala Mandir"
            />

            {/* Ruby shimmer sweep */}
            <motion.div
              className="absolute inset-0 overflow-hidden"
              style={{
                background: "linear-gradient(110deg, transparent 30%, rgba(255, 182, 193, 0.4) 50%, transparent 70%)",
                borderRadius: "50%",
              }}
              animate={{
                x: ["-150%", "150%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 1.5,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        </div>

        {/* Ruby red progress bar */}
        {showProgress && (
          <div className="w-full max-w-xs">
            <div 
              className="h-1.5 rounded-full overflow-hidden"
              style={{ 
                backgroundColor: "rgba(60, 10, 25, 0.8)",
                boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.3)",
              }}
            >
              <motion.div
                className="h-full rounded-full relative overflow-hidden"
                style={{
                  background: "linear-gradient(90deg, #9E2A4D, #DC6B86, #B8405E, #E85A7C)",
                  boxShadow: "0 0 10px rgba(220, 107, 134, 0.5)",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(displayProgress, 100)}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {/* Silk shine effect */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)",
                  }}
                  animate={{
                    x: ["-100%", "200%"],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </motion.div>
            </div>
          </div>
        )}

        {/* Loading text */}
        <div className="h-6 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={textIndex}
              className="text-sm tracking-wide"
              style={{ color: "rgba(255, 200, 210, 0.9)" }}
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
