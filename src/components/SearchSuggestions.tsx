//import { Link } from "react-router-dom";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, X } from "lucide-react";
import type { SearchResult } from "@/api/search";

interface SearchSuggestionsProps {
  query: string;
  results: SearchResult[];
  onSelect: () => void;
  isLoading?: boolean;
  recentSearches?: string[];
  onRecentSearchClick?: (query: string) => void;
  onRemoveRecentSearch?: (query: string) => void;
  onClearAllRecentSearches?: () => void;
  showRecent?: boolean;
}

export default function SearchSuggestions({
  query,
  results,
  onSelect,
  isLoading = false,
  recentSearches = [],
  onRecentSearchClick,
  onRemoveRecentSearch,
  onClearAllRecentSearches,
  showRecent = false,
}: SearchSuggestionsProps) {
  const displayResults = results.slice(0, 6);

  /* ---------------- RECENT SEARCHES ---------------- */
  if (showRecent && !query && recentSearches.length > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg z-[100]"
      >
        <div className="flex justify-between px-3 py-2 border-b">
          <span className="text-xs text-muted-foreground">Recent searches</span>
          <button onClick={onClearAllRecentSearches} className="text-xs text-destructive">
            Clear
          </button>
        </div>

        {recentSearches.map((search) => (
          <button
            key={search}
            onClick={() => onRecentSearchClick?.(search)}
            className="flex items-center gap-3 px-3 py-2 w-full hover:bg-secondary"
          >
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{search}</span>
          </button>
        ))}
      </motion.div>
    );
  }

  /* ---------------- LOADING ---------------- */
  if (isLoading) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-xl p-4 z-[100]">
        <p className="text-sm text-muted-foreground">Searching…</p>
      </div>
    );
  }

  /* ---------------- NO RESULTS ---------------- */
  if (query && displayResults.length === 0) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-xl p-4 z-[100]">
        <p className="text-sm text-muted-foreground">No results found</p>
      </div>
    );
  }

  if (!displayResults.length) return null;

  /* ---------------- RESULTS ---------------- */
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg z-[100]"
    >
      {displayResults.map((product) => {
        const image = product.product_images?.[0]?.image_url || "/placeholder.svg";
        const price = product.sale_price ?? product.base_price;

        return (
          <Link
            key={product.id}
            to={`/product/${product.slug}`} // ✅ FIX
            onClick={onSelect}
            className="flex items-center gap-3 p-3 hover:bg-secondary transition-colors"
          >
            <img src={image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
            <div className="flex-1">
              <p className="text-sm font-medium truncate">{product.name}</p>
              <p className="text-sm text-primary font-semibold">₹{price.toLocaleString()}</p>
            </div>
          </Link>
        );
      })}
    </motion.div>
  );
}
