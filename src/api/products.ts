import { supabase } from "@/integrations/supabase/client";

// Get ALL products
export async function getAllProducts(limit?: number) {
  let query = supabase
    .from("products")
    .select("*, product_images(image_url, is_primary), product_variants(*)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

// Get single product by ID
export async function getProductById(productId: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*), product_variants(*), categories(*)")
    .eq("id", productId)
    .single();

  if (error) throw error;
  return {
    ...data,
    images: data.product_images,
    variants: data.product_variants,
    category: data.categories,
  };
}

// Get single product by slug
export async function getProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*), product_variants(*), categories(*)")
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return {
    ...data,
    images: data.product_images,
    variants: data.product_variants,
    category: data.categories,
  };
}

// Get products for a category ID
export async function getProductsByCategory(categoryId: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(image_url, is_primary)")
    .eq("category_id", categoryId)
    .eq("is_active", true);

  if (error) throw error;
  return data;
}

// Get products using category slug
export async function getProductsByCategorySlug(slug: string) {
  const { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!category) return [];

  return getProductsByCategory(category.id);
}

// Get category by slug
export async function getCategoryBySlug(slug: string) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data;
}

// Get all categories
export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data;
}

// Featured products (Home Page)
export async function getFeaturedProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(image_url, is_primary)")
    .eq("is_featured", true)
    .eq("is_active", true);

  if (error) throw error;
  return data;
}
