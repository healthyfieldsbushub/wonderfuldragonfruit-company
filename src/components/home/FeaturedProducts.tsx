import { motion } from 'framer-motion';
import { useFeaturedProducts } from '@/hooks/use-products';
import { ProductCard } from '@/components/products/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';

export function FeaturedProducts() {
  const { data: products, isLoading } = useFeaturedProducts();

  return (
    <section className="section-container">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <p className="text-primary font-medium tracking-widest uppercase mb-2">Premium Cultivars</p>
        <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">Featured Dragon Fruit Plants</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Hand-selected dragon fruit cultivars from our commercial nursery — Ruby, Sweet White, yellow-flesh and variegated Hylocereus varieties bred for high brix, heavy fruiting and proven performance across African climates.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))
        ) : (
          products?.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))
        )}
      </div>
    </section>
  );
}
