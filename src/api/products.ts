import { supabase } from "@/integrations/supabase/client";

// ✅ Get ALL products
export async function getAllProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(image_url, is_primary), product_variants(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// ✅ Get single product by ID
export async function getProductById(productId: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*), product_variants(*)")
    .eq("id", productId)
    .single();

  if (error) throw error;
  return data;
}

// ✅ Get products for a category ID
export async function getProductsByCategory(categoryId: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(image_url, is_primary)")
    .eq("category_id", categoryId);

  if (error) throw error;
  return data;
}

// ✅ Get products using category slug
export async function getProductsByCategorySlug(slug: string) {
  const { data: category } = await supabase.from("categories").select("id").eq("slug", slug).single();

  if (!category) return [];

  return getProductsByCategory(category.id);
}

// ✅ Get category by slug
export async function getCategoryBySlug(slug: string) {
  const { data, error } = await supabase.from("categories").select("*").eq("slug", slug).single();

  if (error) throw error;
  return data;
}

// ✅ Featured products (Home Page)
export async function getFeaturedProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(image_url, is_primary)")
    .eq("is_featured", true);

  if (error) throw error;
  return data;
}
