import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/integrations/manus/client";
import { Header } from "@/components/layout/Header";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { useCart, calculateRootingPrice } from "@/lib/cart-context";
import { useCurrency } from "@/hooks/use-currency";
import { motion } from "framer-motion";
import { ShoppingCart, Minus, Plus, ArrowLeft, Star, Sprout, Info } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SEOHead } from "@/components/seo/SEOHead";
import DOMPurify from "dompurify";
import { ShareButtons } from "@/components/ui/share-buttons";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FAQSection } from "@/components/seo/FAQSection";

const HighlightsSection = ({ highlights }: { highlights: string[] | null }) => {
  if (!highlights || highlights.length === 0) return null;
  return (
    <div className="pt-6 border-t">
      <h3 className="font-semibold mb-3">Highlights</h3>
      <ul className="space-y-2">
        {highlights.map((highlight, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="text-primary mt-1">•</span>
            <span>{highlight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [includeRooting, setIncludeRooting] = useState(false);
  // Cutting size affects price (+R70 for 40cm) and shipping weight.
  const [selectedSize, setSelectedSize] = useState<"20-30cm" | "40cm">("20-30cm");

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await appClient
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      if (!data?.category_id) return data;
      const { data: category } = await appClient
        .from("categories")
        .select("name, slug")
        .eq("id", data.category_id)
        .maybeSingle();
      return { ...data, categories: category };
    },
  });

  // Old slug support: when a slug was renamed, product_slug_redirects maps it to the current product.
  const { data: redirectSlug } = useQuery({
    queryKey: ["product-redirect", slug],
    queryFn: async () => {
      if (!slug || error || product) return null;
      const { data } = await appClient
        .from("product_slug_redirects")
        .select("product_id")
        .eq("old_slug", slug)
        .maybeSingle();
      if (!data?.product_id) return null;
      const { data: target } = await appClient
        .from("products")
        .select("slug")
        .eq("id", data.product_id)
        .eq("is_active", true)
        .maybeSingle();
      return target?.slug || null;
    },
    enabled: Boolean(slug) && !product && !isLoading,
  });

  const handleAddToCart = () => {
    if (!product) return;
    const unitPrice = Number(product.price_zar) + (selectedSize === "40cm" ? 70 : 0);
    const displayName = selectedSize === "40cm"
      ? `${product.name} (40cm cutting)`
      : `${product.name} (20-30cm cutting)`;

    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: displayName,
        price: unitPrice,
        image: product.primary_image_url || "/placeholder.svg",
        sku: product.sku,
        size: selectedSize,
      }, includeRooting);
    }

    const rootingText = includeRooting ? " with rooting service" : "";
    toast.success(`${product.name}${rootingText} added to cart!`);
  };

  // Calculate rooting price for display
  const rootingPricePerPlant = calculateRootingPrice(quantity);
  const totalRootingCost = includeRooting ? quantity * rootingPricePerPlant : 0;
  const unitPrice = product ? Number(product.price_zar) + (selectedSize === "40cm" ? 70 : 0) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <CartSidebar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="animate-pulse grid md:grid-cols-2 gap-10">
              <div className="aspect-square bg-muted rounded-2xl" />
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-6 bg-muted rounded w-1/4" />
                <div className="h-32 bg-muted rounded" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen">
        <Header />
        <CartSidebar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
            <Button onClick={() => navigate("/products")} className="btn-sunset">
              Browse Products
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const images = product.images && Array.isArray(product.images) 
    ? [product.primary_image_url, ...(product.images as string[])]
    : [product.primary_image_url || "/placeholder.svg"];

  const altTexts: string[] = Array.isArray(product.image_alt_texts) ? product.image_alt_texts : [];

  const hasDiscount = product.compare_at_price_zar && product.compare_at_price_zar > product.price_zar;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price_zar / product.compare_at_price_zar!) * 100)
    : 0;

  return (
    <div className="min-h-screen">
      <SEOHead
        title={`${product.name} | Buy Dragon Fruit Plants | DFSA`}
        description={product.short_description || product.meta_description || `Buy ${product.name} – premium dragon fruit cultivar from DFSA. ${product.stock_quantity > 0 ? 'In stock' : 'Available'}. Nationwide delivery.`}
        keywords={`${product.name}, dragon fruit, buy, ${product.tags?.join(', ') || 'cultivar'}`}
        image={product.primary_image_url || '/og-image.png'}
        url={`/products/${product.slug}`}
      />
      {/* Product JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.short_description || product.description,
            image: product.primary_image_url,
            sku: product.sku,
            ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
            brand: { '@type': 'Brand', name: 'Wonderful Dragon Fruit South Africa' },
            category: product.categories?.name || 'Dragon Fruit Plants',
            keywords: [
              product.name,
              'dragon fruit cutting',
              'pitaya cutting South Africa',
              ...(Array.isArray(product.tags) ? product.tags : []),
            ].join(', '),
            offers: {
              '@type': 'Offer',
              price: unitPrice,
              priceCurrency: 'ZAR',
              availability: product.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              seller: { '@type': 'Organization', name: 'Wonderful Dragon Fruit South Africa' },
              url: `https://www.wonderfuldragonfruit.company/products/${product.slug}`,
              // Shipping info for both cutting sizes (weights feed courier rates).
              shippingDetails: {
                '@type': 'OfferShippingDetails',
                shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'ZA' },
                shippingLabel: selectedSize === '40cm' ? '40cm cutting (350g-700g)' : '20-30cm cutting (150g-300g)',
              },
            },
            // Both cutting sizes as variants so Google & ChatGPT index each option.
            hasVariant: [
              {
                '@type': 'ProductVariant',
                name: '20–30cm Cutting',
                sku: `${product.sku}-2030`,
                weight: { '@type': 'QuantitativeValue', minValue: 150, maxValue: 300, unitCode: 'GRM' },
                offers: { '@type': 'Offer', price: product.price_zar, priceCurrency: 'ZAR' },
              },
              {
                '@type': 'ProductVariant',
                name: '40cm Cutting',
                sku: `${product.sku}-40`,
                weight: { '@type': 'QuantitativeValue', minValue: 350, maxValue: 700, unitCode: 'GRM' },
                offers: { '@type': 'Offer', price: Number(product.price_zar) + 70, priceCurrency: 'ZAR' },
              },
            ],
            // Professional rooting service — optional add-on.
            additionalProperty: {
              '@type': 'PropertyValue',
              name: 'Professional Rooting Service',
              value: `+R30 per cutting (3–5 weeks) — optional. International shipping via WhatsApp +27 83 447 4639.`,
            },
            ...(product.categories ? {
              breadcrumbList: {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.wonderfuldragonfruit.company/' },
                  { '@type': 'ListItem', position: 2, name: 'Products', item: 'https://www.wonderfuldragonfruit.company/products' },
                  { '@type': 'ListItem', position: 3, name: product.name, item: `https://www.wonderfuldragonfruit.company/products/${product.slug}` },
                ],
              },
            } : {}),
          }),
        }}
      />
      <Header />
      <CartSidebar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="grid lg:grid-cols-2 gap-10">
            {/* Images */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="aspect-square rounded-2xl overflow-hidden bg-muted mb-4">
                <img
                  src={images[selectedImage] || "/placeholder.svg"}
                  alt={altTexts[selectedImage] || product.name}
                  className="w-full h-full object-cover"
                  decoding="async"
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.filter(Boolean).map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index
                          ? "border-primary"
                          : "border-transparent hover:border-primary/50"
                      }`}
                    >
                      <img
                        src={img || "/placeholder.svg"}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Product info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Category badge */}
              {product.categories && (
                <Badge variant="secondary" className="mb-2">
                  {(product.categories as any).name}
                </Badge>
              )}

              {/* Title */}
              <h1 className="font-display text-3xl md:text-4xl font-bold">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gradient-sunset">
                  {formatPrice(unitPrice)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      {formatPrice(product.compare_at_price_zar!)}
                    </span>
                    <Badge variant="destructive">-{discountPercent}%</Badge>
                  </>
                )}
              </div>

              {/* Rating (placeholder) */}
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < 4 ? "text-yellow-400 fill-yellow-400" : "text-muted"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">(12 reviews)</span>
              </div>

              {/* Short description */}
              {product.short_description && (
                <p className="text-lg text-muted-foreground">
                  {product.short_description}
                </p>
              )}

              {/* Cutting size selector — shipping weight matters for courier rates */}
              <div className="space-y-2">
                <Label className="font-medium">Cutting size:</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedSize("20-30cm")}
                    className={`text-left p-3 rounded-xl border-2 transition-all ${
                      selectedSize === "20-30cm"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="block font-semibold">20 – 30 cm</span>
                    <span className="block text-xs text-muted-foreground">
                      150g – 300g packed weight
                    </span>
                    <span className="block text-sm font-medium text-primary mt-1">
                      {formatPrice(product.price_zar)}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSize("40cm")}
                    className={`text-left p-3 rounded-xl border-2 transition-all ${
                      selectedSize === "40cm"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="block font-semibold">40 cm</span>
                    <span className="block text-xs text-muted-foreground">
                      350g – 700g packed weight
                    </span>
                    <span className="block text-sm font-medium text-primary mt-1">
                      {formatPrice(Number(product.price_zar) + 70)}
                    </span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  The 40 cm cutting is larger and heavier — shipping is calculated on the packed weight above.
                </p>
              </div>

              {/* International shipping */}
              <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-sm">
                <span className="font-medium">🌍 International shipping:</span> we ship worldwide —
                WhatsApp <a
                  href="https://wa.me/27834474639?text=Hi%2C%20I%27d%20like%20an%20international%20shipping%20quote%20for%20dragon%20fruit%20cuttings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-green-600 hover:underline"
                >
                  +27 83 447 4639
                </a> for a quote.
              </div>

              {/* Stock status */}
              <div className="flex items-center gap-2">
                {product.stock_quantity > 0 ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-green-600 font-medium">
                      In Stock ({product.stock_quantity} available)
                    </span>
                  </>
                ) : product.allow_backorder ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-yellow-600 font-medium">Available for backorder</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-red-600 font-medium">Out of Stock</span>
                  </>
                )}
              </div>

              {/* Quantity selector */}
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <span className="font-medium">Quantity:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <input
                      type="number"
                      min="1"
                      max={product.stock_quantity || 9999}
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setQuantity(Math.min(Math.max(1, val), product.stock_quantity || 9999));
                      }}
                      className="w-20 text-center font-semibold border rounded-md px-2 py-1 bg-background"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.min(product.stock_quantity || 9999, quantity + 1))}
                      disabled={quantity >= (product.stock_quantity || 9999)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {/* Quick quantity buttons for bulk orders */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">Quick select:</span>
                  {[10, 50, 150, 300, 600].map((qty) => (
                    <Button
                      key={qty}
                      variant={quantity === qty ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setQuantity(qty)}
                    >
                      {qty}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Rooting Service Option */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Sprout className="h-6 w-6 text-primary mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="rooting-service" className="font-semibold cursor-pointer">
                          Add Professional Rooting Service
                        </Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-sm">
                              Our expert team will professionally root your cuttings with 95%+ success rate.
                              <br /><br />
                              <strong>Pricing:</strong> Flat <strong>R30 per cutting</strong> — any quantity.<br />
                              <strong>Timeline:</strong> 3–5 weeks. Rooting status is clearly marked on your invoice.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        95%+ success rate • Flat R30 per cutting • 3–5 week turnaround • Clearly marked on your invoice
                      </p>
                      {includeRooting && (
                        <p className="text-sm font-medium text-primary mt-2">
                          +{formatPrice(rootingPricePerPlant)}/plant × {quantity} = {formatPrice(totalRootingCost)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Switch
                    id="rooting-service"
                    checked={includeRooting}
                    onCheckedChange={setIncludeRooting}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </div>

              {/* Add to cart button */}
              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock_quantity <= 0 && !product.allow_backorder}
                  className="flex-1 btn-sunset text-lg py-6"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart - {formatPrice((unitPrice * quantity) + totalRootingCost)}
                </Button>
                <WhatsAppButton 
                  productName={product.name}
                  className="py-6 px-6"
                >
                  <span className="hidden sm:inline">Enquire</span>
                </WhatsAppButton>
              </div>

              {/* Share */}
              <div className="pt-4">
                <ShareButtons
                  url={`/product/${product.slug}`}
                  title={`${product.name} – Dragon Fruit Cultivar | DFSA`}
                  description={product.short_description || ''}
                />
              </div>


              {/* Full description */}
              {product.description && (
                <div className="pt-6 border-t">
                  <h3 className="font-semibold mb-3">Description</h3>
                  <div
                    className="prose prose-sm text-muted-foreground"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(product.description, {
                        ALLOWED_TAGS: ['p', 'b', 'i', 'u', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'h3', 'h4', 'a', 'span'],
                        ALLOWED_ATTR: ['class', 'href', 'target', 'rel'],
                        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'style'],
                        FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus'],
                      }),
                    }}
                  />
                </div>
              )}

              {/* Highlights — parsed from JSON string in DB */}
              <HighlightsSection highlights={product.highlights} />

              {/* FAQs — mapped from {q, a} to {question, answer} for SEO schema */}
              {product.faqs && product.faqs.length > 0 && (
                <div className="pt-6 border-t">
                  <FAQSection
                    faqs={product.faqs.map((f) => ({ question: f.q, answer: f.a }))}
                  />
                </div>
              )}

              {/* SKU + SEO keywords + social hashtags — rendered for customers and search indexers */}
              <div className="pt-6 border-t space-y-3">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">SKU:</span> {product.sku}
                </p>

                {/* Primary keyword + tags */}
                {(product.primary_keyword || (Array.isArray(product.tags) && product.tags.length > 0)) && (
                  <div className="text-sm">
                    {product.primary_keyword && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">Primary keyword:</span>{" "}
                        <span className="text-foreground">{product.primary_keyword}</span>
                      </p>
                    )}
                    {Array.isArray(product.tags) && product.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {product.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Social media hashtags — feeds social & AI search indexation */}
                {Array.isArray(product.hashtags) && product.hashtags.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium text-muted-foreground">Follow along:</span>{" "}
                    <span className="text-primary">{product.hashtags.join(" ")}</span>
                  </div>
                )}

                {/* AI search summary — visible index for ChatGPT / AI engines */}
                {product.ai_search_summary && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <h4 className="text-sm font-semibold mb-1">About this product</h4>
                    <p className="text-sm text-muted-foreground">{product.ai_search_summary}</p>
                  </div>
                )}

                {/* Target audience + origin */}
                {(product.target_customer || product.origin_country) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {product.target_customer && (
                      <div>
                        <span className="font-medium text-muted-foreground">Ideal for:</span>{" "}
                        <span className="text-foreground">{product.target_customer}</span>
                      </div>
                    )}
                    {product.origin_country && (
                      <div>
                        <span className="font-medium text-muted-foreground">Origin:</span>{" "}
                        <span className="text-foreground">{product.origin_country}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;
