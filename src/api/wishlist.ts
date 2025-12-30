import { supabase } from "@/integrations/supabase/client";

// -----------------------------------------------------
// GET WISHLIST WITH PRODUCTS + IMAGES
// -----------------------------------------------------
export async function getWishlist(userId: string) {
  const { data, error } = await supabase
    .from("wishlists")
    .select(
      `
      id,
      product_id,
      product:products(
        *,
        product_images(*)
      )
    `,
    )
    .eq("user_id", userId);

  if (error) throw error;

  return (data || []).map((item: any) => ({
    id: item.id,
    product_id: item.product_id,
    product: {
      ...item.product,
      images: item.product?.product_images || [],
    },
  }));
}

// -----------------------------------------------------
// ADD ITEM TO WISHLIST (Prevents duplicate entries)
// -----------------------------------------------------
export async function addToWishlist(userId: string, productId: string) {
  // Check existing entry
  const { data: existing } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) return existing; // Already in wishlist

  // Insert new wishlist item
  const { data, error } = await supabase
    .from("wishlists")
    .insert({
      user_id: userId,
      product_id: productId,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

// -----------------------------------------------------
// REMOVE FROM WISHLIST
// -----------------------------------------------------
export async function removeFromWishlist(userId: string, productId: string) {
  const { error } = await supabase.from("wishlists").delete().eq("user_id", userId).eq("product_id", productId);

  if (error) throw error;

  return true;
}

// -----------------------------------------------------
// CHECK IF A PRODUCT IS ALREADY IN WISHLIST
// -----------------------------------------------------
export async function isInWishlist(userId: string, productId: string) {
  const { data } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  return !!data;
}
