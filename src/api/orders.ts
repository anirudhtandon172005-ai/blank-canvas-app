import { supabase } from "@/integrations/supabase/client";

interface PlaceOrderData {
  addressId?: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry?: string;
  notes?: string;
}

/**
 * PLACE ORDER
 */
export async function placeOrder(orderData: PlaceOrderData) {
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User must be logged in");

  // Find user's cart
  const { data: cart, error: cartErr } = await supabase.from("carts").select("id").eq("user_id", user.id).maybeSingle();

  if (cartErr) throw cartErr;
  if (!cart) throw new Error("Cart not found");

  // Load all cart items
  const { data: cartItems, error: itemsErr } = await supabase
    .from("cart_items")
    .select(
      `
      *,
      product:products(*, product_images(*)),
      variant:product_variants(*)
    `,
    )
    .eq("cart_id", cart.id);

  if (itemsErr) throw itemsErr;
  if (!cartItems || cartItems.length === 0) throw new Error("Cart is empty");

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => {
    const base = item.product?.sale_price ?? item.product?.base_price ?? 0;
    const adj = item.variant?.price_adjustment ?? 0;
    return sum + (base + adj) * item.quantity;
  }, 0);

  const shippingCost = subtotal >= 2000 ? 0 : 99;
  const taxAmount = subtotal * 0.05;
  const totalAmount = subtotal + shippingCost + taxAmount;

  // Create order number
  const orderNumber =
    "KM" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

  // Insert into orders
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      order_number: orderNumber,
      subtotal,
      shipping_cost: shippingCost,
      tax_amount: taxAmount,
      total_amount: totalAmount,

      shipping_address_id: orderData.addressId || null,
      shipping_name: orderData.shippingName,
      shipping_phone: orderData.shippingPhone,
      shipping_address: orderData.shippingAddress,
      shipping_city: orderData.shippingCity,
      shipping_state: orderData.shippingState,
      shipping_postal_code: orderData.shippingPostalCode,
      shipping_country: orderData.shippingCountry || "India",

      notes: orderData.notes ?? null,
      status: "pending",
      payment_status: "pending",
    })
    .select()
    .single();

  if (orderErr) throw orderErr;

  // Insert order items
  const formatted = cartItems.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    variant_id: item.variant_id,
    product_name: item.product?.name ?? "",
    variant_size: item.variant?.size ?? "",
    variant_color: item.variant?.color ?? "",
    quantity: item.quantity,
    unit_price: (item.product?.sale_price ?? item.product?.base_price ?? 0) + (item.variant?.price_adjustment ?? 0),
    total_price:
      ((item.product?.sale_price ?? item.product?.base_price ?? 0) + (item.variant?.price_adjustment ?? 0)) *
      item.quantity,
  }));

  const { error: oiErr } = await supabase.from("order_items").insert(formatted);

  if (oiErr) throw oiErr;

  // Clear the cart
  await supabase.from("cart_items").delete().eq("cart_id", cart.id);

  return order;
}

/**
 * GET ALL USER ORDERS
 */
export async function getOrders() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      items:order_items(*)
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}

/**
 * ORDER DETAILS BY ID
 */
export async function getOrderDetails(orderId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User must be logged in");

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      items:order_items(
        *,
        product:products(*, product_images(*))
      )
    `,
    )
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  return data;
}

/**
 * ORDER DETAILS BY ORDER NUMBER
 */
export async function getOrderByNumber(orderNumber: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User must be logged in");

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      items:order_items(
        *,
        product:products(*, product_images(*))
      )
    `,
    )
    .eq("order_number", orderNumber)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  return data;
}
