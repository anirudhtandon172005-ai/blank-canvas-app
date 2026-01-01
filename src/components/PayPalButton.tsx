import { useEffect, useRef } from "react";

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        createOrder: (data: unknown, actions: { order: { create: (options: { purchase_units: Array<{ amount: { value: string } }> }) => Promise<string> } }) => Promise<string>;
        onApprove: (data: { orderID: string }, actions: { order: { capture: () => Promise<PayPalPaymentDetails> } }) => Promise<void>;
        onError: (err: Error) => void;
      }) => { render: (container: HTMLElement) => void };
    };
  }
}

export interface PayPalPaymentDetails {
  id: string;
  status: string;
  payer: {
    email_address: string;
    name: { given_name: string; surname: string };
  };
  purchase_units: Array<{
    amount: { value: string; currency_code: string };
  }>;
}

interface PayPalButtonProps {
  amount: number;
  onSuccess: (paymentDetails: PayPalPaymentDetails) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

export default function PayPalButton({ amount, onSuccess, onError, disabled = false }: PayPalButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    if (!window.paypal || !containerRef.current || renderedRef.current || disabled) return;

    renderedRef.current = true;

    window.paypal.Buttons({
      createOrder: async (_data, actions) => {
        return actions.order.create({
          purchase_units: [
            {
              amount: {
                value: amount.toFixed(2),
              },
            },
          ],
        });
      },
      onApprove: async (_data, actions) => {
        const details = await actions.order.capture();
        onSuccess(details);
      },
      onError: (err) => {
        console.error("PayPal Error:", err);
        onError?.(err);
      },
    }).render(containerRef.current);

    return () => {
      renderedRef.current = false;
    };
  }, [amount, onSuccess, onError, disabled]);

  if (disabled) {
    return (
      <div className="w-full p-4 text-center text-muted-foreground border border-dashed border-border rounded-xl">
        Select an address to enable payment
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full min-h-[150px]" />
  );
}
