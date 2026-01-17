import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type Step = "email" | "otp" | "success";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithOtp, verifyOtp, isAuthenticated, loading: authLoading } = useAuthContext();
  
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // Get redirect path from location state
  const from = (location.state as { from?: string })?.from || "/";

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, from]);

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

    // Redirect after success
    setTimeout(() => {
      navigate(from, { replace: true });
    }, 1500);
  };

  const handleBack = () => {
    setStep("email");
    setOtp("");
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* IMAGE SIDE */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-foreground/60 z-10" />

        <img
          src="https://nrhvufbmsjmewpqhwcmp.supabase.co/storage/v1/object/public/products/Screenshot%202026-01-02%20030850.png"
          alt="Login Visual"
          className="w-full h-full object-cover"
        />

        <div className="absolute bottom-12 left-12 right-12 z-20 text-white">
          <p className="text-sm uppercase tracking-widest opacity-80 mb-2">Elegance</p>
          <h2 className="font-heading text-4xl font-semibold italic mb-4">
            Welcome
            <br />
            To Luxury
          </h2>
        </div>
      </div>

      {/* FORM */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto w-full"
        >
          <Link to="/" className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold">K</span>
            </div>
            <span className="font-heading text-2xl font-semibold text-foreground">Kala Mandir</span>
          </Link>

          <AnimatePresence mode="wait">
            {step === "email" && (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <h2 className="font-heading text-2xl font-semibold mb-2 text-center">
                  Login or Sign Up
                </h2>
                <p className="text-muted-foreground mb-8 text-center">
                  Enter your email to receive a one-time password
                </p>

                <form onSubmit={handleSendOtp} className="space-y-6">
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
                      "Continue with Email →"
                    )}
                  </button>
                </form>

                <p className="text-xs text-muted-foreground text-center mt-6">
                  We'll send you a 6-digit code to verify your email. No password needed!
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
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                <h2 className="font-heading text-2xl font-semibold mb-2 text-center">
                  Enter OTP
                </h2>
                <p className="text-muted-foreground mb-8 text-center">
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
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </div>
                )}

                <button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full text-primary hover:underline text-sm disabled:opacity-50"
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
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="font-heading text-2xl font-semibold mb-2">
                  Welcome!
                </h2>
                <p className="text-muted-foreground">
                  Redirecting you now...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
