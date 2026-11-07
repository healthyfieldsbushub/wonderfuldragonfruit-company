import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface OrderItem {
  id: string;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price_zar: number;
  total_price_zar: number;
}

interface ShippingAddress {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
}

interface Order {
  id: string;
  order_number: string;
  guest_email: string | null;
  status: string;
  payment_status: string;
  payment_method: string | null;
  payment_reference: string | null;
  subtotal_zar: number;
  shipping_cost_zar: number | null;
  discount_zar: number | null;
  tax_zar: number | null;
  total_zar: number;
  shipping_address: ShippingAddress | null;
  created_at: string;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(value);
};

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export function generateInvoicePDF(order: Order, items: OrderItem[]): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor: [number, number, number] = [194, 88, 50]; // Terracotta
  const goldColor: [number, number, number] = [212, 175, 55]; // Sahara gold
  const textColor: [number, number, number] = [51, 51, 51];
  const mutedColor: [number, number, number] = [128, 128, 128];

  // Header background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Company Logo/Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('African Vibe', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Authentic African Craftsmanship', 20, 33);

  // Invoice Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - 20, 20, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${order.order_number}`, pageWidth - 20, 28, { align: 'right' });
  doc.text(formatDate(order.created_at), pageWidth - 20, 35, { align: 'right' });

  // Reset text color
  doc.setTextColor(...textColor);

  let yPos = 60;

  // Bill To & Invoice Details
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, yPos);
  doc.text('Invoice Details:', pageWidth / 2 + 10, yPos);

  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  // Customer details
  const address = order.shipping_address;
  if (address) {
    if (address.name) doc.text(address.name, 20, yPos);
    yPos += 5;
    if (order.guest_email) doc.text(order.guest_email, 20, yPos);
    yPos += 5;
    if (address.phone) doc.text(address.phone, 20, yPos);
    yPos += 5;
    if (address.address) doc.text(address.address, 20, yPos);
    yPos += 5;
    if (address.city && address.province) {
      doc.text(`${address.city}, ${address.province}`, 20, yPos);
    }
    yPos += 5;
    if (address.postalCode) doc.text(address.postalCode, 20, yPos);
  } else if (order.guest_email) {
    doc.text(order.guest_email, 20, yPos);
  }

  // Invoice details on the right
  let rightYPos = 68;
  doc.setTextColor(...mutedColor);
  doc.text('Order Number:', pageWidth / 2 + 10, rightYPos);
  doc.setTextColor(...textColor);
  doc.text(order.order_number, pageWidth - 20, rightYPos, { align: 'right' });
  
  rightYPos += 6;
  doc.setTextColor(...mutedColor);
  doc.text('Invoice Date:', pageWidth / 2 + 10, rightYPos);
  doc.setTextColor(...textColor);
  doc.text(formatDate(order.created_at), pageWidth - 20, rightYPos, { align: 'right' });
  
  rightYPos += 6;
  doc.setTextColor(...mutedColor);
  doc.text('Payment Status:', pageWidth / 2 + 10, rightYPos);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text(order.payment_status.toUpperCase(), pageWidth - 20, rightYPos, { align: 'right' });
  
  if (order.payment_method) {
    rightYPos += 6;
    doc.setTextColor(...mutedColor);
    doc.setFont('helvetica', 'normal');
    doc.text('Payment Method:', pageWidth / 2 + 10, rightYPos);
    doc.setTextColor(...textColor);
    doc.text(order.payment_method, pageWidth - 20, rightYPos, { align: 'right' });
  }

  if (order.payment_reference) {
    rightYPos += 6;
    doc.setTextColor(...mutedColor);
    doc.text('Reference:', pageWidth / 2 + 10, rightYPos);
    doc.setTextColor(...textColor);
    doc.text(order.payment_reference, pageWidth - 20, rightYPos, { align: 'right' });
  }

  yPos = Math.max(yPos, rightYPos) + 15;

  // Items table
  const tableData = items.map((item) => [
    item.product_name,
    item.product_sku || '-',
    item.quantity.toString(),
    formatCurrency(item.unit_price_zar),
    formatCurrency(item.total_price_zar),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Product', 'SKU', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: [245, 240, 235],
      textColor: textColor,
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textColor,
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 30 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: 20, right: 20 },
    alternateRowStyles: {
      fillColor: [252, 250, 248],
    },
  });

  // Get final Y position after table
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Totals section
  const totalsX = pageWidth - 80;
  let totalsY = finalY;

  // Subtotal
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.text('Subtotal:', totalsX, totalsY);
  doc.setTextColor(...textColor);
  doc.text(formatCurrency(order.subtotal_zar), pageWidth - 20, totalsY, { align: 'right' });

  // Shipping
  if (order.shipping_cost_zar && order.shipping_cost_zar > 0) {
    totalsY += 7;
    doc.setTextColor(...mutedColor);
    doc.text('Shipping:', totalsX, totalsY);
    doc.setTextColor(...textColor);
    doc.text(formatCurrency(order.shipping_cost_zar), pageWidth - 20, totalsY, { align: 'right' });
  }

  // Discount
  if (order.discount_zar && order.discount_zar > 0) {
    totalsY += 7;
    doc.setTextColor(...mutedColor);
    doc.text('Discount:', totalsX, totalsY);
    doc.setTextColor(0, 128, 0);
    doc.text(`-${formatCurrency(order.discount_zar)}`, pageWidth - 20, totalsY, { align: 'right' });
  }

  // Tax
  if (order.tax_zar && order.tax_zar > 0) {
    totalsY += 7;
    doc.setTextColor(...mutedColor);
    doc.text('Tax (VAT):', totalsX, totalsY);
    doc.setTextColor(...textColor);
    doc.text(formatCurrency(order.tax_zar), pageWidth - 20, totalsY, { align: 'right' });
  }

  // Total line
  totalsY += 5;
  doc.setDrawColor(...goldColor);
  doc.setLineWidth(0.5);
  doc.line(totalsX - 10, totalsY, pageWidth - 20, totalsY);

  // Total
  totalsY += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Total:', totalsX, totalsY);
  doc.text(formatCurrency(order.total_zar), pageWidth - 20, totalsY, { align: 'right' });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 30;
  
  doc.setDrawColor(...goldColor);
  doc.setLineWidth(0.3);
  doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  
  doc.text('Thank you for shopping with African Vibe!', pageWidth / 2, footerY, { align: 'center' });
  doc.text('Authentic African craftsmanship delivered to your doorstep.', pageWidth / 2, footerY + 5, { align: 'center' });
  
  doc.setFontSize(8);
  doc.text('orders@proagrisa.co.za | +27 83 447 4639 | South Africa', pageWidth / 2, footerY + 12, { align: 'center' });

  // Save the PDF
  doc.save(`invoice-${order.order_number}.pdf`);
}

function generateInvoiceBlob(order: Order, items: OrderItem[]): Blob {
  const doc = new jsPDF();
  // Same generation logic but return blob instead
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const primaryColor: [number, number, number] = [194, 88, 50];
  const goldColor: [number, number, number] = [212, 175, 55];
  const textColor: [number, number, number] = [51, 51, 51];
  const mutedColor: [number, number, number] = [128, 128, 128];

  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('African Vibe', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Authentic African Craftsmanship', 20, 33);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - 20, 20, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${order.order_number}`, pageWidth - 20, 28, { align: 'right' });
  doc.text(formatDate(order.created_at), pageWidth - 20, 35, { align: 'right' });

  doc.setTextColor(...textColor);

  let yPos = 60;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, yPos);

  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const address = order.shipping_address;
  if (address) {
    if (address.name) { doc.text(address.name, 20, yPos); yPos += 5; }
    if (order.guest_email) { doc.text(order.guest_email, 20, yPos); yPos += 5; }
    if (address.address) { doc.text(address.address, 20, yPos); yPos += 5; }
    if (address.city && address.province) {
      doc.text(`${address.city}, ${address.province} ${address.postalCode || ''}`, 20, yPos);
    }
  } else if (order.guest_email) {
    doc.text(order.guest_email, 20, yPos);
  }

  yPos += 15;

  const tableData = items.map((item) => [
    item.product_name,
    item.quantity.toString(),
    formatCurrency(item.unit_price_zar),
    formatCurrency(item.total_price_zar),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Product', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: [245, 240, 235],
      textColor: textColor,
      fontStyle: 'bold',
    },
    margin: { left: 20, right: 20 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: ${formatCurrency(order.total_zar)}`, pageWidth - 20, finalY, { align: 'right' });

  return doc.output('blob');
}
