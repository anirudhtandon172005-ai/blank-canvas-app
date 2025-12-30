import { supabase } from "@/integrations/supabase/client";

// Get cart ID for a user
export async function getCartId(userId: string) {
  const { data, error } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.id;
}

// Get full cart for a user
export async function getCart(userId: string) {
  const cartId = await getCartId(userId);
  if (!cartId) return { id: "", user_id: userId, items: [] };

  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `
      id,
      quantity,
      variant_id,
      product_id,
      product_variants(*),
      products(*, product_images(*))
    `
    )
    .eq("cart_id", cartId);

  if (error) throw error;

  const items = (data || []).map((item) => ({
    id: item.id,
    product_id: item.product_id,
    variant_id: item.variant_id,
    quantity: item.quantity,
    product: item.products,
    variant: item.product_variants,
  }));

  return { id: cartId, user_id: userId, items };
}

// Add to cart
export async function addToCart(userId: string, productId: string, variantId: string, quantity = 1) {
  const cartId = await getCartId(userId);
  if (!cartId) throw new Error("Cart not found");

  // Check if item already exists
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("product_id", productId)
    .eq("variant_id", variantId)
    .maybeSingle();

  if (existing) {
    // Update quantity
    const { data, error } = await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + quantity })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Insert new item
  const { data, error } = await supabase
    .from("cart_items")
    .insert({
      cart_id: cartId,
      product_id: productId,
      variant_id: variantId,
      quantity,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update item quantity
export async function updateQuantity(cartItemId: string, quantity: number) {
  const { data, error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", cartItemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Remove item
export async function removeFromCart(cartItemId: string) {
  const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);

  if (error) throw error;
  return true;
}

// Clear cart
export async function clearCart(userId: string) {
  const cartId = await getCartId(userId);
  if (!cartId) return true;

  const { error } = await supabase.from("cart_items").delete().eq("cart_id", cartId);

  if (error) throw error;
  return true;
}
