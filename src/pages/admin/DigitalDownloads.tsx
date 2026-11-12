import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, Ban, Send, FileText, AlertTriangle } from 'lucide-react';

/**
 * Every download link issued to a buyer.
 *
 * Support needs two things from this page: see whether a customer actually
 * downloaded what they paid for, and reissue a link that expired, hit its limit
 * or was withdrawn. A reissue always revokes the previous links for that order
 * first, so an old shared link cannot keep working.
 */
interface DownloadRow {
  id: number;
  order_number: string | null;
  product_name: string | null;
  email: string;
  download_count: number;
  max_downloads: number;
  expires_at: string | null;
  revoked: number;
  last_downloaded_at: string | null;
  created_at: string;
}

async function adminFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, { credentials: 'include', ...init });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error?.message || `Request failed (${res.status})`);
  return json?.data;
}

export default function DigitalDownloads() {
  const { toast } = useToast();
  const [rows, setRows] = useState<DownloadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [orderRef, setOrderRef] = useState('');
  const [reissuing, setReissuing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'revoked' | 'exhausted'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch('/api/admin/digital/downloads');
      setRows(data?.downloads || []);
    } catch (err) {
      toast({ title: 'Could not load downloads', description: err instanceof Error ? err.message : '', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  const revoke = async (id: number) => {
    setBusyId(id);
    try {
      await adminFetch('/api/admin/digital/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      toast({ title: 'Link withdrawn', description: 'That download link no longer works.' });
      await load();
    } catch (err) {
      toast({ title: 'Could not withdraw', description: err instanceof Error ? err.message : '', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const reissue = async () => {
    if (!orderRef.trim()) {
      toast({ title: 'Enter an order number', description: 'Use the order number or id from the order.', variant: 'destructive' });
      return;
    }
    setReissuing(true);
    try {
      const data = await adminFetch('/api/admin/digital/reissue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderRef.trim() }),
      });
      toast({
        title: 'Links reissued',
        description: data?.reissued
          ? `${data.reissued} fresh link(s) created and emailed.`
          : 'That order has no digital products.',
      });
      setOrderRef('');
      await load();
    } catch (err) {
      toast({ title: 'Could not reissue', description: err instanceof Error ? err.message : '', variant: 'destructive' });
    } finally {
      setReissuing(false);
    }
  };

  const isExhausted = (r: DownloadRow) => r.download_count >= r.max_downloads;
  const isExpired = (r: DownloadRow) => Boolean(r.expires_at) && new Date(r.expires_at as string).getTime() < Date.now();

  const visible = rows.filter((r) => {
    if (filter === 'active') return !r.revoked && !isExhausted(r) && !isExpired(r);
    if (filter === 'revoked') return Boolean(r.revoked);
    if (filter === 'exhausted') return isExhausted(r) || isExpired(r);
    return true;
  });

  const total = rows.length;
  const served = rows.reduce((sum, r) => sum + (r.download_count || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Digital Downloads
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every download link issued to a buyer. Links are personal to an order and limited.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Links issued</p>
          <p className="text-2xl font-semibold mt-1">{total}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Files downloaded</p>
          <p className="text-2xl font-semibold mt-1">{served}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Needing attention</p>
          <p className="text-2xl font-semibold mt-1">{rows.filter((r) => isExhausted(r) || isExpired(r)).length}</p>
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-semibold text-sm">Reissue a customer's links</h2>
        <p className="text-xs text-muted-foreground">
          Use this when a buyer lost their email, or a link expired or ran out of downloads.
          The old links are withdrawn and fresh ones are emailed.
        </p>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Order number, e.g. ORD-20261112-A1B2C3"
            value={orderRef}
            onChange={(e) => setOrderRef(e.target.value)}
            className="max-w-md"
          />
          <Button onClick={() => void reissue()} disabled={reissuing}>
            {reissuing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Reissue &amp; email
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'active', 'exhausted', 'revoked'] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f === 'active' ? 'Active' : f === 'exhausted' ? 'Used up / expired' : 'Withdrawn'}
          </Button>
        ))}
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left p-3 font-medium">Order</th>
              <th className="text-left p-3 font-medium">Product</th>
              <th className="text-left p-3 font-medium">Buyer</th>
              <th className="text-left p-3 font-medium">Downloads</th>
              <th className="text-left p-3 font-medium">Last used</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin inline" />
              </td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">
                No download links yet. They are created automatically when a customer pays for a digital product.
              </td></tr>
            ) : visible.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-mono text-xs">{r.order_number || '—'}</td>
                <td className="p-3">{r.product_name || '—'}</td>
                <td className="p-3 text-xs">{r.email}</td>
                <td className="p-3">{r.download_count} / {r.max_downloads}</td>
                <td className="p-3 text-xs text-muted-foreground">
                  {r.last_downloaded_at ? new Date(r.last_downloaded_at).toLocaleDateString() : 'Never'}
                </td>
                <td className="p-3">
                  {r.revoked ? (
                    <span className="text-xs text-destructive">Withdrawn</span>
                  ) : isExpired(r) ? (
                    <span className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Expired</span>
                  ) : isExhausted(r) ? (
                    <span className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Used up</span>
                  ) : (
                    <span className="text-xs text-emerald-600">Active</span>
                  )}
                </td>
                <td className="p-3">
                  {!r.revoked && (
                    <Button size="sm" variant="outline" onClick={() => void revoke(r.id)} disabled={busyId === r.id}>
                      {busyId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3" />}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
