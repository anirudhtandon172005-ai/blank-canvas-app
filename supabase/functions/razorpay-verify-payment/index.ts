import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyPaymentRequest {
  internal_order_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(`${orderId}|${paymentId}`);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const computedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return computedSignature === signature;
}

async function reduceStockForOrder(supabase: ReturnType<typeof createClient>, orderId: string) {
  const { data: orderItems, error: itemsError } = await supabase
    .from("order_items")
    .select("variant_id,quantity")
    .eq("order_id", orderId);

  if (itemsError) throw itemsError;

  const quantitiesByVariant = new Map<string, number>();

  for (const item of orderItems ?? []) {
    if (!item.variant_id) continue;
    quantitiesByVariant.set(item.variant_id, (quantitiesByVariant.get(item.variant_id) ?? 0) + Number(item.quantity));
  }

  for (const [variantId, quantity] of quantitiesByVariant.entries()) {
    const { data: variant, error: variantError } = await supabase
      .from("product_variants")
      .select("stock_quantity")
      .eq("id", variantId)
      .single();

    if (variantError) throw variantError;

    const stockQuantity = Number(variant.stock_quantity);
    const nextQuantity = Math.max(0, stockQuantity - quantity);

    const { error: updateError } = await supabase
      .from("product_variants")
      .update({
        stock_quantity: nextQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", variantId);

    if (updateError) throw updateError;
  }
}

async function clearUserCart(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data: cart, error: cartError } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (cartError) throw cartError;
  if (!cart) return;

  const { error: clearError } = await supabase.from("cart_items").delete().eq("cart_id", cart.id);
  if (clearError) throw clearError;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

    if (!keySecret) {
      console.error("Razorpay secret key not configured");
      return jsonResponse({ error: "Razorpay secret key not configured" }, 500);
    }

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Supabase admin credentials not configured");
      return jsonResponse({ error: "Supabase admin credentials not configured" }, 500);
    }

    const {
      internal_order_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    }: VerifyPaymentRequest = await req.json();

    if (!internal_order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return jsonResponse({ error: "Missing required payment verification parameters" }, 400);
    }

    const isValid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, keySecret);

    if (!isValid) {
      console.error("Payment signature verification failed");
      return jsonResponse({ verified: false, error: "Payment signature verification failed" }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = token ? await supabase.auth.getUser(token) : { data: { user: null }, error: new Error("Missing auth token") };

    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id,user_id,total_amount,status,payment_status,payment_method,razorpay_order_id")
      .eq("id", internal_order_id)
      .maybeSingle();

    if (orderError) {
      console.error("Order fetch failed:", orderError);
      return jsonResponse({ error: "Failed to fetch order" }, 500);
    }

    if (!order) {
      return jsonResponse({ error: "Order not found" }, 404);
    }

    if (!order.user_id) {
      return jsonResponse({ error: "Order is missing a user reference" }, 400);
    }

    if (order.user_id !== user.id) {
      return jsonResponse({ error: "Order does not belong to this user" }, 403);
    }

    if (order.payment_method && order.payment_method !== "razorpay") {
      return jsonResponse({ error: "Order is not configured for Razorpay payment" }, 400);
    }

    if (order.razorpay_order_id !== razorpay_order_id) {
      return jsonResponse({ error: "Razorpay order reference does not match this order" }, 400);
    }

    if (order.status === "confirmed" && order.payment_status === "paid") {
      return jsonResponse({
        verified: true,
        payment_id: razorpay_payment_id,
        internal_order_id: order.id,
        already_processed: true,
      });
    }

    const now = new Date().toISOString();
    const amount = Number(order.total_amount);
    const rawPayload = {
      internal_order_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    };

    const { error: orderUpdateError } = await supabase
      .from("orders")
      .update({
        status: "confirmed",
        payment_status: "paid",
        confirmed_at: now,
        razorpay_order_id,
        updated_at: now,
      })
      .eq("id", order.id);

    if (orderUpdateError) throw orderUpdateError;

    const { error: paymentError } = await supabase.from("payments").insert({
      order_id: order.id,
      user_id: order.user_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      currency: "INR",
      status: "paid",
      gateway: "razorpay",
      raw_payload: rawPayload,
    });

    if (paymentError) throw paymentError;

    const { error: historyError } = await supabase.from("order_status_history").insert({
      order_id: order.id,
      old_status: "pending",
      new_status: "confirmed",
      changed_by_type: "system",
      note: "Payment verified through Razorpay",
    });

    if (historyError) throw historyError;

    await reduceStockForOrder(supabase, order.id);
    await clearUserCart(supabase, order.user_id);

    return jsonResponse({
      verified: true,
      payment_id: razorpay_payment_id,
      internal_order_id: order.id,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error verifying payment:", errorMessage);
    return jsonResponse({ error: "Internal server error", message: errorMessage }, 500);
  }
});
