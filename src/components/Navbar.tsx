import { Link, useNavigate } from "react-router-dom";
import { Search, User, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useDebounce } from "@/hooks/useDebounce";
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

  const debouncedQuery = useDebounce(searchQuery, 300);

  // Fetch suggestions when debounced query changes
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
        if (!cancelled) {
          setSuggestions(results);
        }
      } catch (error) {
        console.error("Search error:", error);
        if (!cancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchSuggestions();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // Show dropdown when typing
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsDropdownOpen(true);
    }
  }, [searchQuery]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setIsMobileSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
        setIsMobileSearchOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsDropdownOpen(false);
      setIsMobileSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSelect = (productId: string) => {
    setIsDropdownOpen(false);
    setIsMobileSearchOpen(false);
    setSearchQuery("");
    setSuggestions([]);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container-main">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">K</span>
            </div>
            <span className="font-heading text-xl font-semibold text-foreground">
              KALA <span className="font-normal">MANDIR</span>
            </span>
          </Link>

          {/* Desktop Search */}
          <div ref={searchRef} className="hidden md:flex items-center flex-1 max-w-md mx-8 relative">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search sarees, lehengas & more..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim() && setIsDropdownOpen(true)}
                  className="w-full pl-10 pr-4 py-2 bg-secondary rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </form>
            <AnimatePresence>
              {isDropdownOpen && (searchQuery.trim() || isLoading) && (
                <SearchSuggestions
                  query={debouncedQuery}
                  results={suggestions}
                  onSelect={handleSelect}
                  isLoading={isLoading && searchQuery.trim().length > 0}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/category/new-arrivals" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              NEW ARRIVALS
            </Link>
            <Link to="/category/sarees" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              SAREES
            </Link>
            <Link to="/category/lehengas" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              LEHENGAS
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile Search Button */}
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              className="p-2 hover:bg-secondary rounded-full transition-colors md:hidden"
            >
              <Search className="w-5 h-5" />
            </button>
            <ThemeToggle />
            <Link to={user ? "/profile" : "/login"} className="p-2 hover:bg-secondary rounded-full transition-colors">
              <User className="w-5 h-5" />
            </Link>
            <Link to="/wishlist" className="p-2 hover:bg-secondary rounded-full transition-colors hidden md:flex">
              <Heart className="w-5 h-5" />
            </Link>
            <Link to="/cart" className="p-2 hover:bg-secondary rounded-full transition-colors relative">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <button onClick={() => setIsMenuOpen(true)} className="p-2 md:hidden">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            className="fixed inset-0 z-50 bg-background md:hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="font-heading text-xl font-semibold">Menu</span>
              <button onClick={() => setIsMenuOpen(false)} className="p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-4">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="block py-2 text-lg">Home</Link>
              <Link to="/category/sarees" onClick={() => setIsMenuOpen(false)} className="block py-2 text-lg">Sarees</Link>
              <Link to="/category/lehengas" onClick={() => setIsMenuOpen(false)} className="block py-2 text-lg">Lehengas</Link>
              <Link to="/wishlist" onClick={() => setIsMenuOpen(false)} className="block py-2 text-lg">Wishlist</Link>
              <Link to="/orders" onClick={() => setIsMenuOpen(false)} className="block py-2 text-lg">My Orders</Link>
              <Link to={user ? "/profile" : "/login"} onClick={() => setIsMenuOpen(false)} className="block py-2 text-lg">
                {user ? "Profile" : "Login"}
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Fullscreen Search Modal */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg md:hidden"
          >
            <div ref={mobileSearchRef} className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <form onSubmit={handleSearch} className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search sarees, lehengas & more..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      className="w-full pl-12 pr-4 py-3 bg-secondary rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </form>
                <button
                  onClick={() => {
                    setIsMobileSearchOpen(false);
                    setSearchQuery("");
                    setSuggestions([]);
                  }}
                  className="p-2 hover:bg-secondary rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Results */}
              <div className="flex-1 overflow-y-auto">
                {isLoading && searchQuery.trim() ? (
                  <div className="p-4 space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-4 animate-pulse">
                        <div className="w-16 h-16 bg-muted rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : suggestions.length > 0 ? (
                  <ul className="divide-y divide-border">
                    {suggestions.slice(0, 10).map((product) => {
                      const imageUrl = product.product_images?.[0]?.image_url || "/placeholder.svg";
                      const price = product.sale_price || product.base_price;

                      return (
                        <li key={product.id}>
                          <Link
                            to={`/product/${product.id}`}
                            onClick={() => handleSelect(product.id)}
                            className="flex items-center gap-4 p-4 hover:bg-secondary active:bg-secondary transition-colors"
                          >
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-lg bg-muted"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground line-clamp-2">
                                {product.name}
                              </p>
                              <p className="text-primary font-semibold mt-1">
                                ₹{price.toLocaleString()}
                              </p>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : debouncedQuery.trim() ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                    <Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No results found for "{debouncedQuery}"</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                    <Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Start typing to search products</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
