//import { useState, useEffect } from "react";
import { useEffect, useState } from "react";
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
  const query = searchParams.get("q") ?? "";

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    searchProducts(query)
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [query]);

  /**
   * 🔁 TRANSFORM SearchResult → ProductCard compatible format
   */
  const products = results.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug, // ✅ IMPORTANT (fixes product page issue)
    description: product.description,
    base_price: product.base_price,
    sale_price: product.sale_price,
    images:
      product.product_images?.map((img) => ({
        image_url: img.image_url,
      })) ?? [],
    category: product.categories
      ? {
          id: product.categories.id,
          name: product.categories.name,
          slug: product.categories.slug,
        }
      : null,
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="container-main py-8">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: `Search: "${query}"` }]} />

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Search className="w-6 h-6 text-primary" />
              <h1 className="section-title text-3xl md:text-4xl">Search Results</h1>
            </div>

            <p className="text-muted-foreground">
              {loading
                ? "Searching..."
                : `Found ${products.length} result${products.length !== 1 ? "s" : ""} for "${query}"`}
            </p>
          </div>

          {/* Results */}
          {loading ? (
            <Loader />
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Search className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-heading font-semibold mb-2">No products found</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                We couldn’t find any products matching "{query}". Try searching with different keywords.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
