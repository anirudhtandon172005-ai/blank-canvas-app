import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown, X, SlidersHorizontal } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductCard from "@/components/ProductCard";
import Loader from "@/components/Loader";
import { getProductsByCategorySlug, getCategoryBySlug, getAllProducts } from "@/api/products";

const COLORS = [
  { name: "Red", value: "red", hex: "#DC2626" },
  { name: "Black", value: "black", hex: "#1F2937" },
  { name: "Gold", value: "gold", hex: "#D4AF37" },
  { name: "Green", value: "green", hex: "#16A34A" },
  { name: "Blue", value: "blue", hex: "#2563EB" },
  { name: "Purple", value: "purple", hex: "#9333EA" },
];

const OCCASIONS = ["Wedding", "Party", "Festive", "Casual"];

const SORT_OPTIONS = [
  { label: "Popularity", value: "popularity" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Newest First", value: "newest" },
];

export default function CategoryListing() {
  const { categorySlug } = useParams();
  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([2000, 50000]);
  const [sortBy, setSortBy] = useState("popularity");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        if (categorySlug && categorySlug !== "all") {
          const [categoryData, productsData] = await Promise.all([
            getCategoryBySlug(categorySlug),
            getProductsByCategorySlug(categorySlug),
          ]);
          setCategory(categoryData);
          setProducts(productsData || []);
        } else {
          const productsData = await getAllProducts();
          setProducts(productsData || []);
          setCategory({ name: "All Products", description: "Discover our complete collection" });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [categorySlug]);

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const toggleOccasion = (occasion: string) => {
    setSelectedOccasions((prev) =>
      prev.includes(occasion) ? prev.filter((o) => o !== occasion) : [...prev, occasion]
    );
  };

  const clearFilters = () => {
    setSelectedColors([]);
    setSelectedOccasions([]);
    setPriceRange([2000, 50000]);
  };

  const filteredProducts = products.filter((product) => {
    const price = product.sale_price || product.base_price;
    if (price < priceRange[0] || price > priceRange[1]) return false;
    // Add more filter logic as needed
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = a.sale_price || a.base_price;
    const priceB = b.sale_price || b.base_price;
    
    switch (sortBy) {
      case "price_asc":
        return priceA - priceB;
      case "price_desc":
        return priceB - priceA;
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <div className="container-main">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: category?.name || "Products" },
            ]}
          />

          {/* Header */}
          <div className="mb-8">
            <h1 className="section-title text-3xl md:text-4xl">{category?.name || "Products"}</h1>
            <p className="text-muted-foreground mt-2">
              {category?.description || "Discover timeless Indian craftsmanship tailored for elegance."}
            </p>
          </div>

          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <aside className={`
              fixed inset-0 z-50 bg-background lg:static lg:z-0 lg:bg-transparent
              ${showFilters ? "block" : "hidden"} lg:block lg:w-64 lg:shrink-0
            `}>
              <div className="h-full overflow-y-auto p-6 lg:p-0">
                {/* Mobile Header */}
                <div className="flex items-center justify-between mb-6 lg:hidden">
                  <h2 className="font-heading text-xl font-semibold">Filters</h2>
                  <button onClick={() => setShowFilters(false)}>
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading text-lg font-semibold">Filters</h2>
                  <button onClick={clearFilters} className="text-sm text-primary hover:underline">
                    Clear all
                  </button>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <h3 className="font-medium mb-3 flex items-center justify-between">
                    Price Range
                    <ChevronDown className="w-4 h-4" />
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="range"
                      min={2000}
                      max={50000}
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full accent-primary"
                    />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>₹{priceRange[0].toLocaleString()}</span>
                      <span>₹{priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Color */}
                <div className="mb-6">
                  <h3 className="font-medium mb-3 flex items-center justify-between">
                    Color
                    <ChevronDown className="w-4 h-4" />
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => toggleColor(color.value)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          selectedColors.includes(color.value)
                            ? "border-primary scale-110"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Occasion */}
                <div className="mb-6">
                  <h3 className="font-medium mb-3 flex items-center justify-between">
                    Occasion
                    <ChevronDown className="w-4 h-4" />
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {OCCASIONS.map((occasion) => (
                      <button
                        key={occasion}
                        onClick={() => toggleOccasion(occasion)}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                          selectedOccasions.includes(occasion)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {occasion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowFilters(true)}
                    className="flex items-center gap-2 lg:hidden px-3 py-2 border border-border rounded-lg"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Filters</span>
                  </button>
                  <span className="text-primary text-sm">
                    Showing {sortedProducts.length} items
                  </span>
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:border-primary transition-colors"
                  >
                    <span className="text-sm">Sort by: {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showSortDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-50"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value);
                            setShowSortDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors first:rounded-t-lg last:rounded-b-lg ${
                            sortBy === option.value ? "text-primary font-medium" : ""
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>

              {loading ? (
                <Loader />
              ) : sortedProducts.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    {sortedProducts.map((product, index) => (
                      <ProductCard key={product.id} product={product} index={index} />
                    ))}
                  </div>

                  {/* Load More */}
                  <div className="mt-12 text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      Showing {sortedProducts.length} of {products.length} products
                    </p>
                    <button className="bg-foreground text-background px-8 py-3 rounded-full font-medium hover:bg-foreground/90 transition-colors">
                      Load More Products
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">No products found in this category.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
