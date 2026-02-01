import { motion } from "framer-motion";
import { WifiOff } from "lucide-react";

interface OfflineScreenProps {
  onRetry: () => void;
}

export default function OfflineScreen({ onRetry }: OfflineScreenProps) {
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
        {[...Array(15)].map((_, i) => (
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
              opacity: [0.2, 0.5, 0.2],
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
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-md text-center">
        {/* Temple window icon with glow */}
        <div className="relative">
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 blur-xl opacity-30"
            style={{
              background: "radial-gradient(circle, #F4D38A 0%, transparent 70%)",
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Arched window / temple window */}
          <motion.div
            className="relative w-28 h-28"
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
                <linearGradient id="goldGradientOffline" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#CFAE70" />
                  <stop offset="50%" stopColor="#F4D38A" />
                  <stop offset="100%" stopColor="#B8964F" />
                </linearGradient>
                <filter id="glowOffline">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              
              {/* Arched window frame */}
              <g filter="url(#glowOffline)">
                {/* Outer arch */}
                <path
                  d="M20 90 L20 45 Q20 15 50 15 Q80 15 80 45 L80 90 Z"
                  fill="none"
                  stroke="url(#goldGradientOffline)"
                  strokeWidth="3"
                />
                {/* Inner arch */}
                <path
                  d="M30 85 L30 48 Q30 25 50 25 Q70 25 70 48 L70 85 Z"
                  fill="none"
                  stroke="url(#goldGradientOffline)"
                  strokeWidth="1.5"
                  opacity="0.7"
                />
                {/* Cross bars */}
                <line x1="50" y1="25" x2="50" y2="85" stroke="url(#goldGradientOffline)" strokeWidth="1" opacity="0.6" />
                <line x1="30" y1="55" x2="70" y2="55" stroke="url(#goldGradientOffline)" strokeWidth="1" opacity="0.6" />
              </g>
            </svg>
            
            {/* Wifi off icon in center */}
            <div className="absolute inset-0 flex items-center justify-center pt-4">
              <WifiOff 
                className="w-8 h-8"
                style={{ color: "#B8964F" }}
                strokeWidth={1.5}
              />
            </div>
          </motion.div>
        </div>

        {/* Brand name */}
        <div>
          <h1 
            className="font-heading text-2xl font-semibold tracking-wide"
            style={{ color: "#2B2B2B" }}
          >
            Kala Ethnic
          </h1>
        </div>

        {/* Headline and message */}
        <div className="space-y-3">
          <h2 
            className="font-heading text-xl font-medium"
            style={{ color: "#2B2B2B" }}
          >
            Connection Lost
          </h2>
          <p 
            className="text-sm leading-relaxed"
            style={{ color: "#6A5A44" }}
          >
            It seems you are offline. Please check your internet connection to continue your journey into timeless elegance.
          </p>
        </div>

        {/* Retry button */}
        <motion.button
          onClick={onRetry}
          className="relative px-8 py-3 rounded-full font-medium text-sm tracking-wide overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #D4AF37, #F4D38A, #B8964F)",
            color: "#FFFFFF",
            boxShadow: "0 4px 20px rgba(212, 175, 55, 0.3)",
          }}
          whileHover={{ 
            scale: 1.03,
            boxShadow: "0 6px 25px rgba(212, 175, 55, 0.45)",
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          {/* Shimmer effect on hover */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
            }}
            initial={{ x: "-100%" }}
            whileHover={{ x: "200%" }}
            transition={{ duration: 0.6 }}
          />
          <span className="relative z-10">Retry Connection</span>
        </motion.button>
      </div>
    </div>
  );
}
