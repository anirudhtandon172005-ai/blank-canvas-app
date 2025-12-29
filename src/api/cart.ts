import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export async function getOrCreateCart(userId: string) {
  let { data: cart } = await supabase.from("carts").select("*").eq("user_id", userId).maybeSingle();

  if (!cart) {
    const { data: newCart } = await supabase.from("carts").insert({ user_id: userId }).select().single();

    cart = newCart;
  }

  return cart;
}

export async function getCart(userId: string) {
  const cart = await getOrCreateCart(userId);

  const { data: items } = await supabase
    .from("cart_items")
    .select(
      `
      id,
      quantity,
      variant_id,
      product_id,
      products(*, product_images(*)),
      product_variants(*)
    `,
    )
    .eq("cart_id", cart.id);

  return items || [];
}

export async function addToCart(userId: string, productId: string, variantId: string, quantity = 1) {
  const cart = await getOrCreateCart(userId);

  const { data } = await supabase
    .from("cart_items")
    .insert({
      cart_id: cart.id,
      product_id: productId,
      variant_id: variantId,
      quantity,
    })
    .select()
    .single();

  return data;
}

export async function updateQuantity(itemId: string, quantity: number) {
  const { data } = await supabase.from("cart_items").update({ quantity }).eq("id", itemId).select().single();

  return data;
}

export async function removeFromCart(itemId: string) {
  await supabase.from("cart_items").delete().eq("id", itemId);
  return true;
}
