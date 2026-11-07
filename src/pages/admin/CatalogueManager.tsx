import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/integrations/manus/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  BookOpen, 
  Download, 
  Share2, 
  Loader2, 
  Plus, 
  Image as ImageIcon,
  FileText,
  Mail,
  CheckSquare,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCategories } from '@/hooks/use-products';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CatalogueSettings {
  name: string;
  description: string;
  includeDescription: boolean;
  includePrices: boolean;
  includeStock: boolean;
  includeSKU: boolean;
  categoryFilter: string;
  layout: 'grid' | 'list';
  productsPerPage: number;
}

const defaultSettings: CatalogueSettings = {
  name: 'DFSA Dragon Fruit Catalogue',
  description: 'Premium Dragon Fruit Cultivars for African Farmers - Since 2008',
  includeDescription: true,
  includePrices: true,
  includeStock: false,
  includeSKU: true,
  categoryFilter: 'all',
  layout: 'grid',
  productsPerPage: 12,
};

export default function CatalogueManager() {
  const [settings, setSettings] = useState<CatalogueSettings>(defaultSettings);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('African Vibe Product Catalogue');
  const [emailMessage, setEmailMessage] = useState('Please find attached our latest product catalogue.');

  const { data: categories } = useCategories();

  const { data: products, isLoading } = useQuery({
    queryKey: ['catalogue-products', settings.categoryFilter],
    queryFn: async () => {
      let query = appClient
        .from('products')
        .select('*, categories(name)')
        .eq('is_active', true)
        .order('name');

      if (settings.categoryFilter !== 'all') {
        query = query.eq('category_id', settings.categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(value);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    if (products) {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const clearSelection = () => {
    setSelectedProducts([]);
  };

  const getSelectedProducts = () => {
    if (!products) return [];
    if (selectedProducts.length === 0) return products;
    return products.filter(p => selectedProducts.includes(p.id));
  };

  const generatePDF = async (): Promise<Blob> => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const catalogueProducts = getSelectedProducts();

    // Colors - Dragon Fruit Theme
    const primaryColor: [number, number, number] = [220, 56, 108]; // Dragon pink
    const accentColor: [number, number, number] = [69, 162, 71]; // Dragon green
    const textColor: [number, number, number] = [51, 51, 51];

    // Cover Page
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Green accent bar
    doc.setFillColor(...accentColor);
    doc.rect(0, pageHeight / 2 - 30, pageWidth, 60, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(36);
    doc.setFont('helvetica', 'bold');
    doc.text('DFSA', pageWidth / 2, pageHeight / 2 - 10, { align: 'center' });

    doc.setFontSize(14);
    doc.text('Wonderful Dragon Fruit South Africa', pageWidth / 2, pageHeight / 2 + 5, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.name, pageWidth / 2, pageHeight / 2 + 18, { align: 'center' });

    doc.setFontSize(10);
    doc.text(settings.description, pageWidth / 2, pageHeight / 2 + 28, { align: 'center' });

    doc.setFontSize(12);
    doc.text(settings.description, pageWidth / 2, pageHeight / 2 + 25, { align: 'center' });

    // Date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-ZA')}`, pageWidth / 2, pageHeight - 30, { align: 'center' });
    doc.text(`${catalogueProducts.length} Products`, pageWidth / 2, pageHeight - 22, { align: 'center' });

    // Product Pages
    doc.addPage();

    // Table of contents header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Product Catalogue', 20, 16);

    // Reset text color
    doc.setTextColor(...textColor);

    // Build table data
    const headers = ['Product'];
    if (settings.includeSKU) headers.push('SKU');
    if (settings.includeDescription) headers.push('Description');
    if (settings.includePrices) headers.push('Price');
    if (settings.includeStock) headers.push('Stock');

    const tableData = catalogueProducts.map(product => {
      const row: string[] = [product.name];
      if (settings.includeSKU) row.push(product.sku);
      if (settings.includeDescription) row.push(product.short_description?.substring(0, 100) || '-');
      if (settings.includePrices) {
        const priceText = product.compare_at_price_zar 
          ? `${formatCurrency(product.price_zar)} (was ${formatCurrency(product.compare_at_price_zar)})`
          : formatCurrency(product.price_zar);
        row.push(priceText);
      }
      if (settings.includeStock) row.push(product.stock_quantity.toString());
      return row;
    });

    autoTable(doc, {
      startY: 35,
      head: [headers],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: textColor,
      },
      alternateRowStyles: {
        fillColor: [252, 250, 248],
      },
      columnStyles: settings.includeDescription ? {
        0: { cellWidth: 40 },
        2: { cellWidth: 60 },
      } : {},
      margin: { left: 15, right: 15 },
      didDrawPage: (data) => {
        // Header on each page
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Product Catalogue', 20, 16);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Page ${data.pageNumber}`, pageWidth - 20, 16, { align: 'right' });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(...accentColor);
        doc.text('DFSA - Wonderful Dragon Fruit South Africa', pageWidth / 2, pageHeight - 10, { align: 'center' });
      },
    });

    // Detailed product pages (optional for grid layout)
    if (settings.layout === 'grid') {
      for (let i = 0; i < catalogueProducts.length; i += 4) {
        doc.addPage();
        
        // Header
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Product Details', 20, 16);

        let yPos = 35;
        const productsOnPage = catalogueProducts.slice(i, i + 4);

        productsOnPage.forEach((product, idx) => {
          const xPos = idx % 2 === 0 ? 15 : pageWidth / 2 + 5;
          const boxWidth = pageWidth / 2 - 20;

          if (idx === 2) yPos = 140;

          // Product box
          doc.setDrawColor(...accentColor);
          doc.setLineWidth(0.5);
          doc.roundedRect(xPos, yPos, boxWidth, 95, 3, 3, 'S');

          // Product name
          doc.setTextColor(...primaryColor);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text(product.name.substring(0, 30), xPos + 5, yPos + 12);

          // SKU
          if (settings.includeSKU) {
            doc.setTextColor(...textColor);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(`SKU: ${product.sku}`, xPos + 5, yPos + 20);
          }

          // Description
          if (settings.includeDescription && product.short_description) {
            doc.setFontSize(8);
            const desc = product.short_description.substring(0, 120);
            const lines = doc.splitTextToSize(desc, boxWidth - 10);
            doc.text(lines, xPos + 5, yPos + 30);
          }

          // Price
          if (settings.includePrices) {
            doc.setTextColor(...primaryColor);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(formatCurrency(product.price_zar), xPos + 5, yPos + 80);

            if (product.compare_at_price_zar) {
              doc.setTextColor(150, 150, 150);
              doc.setFontSize(9);
              doc.setFont('helvetica', 'normal');
              doc.text(`Was: ${formatCurrency(product.compare_at_price_zar)}`, xPos + 5, yPos + 88);
            }
          }
        });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(...accentColor);
        doc.text('DFSA - Wonderful Dragon Fruit South Africa', pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
    }

    // Contact page
    doc.addPage();
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setFillColor(...accentColor);
    doc.rect(0, pageHeight / 2 - 50, pageWidth, 100, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Contact Us', pageWidth / 2, pageHeight / 2 - 30, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('orders@proagrisa.co.za', pageWidth / 2, pageHeight / 2, { align: 'center' });
    doc.text('+27 83 447 4639', pageWidth / 2, pageHeight / 2 + 12, { align: 'center' });
    doc.text('South Africa', pageWidth / 2, pageHeight / 2 + 24, { align: 'center' });

    doc.setFontSize(10);
    doc.text('www.africanvibe.co.za', pageWidth / 2, pageHeight / 2 + 40, { align: 'center' });

    return doc.output('blob');
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const blob = await generatePDF();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${settings.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Catalogue downloaded!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate catalogue');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailTo) {
      toast.error('Please enter an email address');
      return;
    }

    setIsGenerating(true);
    try {
      const blob = await generatePDF();
      const base64 = await blobToBase64(blob);

      const response = await fetch(
        `${"/api"}/api/functions/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${""}`,
          },
          body: JSON.stringify({
            to: emailTo,
            subject: emailSubject,
            html: `<p>${emailMessage}</p><p>Best regards,<br>African Vibe Team</p>`,
            attachments: [
              {
                filename: `${settings.name.replace(/\s+/g, '-').toLowerCase()}.pdf`,
                content: base64.split(',')[1],
                encoding: 'base64',
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      toast.success('Catalogue sent successfully!');
      setShowEmailDialog(false);
    } catch (error) {
      console.error('Email error:', error);
      toast.error('Failed to send catalogue');
    } finally {
      setIsGenerating(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            Catalogue Manager
          </h1>
          <p className="text-muted-foreground">
            Create and share product catalogues as PDF
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleDownloadPDF}
            disabled={isGenerating || !products?.length}
            className="btn-sunset"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download PDF
          </Button>
          <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={!products?.length}>
                <Mail className="h-4 w-4 mr-2" />
                Send via Email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Catalogue via Email</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Recipient Email</Label>
                  <Input
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="customer@example.com"
                    type="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleSendEmail}
                  disabled={isGenerating}
                  className="w-full btn-sunset"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4 mr-2" />
                  )}
                  Send Catalogue
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Catalogue Settings</CardTitle>
            <CardDescription>Customize your catalogue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Catalogue Name</Label>
              <Input
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={settings.description}
                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Category Filter</Label>
              <Select
                value={settings.categoryFilter}
                onValueChange={(v) => setSettings({ ...settings, categoryFilter: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Layout</Label>
              <Select
                value={settings.layout}
                onValueChange={(v: 'grid' | 'list') => setSettings({ ...settings, layout: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">List View</SelectItem>
                  <SelectItem value="grid">Grid View (with details)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 pt-2">
              <Label>Include in Catalogue</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={settings.includeDescription}
                    onCheckedChange={(c) => setSettings({ ...settings, includeDescription: !!c })}
                  />
                  <span className="text-sm">Product Descriptions</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={settings.includePrices}
                    onCheckedChange={(c) => setSettings({ ...settings, includePrices: !!c })}
                  />
                  <span className="text-sm">Prices</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={settings.includeSKU}
                    onCheckedChange={(c) => setSettings({ ...settings, includeSKU: !!c })}
                  />
                  <span className="text-sm">SKU Numbers</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={settings.includeStock}
                    onCheckedChange={(c) => setSettings({ ...settings, includeStock: !!c })}
                  />
                  <span className="text-sm">Stock Levels</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Selection */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Products</CardTitle>
                <CardDescription>
                  {selectedProducts.length > 0 
                    ? `${selectedProducts.length} products selected`
                    : `${products?.length || 0} products (all included by default)`}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllProducts}>
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Select All
                </Button>
                {selectedProducts.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
                <AnimatePresence>
                  {products?.map((product) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedProducts.includes(product.id) || selectedProducts.length === 0
                          ? 'border-primary bg-primary/5'
                          : 'border-border opacity-50'
                      }`}
                      onClick={() => toggleProductSelection(product.id)}
                    >
                      <div className="flex items-start gap-3">
                        {product.primary_image_url ? (
                          <img
                            src={product.primary_image_url}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.sku}</p>
                          <p className="text-sm font-semibold text-primary mt-1">
                            {formatCurrency(product.price_zar)}
                          </p>
                        </div>
                        <Checkbox
                          checked={selectedProducts.includes(product.id) || selectedProducts.length === 0}
                          className="mt-1"
                        />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
