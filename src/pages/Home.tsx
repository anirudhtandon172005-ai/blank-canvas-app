import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import Loader from "@/components/Loader";
import { getFeaturedProducts, getCategories } from "@/api/products";

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsData, categoriesData] = await Promise.all([getFeaturedProducts(), getCategories()]);
        setProducts(productsData || []);
        setCategories(categoriesData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative h-[70vh] bg-gradient-to-br from-secondary via-background to-secondary overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 blur-sm"
            style={{
              backgroundImage:
                "url('https://nrhvufbmsjmewpqhwcmp.supabase.co/storage/v1/object/public/products/Gemini_Generated_Image_8y2jg78y2jg78y2j.png')",
            }}
          />

          <div className="relative container-main h-full flex flex-col items-center justify-center text-center">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm uppercase tracking-widest text-muted-foreground mb-4"
            >
              Handcrafted Perfection
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-heading text-4xl md:text-6xl lg:text-7xl font-semibold text-foreground mb-4"
            >
              Where Tradition Meets
              <br />
              <span className="italic text-primary">Timeless Elegance</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground max-w-xl mb-8"
            >
              Discover the finest collection of handcrafted ethnic wear, woven with stories of heritage.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Link to="/category/sarees" className="btn-primary">
                SHOP COLLECTION
              </Link>
            </motion.div>
          </div>
        </section>

        {/* FEATURED PRODUCTS */}
        <section className="py-16">
          <div className="container-main">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="section-subtitle text-primary">Curated For You</p>
                <h2 className="section-title">Featured Products</h2>
              </div>
              <Link to="/category/all" className="text-primary text-sm font-medium hover:underline">
                View All →
              </Link>
            </div>

            {loading ? (
              <Loader />
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {products.slice(0, 8).map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-12">No products available</p>
            )}
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="py-16 bg-secondary/30">
          <div className="container-main">
            <div className="text-center mb-12">
              <h2 className="section-title">Shop by Category</h2>
              <p className="text-muted-foreground mt-2">Handpicked collections for every celebration</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Sarees category */}
              <Link to="/category/sarees" className="group relative h-80 rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent z-10" />
                <img
                  src="https://nrhvufbmsjmewpqhwcmp.supabase.co/storage/v1/object/public/products/ChatGPT%20Image%20Jan%202,%202026,%2003_27_16%20AM.png"
                  alt="Sarees"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-6 left-6 z-20 text-background">
                  <h3 className="font-heading text-2xl font-semibold">The Royal Saree Edit</h3>
                  <span className="text-sm opacity-80">Explore Sarees →</span>
                </div>
              </Link>

              {/* Lehengas category */}
              <Link to="/category/lehengas" className="group relative h-80 rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent z-10" />
                <img
                  src="https://nrhvufbmsjmewpqhwcmp.supabase.co/storage/v1/object/public/products/ChatGPT%20Image%20Jan%202,%202026,%2003_15_37%20AM.png"
                  alt="Lehengas"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-6 left-6 z-20 text-background">
                  <h3 className="font-heading text-2xl font-semibold">Lehengas for Occasions</h3>
                  <span className="text-sm opacity-80">Explore Lehengas →</span>
                </div>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
