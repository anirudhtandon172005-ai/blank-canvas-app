import { supabase } from "@/integrations/supabase/client";

// Get orders eligible for return (delivered within last 15 days)
export async function getReturnableOrders(userId: string) {
  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, products(*, product_images(*)))")
    .eq("user_id", userId)
    .eq("status", "delivered")
    .gte("updated_at", fifteenDaysAgo.toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;
  
  return (data || []).map((order) => ({
    ...order,
    items: order.order_items?.map((item: any) => ({
      ...item,
      product: item.products,
    })),
  }));
}

// Submit return request
export async function submitReturnRequest(request: {
  orderId: string;
  reason: string;
  comments?: string;
  refundMethod: "original" | "store_credit";
}) {
  // For now, just return a mock response
  // In production, you'd create a returns table and insert the request
  return {
    status: "submitted",
    orderId: request.orderId,
    reason: request.reason,
    refundMethod: request.refundMethod,
  };
}

// Get return status
export async function getReturnStatus(orderId: string) {
  return {
    orderId,
    status: "processing",
  };
}
