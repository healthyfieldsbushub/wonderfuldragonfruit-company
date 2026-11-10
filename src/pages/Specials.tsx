import { Header } from "@/components/layout/Header";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { ProductCard } from "@/components/products/ProductCard";
import { useSpecialProducts } from "@/hooks/use-products";
import { SEOHead } from "@/components/seo/SEOHead";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const SpecialsOfTheMonth = () => {
  const { data: products = [], isLoading } = useSpecialProducts();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Specials of the Month | Wonderful Dragon Fruit South Africa"
        description="This month's featured dragon fruit plants, cuttings and micro-algae specials from Wonderful Dragon Fruit South Africa. Limited stock, fresh prices every month."
      />
      <Header />
      <CartSidebar />
      <main className="container mx-auto px-4 py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Specials of the Month" },
          ]}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" /> Specials of the Month
            </span>
            <Badge variant="secondary">Limited stock</Badge>
          </div>
          <h1 className="mt-4 text-2xl font-bold md:text-3xl">
            This Month's Specials
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            A hand-picked selection of our dragon fruit plants, cuttings and
            micro-algae products, refreshed every month. All prices in ZAR —
            live courier and PUDO locker rates are calculated at checkout, and
            we never offer free shipping. For international orders, WhatsApp us
            on +27 83 447 4639 for a quote.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card h-72 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="glass-card rounded-xl p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No specials are running this month. Check back soon — or browse
              the full{" "}
              <Link to="/products" className="text-primary underline">
                shop catalogue
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SpecialsOfTheMonth;
