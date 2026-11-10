import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Papa from 'papaparse';
import { appClient } from '@/integrations/manus/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Sparkles, Loader2, Download, Upload, TriangleAlert, Star, Info, Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { MultiImageUpload, type ImageUploadMetadata } from '@/components/admin/MultiImageUpload';
import { useCategories } from '@/hooks/use-products';
import { CatalogRefreshButton } from '@/components/admin/CatalogRefreshButton';

interface ProductVariantForm {
  id?: string;
  name: string;
  sku: string;
  price_zar: string;
  weight_kg: string;
  length_cm: string;
  width_cm: string;
  height_cm: string;
  stock_quantity: string;
  is_active: boolean;
}

interface ProductForm {
  name: string;
  sku: string;
  slug: string;
  slugTouched: boolean;
  skuTouched: boolean;
  short_description: string;
  description: string;
  tags: string;
  brand: string;
  category_id: string | null;
  price_zar: string;
  compare_at_price_zar: string;
  stock_quantity: string;
  allow_backorder: boolean;
  weight_kg: string;
  length_cm: string;
  width_cm: string;
  height_cm: string;
  packaging_weight_kg: string;
  packed_length_cm: string;
  packed_width_cm: string;
  packed_height_cm: string;
  meta_title: string;
  meta_description: string;
  primary_image_url: string;
  images: string[];
  image_alt_texts: string[];
  image_metadata: ImageUploadMetadata[];
  status: 'draft' | 'published';
  is_featured: boolean;
  is_special_of_month: boolean;
  promo_start_date: string;
  promo_end_date: string;
  variants: ProductVariantForm[];
}

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  sku: string;
  short_description?: string | null;
  description?: string | null;
  tags?: string[] | null;
  brand?: string | null;
  category_id?: string | null;
  price_zar: number;
  compare_at_price_zar?: number | null;
  stock_quantity: number;
  allow_backorder?: boolean;
  weight_kg?: number | null;
  length_cm?: number | null;
  width_cm?: number | null;
  height_cm?: number | null;
  packaging_weight_kg?: number | null;
  packed_length_cm?: number | null;
  packed_width_cm?: number | null;
  packed_height_cm?: number | null;
  meta_title?: string | null;
  meta_description?: string | null;
  primary_image_url?: string | null;
  images?: string[] | null;
  image_alt_texts?: string[] | null;
  image_metadata?: ImageUploadMetadata[] | null;
  is_active: boolean;
  is_featured?: boolean;
  is_special_of_month?: boolean;
  promo_start_date?: string | null;
  promo_end_date?: string | null;
}

const emptyForm: ProductForm = {
  name: '', sku: '', slug: '', slugTouched: false, skuTouched: false,
  short_description: '', description: '', tags: '', brand: '', category_id: null,
  price_zar: '', compare_at_price_zar: '', stock_quantity: '0', allow_backorder: false,
  weight_kg: '', length_cm: '', width_cm: '', height_cm: '',
  packaging_weight_kg: '', packed_length_cm: '', packed_width_cm: '', packed_height_cm: '',
  meta_title: '', meta_description: '',
  primary_image_url: '', images: [], image_alt_texts: [], image_metadata: [],
  status: 'draft', is_featured: false, promo_start_date: '', promo_end_date: '',
  is_special_of_month: false,
  variants: [],
};

function slugify(value: string): string {
  return value.toLowerCase().trim()
    .replace(/['"’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

function Field({ label, hint, htmlFor, children, required }: {
  label: string; hint?: string; htmlFor?: string; children: React.ReactNode; required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}{required ? ' *' : ''}</Label>
      {children}
      {hint && (
        <p className="text-xs text-muted-foreground flex items-start gap-1">
          <Info className="h-3 w-3 mt-0.5 shrink-0" />{hint}
        </p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4 space-y-4">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-primary">{title}</h4>
      {children}
    </div>
  );
}

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [isGenerating, setIsGenerating] = useState(false);
  const [listFilter, setListFilter] = useState<'all' | 'published' | 'draft' | 'missing-shipping'>('all');
  const [search, setSearch] = useState('');
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulk, setBulk] = useState({
    category_id: 'nochange',
    price_mode: 'nochange', price_value: '',
    compare_mode: 'nochange', compare_value: '',
    weight_kg: '', length_cm: '', width_cm: '', height_cm: '',
    packaging_weight_kg: '', packed_length_cm: '', packed_width_cm: '', packed_height_cm: '',
    status: 'nochange',
    apply_prefix: '', apply_suffix: '',
  });

  const { data: categories } = useCategories();

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await appClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ProductRow[];
    },
  });

  const missingShipping = (p: ProductRow) =>
    p.weight_kg == null || p.weight_kg <= 0 || p.length_cm == null || p.width_cm == null || p.height_cm == null ||
    p.length_cm <= 0 || p.width_cm <= 0 || p.height_cm <= 0;

  // Specials of the Month: max 10 products at a time (excluding the one being edited).
  const specialCount = (products || []).filter((p) => p.is_special_of_month && p.id !== editingId).length;
  const specialFull = specialCount >= 10;

  const filteredProducts = useMemo(() => (products || []).filter((p) => {
    if (listFilter === 'published' && !p.is_active) return false;
    if (listFilter === 'draft' && p.is_active) return false;
    if (listFilter === 'missing-shipping' && !missingShipping(p)) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = [
        p.name, p.sku, p.slug, p.short_description,
        Array.isArray(p.tags) ? p.tags.join(' ') : (p.tags || ''),
        categories?.find((c) => c.id === p.category_id)?.name || '',
      ].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  }), [products, listFilter, search]);

  const suggestSku = (name: string, categoryId: string | null) => {
    const cat = categories?.find((c) => c.id === categoryId);
    const source = (cat?.name || name || 'PRD').toUpperCase();
    const code = source.split(/\s+/).map(w => w[0]).join('').replace(/[^A-Z]/g, '').slice(0, 3).padEnd(3, 'X');
    const taken = new Set((products || []).map((p) => p.sku));
    for (let i = 0; i < 50; i++) {
      const candidate = `HF-${code}-${Math.floor(1000 + Math.random() * 9000)}`;
      if (!taken.has(candidate)) return candidate;
    }
    return `HF-${code}-${Date.now().toString().slice(-4)}`;
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const allVisibleSelected = filteredProducts.length > 0 && filteredProducts.every((p) => selected.has(p.id));
  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) filteredProducts.forEach((p) => next.delete(p.id));
      else filteredProducts.forEach((p) => next.add(p.id));
      return next;
    });
  };

  const bulkMutation = useMutation({
    mutationFn: async () => {
      const ids = [...selected];
      let updated = 0;
      for (const id of ids) {
        const product = (products || []).find((p) => p.id === id);
        if (!product) continue;
        const payload: Record<string, unknown> = {};
        if (bulk.category_id !== 'nochange') payload.category_id = bulk.category_id === 'none' ? null : bulk.category_id;
        const price = parseFloat(bulk.price_value);
        if (bulk.price_mode === 'set' && Number.isFinite(price)) payload.price_zar = price;
        else if (bulk.price_mode === 'increase' && Number.isFinite(price)) payload.price_zar = Math.round(product.price_zar * (1 + price / 100) * 100) / 100;
        else if (bulk.price_mode === 'decrease' && Number.isFinite(price)) payload.price_zar = Math.round(product.price_zar * (1 - price / 100) * 100) / 100;
        const compare = parseFloat(bulk.compare_value);
        if (bulk.compare_mode === 'set' && Number.isFinite(compare)) payload.compare_at_price_zar = compare;
        else if (bulk.compare_mode === 'clear') payload.compare_at_price_zar = null;
        const weight = parseFloat(bulk.weight_kg);
        if (Number.isFinite(weight)) payload.weight_kg = weight;
        const length = parseFloat(bulk.length_cm);
        if (Number.isFinite(length)) payload.length_cm = length;
        const width = parseFloat(bulk.width_cm);
        if (Number.isFinite(width)) payload.width_cm = width;
        const height = parseFloat(bulk.height_cm);
        if (Number.isFinite(height)) payload.height_cm = height;
        const packagingWeight = parseFloat(bulk.packaging_weight_kg);
        if (Number.isFinite(packagingWeight)) payload.packaging_weight_kg = packagingWeight;
        const packedLength = parseFloat(bulk.packed_length_cm);
        if (Number.isFinite(packedLength)) payload.packed_length_cm = packedLength;
        const packedWidth = parseFloat(bulk.packed_width_cm);
        if (Number.isFinite(packedWidth)) payload.packed_width_cm = packedWidth;
        const packedHeight = parseFloat(bulk.packed_height_cm);
        if (Number.isFinite(packedHeight)) payload.packed_height_cm = packedHeight;
        if (bulk.status === 'publish') payload.is_active = true;
        else if (bulk.status === 'unpublish') payload.is_active = false;
        if (bulk.apply_prefix || bulk.apply_suffix) {
          const existing = product.sku || '';
          payload.sku = `${bulk.apply_prefix}${existing}${bulk.apply_suffix}`;
        }
        if (!Object.keys(payload).length) continue;
        const { error } = await appClient.from('products').update(payload).eq('id', id);
        if (error) throw error;
        updated++;
      }
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setBulkOpen(false);
      setSelected(new Set());
      setBulk({ category_id: 'nochange', price_mode: 'nochange', price_value: '', compare_mode: 'nochange', compare_value: '', weight_kg: '', length_cm: '', width_cm: '', height_cm: '', packaging_weight_kg: '', packed_length_cm: '', packed_width_cm: '', packed_height_cm: '', status: 'nochange', apply_prefix: '', apply_suffix: '' });
      toast.success(`${updated} product(s) updated`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const bulkSetActive = useMutation({
    mutationFn: async ({ ids, isActive }: { ids: string[]; isActive: boolean }) => {
      const { error } = await appClient.from('products').update({ is_active: isActive }).in('id', ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setSelected(new Set());
      toast.success(`${count} product(s) ${vars.isActive ? 'activated and now visible in the shop' : 'deactivated and hidden from the shop'}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const payload: Record<string, unknown> = {
        name: data.name,
        sku: data.sku,
        slug: data.slug || slugify(data.name),
        short_description: data.short_description || null,
        description: data.description || null,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        brand: data.brand || null,
        category_id: data.category_id || null,
        price_zar: parseFloat(data.price_zar) || 0,
        compare_at_price_zar: data.compare_at_price_zar ? parseFloat(data.compare_at_price_zar) : null,
        stock_quantity: parseInt(data.stock_quantity) || 0,
        allow_backorder: data.allow_backorder,
        weight_kg: data.weight_kg ? parseFloat(data.weight_kg) : null,
        length_cm: data.length_cm ? parseFloat(data.length_cm) : null,
        width_cm: data.width_cm ? parseFloat(data.width_cm) : null,
        height_cm: data.height_cm ? parseFloat(data.height_cm) : null,
        packaging_weight_kg: data.packaging_weight_kg ? parseFloat(data.packaging_weight_kg) : null,
        packed_length_cm: data.packed_length_cm ? parseFloat(data.packed_length_cm) : null,
        packed_width_cm: data.packed_width_cm ? parseFloat(data.packed_width_cm) : null,
        packed_height_cm: data.packed_height_cm ? parseFloat(data.packed_height_cm) : null,
        meta_title: data.meta_title || null,
        meta_description: data.meta_description || null,
        primary_image_url: data.primary_image_url || data.images[0] || null,
        images: data.images,
        image_alt_texts: data.image_alt_texts.length ? data.image_alt_texts : null,
        image_metadata: data.image_metadata,
        is_active: data.status === 'published',
        is_featured: data.is_featured,
        is_special_of_month: data.is_special_of_month,
        promo_start_date: data.promo_start_date || null,
        promo_end_date: data.promo_end_date || null,
      };

      if (editingId) {
        const { error } = await appClient.from('products').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await appClient.from('products').insert(payload).select();
        if (error) throw error;
        setEditingId((inserted as { id: string }[])?.[0]?.id || null);
      }

      // Sync variants: update existing, insert new, delete removed.
      const productId = editingId || (payload.id as string | undefined);
      const existing = editingId
        ? ((await appClient.from('product_variants').select('*').eq('product_id', editingId)).data as { id: string }[] || [])
        : [];
      const keepIds = new Set<string>();
      for (const v of data.variants) {
        const vPayload: Record<string, unknown> = {
          name: v.name, sku: v.sku, price_zar: parseFloat(v.price_zar) || 0,
          weight_kg: v.weight_kg ? parseFloat(v.weight_kg) : null,
          length_cm: v.length_cm ? parseFloat(v.length_cm) : null,
          width_cm: v.width_cm ? parseFloat(v.width_cm) : null,
          height_cm: v.height_cm ? parseFloat(v.height_cm) : null,
          stock_quantity: parseInt(v.stock_quantity) || 0, is_active: v.is_active,
        };
        if (v.id) {
          keepIds.add(v.id);
          await appClient.from('product_variants').update(vPayload).eq('id', v.id);
        } else if (productId) {
          const { data: vInserted, error } = await appClient.from('product_variants').insert({ ...vPayload, product_id: productId }).select();
          if (error) throw error;
          const newId = (vInserted as { id: string }[])?.[0]?.id;
          if (newId) keepIds.add(newId);
        }
      }
      for (const old of existing) {
        if (!keepIds.has(old.id)) await appClient.from('product_variants').delete().eq('id', old.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setIsOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      toast.success('Product saved!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await appClient.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deleted');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const generateDescription = async () => {
    if (!form.name) { toast.error('Please enter a product name first'); return; }
    setIsGenerating(true);
    try {
      const response = await fetch('/api/functions/admin-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'product_description',
          prompt: form.short_description || 'Create a compelling description',
          context: { productName: form.name, existingDescription: form.description },
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate');
      }
      const data = await response.json();
      setForm((prev) => ({ ...prev, description: data.content }));
      toast.success('Description generated!');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  // Full-field AI generation: uses the server-side own-key provider (NVIDIA,
  // never Manus AI credits). Only admin-supplied facts are used — the model is
  // instructed to leave a field blank instead of inventing data.
  const generateAllFields = async () => {
    if (!form.name) { toast.error('Please enter a product name first'); return; }
    setIsGenerating(true);
    try {
      const response = await fetch('/api/functions/admin-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'product_full_bundle',
          temperature: 0.5,
          prompt: [
            'You are the product content assistant for Healthy Fields ProAgri SA, a South African dragon fruit nursery.',
            'Generate marketing and SEO content for a product using ONLY the facts supplied. Never invent prices, stock, weights, dimensions, origins, certifications, medical or nutritional claims, or variety traits not given. If a fact is unknown, leave that field as an empty string.',
            'Return ONLY valid JSON (no markdown fences) with exactly these keys:',
            '{"short_description": string (max 300 chars), "description": string (2-3 paragraphs plain text), "tags": string[] (3-8 lowercase tags), "meta_title": string (max 60 chars, include the brand), "meta_description": string (max 155 chars), "slug": string (kebab-case)}',
            '',
            `Product name: ${form.name}`,
            form.sku ? `SKU: ${form.sku}` : '',
            form.category_id ? `Category: ${(categories || []).find((c) => c.id === form.category_id)?.name || ''}` : '',
            form.short_description ? `Existing short description: ${form.short_description}` : '',
            form.description ? `Existing description: ${form.description.replace(/<[^>]+>/g, ' ').slice(0, 500)}` : '',
          ].filter(Boolean).join('\n'),
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate');
      }
      const data = await response.json();
      const content = String(data.content || data.text || data.result || '');
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI returned an unexpected format');
      const bundle = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      setForm((prev) => ({
        ...prev,
        short_description: typeof bundle.short_description === 'string' && bundle.short_description ? bundle.short_description : prev.short_description,
        description: typeof bundle.description === 'string' && bundle.description ? bundle.description : prev.description,
        tags: Array.isArray(bundle.tags) && bundle.tags.length ? bundle.tags.join(', ') : prev.tags,
        meta_title: typeof bundle.meta_title === 'string' && bundle.meta_title ? bundle.meta_title : prev.meta_title,
        meta_description: typeof bundle.meta_description === 'string' && bundle.meta_description ? bundle.meta_description : prev.meta_description,
        slug: !prev.slugTouched && typeof bundle.slug === 'string' && bundle.slug ? bundle.slug : prev.slug,
      }));
      toast.success('All content fields generated — review before saving');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = async (product: ProductRow) => {
    setEditingId(product.id);
    const productImages = Array.isArray(product.images) ? product.images : [];
    const alts = Array.isArray(product.image_alt_texts) ? product.image_alt_texts : [];
    setForm({
      name: product.name,
      sku: product.sku,
      slug: product.slug,
      slugTouched: true,
      skuTouched: true,
      short_description: product.short_description || '',
      description: product.description || '',
      tags: (product.tags || []).join(', '),
      brand: product.brand || '',
      category_id: product.category_id || null,
      price_zar: product.price_zar?.toString() || '',
      compare_at_price_zar: product.compare_at_price_zar?.toString() || '',
      stock_quantity: product.stock_quantity?.toString() || '0',
      allow_backorder: Boolean(product.allow_backorder),
      weight_kg: product.weight_kg?.toString() || '',
      length_cm: product.length_cm?.toString() || '',
      width_cm: product.width_cm?.toString() || '',
      height_cm: product.height_cm?.toString() || '',
      packaging_weight_kg: product.packaging_weight_kg?.toString() || '',
      packed_length_cm: product.packed_length_cm?.toString() || '',
      packed_width_cm: product.packed_width_cm?.toString() || '',
      packed_height_cm: product.packed_height_cm?.toString() || '',
      meta_title: product.meta_title || '',
      meta_description: product.meta_description || '',
      primary_image_url: product.primary_image_url || '',
      images: productImages,
      image_alt_texts: productImages.map((_, i) => alts[i] || ''),
      image_metadata: Array.isArray(product.image_metadata) ? product.image_metadata : [],
      status: product.is_active ? 'published' : 'draft',
      is_featured: product.is_featured ?? false,
      is_special_of_month: product.is_special_of_month ? true : false,
      promo_start_date: product.promo_start_date ? new Date(product.promo_start_date).toISOString().slice(0, 16) : '',
      promo_end_date: product.promo_end_date ? new Date(product.promo_end_date).toISOString().slice(0, 16) : '',
      variants: [],
    });
    setIsOpen(true);
    const { data: variants } = await appClient.from('product_variants').select('*').eq('product_id', product.id).order('sort_order');
    if (Array.isArray(variants)) {
      setForm((prev) => ({
        ...prev,
        variants: variants.map((v: Record<string, unknown>) => ({
          id: v.id as string,
          name: String(v.name || ''),
          sku: String(v.sku || ''),
          price_zar: String(v.price_zar ?? ''),
          weight_kg: v.weight_kg != null ? String(v.weight_kg) : '',
          length_cm: v.length_cm != null ? String(v.length_cm) : '',
          width_cm: v.width_cm != null ? String(v.width_cm) : '',
          height_cm: v.height_cm != null ? String(v.height_cm) : '',
          stock_quantity: String(v.stock_quantity ?? 0),
          is_active: Boolean(v.is_active),
        })),
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.sku || !form.price_zar) {
      toast.error('Name, SKU and price are required.');
      return;
    }
    if (form.status === 'published' && (!form.weight_kg || !form.length_cm || !form.width_cm || !form.height_cm)) {
      toast.error('A product needs weight and dimensions (Shipping section) before it can be published.');
      return;
    }
    const slugConflict = (products || []).some((p) => p.slug === form.slug && p.id !== editingId);
    if (form.slug && slugConflict) {
      toast.error('That URL slug is already used by another product. Please choose a different one.');
      return;
    }
    saveMutation.mutate(form);
  };

  const autoFillSeo = () => {
    setForm((prev) => ({
      ...prev,
      meta_title: prev.meta_title || `${prev.name} | Buy Dragon Fruit Plants | DFSA`.slice(0, 60),
      meta_description: prev.meta_description || `${prev.short_description || prev.name} – premium dragon fruit plants from Wonderful Dragon Fruit South Africa. Nationwide delivery.`.slice(0, 160),
    }));
  };

  const setImages = (urls: string[], metadata?: ImageUploadMetadata[]) => {
    setForm((prev) => ({
      ...prev,
      images: urls,
      primary_image_url: urls.includes(prev.primary_image_url) ? prev.primary_image_url : (urls[0] || ''),
      image_alt_texts: urls.map((_, i) => prev.image_alt_texts[i] || ''),
      image_metadata: metadata ?? prev.image_metadata,
    }));
  };

  const exportCsv = () => {
    if (!products?.length) { toast.error('Nothing to export yet'); return; }
    const rows = products.map((p) => ({
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      short_description: p.short_description || '',
      description: p.description || '',
      tags: (p.tags || []).join('; '),
      brand: p.brand || '',
      category: categories?.find((c) => c.id === p.category_id)?.name || '',
      price_zar: p.price_zar ?? '',
      sale_price_zar: p.compare_at_price_zar ?? '',
      stock_quantity: p.stock_quantity ?? 0,
      weight_kg: p.weight_kg ?? '',
      length_cm: p.length_cm ?? '',
      width_cm: p.width_cm ?? '',
      height_cm: p.height_cm ?? '',
      meta_title: p.meta_title || '',
      meta_description: p.meta_description || '',
      images: (p.images || []).join('|'),
      image_alt_texts: (p.image_alt_texts || []).join('|'),
      status: p.is_active ? 'published' : 'draft',
      is_featured: p.is_featured ? 'yes' : 'no',
      is_special_of_month: p.is_special_of_month ? 'yes' : 'no',
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `products-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success(`Exported ${rows.length} products`);
  };

  const importCsv = async () => {
    if (!csvRows.length) { toast.error('Choose a CSV file first'); return; }
    let created = 0, updated = 0, failed = 0;
    let specialCount = (products || []).filter((p) => p.is_special_of_month).length;
    const takenSlugs = new Set((products || []).map((p) => p.slug));
    const takenSkus = new Set((products || []).map((p) => p.sku));
    for (const r of csvRows) {
      try {
        const name = (r.name || '').trim();
        if (!name) { failed++; continue; }
        let slug = (r.slug || slugify(name)).trim();
        while (takenSlugs.has(slug)) slug = `${slug}-2`;
        takenSlugs.add(slug);
        let sku = (r.sku || '').trim();
        while (!sku || takenSkus.has(sku)) sku = suggestSku(name, null);
        takenSkus.add(sku);
        const images = (r.images || '').split('|').map(s => s.trim()).filter(Boolean);
        const alts = (r.image_alt_texts || '').split('|').map(s => s.trim());
        const payload: Record<string, unknown> = {
          name, slug, sku,
          short_description: r.short_description || null,
          description: r.description || null,
          tags: r.tags ? r.tags.split(';').map(t => t.trim()).filter(Boolean) : null,
          brand: r.brand || null,
          category_id: categories?.find((c) => c.name.toLowerCase() === (r.category || '').toLowerCase())?.id || null,
          price_zar: parseFloat(r.price_zar) || 0,
          compare_at_price_zar: r.sale_price_zar ? parseFloat(r.sale_price_zar) : null,
          stock_quantity: parseInt(r.stock_quantity) || 0,
          weight_kg: r.weight_kg ? parseFloat(r.weight_kg) : null,
          length_cm: r.length_cm ? parseFloat(r.length_cm) : null,
          width_cm: r.width_cm ? parseFloat(r.width_cm) : null,
          height_cm: r.height_cm ? parseFloat(r.height_cm) : null,
          meta_title: r.meta_title || null,
          meta_description: r.meta_description || null,
          images,
          primary_image_url: images[0] || null,
          image_alt_texts: alts.some(Boolean) ? images.map((_, i) => alts[i] || '') : null,
          is_active: (r.status || 'draft') === 'published',
          is_featured: (r.is_featured || '').toLowerCase() === 'yes',
          is_special_of_month: (r.is_special_of_month || '').toLowerCase() === 'yes' && specialCount < 10,
        };
        if (payload.is_special_of_month) specialCount++;
        const existing = (products || []).find((p) => p.sku === sku);
        if (existing) {
          const { error } = await appClient.from('products').update(payload).eq('id', existing.id);
          if (error) throw error;
          updated++;
        } else {
          const { error } = await appClient.from('products').insert(payload);
          if (error) throw error;
          created++;
        }
      } catch { failed++; }
    }
    setCsvOpen(false);
    setCsvRows([]);
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    toast.success(`Import finished: ${created} created, ${updated} updated${failed ? `, ${failed} skipped` : ''}`);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(value);

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    return categories?.find((c) => c.id === categoryId)?.name || null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
          <Dialog open={csvOpen} onOpenChange={setCsvOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Upload className="h-4 w-4 mr-2" />Import CSV</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Bulk import products</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload a CSV exported from this page. Existing products are matched by SKU and updated; new rows are created.
                  Images use the <code>|</code> separator, tags use <code>;</code>.
                </p>
                <Input type="file" accept=".csv" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  Papa.parse(file, {
                    header: true, skipEmptyLines: true,
                    complete: (result) => setCsvRows(result.data as Record<string, string>[]),
                    error: () => toast.error('Could not read that CSV file'),
                  });
                }} />
                {csvRows.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{csvRows.length} rows ready to import</span>
                    <Button onClick={importCsv} disabled={saveMutation.isPending}>Start import</Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <CatalogRefreshButton variant="outline" />
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditingId(null);
            setForm(emptyForm);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="btn-sunset"><Plus className="h-4 w-4 mr-2" />Add Product</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Product' : 'Add Product'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium">AI Content Assistant</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    Auto-fills descriptions, tags & SEO from the product name
                  </span>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={generateAllFields} disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                  {isGenerating ? 'Generating…' : 'Generate all fields'}
                </Button>
              </div>

              <Section title="General">
                <Field label="Product name" htmlFor="name" required hint="The customer-facing title, e.g. “Sweet White Crystal — 10 Plants”.">
                  <Input id="name" value={form.name} onChange={(e) => {
                    const name = e.target.value;
                    setForm((prev) => ({
                      ...prev, name,
                      slug: prev.slugTouched ? prev.slug : slugify(name),
                      sku: prev.skuTouched ? prev.sku : suggestSku(name, prev.category_id),
                    }));
                  }} required />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="SKU (stock code)" htmlFor="sku" required hint="A unique stock code. One is suggested automatically — change it only if you have your own numbering.">
                    <Input id="sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value, skuTouched: true })} required />
                  </Field>
                  <Field label="URL slug" htmlFor="slug" hint="The web address for this product (auto-generated from the name). The old address keeps working after a change.">
                    <Input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value), slugTouched: true })} placeholder="auto-generated-from-name" />
                  </Field>
                </div>
                <Field label="Category" htmlFor="category_id" hint="Where the product appears in the shop menu.">
                  <Select value={form.category_id || 'none'} onValueChange={(value) => setForm({ ...form, category_id: value === 'none' ? null : value })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Brand" htmlFor="brand" hint="Leave empty to use Wonderful Dragon Fruit South Africa.">
                  <Input id="brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Wonderful Dragon Fruit South Africa" />
                </Field>
                <Field label="Short description" htmlFor="short_description" hint="One short sentence shown under the title and in search results.">
                  <Input id="short_description" value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value.slice(0, 160) })} />
                  <p className={`text-xs text-right ${form.short_description.length > 140 ? 'text-amber-500' : 'text-muted-foreground'}`}>{form.short_description.length}/160</p>
                </Field>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description">Long description (rich text)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={generateDescription} disabled={isGenerating}>
                      {isGenerating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                      Generate with AI
                    </Button>
                  </div>
                  <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={5}
                    placeholder="<p>Write the full story of this product. Simple HTML such as &lt;p&gt;, &lt;ul&gt; and &lt;strong&gt; is supported.</p>" />
                  <p className="text-xs text-muted-foreground flex items-start gap-1"><Info className="h-3 w-3 mt-0.5 shrink-0" />Shown on the product page. Use the AI button for a first draft, then edit freely.</p>
                </div>
                <Field label="Keywords / tags" htmlFor="tags" hint="Comma-separated words customers might search for, e.g. cuttings, white flesh, sweet.">
                  <Input id="tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
                </Field>
              </Section>

              <Section title="Pricing & stock">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Price (ZAR)" htmlFor="price_zar" required hint="Normal selling price in Rand.">
                    <Input id="price_zar" type="number" step="0.01" min="0" value={form.price_zar} onChange={(e) => setForm({ ...form, price_zar: e.target.value })} required />
                  </Field>
                  <Field label="Sale price (optional)" htmlFor="compare_at_price_zar" hint="The higher “compare at” price to show a discount.">
                    <Input id="compare_at_price_zar" type="number" step="0.01" min="0" value={form.compare_at_price_zar} onChange={(e) => setForm({ ...form, compare_at_price_zar: e.target.value })} />
                  </Field>
                  <Field label="Stock quantity" htmlFor="stock_quantity" hint="Units available. The shop shows Out of Stock at 0.">
                    <Input id="stock_quantity" type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
                  </Field>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={form.allow_backorder} onChange={(e) => setForm({ ...form, allow_backorder: e.target.checked })} className="rounded" />
                  Allow backorders when stock is zero
                </label>
              </Section>

              <Section title="Shipping (required to publish)">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <Field label="Weight (kg)" htmlFor="weight_kg" hint="Packed shipping weight, e.g. 0.8.">
                    <Input id="weight_kg" type="number" step="0.001" min="0" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
                  </Field>
                  <Field label="Length (cm)" htmlFor="length_cm" hint="Longest side of the parcel.">
                    <Input id="length_cm" type="number" step="0.1" min="0" value={form.length_cm} onChange={(e) => setForm({ ...form, length_cm: e.target.value })} />
                  </Field>
                  <Field label="Width (cm)" htmlFor="width_cm" hint="Middle side of the parcel.">
                    <Input id="width_cm" type="number" step="0.1" min="0" value={form.width_cm} onChange={(e) => setForm({ ...form, width_cm: e.target.value })} />
                  </Field>
                  <Field label="Height (cm)" htmlFor="height_cm" hint="Shortest side of the parcel.">
                    <Input id="height_cm" type="number" step="0.1" min="0" value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <Field label="Packaging weight (kg)" htmlFor="packaging_weight_kg" hint="Weight of the empty packaging (box, wrap) only.">
                    <Input id="packaging_weight_kg" type="number" step="0.001" min="0" value={form.packaging_weight_kg} onChange={(e) => setForm({ ...form, packaging_weight_kg: e.target.value })} />
                  </Field>
                  <Field label="Packed length (cm)" htmlFor="packed_length_cm" hint="Length of the fully packed parcel.">
                    <Input id="packed_length_cm" type="number" step="0.1" min="0" value={form.packed_length_cm} onChange={(e) => setForm({ ...form, packed_length_cm: e.target.value })} />
                  </Field>
                  <Field label="Packed width (cm)" htmlFor="packed_width_cm" hint="Width of the fully packed parcel.">
                    <Input id="packed_width_cm" type="number" step="0.1" min="0" value={form.packed_width_cm} onChange={(e) => setForm({ ...form, packed_width_cm: e.target.value })} />
                  </Field>
                  <Field label="Packed height (cm)" htmlFor="packed_height_cm" hint="Height of the fully packed parcel.">
                    <Input id="packed_height_cm" type="number" step="0.1" min="0" value={form.packed_height_cm} onChange={(e) => setForm({ ...form, packed_height_cm: e.target.value })} />
                  </Field>
                </div>
                <p className="text-xs text-muted-foreground">Courier quotes need weight and box size — products without them cannot be published.</p>
              </Section>

              <Section title="SEO">
                <Field label="SEO meta title" htmlFor="meta_title" hint="Search-result title. Keep it under 60 characters.">
                  <div className="flex gap-2">
                    <Input id="meta_title" value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value.slice(0, 70) })} />
                    <Button type="button" variant="outline" size="sm" onClick={autoFillSeo}>Auto-fill</Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-right">{form.meta_title.length}/60</p>
                </Field>
                <Field label="SEO meta description" htmlFor="meta_description" hint="Search-result summary under the title. Keep it under 160 characters.">
                  <Textarea id="meta_description" value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value.slice(0, 165) })} rows={2} />
                  <p className={`text-xs text-right ${form.meta_description.length > 160 ? 'text-amber-500' : 'text-muted-foreground'}`}>{form.meta_description.length}/160</p>
                </Field>
              </Section>

              <Section title="Images">
                <MultiImageUpload
                  value={form.images}
                  metadata={form.image_metadata}
                  onChange={(urls) => setImages(urls)}
                  onMetadataChange={(image_metadata) => setForm((prev) => ({ ...prev, image_metadata }))}
                  maxImages={10}
                />
                {form.images.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Add a short description (alt text) for each image — it helps Google and visually impaired visitors. The star marks the main image.</p>
                    {form.images.map((url, i) => (
                      <div key={url + i} className="flex items-center gap-2">
                        <Button type="button" variant={form.primary_image_url === url ? 'default' : 'outline'} size="icon" title="Set as main image"
                          onClick={() => setForm((prev) => ({ ...prev, primary_image_url: url }))}>
                          <Star className="h-4 w-4" />
                        </Button>
                        <img src={url} alt={`image ${i + 1}`} className="h-10 w-10 rounded object-cover" />
                        <Input
                          value={form.image_alt_texts[i] || ''}
                          onChange={(e) => {
                            const alts = [...form.image_alt_texts];
                            alts[i] = e.target.value;
                            setForm({ ...form, image_alt_texts: alts });
                          }}
                          placeholder={`Alt text for image ${i + 1}`}
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="Variants (optional)">
                <p className="text-xs text-muted-foreground">Add rows for sizes or pack options. Each variant has its own SKU, price, weight and dimensions.</p>
                {form.variants.map((v, i) => (
                  <div key={v.id || `new-${i}`} className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 rounded border bg-muted/30">
                    <Input placeholder="Name (e.g. 5-pack)" value={v.name} onChange={(e) => {
                      const variants = [...form.variants]; variants[i] = { ...v, name: e.target.value }; setForm({ ...form, variants });
                    }} />
                    <Input placeholder="SKU (blank = auto)" value={v.sku} onChange={(e) => {
                      const variants = [...form.variants]; variants[i] = { ...v, sku: e.target.value }; setForm({ ...form, variants });
                    }} />
                    <Input placeholder="Price ZAR" type="number" step="0.01" value={v.price_zar} onChange={(e) => {
                      const variants = [...form.variants]; variants[i] = { ...v, price_zar: e.target.value }; setForm({ ...form, variants });
                    }} />
                    <Input placeholder="Stock" type="number" value={v.stock_quantity} onChange={(e) => {
                      const variants = [...form.variants]; variants[i] = { ...v, stock_quantity: e.target.value }; setForm({ ...form, variants });
                    }} />
                    <Input placeholder="Weight kg" type="number" step="0.001" value={v.weight_kg} onChange={(e) => {
                      const variants = [...form.variants]; variants[i] = { ...v, weight_kg: e.target.value }; setForm({ ...form, variants });
                    }} />
                    <Input placeholder="L (cm)" type="number" step="0.1" value={v.length_cm} onChange={(e) => {
                      const variants = [...form.variants]; variants[i] = { ...v, length_cm: e.target.value }; setForm({ ...form, variants });
                    }} />
                    <Input placeholder="W (cm)" type="number" step="0.1" value={v.width_cm} onChange={(e) => {
                      const variants = [...form.variants]; variants[i] = { ...v, width_cm: e.target.value }; setForm({ ...form, variants });
                    }} />
                    <div className="flex gap-2">
                      <Input placeholder="H (cm)" type="number" step="0.1" value={v.height_cm} onChange={(e) => {
                        const variants = [...form.variants]; variants[i] = { ...v, height_cm: e.target.value }; setForm({ ...form, variants });
                      }} />
                      <Button type="button" variant="ghost" size="icon" onClick={() => setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, j) => j !== i) }))}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  setForm((prev) => ({
                    ...prev,
                    variants: [...prev.variants, { name: '', sku: '', price_zar: '', weight_kg: '', length_cm: '', width_cm: '', height_cm: '', stock_quantity: '0', is_active: true }],
                  }));
                }}>
                  <Plus className="h-4 w-4 mr-1" />Add variant
                </Button>
              </Section>

              <Section title="Status">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="w-48">
                    <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as 'draft' | 'published' }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft (hidden)</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="rounded" />
                    Featured on home page
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={form.is_special_of_month}
                      disabled={specialFull && !form.is_special_of_month}
                      onChange={(e) => setForm({ ...form, is_special_of_month: e.target.checked })}
                      className="rounded"
                    />
                    Show on Specials of the Month
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">Drafts are invisible to shoppers. Publishing requires shipping weight and dimensions.</p>
                {specialFull && (
                  <p className="text-xs text-destructive flex items-start gap-1">
                    <TriangleAlert className="h-3 w-3 mt-0.5 shrink-0" />
                    Maximum limit reached: 10 products are already selected for Specials of the Month. Unselect one before adding another.
                  </p>
                )}
                <div className="p-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 space-y-3">
                  <h4 className="text-sm font-medium text-primary">Promotional period (optional)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Promo start" htmlFor="promo_start_date">
                      <Input id="promo_start_date" type="datetime-local" value={form.promo_start_date} onChange={(e) => setForm({ ...form, promo_start_date: e.target.value })} />
                    </Field>
                    <Field label="Promo end" htmlFor="promo_end_date">
                      <Input id="promo_end_date" type="datetime-local" value={form.promo_end_date} onChange={(e) => setForm({ ...form, promo_end_date: e.target.value })} />
                    </Field>
                  </div>
                </div>
              </Section>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" className="btn-sunset" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products by name, SKU, slug, tag, category or description…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          {search && (
            <button type="button" aria-label="Clear search" onClick={() => setSearch('')} className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={listFilter} onValueChange={(value) => setListFilter(value as typeof listFilter)}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All products</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
            <SelectItem value="missing-shipping">Missing shipping data</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {search
            ? `${filteredProducts.length} of ${(products || []).length} products match "${search}"`
            : `${(products || []).filter(missingShipping).length} product(s) missing shipping data`}
        </span>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <Badge variant="secondary" className="bg-primary/15 text-primary">{selected.size} selected</Badge>
          <Button size="sm" variant="outline" onClick={() => bulkSetActive.mutate({ ids: [...selected], isActive: true })} disabled={bulkSetActive.isPending}>
            Activate (show in shop)
          </Button>
          <Button size="sm" variant="outline" onClick={() => bulkSetActive.mutate({ ids: [...selected], isActive: false })} disabled={bulkSetActive.isPending}>
            Deactivate (hide from shop)
          </Button>
          <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="btn-sunset"><Edit className="h-4 w-4 mr-1" />Bulk edit fields</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Bulk edit {selected.size} product(s)</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">Only fill in the fields you want to change on all selected products. Everything left blank stays as-is.</p>
              <div className="space-y-4">
                <Field label="Category" hint="Moves every selected product into this category.">
                  <Select value={bulk.category_id} onValueChange={(value) => setBulk({ ...bulk, category_id: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nochange">— No change —</SelectItem>
                      <SelectItem value="none">No category</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Price action">
                    <Select value={bulk.price_mode} onValueChange={(value) => setBulk({ ...bulk, price_mode: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nochange">— No change —</SelectItem>
                        <SelectItem value="set">Set exact price (ZAR)</SelectItem>
                        <SelectItem value="increase">Increase price by %</SelectItem>
                        <SelectItem value="decrease">Decrease price by %</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Value">
                    <Input type="number" step="0.01" value={bulk.price_value} onChange={(e) => setBulk({ ...bulk, price_value: e.target.value })} placeholder={bulk.price_mode === 'set' ? 'e.g. 249.99' : 'e.g. 10 for 10%'} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Sale price action">
                    <Select value={bulk.compare_mode} onValueChange={(value) => setBulk({ ...bulk, compare_mode: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nochange">— No change —</SelectItem>
                        <SelectItem value="set">Set sale/compare price (ZAR)</SelectItem>
                        <SelectItem value="clear">Remove sale price</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Value">
                    <Input type="number" step="0.01" value={bulk.compare_value} onChange={(e) => setBulk({ ...bulk, compare_value: e.target.value })} disabled={bulk.compare_mode !== 'set'} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Field label="Weight (kg)"><Input type="number" step="0.001" value={bulk.weight_kg} onChange={(e) => setBulk({ ...bulk, weight_kg: e.target.value })} placeholder="no change" /></Field>
                  <Field label="Length (cm)"><Input type="number" step="0.1" value={bulk.length_cm} onChange={(e) => setBulk({ ...bulk, length_cm: e.target.value })} placeholder="no change" /></Field>
                  <Field label="Width (cm)"><Input type="number" step="0.1" value={bulk.width_cm} onChange={(e) => setBulk({ ...bulk, width_cm: e.target.value })} placeholder="no change" /></Field>
                  <Field label="Height (cm)"><Input type="number" step="0.1" value={bulk.height_cm} onChange={(e) => setBulk({ ...bulk, height_cm: e.target.value })} placeholder="no change" /></Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="SKU prefix" hint="Added to the front of every selected SKU, e.g. DF- → DF-HF-1234.">
                    <Input value={bulk.apply_prefix} onChange={(e) => setBulk({ ...bulk, apply_prefix: e.target.value.toUpperCase() })} placeholder="e.g. DF-" />
                  </Field>
                  <Field label="SKU suffix" hint="Added to the end of every selected SKU, e.g. -26 → HF-1234-26.">
                    <Input value={bulk.apply_suffix} onChange={(e) => setBulk({ ...bulk, apply_suffix: e.target.value.toUpperCase() })} placeholder="e.g. -26" />
                  </Field>
                </div>
                <Field label="Shop visibility" hint="Activated products appear in the shop and catalogue; deactivated ones are hidden everywhere on the site.">
                  <Select value={bulk.status} onValueChange={(value) => setBulk({ ...bulk, status: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nochange">— No change —</SelectItem>
                      <SelectItem value="publish">Activate (show in shop)</SelectItem>
                      <SelectItem value="unpublish">Deactivate (hide from shop)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
                <Button type="button" className="btn-sunset" disabled={bulkMutation.isPending} onClick={() => bulkMutation.mutate()}>
                  {bulkMutation.isPending ? 'Applying…' : `Apply to ${selected.size} product(s)`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear selection</Button>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    aria-label="Select all visible products"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Shipping</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      aria-label={`Select ${product.name}`}
                      checked={selected.has(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.primary_image_url && (
                        <img src={product.primary_image_url} alt={product.name} className="h-10 w-10 rounded object-cover" />
                      )}
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.is_featured && <span className="text-xs text-primary">Featured</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                  <TableCell>{getCategoryName(product.category_id) || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>{formatCurrency(product.price_zar)}</TableCell>
                  <TableCell>
                    <span className={product.stock_quantity < 5 ? 'text-red-500 font-medium' : ''}>{product.stock_quantity}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={product.is_active ? 'bg-green-500/20 text-green-500' : ''}>
                      {product.is_active ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {missingShipping(product) ? (
                      <Badge variant="destructive" className="gap-1"><TriangleAlert className="h-3 w-3" />Missing</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">OK</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this product?')) deleteMutation.mutate(product.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>
    </div>
  );
}
