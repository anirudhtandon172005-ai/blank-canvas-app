import { useCallback, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  order_id: string;
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
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface VerifiedPaymentResponse {
  verified: boolean;
  payment_id: string;
  order_id: string;
}

interface RazorpayButtonProps {
  amount: number; // Amount in INR (rupees)
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  onSuccess: (response: VerifiedPaymentResponse) => void;
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
  const [isLoading, setIsLoading] = useState(false);

  const createOrder = async (): Promise<{ id: string; amount: number } | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('razorpay-create-order', {
        body: { amount },
      });

      if (error) {
        throw new Error(error.message || 'Failed to create order');
      }

      if (!data?.id) {
        throw new Error('Invalid order response');
      }

      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create order');
      console.error('Order creation error:', error);
      throw error;
    }
  };

  const verifyPayment = async (response: RazorpaySuccessResponse): Promise<VerifiedPaymentResponse> => {
    try {
      const { data, error } = await supabase.functions.invoke('razorpay-verify-payment', {
        body: {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        },
      });

      if (error) {
        throw new Error(error.message || 'Payment verification failed');
      }

      if (!data?.verified) {
        throw new Error(data?.error || 'Payment verification failed');
      }

      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Payment verification failed');
      console.error('Payment verification error:', error);
      throw error;
    }
  };

  const handlePayment = useCallback(async () => {
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

    setIsLoading(true);

    try {
      // Step 1: Create order on backend
      const order = await createOrder();
      if (!order) {
        throw new Error('Failed to create order');
      }

      console.log('Razorpay order created:', order.id);

      // Step 2: Open Razorpay checkout with order_id
      const options: RazorpayOptions = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: "INR",
        name: "Your Store",
        description: "Order Payment",
        order_id: order.id,
        prefill: {
          name: customerName || "",
          email: customerEmail || "",
          contact: customerPhone || "",
        },
        theme: {
          color: "#8B5CF6",
        },
        handler: async (response) => {
          console.log("Razorpay Payment Response:", response);
          
          try {
            // Step 3: Verify payment on backend
            const verifiedPayment = await verifyPayment(response);
            console.log("Payment verified:", verifiedPayment);
            setIsLoading(false);
            onSuccess(verifiedPayment);
          } catch (verifyError) {
            setIsLoading(false);
            const error = verifyError instanceof Error ? verifyError : new Error('Payment verification failed');
            console.error("Payment verification failed:", error);
            onError?.(error);
          }
        },
        modal: {
          ondismiss: () => {
            console.log("Razorpay payment modal closed by user");
            setIsLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", () => {
        const error = new Error("Payment failed. Please try again.");
        console.error("Razorpay payment failed");
        setIsLoading(false);
        onError?.(error);
      });
      razorpay.open();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to initialize payment");
      console.error("Razorpay initialization error:", error);
      setIsLoading(false);
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
      disabled={isLoading}
      className="w-full bg-primary text-primary-foreground py-3.5 rounded-full font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="w-5 h-5" />
          Pay ₹{amount.toLocaleString("en-IN")}
        </>
      )}
    </button>
  );
}
