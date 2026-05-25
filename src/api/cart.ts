import { supabase } from "@/integrations/supabase/client";

interface CartStockValidationItem {
  id: string;
  variant_id: string;
  quantity: number;
  product_name?: string | null;
}

interface VariantStockRow {
  id: string;
  stock_quantity: number;
  is_active: boolean | null;
}

export interface CartStockIssue {
  cartItemId: string;
  variantId: string;
  productName: string;
  availableStock: number;
  requestedQuantity: number;
  isOutOfStock: boolean;
}

export interface CartStockValidationResult {
  isValid: boolean;
  issues: CartStockIssue[];
  stockByVariant: Record<string, number>;
}

// ------------------------------
// Ensure a cart exists
// ------------------------------
export async function getOrCreateCart(userId: string) {
  const { data, error } = await supabase.from("carts").select("id").eq("user_id", userId).maybeSingle();

  if (error) throw error;

  // Cart exists → return it
  if (data) return data.id;

  // Create new cart
  const { data: newCart, error: createErr } = await supabase
    .from("carts")
    .insert({ user_id: userId })
    .select("id")
    .single();

  if (createErr) throw createErr;

  return newCart.id;
}

// ------------------------------
// Get full cart with product + variant + images
// ------------------------------
export async function getCart(userId: string) {
  const cartId = await getOrCreateCart(userId);

  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `
      id,
      quantity,
      product_id,
      variant_id,

      products (
        id,
        name,
        slug,
        description,
        base_price,
        sale_price,
        category_id,
        product_images (
          id,
          image_url,
          is_primary,
          sort_order
        )
      ),

      product_variants (
        id,
        size,
        color,
        sku,
        stock_quantity,
        price_adjustment,
        is_active
      )
    `,
    )
    .eq("cart_id", cartId);

  if (error) throw error;

  const items = (data || []).map((item: any) => ({
    id: item.id,
    quantity: item.quantity,
    product_id: item.product_id,
    variant_id: item.variant_id,
    product: item.products,
    variant: item.product_variants,
  }));

  return { id: cartId, user_id: userId, items };
}

// ------------------------------
// Add item to cart
// ------------------------------
export async function addToCart(userId: string, productId: string, variantId: string, quantity = 1) {
  const cartId = await getOrCreateCart(userId);

  const { data: variant, error: variantError } = await supabase
    .from("product_variants")
    .select("id, stock_quantity, is_active")
    .eq("id", variantId)
    .maybeSingle();

  if (variantError) throw variantError;
  if (!variant || variant.is_active === false) {
    throw new Error("Out of stock");
  }

  const availableStock = Number(variant.stock_quantity || 0);
  if (availableStock <= 0) {
    throw new Error("Out of stock");
  }

  // Check if already in cart
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("product_id", productId)
    .eq("variant_id", variantId)
    .maybeSingle();

  const nextQuantity = (existing?.quantity || 0) + quantity;
  if (nextQuantity > availableStock) {
    throw new Error(`Only ${availableStock} pieces left`);
  }

  // Update quantity
  if (existing) {
    const { data, error } = await supabase
      .from("cart_items")
      .update({ quantity: nextQuantity })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Insert new
  const { data, error } = await supabase
    .from("cart_items")
    .insert({
      cart_id: cartId,
      product_id: productId,
      variant_id: variantId,
      quantity,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

// ------------------------------
// Update quantity
// ------------------------------
export async function updateQuantity(cartItemId: string, quantity: number) {
  if (quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  const { data: cartItem, error: cartItemError } = await supabase
    .from("cart_items")
    .select("variant_id")
    .eq("id", cartItemId)
    .maybeSingle();

  if (cartItemError) throw cartItemError;
  if (!cartItem?.variant_id) throw new Error("Cart item not found");

  const { data: variant, error: variantError } = await supabase
    .from("product_variants")
    .select("stock_quantity, is_active")
    .eq("id", cartItem.variant_id)
    .maybeSingle();

  if (variantError) throw variantError;
  if (!variant || variant.is_active === false || Number(variant.stock_quantity || 0) <= 0) {
    throw new Error("Out of stock");
  }

  const availableStock = Number(variant.stock_quantity || 0);
  if (quantity > availableStock) {
    throw new Error(`Only ${availableStock} pieces left`);
  }

  const { data, error } = await supabase.from("cart_items").update({ quantity }).eq("id", cartItemId).select().single();

  if (error) throw error;
  return data;
}

// ------------------------------
// Remove single item
// ------------------------------
export async function removeFromCart(cartItemId: string) {
  const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);

  if (error) throw error;
  return true;
}

// ------------------------------
// Clear entire cart
// ------------------------------
export async function clearCart(userId: string) {
  const cartId = await getOrCreateCart(userId);

  const { error } = await supabase.from("cart_items").delete().eq("cart_id", cartId);

  if (error) throw error;
  return true;
}

export async function validateCartItemStocks(
  items: CartStockValidationItem[],
): Promise<CartStockValidationResult> {
  if (!items.length) {
    return { isValid: true, issues: [], stockByVariant: {} };
  }

  const variantIds = [...new Set(items.map((item) => item.variant_id).filter(Boolean))];
  if (!variantIds.length) {
    return { isValid: true, issues: [], stockByVariant: {} };
  }

  const { data: variants, error } = await supabase
    .from("product_variants")
    .select("id, stock_quantity, is_active")
    .in("id", variantIds);

  if (error) throw error;

  const stockMap = new Map<string, VariantStockRow>((variants || []).map((variant) => [variant.id, variant]));
  const stockByVariant: Record<string, number> = {};
  const issues: CartStockIssue[] = [];

  for (const item of items) {
    const variant = stockMap.get(item.variant_id);
    const availableStock = Number(variant?.stock_quantity || 0);
    stockByVariant[item.variant_id] = availableStock;

    const isOutOfStock = !variant || variant.is_active === false || availableStock <= 0;
    const exceeds = item.quantity > availableStock;

    if (isOutOfStock || exceeds) {
      issues.push({
        cartItemId: item.id,
        variantId: item.variant_id,
        productName: item.product_name || "Item",
        availableStock,
        requestedQuantity: item.quantity,
        isOutOfStock,
      });
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    stockByVariant,
  };
}
