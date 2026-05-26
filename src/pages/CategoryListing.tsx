import { useMemo, useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductCard from "@/components/ProductCard";
import Loader from "@/components/Loader";
import { supabase } from "@/integrations/supabase/client";
import { useResponsivePageSize } from "@/hooks/useResponsivePageSize";

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
  product_variants: any[]
};

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
  const queryClient = useQueryClient();

  const [sortBy, setSortBy] = useState<SortBy>("popularity");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Responsive page size: adapts to screen width for full grid rows
  const { pageSize, breakpoint } = useResponsivePageSize();
  const prevBreakpointRef = useRef(breakpoint);

  const isAll = !categorySlug || categorySlug === "all";
  const isNewArrivals = categorySlug === "new-arrivals";
  const listingKey = isAll ? "all" : isNewArrivals ? "new-arrivals" : categorySlug ?? "all";
  const sevenDaysAgoIso = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return sevenDaysAgo.toISOString();
  }, []);

  // 1) Fetch category by slug FIRST (no join-based slug filtering)
  const categoryQuery = useQuery({
    queryKey: ["category", categorySlug],
    enabled: !!categorySlug && !isAll && !isNewArrivals,
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

  // Reset pagination when breakpoint changes
  useEffect(() => {
    if (prevBreakpointRef.current !== breakpoint) {
      prevBreakpointRef.current = breakpoint;
      // Invalidate the products query to refetch with new page size
      queryClient.resetQueries({ queryKey: ["category-products", listingKey] });
    }
  }, [breakpoint, queryClient, listingKey]);

  // 2) Fetch products by category_id (or all products for /category/all), paginated, with count
  const productsQuery = useInfiniteQuery({
    queryKey: ["category-products", listingKey, categoryId, pageSize],
    enabled: isAll || isNewArrivals || !!categoryId,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const from = Number(pageParam);
      const to = from + pageSize - 1;

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

      if (isNewArrivals) {
        query = query.gte("created_at", sevenDaysAgoIso);
      } else if (!isAll) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error, count } = await query.range(from, to);
      if (error) throw error;

      return {
        items: (data || []).map((p) => formatProduct(p as ProductRow)),
        total: count ?? 0,
        from,
        to,
        pageSize,
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
    if (isNewArrivals) {
      return { name: "New Arrivals", description: "Fresh arrivals from the last 7 days" };
    }
    return {
      name: categoryQuery.data?.name || "Products",
      description:
        categoryQuery.data?.description || "Discover timeless Indian craftsmanship tailored for elegance.",
    };
  }, [categoryQuery.data, isAll, isNewArrivals]);

  const products = useMemo(() => {
    const pages = productsQuery.data?.pages ?? [];
    return pages.flatMap((p) => p.items);
  }, [productsQuery.data]);

  const totalCount = productsQuery.data?.pages?.[0]?.total ?? 0;

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
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
  }, [products, sortBy]);

  const isLoading = categoryQuery.isLoading || productsQuery.isLoading;
  const isError = categoryQuery.isError || productsQuery.isError;
  const errorMessage =
    (categoryQuery.error as any)?.message || (productsQuery.error as any)?.message || "";

  const showEmpty = !isLoading && !isError && sortedProducts.length === 0;
  const toolbarStatusText = showEmpty
    ? isNewArrivals
      ? "Showing 0 items"
      : isAll
        ? "No products available right now."
        : "Coming Soon"
    : `Showing ${sortedProducts.length} items`;

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

          <div>
            <div className="w-full">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6 gap-4">
                <div className="flex items-center">
                  <span className="text-primary text-sm">{toolbarStatusText}</span>
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
                  {isNewArrivals ? (
                    <div className="space-y-3">
                      <p className="text-muted-foreground">No new arrivals this week.</p>
                      <p className="text-sm text-muted-foreground">Check back soon for fresh styles.</p>
                      <Link
                        to="/category/all"
                        className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        View All Products
                      </Link>
                    </div>
                  ) : isAll ? (
                    <div className="space-y-2">
                      <h2 className="text-2xl font-heading font-semibold">No products available right now.</h2>
                      <p className="text-sm text-muted-foreground">Please check back soon.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h2 className="text-2xl font-heading font-semibold">Coming Soon</h2>
                      <p className="text-sm text-muted-foreground">
                        We’re curating beautiful pieces for this collection. Please check back soon.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
