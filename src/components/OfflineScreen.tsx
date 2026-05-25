import { motion } from "framer-motion";
import { WifiOff } from "lucide-react";
import BrandLogo from "./BrandLogo";

interface OfflineScreenProps {
  onRetry: () => void;
}

export default function OfflineScreen({ onRetry }: OfflineScreenProps) {
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
          background: "radial-gradient(circle at 50% 45%, rgba(180, 40, 70, 0.25) 0%, transparent 50%)",
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

      {/* Corner mandala motifs */}
      <div className="absolute top-0 left-0 w-56 h-56 opacity-[0.08]">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="mandalaRed" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#B8405E" />
              <stop offset="100%" stopColor="#6B1A34" />
            </linearGradient>
          </defs>
          <circle cx="0" cy="0" r="90" fill="none" stroke="url(#mandalaRed)" strokeWidth="0.5" />
          <circle cx="0" cy="0" r="70" fill="none" stroke="url(#mandalaRed)" strokeWidth="0.5" />
          <circle cx="0" cy="0" r="50" fill="none" stroke="url(#mandalaRed)" strokeWidth="0.5" />
          {[...Array(12)].map((_, i) => (
            <line key={i} x1="0" y1="0" x2="90" y2="0" stroke="url(#mandalaRed)" strokeWidth="0.3" transform={`rotate(${i * 30})`} />
          ))}
        </svg>
      </div>
      <div className="absolute bottom-0 right-0 w-56 h-56 opacity-[0.08] rotate-180">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="0" cy="0" r="90" fill="none" stroke="url(#mandalaRed)" strokeWidth="0.5" />
          <circle cx="0" cy="0" r="70" fill="none" stroke="url(#mandalaRed)" strokeWidth="0.5" />
          <circle cx="0" cy="0" r="50" fill="none" stroke="url(#mandalaRed)" strokeWidth="0.5" />
          {[...Array(12)].map((_, i) => (
            <line key={i} x1="0" y1="0" x2="90" y2="0" stroke="url(#mandalaRed)" strokeWidth="0.3" transform={`rotate(${i * 30})`} />
          ))}
        </svg>
      </div>

      {/* Floating shimmer particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              background: `linear-gradient(135deg, rgba(255, 200, 200, ${0.3 + Math.random() * 0.3}), rgba(180, 64, 94, 0.5))`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              boxShadow: "0 0 4px rgba(255, 180, 180, 0.4)",
            }}
            animate={{
              y: [0, -35, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-md text-center">
        {/* Temple window icon with ruby glow */}
        <div className="relative">
          {/* Cinematic glow effect */}
          <motion.div
            className="absolute -inset-6 blur-xl opacity-40"
            style={{
              background: "radial-gradient(circle, rgba(180, 64, 94, 0.6) 0%, transparent 70%)",
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
          
          {/* Animated logo */}
          <motion.div
            className="relative w-32 h-32"
            animate={{
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <BrandLogo
              className="h-full w-full"
              imgClassName="rounded-xl bg-white/95 p-2 shadow-2xl"
              alt="Kala Mandir"
            />
            
            {/* Wifi off icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <WifiOff 
                className="w-8 h-8 rounded-full bg-background/90 p-1"
                style={{ color: "#9E2A4D" }}
                strokeWidth={1.5}
              />
            </div>
          </motion.div>
        </div>

        {/* Headline and message */}
        <div className="space-y-4">
          <h2 
            className="font-heading text-xl font-medium"
            style={{ color: "#FFE4E8" }}
          >
            Connection Lost
          </h2>
          <p 
            className="text-sm leading-relaxed"
            style={{ color: "rgba(255, 200, 210, 0.85)" }}
          >
            It seems you are offline. Please check your internet connection to continue your journey into timeless elegance.
          </p>
        </div>

        {/* Velvet red retry button */}
        <motion.button
          onClick={onRetry}
          className="relative px-10 py-3.5 rounded-full font-medium text-sm tracking-wider overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #9E2A4D 0%, #B8405E 50%, #8B1538 100%)",
            color: "#FFF0F3",
            boxShadow: "0 4px 25px rgba(158, 42, 77, 0.5), 0 0 0 1px rgba(220, 107, 134, 0.2)",
          }}
          whileHover={{ 
            scale: 1.04,
            boxShadow: "0 6px 35px rgba(184, 64, 94, 0.6), 0 0 20px rgba(220, 107, 134, 0.3)",
          }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.2 }}
        >
          {/* Silk shimmer on hover */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255, 200, 210, 0.3), transparent)",
            }}
            initial={{ x: "-100%" }}
            whileHover={{ x: "200%" }}
            transition={{ duration: 0.7 }}
          />
          <span className="relative z-10">Retry Connection</span>
        </motion.button>
      </div>
    </div>
  );
}
