import { supabase } from "@/integrations/supabase/client";

/* ---------------------------------------------------
   GET ALL PRODUCTS
--------------------------------------------------- */
export async function getAllProducts() {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      base_price,
      sale_price,
      slug,
      description,
      category_id,
      product_images (
        url:image_url,
        is_primary
      )
    `,
    )
    .eq("is_active", true);

  if (error) throw error;
  return data;
}

/* ---------------------------------------------------
   GET FEATURED PRODUCTS
--------------------------------------------------- */
export async function getFeaturedProducts() {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      base_price,
      sale_price,
      slug,
      product_images (
        url:image_url,
        is_primary
      )
    `,
    )
    .eq("is_featured", true)
    .eq("is_active", true);

  if (error) throw error;
  return data;
}

/* ---------------------------------------------------
   GET PRODUCT BY SLUG
--------------------------------------------------- */
export async function getProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      description,
      base_price,
      sale_price,
      slug,
      product_images (
        url:image_url,
        is_primary
      ),
      product_variants(*)
    `,
    )
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data;
}

/* ---------------------------------------------------
   GET PRODUCTS BY CATEGORY SLUG
--------------------------------------------------- */
export async function getProductsByCategorySlug(slug: string) {
  const { data: category } = await supabase.from("categories").select("id").eq("slug", slug).single();

  if (!category) return [];

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      base_price,
      sale_price,
      slug,
      product_images (
        url:image_url,
        is_primary
      )
    `,
    )
    .eq("category_id", category.id)
    .eq("is_active", true);

  if (error) throw error;
  return data;
}

/* ---------------------------------------------------
   GET CATEGORIES
--------------------------------------------------- */
export async function getCategories() {
  const { data, error } = await supabase.from("categories").select("id, name, slug, image_url").eq("is_active", true);

  if (error) throw error;
  return data;
}
