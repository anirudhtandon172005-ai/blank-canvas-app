import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { toast } from "@/hooks/use-toast";
import Loader from "@/components/Loader";

export default function Wishlist() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { wishlist, loading, removeItem, refetch } = useWishlist();
  const { addItem: addToCart } = useCart();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const handleAddToCart = async (product: any) => {
    const variant = product.variants?.[0];
    if (!variant) {
      toast({
        title: "Error",
        description: "No variant available for this product",
        variant: "destructive",
      });
      return;
    }
    
    await addToCart(product.id, variant.id, 1);
    await removeItem(product.id);
  };

  const getProductImage = (product: any) => {
    const primaryImage = product.images?.find((img: any) => img.is_primary);
    return primaryImage?.image_url || product.images?.[0]?.image_url || "/placeholder.svg";
  };

  const getPrice = (product: any) => {
    return product.sale_price || product.base_price;
  };

  if (authLoading || loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container-main py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <Heart className="w-6 h-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-heading font-semibold">My Wishlist</h1>
            <span className="text-muted-foreground">({wishlist.length} items)</span>
          </div>

          {wishlist.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-heading font-medium mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-6">
                Save your favorite items here to buy them later
              </p>
              <Link to="/">
                <Button>Continue Shopping</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlist.map((item: any, index: number) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-card rounded-lg overflow-hidden border border-border group"
                >
                  <Link to={`/product/${item.product?.slug}`}>
                    <div className="aspect-[3/4] relative overflow-hidden">
                      <img
                        src={getProductImage(item.product)}
                        alt={item.product?.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {item.product?.sale_price && (
                        <span className="badge-sale absolute top-3 left-3">Sale</span>
                      )}
                    </div>
                  </Link>
                  
                  <div className="p-4">
                    <Link to={`/product/${item.product?.slug}`}>
                      <h3 className="font-medium text-foreground hover:text-primary transition-colors line-clamp-2 mb-2">
                        {item.product?.name}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <span className="font-semibold text-foreground">
                        ₹{getPrice(item.product)?.toLocaleString()}
                      </span>
                      {item.product?.sale_price && (
                        <span className="text-sm text-muted-foreground line-through">
                          ₹{item.product.base_price?.toLocaleString()}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAddToCart(item.product)}
                        className="flex-1"
                        size="sm"
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(item.product_id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}