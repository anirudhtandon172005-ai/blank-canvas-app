import { supabase } from "@/integrations/supabase/client";

// Get full cart for a user
export async function getCart(userId: string) {
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
    `,
    )
    .eq("cart_id", userId);

  if (error) throw error;
  return data;
}

// Add to cart
export async function addToCart(cartId: string, productId: string, variantId: string, quantity = 1) {
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
  const { data, error } = await supabase.from("cart_items").update({ quantity }).eq("id", cartItemId).select().single();

  if (error) throw error;
  return data;
}

// Remove item
export async function removeFromCart(cartItemId: string) {
  const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);

  if (error) throw error;
  return true;
}
