import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface QuotationItem {
  product_name: string;
  product_sku?: string | null;
  quantity: number;
  unit_price_zar: number;
  total_price_zar: number;
}

interface Quotation {
  quotation_number: string;
  customer_name: string;
  company_name?: string | null;
  phone?: string | null;
  email?: string | null;
  billing_address?: string | null;
  subtotal_zar: number;
  vat_zar: number;
  total_zar: number;
  vat_enabled: boolean;
  notes?: string | null;
  created_at: string;
}

const fmt = (v: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(v);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });

export function generateQuotationPDF(quotation: Quotation, items: QuotationItem[]): void {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();

  const primary: [number, number, number] = [194, 88, 50];
  const gold: [number, number, number] = [212, 175, 55];
  const txt: [number, number, number] = [51, 51, 51];
  const muted: [number, number, number] = [128, 128, 128];

  // Header
  doc.setFillColor(...primary);
  doc.rect(0, 0, pw, 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Dragon Fruit SA', 20, 25);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Premium Dragon Fruit Cultivars', 20, 33);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('QUOTATION', pw - 20, 20, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${quotation.quotation_number}`, pw - 20, 28, { align: 'right' });
  doc.text(fmtDate(quotation.created_at), pw - 20, 35, { align: 'right' });

  doc.setTextColor(...txt);
  let y = 60;

  // Quote To
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Quote To:', 20, y);

  // Company details on right
  doc.text('From:', pw / 2 + 10, y);

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  doc.text(quotation.customer_name, 20, y);
  y += 5;
  if (quotation.company_name) { doc.text(quotation.company_name, 20, y); y += 5; }
  if (quotation.email) { doc.text(quotation.email, 20, y); y += 5; }
  if (quotation.phone) { doc.text(quotation.phone, 20, y); y += 5; }
  if (quotation.billing_address) {
    const lines = doc.splitTextToSize(quotation.billing_address, 80);
    doc.text(lines, 20, y);
    y += lines.length * 5;
  }

  // Company details
  let ry = 68;
  doc.text('Wonderful Dragon Fruit South Africa', pw / 2 + 10, ry); ry += 5;
  doc.setTextColor(...muted);
  doc.text('orders@proagrisa.co.za', pw / 2 + 10, ry); ry += 5;
  doc.text('+27 83 447 4639', pw / 2 + 10, ry); ry += 5;
  doc.text('South Africa', pw / 2 + 10, ry);

  y = Math.max(y, ry) + 15;
  doc.setTextColor(...txt);

  // Items table
  const tableData = items.map(item => [
    item.product_name,
    item.product_sku || '-',
    item.quantity.toString(),
    fmt(item.unit_price_zar),
    fmt(item.total_price_zar),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Product', 'SKU', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'plain',
    headStyles: { fillColor: [245, 240, 235], textColor: txt, fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9, textColor: txt },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 30 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: 20, right: 20 },
    alternateRowStyles: { fillColor: [252, 250, 248] },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const totalsX = pw - 80;
  let ty = finalY;

  doc.setFontSize(10);
  doc.setTextColor(...muted);
  doc.text('Subtotal:', totalsX, ty);
  doc.setTextColor(...txt);
  doc.text(fmt(quotation.subtotal_zar), pw - 20, ty, { align: 'right' });

  if (quotation.vat_enabled) {
    ty += 7;
    doc.setTextColor(...muted);
    doc.text('VAT (15%):', totalsX, ty);
    doc.setTextColor(...txt);
    doc.text(fmt(quotation.vat_zar), pw - 20, ty, { align: 'right' });
  }

  ty += 5;
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  doc.line(totalsX - 10, ty, pw - 20, ty);

  ty += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primary);
  doc.text('Total:', totalsX, ty);
  doc.text(fmt(quotation.total_zar), pw - 20, ty, { align: 'right' });

  // Notes
  if (quotation.notes) {
    ty += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...txt);
    doc.text('Notes:', 20, ty);
    ty += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...muted);
    const noteLines = doc.splitTextToSize(quotation.notes, pw - 40);
    doc.text(noteLines, 20, ty);
  }

  // Footer
  const fy = doc.internal.pageSize.getHeight() - 30;
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.3);
  doc.line(20, fy - 5, pw - 20, fy - 5);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...muted);
  doc.text('This quotation is valid for 30 days from the date of issue.', pw / 2, fy, { align: 'center' });
  doc.setFontSize(8);
  doc.text('orders@proagrisa.co.za | +27 83 447 4639 | South Africa', pw / 2, fy + 8, { align: 'center' });

  doc.save(`quotation-${quotation.quotation_number}.pdf`);
}
