import { supabase } from "@/integrations/supabase/client";

export async function getWishlist(userId: string) {
  const { data } = await supabase
    .from("wishlists")
    .select(
      `
      id,
      product_id,
      products(*, product_images(*))
    `,
    )
    .eq("user_id", userId);

  return data || [];
}

export async function addToWishlist(userId: string, productId: string) {
  const { data } = await supabase
    .from("wishlists")
    .insert({ user_id: userId, product_id: productId })
    .select()
    .single();

  return data;
}

export async function removeFromWishlist(id: string) {
  await supabase.from("wishlists").delete().eq("id", id);
  return true;
}
