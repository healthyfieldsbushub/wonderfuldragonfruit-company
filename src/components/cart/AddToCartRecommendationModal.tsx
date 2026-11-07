import { useEffect, useMemo, useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { useProducts } from '@/hooks/use-products';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Upsell modal shown right after a customer adds an item to the cart.
 * Suggests complementary catalogue items (same category first, then
 * featured nursery stock / live cultures) to boost average order value.
 */
export function AddToCartRecommendationModal() {
  const { lastAdded, setLastAdded, items } = useCart();
  const { data: products } = useProducts();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (lastAdded) {
      setOpen(true);
    }
  }, [lastAdded]);

  const close = () => {
    setOpen(false);
    setLastAdded(null);
  };

  const recommendations = useMemo(() => {
    if (!products || !lastAdded) return [];
    const seed = products.find((p) => p.id === lastAdded.productId);
    const inCart = new Set(items.map((i) => i.productId));
    const available = products.filter(
      (p) => !inCart.has(p.id) && (p.stock_quantity > 0 || p.allow_backorder)
    );
    const scored = available.map((p) => {
      let score = 0;
      if (seed?.category_id && p.category_id === seed.category_id) score += 10;
      if (p.is_featured) score += 3;
      return { p, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map((s) => s.p);
  }, [products, lastAdded, items]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Added to cart!
          </DialogTitle>
          <DialogDescription>
            {lastAdded?.name} is in your cart — customers often add these too.
          </DialogDescription>
        </DialogHeader>

        {recommendations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              Frequently bought together
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recommendations.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <Button variant="outline" className="flex-1" onClick={close}>
            Continue Shopping
          </Button>
          <Button className="flex-1 btn-sunset" onClick={close} asChild>
            <Link to="/checkout">Go to Checkout</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
