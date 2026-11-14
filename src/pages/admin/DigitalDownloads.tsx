import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, RefreshCw, Ban, Send, FileText, AlertTriangle, TrendingUp,
  Wallet, KeyRound, Download, Repeat,
} from 'lucide-react';

/**
 * Digital downloads: the sales and delivery dashboard for ebooks.
 *
 * Three questions, in the order the business asks them: which titles sell, how
 * many links are out in the world and how much downloading is left on them, and
 * which titles keep needing links reissued (usually a delivery email problem,
 * not a popular book).
 */
interface Summary {
  tokensIssued: number;
  tokensActive: number;
  tokensRevoked: number;
  downloadsUsed: number;
  downloadsAllowed: number;
  downloadsRemaining: number;
  reissues: number;
  neverDownloaded: number;
  unitsSold: number;
  revenue: number;
}

interface EbookRow {
  product_id: string;
  product_name: string | null;
  price_zar: number | null;
  is_active: number | null;
  units_sold: number;
  revenue: number;
  tokens_issued: number;
  tokens_active: number;
  downloads_used: number;
  downloads_allowed: number;
  reissues: number;
  never_downloaded: number;
  last_issued_at: string | null;
}

interface AttentionRow {
  id: number;
  order_number: string | null;
  product_id: string;
  product_name: string | null;
  email: string;
  download_count: number;
  max_downloads: number;
  remaining: number;
  expires_at: string | null;
  last_downloaded_at: string | null;
  reissue_count: number;
}

interface ReissueRow {
  product_id: string;
  product_name: string | null;
  reissues: number;
  tokens_issued: number;
}

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

interface DashboardData {
  summary: Summary;
  perEbook: EbookRow[];
  attention: AttentionRow[];
  topReissues: ReissueRow[];
}

async function adminFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, { credentials: 'include', ...init });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error?.message || `Request failed (${res.status})`);
  return json?.data;
}

const zar = (v: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 2 }).format(Number(v) || 0);

const num = (v: number | null | undefined) => Number(v) || 0;

function Stat({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className="text-primary">{icon}</span>
      </div>
      <p className="text-2xl font-semibold mt-2">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function DigitalDownloads() {
  const { toast } = useToast();
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [links, setLinks] = useState<DownloadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [orderRef, setOrderRef] = useState('');
  const [reissuing, setReissuing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, l] = await Promise.all([
        adminFetch('/api/admin/digital/dashboard'),
        adminFetch('/api/admin/digital/downloads'),
      ]);
      setDash(d);
      setLinks(l?.downloads || []);
    } catch (err) {
      toast({
        title: 'Could not load the dashboard',
        description: err instanceof Error ? err.message : '',
        variant: 'destructive',
      });
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
      toast({ title: 'Enter an order number', description: 'Use the order number from the order.', variant: 'destructive' });
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

  const s = dash?.summary;
  const ebooks = dash?.perEbook || [];
  const attention = dash?.attention || [];
  const reissues = dash?.topReissues || [];
  const sold = ebooks.filter((e) => num(e.units_sold) > 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Digital Downloads
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ebook sales, the links buyers were issued, and how much downloading is left on them.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Ebook revenue" value={zar(s?.revenue || 0)} sub={`${num(s?.unitsSold)} copies sold`} icon={<Wallet className="h-4 w-4" />} />
        <Stat label="Links issued" value={String(num(s?.tokensIssued))} sub={`${num(s?.tokensActive)} still active`} icon={<KeyRound className="h-4 w-4" />} />
        <Stat label="Downloads remaining" value={String(num(s?.downloadsRemaining))} sub={`${num(s?.downloadsUsed)} of ${num(s?.downloadsAllowed)} used`} icon={<Download className="h-4 w-4" />} />
        <Stat label="Reissues" value={String(num(s?.reissues))} sub={`${num(s?.neverDownloaded)} never downloaded`} icon={<Repeat className="h-4 w-4" />} />
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <Send className="h-4 w-4 text-primary" /> Reissue a customer's links
        </h2>
        <p className="text-xs text-muted-foreground">
          For a buyer who lost their email, or whose link expired or ran out of downloads. The old links are
          withdrawn first, so a shared link stops working, then fresh links are emailed.
        </p>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Order number, e.g. ORD-20261114-A48987"
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

      <div className="rounded-lg border overflow-x-auto">
        <div className="p-4 border-b flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Sales per ebook</h2>
          <span className="text-xs text-muted-foreground">
            — {sold.length} title(s) with sales
          </span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left p-3 font-medium">Ebook</th>
              <th className="text-right p-3 font-medium">Price</th>
              <th className="text-right p-3 font-medium">Sold</th>
              <th className="text-right p-3 font-medium">Revenue</th>
              <th className="text-right p-3 font-medium">Links</th>
              <th className="text-right p-3 font-medium">Downloads left</th>
              <th className="text-right p-3 font-medium">Reissues</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></td></tr>
            ) : ebooks.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">
                No digital products yet. Tick "This product is a digital download" on a product to start selling ebooks.
              </td></tr>
            ) : ebooks.map((e) => {
              const left = Math.max(0, num(e.downloads_allowed) - num(e.downloads_used));
              return (
                <tr key={e.product_id} className="border-t">
                  <td className="p-3">
                    <span className="font-medium">{e.product_name || 'Untitled'}</span>
                    {e.is_active === 0 && <span className="ml-2 text-xs text-muted-foreground">(not active)</span>}
                  </td>
                  <td className="p-3 text-right">{e.price_zar != null ? zar(Number(e.price_zar)) : '—'}</td>
                  <td className="p-3 text-right font-medium">{num(e.units_sold)}</td>
                  <td className="p-3 text-right">{zar(num(e.revenue))}</td>
                  <td className="p-3 text-right">
                    {num(e.tokens_issued)}
                    <span className="text-xs text-muted-foreground"> ({num(e.tokens_active)} live)</span>
                  </td>
                  <td className="p-3 text-right">{left}</td>
                  <td className="p-3 text-right">
                    {num(e.reissues) > 0 ? (
                      <span className="text-amber-600 font-medium">{num(e.reissues)}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border overflow-x-auto">
          <div className="p-4 border-b flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="font-semibold text-sm">Links needing attention</h2>
            <span className="text-xs text-muted-foreground">— used up or expired</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left p-3 font-medium">Buyer</th>
                <th className="text-left p-3 font-medium">Ebook</th>
                <th className="text-right p-3 font-medium">Left</th>
                <th className="text-left p-3 font-medium">Order</th>
              </tr>
            </thead>
            <tbody>
              {attention.length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">
                  Nothing needs attention. Every live link still has downloads left.
                </td></tr>
              ) : attention.map((a) => {
                const expired = a.expires_at && new Date(a.expires_at).getTime() < Date.now();
                return (
                  <tr key={a.id} className="border-t">
                    <td className="p-3 text-xs">{a.email}</td>
                    <td className="p-3">{a.product_name || '—'}</td>
                    <td className="p-3 text-right">
                      {expired
                        ? <span className="text-xs text-destructive">Expired</span>
                        : <span className="text-xs text-amber-600">{num(a.remaining)} left</span>}
                    </td>
                    <td className="p-3 font-mono text-xs">{a.order_number || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border overflow-x-auto">
          <div className="p-4 border-b flex items-center gap-2">
            <Repeat className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">Top reissue requests</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left p-3 font-medium">Ebook</th>
                <th className="text-right p-3 font-medium">Reissues</th>
                <th className="text-right p-3 font-medium">Links issued</th>
              </tr>
            </thead>
            <tbody>
              {reissues.length === 0 ? (
                <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">
                  No reissues yet. That means buyers are getting their links first time.
                </td></tr>
              ) : reissues.map((r) => (
                <tr key={r.product_id} className="border-t">
                  <td className="p-3">{r.product_name || '—'}</td>
                  <td className="p-3 text-right font-medium text-amber-600">{num(r.reissues)}</td>
                  <td className="p-3 text-right">{num(r.tokens_issued)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <div className="p-4 border-b flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Every link issued</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left p-3 font-medium">Order</th>
              <th className="text-left p-3 font-medium">Ebook</th>
              <th className="text-left p-3 font-medium">Buyer</th>
              <th className="text-left p-3 font-medium">Downloads</th>
              <th className="text-left p-3 font-medium">Last used</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {links.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">
                No links yet. They are created automatically when a customer pays for an ebook.
              </td></tr>
            ) : links.map((r) => {
              const used = num(r.download_count) >= num(r.max_downloads);
              const expired = r.expires_at && new Date(r.expires_at).getTime() < Date.now();
              return (
                <tr key={r.id} className="border-t">
                  <td className="p-3 font-mono text-xs">{r.order_number || '—'}</td>
                  <td className="p-3">{r.product_name || '—'}</td>
                  <td className="p-3 text-xs">{r.email}</td>
                  <td className="p-3">{num(r.download_count)} / {num(r.max_downloads)}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {r.last_downloaded_at ? new Date(r.last_downloaded_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="p-3">
                    {r.revoked ? <span className="text-xs text-destructive">Withdrawn</span>
                      : expired ? <span className="text-xs text-amber-600">Expired</span>
                      : used ? <span className="text-xs text-amber-600">Used up</span>
                      : <span className="text-xs text-emerald-600">Active</span>}
                  </td>
                  <td className="p-3">
                    {!r.revoked && (
                      <Button size="sm" variant="outline" onClick={() => void revoke(r.id)} disabled={busyId === r.id}>
                        {busyId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3" />}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
