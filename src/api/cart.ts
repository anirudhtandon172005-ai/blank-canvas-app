import { supabase } from "@/integrations/supabase/client";

export async function getCart() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: cart, error: cartError } = await supabase
    .from("carts")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (cartError) throw cartError;
  if (!cart) return null;

  const { data: items, error: itemsError } = await supabase
    .from("cart_items")
    .select(`
      *,
      product:products(*),
      variant:product_variants(*)
    `)
    .eq("cart_id", cart.id);

  if (itemsError) throw itemsError;

  return {
    ...cart,
    items: items || [],
  };
}

export async function addToCart(productId: string, variantId: string, quantity: number = 1) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User must be logged in");

  // Get or create cart
  let { data: cart, error: cartError } = await supabase
    .from("carts")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (cartError) throw cartError;

  if (!cart) {
    const { data: newCart, error: createError } = await supabase
      .from("carts")
      .insert({ user_id: user.id })
      .select()
      .single();

    if (createError) throw createError;
    cart = newCart;
  }

  // Check if item already exists in cart
  const { data: existingItem, error: existingError } = await supabase
    .from("cart_items")
    .select("*")
    .eq("cart_id", cart.id)
    .eq("product_id", productId)
    .eq("variant_id", variantId)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existingItem) {
    // Update quantity
    const { data, error } = await supabase
      .from("cart_items")
      .update({ quantity: existingItem.quantity + quantity })
      .eq("id", existingItem.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Add new item
    const { data, error } = await supabase
      .from("cart_items")
      .insert({
        cart_id: cart.id,
        product_id: productId,
        variant_id: variantId,
        quantity,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export async function updateQuantity(cartItemId: string, quantity: number) {
  if (quantity <= 0) {
    return removeFromCart(cartItemId);
  }

  const { data, error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", cartItemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeFromCart(cartItemId: string) {
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", cartItemId);

  if (error) throw error;
  return true;
}

export async function clearCart() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User must be logged in");

  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!cart) return;

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("cart_id", cart.id);

  if (error) throw error;
  return true;
}

export async function getCartCount() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!cart) return 0;

  const { data: items, error } = await supabase
    .from("cart_items")
    .select("quantity")
    .eq("cart_id", cart.id);

  if (error) return 0;

  return items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
}
