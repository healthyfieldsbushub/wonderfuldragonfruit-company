/**
 * Server-side PDF rendering for invoices and quotations.
 *
 * Uses pdfkit (pure JavaScript, no headless browser) so the production
 * container can render a document without Chromium. The same renderer serves
 * both document types: `documentTitle` switches the heading between
 * "TAX INVOICE" and "QUOTATION", and invoice-only blocks (due date, amount
 * paid, payment terms) are skipped when they are absent.
 */

import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

export type DocumentLineItem = {
  productName: string;
  description?: string | null;
  sku?: string | null;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
};

export type DocumentPdfInput = {
  documentTitle: string;
  documentNumber: string;
  documentDate: string;
  dueDate?: string | null;
  contactName: string;
  companyName?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  billingAddress?: string | null;
  items: DocumentLineItem[];
  subtotal: number;
  discount: number;
  vatEnabled: boolean;
  vatRate: number;
  vat: number;
  total: number;
  amountPaid?: number;
  paymentStatus?: string | null;
  paymentTerms?: string | null;
  paymentInstructions?: string | null;
  paymentReference?: string | null;
  notes?: string | null;
};

const BUSINESS = {
  name: "Wonderful Dragon Fruit South Africa",
  legal: "DFSA — ProAgriSA",
  email: "dfsa.africa@proagrisa.co.za",
  whatsapp: "+27 83 447 4639",
  website: "wonderfuldragonfruit.company",
};

const INK = "#1c2b24";
const MUTED = "#6b7a72";
const ACCENT = "#14532d";
const RULE = "#dfe5e1";

/** South African Rand formatting: R 1 234.56 */
function money(value: number) {
  const rounded = Math.round((Number(value) || 0) * 100) / 100;
  const [whole, cents] = rounded.toFixed(2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `R ${grouped}.${cents}`;
}

function text(value: unknown, fallback = "") {
  const s = String(value ?? "").trim();
  return s.length ? s : fallback;
}

/** Keep long descriptions inside the column instead of overflowing the page. */
function wrap(doc: PDFKit.PDFDocument, value: string, width: number) {
  return doc.heightOfString(value, { width });
}

export async function renderDocumentPdf(input: DocumentPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 45, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const left = doc.page.margins.left;
      const right = doc.page.width - doc.page.margins.right;
      const contentWidth = right - left;

      // ---------------- Header ----------------
      // The full-resolution logo is ~1.5 MB and would be embedded in every
      // generated document; the pre-scaled print copy keeps PDFs small enough
      // to attach to WhatsApp and email.
      const printLogo = path.join(process.cwd(), "public", "images", "dfsa-logo-print.png");
      const logoPath = fs.existsSync(printLogo)
        ? printLogo
        : path.join(process.cwd(), "public", "images", "dfsa-logo.png");
      let headerTextLeft = left;
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, left, 45, { height: 52 });
          headerTextLeft = left + 66;
        } catch {
          headerTextLeft = left;
        }
      }

      doc.fillColor(INK).font("Helvetica-Bold").fontSize(14)
        .text(BUSINESS.name, headerTextLeft, 48, { width: contentWidth - 66 });
      doc.font("Helvetica").fontSize(8.5).fillColor(MUTED)
        .text(BUSINESS.legal, headerTextLeft, 66, { width: contentWidth - 66 })
        .text(`${BUSINESS.email}  ·  ${BUSINESS.whatsapp}`, headerTextLeft, 78, { width: contentWidth - 66 })
        .text(BUSINESS.website, headerTextLeft, 90, { width: contentWidth - 66 });

      // Document title, right aligned.
      doc.font("Helvetica-Bold").fontSize(19).fillColor(ACCENT)
        .text(input.documentTitle.toUpperCase(), left, 50, { width: contentWidth, align: "right" });
      doc.font("Helvetica-Bold").fontSize(10.5).fillColor(INK)
        .text(input.documentNumber, left, 74, { width: contentWidth, align: "right" });

      doc.moveTo(left, 116).lineTo(right, 116).lineWidth(1.2).strokeColor(ACCENT).stroke();

      // ---------------- Parties ----------------
      let y = 132;
      const colGap = 22;
      const colWidth = (contentWidth - colGap) / 2;

      doc.font("Helvetica-Bold").fontSize(8).fillColor(MUTED).text("BILL TO", left, y);
      doc.font("Helvetica-Bold").fontSize(10.5).fillColor(INK)
        .text(text(input.contactName, "Customer"), left, y + 13, { width: colWidth });
      let billY = y + 27;
      const billLines = [
        text(input.companyName),
        text(input.billingAddress),
        text(input.email),
        input.whatsapp ? `WhatsApp: ${text(input.whatsapp)}` : "",
      ].filter(Boolean);
      doc.font("Helvetica").fontSize(9).fillColor(MUTED);
      for (const line of billLines) {
        doc.text(line, left, billY, { width: colWidth });
        billY = doc.y + 1;
      }

      const metaX = left + colWidth + colGap;
      doc.font("Helvetica-Bold").fontSize(8).fillColor(MUTED).text("DETAILS", metaX, y);
      const metaRows: [string, string][] = [["Date", text(input.documentDate)]];
      if (input.dueDate) metaRows.push(["Due date", text(input.dueDate)]);
      if (input.paymentStatus) metaRows.push(["Payment status", text(input.paymentStatus).replace(/_/g, " ")]);
      let metaY = y + 13;
      for (const [label, value] of metaRows) {
        doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(`${label}:`, metaX, metaY, { width: 78, continued: false });
        doc.font("Helvetica-Bold").fontSize(9).fillColor(INK).text(value, metaX + 80, metaY, { width: colWidth - 80 });
        metaY += 13;
      }

      y = Math.max(billY, metaY) + 18;

      // ---------------- Items table ----------------
      const cols = {
        desc: left,
        descWidth: contentWidth - 250,
        qty: left + contentWidth - 250,
        price: left + contentWidth - 195,
        amount: left + contentWidth - 100,
      };

      doc.rect(left, y, contentWidth, 20).fillColor("#f4f7f5").fill();
      doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(8.5);
      doc.text("DESCRIPTION", cols.desc + 6, y + 6, { width: cols.descWidth - 8 });
      doc.text("QTY", cols.qty, y + 6, { width: 40, align: "right" });
      doc.text("UNIT PRICE", cols.price, y + 6, { width: 85, align: "right" });
      doc.text("AMOUNT", cols.amount, y + 6, { width: 90, align: "right" });
      y += 24;

      doc.font("Helvetica").fontSize(9).fillColor(INK);
      for (const item of input.items) {
        const title = text(item.productName, "Item");
        const subtitleParts = [text(item.sku) ? `SKU ${text(item.sku)}` : "", text(item.description)].filter(Boolean);
        const subtitle = subtitleParts.join(" · ");

        const titleHeight = wrap(doc, title, cols.descWidth - 8);
        doc.font("Helvetica-Bold").fontSize(9);
        const boldHeight = wrap(doc, title, cols.descWidth - 8);
        doc.font("Helvetica").fontSize(8.5);
        const subHeight = subtitle ? wrap(doc, subtitle, cols.descWidth - 8) : 0;
        const rowHeight = Math.max(boldHeight + subHeight + 8, 22);

        // Page break before drawing if the row would not fit.
        if (y + rowHeight > doc.page.height - 120) {
          doc.addPage();
          y = doc.page.margins.top;
        }

        doc.font("Helvetica-Bold").fontSize(9).fillColor(INK)
          .text(title, cols.desc + 6, y, { width: cols.descWidth - 8 });
        if (subtitle) {
          doc.font("Helvetica").fontSize(8.5).fillColor(MUTED)
            .text(subtitle, cols.desc + 6, y + boldHeight + 1, { width: cols.descWidth - 8 });
        }

        const qty = Number(item.quantity) || 0;
        const unit = Number(item.unitPrice) || 0;
        const discount = Number(item.discount) || 0;
        const lineTotal = Number(item.total) || qty * unit - discount;

        doc.font("Helvetica").fontSize(9).fillColor(INK);
        doc.text(String(qty), cols.qty, y, { width: 40, align: "right" });
        doc.text(money(unit), cols.price, y, { width: 85, align: "right" });
        doc.text(money(lineTotal), cols.amount, y, { width: 90, align: "right" });
        if (discount > 0) {
          doc.font("Helvetica").fontSize(8).fillColor(MUTED)
            .text(`less ${money(discount)}`, cols.amount, y + 11, { width: 90, align: "right" });
        }

        y += rowHeight;
        doc.moveTo(left, y - 4).lineTo(right, y - 4).lineWidth(0.5).strokeColor(RULE).stroke();
      }

      // ---------------- Totals ----------------
      y += 10;
      const totalsLabelX = right - 210;
      const totalsValueX = right - 100;
      const totalsRow = (label: string, value: string, bold = false) => {
        doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 11 : 9)
          .fillColor(bold ? INK : MUTED).text(label, totalsLabelX, y, { width: 105, align: "right" });
        doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 11 : 9)
          .fillColor(INK).text(value, totalsValueX, y, { width: 100, align: "right" });
        y += bold ? 18 : 14;
      };

      totalsRow("Subtotal", money(input.subtotal));
      if (input.discount > 0) totalsRow("Discount", `- ${money(input.discount)}`);
      if (input.vatEnabled) totalsRow(`VAT @ ${Number(input.vatRate) || 0}%`, money(input.vat));
      doc.moveTo(totalsLabelX, y - 3).lineTo(right, y - 3).lineWidth(0.8).strokeColor(RULE).stroke();
      y += 4;
      totalsRow("Total", money(input.total), true);
      if (input.amountPaid && input.amountPaid > 0) {
        totalsRow("Amount paid", money(input.amountPaid));
        totalsRow("Balance due", money(Math.max(0, input.total - input.amountPaid)), true);
      }

      // ---------------- Payment + notes ----------------
      let footY = y + 14;
      if (footY > doc.page.height - 150) {
        doc.addPage();
        footY = doc.page.margins.top;
      }

      doc.font("Helvetica-Bold").fontSize(8).fillColor(MUTED).text("PAYMENT DETAILS", left, footY);
      footY += 12;
      doc.font("Helvetica").fontSize(8.5).fillColor(INK);
      const paymentLines = [
        text(input.paymentTerms),
        text(input.paymentInstructions),
        input.paymentReference ? `Payment reference: ${text(input.paymentReference)}` : "",
      ].filter(Boolean);
      for (const line of paymentLines) {
        doc.text(line, left, footY, { width: contentWidth - 20 });
        footY = doc.y + 3;
      }

      if (text(input.notes)) {
        footY += 6;
        doc.font("Helvetica-Bold").fontSize(8).fillColor(MUTED).text("NOTES", left, footY);
        doc.font("Helvetica").fontSize(8.5).fillColor(INK)
          .text(text(input.notes), left, footY + 12, { width: contentWidth - 20 });
      }

      // ---------------- Footer on every page ----------------
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        // The footer sits inside the bottom margin. Without relaxing the margin
        // pdfkit treats the write as an overflow and silently appends a new
        // page for every footer it draws.
        const savedBottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;
        const footerY = doc.page.height - 46;
        doc.moveTo(left, footerY - 8).lineTo(right, footerY - 8).lineWidth(0.5).strokeColor(RULE).stroke();
        doc.font("Helvetica").fontSize(7.5).fillColor(MUTED)
          .text(
            `${BUSINESS.name}  ·  ${BUSINESS.email}  ·  ${BUSINESS.whatsapp}  ·  ${BUSINESS.website}`,
            left, footerY - 2, { width: contentWidth - 60 },
          );
        doc.text(`Page ${i - range.start + 1} of ${range.count}`, right - 60, footerY - 2, { width: 60, align: "right" });
        doc.page.margins.bottom = savedBottom;
      }

      doc.end();
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}
