import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { getWishlist, addToWishlist, removeFromWishlist } from "@/api/wishlist";
import { toast } from "@/hooks/use-toast";

export function useWishlist() {
  const { user, loading: authLoading } = useAuth();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      setWishlistIds(new Set());
      setLoading(false);
      return;
    }

    try {
      const data = await getWishlist(user.id);
      setWishlist(data);
      setWishlistIds(new Set(data.map((item: any) => item.product_id)));
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchWishlist();
    }
  }, [authLoading, fetchWishlist]);

  const addItem = async (productId: string) => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to login to add items to wishlist",
        variant: "destructive",
      });
      return;
    }

    try {
      await addToWishlist(user.id, productId);
      await fetchWishlist();
      toast({
        title: "Added to wishlist",
        description: "Item has been added to your wishlist",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add to wishlist",
        variant: "destructive",
      });
    }
  };

  const removeItem = async (productId: string) => {
    if (!user) return;
    
    try {
      await removeFromWishlist(user.id, productId);
      await fetchWishlist();
      toast({
        title: "Removed",
        description: "Item has been removed from your wishlist",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove from wishlist",
        variant: "destructive",
      });
    }
  };

  const toggleItem = async (productId: string) => {
    if (wishlistIds.has(productId)) {
      await removeItem(productId);
    } else {
      await addItem(productId);
    }
  };

  const isWishlisted = (productId: string) => wishlistIds.has(productId);

  return {
    wishlist,
    loading: loading || authLoading,
    wishlistCount: wishlist.length,
    addItem,
    removeItem,
    toggleItem,
    isWishlisted,
    refetch: fetchWishlist,
  };
}
