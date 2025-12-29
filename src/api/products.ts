import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch all active products
 */
export async function getAllProducts() {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      slug,
      base_price,
      sale_price,
      description,
      is_active,
      is_featured,
      product_images (
        id,
        image_url,
        is_primary
      )
    `,
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch product details by product ID
 */
export async function getProductById(productId: string) {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      slug,
      base_price,
      sale_price,
      description,
      category_id,
      product_images (
        id,
        image_url,
        is_primary
      ),
      product_variants (
        id,
        size,
        color,
        sku,
        stock_quantity,
        price_adjustment
      )
    `,
    )
    .eq("id", productId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch products based on category (slug)
 */
export async function getProductsByCategory(categorySlug: string) {
  const { data: category, error: categoryErr } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .single();

  if (categoryErr) throw categoryErr;

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      slug,
      base_price,
      sale_price,
      description,
      product_images (
        id,
        image_url,
        is_primary
      )
    `,
    )
    .eq("category_id", category.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * ✅ FIX: Fetch categories (required by Home.tsx)
 */
export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select(
      `
      id,
      name,
      slug,
      image_url,
      description,
      sort_order,
      is_active
    `,
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data || [];
}
