import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { ProductCard } from '@/components/products/ProductCard';
import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { useProductsByCategory, useCategories } from '@/hooks/use-products';
import { categorySEOData, getDbSlug, getSeoSlug } from '@/lib/category-seo';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, Leaf, ShoppingBag } from 'lucide-react';
import { useEffect } from 'react';

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const seoSlug = slug || '';
  const dbSlug = getDbSlug(seoSlug);
  const seo = categorySEOData[seoSlug];
  const { data: products = [], isLoading } = useProductsByCategory(dbSlug);
  const { data: categories = [] } = useCategories();

  // JSON-LD Product list structured data
  useEffect(() => {
    if (!seo || products.length === 0) return;
    const baseUrl = 'https://www.wonderfuldragonfruit.company';

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: seo.h1,
      description: seo.metaDescription,
      url: `${baseUrl}/category/${seoSlug}`,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: products.length,
        itemListElement: products.slice(0, 20).map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Product',
            name: p.name,
            url: `${baseUrl}/products/${p.slug}`,
            image: p.primary_image_url,
            offers: {
              '@type': 'Offer',
              price: p.price_zar,
              priceCurrency: 'ZAR',
              availability: p.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            },
          },
        })),
      },
    };

    let el = document.getElementById('json-ld-category') as HTMLScriptElement;
    if (!el) {
      el = document.createElement('script');
      el.id = 'json-ld-category';
      el.type = 'application/ld+json';
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(jsonLd);
    return () => { el?.remove(); };
  }, [seo, products, seoSlug]);

  if (!seo) {
    return (
      <div className="min-h-screen">
        <Header />
        <CartSidebar />
        <main className="pt-24 pb-16 container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">Category Not Found</h1>
          <p className="text-muted-foreground mb-6">The category you're looking for doesn't exist.</p>
          <Button asChild><Link to="/products">Browse All Products</Link></Button>
        </main>
      </div>
    );
  }

  // Get related category objects
  const relatedCats = seo.relatedCategories
    .map(rcSlug => {
      const rcSeo = categorySEOData[rcSlug];
      return rcSeo ? { slug: rcSlug, name: rcSeo.h1.replace(' South Africa', '') } : null;
    })
    .filter(Boolean) as { slug: string; name: string }[];

  return (
    <div className="min-h-screen">
      <SEOHead
        title={seo.metaTitle}
        description={seo.metaDescription}
        keywords={seo.keywords}
        url={`/category/${seoSlug}`}
      />
      <Header />
      <CartSidebar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Breadcrumbs
            items={[
              { label: 'Shop', href: '/products' },
              { label: seo.h1.replace(' South Africa', '') },
            ]}
            className="mb-6"
          />

          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-4 text-gradient-tropical">
              {seo.h1}
            </h1>
            <div
              className="prose prose-lg max-w-4xl text-muted-foreground [&_p]:mb-4 [&_strong]:text-foreground [&_em]:text-primary/80"
              dangerouslySetInnerHTML={{ __html: seo.seoContent }}
            />
          </motion.div>

          {/* Product Grid */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary" />
                {products.length} Cultivar{products.length !== 1 ? 's' : ''} Available
              </h2>
              <Button variant="outline" asChild>
                <Link to="/products" className="gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  View All Products
                </Link>
              </Button>
            </div>

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
            ) : products.length === 0 ? (
              <div className="text-center py-16 glass-card rounded-xl">
                <p className="text-xl text-muted-foreground mb-4">No products in this category yet</p>
                <Button asChild className="btn-sunset">
                  <Link to="/products">Browse All Products</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            )}
          </section>

          {/* Related Categories */}
          <section className="mb-16">
            <h2 className="font-display text-2xl font-bold mb-6">Explore More Categories</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedCats.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/category/${cat.slug}`}
                  className="glass-card p-6 rounded-xl hover:border-primary/50 transition-all group"
                >
                  <h3 className="font-display font-semibold text-lg group-hover:text-primary transition-colors flex items-center justify-between">
                    {cat.name}
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                </Link>
              ))}
            </div>
          </section>

          {/* Internal Links Section */}
          <section className="glass-card p-8 rounded-xl">
            <h2 className="font-display text-2xl font-bold mb-4">Learn More About Dragon Fruit</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Popular Pages</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li><Link to="/products" className="hover:text-primary transition-colors">→ Full Product Catalog</Link></li>
                  <li><Link to="/consultations" className="hover:text-primary transition-colors">→ Expert Consultations</Link></li>
                  <li><Link to="/association" className="hover:text-primary transition-colors">→ DFSA Association</Link></li>
                  <li><Link to="/directory" className="hover:text-primary transition-colors">→ Business Directory</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Recommended Reading</h3>
                <ul className="space-y-2 text-muted-foreground">
                  {seo.relatedBlogSlugs.map((blogSlug) => (
                    <li key={blogSlug}>
                      <Link to={`/blog/${blogSlug}`} className="hover:text-primary transition-colors">
                        → {blogSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </Link>
                    </li>
                  ))}
                  <li><Link to="/blog" className="hover:text-primary transition-colors">→ All Blog Articles</Link></li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default CategoryPage;
