/**
 * Customer invoicing.
 *
 * Invoices live alongside the existing quotations module as a separate
 * document type: an invoice carries a due date, a payment state and a delivery
 * history that a quotation does not.
 *
 * Two rules are enforced here rather than in the UI, so they cannot be bypassed:
 *   1. Creating or editing an invoice never marks it paid. Payment status only
 *      changes through `recordPayment` or an explicit administrator action.
 *   2. Every state change and every send attempt appends an invoice_events row,
 *      so an invoice always has an audit trail.
 */

import crypto from "node:crypto";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

type QueryFn = <T extends RowDataPacket[] | ResultSetHeader>(sql: string, params?: unknown[]) => Promise<T>;

export type InvoiceItemInput = {
  productId?: string | null;
  productName?: string;
  description?: string | null;
  productSku?: string | null;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
};

export type InvoiceInput = {
  customerId?: string | null;
  farmerId?: string | null;
  quotationId?: string | null;
  contactName?: string;
  companyName?: string;
  email?: string;
  whatsapp?: string;
  billingAddress?: string | null;
  invoiceDate?: string | null;
  dueDate?: string | null;
  items?: InvoiceItemInput[];
  discount?: number;
  vatEnabled?: boolean;
  vatRate?: number;
  paymentTerms?: string | null;
  paymentInstructions?: string | null;
  paymentReference?: string | null;
  notes?: string | null;
  createdBy?: string | null;
};

const DEFAULT_VAT_RATE = 15;
const round2 = (value: number) => Math.round((Number(value) || 0) * 100) / 100;

/**
 * Reads a MySQL tinyint(1) flag as a real boolean.
 *
 * Boolean("0") is true, so a flag must be normalised numerically rather than by
 * truthiness. Without this, a driver returning "0" as a string would silently add
 * VAT to a document that was marked as having none.
 */
export const asBool = (value: unknown) => Number(value) === 1;

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Allocates the next invoice number for the calendar year, e.g. INV-2026-0007. */
export async function nextInvoiceNumber(query: QueryFn, prefix = "INV", year = new Date().getFullYear()) {
  await query<ResultSetHeader>(
    "INSERT INTO invoice_number_sequences (sequence_year, last_number) VALUES (?, 1) ON DUPLICATE KEY UPDATE last_number = last_number + 1",
    [year],
  );
  const rows = await query<RowDataPacket[]>(
    "SELECT last_number FROM invoice_number_sequences WHERE sequence_year = ?",
    [year],
  );
  const next = Number(rows[0]?.last_number) || 1;
  return `${prefix}-${year}-${String(next).padStart(4, "0")}`;
}

/**
 * Line and VAT totals for an invoice or quotation.
 *
 * All arithmetic is done in integer cents. Binary floating point cannot represent
 * decimal money exactly: 436.50 * 0.15 evaluates to 65.47499999999999, so rounding
 * that expression to cents yields 65.47 instead of the correct 65.48, and the
 * invoice total comes out one cent short. Multiplying into cents first, then
 * rounding, keeps half-up rounding correct.
 */
export function calculateTotals(items: InvoiceItemInput[], invoiceDiscount: number, vatEnabled: boolean, vatRate: number) {
  const cents = (value: number) => Math.round((Number(value) || 0) * 100);

  const lines = (items || []).map((item, index) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = round2(Number(item.unitPrice) || 0);
    const discount = round2(Number(item.discount) || 0);
    // Round the line to cents before it can accumulate drift into the subtotal.
    const total = (cents(quantity * unitPrice) - cents(discount)) / 100;
    return { ...item, sortOrder: index, quantity, unitPrice, discount, total };
  });

  const subtotal = lines.reduce((sum, line) => sum + cents(line.total), 0) / 100;
  const discount = round2(invoiceDiscount);
  const taxable = round2(Math.max(0, subtotal - discount));
  const rate = vatEnabled ? Number(vatRate) || DEFAULT_VAT_RATE : 0;
  // Round VAT on the cent value so 15% of R436.50 is R65.48, not R65.47.
  const vat = vatEnabled ? Math.round((cents(taxable) * rate) / 100) / 100 : 0;
  const total = (cents(taxable) + cents(vat)) / 100;
  return { lines, subtotal, discount, vat, vatRate: rate, total };
}

export async function logInvoiceEvent(
  query: QueryFn,
  invoiceId: string,
  eventType: string,
  options: { channel?: string; recipient?: string; status?: string; detail?: string; actor?: string } = {},
) {
  await query<ResultSetHeader>(
    "INSERT INTO invoice_events (id, invoice_id, event_type, channel, recipient, status, detail, actor) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      crypto.randomUUID(),
      invoiceId,
      eventType,
      options.channel || "",
      options.recipient || "",
      options.status || "",
      options.detail || null,
      options.actor || "admin",
    ],
  );
}

export async function createInvoice(query: QueryFn, input: InvoiceInput) {
  const invoiceId = crypto.randomUUID();
  const invoiceNumber = await nextInvoiceNumber(query);
  const totals = calculateTotals(
    input.items || [],
    Number(input.discount) || 0,
    input.vatEnabled !== false,
    Number(input.vatRate) || DEFAULT_VAT_RATE,
  );
  const invoiceDate = (input.invoiceDate || todayIso()).slice(0, 10);
  const dueDate = input.dueDate ? String(input.dueDate).slice(0, 10) : null;

  await query<ResultSetHeader>(
    `INSERT INTO invoices (
       id, invoice_number, customer_id, farmer_id, quotation_id, contact_name, company_name, email, whatsapp,
       billing_address, invoice_date, due_date, subtotal_zar, discount_zar, vat_enabled, vat_rate, vat_zar,
       total_zar, amount_paid_zar, payment_status, status, payment_terms, payment_instructions,
       payment_reference, notes, created_by
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'unpaid', 'issued', ?, ?, ?, ?, ?)`,
    [
      invoiceId,
      invoiceNumber,
      input.customerId || null,
      input.farmerId || null,
      input.quotationId || null,
      String(input.contactName || "").slice(0, 191),
      String(input.companyName || "").slice(0, 191),
      String(input.email || "").slice(0, 191),
      String(input.whatsapp || "").slice(0, 64),
      input.billingAddress || null,
      invoiceDate,
      dueDate,
      totals.subtotal,
      totals.discount,
      input.vatEnabled !== false ? 1 : 0,
      totals.vatRate,
      totals.vat,
      totals.total,
      input.paymentTerms || "Payment due within 7 days of invoice date.",
      input.paymentInstructions || null,
      input.paymentReference || invoiceNumber,
      input.notes || null,
      input.createdBy || null,
    ],
  );

  for (const line of totals.lines) {
    await query<ResultSetHeader>(
      `INSERT INTO invoice_items (id, invoice_id, product_id, product_name, description, product_sku, quantity, unit_price_zar, discount_zar, total_price_zar, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        crypto.randomUUID(),
        invoiceId,
        line.productId || null,
        String(line.productName || "Item").slice(0, 255),
        line.description || null,
        line.productSku || null,
        line.quantity,
        line.unitPrice,
        line.discount,
        line.total,
        line.sortOrder,
      ],
    );
  }

  await logInvoiceEvent(query, invoiceId, "created", { status: "issued", detail: `Invoice ${invoiceNumber} created` });
  return { invoiceId, invoiceNumber, total: totals.total };
}

export async function getInvoice(query: QueryFn, invoiceId: string) {
  const invoices = await query<RowDataPacket[]>("SELECT * FROM invoices WHERE id = ?", [invoiceId]);
  if (!invoices.length) return null;
  const items = await query<RowDataPacket[]>(
    "SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order, created_at",
    [invoiceId],
  );
  const events = await query<RowDataPacket[]>(
    "SELECT * FROM invoice_events WHERE invoice_id = ? ORDER BY created_at DESC LIMIT 100",
    [invoiceId],
  );
  return { invoice: invoices[0], items, events };
}

export async function listInvoices(
  query: QueryFn,
  filters: { paymentStatus?: string; status?: string; search?: string; limit?: number } = {},
) {
  const where: string[] = [];
  const params: unknown[] = [];

  if (filters.paymentStatus === "overdue") {
    where.push("payment_status IN ('unpaid','partially_paid') AND due_date IS NOT NULL AND due_date < CURDATE()");
  } else if (filters.paymentStatus) {
    where.push("payment_status = ?");
    params.push(filters.paymentStatus);
  }
  if (filters.status) {
    where.push("status = ?");
    params.push(filters.status);
  }
  if (filters.search) {
    where.push("(invoice_number LIKE ? OR contact_name LIKE ? OR company_name LIKE ? OR email LIKE ? OR whatsapp LIKE ?)");
    const like = `%${filters.search}%`;
    params.push(like, like, like, like, like);
  }

  const sql = `SELECT * FROM invoices ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY created_at DESC LIMIT ?`;
  params.push(Math.min(Math.max(Number(filters.limit) || 200, 1), 500));
  return query<RowDataPacket[]>(sql, params);
}

/**
 * Records a payment against an invoice and derives the payment status from the
 * amounts, so a partial payment can never leave the invoice marked paid.
 */
export async function recordPayment(
  query: QueryFn,
  invoiceId: string,
  options: { amount: number; reference?: string; paymentDate?: string; actor?: string; markPaidInFull?: boolean },
) {
  const rows = await query<RowDataPacket[]>("SELECT total_zar, amount_paid_zar FROM invoices WHERE id = ?", [invoiceId]);
  if (!rows.length) throw new Error("Invoice not found");

  const total = round2(Number(rows[0].total_zar));
  const alreadyPaid = round2(Number(rows[0].amount_paid_zar));
  const amount = options.markPaidInFull ? round2(total - alreadyPaid) : round2(Number(options.amount));
  if (!(amount > 0)) throw new Error("Payment amount must be greater than zero");

  const newPaid = round2(alreadyPaid + amount);
  const paymentStatus = newPaid >= total ? "paid" : newPaid > 0 ? "partially_paid" : "unpaid";
  const paymentDate = (options.paymentDate || todayIso()).slice(0, 10);

  await query<ResultSetHeader>(
    "UPDATE invoices SET amount_paid_zar = ?, payment_status = ?, payment_reference = ?, payment_date = ? WHERE id = ?",
    [newPaid, paymentStatus, options.reference || "", paymentDate, invoiceId],
  );
  await logInvoiceEvent(query, invoiceId, "payment_recorded", {
    status: paymentStatus,
    detail: `Payment of R ${amount.toFixed(2)} recorded (paid to date R ${newPaid.toFixed(2)} of R ${total.toFixed(2)})`,
    actor: options.actor || "admin",
  });
  return { amountPaid: newPaid, total, paymentStatus, balance: round2(Math.max(0, total - newPaid)) };
}

/** Cancels an invoice. The record and its history are kept, never deleted. */
export async function cancelInvoice(query: QueryFn, invoiceId: string, reason: string, actor = "admin") {
  const rows = await query<RowDataPacket[]>("SELECT invoice_number, status FROM invoices WHERE id = ?", [invoiceId]);
  if (!rows.length) throw new Error("Invoice not found");
  if (rows[0].status === "cancelled") throw new Error("Invoice is already cancelled");
  await query<ResultSetHeader>("UPDATE invoices SET status = 'cancelled' WHERE id = ?", [invoiceId]);
  await logInvoiceEvent(query, invoiceId, "cancelled", {
    status: "cancelled",
    detail: reason || "Cancelled by administrator",
    actor,
  });
  return { invoiceNumber: rows[0].invoice_number, status: "cancelled" };
}

export async function updateInvoice(query: QueryFn, invoiceId: string, input: InvoiceInput, actor = "admin") {
  const existing = await query<RowDataPacket[]>("SELECT * FROM invoices WHERE id = ?", [invoiceId]);
  if (!existing.length) throw new Error("Invoice not found");
  if (existing[0].status === "cancelled") throw new Error("A cancelled invoice cannot be edited");

  const current = existing[0];
  const items = input.items ?? (await query<RowDataPacket[]>(
    "SELECT product_id, product_name, description, product_sku, quantity, unit_price_zar, discount_zar FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order",
    [invoiceId],
  )).map((row) => ({
    productId: row.product_id,
    productName: row.product_name,
    description: row.description,
    productSku: row.product_sku,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price_zar),
    discount: Number(row.discount_zar),
  }));

  const totals = calculateTotals(
    items,
    input.discount ?? Number(current.discount_zar),
    input.vatEnabled ?? asBool(current.vat_enabled),
    input.vatRate ?? Number(current.vat_rate),
  );

  await query<ResultSetHeader>(
    `UPDATE invoices SET contact_name = ?, company_name = ?, email = ?, whatsapp = ?, billing_address = ?,
       invoice_date = ?, due_date = ?, subtotal_zar = ?, discount_zar = ?, vat_enabled = ?, vat_rate = ?, vat_zar = ?,
       total_zar = ?, payment_terms = ?, payment_instructions = ?, notes = ?,
       payment_status = CASE
         WHEN amount_paid_zar >= ? THEN 'paid'
         WHEN amount_paid_zar > 0 THEN 'partially_paid'
         ELSE 'unpaid' END
     WHERE id = ?`,
    [
      String(input.contactName ?? current.contact_name).slice(0, 191),
      String(input.companyName ?? current.company_name).slice(0, 191),
      String(input.email ?? current.email).slice(0, 191),
      String(input.whatsapp ?? current.whatsapp).slice(0, 64),
      input.billingAddress ?? current.billing_address,
      (input.invoiceDate || String(current.invoice_date)).slice(0, 10),
      input.dueDate ? String(input.dueDate).slice(0, 10) : current.due_date,
      totals.subtotal,
      totals.discount,
      (input.vatEnabled ?? asBool(current.vat_enabled)) ? 1 : 0,
      totals.vatRate,
      totals.vat,
      totals.total,
      input.paymentTerms ?? current.payment_terms,
      input.paymentInstructions ?? current.payment_instructions,
      input.notes ?? current.notes,
      totals.total,
      invoiceId,
    ],
  );

  if (input.items) {
    await query<ResultSetHeader>("DELETE FROM invoice_items WHERE invoice_id = ?", [invoiceId]);
    for (const line of totals.lines) {
      await query<ResultSetHeader>(
        `INSERT INTO invoice_items (id, invoice_id, product_id, product_name, description, product_sku, quantity, unit_price_zar, discount_zar, total_price_zar, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          crypto.randomUUID(),
          invoiceId,
          line.productId || null,
          String(line.productName || "Item").slice(0, 255),
          line.description || null,
          line.productSku || null,
          line.quantity,
          line.unitPrice,
          line.discount,
          line.total,
          line.sortOrder,
        ],
      );
    }
  }

  await logInvoiceEvent(query, invoiceId, "edited", { detail: "Invoice details updated", actor });
  return { invoiceId, total: totals.total, paymentStatus: current.payment_status };
}

/** Maps a stored invoice onto the PDF renderer's input shape. */
export function invoiceToPdfInput(invoice: RowDataPacket, items: RowDataPacket[]) {
  return {
    documentTitle: "Tax Invoice",
    documentNumber: String(invoice.invoice_number),
    documentDate: String(invoice.invoice_date).slice(0, 10),
    dueDate: invoice.due_date ? String(invoice.due_date).slice(0, 10) : null,
    contactName: String(invoice.contact_name || "Customer"),
    companyName: invoice.company_name || null,
    email: invoice.email || null,
    whatsapp: invoice.whatsapp || null,
    billingAddress: invoice.billing_address || null,
    items: items.map((item) => ({
      productName: String(item.product_name),
      description: item.description || null,
      sku: item.product_sku || null,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price_zar),
      discount: Number(item.discount_zar),
      total: Number(item.total_price_zar),
    })),
    subtotal: Number(invoice.subtotal_zar),
    discount: Number(invoice.discount_zar),
    vatEnabled: asBool(invoice.vat_enabled),
    vatRate: Number(invoice.vat_rate),
    vat: Number(invoice.vat_zar),
    total: Number(invoice.total_zar),
    amountPaid: Number(invoice.amount_paid_zar),
    paymentStatus: String(invoice.payment_status).replace(/_/g, " "),
    paymentTerms: invoice.payment_terms || null,
    paymentInstructions: invoice.payment_instructions || null,
    paymentReference: invoice.payment_reference || null,
    notes: invoice.notes || null,
  };
}
