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
}

/**
 * Get all reviews for a product
 */
export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  const { data, error } = await supabase
    .from("product_reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
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
    .from("product_reviews")
    .insert(review)
    .select()
    .single();

  if (error) throw error;
  return data;
}
