import { useState, useEffect } from 'react';
import { appClient } from '@/integrations/manus/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Plus, Search, Trash2, FileText, Download, Send, Eye } from 'lucide-react';
import { generateQuotationPDF } from '@/lib/quotation-pdf';

interface QuotationItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price_zar: number;
  total_price_zar: number;
}

interface ProductSearchResult {
  id: string;
  name: string;
  sku: string;
  price_zar: number;
  stock_quantity: number;
  primary_image_url: string | null;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(v);

export default function AdminQuotations() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [customerName, setCustomerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [vatEnabled, setVatEnabled] = useState(true);
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    setLoading(true);
    const { data, error } = await appClient
      .from('quotations')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setQuotations(data || []);
    setLoading(false);
  };

  const searchProducts = async (query: string) => {
    setProductSearch(query);
    if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await appClient
      .from('products')
      .select('id, name, sku, price_zar, stock_quantity, primary_image_url')
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(10);
    setSearchResults(data || []);
    setSearching(false);
  };

  const addProduct = (product: ProductSearchResult) => {
    const existing = items.find(i => i.product_id === product.id);
    if (existing) {
      setItems(items.map(i =>
        i.product_id === product.id
          ? { ...i, quantity: i.quantity + 1, total_price_zar: (i.quantity + 1) * i.unit_price_zar }
          : i
      ));
    } else {
      setItems([...items, {
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        quantity: 1,
        unit_price_zar: product.price_zar,
        total_price_zar: product.price_zar,
      }]);
    }
    setProductSearch('');
    setSearchResults([]);
  };

  const updateItemQuantity = (idx: number, qty: number) => {
    if (qty < 1) return;
    setItems(items.map((item, i) =>
      i === idx ? { ...item, quantity: qty, total_price_zar: qty * item.unit_price_zar } : item
    ));
  };

  const updateItemPrice = (idx: number, price: number) => {
    setItems(items.map((item, i) =>
      i === idx ? { ...item, unit_price_zar: price, total_price_zar: item.quantity * price } : item
    ));
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const subtotal = items.reduce((sum, i) => sum + i.total_price_zar, 0);
  const vat = vatEnabled ? subtotal * 0.15 : 0;
  const total = subtotal + vat;

  const handleSave = async () => {
    if (!customerName.trim()) { toast.error('Customer name is required'); return; }
    if (items.length === 0) { toast.error('Add at least one product'); return; }

    setSaving(true);
    try {
      const { data: quotation, error } = await appClient
        .from('quotations')
        .insert({
          customer_name: customerName,
          company_name: companyName || null,
          phone: phone || null,
          email: email || null,
          billing_address: billingAddress || null,
          subtotal_zar: subtotal,
          vat_zar: vat,
          total_zar: total,
          vat_enabled: vatEnabled,
          notes: notes || null,
          status: 'sent',
        })
        .select()
        .single();

      if (error) throw error;

      const { error: itemsError } = await appClient
        .from('quotation_items')
        .insert(items.map(item => ({
          quotation_id: quotation.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_sku: item.product_sku,
          quantity: item.quantity,
          unit_price_zar: item.unit_price_zar,
          total_price_zar: item.total_price_zar,
        })));

      if (itemsError) throw itemsError;

      // Generate and download PDF
      generateQuotationPDF(quotation, items);

      toast.success('Quotation created and PDF downloaded!');
      resetForm();
      setShowCreate(false);
      fetchQuotations();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create quotation');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setCustomerName(''); setCompanyName(''); setPhone(''); setEmail('');
    setBillingAddress(''); setNotes(''); setVatEnabled(true); setItems([]);
  };

  const handleDownloadPDF = async (quotation: any) => {
    const { data: qItems } = await appClient
      .from('quotation_items')
      .select('*')
      .eq('quotation_id', quotation.id);
    generateQuotationPDF(quotation, qItems || []);
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    sent: 'bg-blue-100 text-blue-800',
    accepted: 'bg-green-100 text-green-800',
    declined: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Quotations</h1>
          <p className="text-muted-foreground">Create and manage customer quotations</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Quotation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                New Quotation
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Customer Details */}
              <Card>
                <CardHeader><CardTitle className="text-lg">Customer Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Customer Name *</Label>
                      <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company (Pty) Ltd" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+27 83 123 4567" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="customer@example.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Billing Address</Label>
                    <Textarea value={billingAddress} onChange={e => setBillingAddress(e.target.value)} placeholder="Full billing address" rows={2} />
                  </div>
                </CardContent>
              </Card>

              {/* Product Selection */}
              <Card>
                <CardHeader><CardTitle className="text-lg">Products</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={productSearch}
                      onChange={e => searchProducts(e.target.value)}
                      placeholder="Search products by name or SKU..."
                      className="pl-10"
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-card border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.map(p => (
                          <button
                            key={p.id}
                            onClick={() => addProduct(p)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                          >
                            <img src={p.primary_image_url || '/placeholder.svg'} alt="" className="w-10 h-10 rounded object-cover" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{p.name}</p>
                              <p className="text-xs text-muted-foreground">SKU: {p.sku} • Stock: {p.stock_quantity}</p>
                            </div>
                            <span className="font-semibold text-sm">{formatCurrency(p.price_zar)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {items.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="w-24">Qty</TableHead>
                          <TableHead className="w-32">Unit Price</TableHead>
                          <TableHead className="w-28 text-right">Total</TableHead>
                          <TableHead className="w-10" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.product_name}</p>
                                <p className="text-xs text-muted-foreground">{item.product_sku}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={e => updateItemQuantity(idx, parseInt(e.target.value) || 1)}
                                className="w-20 h-8"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                value={item.unit_price_zar}
                                onChange={e => updateItemPrice(idx, parseFloat(e.target.value) || 0)}
                                className="w-28 h-8"
                              />
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.total_price_zar)}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Totals */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Include VAT (15%)</Label>
                    <Switch checked={vatEnabled} onCheckedChange={setVatEnabled} />
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {vatEnabled && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">VAT (15%)</span>
                      <span>{formatCurrency(vat)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes..." rows={2} />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => { resetForm(); setShowCreate(false); }}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Creating...' : 'Create & Download PDF'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quotations List */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : quotations.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No quotations yet</TableCell></TableRow>
              ) : (
                quotations.map(q => (
                  <TableRow key={q.id}>
                    <TableCell className="font-mono text-sm">{q.quotation_number}</TableCell>
                    <TableCell className="font-medium">{q.customer_name}</TableCell>
                    <TableCell>{q.company_name || '-'}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(q.total_zar)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[q.status] || ''}>{q.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(q.created_at).toLocaleDateString('en-ZA')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDownloadPDF(q)} title="Download PDF">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
