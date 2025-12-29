import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type FormattedProduct = {
  id: string;
  name: string;
  description: string | null;
  finalPrice: number;
  basePrice: number;
  salePrice: number | null;
  images: { id: string; url: string; alt: string | null }[];
  variants: {
    id: string;
    size: string;
    color: string;
    priceAdjustment: number;
    stock: number;
  }[];
  inStock: boolean;
};

function formatProduct(
  product: Tables<"products">,
  images: Tables<"product_images">[],
  variants: Tables<"product_variants">[],
): FormattedProduct {
  const basePrice = product.base_price;
  const salePrice = product.sale_price ?? product.base_price;
  const finalPrice = salePrice;

  const formattedImages = images.map((img) => ({
    id: img.id,
    url: img.image_url,
    alt: img.alt_text,
  }));

  const formattedVariants = variants.map((v) => ({
    id: v.id,
    size: v.size,
    color: v.color,
    priceAdjustment: v.price_adjustment ?? 0,
    stock: v.stock_quantity,
  }));

  const totalStock = formattedVariants.reduce((s, v) => s + (v.stock ?? 0), 0);

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    finalPrice,
    basePrice,
    salePrice,
    images: formattedImages,
    variants: formattedVariants,
    inStock: totalStock > 0,
  };
}

export async function getProductById(productId: string) {
  const { data: product } = await supabase.from("products").select("*").eq("id", productId).maybeSingle();

  if (!product) return null;

  const { data: images } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", product.id)
    .order("sort_order", { ascending: true });

  const { data: variants } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", product.id)
    .eq("is_active", true);

  return formatProduct(product, images || [], variants || []);
}

export async function getAllProducts() {
  const { data: products } = await supabase.from("products").select("*").eq("is_active", true);

  if (!products) return [];

  const ids = products.map((p) => p.id);

  const { data: images } = await supabase.from("product_images").select("*").in("product_id", ids);

  const { data: variants } = await supabase
    .from("product_variants")
    .select("*")
    .in("product_id", ids)
    .eq("is_active", true);

  const imageMap: Record<string, Tables<"product_images">[]> = {};
  images?.forEach((img) => {
    if (!imageMap[img.product_id]) imageMap[img.product_id] = [];
    imageMap[img.product_id].push(img);
  });

  const variantMap: Record<string, Tables<"product_variants">[]> = {};
  variants?.forEach((v) => {
    if (!variantMap[v.product_id]) variantMap[v.product_id] = [];
    variantMap[v.product_id].push(v);
  });

  return products.map((p) => formatProduct(p, imageMap[p.id] || [], variantMap[p.id] || []));
}
