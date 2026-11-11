import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Search, Download, Send, Eye, Banknote, XCircle, RefreshCw, Mail, MessageCircle, FileText,
} from 'lucide-react';

/**
 * Admin invoicing.
 *
 * Invoices are issued from the customer record or created for a brand-new
 * customer with no account. Payment status is derived from the amounts recorded
 * against the invoice, so it can only change through "Record payment" — editing
 * an invoice never marks it paid.
 */

type Invoice = {
  id: string;
  invoice_number: string;
  contact_name: string;
  company_name: string;
  email: string;
  whatsapp: string;
  billing_address: string | null;
  invoice_date: string;
  due_date: string | null;
  subtotal_zar: string | number;
  discount_zar: string | number;
  vat_enabled: number | boolean;
  vat_rate: string | number;
  vat_zar: string | number;
  total_zar: string | number;
  amount_paid_zar: string | number;
  payment_status: string;
  status: string;
  payment_terms: string | null;
  payment_instructions: string | null;
  payment_reference: string | null;
  notes: string | null;
};

type InvoiceItem = {
  id: string;
  product_name: string;
  description: string | null;
  product_sku: string | null;
  quantity: string | number;
  unit_price_zar: string | number;
  discount_zar: string | number;
  total_price_zar: string | number;
};

type InvoiceEvent = {
  id: string;
  event_type: string;
  channel: string;
  recipient: string;
  status: string;
  detail: string;
  created_at: string;
};

const zar = (value: string | number | undefined) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(Number(value || 0));

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'unpaid', label: 'Unpaid' },
  { key: 'partially_paid', label: 'Part paid' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
];

function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    partially_paid: 'bg-amber-100 text-amber-900 border-amber-200',
    unpaid: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return (
    <Badge variant="outline" className={map[status] || map.unpaid}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [detail, setDetail] = useState<{ invoice: Invoice; items: InvoiceItem[]; events: InvoiceEvent[] } | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [payTarget, setPayTarget] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payReference, setPayReference] = useState('');
  const [payInFull, setPayInFull] = useState(false);

  const [cancelTarget, setCancelTarget] = useState<Invoice | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set('paymentStatus', filter);
      if (search.trim()) params.set('search', search.trim());
      const response = await fetch(`/api/admin/invoices?${params.toString()}`, { credentials: 'include' });
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      const data = await response.json();
      setInvoices(data.invoices || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load invoices');
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const sum = (pick: (i: Invoice) => number) => invoices.reduce((acc, i) => acc + pick(i), 0);
    const outstanding = invoices
      .filter((i) => i.status !== 'cancelled')
      .reduce((acc, i) => acc + Math.max(0, Number(i.total_zar) - Number(i.amount_paid_zar)), 0);
    return { count: invoices.length, invoiced: sum((i) => Number(i.total_zar)), collected: sum((i) => Number(i.amount_paid_zar)), outstanding };
  }, [invoices]);

  async function openDetail(invoice: Invoice) {
    setBusyId(invoice.id);
    try {
      const response = await fetch(`/api/admin/invoices/${invoice.id}`, { credentials: 'include' });
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      setDetail(await response.json());
      setDetailOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load the invoice');
    } finally {
      setBusyId(null);
    }
  }

  function downloadPdf(invoice: Invoice) {
    window.open(`/api/admin/invoices/${invoice.id}/pdf`, '_blank', 'noopener');
  }

  async function sendDocument(invoice: Invoice, channels: string[]) {
    setBusyId(invoice.id);
    try {
      const response = await fetch(`/api/admin/invoices/${invoice.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ channels }),
      });
      const data = await response.json();
      const results: Array<{ channel: string; ok: boolean; detail: string }> = data.results || [];
      for (const result of results) {
        if (result.ok) toast.success(`${result.channel === 'email' ? 'Email' : 'WhatsApp'}: ${result.detail}`);
        else toast.error(`${result.channel === 'email' ? 'Email' : 'WhatsApp'} could not send: ${result.detail}`);
      }
      if (!results.length) toast.error(data.error || 'No delivery channel was attempted');
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delivery failed');
    } finally {
      setBusyId(null);
    }
  }

  async function recordPayment() {
    if (!payTarget) return;
    const amount = Number(payAmount);
    if (!payInFull && (!Number.isFinite(amount) || amount <= 0)) {
      toast.error('Enter a payment amount greater than zero');
      return;
    }
    setBusyId(payTarget.id);
    try {
      const response = await fetch(`/api/admin/invoices/${payTarget.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payInFull ? { markPaidInFull: true, reference: payReference } : { amount, reference: payReference }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not record the payment');
      toast.success(`Recorded. Status is now ${String(data.paymentStatus).replace(/_/g, ' ')}; balance ${zar(data.balance)}`);
      setPayTarget(null);
      setPayAmount('');
      setPayReference('');
      setPayInFull(false);
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not record the payment');
    } finally {
      setBusyId(null);
    }
  }

  async function cancelInvoice() {
    if (!cancelTarget) return;
    setBusyId(cancelTarget.id);
    try {
      const response = await fetch(`/api/admin/invoices/${cancelTarget.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not cancel the invoice');
      toast.success(`${data.invoiceNumber} cancelled`);
      setCancelTarget(null);
      setCancelReason('');
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not cancel the invoice');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Issue, deliver and reconcile customer invoices. Payment status changes only through a recorded payment.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Invoices shown</CardTitle></CardHeader><CardContent><div className="text-2xl font-semibold">{totals.count}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Invoiced</CardTitle></CardHeader><CardContent><div className="text-2xl font-semibold">{zar(totals.invoiced)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Collected</CardTitle></CardHeader><CardContent><div className="text-2xl font-semibold text-emerald-700">{zar(totals.collected)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle></CardHeader><CardContent><div className="text-2xl font-semibold text-amber-700">{zar(totals.outstanding)}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((option) => (
              <Button
                key={option.key || 'all'}
                size="sm"
                variant={filter === option.key ? 'default' : 'outline'}
                onClick={() => setFilter(option.key)}
              >
                {option.label}
              </Button>
            ))}
            <div className="ml-auto flex w-full max-w-sm items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search number, customer, email, WhatsApp"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading invoices…</p>
          ) : invoices.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No invoices match this view. Invoices appear here once they are issued.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const outstanding = Math.max(0, Number(invoice.total_zar) - Number(invoice.amount_paid_zar));
                    const overdue =
                      invoice.due_date &&
                      outstanding > 0 &&
                      invoice.status !== 'cancelled' &&
                      new Date(invoice.due_date) < new Date();
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.invoice_number}
                          {invoice.status === 'cancelled' && (
                            <Badge variant="outline" className="ml-2 border-red-200 bg-red-50 text-red-700">cancelled</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{invoice.contact_name}</div>
                          <div className="text-xs text-muted-foreground">{invoice.company_name || invoice.email}</div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div>Issued {String(invoice.invoice_date).slice(0, 10)}</div>
                          <div className={overdue ? 'font-medium text-red-600' : ''}>
                            {invoice.due_date ? `Due ${String(invoice.due_date).slice(0, 10)}${overdue ? ' · overdue' : ''}` : 'No due date'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">{zar(invoice.total_zar)}</TableCell>
                        <TableCell className="text-right">
                          <div>{zar(invoice.amount_paid_zar)}</div>
                          {outstanding > 0 && <div className="text-xs text-amber-700">{zar(outstanding)} due</div>}
                        </TableCell>
                        <TableCell><PaymentStatusBadge status={invoice.payment_status} /></TableCell>
                        <TableCell>
                          <div className="flex flex-wrap justify-end gap-1">
                            <Button size="sm" variant="ghost" title="View" disabled={busyId === invoice.id} onClick={() => void openDetail(invoice)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" title="Download PDF" onClick={() => downloadPdf(invoice)}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" title="Email the invoice" disabled={busyId === invoice.id} onClick={() => void sendDocument(invoice, ['email'])}>
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" title="Send on WhatsApp" disabled={busyId === invoice.id} onClick={() => void sendDocument(invoice, ['whatsapp'])}>
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Record payment"
                              disabled={busyId === invoice.id || invoice.status === 'cancelled'}
                              onClick={() => { setPayTarget(invoice); setPayAmount(String(outstanding || '')); setPayInFull(false); }}
                            >
                              <Banknote className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Cancel invoice"
                              disabled={busyId === invoice.id || invoice.status === 'cancelled'}
                              onClick={() => setCancelTarget(invoice)}
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice detail */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{detail?.invoice.invoice_number}</DialogTitle>
            <DialogDescription>
              {detail?.invoice.contact_name}
              {detail?.invoice.company_name ? ` · ${detail.invoice.company_name}` : ''}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div><div className="text-muted-foreground">Total</div><div className="font-semibold">{zar(detail.invoice.total_zar)}</div></div>
                <div><div className="text-muted-foreground">Paid</div><div className="font-semibold">{zar(detail.invoice.amount_paid_zar)}</div></div>
                <div><div className="text-muted-foreground">VAT</div><div className="font-semibold">{Number(detail.invoice.vat_enabled) ? `${detail.invoice.vat_rate}% · ${zar(detail.invoice.vat_zar)}` : 'Not applied'}</div></div>
                <div><div className="text-muted-foreground">Status</div><PaymentStatusBadge status={detail.invoice.payment_status} /></div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow><TableHead>Item</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Unit</TableHead><TableHead className="text-right">Line total</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {detail.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.product_name}</div>
                        {item.product_sku && <div className="text-xs text-muted-foreground">SKU {item.product_sku}</div>}
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{zar(item.unit_price_zar)}</TableCell>
                      <TableCell className="text-right">{zar(item.total_price_zar)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div>
                <h4 className="mb-2 text-sm font-semibold">Delivery and payment history</h4>
                {detail.events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {detail.events.map((event) => (
                      <li key={event.id} className="flex gap-2">
                        <span className="text-muted-foreground">{String(event.created_at).slice(0, 16).replace('T', ' ')}</span>
                        <span className={event.status === 'failed' ? 'text-red-600' : ''}>
                          {event.event_type}{event.channel ? ` (${event.channel})` : ''} — {event.detail}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => downloadPdf(detail.invoice)}>
                  <Download className="mr-2 h-4 w-4" /> Download PDF
                </Button>
                <Button variant="outline" onClick={() => void sendDocument(detail.invoice, ['email'])}>
                  <Mail className="mr-2 h-4 w-4" /> Email
                </Button>
                <Button onClick={() => void sendDocument(detail.invoice, ['whatsapp'])}>
                  <Send className="mr-2 h-4 w-4" /> WhatsApp
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Record payment */}
      <Dialog open={Boolean(payTarget)} onOpenChange={(open) => !open && setPayTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record a payment</DialogTitle>
            <DialogDescription>{payTarget?.invoice_number} · {payTarget?.contact_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-medium">{zar(payTarget?.total_zar)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Already paid</span><span className="font-medium">{zar(payTarget?.amount_paid_zar)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Balance</span><span className="font-semibold">{zar(Math.max(0, Number(payTarget?.total_zar || 0) - Number(payTarget?.amount_paid_zar || 0)))}</span></div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={payInFull} onChange={(event) => setPayInFull(event.target.checked)} />
              Settle the full outstanding balance
            </label>
            {!payInFull && (
              <div className="space-y-2">
                <Label htmlFor="pay-amount">Amount received (ZAR)</Label>
                <Input id="pay-amount" type="number" min="0" step="0.01" value={payAmount} onChange={(event) => setPayAmount(event.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="pay-reference">Reference (EFT or gateway reference)</Label>
              <Input id="pay-reference" value={payReference} onChange={(event) => setPayReference(event.target.value)} placeholder="e.g. EFT-88213" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayTarget(null)}>Cancel</Button>
            <Button onClick={() => void recordPayment()} disabled={busyId === payTarget?.id}>Record payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel invoice */}
      <Dialog open={Boolean(cancelTarget)} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel this invoice</DialogTitle>
            <DialogDescription>
              {cancelTarget?.invoice_number} stays on record with its full history; it is never deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Reason</Label>
            <Textarea id="cancel-reason" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="Why is this invoice being cancelled?" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Keep invoice</Button>
            <Button variant="destructive" onClick={() => void cancelInvoice()} disabled={busyId === cancelTarget?.id}>Cancel invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
