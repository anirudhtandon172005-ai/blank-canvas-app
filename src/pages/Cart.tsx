import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import Loader from "@/components/Loader";
import { useCart } from "@/hooks/useCart";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { getProfileCompletionStatus } from "@/api/profileCompletion";

export default function Cart() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { cart, loading, cartTotal, updateItemQuantity, removeItem } = useCart();

  const shippingCost = cartTotal >= 2000 ? 0 : 99;
  const taxAmount = cartTotal * 0.05;
  const totalAmount = cartTotal + shippingCost + taxAmount;

  const handleProceedToCheckout = async () => {
    try {
      const status = await getProfileCompletionStatus();
      if (!status.isComplete) {
        toast({
          title: "Complete your profile",
          description: "Please complete your profile before checkout.",
          variant: "destructive",
        });
        navigate("/profile?completeProfile=1");
        return;
      }

      navigate("/checkout");
    } catch (error) {
      console.error("Failed to check profile completion from cart:", error);
      toast({
        title: "Unable to continue",
        description: "Failed to check profile completion. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="font-heading text-2xl font-semibold mb-2">Your cart is waiting</h1>
            <p className="text-muted-foreground mb-6">Please login to view your cart</p>
            <Link to="/login" className="btn-primary">
              Login to Continue
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader />
        </div>
        <Footer />
      </div>
    );
  }

  const cartItems = cart?.items || [];

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="font-heading text-2xl font-semibold mb-2">Your cart is empty</h1>
            <p className="text-muted-foreground mb-6">Looks like you haven't added anything yet</p>
            <Link to="/category/all" className="btn-primary">
              Start Shopping
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <div className="container-main pb-16">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shopping Cart" }]} />

          <h1 className="section-title text-3xl mb-8">Shopping Cart</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item: any, index: number) => {
                const price = item.product?.sale_price || item.product?.base_price || 0;
                const adjustment = item.variant?.price_adjustment || 0;
                const itemPrice = price + adjustment;
                const primaryImage = item.product?.product_images?.find((img: any) => img.is_primary) || item.product?.product_images?.[0];

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-4 p-4 border border-border rounded-xl"
                  >
                    <Link to={`/product/${item.product?.slug}`} className="shrink-0">
                      <div className="w-24 h-32 rounded-lg overflow-hidden bg-secondary/30">
                        <img
                          src={primaryImage?.image_url || "/placeholder.svg"}
                          alt={item.product?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>

                    <div className="flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link to={`/product/${item.product?.slug}`} className="font-medium hover:text-primary transition-colors">
                            {item.product?.name}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {item.variant?.color} • {item.variant?.size}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-1 border border-border rounded-lg">
                          <button
                            onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                            className="p-2 hover:bg-secondary transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                            className="p-2 hover:bg-secondary transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="font-semibold text-primary">
                          ₹{(itemPrice * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="border border-border rounded-xl p-6 sticky top-24">
                <h2 className="font-heading text-xl font-semibold mb-6">Order Summary</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({cartItems.length} items)</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className={shippingCost === 0 ? "text-green-600" : ""}>
                      {shippingCost === 0 ? "FREE" : `₹${shippingCost}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST (5%)</span>
                    <span>₹{taxAmount.toFixed(0)}</span>
                  </div>
                  
                  {shippingCost > 0 && (
                    <p className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
                      Add ₹{(2000 - cartTotal).toLocaleString()} more for free shipping
                    </p>
                  )}

                  <div className="border-t border-border pt-3 mt-3">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span className="text-primary">₹{totalAmount.toFixed(0)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleProceedToCheckout}
                  className="w-full mt-6 bg-primary text-primary-foreground py-3.5 rounded-full font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </button>

                <Link
                  to="/category/all"
                  className="block text-center mt-4 text-sm text-primary hover:underline"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
