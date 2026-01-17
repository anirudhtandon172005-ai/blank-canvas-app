import { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { getCart, addToCart, updateQuantity, removeFromCart, clearCart } from "@/api/cart";
import { toast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  product: any;
  variant: any;
}

interface Cart {
  id: string;
  user_id: string;
  items: CartItem[];
}

export function useCart() {
  const { user, loading: authLoading } = useAuthContext();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart(null);
      setLoading(false);
      return;
    }

    try {
      const data = await getCart(user.id);
      setCart(data);
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchCart();
    }
  }, [authLoading, fetchCart]);

  const addItem = async (productId: string, variantId: string, quantity: number = 1) => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to login to add items to cart",
        variant: "destructive",
      });
      return;
    }

    try {
      await addToCart(user.id, productId, variantId, quantity);
      await fetchCart();
      toast({
        title: "Added to cart",
        description: "Item has been added to your cart",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  const updateItemQuantity = async (cartItemId: string, quantity: number) => {
    try {
      await updateQuantity(cartItemId, quantity);
      await fetchCart();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update quantity",
        variant: "destructive",
      });
    }
  };

  const removeItem = async (cartItemId: string) => {
    try {
      await removeFromCart(cartItemId);
      await fetchCart();
      toast({
        title: "Removed",
        description: "Item has been removed from your cart",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  const emptyCart = async () => {
    if (!user) return;
    
    try {
      await clearCart(user.id);
      await fetchCart();
    } catch (error: any) {
      console.error("Error clearing cart:", error);
    }
  };

  const cartCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const cartTotal = cart?.items?.reduce((sum, item) => {
    const price = item.product?.sale_price || item.product?.base_price || 0;
    const adjustment = item.variant?.price_adjustment || 0;
    return sum + (price + adjustment) * item.quantity;
  }, 0) || 0;

  return {
    cart,
    loading: loading || authLoading,
    cartCount,
    cartTotal,
    addItem,
    updateItemQuantity,
    removeItem,
    emptyCart,
    refetch: fetchCart,
  };
}
