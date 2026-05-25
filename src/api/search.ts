//import { supabase } from "@/integrations/supabase/client";

import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  id: string;
  name: string;
  slug: string; // ✅ IMPORTANT
  description: string | null;
  base_price: number;
  sale_price: number | null;
  categories: {
    id: string;
    name: string;
    slug: string;
  } | null;
  product_images: {
    image_url: string;
  }[];
  product_variants: {
    id: string;
    stock_quantity: number;
    is_active: boolean | null;
    size: string;
    color: string;
  }[];
}

export async function searchProducts(query: string): Promise<SearchResult[]> {
  if (!query || !query.trim()) return [];

  const searchTerm = query.trim();

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      slug,
      description,
      base_price,
      sale_price,
      categories (
        id,
        name,
        slug
      ),
      product_images (
        image_url
      ),
      product_variants (
        id,
        stock_quantity,
        is_active,
        size,
        color
      )
    `,
    )
    .eq("is_active", true)
    .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    .limit(10);

  if (error) {
    console.error("Search error:", error);
    return [];
  }

  return data ?? [];
}
