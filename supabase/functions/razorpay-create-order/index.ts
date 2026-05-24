import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateOrderRequest {
  internal_order_id: string;
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

    if (!keyId || !keySecret) {
      console.error("Razorpay credentials not configured");
      return jsonResponse({ error: "Razorpay credentials not configured" }, 500);
    }

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Supabase service role credentials not configured");
      return jsonResponse({ error: "Supabase service role credentials not configured" }, 500);
    }

    const { internal_order_id }: CreateOrderRequest = await req.json();

    if (!internal_order_id) {
      return jsonResponse({ error: "internal_order_id is required" }, 400);
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
      .select("id,user_id,order_number,total_amount,status,payment_status,payment_method,razorpay_order_id")
      .eq("id", internal_order_id)
      .maybeSingle();

    if (orderError) {
      console.error("Order fetch failed:", orderError);
      return jsonResponse({ error: "Failed to fetch order" }, 500);
    }

    if (!order) {
      return jsonResponse({ error: "Order not found" }, 404);
    }

    if (order.user_id !== user.id) {
      return jsonResponse({ error: "Order does not belong to this user" }, 403);
    }

    if (order.payment_method && order.payment_method !== "razorpay") {
      return jsonResponse({ error: "Order is not configured for Razorpay payment" }, 400);
    }

    if (order.status === "confirmed" || order.payment_status === "paid") {
      return jsonResponse({ error: "Order is already paid" }, 409);
    }

    const amountInPaise = Math.round(Number(order.total_amount) * 100);

    if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
      return jsonResponse({ error: "Order has an invalid amount" }, 400);
    }

    if (order.razorpay_order_id) {
      return jsonResponse({
        id: order.razorpay_order_id,
        internal_order_id: order.id,
        amount: amountInPaise,
        currency: "INR",
        status: "created",
      });
    }

    const auth = btoa(`${keyId}:${keySecret}`);
    const orderPayload = {
      amount: amountInPaise,
      currency: "INR",
      receipt: order.order_number || `order_${order.id}`,
      notes: {
        internal_order_id: order.id,
        user_id: user.id,
      },
    };

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Razorpay order creation failed:", errorData);
      return jsonResponse({ error: "Failed to create Razorpay order", details: errorData }, response.status);
    }

    const razorpayOrder = await response.json();

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        razorpay_order_id: razorpayOrder.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateError) {
      console.error("Failed to save Razorpay order id:", updateError);
      return jsonResponse({ error: "Failed to update order with Razorpay reference" }, 500);
    }

    return jsonResponse({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      internal_order_id: order.id,
      status: razorpayOrder.status,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating Razorpay order:", errorMessage);
    return jsonResponse({ error: "Internal server error", message: errorMessage }, 500);
  }
});
