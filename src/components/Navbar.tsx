//import { Link, useNavigate } from "react-router-dom";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, Heart, ShoppingBag, Menu, X, Clock } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useDebounce } from "@/hooks/useDebounce";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { searchProducts, type SearchResult } from "@/api/search";
import SearchSuggestions from "./SearchSuggestions";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const { recentSearches, addSearch, removeSearch } = useRecentSearches();

  const debouncedQuery = useDebounce(searchQuery, 300);

  /* ---------------- SEARCH ---------------- */

  useEffect(() => {
    let cancelled = false;

    async function fetchSuggestions() {
      if (!debouncedQuery.trim()) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await searchProducts(debouncedQuery);
        if (!cancelled) setSuggestions(results);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchSuggestions();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    if (searchQuery.trim()) setIsDropdownOpen(true);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) {
        setIsMobileSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    addSearch(searchQuery);
    setIsDropdownOpen(false);
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleSelect = () => {
    setSearchQuery("");
    setSuggestions([]);
    setIsDropdownOpen(false);
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setIsDropdownOpen(false);
  };

  /* ---------------- RENDER ---------------- */

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="container-main">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">K</span>
            </div>
            <span className="font-heading text-xl font-semibold">
              KALA <span className="font-normal">MANDIR</span>
            </span>
          </Link>

          {/* Desktop Search */}
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-md mx-8 relative z-40">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Search sarees, lehengas & more..."
                  className="w-full pl-10 pr-4 py-2 rounded-full bg-secondary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </form>

            <AnimatePresence>
              {isDropdownOpen && (
                <SearchSuggestions
                  query={debouncedQuery}
                  results={suggestions}
                  onSelect={handleSelect}
                  isLoading={isLoading}
                  recentSearches={recentSearches}
                  onRecentSearchClick={handleRecentSearchClick}
                  onRemoveRecentSearch={removeSearch}
                  showRecent={!searchQuery.trim()}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 relative z-50">
            <Link to="/category/new-arrivals" className="nav-link">
              NEW ARRIVALS
            </Link>
            <Link to="/category/sarees" className="nav-link">
              SAREES
            </Link>
            <Link to="/category/lehengas" className="nav-link">
              LEHENGAS
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
            <Link to={user ? "/profile" : "/login"} className="icon-btn">
              <User />
            </Link>
            <Link to="/wishlist" className="icon-btn hidden md:flex">
              <Heart />
            </Link>
            <Link to="/cart" className="icon-btn relative">
              <ShoppingBag />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
            <button onClick={() => setIsMenuOpen(true)} className="md:hidden">
              <Menu />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="fixed inset-0 z-50 bg-background md:hidden"
          >
            <div className="flex justify-between p-4 border-b">
              <span className="text-xl font-heading">Menu</span>
              <button onClick={() => setIsMenuOpen(false)}>
                <X />
              </button>
            </div>
            <nav className="p-4 space-y-4">
              <Link to="/category/sarees">Sarees</Link>
              <Link to="/category/lehengas">Lehengas</Link>
              <Link to="/wishlist">Wishlist</Link>
              <Link to={user ? "/profile" : "/login"}>{user ? "Profile" : "Login"}</Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
