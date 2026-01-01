import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductCard from "@/components/ProductCard";
import Loader from "@/components/Loader";
import { searchProducts, type SearchResult } from "@/api/search";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function performSearch() {
      setLoading(true);
      try {
        const data = await searchProducts(query);
        setResults(data);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [query]);

  // Transform SearchResult to ProductCard format
  const formattedProducts = results.map((result) => ({
    id: result.id,
    name: result.name,
    slug: result.id, // Use id as slug fallback for search results
    description: result.description,
    base_price: result.base_price,
    sale_price: result.sale_price,
    images: result.product_images?.map((img) => ({ image_url: img.image_url })) || [],
    category: result.categories,
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="container-main py-8">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: `Search: "${query}"` },
            ]}
          />

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Search className="w-6 h-6 text-primary" />
              <h1 className="section-title text-3xl md:text-4xl">Search Results</h1>
            </div>
            <p className="text-muted-foreground">
              {loading
                ? "Searching..."
                : `Found ${results.length} result${results.length !== 1 ? "s" : ""} for "${query}"`}
            </p>
          </div>

          {/* Results */}
          {loading ? (
            <Loader />
          ) : formattedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {formattedProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Search className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-heading font-semibold mb-2">No products found</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                We couldn't find any products matching "{query}". Try different keywords or browse
                our categories.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
