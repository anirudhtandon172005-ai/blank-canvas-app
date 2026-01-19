import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown, X, SlidersHorizontal } from "lucide-react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductCard from "@/components/ProductCard";
import Loader from "@/components/Loader";
import { supabase } from "@/integrations/supabase/client";

const COLORS = [
  { name: "Red", value: "red" },
  { name: "Black", value: "black" },
  { name: "Gold", value: "gold" },
  { name: "Green", value: "green" },
  { name: "Blue", value: "blue" },
  { name: "Purple", value: "purple" },
];

const OCCASIONS = ["Wedding", "Party", "Festive", "Casual"];

const SORT_OPTIONS = [
  { label: "Popularity", value: "popularity" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Newest First", value: "newest" },
] as const;

type SortBy = (typeof SORT_OPTIONS)[number]["value"];

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  sale_price: number | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  product_images: any[];
  product_variants: any[];
};

const PAGE_SIZE = 2;

function formatProduct(p: ProductRow) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    base_price: p.base_price,
    sale_price: p.sale_price,
    is_active: p.is_active,
    is_featured: p.is_featured,
    category_id: p.category_id,
    created_at: p.created_at,
    updated_at: p.updated_at,
    images: p.product_images || [],
    variants: p.product_variants || [],
  };
}

export default function CategoryListing() {
  const { categorySlug } = useParams();

  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  // IMPORTANT: default min price must not hide products (previously 2000 filtered out ₹1900 sarees)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [sortBy, setSortBy] = useState<SortBy>("popularity");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const isAll = !categorySlug || categorySlug === "all";

  // 1) Fetch category by slug FIRST (no join-based slug filtering)
  const categoryQuery = useQuery({
    queryKey: ["category", categorySlug],
    enabled: !!categorySlug && !isAll,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name,slug,description")
        .eq("slug", categorySlug!)
        .maybeSingle();

      if (error) throw error;
      return data as CategoryRow | null;
    },
  });

  const categoryId = categoryQuery.data?.id ?? null;

  // 2) Fetch products by category_id (or all products for /category/all), paginated, with count
  const productsQuery = useInfiniteQuery({
    queryKey: ["category-products", isAll ? "all" : categoryId],
    enabled: isAll || !!categoryId,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const from = Number(pageParam);
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("products")
        .select(
          `
            *,
            product_images (*),
            product_variants (*)
          `,
          { count: "exact" },
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (!isAll) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error, count } = await query.range(from, to);
      if (error) throw error;

      return {
        items: (data || []).map((p) => formatProduct(p as ProductRow)),
        total: count ?? 0,
        from,
        to,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.items.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
  });

  const category = useMemo(() => {
    if (isAll) {
      return { name: "All Products", description: "Discover our complete collection" };
    }
    return {
      name: categoryQuery.data?.name || "Products",
      description:
        categoryQuery.data?.description || "Discover timeless Indian craftsmanship tailored for elegance.",
    };
  }, [categoryQuery.data, isAll]);

  const products = useMemo(() => {
    const pages = productsQuery.data?.pages ?? [];
    return pages.flatMap((p) => p.items);
  }, [productsQuery.data]);

  const totalCount = productsQuery.data?.pages?.[0]?.total ?? 0;

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const price = product.sale_price || product.base_price;
      if (price < priceRange[0] || price > priceRange[1]) return false;
      // NOTE: color/occasion filters are placeholders in current UI; keep them non-blocking.
      return true;
    });
  }, [products, priceRange]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
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
  }, [filteredProducts, sortBy]);

  const isLoading = categoryQuery.isLoading || productsQuery.isLoading;
  const isError = categoryQuery.isError || productsQuery.isError;
  const errorMessage =
    (categoryQuery.error as any)?.message || (productsQuery.error as any)?.message || "";

  const toggleColor = (color: string) => {
    setSelectedColors((prev) => (prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]));
  };

  const toggleOccasion = (occasion: string) => {
    setSelectedOccasions((prev) =>
      prev.includes(occasion) ? prev.filter((o) => o !== occasion) : [...prev, occasion],
    );
  };

  const clearFilters = () => {
    setSelectedColors([]);
    setSelectedOccasions([]);
    setPriceRange([0, 50000]);
  };

  const showEmpty = !isLoading && !isError && sortedProducts.length === 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="container-main">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: category.name },
            ]}
          />

          {/* Header */}
          <div className="mb-8">
            <h1 className="section-title text-3xl md:text-4xl">{category.name}</h1>
            <p className="text-muted-foreground mt-2">{category.description}</p>
          </div>

          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <aside
              className={`
                fixed inset-0 z-50 bg-background lg:static lg:z-0 lg:bg-transparent
                ${showFilters ? "block" : "hidden"} lg:block lg:w-64 lg:shrink-0
              `}
            >
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
                      min={0}
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
                          selectedColors.includes(color.value) ? "border-primary scale-110" : "border-transparent"
                        }`}
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
                  <span className="text-primary text-sm">Showing {sortedProducts.length} items</span>
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:border-primary transition-colors"
                  >
                    <span className="text-sm">
                      Sort by: {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
                    </span>
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

              {isLoading ? (
                <Loader />
              ) : isError ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">{errorMessage || "Something went wrong."}</p>
                </div>
              ) : showEmpty ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">No products found in this category.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    {sortedProducts.map((product, index) => (
                      <ProductCard key={product.id} product={product} index={index} />
                    ))}
                  </div>

                  {/* Load More */}
                  <div className="mt-12 text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      Showing {products.length} of {totalCount} products
                    </p>
                    {productsQuery.hasNextPage ? (
                      <button
                        disabled={productsQuery.isFetchingNextPage}
                        onClick={() => productsQuery.fetchNextPage()}
                        className="bg-foreground text-background px-8 py-3 rounded-full font-medium hover:bg-foreground/90 transition-colors disabled:opacity-60"
                      >
                        {productsQuery.isFetchingNextPage ? "Loading…" : "Load More Products"}
                      </button>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
