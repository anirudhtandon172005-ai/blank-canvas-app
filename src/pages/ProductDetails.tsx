import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Minus, Plus, Truck, RefreshCw, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductCard from "@/components/ProductCard";
import Loader from "@/components/Loader";
import { getProductBySlug, getAllProducts } from "@/api/products";
import ReviewSection from "@/components/reviews/ReviewSection";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export default function ProductDetails() {
  const { productSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { addItem } = useCart();
  const { isWishlisted, toggleItem } = useWishlist();
  
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  const [openAccordion, setOpenAccordion] = useState<string | null>("description");

  useEffect(() => {
    async function fetchProduct() {
      if (!productSlug) return;
      setLoading(true);
      try {
        const data = await getProductBySlug(productSlug);
        setProduct(data);
        
        // Set default selections
        if (data?.variants?.length > 0) {
          const uniqueColors = [...new Set(data.variants.map((v: any) => v.color))];
          const uniqueSizes = [...new Set(data.variants.map((v: any) => v.size))];
          if (uniqueColors.length > 0) setSelectedColor(uniqueColors[0] as string);
          if (uniqueSizes.length > 0) setSelectedSize(uniqueSizes[0] as string);
        }

        // Fetch related products
        const allProducts = await getAllProducts(8);
        setRelatedProducts((allProducts || []).filter((p: any) => p.id !== data?.id).slice(0, 4));
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [productSlug]);

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

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Product not found</p>
        </div>
        <Footer />
      </div>
    );
  }

  const images = product.images?.length > 0 
    ? product.images 
    : [{ image_url: "/placeholder.svg", alt_text: product.name }];

  const uniqueColors = [...new Set(product.variants?.map((v: any) => v.color) || [])];
  const uniqueSizes = [...new Set(product.variants?.map((v: any) => v.size) || [])];

  const selectedVariant = product.variants?.find(
    (v: any) => v.color === selectedColor && v.size === selectedSize
  );

  const currentPrice = product.sale_price || product.base_price;
  const discount = product.sale_price
    ? Math.round(((product.base_price - product.sale_price) / product.base_price) * 100)
    : 0;

  const handleAddToCart = async () => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to login to add items to cart",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!selectedVariant) {
      toast({
        title: "Select options",
        description: "Please select color and size",
        variant: "destructive",
      });
      return;
    }

    await addItem(product.id, selectedVariant.id, quantity);
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate("/cart");
  };

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <div className="container-main pb-16">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: product.category?.name || "Products", href: `/category/${product.category?.slug || "all"}` },
              { label: product.name },
            ]}
          />

          {/* Product Section */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <div className="flex gap-4">
              {/* Thumbnails */}
              <div className="hidden md:flex flex-col gap-3 w-20">
                {images.map((image: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-[3/4] rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img
                      src={image.image_url}
                      alt={image.alt_text || product.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {/* Main Image */}
              <div className="flex-1 relative">
                {product.is_featured && (
                  <span className="absolute top-4 left-4 z-10 badge-bestseller">BESTSELLER</span>
                )}
                <motion.div
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="aspect-[3/4] rounded-xl overflow-hidden bg-secondary/30"
                >
                  <img
                    src={images[selectedImage]?.image_url}
                    alt={images[selectedImage]?.alt_text || product.name}
                    className="w-full h-full object-cover"
                  />
                </motion.div>

                {/* Mobile Thumbnails */}
                <div className="flex gap-2 mt-4 md:hidden overflow-x-auto">
                  {images.map((image: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-16 h-20 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === index ? "border-primary" : "border-transparent"
                      }`}
                    >
                      <img
                        src={image.image_url}
                        alt={image.alt_text || product.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="font-heading text-2xl md:text-3xl font-semibold">{product.name}</h1>
                <button
                  onClick={() => toggleItem(product.id)}
                  className={`p-2 rounded-full transition-colors ${
                    isWishlisted(product.id)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted(product.id) ? "fill-current" : ""}`} />
                </button>
              </div>

              <p className="text-muted-foreground mb-4">{product.description}</p>

              {/* Price */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl font-semibold text-primary">
                  ₹{currentPrice.toLocaleString()}
                </span>
                {discount > 0 && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">
                      ₹{product.base_price.toLocaleString()}
                    </span>
                    <span className="text-sm text-primary font-medium">{discount}% OFF</span>
                  </>
                )}
              </div>

              {/* Color Selector */}
              {uniqueColors.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium mb-3">
                    Color: <span className="text-primary">{selectedColor}</span>
                  </p>
                  <div className="flex gap-3">
                    {uniqueColors.map((color) => (
                      <button
                        key={color as string}
                        onClick={() => setSelectedColor(color as string)}
                        className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${
                          selectedColor === color
                            ? "border-primary ring-2 ring-primary ring-offset-2"
                            : "border-border"
                        }`}
                        style={{
                          backgroundColor:
                            color === "Gold" ? "#D4AF37" :
                            color === "Purple" ? "#9333EA" :
                            color === "Red" ? "#DC2626" :
                            color === "Green" ? "#16A34A" :
                            color === "Blue" ? "#2563EB" :
                            color === "Black" ? "#1F2937" :
                            "#E5E7EB",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              {uniqueSizes.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium">Blouse Size (Unstitched)</p>
                    <button className="text-sm text-primary hover:underline">Size Guide</button>
                  </div>
                  <div className="flex gap-2">
                    {uniqueSizes.map((size) => (
                      <button
                        key={size as string}
                        onClick={() => setSelectedSize(size as string)}
                        className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                          selectedSize === size
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {size as string}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <p className="text-sm font-medium mb-3">Quantity</p>
                <div className="flex items-center gap-1 border border-border rounded-lg w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-secondary transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:bg-secondary transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mb-8">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-primary text-primary-foreground py-3.5 rounded-full font-medium hover:bg-primary/90 transition-colors"
                >
                  Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 border border-primary text-primary py-3.5 rounded-full font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  Buy Now
                </button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 p-4 border border-border rounded-xl mb-8">
                <div className="text-center">
                  <Truck className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Free Shipping</p>
                  <p className="text-xs font-medium">in 3-5 days</p>
                </div>
                <div className="text-center border-x border-border">
                  <RefreshCw className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">7 Day Easy</p>
                  <p className="text-xs font-medium">Returns</p>
                </div>
                <div className="text-center">
                  <ShieldCheck className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">100% Secure</p>
                  <p className="text-xs font-medium">Payments</p>
                </div>
              </div>

              {/* Accordions */}
              <div className="space-y-4">
                {/* Product Description */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleAccordion("description")}
                    className="w-full flex items-center justify-between p-4 text-left font-medium hover:bg-secondary/50 transition-colors"
                  >
                    Product Description
                    {openAccordion === "description" ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                  <AnimatePresence>
                    {openAccordion === "description" && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 text-sm text-muted-foreground">
                          <p>{product.description}</p>
                          <p className="mt-2">
                            Perfect for weddings and grand festivities, the rich fabric drapes effortlessly,
                            offering a regal silhouette. The intricate border and pallu showcase traditional
                            artistry passed down through generations.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Fabric & Craft Details */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleAccordion("fabric")}
                    className="w-full flex items-center justify-between p-4 text-left font-medium hover:bg-secondary/50 transition-colors"
                  >
                    Fabric & Craft Details
                    {openAccordion === "fabric" ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                  <AnimatePresence>
                    {openAccordion === "fabric" && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 text-sm text-muted-foreground">
                          <ul className="space-y-2">
                            <li>• Material: Pure Silk</li>
                            <li>• Weave: Handwoven Zari Work</li>
                            <li>• Length: 6.3 meters (with blouse piece)</li>
                            <li>• Weight: 700-800 grams</li>
                            <li>• Origin: Traditional Indian craft</li>
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Care Instructions */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleAccordion("care")}
                    className="w-full flex items-center justify-between p-4 text-left font-medium hover:bg-secondary/50 transition-colors"
                  >
                    Care Instructions
                    {openAccordion === "care" ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                  <AnimatePresence>
                    {openAccordion === "care" && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 text-sm text-muted-foreground">
                          <ul className="space-y-2">
                            <li>• Dry clean only recommended</li>
                            <li>• Store in a cool, dry place</li>
                            <li>• Avoid direct sunlight to preserve colors</li>
                            <li>• Iron on low heat with cloth protection</li>
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Reviews */}
          <ReviewSection productId={product.id} productName={product.name} />

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="mt-16">
              <h2 className="section-title mb-8">You May Also Like</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
