import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { SearchResult } from "@/api/search";

interface SearchSuggestionsProps {
  query: string;
  results: SearchResult[];
  onSelect: (productId: string) => void;
  isLoading?: boolean;
}

export default function SearchSuggestions({
  query,
  results,
  onSelect,
  isLoading = false,
}: SearchSuggestionsProps) {
  const displayResults = results.slice(0, 6);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden"
      >
        <div className="p-3 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 bg-muted rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (query && displayResults.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg z-50 p-6 text-center"
      >
        <p className="text-muted-foreground text-sm">No results found for "{query}"</p>
      </motion.div>
    );
  }

  if (displayResults.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden"
    >
      <ul className="divide-y divide-border">
        {displayResults.map((product) => {
          const imageUrl = product.product_images?.[0]?.image_url || "/placeholder.svg";
          const price = product.sale_price || product.base_price;

          return (
            <li key={product.id}>
              <Link
                to={`/product/${product.id}`}
                onClick={() => onSelect(product.id)}
                className="flex items-center gap-3 p-3 hover:bg-secondary transition-colors"
              >
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-12 h-12 object-cover rounded-lg bg-muted"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {product.name}
                  </p>
                  <p className="text-sm text-primary font-semibold">
                    ₹{price.toLocaleString()}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      {results.length > 6 && (
        <Link
          to={`/search?q=${encodeURIComponent(query)}`}
          onClick={() => onSelect("")}
          className="block p-3 text-center text-sm text-primary hover:bg-secondary transition-colors border-t border-border"
        >
          View all {results.length} results
        </Link>
      )}
    </motion.div>
  );
}
