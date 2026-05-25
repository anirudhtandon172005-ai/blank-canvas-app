//import { useState, useEffect } from "react";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import BrandLogo from "@/components/BrandLogo";

type Step = "email" | "otp" | "success";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithOtp, verifyOtp, isAuthenticated, loading: authLoading } = useAuthContext();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string })?.from || "/";

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, from]);

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  /* ---------------- SEND OTP ---------------- */
  const handleSendOtp = async () => {
    if (!email.trim() || !validateEmail(email)) {
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
        title: "Failed to send OTP",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "OTP Sent",
      description: `Check your inbox at ${email}`,
    });

    setStep("otp");
  };

  /* ---------------- VERIFY OTP ---------------- */
  const handleVerifyOtp = async (value: string) => {
    if (value.length !== 6) return;

    setLoading(true);
    const { error } = await verifyOtp(email, value);
    setLoading(false);

    if (error) {
      toast({
        title: "Invalid OTP",
        description: "Please check the code and try again",
        variant: "destructive",
      });
      setOtp("");
      return;
    }

    setStep("success");
    toast({
      title: "Login successful",
      description: "Redirecting you now…",
    });

    setTimeout(() => {
      navigate(from, { replace: true });
    }, 1200);
  };

  const handleBack = () => {
    setStep("email");
    setOtp("");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* LEFT IMAGE */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="https://nrhvufbmsjmewpqhwcmp.supabase.co/storage/v1/object/public/products/Screenshot%202026-01-02%20030850.png"
          alt="Auth"
          className="w-full h-full object-cover"
        />
      </div>

      {/* FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
          <Link to="/" className="flex items-center justify-center mb-8">
            <BrandLogo
              className="h-16 w-16"
              imgClassName="rounded-lg bg-white/95 p-2"
              alt="Kala Mandir"
            />
          </Link>

          <AnimatePresence mode="wait">
            {/* EMAIL STEP */}
            {step === "email" && (
              <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 className="text-2xl font-semibold text-center mb-2">Login / Sign Up</h2>
                <p className="text-muted-foreground text-center mb-6">Enter your email to receive a 6-digit code</p>

                <div className="relative mb-4">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="input-field pl-12"
                    disabled={loading}
                  />
                </div>

                <button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-full flex justify-center items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </button>
              </motion.div>
            )}

            {/* OTP STEP */}
            {step === "otp" && (
              <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <button onClick={handleBack} className="flex items-center gap-2 text-sm mb-4">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <h2 className="text-2xl font-semibold text-center mb-2">Enter OTP</h2>
                <p className="text-muted-foreground text-center mb-6">
                  Sent to <strong>{email}</strong>
                </p>

                <div className="flex justify-center mb-4">
                  <InputOTP
                    value={otp}
                    onChange={(val) => {
                      setOtp(val);
                      if (val.length === 6) handleVerifyOtp(val);
                    }}
                    maxLength={6}
                    disabled={loading}
                  >
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {loading && <p className="text-center text-sm text-muted-foreground mb-3">Verifying…</p>}

                <button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full text-primary text-sm hover:underline"
                >
                  Resend OTP
                </button>
              </motion.div>
            )}

            {/* SUCCESS */}
            {step === "success" && (
              <motion.div
                key="success"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold">Welcome!</h2>
                <p className="text-muted-foreground">Redirecting you now…</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
