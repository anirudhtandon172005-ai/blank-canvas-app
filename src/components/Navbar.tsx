//import { Link, useNavigate } from "react-router-dom";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";

import { useAuthContext } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { useDebounce } from "@/hooks/useDebounce";
import { searchProducts, type SearchResult } from "@/api/search";

import SearchSuggestions from "./SearchSuggestions";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { cartCount } = useCart();

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 300);
  const searchRef = useRef<HTMLDivElement>(null);

  /* ---------------- SEARCH EFFECT ---------------- */

  useEffect(() => {
    let cancelled = false;

    async function runSearch() {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      const data = await searchProducts(debouncedQuery);
      if (!cancelled) {
        setResults(data);
        setLoading(false);
      }
    }

    runSearch();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  /* ---------------- CLOSE ON OUTSIDE CLICK ---------------- */

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ---------------- HANDLERS ---------------- */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    setOpen(false);
  };

  const handleSelect = () => {
    setSearchQuery("");
    setResults([]);
    setOpen(false);
  };

  /* ---------------- RENDER ---------------- */

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
      <div className="container-main">
        <div className="flex h-16 items-center justify-between">
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold">K</span>
            </div>
            <span className="font-heading text-lg font-semibold">
              KALA <span className="font-normal">MANDIR</span>
            </span>
          </Link>

          {/* SEARCH */}
          <div ref={searchRef} className="hidden md:block relative w-full max-w-md mx-8">
            <form onSubmit={handleSubmit}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setOpen(true)}
                placeholder="Search sarees, lehengas & more..."
                className="w-full pl-10 pr-4 py-2 rounded-full bg-secondary focus:ring-2 focus:ring-primary/20"
              />
            </form>

            <AnimatePresence>
              {open && (
                <SearchSuggestions
                  query={debouncedQuery}
                  results={results}
                  isLoading={loading}
                  onSelect={handleSelect}
                />
              )}
            </AnimatePresence>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <Link to={user ? "/profile" : "/auth"} className="icon-btn">
              <User />
            </Link>

            <Link to="/wishlist" className="icon-btn hidden md:flex">
              <Heart />
            </Link>

            <Link to="/cart" className="icon-btn relative">
              <ShoppingBag />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>

            <button onClick={() => setMenuOpen(true)} className="md:hidden">
              <Menu />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-50 bg-background p-4 md:hidden">
            <button className="mb-4" onClick={() => setMenuOpen(false)}>
              <X />
            </button>
            <nav className="space-y-4">
              <Link to="/category/sarees">Sarees</Link>
              <Link to="/category/lehengas">Lehengas</Link>
              <Link to="/wishlist">Wishlist</Link>
              <Link to={user ? "/profile" : "/auth"}>{user ? "Profile" : "Login"}</Link>
            </nav>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
