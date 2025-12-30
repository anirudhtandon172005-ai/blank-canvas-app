import { supabase } from "@/integrations/supabase/client";

// ------------------------------
// Ensure a cart exists
// ------------------------------
export async function getOrCreateCart(userId: string) {
  const { data, error } = await supabase.from("carts").select("id").eq("user_id", userId).maybeSingle();

  if (error) throw error;

  // Cart exists → return it
  if (data) return data.id;

  // Create new cart
  const { data: newCart, error: createErr } = await supabase
    .from("carts")
    .insert({ user_id: userId })
    .select("id")
    .single();

  if (createErr) throw createErr;

  return newCart.id;
}

// ------------------------------
// Get full cart with product + variant + images
// ------------------------------
export async function getCart(userId: string) {
  const cartId = await getOrCreateCart(userId);

  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `
      id,
      quantity,
      product_id,
      variant_id,

      products (
        id,
        name,
        slug,
        description,
        base_price,
        sale_price,
        category_id,
        product_images (
          id,
          image_url,
          is_primary,
          sort_order
        )
      ),

      product_variants (
        id,
        size,
        color,
        sku,
        stock_quantity,
        price_adjustment,
        is_active
      )
    `,
    )
    .eq("cart_id", cartId);

  if (error) throw error;

  const items = (data || []).map((item: any) => ({
    id: item.id,
    quantity: item.quantity,
    product_id: item.product_id,
    variant_id: item.variant_id,
    product: item.products,
    variant: item.product_variants,
  }));

  return { id: cartId, user_id: userId, items };
}

// ------------------------------
// Add item to cart
// ------------------------------
export async function addToCart(userId: string, productId: string, variantId: string, quantity = 1) {
  const cartId = await getOrCreateCart(userId);

  // Check if already in cart
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("product_id", productId)
    .eq("variant_id", variantId)
    .maybeSingle();

  // Update quantity
  if (existing) {
    const { data, error } = await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + quantity })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Insert new
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

// ------------------------------
// Update quantity
// ------------------------------
export async function updateQuantity(cartItemId: string, quantity: number) {
  const { data, error } = await supabase.from("cart_items").update({ quantity }).eq("id", cartItemId).select().single();

  if (error) throw error;
  return data;
}

// ------------------------------
// Remove single item
// ------------------------------
export async function removeFromCart(cartItemId: string) {
  const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);

  if (error) throw error;
  return true;
}

// ------------------------------
// Clear entire cart
// ------------------------------
export async function clearCart(userId: string) {
  const cartId = await getOrCreateCart(userId);

  const { error } = await supabase.from("cart_items").delete().eq("cart_id", cartId);

  if (error) throw error;
  return true;
}
