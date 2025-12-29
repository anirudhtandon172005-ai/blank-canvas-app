import { supabase } from "@/integrations/supabase/client";

// Note: This uses order status to track return requests
// In a production app, you might want a separate returns table

export interface ReturnRequest {
  orderId: string;
  reason: string;
  comments?: string;
  refundMethod: "original" | "store_credit";
}

export async function submitReturnRequest(request: ReturnRequest) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User must be logged in");

  // Verify the order belongs to the user and is eligible for return
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", request.orderId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (orderError) throw orderError;
  if (!order) throw new Error("Order not found");

  if (order.status !== "delivered") {
    throw new Error("Only delivered orders can be returned");
  }

  // Update order status to indicate return request
  // In a real app, you'd have a separate returns table
  const { data, error } = await supabase
    .from("orders")
    .update({
      status: "cancelled", // Using cancelled as return status
      notes: `RETURN REQUEST: ${request.reason}. ${request.comments || ""}. Refund: ${request.refundMethod}`,
    })
    .eq("id", request.orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getReturnStatus(orderId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User must be logged in");

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      items:order_items(
        *,
        product:products(*, images:product_images(*))
      )
    `)
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getReturnableOrders() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get delivered orders within return window (15 days)
  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      items:order_items(
        *,
        product:products(*, images:product_images(*))
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "delivered")
    .gte("created_at", fifteenDaysAgo.toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}
