import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useWishlist } from "@/hooks/useWishlist";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    base_price: number;
    sale_price?: number;
    is_featured?: boolean;
    images?: { image_url: string; is_primary?: boolean }[];
  };
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { isWishlisted, toggleItem } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
  const imageUrl = primaryImage?.image_url || "/placeholder.svg";

  const discount = product.sale_price
    ? Math.round(((product.base_price - product.sale_price) / product.base_price) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group"
    >
      <div className="relative overflow-hidden rounded-lg bg-secondary/30 aspect-[3/4]">
        <Link to={`/product/${product.slug}`}>
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Badges */}
        {product.is_featured && (
          <span className="absolute top-3 left-3 badge-bestseller">BESTSELLER</span>
        )}
        {discount > 0 && (
          <span className="absolute top-3 left-3 badge-sale">{discount}% OFF</span>
        )}

        {/* Wishlist Button */}
        <button
          onClick={() => toggleItem(product.id)}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 ${
            wishlisted
              ? "bg-primary text-primary-foreground"
              : "bg-background/80 hover:bg-background text-foreground"
          }`}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? "fill-current" : ""}`} />
        </button>
      </div>

      <div className="mt-3 space-y-1">
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-primary font-semibold">
            ₹{(product.sale_price || product.base_price).toLocaleString()}
          </span>
          {product.sale_price && (
            <span className="text-muted-foreground line-through text-sm">
              ₹{product.base_price.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
