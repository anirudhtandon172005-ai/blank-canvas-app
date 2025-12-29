import { Link, useNavigate } from "react-router-dom";
import { Search, User, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
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
          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search sarees, lehengas & more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-secondary rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </form>

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
    </header>
  );
}
