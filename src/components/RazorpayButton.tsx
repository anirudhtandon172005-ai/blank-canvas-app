import { useCallback } from "react";
import { CreditCard } from "lucide-react";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: () => void) => void;
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

interface RazorpayButtonProps {
  amount: number; // Amount in INR (rupees)
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  onSuccess: (response: RazorpaySuccessResponse) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

export default function RazorpayButton({
  amount,
  customerName,
  customerEmail,
  customerPhone,
  onSuccess,
  onError,
  disabled = false,
}: RazorpayButtonProps) {
  const handlePayment = useCallback(() => {
    // Get Razorpay key from environment
    const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

    if (!razorpayKeyId) {
      const error = new Error("Razorpay Key ID not configured. Please add VITE_RAZORPAY_KEY_ID to your environment.");
      console.error(error.message);
      onError?.(error);
      return;
    }

    if (!window.Razorpay) {
      const error = new Error("Razorpay SDK not loaded. Please refresh the page and try again.");
      console.error(error.message);
      onError?.(error);
      return;
    }

    // Convert rupees to paise (Razorpay requires amount in smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    const options: RazorpayOptions = {
      key: razorpayKeyId,
      amount: amountInPaise,
      currency: "INR",
      name: "Your Store", // You can customize this
      description: "Order Payment",
      prefill: {
        name: customerName || "",
        email: customerEmail || "",
        contact: customerPhone || "",
      },
      theme: {
        color: "#8B5CF6", // Primary color - customize as needed
      },
      handler: (response) => {
        console.log("Razorpay Payment Success:", response);
        onSuccess(response);
      },
      modal: {
        ondismiss: () => {
          console.log("Razorpay payment modal closed by user");
        },
      },
    };

    try {
      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", () => {
        const error = new Error("Payment failed. Please try again.");
        console.error("Razorpay payment failed");
        onError?.(error);
      });
      razorpay.open();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to initialize payment");
      console.error("Razorpay initialization error:", error);
      onError?.(error);
    }
  }, [amount, customerName, customerEmail, customerPhone, onSuccess, onError]);

  if (disabled) {
    return (
      <div className="w-full p-4 text-center text-muted-foreground border border-dashed border-border rounded-xl">
        Select an address to enable payment
      </div>
    );
  }

  return (
    <button
      onClick={handlePayment}
      className="w-full bg-primary text-primary-foreground py-3.5 rounded-full font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
    >
      <CreditCard className="w-5 h-5" />
      Pay ₹{amount.toLocaleString("en-IN")}
    </button>
  );
}
