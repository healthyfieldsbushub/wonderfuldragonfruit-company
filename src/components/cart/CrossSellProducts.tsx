import { useMemo } from 'react';
import { useProducts } from '@/hooks/use-products';
import { useCart } from '@/lib/cart-context';
import { ProductCard } from '@/components/products/ProductCard';
import { Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * "You might also like" cross-sell grid for the Cart/Checkout pages.
 * Picks complementary items from the live catalogue:
 *  - favours products in the same categories as the current cart items
 *  - otherwise favours featured items (live cultures, fertilizers, nursery stock)
 *  - excludes items already in the cart / out of stock
 */
export function CrossSellProducts({
  seedCategoryIds,
  max = 4,
  title = 'You might also like',
  subtitle = 'Customers who bought these cuttings also stock up on these',
}: {
  seedCategoryIds?: string[];
  max?: number;
  title?: string;
  subtitle?: string;
}) {
  const { data: products, isLoading } = useProducts();
  const { items } = useCart();

  const recommendations = useMemo(() => {
    if (!products) return [];
    const inCart = new Set(items.map((i) => i.productId));
    const available = products.filter(
      (p) => !inCart.has(p.id) && (p.stock_quantity > 0 || p.allow_backorder)
    );

    // Score: same-category as cart items first, then featured, then newest.
    const cartCategories = new Set(
      seedCategoryIds && seedCategoryIds.length
        ? seedCategoryIds
        : products.filter((p) => inCart.has(p.id)).map((p) => p.category_id).filter(Boolean)
    );
    const scored = available.map((p) => {
      let score = 0;
      if (p.category_id && cartCategories.has(p.category_id)) score += 10;
      if (p.is_featured) score += 3;
      if (p.compare_at_price_zar && p.compare_at_price_zar > p.price_zar) score += 1;
      return { p, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, max).map((s) => s.p);
  }, [products, items, seedCategoryIds, max]);

  if (isLoading) {
    return (
      <section className="mt-10 pt-8 border-t">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-primary" />
          <Skeleton className="h-6 w-56" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: max }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <section className="mt-10 pt-8 border-t" aria-label="Recommended products">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl md:text-2xl font-bold">{title}</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recommendations.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
