/**
 * Digital downloads (ebooks and other files).
 *
 * A product is digital when products.is_digital = 1. Digital lines have no
 * weight and no dimensions, so they never contribute to a shipping quote and an
 * all-digital cart is never charged delivery.
 *
 * Entitlements are issued from markOrderPaid, which every payment provider
 * funnels through (PayFast ITN, Yoco, PayPal capture), so a digital purchase is
 * honoured identically regardless of how the customer paid.
 *
 * Files live in Manus Storage under an unguessable key and are never served
 * directly. The download endpoint validates the token and then redirects to a
 * short-lived signed URL, so the storage key is never exposed to the browser and
 * a leaked link can be traced and revoked.
 */
import crypto from "node:crypto";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

type QueryFn = <T extends RowDataPacket[] | ResultSetHeader>(sql: string, params?: unknown[]) => Promise<T>;

export const DIGITAL_BUCKET = "digital-downloads";
export const DEFAULT_DOWNLOAD_LIMIT = 5;
export const DEFAULT_EXPIRY_DAYS = 365;

/** Public origin for customer-facing links. Matches the canonical apex host. */
export function publicOrigin(): string {
  return (process.env.PUBLIC_APP_ORIGIN || "https://wonderfuldragonfruit.company").replace(/\/+$/, "");
}

export type DigitalLine = {
  productId: string;
  productName: string;
  quantity: number;
  downloadLimit: number;
  expiryDays: number;
};

export type IssuedDownload = {
  token: string;
  productName: string;
  url: string;
  expiresAt: string | null;
  maxDownloads: number;
};

/** A fresh, unguessable download token. */
export function newDownloadToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * The digital products in an order, expanded to one entry per unit bought so a
 * customer who buys two copies receives two independently traceable links.
 */
export async function digitalLinesForOrder(query: QueryFn, orderId: string): Promise<DigitalLine[]> {
  const rows = await query<RowDataPacket[]>(
    `SELECT oi.product_id, oi.product_name, oi.quantity,
            p.digital_download_limit, p.digital_expiry_days
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ? AND p.is_digital = 1`,
    [orderId]
  );
  const out: DigitalLine[] = [];
  for (const raw of rows as unknown as Array<Record<string, unknown>>) {
    const quantity = Math.max(1, Number(raw.quantity) || 1);
    for (let i = 0; i < quantity; i += 1) {
      out.push({
        productId: String(raw.product_id),
        productName: String(raw.product_name || "Digital download"),
        quantity: 1,
        downloadLimit: Math.max(1, Number(raw.digital_download_limit) || DEFAULT_DOWNLOAD_LIMIT),
        expiryDays: Math.max(0, Number(raw.digital_expiry_days ?? DEFAULT_EXPIRY_DAYS)),
      });
    }
  }
  return out;
}

/** True when every line in the cart is digital, so no delivery may be charged. */
export async function isAllDigitalCart(query: QueryFn, productIds: string[]): Promise<boolean> {
  if (!productIds.length) return false;
  const placeholders = productIds.map(() => "?").join(",");
  const rows = await query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN is_digital = 1 THEN 1 ELSE 0 END) AS digital
       FROM products WHERE id IN (${placeholders})`,
    productIds
  );
  const row = (rows as unknown as Array<Record<string, unknown>>)[0] || {};
  const total = Number(row.total) || 0;
  const digital = Number(row.digital) || 0;
  return total > 0 && total === digital;
}

/**
 * Create one entitlement per digital unit bought and return the links.
 * Idempotent per order: a repeat call returns the existing entitlements rather
 * than issuing duplicates, so a retried payment webhook cannot multiply links.
 */
export async function issueDigitalEntitlements(
  query: QueryFn,
  order: { id: string; orderNumber?: string | null; email: string }
): Promise<IssuedDownload[]> {
  const existing = await query<RowDataPacket[]>(
    "SELECT token, product_name, max_downloads, expires_at FROM digital_downloads WHERE order_id = ? AND revoked = 0",
    [order.id]
  );
  const rows = existing as unknown as Array<Record<string, unknown>>;
  if (rows.length) {
    return rows.map((r) => ({
      token: String(r.token),
      productName: String(r.product_name || "Digital download"),
      url: downloadUrl(String(r.token)),
      expiresAt: r.expires_at ? new Date(r.expires_at as string).toISOString() : null,
      maxDownloads: Number(r.max_downloads) || DEFAULT_DOWNLOAD_LIMIT,
    }));
  }

  const lines = await digitalLinesForOrder(query, order.id);
  if (!lines.length) return [];

  const issued: IssuedDownload[] = [];
  for (const line of lines) {
    const token = newDownloadToken();
    const expiresAt = line.expiryDays > 0
      ? new Date(Date.now() + line.expiryDays * 86_400_000)
      : null;
    await query<ResultSetHeader>(
      `INSERT INTO digital_downloads
         (token, order_id, order_number, product_id, product_name, email,
          max_downloads, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [token, order.id, order.orderNumber || null, line.productId, line.productName,
       order.email, line.downloadLimit, expiresAt]
    );
    issued.push({
      token,
      productName: line.productName,
      url: downloadUrl(token),
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      maxDownloads: line.downloadLimit,
    });
  }
  return issued;
}

export function downloadUrl(token: string): string {
  return `${publicOrigin()}/download/${token}`;
}

export type DownloadCheck =
  | { ok: true; id: number; token: string; productName: string; fileKey: string; fileName: string; fileFormat: string | null; remaining: number }
  | { ok: false; reason: string; status: number };

/**
 * Validate a download token. Reports a specific, honest reason for every
 * rejection so support can tell an expired link from an exhausted one.
 */
export async function resolveDownload(query: QueryFn, token: string): Promise<DownloadCheck> {
  if (!/^[a-f0-9]{64}$/.test(token)) return { ok: false, reason: "That download link is not valid.", status: 400 };
  const rows = await query<RowDataPacket[]>(
    `SELECT d.id, d.token, d.product_name, d.download_count, d.max_downloads,
            d.expires_at, d.revoked,
            p.digital_file_key, p.digital_file_name, p.digital_file_format
       FROM digital_downloads d
       JOIN products p ON p.id = d.product_id
      WHERE d.token = ? LIMIT 1`,
    [token]
  );
  const row = (rows as unknown as Array<Record<string, unknown>>)[0];
  if (!row) return { ok: false, reason: "That download link is not valid.", status: 404 };
  if (Number(row.revoked) === 1) return { ok: false, reason: "This download link has been withdrawn. Please contact us and we will reissue it.", status: 403 };
  if (row.expires_at && new Date(row.expires_at as string).getTime() < Date.now()) {
    return { ok: false, reason: "This download link has expired. Please contact us and we will reissue it.", status: 410 };
  }
  const used = Number(row.download_count) || 0;
  const max = Number(row.max_downloads) || DEFAULT_DOWNLOAD_LIMIT;
  if (used >= max) {
    return { ok: false, reason: `This download link has reached its limit of ${max} downloads. Please contact us and we will reissue it.`, status: 429 };
  }
  if (!row.digital_file_key) {
    return { ok: false, reason: "The file for this purchase has not been uploaded yet. Please contact us.", status: 503 };
  }
  return {
    ok: true,
    id: Number(row.id),
    token: String(row.token),
    productName: String(row.product_name || "Digital download"),
    fileKey: String(row.digital_file_key),
    fileName: String(row.digital_file_name || "download.pdf"),
    fileFormat: row.digital_file_format ? String(row.digital_file_format) : null,
    remaining: max - used,
  };
}

export async function recordDownloadEvent(
  query: QueryFn,
  downloadId: number,
  token: string | null,
  ip: string | null,
  userAgent: string | null,
  outcome: string
): Promise<void> {
  await query<ResultSetHeader>(
    "INSERT INTO digital_download_events (download_id, token, ip, user_agent, outcome) VALUES (?, ?, ?, ?, ?)",
    [downloadId, token, ip ? ip.slice(0, 64) : null, userAgent ? userAgent.slice(0, 255) : null, outcome]
  );
}

/** Count a served download and stamp the time, so the limit is enforced. */
export async function incrementDownloadCount(query: QueryFn, downloadId: number): Promise<void> {
  await query<ResultSetHeader>(
    "UPDATE digital_downloads SET download_count = download_count + 1, last_downloaded_at = NOW() WHERE id = ?",
    [downloadId]
  );
}

/**
 * A short-lived signed URL for the stored file. The storage key never reaches
 * the browser, and the signature expires so a copied URL stops working.
 */
export async function signedStorageUrl(fileKey: string, expiresInSeconds = 300): Promise<string | null> {
  const base = process.env.MANUS_API_URL;
  const key = process.env.MANUS_API_KEY;
  if (!base || !key) return null;
  const response = await fetch(
    `${base}/v1/storage/presign/get?path=${encodeURIComponent(fileKey)}&expiresIn=${expiresInSeconds}`,
    { headers: { Authorization: `Bearer ${key}` } }
  );
  if (!response.ok) return null;
  const body = (await response.json()) as { url?: string };
  return body.url || null;
}

/** HTML body for the delivery email. */
export function digitalEmailBody(options: {
  orderNumber: string;
  downloads: IssuedDownload[];
  expiryNote: string;
}): string {
  const rows = options.downloads
    .map(
      (d) => `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;">${d.productName}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;">
          <a href="${d.url}" style="background:#2f6b3a;color:#fff;padding:8px 14px;border-radius:6px;text-decoration:none;">Download</a>
        </td>
      </tr>`
    )
    .join("");
  return `<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:620px;color:#222;">
    <h2 style="color:#2f6b3a;">Your digital download is ready</h2>
    <p>Thank you for your order <strong>${options.orderNumber}</strong>.</p>
    <table style="border-collapse:collapse;width:100%;margin:16px 0;">${rows}</table>
    <p style="color:#555;font-size:13px;">${options.expiryNote}</p>
    <p style="color:#555;font-size:13px;">Each link is personal to this order. If a link stops working, reply to this email and we will reissue it.</p>
    <p style="color:#888;font-size:12px;">Wonderful Dragon Fruit South Africa</p>
  </div>`;
}
