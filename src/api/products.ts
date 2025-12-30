import { supabase } from "@/integrations/supabase/client";

/**
 * Format product into frontend-friendly structure
 */
function formatProduct(p: any) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    base_price: p.base_price,
    sale_price: p.sale_price,
    is_active: p.is_active,
    is_featured: p.is_featured,
    category_id: p.category_id,
    created_at: p.created_at,
    updated_at: p.updated_at,

    // Flatten relations
    images: p.product_images || [],
    variants: p.product_variants || [],
    category: p.categories || null,
  };
}

/**
 * Get ALL products (Home / Search)
 */
export async function getAllProducts(limit?: number) {
  let query = supabase
    .from("products")
    .select(
      `
      *,
      product_images (*),
      product_variants (*)
    `,
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(formatProduct);
}

/**
 * Get product by ID
 */
export async function getProductById(productId: string) {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_images (*),
      product_variants (*),
      categories (*)
    `,
    )
    .eq("id", productId)
    .single();

  if (error) throw error;
  return formatProduct(data);
}

/**
 * Get product by slug
 */
export async function getProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_images (*),
      product_variants (*),
      categories (*)
    `,
    )
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return formatProduct(data);
}

/**
 * Get products for a category ID
 */
export async function getProductsByCategory(categoryId: string) {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_images (*),
      product_variants (*)
    `,
    )
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map(formatProduct);
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug: string) {
  const { data, error } = await supabase.from("categories").select("*").eq("slug", slug).single();

  if (error) throw error;
  return data;
}

/**
 * Get products using category slug
 */
export async function getProductsByCategorySlug(slug: string) {
  const category = await getCategoryBySlug(slug);
  if (!category) return [];

  return getProductsByCategory(category.id);
}

/**
 * Get ALL active categories
 */
export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get Featured products (Home Page)
 */
export async function getFeaturedProducts() {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_images(*),
      product_variants(*)
    `,
    )
    .eq("is_featured", true)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map(formatProduct);
}
