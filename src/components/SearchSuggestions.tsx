//import { Link } from "react-router-dom";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { SearchResult } from "@/api/search";

interface Props {
  query: string;
  results: SearchResult[];
  isLoading?: boolean;
  onSelect: () => void;
}

export default function SearchSuggestions({ query, results, isLoading = false, onSelect }: Props) {
  if (!query) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden"
    >
      {isLoading && <div className="p-4 text-sm text-muted-foreground">Searching…</div>}

      {!isLoading && results.length === 0 && (
        <div className="p-4 text-sm text-muted-foreground">No results found for “{query}”</div>
      )}

      <ul className="divide-y divide-border">
        {results.slice(0, 6).map((product) => {
          const image = product.product_images?.[0]?.image_url || "/placeholder.svg";
          const price = product.sale_price ?? product.base_price;

          return (
            <li key={product.id}>
              <Link
                to={`/product/${product.id}`}
                onClick={onSelect}
                className="flex items-center gap-3 p-3 hover:bg-secondary transition"
              >
                <img src={image} alt={product.name} className="w-12 h-12 object-cover rounded-lg bg-muted" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-sm text-primary font-semibold">₹{price.toLocaleString()}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {results.length > 6 && (
        <Link
          to={`/search?q=${encodeURIComponent(query)}`}
          onClick={onSelect}
          className="block text-center text-sm text-primary p-3 border-t hover:bg-secondary"
        >
          View all results →
        </Link>
      )}
    </motion.div>
  );
}
