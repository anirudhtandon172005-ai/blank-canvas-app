import { supabase } from "@/integrations/supabase/client";

export interface ProductReview {
  id: string;
  product_id: string;
  product_name: string;
  user_id: string;
  user_name: string;
  rating: number;
  review_text: string;
  created_at: string;
  profile_full_name?: string | null;
}

/**
 * Get all reviews for a product with profile full_name
 */
export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  const { data, error } = await supabase
    .from("product_reviews" as any)
    .select(`
      *,
      profiles:user_id (
        full_name
      )
    `)
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  
  // Map the joined profile data to a flat structure
  return ((data || []) as any[]).map((review) => ({
    ...review,
    profile_full_name: review.profiles?.full_name || null,
    profiles: undefined, // Remove nested object
  })) as ProductReview[];
}

/**
 * Get user's profile full_name
 */
export async function getUserProfileName(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  if (error || !data?.full_name) {
    return "Verified Customer";
  }
  return data.full_name;
}

/**
 * Create a new review
 */
export async function createReview(review: {
  product_id: string;
  product_name: string;
  user_id: string;
  user_name: string;
  rating: number;
  review_text: string;
}): Promise<ProductReview> {
  const { data, error } = await supabase
    .from("product_reviews" as any)
    .insert(review)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as ProductReview;
}
