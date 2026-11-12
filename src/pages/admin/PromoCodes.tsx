import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/integrations/manus/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Loader2, Tag, Layers, TrendingUp, CheckCircle2, Copy, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface PromoForm {
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  min_order_zar: string;
  max_uses: string;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
}

const emptyForm: PromoForm = {
  code: '',
  description: '',
  discount_type: 'percentage',
  discount_value: '',
  min_order_zar: '',
  max_uses: '',
  starts_at: '',
  expires_at: '',
  is_active: true,
};

type BulkMode = 'prefix' | 'random' | 'paste';

interface BulkForm {
  mode: BulkMode;
  prefix: string;
  count: string;
  startAt: string;
  randomLength: string;
  pasted: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  min_order_zar: string;
  max_uses: string;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
}

const emptyBulk: BulkForm = {
  mode: 'prefix',
  prefix: 'BLACKNOV',
  count: '10',
  startAt: '1',
  randomLength: '6',
  pasted: '',
  description: '',
  discount_type: 'fixed',
  discount_value: '',
  min_order_zar: '',
  max_uses: '',
  starts_at: '',
  expires_at: '',
  is_active: true,
};

interface PromoCodeRow {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_zar: number;
  max_uses: number | null;
  current_uses: number | null;
  is_active: boolean | number;
  starts_at: string | null;
  expires_at: string | null;
}

interface Analytics {
  totals: { redemptions: number; discount_given: number; revenue: number };
  today: number;
  perCode: { code: string; redemptions: number; discount_given: number; revenue: number; last_used: string | null }[];
  series: { day: string; redemptions: number; discount_given: number }[];
}

// The same formatter the storefront uses, so an admin figure and a customer
// figure for the same amount always read identically.
const zarFormatter = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' });
const zar = (value: number | string | null | undefined) => zarFormatter.format(Number(value) || 0);

/** Percentage of a code's allowance that has been used. */
function usedPercent(row: PromoCodeRow) {
  const cap = Number(row.max_uses) || 0;
  if (!cap) return 0;
  return Math.min(100, Math.round(((Number(row.current_uses) || 0) / cap) * 100));
}

function remainingUses(row: PromoCodeRow) {
  const cap = Number(row.max_uses) || 0;
  if (!cap) return null;
  return Math.max(0, cap - (Number(row.current_uses) || 0));
}

export default function AdminPromoCodes() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PromoForm>(emptyForm);
  const [bulk, setBulk] = useState<BulkForm>(emptyBulk);
  const [spotlightCode, setSpotlightCode] = useState('BLACKNOVEMBER2026');

  const { data: codes, isLoading } = useQuery({
    queryKey: ['admin-promo-codes'],
    queryFn: async () => {
      const { data, error } = await appClient
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PromoCodeRow[];
    },
  });

  // Redemption figures are computed on the server from real orders, so the
  // dashboard cannot drift from what was actually charged.
  const { data: analytics, refetch: refetchAnalytics, isFetching: analyticsLoading } = useQuery({
    queryKey: ['admin-promo-analytics'],
    queryFn: async () => {
      const res = await fetch('/api/admin/promo-analytics', { credentials: 'include' });
      if (!res.ok) throw new Error('Could not load redemption figures');
      return (await res.json()) as Analytics;
    },
  });

  const spotlight = useMemo(() => {
    const row = codes?.find((c) => c.code.toUpperCase() === spotlightCode.toUpperCase());
    const stats = analytics?.perCode.find((p) => p.code.toUpperCase() === spotlightCode.toUpperCase());
    return {
      row,
      redemptions: stats?.redemptions ?? (Number(row?.current_uses) || 0),
      discountGiven: stats?.discount_given ?? 0,
      revenue: stats?.revenue ?? 0,
      lastUsed: stats?.last_used ?? null,
    };
  }, [codes, analytics, spotlightCode]);

  const activeCodes = (codes || []).filter((c) => Boolean(c.is_active)).length;
  const limitedCodes = (codes || []).filter((c) => Number(c.max_uses) > 0).length;
  const peakDay = useMemo(() => {
    const s = analytics?.series || [];
    return s.reduce((max, d) => (d.redemptions > max.redemptions ? d : max), { day: '', redemptions: 0, discount_given: 0 });
  }, [analytics]);

  const saveMutation = useMutation({
    mutationFn: async (data: PromoForm) => {
      const payload = {
        code: data.code.toUpperCase().trim(),
        description: data.description || null,
        discount_type: data.discount_type,
        discount_value: parseFloat(data.discount_value) || 0,
        min_order_zar: data.min_order_zar ? parseFloat(data.min_order_zar) : 0,
        max_uses: data.max_uses ? parseInt(data.max_uses) : null,
        starts_at: data.starts_at || null,
        expires_at: data.expires_at || null,
        is_active: data.is_active,
      };

      if (editingId) {
        const { error } = await appClient.from('promo_codes').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await appClient.from('promo_codes').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-promo-analytics'] });
      setIsOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      toast.success(editingId ? 'Promo code updated' : 'Promo code created');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await appClient.from('promo_codes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-promo-analytics'] });
      toast.success('Promo code deleted');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  /** Build the list of codes the current bulk settings describe. */
  const bulkCodes = useMemo(() => {
    if (bulk.mode === 'paste') {
      return bulk.pasted
        .split(/[\n,;]+/)
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean);
    }
    const count = Math.min(500, Math.max(1, parseInt(bulk.count) || 0));
    const prefix = bulk.prefix.trim().toUpperCase();
    if (bulk.mode === 'prefix') {
      const start = Math.max(1, parseInt(bulk.startAt) || 1);
      const width = String(start + count - 1).length;
      return Array.from({ length: count }, (_, i) => `${prefix}${String(start + i).padStart(Math.max(2, width), '0')}`);
    }
    // Random: unguessable suffixes so codes cannot be enumerated by a stranger.
    const len = Math.min(20, Math.max(4, parseInt(bulk.randomLength) || 6));
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const out = new Set<string>();
    let guard = 0;
    while (out.size < count && guard < count * 40) {
      guard += 1;
      let suffix = '';
      const bytes = new Uint8Array(len);
      crypto.getRandomValues(bytes);
      for (let i = 0; i < len; i += 1) suffix += alphabet[bytes[i] % alphabet.length];
      out.add(`${prefix}${suffix}`);
    }
    return Array.from(out);
  }, [bulk]);

  const bulkMutation = useMutation({
    mutationFn: async () => {
      if (!bulkCodes.length) throw new Error('No codes to create');
      if (!bulk.discount_value) throw new Error('Set a discount value');
      const res = await fetch('/api/admin/promo-codes/bulk', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codes: bulkCodes,
          description: bulk.description || null,
          discount_type: bulk.discount_type,
          discount_value: parseFloat(bulk.discount_value) || 0,
          min_order_zar: bulk.min_order_zar ? parseFloat(bulk.min_order_zar) : 0,
          max_uses: bulk.max_uses ? parseInt(bulk.max_uses) : null,
          starts_at: bulk.starts_at || null,
          expires_at: bulk.expires_at || null,
          is_active: bulk.is_active,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk create failed');
      return data as { created: string[]; createdCount: number; skipped: string[]; invalid: string[] };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-promo-analytics'] });
      const parts = [`${data.createdCount} code${data.createdCount === 1 ? '' : 's'} created`];
      if (data.skipped.length) parts.push(`${data.skipped.length} already existed`);
      if (data.invalid.length) parts.push(`${data.invalid.length} invalid`);
      toast.success(parts.join(' · '));
      if (data.createdCount) {
        setBulkOpen(false);
        setBulk(emptyBulk);
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleEdit = (code: PromoCodeRow) => {
    setEditingId(code.id);
    setForm({
      code: code.code,
      description: code.description || '',
      discount_type: code.discount_type === 'percentage' ? 'percentage' : 'fixed',
      discount_value: code.discount_value?.toString() || '',
      min_order_zar: code.min_order_zar?.toString() || '',
      max_uses: code.max_uses?.toString() || '',
      starts_at: code.starts_at ? new Date(code.starts_at).toISOString().slice(0, 16) : '',
      expires_at: code.expires_at ? new Date(code.expires_at).toISOString().slice(0, 16) : '',
      is_active: Boolean(code.is_active),
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.discount_value) {
      toast.error('Please fill in the required fields');
      return;
    }
    saveMutation.mutate(form);
  };

  const copySpotlight = async () => {
    try {
      await navigator.clipboard.writeText(spotlightCode);
      toast.success(`${spotlightCode} copied`);
    } catch {
      toast.error('Could not copy to the clipboard');
    }
  };

  const spotlightPercent = spotlight.row ? usedPercent(spotlight.row) : 0;
  const spotlightRemaining = spotlight.row ? remainingUses(spotlight.row) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display font-bold">Promo Codes</h1>
          <p className="text-muted-foreground">Create and track discount codes for checkout</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { refetchAnalytics(); }} disabled={analyticsLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${analyticsLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Dialog open={bulkOpen} onOpenChange={(open) => { setBulkOpen(open); if (!open) setBulk(emptyBulk); }}>
            <DialogTrigger asChild>
              <Button variant="outline"><Layers className="h-4 w-4 mr-2" /> Bulk Create</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create multiple promo codes</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); bulkMutation.mutate(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label>How should the codes be generated?</Label>
                  <Select value={bulk.mode} onValueChange={(v: BulkMode) => setBulk({ ...bulk, mode: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prefix">Numbered from a prefix (BLACKNOV01, BLACKNOV02…)</SelectItem>
                      <SelectItem value="random">Random suffixes (harder to guess)</SelectItem>
                      <SelectItem value="paste">Paste my own list</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {bulk.mode === 'paste' ? (
                  <div className="space-y-2">
                    <Label>One code per line</Label>
                    <Textarea
                      rows={6}
                      value={bulk.pasted}
                      onChange={(e) => setBulk({ ...bulk, pasted: e.target.value })}
                      placeholder={'SPRING01\nSPRING02\nSPRING03'}
                    />
                    <p className="text-xs text-muted-foreground">
                      Separated by new lines, commas or semicolons. Codes already in the list are skipped.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Prefix</Label>
                      <Input value={bulk.prefix} onChange={(e) => setBulk({ ...bulk, prefix: e.target.value.toUpperCase() })} placeholder="BLACKNOV" />
                    </div>
                    <div className="space-y-2">
                      <Label>How many</Label>
                      <Input type="number" min="1" max="500" value={bulk.count} onChange={(e) => setBulk({ ...bulk, count: e.target.value })} />
                    </div>
                    {bulk.mode === 'prefix' ? (
                      <div className="space-y-2">
                        <Label>Start at</Label>
                        <Input type="number" min="1" value={bulk.startAt} onChange={(e) => setBulk({ ...bulk, startAt: e.target.value })} />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Random length</Label>
                        <Input type="number" min="4" max="20" value={bulk.randomLength} onChange={(e) => setBulk({ ...bulk, randomLength: e.target.value })} />
                      </div>
                    )}
                  </div>
                )}

                {bulkCodes.length > 0 && (
                  <div className="rounded-lg border p-3 bg-muted/30">
                    <p className="text-sm font-medium mb-2">
                      {bulkCodes.length} code{bulkCodes.length === 1 ? '' : 's'} will be created
                    </p>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {bulkCodes.slice(0, 40).map((c) => (
                        <span key={c} className="font-mono text-xs px-2 py-1 rounded bg-background border">{c}</span>
                      ))}
                      {bulkCodes.length > 40 && <span className="text-xs text-muted-foreground self-center">+{bulkCodes.length - 40} more</span>}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">These rules apply to every code in the batch</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Discount Type</Label>
                      <Select value={bulk.discount_type} onValueChange={(v: 'percentage' | 'fixed') => setBulk({ ...bulk, discount_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount (R)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Discount Value *</Label>
                      <Input type="number" step="0.01" value={bulk.discount_value} onChange={(e) => setBulk({ ...bulk, discount_value: e.target.value })} placeholder={bulk.discount_type === 'percentage' ? '10' : '60'} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Min Order (R)</Label>
                      <Input type="number" step="0.01" value={bulk.min_order_zar} onChange={(e) => setBulk({ ...bulk, min_order_zar: e.target.value })} placeholder="0" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label>Uses per code</Label>
                      <Input type="number" value={bulk.max_uses} onChange={(e) => setBulk({ ...bulk, max_uses: e.target.value })} placeholder="Unlimited" />
                      <p className="text-xs text-muted-foreground">Leave blank for unlimited</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Starts At</Label>
                      <Input type="datetime-local" value={bulk.starts_at} onChange={(e) => setBulk({ ...bulk, starts_at: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Expires At</Label>
                      <Input type="datetime-local" value={bulk.expires_at} onChange={(e) => setBulk({ ...bulk, expires_at: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label>Description</Label>
                    <Input value={bulk.description} onChange={(e) => setBulk({ ...bulk, description: e.target.value })} placeholder="Black November campaign" />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer mt-4">
                    <input type="checkbox" checked={bulk.is_active} onChange={(e) => setBulk({ ...bulk, is_active: e.target.checked })} className="rounded" />
                    <span>Active immediately</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
                  <Button type="submit" className="btn-sunset" disabled={bulkMutation.isPending || !bulkCodes.length}>
                    {bulkMutation.isPending ? 'Creating…' : `Create ${bulkCodes.length} code${bulkCodes.length === 1 ? '' : 's'}`}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) { setEditingId(null); setForm(emptyForm); }
          }}>
            <DialogTrigger asChild>
              <Button className="btn-sunset">
                <Plus className="h-4 w-4 mr-2" /> Add Promo Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Promo Code' : 'Add Promo Code'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Code *</Label>
                    <Input
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. SPRING20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Discount Type</Label>
                    <Select value={form.discount_type} onValueChange={(v: 'percentage' | 'fixed') => setForm({ ...form, discount_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount (R)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Spring sale discount" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Discount Value *</Label>
                    <Input type="number" step="0.01" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} placeholder={form.discount_type === 'percentage' ? '20' : '50'} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Order (R)</Label>
                    <Input type="number" step="0.01" value={form.min_order_zar} onChange={(e) => setForm({ ...form, min_order_zar: e.target.value })} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Uses</Label>
                    <Input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="Unlimited" />
                    <p className="text-xs text-muted-foreground">Blank = unlimited</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Starts At</Label>
                    <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Expires At</Label>
                    <Input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
                  <span>Active</span>
                </label>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                  <Button type="submit" className="btn-sunset" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'Saving…' : editingId ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ------------------------------------------------ live dashboard */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Total codes</p>
          <p className="text-3xl font-bold mt-1">{codes?.length ?? '—'}</p>
          <p className="text-xs text-muted-foreground mt-1">{activeCodes} active · {limitedCodes} usage-capped</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Redemptions today</p>
          <p className="text-3xl font-bold mt-1">{analytics?.today ?? '—'}</p>
          <p className="text-xs text-muted-foreground mt-1">Orders placed today using a code</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
          <p className="text-sm text-muted-foreground">All-time redemptions</p>
          <p className="text-3xl font-bold mt-1">{analytics?.totals.redemptions ?? '—'}</p>
          <p className="text-xs text-muted-foreground mt-1">{zar(analytics?.totals.discount_given)} discounted</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Revenue with a code</p>
          <p className="text-3xl font-bold mt-1">{zar(analytics?.totals.revenue)}</p>
          <p className="text-xs text-muted-foreground mt-1">Order totals that used a promo code</p>
        </motion.div>
      </div>

      {/* ------------------------------------------- spotlight + trend */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="font-display font-semibold text-lg">Code spotlight</h2>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={spotlightCode}
                onChange={(e) => setSpotlightCode(e.target.value.toUpperCase())}
                className="h-9 w-56 font-mono"
                placeholder="CODE TO TRACK"
              />
              <Button variant="ghost" size="icon" onClick={copySpotlight} title="Copy code">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {spotlight.row ? (
            <>
              <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Redemptions</p>
                  <p className="text-3xl font-bold">{spotlight.redemptions}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Remaining uses</p>
                  <p className="text-3xl font-bold">
                    {spotlightRemaining === null ? 'Unlimited' : spotlightRemaining}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Discount given</p>
                  <p className="text-3xl font-bold">{zar(spotlight.discountGiven)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-3xl font-bold">{zar(spotlight.revenue)}</p>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>
                    {Number(spotlight.row.max_uses) > 0
                      ? `${spotlight.redemptions} of ${spotlight.row.max_uses} uses`
                      : 'No usage cap set'}
                  </span>
                  <span>{spotlightPercent}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${spotlightPercent >= 90 ? 'bg-destructive' : 'bg-primary'}`}
                    style={{ width: `${Number(spotlight.row.max_uses) > 0 ? spotlightPercent : 0}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 text-xs text-muted-foreground">
                <span>
                  {spotlight.row.discount_type === 'percentage'
                    ? `${spotlight.row.discount_value}% off`
                    : `${zar(spotlight.row.discount_value)} off`}
                  {Number(spotlight.row.min_order_zar) > 0 && ` · min order ${zar(spotlight.row.min_order_zar)}`}
                </span>
                <span>
                  {spotlight.row.starts_at ? new Date(spotlight.row.starts_at).toLocaleDateString('en-ZA') : 'no start date'}
                  {' → '}
                  {spotlight.row.expires_at ? new Date(spotlight.row.expires_at).toLocaleDateString('en-ZA') : 'no end date'}
                </span>
                <span className={Boolean(spotlight.row.is_active) ? 'text-green-600' : 'text-destructive'}>
                  {Boolean(spotlight.row.is_active) ? 'Active' : 'Inactive'}
                </span>
                {spotlight.lastUsed && <span>Last used {new Date(spotlight.lastUsed).toLocaleString('en-ZA')}</span>}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-6">
              No code called <span className="font-mono">{spotlightCode || '—'}</span>. Type a code above to track it.
            </p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
          <h2 className="font-display font-semibold text-lg mb-1">Last 30 days</h2>
          <p className="text-xs text-muted-foreground mb-4">
            {peakDay.day ? `Best day: ${new Date(peakDay.day).toLocaleDateString('en-ZA')} (${peakDay.redemptions})` : 'No redemptions yet'}
          </p>
          <div className="flex items-end gap-[2px] h-32">
            {(analytics?.series || []).map((d) => {
              const max = Math.max(1, ...(analytics?.series || []).map((x) => x.redemptions));
              const h = Math.round((d.redemptions / max) * 100);
              return (
                <div
                  key={d.day}
                  className="flex-1 rounded-t bg-primary/70 hover:bg-primary transition-colors min-h-[2px]"
                  style={{ height: `${Math.max(2, h)}%` }}
                  title={`${new Date(d.day).toLocaleDateString('en-ZA')}: ${d.redemptions} redemption${d.redemptions === 1 ? '' : 's'}, ${zar(d.discount_given)}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </motion.div>
      </div>

      {/* ------------------------------------------------ code table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead className="min-w-[190px]">Uses</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes?.map((code) => {
                const cap = Number(code.max_uses) || 0;
                const used = Number(code.current_uses) || 0;
                const pct = usedPercent(code);
                const remaining = remainingUses(code);
                return (
                  <TableRow key={code.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" />
                        <span className="font-mono font-medium">{code.code}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {code.discount_type === 'percentage' ? `${code.discount_value}%` : zar(code.discount_value)}
                      {Number(code.min_order_zar) > 0 && (
                        <span className="text-xs text-muted-foreground ml-1">(min {zar(code.min_order_zar)})</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium tabular-nums">
                          {used}{cap ? `/${cap}` : ''}
                        </span>
                        {cap > 0 && (
                          <span className={`text-xs ${remaining === 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {remaining === 0 ? 'exhausted' : `${remaining} left`}
                          </span>
                        )}
                      </div>
                      {cap > 0 && (
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mt-1.5">
                          <div
                            className={`h-full rounded-full ${pct >= 90 ? 'bg-destructive' : 'bg-primary'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                      {cap === 0 && <span className="text-xs text-muted-foreground">Unlimited</span>}
                    </TableCell>
                    <TableCell className="text-xs">
                      {code.starts_at ? new Date(code.starts_at).toLocaleDateString('en-ZA') : '—'} →{' '}
                      {code.expires_at ? new Date(code.expires_at).toLocaleDateString('en-ZA') : '∞'}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs inline-flex items-center gap-1 ${code.is_active ? 'bg-green-500/20 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                        {code.is_active && <CheckCircle2 className="h-3 w-3" />}
                        {code.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(code)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Delete ${code.code}?`)) deleteMutation.mutate(code.id); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!codes?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No promo codes yet. Use Bulk Create to make a batch.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </motion.div>
    </div>
  );
}
