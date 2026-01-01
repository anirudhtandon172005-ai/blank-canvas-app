import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Package, CreditCard, ArrowRight } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  const orderId = searchParams.get("orderId");
  const transactionId = searchParams.get("tx");

  useEffect(() => {
    // Animate content after checkmark animation
    const timer = setTimeout(() => setShowContent(true), 600);
    return () => clearTimeout(timer);
  }, []);

  if (!orderId) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Invalid order reference</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          {/* Animated Success Icon */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              duration: 0.6,
            }}
            className="relative mx-auto mb-8"
          >
            {/* Pulse Ring */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut",
              }}
              className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-green-500/20"
            />
            
            {/* Main Circle */}
            <div className="relative w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
              <motion.div
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <CheckCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
              </motion.div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={showContent ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
                Payment Successful!
              </h1>
              <p className="text-muted-foreground">
                Thank you for your order. Your payment has been processed.
              </p>
            </div>

            {/* Order Details Card */}
            <div className="bg-card border border-border rounded-2xl p-6 text-left space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Order ID</p>
                  <p className="font-mono font-medium text-foreground">{orderId.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/50 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Transaction ID</p>
                  <p className="font-mono font-medium text-foreground">
                    {transactionId === "COD" ? "Cash on Delivery" : transactionId?.slice(0, 12) || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/order/${orderId}`)}
              className="w-full bg-primary text-primary-foreground py-4 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              View Order Details
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            <button
              onClick={() => navigate("/")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Continue Shopping
            </button>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
