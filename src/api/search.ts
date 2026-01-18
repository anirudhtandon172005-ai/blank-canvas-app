//import { supabase } from "@/integrations/supabase/client";

import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  sale_price: number | null;
  product_images: { image_url: string }[];
}

export async function searchProducts(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

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
      product_images (
        image_url
      )
    `,
    )
    .eq("is_active", true)
    .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);

  if (error) {
    console.error("Search error:", error);
    return [];
  }

  return data || [];
}
