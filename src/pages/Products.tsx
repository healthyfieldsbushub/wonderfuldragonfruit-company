import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { ProductCard } from "@/components/products/ProductCard";
import { useProducts, useCategories } from "@/hooks/use-products";
import { useCurrency } from "@/hooks/use-currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X, Grid3X3, LayoutList, Leaf } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

const fleshColorFilters = [
  { id: "white", label: "White Flesh", color: "bg-gray-100 text-gray-800 border-gray-300", keywords: ["white", "undatus"] },
  { id: "red", label: "Red/Purple", color: "bg-pink-100 text-pink-800 border-pink-300", keywords: ["red", "magenta", "purple", "costaricensis"] },
  { id: "yellow", label: "Yellow", color: "bg-yellow-100 text-yellow-800 border-yellow-300", keywords: ["yellow", "megalanthus", "gold", "palora"] },
  { id: "variegated", label: "Variegated", color: "bg-gradient-to-r from-green-100 to-pink-100 text-green-800 border-green-300", keywords: ["variegated", "chimera", "rainbow", "chameleon"] },
];
const MAX_PRODUCT_PRICE = 100000;

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { formatPrice } = useCurrency();
  
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedFleshColor, setSelectedFleshColor] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState([0, MAX_PRODUCT_PRICE]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();

  // Shop default: when no category is specified, show the Dragon Fruit
  // Plants & Cuttings catalogue first instead of every product.
  useEffect(() => {
    const catParam = searchParams.get("category");
    if (categories.length > 0) {
      if (catParam) {
        // Support both category slugs (/products?category=dragon-fruit-plants-cuttings)
        // and raw category ids (/products?category=<uuid>).
        const match = categories.find(
          (c) => c.slug === catParam || c.id === catParam,
        );
        setSelectedCategory(match ? match.id : "all");
      } else {
        // Shop default: show Dragon Fruit Plants & Cuttings first.
        const dragonCategory = categories.find(
          (c) => c.slug === "dragon-fruit-plants-cuttings",
        );
        if (dragonCategory) setSelectedCategory(dragonCategory.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      // Search filter
      const q = search ? search.toLowerCase() : '';
      if (q) {
        const searchableText = [
          product.name,
          product.sku,
          product.short_description,
          product.description?.replace(/<[^>]+>/g, ' '),
          product.tags?.join(' '),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!searchableText.includes(q)) {
        return false;
        }
      }
      // Category filter
      if (selectedCategory !== "all" && product.category_id !== selectedCategory) {
        return false;
      }
      // Flesh color filter
      if (selectedFleshColor.length > 0) {
        const productText = `${product.name} ${product.short_description || ''} ${product.tags?.join(' ') || ''}`.toLowerCase();
        const matchesFleshColor = selectedFleshColor.some(colorId => {
          const colorFilter = fleshColorFilters.find(f => f.id === colorId);
          return colorFilter?.keywords.some(keyword => productText.includes(keyword));
        });
        if (!matchesFleshColor) return false;
      }
      // Price filter
      if (product.price_zar < priceRange[0] || product.price_zar > priceRange[1]) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.price_zar - b.price_zar;
        case "price-desc":
          return b.price_zar - a.price_zar;
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const handleSearch = (value: string) => {
    setSearch(value);
    if (value) {
      searchParams.set("q", value);
    } else {
      searchParams.delete("q");
    }
    setSearchParams(searchParams);
  };

  const toggleFleshColor = (colorId: string) => {
    setSelectedFleshColor(prev => 
      prev.includes(colorId) 
        ? prev.filter(id => id !== colorId)
        : [...prev, colorId]
    );
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedFleshColor([]);
    setPriceRange([0, MAX_PRODUCT_PRICE]);
    setSortBy("newest");
    setSearchParams({});
  };

  const hasActiveFilters = search || selectedCategory !== "all" || selectedFleshColor.length > 0 || priceRange[0] > 0 || priceRange[1] < MAX_PRODUCT_PRICE;

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Buy Dragon Fruit Plants South Africa | Dragon Fruit Cuttings for Sale"
        description="Looking for dragon fruit plants for sale? Order premium dragon fruit cuttings in South Africa with fast delivery and expert farming advice. 100+ varieties available."
        keywords="buy dragon fruit plants, dragon fruit plants for sale, dragon fruit cuttings for sale, buy dragon fruit cuttings south africa, dragon fruit seedlings south africa, red dragon fruit plants for sale south africa"
        url="/products"
      />
      <Header />
      <CartSidebar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={[{ label: 'Products' }]} className="mb-6" />
          {/* Header */}
          <div className="text-center mb-10">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-4xl md:text-5xl font-bold mb-4 text-gradient-tropical"
            >
              Dragon Fruit Cultivars
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground max-w-2xl mx-auto"
            >
              Premium dragon fruit cuttings from South Africa's leading nursery since 2008. 
              Over 100 varieties available for home growers and commercial farmers.
            </motion.p>
          </div>

          {/* Filters bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-4 rounded-xl mb-8"
          >
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="name-asc">Name: A to Z</SelectItem>
                  <SelectItem value="name-desc">Name: Z to A</SelectItem>
                </SelectContent>
              </Select>

              {/* View mode toggle */}
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="rounded-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="rounded-none"
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>

              {/* More filters */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </Button>

              {/* Clear filters */}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            {/* Extended filters */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Flesh Color Filter */}
                  <div>
                    <label className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-primary" />
                      Flesh Color
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {fleshColorFilters.map((color) => (
                        <button
                          key={color.id}
                          onClick={() => toggleFleshColor(color.id)}
                          className={`px-3 py-2 rounded-full text-sm font-medium border-2 transition-all ${color.color} ${
                            selectedFleshColor.includes(color.id)
                              ? "ring-2 ring-primary ring-offset-2"
                              : "opacity-70 hover:opacity-100"
                          }`}
                        >
                          {color.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Price Range: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                    </label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      min={0}
                      max={MAX_PRODUCT_PRICE}
                      step={100}
                      className="mt-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>R0</span>
                      <span>R100,000</span>
                    </div>
                  </div>
                </div>

                {/* Active filters badges */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                    <span className="text-sm text-muted-foreground">Active filters:</span>
                    {selectedFleshColor.map(colorId => {
                      const color = fleshColorFilters.find(f => f.id === colorId);
                      return (
                        <Badge
                          key={colorId}
                          variant="secondary"
                          className="gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => toggleFleshColor(colorId)}
                        >
                          {color?.label}
                          <X className="h-3 w-3" />
                        </Badge>
                      );
                    })}
                    {selectedCategory !== "all" && (
                      <Badge
                        variant="secondary"
                        className="gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => setSelectedCategory("all")}
                      >
                        {categories.find(c => c.id === selectedCategory)?.name}
                        <X className="h-3 w-3" />
                      </Badge>
                    )}
                    {(priceRange[0] > 0 || priceRange[1] < MAX_PRODUCT_PRICE) && (
                      <Badge
                        variant="secondary"
                        className="gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => setPriceRange([0, MAX_PRODUCT_PRICE])}
                      >
                        {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                        <X className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Results count */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} found
            </p>
          </div>

          {/* Product grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-xl mb-4" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground mb-4">No products found</p>
              <Button onClick={clearFilters} className="btn-sunset">
                Clear Filters
              </Button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                  : "space-y-4"
              }
            >
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  variant={viewMode}
                />
              ))}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Products;
