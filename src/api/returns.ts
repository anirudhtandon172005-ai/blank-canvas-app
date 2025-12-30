import { supabase } from "@/integrations/supabase/client";

// -----------------------------------------------------
// GET RETURNABLE ORDERS (Delivered within last 15 days)
// -----------------------------------------------------
export async function getReturnableOrders(userId: string) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 15);

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      items:order_items(
        *,
        product:products(
          *,
          product_images(*)
        )
      )
    `,
    )
    .eq("user_id", userId)
    .eq("status", "delivered")
    .gte("updated_at", cutoff.toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((order: any) => ({
    ...order,
    items: order.items?.map((item: any) => ({
      ...item,
      product: {
        ...item.product,
        images: item.product?.product_images || [],
      },
    })),
  }));
}

// -----------------------------------------------------
// SUBMIT RETURN REQUEST (Mock Implementation)
// -----------------------------------------------------
export async function submitReturnRequest(request: {
  orderId: string;
  reason: string;
  comments?: string;
  refundMethod: "original" | "store_credit";
}) {
  return {
    status: "submitted",
    orderId: request.orderId,
    reason: request.reason,
    comments: request.comments || null,
    refundMethod: request.refundMethod,
    timestamp: new Date().toISOString(),
  };
}

// -----------------------------------------------------
// GET RETURN STATUS (Mock Implementation)
// -----------------------------------------------------
export async function getReturnStatus(orderId: string) {
  return {
    orderId,
    status: "processing",
    updated_at: new Date().toISOString(),
  };
}
