import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/integrations/manus/client';

// The public storefront and admin diagnostics use the same relative Manus API origin.
const anonClient = appClient;

export type HealthCheck = {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
  hint?: string;
};

export type CatalogHealth = {
  checks: HealthCheck[];
  counts: {
    dbTotal: number;
    dbActive: number;
    dbFeatured: number;
    anonVisible: number | null;
    categoriesAnonVisible: number | null;
    storefrontVisible: number;
  };
};

export function useCatalogHealth() {
  return useQuery<CatalogHealth>({
    queryKey: ['admin', 'catalog-health'],
    queryFn: async () => {
      const now = new Date();

      // Admin/auth context (already passes RLS for admins)
      const { count: dbTotal } = await appClient
        .from('products')
        .select('id', { count: 'exact', head: true });
      const { count: dbActive } = await appClient
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);
      const { count: dbFeatured } = await appClient
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('is_featured', true);

      // Storefront-visible: active + not in expired promo + (in stock OR backorder allowed)
      const { data: storefront } = await appClient
        .from('products')
        .select('id, promo_end_date, stock_quantity, allow_backorder, primary_image_url, images, category_id')
        .eq('is_active', true);
      const visible = (storefront ?? []).filter(
        (p) => !p.promo_end_date || new Date(p.promo_end_date) >= now,
      );
      const storefrontVisible = visible.length;

      // Anonymous probe — same query a shopper would make
      let anonVisible: number | null = null;
      let categoriesAnonVisible: number | null = null;
      let anonError: string | null = null;
      if (anonClient) {
        const { count, error } = await anonClient
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true);
        if (error) anonError = error.message;
        else anonVisible = count ?? 0;

        const { count: catCount, error: catErr } = await anonClient
          .from('categories')
          .select('id', { count: 'exact', head: true });
        if (!catErr) categoriesAnonVisible = catCount ?? 0;
      }

      const checks: HealthCheck[] = [];

      // 1. Database has products
      checks.push(
        (dbTotal ?? 0) === 0
          ? {
              id: 'db-empty',
              label: 'Catalog has products',
              status: 'fail',
              detail: 'No products exist in the database.',
              hint: 'Add products from /admin/products.',
            }
          : {
              id: 'db-empty',
              label: 'Catalog has products',
              status: 'pass',
              detail: `${dbTotal} products in database.`,
            },
      );

      // 2. RLS / grants — anon read
      if (!anonClient) {
        checks.push({
          id: 'rls',
          label: 'Public read access (RLS + grants)',
          status: 'warn',
          detail: 'Could not initialise public client (env vars missing).',
        });
      } else if (anonError) {
        checks.push({
          id: 'rls',
          label: 'Public read access (RLS + grants)',
          status: 'fail',
          detail: `Anonymous query failed: ${anonError}`,
          hint: 'Run a migration to GRANT SELECT on products to anon, or fix the RLS policy.',
        });
      } else if ((anonVisible ?? 0) < (dbActive ?? 0)) {
        checks.push({
          id: 'rls',
          label: 'Public read access (RLS + grants)',
          status: 'fail',
          detail: `Shoppers can see ${anonVisible} of ${dbActive} active products.`,
          hint: 'A row-level policy or column grant is hiding products from the storefront.',
        });
      } else {
        checks.push({
          id: 'rls',
          label: 'Public read access (RLS + grants)',
          status: 'pass',
          detail: `Shoppers see all ${anonVisible} active products.`,
        });
      }

      // 3. Categories visible to public
      if (categoriesAnonVisible !== null) {
        checks.push(
          categoriesAnonVisible === 0
            ? {
                id: 'cat-rls',
                label: 'Public read access to categories',
                status: 'warn',
                detail: 'No categories visible to shoppers.',
                hint: 'Add categories or check the categories RLS policy.',
              }
            : {
                id: 'cat-rls',
                label: 'Public read access to categories',
                status: 'pass',
                detail: `${categoriesAnonVisible} categories visible publicly.`,
              },
        );
      }

      // 4. Tenant / category mapping
      const uncategorized = (storefront ?? []).filter((p) => !p.category_id).length;
      checks.push(
        uncategorized > 0
          ? {
              id: 'tenant-map',
              label: 'Tenant / category mapping',
              status: 'warn',
              detail: `${uncategorized} active products have no category.`,
              hint: 'Open the product audit table to assign categories.',
            }
          : {
              id: 'tenant-map',
              label: 'Tenant / category mapping',
              status: 'pass',
              detail: 'All active products are mapped to a category.',
            },
      );

      // 5. Stock & status
      const inactive = (dbTotal ?? 0) - (dbActive ?? 0);
      const noStock = (storefront ?? []).filter(
        (p) => (p.stock_quantity ?? 0) <= 0 && !p.allow_backorder,
      ).length;
      const expiredPromo = (storefront ?? []).filter(
        (p) => p.promo_end_date && new Date(p.promo_end_date) < now,
      ).length;
      const stockIssues = noStock + expiredPromo;
      checks.push(
        stockIssues > 0
          ? {
              id: 'stock-status',
              label: 'Stock & status',
              status: 'warn',
              detail: `${inactive} disabled, ${noStock} out of stock, ${expiredPromo} with expired promos.`,
              hint: 'Enable, restock, or extend promo end dates.',
            }
          : {
              id: 'stock-status',
              label: 'Stock & status',
              status: 'pass',
              detail: `All ${dbActive} active products are sellable.`,
            },
      );

      // 6. Images
      const noImg = (storefront ?? []).filter(
        (p) => !p.primary_image_url && (!Array.isArray(p.images) || p.images.length === 0),
      ).length;
      checks.push(
        noImg > 0
          ? {
              id: 'images',
              label: 'Product images',
              status: 'warn',
              detail: `${noImg} active products have no image.`,
              hint: 'Upload photos — listings without images convert poorly and hurt SEO.',
            }
          : {
              id: 'images',
              label: 'Product images',
              status: 'pass',
              detail: 'Every active product has at least one image.',
            },
      );

      // 7. Featured set healthy
      checks.push(
        (dbFeatured ?? 0) === 0
          ? {
              id: 'featured',
              label: 'Featured products',
              status: 'warn',
              detail: 'Nothing is featured on the home page.',
              hint: 'Mark 4–8 products as Featured for the home page carousel.',
            }
          : {
              id: 'featured',
              label: 'Featured products',
              status: 'pass',
              detail: `${dbFeatured} featured products active.`,
            },
      );

      return {
        checks,
        counts: {
          dbTotal: dbTotal ?? 0,
          dbActive: dbActive ?? 0,
          dbFeatured: dbFeatured ?? 0,
          anonVisible,
          categoriesAnonVisible,
          storefrontVisible,
        },
      };
    },
    refetchOnWindowFocus: false,
  });
}
