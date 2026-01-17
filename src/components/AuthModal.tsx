import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  redirectPath?: string;
}

type Step = "email" | "otp" | "success";

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { signInWithOtp, verifyOtp } = useAuthContext();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await signInWithOtp(email);
    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "OTP Sent!",
      description: `Check your inbox at ${email}`,
    });
    setStep("otp");
  };

  const handleVerifyOtp = async (value: string) => {
    if (value.length !== 6) return;

    setLoading(true);
    const { error } = await verifyOtp(email, value);
    setLoading(false);

    if (error) {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid OTP. Please try again.",
        variant: "destructive",
      });
      setOtp("");
      return;
    }

    setStep("success");
    toast({
      title: "Welcome!",
      description: "You have been logged in successfully",
    });

    // Small delay to show success state
    setTimeout(() => {
      onSuccess?.();
      handleClose();
    }, 1000);
  };

  const handleClose = () => {
    setStep("email");
    setEmail("");
    setOtp("");
    onClose();
  };

  const handleBack = () => {
    setStep("email");
    setOtp("");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-background rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-border"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              {step === "otp" && (
                <button
                  onClick={handleBack}
                  className="p-1 hover:bg-secondary rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold">K</span>
              </div>
              <span className="font-heading text-xl font-semibold">Kala Mandir</span>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-secondary rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {step === "email" && (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <h2 className="font-heading text-2xl font-semibold mb-2">
                    Login to Continue
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Enter your email to receive a one-time password
                  </p>

                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="input-field pl-12"
                        autoFocus
                        disabled={loading}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-primary text-primary-foreground py-3.5 rounded-full font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        "Send OTP →"
                      )}
                    </button>
                  </form>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    We'll send you a 6-digit code to verify your email
                  </p>
                </motion.div>
              )}

              {step === "otp" && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="font-heading text-2xl font-semibold mb-2">
                    Enter OTP
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    We sent a code to <span className="font-medium text-foreground">{email}</span>
                  </p>

                  <div className="flex justify-center mb-6">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(value) => {
                        setOtp(value);
                        if (value.length === 6) {
                          handleVerifyOtp(value);
                        }
                      }}
                      disabled={loading}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  {loading && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </div>
                  )}

                  <button
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="w-full text-primary hover:underline text-sm mt-4 disabled:opacity-50"
                  >
                    Didn't receive the code? Resend
                  </button>
                </motion.div>
              )}

              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="font-heading text-2xl font-semibold mb-2">
                    Welcome!
                  </h2>
                  <p className="text-muted-foreground">
                    You're now logged in
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
