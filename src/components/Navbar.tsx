import { Link, useNavigate } from "react-router-dom";
import { Search, User, Heart, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthContext } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { useDebounce } from "@/hooks/useDebounce";
import { searchProducts } from "@/api/search";
import { supabase } from "@/integrations/supabase/client";
import SearchSuggestions from "./SearchSuggestions";
import ThemeToggle from "./ThemeToggle";

type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  is_active: boolean | null;
  sort_order: number | null;
};

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const debounced = useDebounce(searchQuery, 300);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { user } = useAuthContext();
  const { cartCount } = useCart();

  // Fetch categories from Supabase
  const categoriesQuery = useQuery({
    queryKey: ["navbar-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, parent_id, is_active, sort_order")
        .eq("is_active", true)
        .is("parent_id", null)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data || []) as Category[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const categories = categoriesQuery.data || [];

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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [navigate]);

  const handleCategoryClick = (slug: string) => {
    setMobileMenuOpen(false);
    navigate(`/category/${slug}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b">
      <div className="container-main flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
            K
          </div>
          <span className="font-heading text-lg">KALA ETHNIC</span>
        </Link>

        {/* Desktop Navigation - Dynamic Categories */}
        <nav className="hidden lg:flex items-center gap-6">
          <Link
            to="/category/all"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            All Products
          </Link>
          {categoriesQuery.isLoading ? (
            // Skeleton placeholders for desktop nav
            <>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-14" />
            </>
          ) : (
            categories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {category.name}
              </Link>
            ))
          )}
        </nav>

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
            className="w-full pl-10 pr-4 py-2 rounded-full bg-secondary text-foreground placeholder:text-muted-foreground"
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
          <Link to={user ? "/profile" : "/auth"} className="hover:text-primary transition-colors">
            <User className="w-5 h-5" />
          </Link>
          <Link to="/wishlist" className="hover:text-primary transition-colors">
            <Heart className="w-5 h-5" />
          </Link>
          <Link to="/cart" className="relative hover:text-primary transition-colors">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t bg-background overflow-hidden"
          >
            <nav className="container-main py-4 flex flex-col gap-2">
              {/* Mobile Search */}
              <div className="relative mb-4 md:hidden">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setOpen(true);
                  }}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 rounded-full bg-secondary text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <button
                onClick={() => handleCategoryClick("all")}
                className="text-left py-3 px-4 rounded-lg hover:bg-secondary transition-colors font-medium"
              >
                All Products
              </button>

              {categoriesQuery.isLoading ? (
                // Skeleton placeholders for mobile nav
                <>
                  <div className="py-3 px-4">
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <div className="py-3 px-4">
                    <Skeleton className="h-5 w-28" />
                  </div>
                  <div className="py-3 px-4">
                    <Skeleton className="h-5 w-20" />
                  </div>
                </>
              ) : categoriesQuery.isError ? (
                <div className="py-3 px-4 text-destructive text-sm">Failed to load categories</div>
              ) : (
                categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.slug)}
                    className="text-left py-3 px-4 rounded-lg hover:bg-secondary transition-colors"
                  >
                    {category.name}
                  </button>
                ))
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
