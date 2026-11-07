import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/integrations/manus/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Package,
  Star,
  FolderTree,
  Boxes,
  RefreshCcw,
} from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { CatalogRefreshButton } from '@/components/admin/CatalogRefreshButton';
import { CatalogHealthPanel } from '@/components/admin/CatalogHealthPanel';

type AuditProduct = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  is_active: boolean;
  is_featured: boolean;
  category_id: string | null;
  primary_image_url: string | null;
  images: any;
  price_zar: number;
  stock_quantity: number;
  promo_end_date: string | null;
};

type AuditCategory = { id: string; name: string; slug: string; is_active: boolean | null };

function useAuditData() {
  return useQuery({
    queryKey: ['admin', 'product-audit'],
    queryFn: async () => {
      const [{ data: products, error: pErr }, { data: categories, error: cErr }] = await Promise.all([
        appClient
          .from('products')
          .select(
            'id, sku, name, slug, is_active, is_featured, category_id, primary_image_url, images, price_zar, stock_quantity, promo_end_date',
          )
          .order('name', { ascending: true }),
        appClient.from('categories').select('id, name, slug, is_active'),
      ]);
      if (pErr) throw pErr;
      if (cErr) throw cErr;
      return {
        products: (products ?? []) as AuditProduct[],
        categories: (categories ?? []) as AuditCategory[],
      };
    },
  });
}

type IssueKey =
  | 'inactive'
  | 'no-category'
  | 'invalid-category'
  | 'inactive-category'
  | 'no-image'
  | 'no-price'
  | 'out-of-stock'
  | 'expired-promo'
  | 'featured-but-inactive';

const ISSUE_LABELS: Record<IssueKey, string> = {
  inactive: 'Disabled (hidden from shop)',
  'no-category': 'No category mapped',
  'invalid-category': 'Category does not exist',
  'inactive-category': 'Category is disabled',
  'no-image': 'No image',
  'no-price': 'Price is 0',
  'out-of-stock': 'Out of stock',
  'expired-promo': 'Promo has expired',
  'featured-but-inactive': 'Featured but inactive',
};

export default function ProductAudit() {
  const { data, isLoading, refetch, isFetching } = useAuditData();

  const audit = useMemo(() => {
    if (!data) return null;
    const catMap = new Map(data.categories.map((c) => [c.id, c]));
    const now = new Date();

    const rows = data.products.map((p) => {
      const issues: IssueKey[] = [];
      if (!p.is_active) issues.push('inactive');
      if (!p.category_id) issues.push('no-category');
      else if (!catMap.has(p.category_id)) issues.push('invalid-category');
      else if (catMap.get(p.category_id)!.is_active === false) issues.push('inactive-category');
      const imgs = Array.isArray(p.images) ? p.images : [];
      if (!p.primary_image_url && imgs.length === 0) issues.push('no-image');
      if (!p.price_zar || Number(p.price_zar) <= 0) issues.push('no-price');
      if ((p.stock_quantity ?? 0) <= 0) issues.push('out-of-stock');
      if (p.promo_end_date && new Date(p.promo_end_date) < now) issues.push('expired-promo');
      if (p.is_featured && !p.is_active) issues.push('featured-but-inactive');
      return { product: p, issues };
    });

    const totals = {
      total: data.products.length,
      active: data.products.filter((p) => p.is_active).length,
      featured: data.products.filter((p) => p.is_featured && p.is_active).length,
      uncategorized: data.products.filter((p) => !p.category_id).length,
      categories: data.categories.length,
      withIssues: rows.filter((r) => r.issues.length > 0).length,
    };

    return { rows, totals };
  }, [data]);

  return (
    <div className="space-y-6">
      <SEOHead title="Product Audit | Admin" description="Audit catalog health" url="/admin/product-audit" />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Product Audit</h1>
          <p className="text-muted-foreground">Catalog health, visibility & category mapping checks.</p>
        </div>
        <div className="flex items-center gap-2">
          <CatalogRefreshButton variant="default" />
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching} className="gap-2">
            <RefreshCcw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Re-run audit
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={Package} label="Total" value={audit?.totals.total} loading={isLoading} />
        <StatCard icon={CheckCircle2} label="Active" value={audit?.totals.active} loading={isLoading} tone="success" />
        <StatCard icon={Star} label="Featured" value={audit?.totals.featured} loading={isLoading} />
        <StatCard icon={FolderTree} label="Categories" value={audit?.totals.categories} loading={isLoading} />
        <StatCard
          icon={Boxes}
          label="Uncategorized"
          value={audit?.totals.uncategorized}
          loading={isLoading}
          tone={audit && audit.totals.uncategorized > 0 ? 'warning' : 'default'}
        />
        <StatCard
          icon={AlertTriangle}
          label="With issues"
          value={audit?.totals.withIssues}
          loading={isLoading}
          tone={audit && audit.totals.withIssues > 0 ? 'warning' : 'success'}
        />
      </div>

      <CatalogHealthPanel />

      <Card>
        <CardHeader>
          <CardTitle>Issues found</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !audit || audit.rows.filter((r) => r.issues.length > 0).length === 0 ? (
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>All products pass the audit. Nothing to fix.</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Issues</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audit.rows
                  .filter((r) => r.issues.length > 0)
                  .map(({ product, issues }) => {
                    const cat = product.category_id
                      ? data!.categories.find((c) => c.id === product.category_id)
                      : null;
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-muted overflow-hidden flex items-center justify-center">
                            {product.primary_image_url ? (
                              <img
                                src={product.primary_image_url}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{product.slug}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                        <TableCell>
                          {product.is_active ? (
                            <Badge variant="secondary">Active</Badge>
                          ) : (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                          {product.is_featured && (
                            <Badge variant="outline" className="ml-1">
                              Featured
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {cat ? (
                            cat.name
                          ) : product.category_id ? (
                            <span className="text-destructive">Invalid id</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {issues.map((k) => (
                              <Badge
                                key={k}
                                variant={
                                  k === 'inactive' || k === 'invalid-category' || k === 'featured-but-inactive'
                                    ? 'destructive'
                                    : 'outline'
                                }
                              >
                                {ISSUE_LABELS[k]}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/admin/products?edit=${product.id}`}>Edit</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
  tone = 'default',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | undefined;
  loading: boolean;
  tone?: 'default' | 'success' | 'warning';
}) {
  const toneClass =
    tone === 'warning'
      ? 'text-destructive'
      : tone === 'success'
        ? 'text-primary'
        : 'text-foreground';
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide mb-2">
          <Icon className="h-4 w-4" />
          {label}
        </div>
        {loading ? (
          <Skeleton className="h-7 w-12" />
        ) : (
          <p className={`text-2xl font-bold ${toneClass}`}>{value ?? 0}</p>
        )}
      </CardContent>
    </Card>
  );
}
