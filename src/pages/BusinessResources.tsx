import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { appClient } from "@/integrations/manus/client";
import { Header } from "@/components/layout/Header";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart-context";
import { useCurrency } from "@/hooks/use-currency";
import { motion } from "framer-motion";
import {
  Search,
  FileText,
  BookOpen,
  Users,
  Video,
  MapPin,
  ShoppingCart,
  Briefcase,
  TrendingUp,
  Award,
  Filter,
  X,
} from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

// Resource type filters
const resourceTypes = [
  { id: "all", label: "All Resources", icon: Briefcase },
  { id: "business-plan", label: "Business Plans", icon: FileText },
  { id: "funding", label: "Funding Guides", icon: TrendingUp },
  { id: "consultation", label: "Consultations", icon: Users },
];

// Keywords for categorizing products
const typeKeywords = {
  "business-plan": ["business plan", "hectare", "1ha", "2ha", "3ha", "5ha"],
  funding: ["funding", "manual", "directory", "contact"],
  consultation: ["consultation", "video", "farm visit", "one-on-one"],
};

const BusinessResources = () => {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [priceSort, setPriceSort] = useState<"asc" | "desc" | null>(null);
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();

  // Fetch business resources products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["business-resources"],
    queryFn: async () => {
      const { data, error } = await appClient
        .from("products")
        .select("*, categories(name, slug)")
        .eq("is_active", true)
        .eq("categories.slug", "business-resources")
        .order("price_zar", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Determine resource type for a product
  const getResourceType = (product: any): string => {
    const searchText = `${product.name} ${product.short_description || ""}`.toLowerCase();
    
    for (const [type, keywords] of Object.entries(typeKeywords)) {
      if (keywords.some((kw) => searchText.includes(kw))) {
        return type;
      }
    }
    return "other";
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = products.filter((product: any) => {
      // Search filter
      const searchText = `${product.name} ${product.short_description || ""}`.toLowerCase();
      const matchesSearch = search === "" || searchText.includes(search.toLowerCase());

      // Type filter
      const productType = getResourceType(product);
      const matchesType = selectedType === "all" || productType === selectedType;

      return matchesSearch && matchesType;
    });

    // Sort by price
    if (priceSort) {
      result = [...result].sort((a: any, b: any) =>
        priceSort === "asc" ? a.price_zar - b.price_zar : b.price_zar - a.price_zar
      );
    }

    return result;
  }, [products, search, selectedType, priceSort]);

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price_zar,
      image: product.primary_image_url || "/placeholder.svg",
      sku: product.sku,
    });
  };

  const getTypeIcon = (product: any) => {
    const type = getResourceType(product);
    switch (type) {
      case "business-plan":
        return <FileText className="h-5 w-5" />;
      case "funding":
        return <BookOpen className="h-5 w-5" />;
      case "consultation":
        return product.name.toLowerCase().includes("video") ? (
          <Video className="h-5 w-5" />
        ) : product.name.toLowerCase().includes("farm") ? (
          <MapPin className="h-5 w-5" />
        ) : (
          <Users className="h-5 w-5" />
        );
      default:
        return <Briefcase className="h-5 w-5" />;
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedType("all");
    setPriceSort(null);
  };

  const hasActiveFilters = search || selectedType !== "all" || priceSort;

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Dragon Fruit Business Resources & Plans | DFSA"
        description="Dragon fruit business plans, funding guides, and professional consultation packages. Start your dragon fruit farm in South Africa with expert support from DFSA."
        keywords="dragon fruit business plan, dragon fruit farming investment, pitaya business guide, farming consultation South Africa"
        url="/business-resources"
      />
      <Header />
      <CartSidebar />
      <Breadcrumbs items={[{ label: 'Business Resources' }]} className="container mx-auto px-4 pt-24 mb-4" />
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/30 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              <Award className="h-3 w-3 mr-1" />
              Farmer Success Resources
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Business <span className="text-gradient-sunset">Resources</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Everything you need to start, fund, and grow your dragon fruit farming business.
              From professional business plans to funding guides and expert consultations.
            </p>

            {/* Stats */}
            <div className="flex justify-center gap-8 flex-wrap">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">85%</div>
                <div className="text-sm text-muted-foreground">Funding Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">Funding Sources</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">16+</div>
                <div className="text-sm text-muted-foreground">Years Experience</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-30 bg-background/80 backdrop-blur-lg border-b py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type filters */}
            <div className="flex gap-2 flex-wrap justify-center">
              {resourceTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.id}
                    variant={selectedType === type.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType(type.id)}
                    className={selectedType === type.id ? "btn-sunset" : ""}
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    {type.label}
                  </Button>
                );
              })}
            </div>

            {/* Price sort & Clear */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPriceSort(priceSort === "asc" ? "desc" : priceSort === "desc" ? null : "asc")
                }
              >
                <Filter className="h-4 w-4 mr-1" />
                Price {priceSort === "asc" ? "↑" : priceSort === "desc" ? "↓" : ""}
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <main className="py-12">
        <div className="container mx-auto px-4">
          {/* Results count */}
          <p className="text-sm text-muted-foreground mb-6">
            Showing {filteredProducts.length} resource{filteredProducts.length !== 1 ? "s" : ""}
          </p>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-card rounded-xl p-6 animate-pulse">
                  <div className="h-12 w-12 bg-muted rounded-lg mb-4" />
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-full mb-4" />
                  <div className="h-8 bg-muted rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No resources found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search terms
              </p>
              <Button onClick={clearFilters} className="btn-sunset">
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product: any, index: number) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="glass-card rounded-xl overflow-hidden group"
                >
                  {/* Card Header with Icon */}
                  <div className="bg-gradient-to-br from-primary/20 to-secondary/20 p-6">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                        {getTypeIcon(product)}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {getResourceType(product) === "business-plan"
                          ? "Business Plan"
                          : getResourceType(product) === "funding"
                          ? "Funding Guide"
                          : getResourceType(product) === "consultation"
                          ? "Consultation"
                          : "Resource"}
                      </Badge>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6">
                    <Link to={`/product/${product.slug}`}>
                      <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {product.short_description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gradient-sunset">
                        {formatPrice(product.price_zar)}
                      </span>
                      <Button
                        size="sm"
                        className="btn-sunset"
                        onClick={() => handleAddToCart(product)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl font-bold mb-4">
              Need Custom Assistance?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Our team of dragon fruit farming experts is ready to help you create a
              customized business plan or guide you through the funding process.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button asChild className="btn-sunset">
                <Link to="/consultations">Book a Consultation</Link>
              </Button>
              <Button asChild variant="outline">
                <a href="https://wa.me/27834474639" target="_blank" rel="noopener noreferrer">
                  Chat on WhatsApp
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default BusinessResources;
