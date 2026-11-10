import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/integrations/manus/client';
import type { Product, Category } from '@/types/product';

// Filter out products whose promo period has ended
function filterExpiredPromos(products: any[]): Product[] {
  const now = new Date();
  return products.filter((p) => {
    // If product has a promo_end_date and it's passed, hide it
    if (p.promo_end_date && new Date(p.promo_end_date) < now) {
      return false;
    }
    return true;
  });
}

// Check if a product is currently in its promo period
function isInPromoPeriod(product: any): boolean {
  if (!product.promo_start_date && !product.promo_end_date) return false;
  const now = new Date();
  if (product.promo_start_date && new Date(product.promo_start_date) > now) return false;
  if (product.promo_end_date && new Date(product.promo_end_date) < now) return false;
  return true;
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await appClient
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return filterExpiredPromos(data || []);
    },
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await appClient
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        // Fetch a wider pool so image filtering below can still yield a full grid
        .limit(24);
      
      if (error) throw error;
      // Only feature products with a real image — never render placeholder cards
      // on the homepage "Featured Dragon Fruit Plants" showcase.
      return filterExpiredPromos(data || [])
        .filter((p) => p.primary_image_url && p.primary_image_url !== '')
        .slice(0, 8);
    },
  });
}

function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await appClient
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      
      // If promo ended, treat as unavailable
      if (data?.promo_end_date && new Date(data.promo_end_date) < new Date()) {
        return null;
      }
      
      return data;
    },
    enabled: !!slug,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await appClient
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });
}

export function useProductsByCategory(categorySlug: string) {
  return useQuery({
    queryKey: ['products', 'category', categorySlug],
    queryFn: async (): Promise<Product[]> => {
      const { data: category, error: catError } = await appClient
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();
      
      if (catError) throw catError;
      
      const { data, error } = await appClient
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('category_id', category.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return filterExpiredPromos(data || []);
    },
    enabled: !!categorySlug,
  });
}

export function useSpecialProducts() {
  return useQuery({
    queryKey: ['products', 'special-of-month'],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await appClient
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('is_special_of_month', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return filterExpiredPromos(data || []);
    },
  });
}
