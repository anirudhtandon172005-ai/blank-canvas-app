//import { useState } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { login, loginWithGoogle } from "@/api/auth";
import { toast } from "@/hooks/use-toast";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to login with Google",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT IMAGE PANEL (Updated with your image) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-foreground/60 z-10" />

        <img
          src="https://nrhvufbmsjmewpqhwcmp.supabase.co/storage/v1/object/public/products/Screenshot%202026-01-02%20030850.png"
          alt="Fashion model ethnic wear"
          className="w-full h-full object-cover"
        />

        <div className="absolute bottom-12 left-12 right-12 z-20 text-white">
          <p className="text-sm uppercase tracking-widest opacity-80 mb-2">Elegance</p>
          <h2 className="font-heading text-4xl font-semibold italic mb-4">
            Style That <br /> Defines You
          </h2>
          <p className="text-sm opacity-80 max-w-md">Discover premium ethnic wear crafted for the modern woman.</p>
        </div>
      </div>

      {/* FORM PANEL */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12 bg-background">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto w-full">
          {/* LOGO */}
          <Link to="/" className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold">K</span>
            </div>
            <span className="font-heading text-2xl font-semibold text-foreground">Kala Mandir</span>
          </Link>

          {/* TABS */}
          <div className="flex justify-center gap-8 mb-8 border-b border-border">
            <button className="pb-3 text-lg font-medium text-foreground relative">
              Login
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            </button>

            <button
              onClick={() => navigate("/signup")}
              className="pb-3 text-lg font-medium text-muted-foreground hover:text-foreground"
            >
              Create Account
            </button>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                className="input-field"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Password</label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="input-field pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary py-3 rounded-full">
              {loading ? "Loading..." : "Login →"}
            </button>
          </form>

          {/* GOOGLE LOGIN */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground uppercase">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 border border-border rounded-full hover:bg-secondary"
          >
            <img className="w-5 h-5" src="https://www.svgrepo.com/show/475656/google-color.svg" />
            Continue with Google
          </button>

          <p className="text-center mt-8 text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
