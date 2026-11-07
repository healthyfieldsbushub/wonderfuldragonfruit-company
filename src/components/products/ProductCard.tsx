import { Link } from 'react-router-dom';
import { Product } from '@/types/product';
import { useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/button';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
  index?: number;
  variant?: 'grid' | 'list';
}

export function ProductCard({ product, index = 0, variant = 'grid' }: ProductCardProps) {
  const { addItem } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(price);
  };

  const hasDiscount = product.compare_at_price_zar && product.compare_at_price_zar > product.price_zar;
  const isOutOfStock = product.stock_quantity <= 0 && !product.allow_backorder;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price_zar,
      image: product.primary_image_url || '/placeholder.svg',
      sku: product.sku,
    });
  };

  if (variant === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="glass-card p-4 rounded-xl flex gap-4"
      >
        <Link to={`/products/${product.slug}`} className="flex-shrink-0">
          <img
            src={product.primary_image_url || '/placeholder.svg'}
            alt={product.name}
            loading="lazy"
            decoding="async"
            width={128}
            height={128}
            className="w-32 h-32 object-cover rounded-lg"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/products/${product.slug}`}>
            <h3 className="font-display font-semibold text-lg hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          {product.short_description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{product.short_description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="price-tag">{formatPrice(product.price_zar)}</span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.compare_at_price_zar!)}
              </span>
            )}
          </div>
        </div>
        <Button className="btn-sunset self-center" onClick={handleAddToCart} disabled={isOutOfStock}>
          <ShoppingCart className="h-4 w-4" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -8 }}
      className="product-card group"
    >
      <Link to={`/products/${product.slug}`} className="block">
        <div className="aspect-square rounded-lg overflow-hidden mb-4 bg-muted relative">
          <img
            src={product.primary_image_url || '/placeholder.svg'}
            alt={product.name}
            loading="lazy"
            decoding="async"
            width={480}
            height={480}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {isOutOfStock ? (
            <span className="absolute top-2 left-2 bg-muted text-muted-foreground text-xs font-bold px-2 py-1 rounded">
              OUT OF STOCK
            </span>
          ) : hasDiscount ? (
            <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded">
              SALE
            </span>
          ) : null}
        </div>
        
        <div className="space-y-2">
          <h3 className="font-display font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="price-tag">{formatPrice(product.price_zar)}</span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.compare_at_price_zar!)}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="flex gap-2 mt-4">
        <Button className="flex-1 btn-sunset" onClick={handleAddToCart} disabled={isOutOfStock}>
          <ShoppingCart className="h-4 w-4 mr-2" />
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </Button>
        <WhatsAppButton 
          productName={product.name}
          className="px-3"
        >
          <span className="sr-only">WhatsApp</span>
        </WhatsAppButton>
      </div>
    </motion.div>
  );
}
