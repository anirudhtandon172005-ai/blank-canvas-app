//import { Link, useNavigate } from "react-router-dom";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { useAuthContext } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { useDebounce } from "@/hooks/useDebounce";
import { searchProducts } from "@/api/search";
import SearchSuggestions from "./SearchSuggestions";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const debounced = useDebounce(searchQuery, 300);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { user } = useAuthContext();
  const { cartCount } = useCart();

  useEffect(() => {
    if (!debounced.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    searchProducts(debounced)
      .then(setResults)
      .finally(() => setLoading(false));
  }, [debounced]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-background border-b">
      <div className="container-main flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">K</div>
          <span className="font-heading text-lg">KALA MANDIR</span>
        </Link>

        {/* Search */}
        <div ref={ref} className="relative w-full max-w-md mx-6 hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setOpen(true);
            }}
            placeholder="Search sarees, lehengas & more..."
            className="w-full pl-10 pr-4 py-2 rounded-full bg-secondary"
          />

          <AnimatePresence>
            {open && (
              <SearchSuggestions
                query={debounced}
                results={results}
                isLoading={loading}
                onSelect={() => {
                  setSearchQuery("");
                  setOpen(false);
                }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link to={user ? "/profile" : "/auth"}>
            <User />
          </Link>
          <Link to="/wishlist">
            <Heart />
          </Link>
          <Link to="/cart" className="relative">
            <ShoppingBag />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full px-1">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
