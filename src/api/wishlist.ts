import { supabase } from "@/integrations/supabase/client";

// Get wishlist
export async function getWishlist(userId: string) {
  const { data, error } = await supabase
    .from("wishlists")
    .select("*, products(*, product_images(*))")
    .eq("user_id", userId);

  if (error) throw error;
  return data;
}

// Add product
export async function addToWishlist(userId: string, productId: string) {
  const { data, error } = await supabase
    .from("wishlists")
    .insert({ user_id: userId, product_id: productId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Remove product
export async function removeFromWishlist(userId: string, productId: string) {
  const { error } = await supabase.from("wishlists").delete().eq("user_id", userId).eq("product_id", productId);

  if (error) throw error;
  return true;
}

// Check if in wishlist
export async function isInWishlist(userId: string, productId: string) {
  const { data } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  return !!data;
}
