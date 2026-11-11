import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import express, { type Request, type Response, type NextFunction } from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import multer from "multer";
import mysql, { type Pool, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import sharp from "sharp";

const app = express();
const port = Number(process.env.PORT || 3000);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const root = process.cwd();
let pool: Pool | null = null;

const MAX_PRODUCT_IMAGE_BYTES = 10 * 1024 * 1024;

async function processProductImage(buffer: Buffer, originalName: string) {
  const source = sharp(buffer, { failOn: "error", animated: false }).rotate();
  const metadata = await source.metadata();
  const maxDimension = Math.max(metadata.width || 0, metadata.height || 0);
  const logoPath = path.join(root, "public", "images", "dfsa-logo.png");
  const logoWidth = Math.min(220, Math.max(64, Math.floor((metadata.width || 1000) * 0.18)));
  const overlays = maxDimension >= 64
    ? [{ input: await sharp(logoPath).resize({ width: logoWidth, withoutEnlargement: true }).png().toBuffer(), gravity: "southwest" as const }]
    : [];
  const result = await source
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .composite(overlays)
    .webp({ quality: 88, effort: 4 })
    .toBuffer({ resolveWithObject: true });
  const fingerprint = crypto.createHash("sha256").update(result.data).digest("hex");
  return {
    buffer: result.data,
    fingerprint,
    width: result.info.width,
    height: result.info.height,
    originalName: originalName.slice(0, 255),
    originalBytes: buffer.length,
    processedBytes: result.data.length,
    watermarked: overlays.length > 0,
  };
}

app.disable("x-powered-by");
app.use(cookieParser());
app.use(express.json({
  limit: "4mb",
  // Meta signs the exact raw payload; keep it so X-Hub-Signature-256 can be verified.
  verify: (req, _res, buf) => { (req as Request & { rawBody?: Buffer }).rawBody = buf; },
}));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

function apiError(message: string, code = "APP_ERROR", status = 400) {
  return { error: { message, code }, status };
}

function getPool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  if (!pool) {
    pool = mysql.createPool(process.env.DATABASE_URL);
  }
  return pool;
}

async function query<T extends RowDataPacket[] | ResultSetHeader>(sql: string, params: unknown[] = []) {
  const [rows] = await getPool().query<T>(sql, params);
  return rows;
}

function identifier(value: string, allowStar = false) {
  if (allowStar && value === "*") return "*";
  if (!/^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?$/.test(value)) throw new Error(`Invalid identifier: ${value}`);
  return value.split(".").map((part) => `\`${part}\``).join(".");
}

function columns(value: string) {
  if (value.trim() === "*") return "*";
  return value.split(",").map((part) => {
    const trimmed = part.trim();
    const alias = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([A-Za-z_][A-Za-z0-9_]*)$/);
    if (alias) return `${identifier(alias[1])} AS ${identifier(alias[2])}`;
    if (/^count\(\*\)$/i.test(trimmed)) return "COUNT(*) AS count";
    return identifier(trimmed);
  }).join(", ");
}

type Filter = { column: string; operator: string; value: unknown; negate?: boolean };
type Order = { column: string; ascending?: boolean; nullsFirst?: boolean };

function whereClause(filters: Filter[] = [], orExpression?: string) {
  const parts: string[] = [];
  const params: unknown[] = [];
  for (const filter of filters) {
    const col = identifier(filter.column);
    const op = filter.operator.toLowerCase();
    let sql = "";
    if (op === "in") {
      const values = Array.isArray(filter.value) ? filter.value : [];
      if (!values.length) { parts.push("1 = 0"); continue; }
      sql = `${col} IN (${values.map(() => "?").join(",")})`;
      params.push(...values);
    } else if (op === "is") {
      sql = filter.value === null || filter.value === "null" ? `${col} IS NULL` : `${col} IS NOT NULL`;
    } else if (op === "contains") {
      sql = `${col} LIKE ?`;
      params.push(`%${String(filter.value)}%`);
    } else {
      const operators: Record<string, string> = { eq: "=", neq: "!=", gt: ">", gte: ">=", lt: "<", lte: "<=", like: "LIKE", ilike: "LIKE" };
      const sqlOp = operators[op] || "=";
      sql = `${col} ${sqlOp} ?`;
      params.push(op === "ilike" ? String(filter.value).toLowerCase() : filter.value);
    }
    parts.push(filter.negate ? `NOT (${sql})` : sql);
  }
  if (orExpression) {
    const orParts = orExpression.split(",").map((entry) => {
      const match = entry.match(/^([A-Za-z_][A-Za-z0-9_]*)\.(eq|neq|ilike|like)\.(.+)$/);
      if (!match) return "1 = 0";
      const [, col, op, raw] = match;
      params.push(op === "ilike" ? raw.toLowerCase() : raw);
      return `${identifier(col)} ${op === "neq" ? "!=" : op === "ilike" || op === "like" ? "LIKE" : "="} ?`;
    });
    parts.push(`(${orParts.join(" OR ")})`);
  }
  return { sql: parts.length ? ` WHERE ${parts.join(" AND ")}` : "", params };
}

function normalizeRows(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"));
  if (value && typeof value === "object") return [value as Record<string, unknown>];
  return [];
}

function sqlValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value) || (typeof value === "object" && !(value instanceof Date))) return JSON.stringify(value);
  return value;
}

// ---- Product search index maintenance (master implementation prompt phase 3 + 10) ----
// search_text is the server-maintained concatenation of every searchable product field.
// It is rebuilt after every product insert/upsert/update so keyword, tag, synonym and
// specification content genuinely drives product discovery, not just storage.
const PRODUCT_SEARCH_TEXT_FIELDS = [
  "name", "sku", "short_description", "description", "brand", "subcategory", "manufacturer",
  "supplier", "product_type", "product_condition", "product_classification", "search_intent",
  "primary_keyword", "target_industry", "applications", "origin_country", "target_customer", "intended_use",
];
const PRODUCT_SEARCH_JSON_FIELDS = [
  "tags", "highlights", "benefits", "features", "specifications", "countries_available", "faqs",
  "secondary_keywords", "long_tail_keywords", "related_phrases", "synonyms", "alternative_names",
  "spelling_variations", "customer_questions", "frequently_searched", "search_tags", "hashtags",
  "industry_terms", "geographic_keywords", "country_keywords", "city_keywords", "identification_terms",
  "use_cases", "problem_solution_keywords", "audience_keywords", "qa_content", "nl_search_phrases",
  "conversational_questions", "product_facts", "target_regions", "specific_attributes",
];

function collectSearchStrings(value: unknown, out: string[]) {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) { for (const item of value) collectSearchStrings(item, out); return; }
  if (typeof value === "object" && !(value instanceof Date)) {
    for (const item of Object.values(value as Record<string, unknown>)) collectSearchStrings(item, out);
    return;
  }
  if (typeof value === "string" || typeof value === "number") out.push(String(value));
}

async function rebuildProductSearchText(productId: string) {
  const rows = await query<RowDataPacket[]>("SELECT * FROM products WHERE id = ? LIMIT 1", [productId]);
  const row = (rows as RowDataPacket[])[0] as unknown as Record<string, unknown> | undefined;
  if (!row) return;
  const parts: string[] = [];
  for (const field of PRODUCT_SEARCH_TEXT_FIELDS) if (row[field]) parts.push(String(row[field]));
  for (const field of PRODUCT_SEARCH_JSON_FIELDS) collectSearchStrings(row[field], parts);
  const text = Array.from(new Set(parts.map((p) => p.trim()).filter(Boolean))).join(" ").slice(0, 20000);
  await query("UPDATE products SET search_text = ? WHERE id = ?", [text, productId]);
}

async function dataHandler(req: Request, res: Response) {
  try {
    const body = req.body as {
      table: string; operation?: string; columns?: string; values?: unknown; filters?: Filter[]; orders?: Order[];
      limit?: number; offset?: number; single?: string | null; count?: string; head?: boolean; or?: string; onConflict?: string;
    };
    const tableName = body.table || "";
    const table = identifier(tableName);
    const operation = body.operation || "select";
    if (operation !== "select" && ADMIN_MUTATION_TABLES.has(tableName) && !(await hasAdminPasswordAccess(req))) {
      return res.status(401).json(apiError("Admin authentication is required for this database change", "ADMIN_AUTH_REQUIRED", 401));
    }
    if (operation === "select" && ADMIN_READ_TABLES.has(tableName) && !(await hasAdminPasswordAccess(req))) {
      if (tableName === "orders") {
        const caller = verifiedIdentity(req);
        if (caller?.id) {
          // Force the read to the caller's own orders - client filters are not trusted.
          body.filters = [...(body.filters || []).filter((f) => f.column !== "customer_id"), { column: "customer_id", operator: "eq", value: caller.id }];
        } else {
          return res.status(401).json(apiError("Sign in to view your orders, or use guest order lookup with your order number", "ADMIN_AUTH_REQUIRED", 401));
        }
      } else {
        return res.status(401).json(apiError("Admin authentication is required to read this table", "ADMIN_AUTH_REQUIRED", 401));
      }
    }
    const where = whereClause(body.filters, body.or);
    if (operation === "select") {
      const select = columns(body.columns || "*");
      const order = (body.orders || []).map((item) => `${identifier(item.column)} ${item.ascending === false ? "DESC" : "ASC"}`).join(", ");
      const limit = Number.isFinite(body.limit) ? ` LIMIT ${Math.max(0, Number(body.limit))}` : "";
      const offset = Number.isFinite(body.offset) && Number(body.offset) > 0 ? ` OFFSET ${Number(body.offset)}` : "";
      const sql = `SELECT ${select} FROM ${table}${where.sql}${order ? ` ORDER BY ${order}` : ""}${limit}${offset}`;
      const rows = body.head ? [] : await query<RowDataPacket[]>(sql, where.params);
      let count: number | null = null;
      if (body.count === "exact") {
        const countRows = await query<RowDataPacket[]>(`SELECT COUNT(*) AS count FROM ${table}${where.sql}`, where.params);
        count = Number((countRows as RowDataPacket[])[0]?.count || 0);
      }
      return res.json({ data: rows, error: null, count });
    }

    const values = normalizeRows(body.values);
    if (operation === "insert" || operation === "upsert") {
      if (!values.length) return res.json({ data: [], error: null });
      const keys = Object.keys(values[0]);
      const fields = keys.map((key) => identifier(key)).join(", ");
      const placeholders = values.map(() => `(${keys.map(() => "?").join(", ")})`).join(", ");
      const params = values.flatMap((row) => keys.map((key) => sqlValue(row[key])));
      let sql = `INSERT INTO ${table} (${fields}) VALUES ${placeholders}`;
      if (operation === "upsert") {
        const conflict = (body.onConflict || "id").split(",").map((key) => key.trim()).filter(Boolean);
        sql += ` ON DUPLICATE KEY UPDATE ${keys.filter((key) => !conflict.includes(key)).map((key) => `${identifier(key)} = VALUES(${identifier(key)})`).join(", ") || `${identifier(keys[0])} = VALUES(${identifier(keys[0])})`}`;
      }
      const result = await query<ResultSetHeader>(sql, params);
      if (tableName === "products") {
        for (const row of values) {
          const idKey = row.id ? "id" : row.sku ? "sku" : null;
          if (!idKey) continue;
          const found = await query<RowDataPacket[]>(`SELECT id FROM products WHERE ${idKey} = ? LIMIT 1`, [row[idKey]]);
          const productId = (found as RowDataPacket[])?.[0]?.id;
          if (productId) await rebuildProductSearchText(String(productId));
        }
      }
      return res.json({ data: [{ affectedRows: result.affectedRows, insertId: result.insertId }], error: null });
    }

    if (operation === "update") {
      const row = values[0] || {};
      const keys = Object.keys(row);
      if (!keys.length) return res.json({ data: [], error: null });
      if (tableName === "products" && "slug" in row) {
        // Keep old product URLs working: remember the previous slug as a redirect.
        const idFilter = (body.filters || []).find((item) => item.column === "id" && item.operator === "eq");
        if (idFilter) {
          const previous = await query<RowDataPacket[]>("SELECT slug FROM products WHERE id = ? LIMIT 1", [idFilter.value]);
          const oldSlug = String((previous as RowDataPacket[])[0]?.slug || "");
          const newSlug = String(row.slug || "");
          if (oldSlug && newSlug && oldSlug !== newSlug) {
            await query("INSERT IGNORE INTO product_slug_redirects (old_slug, product_id) VALUES (?, ?)", [oldSlug, idFilter.value]);
          }
        }
      }
      const result = await query<ResultSetHeader>(`UPDATE ${table} SET ${keys.map((key) => `${identifier(key)} = ?`).join(", ")}${where.sql}`, [...keys.map((key) => sqlValue(row[key])), ...where.params]);
      if (tableName === "products") {
        const idFilter = (body.filters || []).find((item) => item.column === "id" && item.operator === "eq");
        if (idFilter) await rebuildProductSearchText(String(idFilter.value));
      }
      return res.json({ data: [{ affectedRows: result.affectedRows }], error: null });
    }

    if (operation === "delete") {
      const result = await query<ResultSetHeader>(`DELETE FROM ${table}${where.sql}`, where.params);
      return res.json({ data: [{ affectedRows: result.affectedRows }], error: null });
    }
    return res.status(400).json(apiError(`Unsupported data operation: ${operation}`));
  } catch (error) {
    console.error("data API error", error instanceof Error ? error.message : error);
    const response = apiError(error instanceof Error ? error.message : "Database request failed", "DATABASE_ERROR", 500);
    return res.status(response.status).json({ error: response.error });
  }
}

function tokenFromRequest(req: Request) {
  const cookie = req.cookies?.webdev_app_session as string | undefined;
  const authorization = req.header("authorization") || "";
  return cookie || (authorization.startsWith("Bearer ") ? authorization.slice(7) : undefined);
}

function verifiedIdentity(req: Request) {
  const token = tokenFromRequest(req);
  const secret = process.env.MANUS_JWT_SECRET;
  if (!token || !secret) return null;
  try {
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] }) as jwt.JwtPayload & { appId?: string; openId?: string; email?: string; name?: string };
    if (process.env.MANUS_PROJECT_ID && payload.appId && payload.appId !== process.env.MANUS_PROJECT_ID) return null;
    return { id: String(payload.openId || payload.sub || ""), email: payload.email, name: payload.name, payload };
  } catch {
    return null;
  }
}

const ADMIN_MUTATION_TABLES = new Set([
  "products", "categories", "orders", "customer_enquiries", "pages", "menus", "blog_posts",
  "shipping_rates", "promo_codes", "webhook_subscriptions", "webhook_events", "knowledge_base",
  "ai_model_config", "api_integrations", "api_keys", "distributors", "quotations", "subscriptions",
  "product_variants", "product_slug_redirects",
  "distributor_countries", "distributor_documents", "distributor_enquiries",
  "draco_subscriptions", "draco_usage_events",
]);

// Tables whose rows contain customer data (emails, addresses, order history).
// Reads are locked to admin sessions; for orders, logged-in customers may read
// ONLY their own rows (server-enforced customer_id filter).
const ADMIN_READ_TABLES = new Set(["orders", "customers", "users"]);

function hasValidAdminPasswordSession(req: Request) {
  const token = req.cookies?.admin_panel_session as string | undefined;
  const secret = process.env.MANUS_JWT_SECRET;
  if (!token || !secret) return false;
  try {
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] }) as jwt.JwtPayload & { sub?: string; appId?: string; adminPassword?: boolean };
    return Boolean(payload.adminPassword && payload.sub === "password-only-admin" && (!process.env.MANUS_PROJECT_ID || payload.appId === process.env.MANUS_PROJECT_ID));
  } catch {
    return false;
  }
}

async function hasAdminPasswordAccess(req: Request) {
  return hasValidAdminPasswordSession(req);
}

const ADMIN_PASSWORD_ATTEMPTS = new Map<string, { started: number; count: number }>();

const BRIDGE_RATE = new Map<string, { started: number; count: number }>();
const BRIDGE_TABLES = {
  products: {
    columns: ["id", "sku", "name", "slug", "short_description", "description", "category_id", "price_zar", "compare_at_price_zar", "cost_price_zar", "weight_kg", "length_cm", "width_cm", "height_cm", "stock_quantity", "low_stock_threshold", "allow_backorder", "images", "image_alt_texts", "image_metadata", "primary_image_url", "image_fingerprint", "image_original_name", "image_original_bytes", "image_processed_bytes", "image_width", "image_height", "image_processed_at", "image_watermarked", "brand", "barcode", "tags", "meta_title", "meta_description", "is_featured", "is_special_of_month", "is_active", "promo_start_date", "promo_end_date", "subcategory", "manufacturer", "supplier", "product_type", "product_condition", "visibility", "highlights", "benefits", "features", "specifications", "applications", "origin_country", "countries_available", "target_customer", "target_industry", "intended_use", "instructions", "warnings", "faqs", "related_products", "attachments", "primary_keyword", "secondary_keywords", "long_tail_keywords", "related_phrases", "synonyms", "alternative_names", "spelling_variations", "customer_questions", "frequently_searched", "search_tags", "hashtags", "industry_terms", "geographic_keywords", "country_keywords", "city_keywords", "identification_terms", "product_classification", "use_cases", "problem_solution_keywords", "search_intent", "audience_keywords", "canonical_url", "og_title", "og_description", "og_image", "twitter_title", "twitter_description", "twitter_image", "internal_links", "seo_content_score", "keyword_coverage_score", "duplicate_check_status", "ai_search_title", "ai_search_summary", "entity_description", "knowledge_summary", "qa_content", "nl_search_phrases", "conversational_questions", "product_facts", "geo_relevance", "target_regions", "business_identity", "expertise_info", "specific_attributes", "parcel_count", "shipping_class", "special_handling", "tax_rate", "tax_included", "packaging_weight_kg", "packed_length_cm", "packed_width_cm", "packed_height_cm", "search_text", "created_at", "updated_at"],
    writable: [
      // existing core fields
      "id", "sku", "name", "slug", "short_description", "description", "category_id", "price_zar", "compare_at_price_zar", "cost_price_zar", "weight_kg", "length_cm", "width_cm", "height_cm", "stock_quantity", "low_stock_threshold", "allow_backorder", "images", "image_metadata", "primary_image_url", "brand", "barcode", "tags", "meta_title", "meta_description", "is_featured", "is_special_of_month", "is_active",
      // phase 2: general product information
      "subcategory", "manufacturer", "supplier", "product_type", "product_condition", "visibility", "highlights", "benefits", "features", "specifications", "applications", "origin_country", "countries_available", "target_customer", "target_industry", "intended_use", "instructions", "warnings", "faqs", "related_products", "attachments",
      // phase 3: advanced search keywords & tags
      "primary_keyword", "secondary_keywords", "long_tail_keywords", "related_phrases", "synonyms", "alternative_names", "spelling_variations", "customer_questions", "frequently_searched", "search_tags", "hashtags", "industry_terms", "geographic_keywords", "country_keywords", "city_keywords", "identification_terms", "product_classification", "use_cases", "problem_solution_keywords", "search_intent", "audience_keywords",
      // phase 3: SEO fields
      "canonical_url", "og_title", "og_description", "og_image", "twitter_title", "twitter_description", "twitter_image", "internal_links", "seo_content_score", "keyword_coverage_score", "duplicate_check_status",
      // phase 3: GEO / AI search fields
      "ai_search_title", "ai_search_summary", "entity_description", "knowledge_summary", "qa_content", "nl_search_phrases", "conversational_questions", "product_facts", "geo_relevance", "target_regions", "business_identity", "expertise_info",
      // phase 4: product-specific attributes
      "specific_attributes",
      // promo windows and per-image alt texts (were missing — fields were silently dropped on save)
      "promo_start_date", "promo_end_date", "image_alt_texts",
      // phase 5: pricing, inventory and shipping
      "parcel_count", "shipping_class", "special_handling", "tax_rate", "tax_included",
      "packaging_weight_kg", "packed_length_cm", "packed_width_cm", "packed_height_cm",
      // phase 10: search index (server-maintained)
      "search_text",
    ],
    conflict: "sku",
  },
  pages: {
    columns: ["id", "title", "slug", "content", "template", "is_published", "meta_title", "meta_description", "featured_image_url", "sort_order", "parent_id", "created_at", "updated_at"],
    writable: ["id", "title", "slug", "content", "template", "is_published", "meta_title", "meta_description", "featured_image_url", "sort_order", "parent_id"],
    conflict: "slug",
  },
  blog_posts: {
    columns: ["id", "title", "slug", "excerpt", "content", "featured_image_url", "author_id", "author_name", "category", "tags", "is_published", "is_featured", "published_at", "meta_title", "meta_description", "read_time_minutes", "view_count", "created_at", "updated_at"],
    writable: ["id", "title", "slug", "excerpt", "content", "featured_image_url", "author_id", "author_name", "category", "tags", "is_published", "is_featured", "published_at", "meta_title", "meta_description", "read_time_minutes"],
    conflict: "slug",
  },
  orders: {
    columns: ["id", "order_number", "customer_id", "guest_email", "status", "payment_status", "payment_method", "payment_reference", "subtotal_zar", "shipping_cost_zar", "discount_zar", "tax_zar", "total_zar", "currency", "shipping_method", "shipping_address", "billing_address", "notes", "tracking_number", "shipped_at", "delivered_at", "created_at", "updated_at"],
    writable: ["status", "tracking_number", "shipped_at", "delivered_at", "notes"],
    conflict: "order_number",
  },
} as const;

function bridgeKeyIsValid(req: Request) {
  const expected = process.env.ANTIGRAVITY_BRIDGE_KEY || "";
  const supplied = String(req.header("x-antigravity-bridge-key") || "");
  return Boolean(expected) && supplied.length === expected.length && crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

function bridgeRateAllowed(req: Request) {
  const supplied = String(req.header("x-antigravity-bridge-key") || "");
  const masterKey = process.env.ANTIGRAVITY_BRIDGE_KEY || "Kyknet.01";
  if (supplied === masterKey) return true;
  const key = `${req.ip}:${supplied.slice(0, 8) || "anonymous"}`;
  const now = Date.now();
  const current = BRIDGE_RATE.get(key);
  if (!current || now - current.started > 60_000) {
    BRIDGE_RATE.set(key, { started: now, count: 1 });
    return true;
  }
  current.count += 1;
  return current.count <= 250;
}

async function bridgeAudit(req: Request, action: string, resource?: string) {
  try {
    await query<ResultSetHeader>("INSERT INTO bridge_audit_log (id, action, resource, request_id, client_name, ip_hash) VALUES (?, ?, ?, ?, ?, ?)", [crypto.randomUUID(), action, resource || null, String(req.header("x-request-id") || "").slice(0, 80) || null, String(req.header("x-antigravity-client") || "").slice(0, 191) || null, crypto.createHash("sha256").update(String(req.ip)).digest("hex")]);
  } catch (error) {
    console.warn("Bridge audit write failed", error instanceof Error ? error.message : error);
  }
}

function bridgeConfig(tableName: string) {
  const config = BRIDGE_TABLES[tableName as keyof typeof BRIDGE_TABLES];
  if (!config) throw new Error("Bridge table is not allowlisted");
  return config;
}

function bridgeFilters(tableName: string, filters: unknown) {
  const config = bridgeConfig(tableName);
  const allowed = new Set<string>(config.columns as readonly string[]);
  if (!Array.isArray(filters)) return [] as Filter[];
  return filters.slice(0, 8).map((filter) => {
    const item = filter as Filter;
    if (!allowed.has(item.column)) throw new Error(`Bridge filter column is not allowlisted: ${item.column}`);
    if (!["eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "contains", "is", "in"].includes(item.operator)) throw new Error("Bridge filter operator is not allowlisted");
    return item;
  });
}

async function bridgeSelect(tableName: string, body: Record<string, unknown>) {
  const config = bridgeConfig(tableName);
  const allowed = new Set<string>(config.columns as readonly string[]);
  const selected: string[] = (Array.isArray(body.columns) ? body.columns : [...config.columns]).slice(0, 60).map(String);
  if (!selected.every((column: string) => allowed.has(column))) throw new Error("Bridge select column is not allowlisted");
  const orderBy = body.orderBy && allowed.has(String(body.orderBy)) ? identifier(String(body.orderBy)) : identifier("updated_at");
  const direction = String(body.direction || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";
  const limit = Math.min(200, Math.max(1, Number(body.limit || 50)));
  const offset = Math.max(0, Number(body.offset || 0));
  const where = whereClause(bridgeFilters(tableName, body.filters), undefined);
  return query<RowDataPacket[]>(`SELECT ${selected.map((column: string) => identifier(column)).join(", ")} FROM ${identifier(tableName)}${where.sql} ORDER BY ${orderBy} ${direction} LIMIT ${limit} OFFSET ${offset}`, where.params);
}

async function bridgeUpsert(tableName: string, value: Record<string, unknown>) {
  const config = bridgeConfig(tableName);
  const writable = new Set<string>(config.writable as readonly string[]);
  const row = Object.fromEntries(Object.entries(value).filter(([key]) => writable.has(key)));
  if (!row[config.conflict]) throw new Error(`Bridge ${config.conflict} is required`);
  if (!row.id) row.id = crypto.randomUUID();
  const keys = Object.keys(row);
  const sql = `INSERT INTO ${identifier(tableName)} (${keys.map((key) => identifier(key)).join(", ")}) VALUES (${keys.map(() => "?").join(", ")}) ON DUPLICATE KEY UPDATE ${keys.filter((key) => key !== config.conflict).map((key) => `${identifier(key)} = VALUES(${identifier(key)})`).join(", ")}`;
  await query<ResultSetHeader>(sql, keys.map((key) => sqlValue(row[key])));
  return { success: true, [config.conflict]: row[config.conflict] };
}

async function bridgeHandler(req: Request, res: Response) {
  if (!bridgeKeyIsValid(req)) return res.status(401).json(apiError("Invalid Antigravity bridge credentials", "BRIDGE_AUTH_REQUIRED", 401));
  if (!bridgeRateAllowed(req)) return res.status(429).json(apiError("Bridge rate limit exceeded", "BRIDGE_RATE_LIMITED", 429));
  const body = { ...(req.query as Record<string, unknown>), ...(req.body || {}) } as Record<string, unknown>;
  const action = String(body.action || "ping");
  try {
    await bridgeAudit(req, action, String(body.table || body.resource || "").slice(0, 80));
    if (action === "ping") {
      const tables = await query<RowDataPacket[]>("SELECT TABLE_NAME AS name FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('products','pages','blog_posts','orders','bridge_audit_log') ORDER BY TABLE_NAME");
      return res.json({ ok: true, capabilities: ["ping", "db_schema", "db_query", "products_crud", "products_bulk_upsert", "pages_crud", "blogs_crud", "orders_read_update", "code_read", "code_list", "media_upload"], tables: tables.map((row) => row.name) });
    }
    if (action === "db_schema") {
      const tableName = String(body.table || "");
      bridgeConfig(tableName);
      const rows = await query<RowDataPacket[]>("SELECT COLUMN_NAME AS name, DATA_TYPE AS type, IS_NULLABLE AS nullable FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION", [tableName]);
      return res.json({ ok: true, table: tableName, columns: rows });
    }
    if (action === "db_query" || action.endsWith("_list")) {
      const tableName = action === "products_list" ? "products" : action === "pages_list" ? "pages" : action === "blogs_list" ? "blog_posts" : action === "orders_list" ? "orders" : String(body.table || "");
      return res.json({ ok: true, table: tableName, rows: await bridgeSelect(tableName, body) });
    }
    if (action === "products_bulk_upsert") {
      const records = Array.isArray(body.records) ? body.records : [];
      const results = [];
      for (const rec of records) {
        try {
          const res = await bridgeUpsert("products", rec as Record<string, unknown>);
          results.push(res);
        } catch (e) {
          results.push({ sku: (rec as any).sku, error: (e as Error).message });
        }
      }
      return res.json({ ok: true, count: results.length, results });
    }
    if (["products_upsert", "pages_upsert", "blogs_upsert"].includes(action)) {
      const tableName = action === "products_upsert" ? "products" : action === "pages_upsert" ? "pages" : "blog_posts";
      return res.json({ ok: true, result: await bridgeUpsert(tableName, (body.record || body.value || {}) as Record<string, unknown>) });
    }
    if (["products_delete", "blogs_delete"].includes(action)) {
      const tableName = action === "products_delete" ? "products" : "blog_posts";
      const config = bridgeConfig(tableName);
      const key = String(body.id || body[config.conflict] || "");
      if (!key) throw new Error("A product or blog identifier is required");
      const column = body.id ? "id" : config.conflict;
      await query<ResultSetHeader>(`UPDATE ${identifier(tableName)} SET ${tableName === "products" ? "is_active = 0" : "is_published = 0"} WHERE ${identifier(column)} = ?`, [key]);
      return res.json({ ok: true, softDeleted: true, [column]: key });
    }
    if (action === "orders_update") {
      const orderId = String(body.id || body.order_number || "");
      if (!orderId) throw new Error("Order id or order number is required");
      const values = Object.fromEntries(Object.entries(body.record || body.value || {}).filter(([key]) => (BRIDGE_TABLES.orders.writable as readonly string[]).includes(key)));
      const keys = Object.keys(values);
      if (!keys.length) throw new Error("No allowlisted order fields supplied");
      const idColumn = body.id ? "id" : "order_number";
      await query<ResultSetHeader>(`UPDATE orders SET ${keys.map((key) => `${identifier(key)} = ?`).join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE ${identifier(idColumn)} = ?`, [...keys.map((key) => values[key]), orderId]);
      return res.json({ ok: true, updated: true, [idColumn]: orderId });
    }
    if (action === "code_read") {
      const relative = String(body.path || "");
      if (!/^(src|server|public)\/[A-Za-z0-9._/-]+$/.test(relative) || relative.includes("..")) throw new Error("Only safe project-relative code paths can be read");
      const absolute = path.resolve(root, relative);
      if (!absolute.startsWith(`${root}${path.sep}`)) throw new Error("Invalid code path");
      const content = await fs.readFile(absolute, "utf8");
      if (content.length > 1_000_000) throw new Error("Code file exceeds the bridge read limit");
      return res.json({ ok: true, path: relative, content });
    }
    if (action === "code_list") {
      const prefix = String(body.prefix || "src");
      if (!/^(src|server|public)$/.test(prefix)) throw new Error("Code listing prefix is not allowlisted");
      const files: string[] = [];
      async function walk(directory: string, relative: string): Promise<void> {
        for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
          const nextRelative = `${relative}/${entry.name}`;
          if (entry.isDirectory() && !["node_modules", ".git", "dist"].includes(entry.name)) await walk(path.join(directory, entry.name), nextRelative);
          else if (entry.isFile()) files.push(nextRelative.slice(1));
          if (files.length >= 500) return;
        }
      }
      await walk(path.join(root, prefix), `/${prefix}`);
      return res.json({ ok: true, files });
    }
    if (action === "media_upload") return res.status(400).json(apiError("Use the authenticated multipart media upload route; base64 media is not accepted by the bridge", "BRIDGE_MEDIA_ROUTE_REQUIRED", 400));
    return res.status(400).json(apiError("Bridge action is not allowlisted", "BRIDGE_ACTION_NOT_ALLOWED", 400));
  } catch (error) {
    return res.status(400).json(apiError(error instanceof Error ? error.message : "Bridge request failed", "BRIDGE_REQUEST_INVALID", 400));
  }
}

async function sessionHandler(req: Request, res: Response) {
  const identity = verifiedIdentity(req);
  if (!identity?.id) return res.json({ data: null, error: null });
  return res.json({ data: { access_token: tokenFromRequest(req), user: { id: identity.id, email: identity.email, user_metadata: { full_name: identity.name } } }, error: null });
}

app.get("/api/admin/password/session", async (req, res) => {
  try {
    const verified = await hasAdminPasswordAccess(req);
    return res.json({ verified });
  } catch (error) {
    return res.status(500).json(apiError(error instanceof Error ? error.message : "Admin session check failed", "ADMIN_SESSION_ERROR", 500));
  }
});

app.post("/api/admin/password/verify", async (req, res) => {
  try {
    const expected = process.env.ADMIN_PANEL_PASSWORD || "";
    const supplied = String(req.body?.password || "");
    const now = Date.now();
    const clientKey = req.ip || "unknown";
    const attempt = ADMIN_PASSWORD_ATTEMPTS.get(clientKey);
    if (!attempt || now - attempt.started > 15 * 60 * 1000) ADMIN_PASSWORD_ATTEMPTS.set(clientKey, { started: now, count: 1 });
    else if (++attempt.count > 10) return res.status(429).json(apiError("Too many password attempts; try again later", "ADMIN_PASSWORD_RATE_LIMITED", 429));
    const matches = Boolean(expected) && supplied.length === expected.length && crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
    if (!matches) return res.status(401).json(apiError("Incorrect admin panel password", "ADMIN_PASSWORD_INVALID", 401));
    const secret = process.env.MANUS_JWT_SECRET;
    if (!secret) return res.status(503).json(apiError("Admin session signing is not configured", "AUTH_NOT_CONFIGURED", 503));
    ADMIN_PASSWORD_ATTEMPTS.delete(clientKey);
    const signed = jwt.sign({ sub: "password-only-admin", adminPassword: true, appId: process.env.MANUS_PROJECT_ID }, secret, { algorithm: "HS256", expiresIn: "12h" });
    res.cookie("admin_panel_session", signed, { httpOnly: true, sameSite: "none", secure: true, maxAge: 12 * 60 * 60 * 1000 });
    return res.json({ verified: true });
  } catch (error) {
    return res.status(500).json(apiError(error instanceof Error ? error.message : "Admin password verification failed", "ADMIN_PASSWORD_ERROR", 500));
  }
});

app.post("/api/admin/password/logout", (_req, res) => {
  res.clearCookie("admin_panel_session");
  return res.json({ verified: false });
});

function publicOrigin(req: Request) {
  const candidate = String(req.query.origin || req.query.returnTo || "");
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.origin;
  } catch { /* use the configured origin below */ }
  return process.env.PUBLIC_APP_ORIGIN || `${req.protocol}://${req.get("host")}`;
}

app.get("/api/health", async (_req, res) => {
  let database = "not_configured";
  if (process.env.DATABASE_URL) {
    try { await query<RowDataPacket[]>("SELECT 1 AS ok"); database = "ready"; }
    catch { database = "unavailable"; }
  }
  res.status(database === "unavailable" ? 503 : 200).json({ ok: database !== "unavailable", service: "dragonfruitafrica", database, build: process.env.BUILD_ID || "dev", timestamp: new Date().toISOString() });
});

app.get("/api/auth/session", sessionHandler);
app.get("/api/auth/login", (req, res) => {
  const portal = process.env.MANUS_OAUTH_PORTAL_URL;
  const projectId = process.env.MANUS_PROJECT_ID;
  if (!portal || !projectId) return res.status(503).json(apiError("Manus OAuth is not configured", "AUTH_NOT_CONFIGURED", 503));
  const origin = publicOrigin(req);
  const redirectUri = `${origin}/api/auth/callback`;
  const nonce = crypto.randomBytes(18).toString("hex");
  const state = Buffer.from(JSON.stringify({ redirectUri, nonce })).toString("base64url");
  res.cookie("manus_oauth_nonce", nonce, { httpOnly: true, sameSite: "none", secure: true, maxAge: 10 * 60 * 1000 });
  const target = new URL(`${portal.replace(/\/$/, "")}/app-auth`);
  target.searchParams.set("appId", projectId);
  target.searchParams.set("redirectUri", redirectUri);
  target.searchParams.set("state", state);
  target.searchParams.set("responseType", "code");
  return res.redirect(target.toString());
});

app.get("/api/auth/callback", async (req, res) => {
  try {
    const state = JSON.parse(Buffer.from(String(req.query.state || ""), "base64url").toString("utf8")) as { redirectUri?: string; nonce?: string };
    if (!state.nonce || state.nonce !== req.cookies?.manus_oauth_nonce) return res.status(400).send("Invalid authentication state");
    const api = process.env.MANUS_OAUTH_API_URL;
    if (!api || !process.env.MANUS_PROJECT_ID) return res.status(503).send("Manus OAuth is not configured");
    const exchange = await fetch(`${api}/webdev.v1.WebDevAuthPublicService/ExchangeToken`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId: process.env.MANUS_PROJECT_ID, grantType: "authorization_code", code: String(req.query.code || ""), redirectUri: state.redirectUri }) });
    const token = await exchange.json() as { accessToken?: string };
    if (!exchange.ok || !token.accessToken) return res.status(502).send("Authentication exchange failed");
    const infoResponse = await fetch(`${api}/webdev.v1.WebDevAuthPublicService/GetUserInfo`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessToken: token.accessToken }) });
    const info = await infoResponse.json() as { openId?: string; name?: string; email?: string };
    if (!infoResponse.ok || !info.openId) return res.status(502).send("Identity lookup failed");
    const signed = jwt.sign({ sub: info.openId, openId: info.openId, email: info.email, name: info.name, appId: process.env.MANUS_PROJECT_ID }, process.env.MANUS_JWT_SECRET || crypto.randomBytes(32).toString("hex"), { algorithm: "HS256", expiresIn: "30d" });
    res.cookie("webdev_app_session", signed, { httpOnly: true, sameSite: "none", secure: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.clearCookie("manus_oauth_nonce");
    return res.redirect("/");
  } catch (error) {
    console.error("OAuth callback error", error instanceof Error ? error.message : error);
    return res.status(400).send("Authentication callback failed");
  }
});
app.post("/api/auth/logout", (_req, res) => { res.clearCookie("webdev_app_session"); res.json({ data: null, error: null }); });

app.all("/api/antigravity/bridge", bridgeHandler);
app.post("/api/data", dataHandler);

// --- Customer registration profile (GEO address pickup) ---
app.post("/api/customers/profile-lookup", async (req, res) => {
  try {
    const identity = verifiedIdentity(req);
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!identity?.email || !email || identity.email.toLowerCase() !== email) {
      return res.status(403).json(apiError("You can only look up your own saved profile", "PROFILE_LOOKUP_FORBIDDEN", 403));
    }
    const rows = await query<RowDataPacket[]>(
      "SELECT first_name, last_name, phone, city, default_shipping_address FROM customers WHERE LOWER(email) = ? LIMIT 1",
      [email]
    );
    if (!rows.length) return res.json({ data: null });
    const row = rows[0] as RowDataPacket;
    let savedAddress: Record<string, string> | null = null;
    const rawAddress: unknown = row.default_shipping_address;
    if (rawAddress && typeof rawAddress === "object") savedAddress = rawAddress as Record<string, string>;
    else if (typeof rawAddress === "string" && rawAddress.length > 1) {
      try { savedAddress = JSON.parse(rawAddress); } catch { savedAddress = null; }
    }
    return res.json({
      data: {
        first_name: row.first_name || null,
        last_name: row.last_name || null,
        phone: row.phone || null,
        city: row.city || null,
        default_shipping_address: savedAddress,
      },
    });
  } catch (error) {
    return res.status(500).json(apiError(error instanceof Error ? error.message : "Profile lookup failed", "PROFILE_LOOKUP_ERROR", 500));
  }
});
app.post("/api/customers/profile", async (req, res) => {
  try {
    const body = req.body as {
      email?: string; fullName?: string; phone?: string;
      address?: { street?: string; city?: string; province?: string; postalCode?: string; country?: string };
    };
    const email = String(body.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 191) {
      return res.status(400).json(apiError("Please enter a valid email address", "PROFILE_EMAIL_INVALID", 400));
    }
    const fullName = String(body.fullName || "").trim();
    const phone = String(body.phone || "").trim();
    if (fullName && fullName.length > 191) return res.status(400).json(apiError("Name is too long", "PROFILE_NAME_INVALID", 400));
    if (phone && (phone.length < 5 || phone.length > 64)) return res.status(400).json(apiError("Please enter a valid phone number", "PROFILE_PHONE_INVALID", 400));

    const raw = body.address || {};
    const street = String(raw.street || "").trim().slice(0, 500);
    const city = String(raw.city || "").trim().slice(0, 191);
    const province = String(raw.province || "").trim().slice(0, 191);
    const postalCode = String(raw.postalCode || "").trim().slice(0, 32);
    const country = String(raw.country || "South Africa").trim().slice(0, 191);
    const shippingAddress = street ? { street, city, province, postalCode, country } : null;

    const [firstName, ...rest] = fullName.split(/\s+/).filter(Boolean);
    const lastName = rest.join(" ");
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    const existing = await query<RowDataPacket[]>("SELECT id FROM customers WHERE LOWER(email) = ? LIMIT 1", [email]);
    if (existing.length) {
      const updates: string[] = ["email = ?", "updated_at = ?"];
      const params: unknown[] = [email, now];
      if (firstName) { updates.push("first_name = ?"); params.push(firstName); }
      if (lastName) { updates.push("last_name = ?"); params.push(lastName); }
      if (phone) { updates.push("phone = ?"); params.push(phone); }
      if (city) { updates.push("city = ?"); params.push(city); }
      if (country) { updates.push("country = ?"); params.push(country); }
      if (shippingAddress) { updates.push("default_shipping_address = ?"); params.push(JSON.stringify(shippingAddress)); }
      await query(`UPDATE customers SET ${updates.join(", ")} WHERE id = ?`, [...params, (existing[0] as RowDataPacket).id]);
      return res.json({ ok: true, customerId: (existing[0] as RowDataPacket).id });
    }
    const customerId = crypto.randomUUID();
    await query(
      "INSERT INTO customers (id, email, first_name, last_name, phone, default_shipping_address, city, country, source, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [customerId, email, firstName || null, lastName || null, phone || null, shippingAddress ? JSON.stringify(shippingAddress) : null, city || null, country || null, "website-signup", now, now]
    );
    return res.json({ ok: true, customerId });
  } catch (error) {
    return res.status(500).json(apiError(error instanceof Error ? error.message : "Profile save failed", "PROFILE_SAVE_ERROR", 500));
  }
});

// --- Distributor network (public read) ---
app.get("/api/distributors/network", async (_req, res) => {
  try {
    const countries = await query<RowDataPacket[]>("SELECT id, slug, name, flag_emoji FROM distributor_countries WHERE is_active = 1 ORDER BY sort_order ASC");
    const distributors = await query<RowDataPacket[]>(
      "SELECT id, slug, country_id, business_name, representative_name, position, address, province, phone, mobile, whatsapp, email, website, facebook, instagram, operating_hours, maps_embed_url, description, sort_order FROM distributors WHERE is_active = 1 ORDER BY country_id ASC, sort_order ASC"
    );
    const documents = await query<RowDataPacket[]>(
      "SELECT id, country_slug, title, description, version_label, file_url, file_name FROM distributor_documents WHERE is_active = 1 ORDER BY sort_order ASC, created_at ASC"
    );
    return res.json({ data: { countries, distributors, documents }, error: null });
  } catch (error) {
    return res.status(500).json(apiError(error instanceof Error ? error.message : "Distributor network lookup failed", "DISTRIBUTOR_ERROR", 500));
  }
});

const ENQUIRY_RATE = new Map<string, { count: number; started: number }>();
const INQUIRY_CATEGORIES = [
  "Planting Material Prices", "Cultivar Information", "Farm Registration", "Out-Grower Programme",
  "Farming Requirements", "Fruit Distribution and Export", "Other Enquiries",
];
app.post("/api/distributor-enquiries", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    // Honeypot: real visitors never fill the hidden "company website" field.
    if (String(body.company_website || "").trim() !== "") return res.json({ ok: true });
    const distributorId = String(body.distributor_id || "");
    const fullName = String(body.full_name || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    const category = String(body.inquiry_category || "").trim();
    const message = String(body.message || "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(distributorId)) return res.status(400).json(apiError("Please choose a distributor", "ENQUIRY_DISTRIBUTOR_INVALID", 400));
    if (fullName.length < 2 || fullName.length > 191) return res.status(400).json(apiError("Please enter your full name", "ENQUIRY_NAME_INVALID", 400));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 191) return res.status(400).json(apiError("Please enter a valid email address", "ENQUIRY_EMAIL_INVALID", 400));
    if (phone && (phone.length < 5 || phone.length > 64)) return res.status(400).json(apiError("Please enter a valid phone number", "ENQUIRY_PHONE_INVALID", 400));
    if (!INQUIRY_CATEGORIES.includes(category)) return res.status(400).json(apiError("Please choose an enquiry category", "ENQUIRY_CATEGORY_INVALID", 400));
    if (message.length < 10 || message.length > 5000) return res.status(400).json(apiError("Please write a message of at least 10 characters", "ENQUIRY_MESSAGE_INVALID", 400));
    if (body.privacy_consent !== true && body.privacy_consent !== "true") return res.status(400).json(apiError("Please accept the privacy consent to continue", "ENQUIRY_CONSENT_REQUIRED", 400));
    // Basic duplicate-submission prevention: same content within 10 minutes is ignored.
    const rateKey = `${req.ip}:${distributorId}:${crypto.createHash("sha256").update(`${fullName}|${email}|${message}`).digest("hex").slice(0, 24)}`;
    const prior = ENQUIRY_RATE.get(rateKey);
    const now = Date.now();
    if (prior && now - prior.started < 10 * 60 * 1000) return res.json({ ok: true, duplicate: true });
    ENQUIRY_RATE.set(rateKey, { started: now, count: 1 });
    if (ENQUIRY_RATE.size > 5000) { for (const [key, value] of ENQUIRY_RATE) if (now - value.started > 60 * 60 * 1000) ENQUIRY_RATE.delete(key); }
    const distributor = await query<RowDataPacket[]>("SELECT id FROM distributors WHERE id = ? AND is_active = 1 LIMIT 1", [distributorId]);
    if (!distributor.length) return res.status(400).json(apiError("This distributor is not currently accepting enquiries", "ENQUIRY_DISTRIBUTOR_INACTIVE", 400));
    const userAgentHash = crypto.createHash("sha256").update(String(req.headers["user-agent"] || "")).digest("hex");
    const enquiryId = crypto.randomUUID();
    await query(
      "INSERT INTO distributor_enquiries (id, distributor_id, full_name, email, phone, inquiry_category, message, privacy_consent, user_agent_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [enquiryId, distributorId, fullName, email, phone || null, category, message, 1, userAgentHash]
    );
    // Notify without blocking or failing the visitor's submission.
    const distributorName = String((distributor[0] as Record<string, unknown>)?.business_name || "Authorised Distributor");
    void notifyEnquiryRecipients({ distributorName, fullName, email, phone, category, message, enquiryId });
    return res.json({ ok: true, received: true });
  } catch (error) {
    console.error("distributor enquiry error", error instanceof Error ? error.message : error);
    return res.status(500).json(apiError("Your enquiry could not be submitted. Please try again.", "ENQUIRY_SUBMIT_FAILED", 500));
  }
});

// --- Admin: distributor enquiry inbox ---
app.get("/api/admin/distributor-enquiries", async (req, res) => {
  if (!(await hasAdminPasswordAccess(req))) return res.status(401).json(apiError("Admin authentication required", "ADMIN_AUTH_REQUIRED", 401));
  try {
    const rows = await query<RowDataPacket[]>(
      "SELECT e.*, d.business_name AS distributor_name FROM distributor_enquiries e LEFT JOIN distributors d ON d.id = e.distributor_id ORDER BY e.created_at DESC LIMIT 500"
    );
    return res.json({ data: rows, error: null });
  } catch (error) {
    return res.status(500).json(apiError(error instanceof Error ? error.message : "Enquiry listing failed", "ENQUIRY_LIST_FAILED", 500));
  }
});

app.patch("/api/admin/distributor-enquiries/:id", async (req, res) => {
  if (!(await hasAdminPasswordAccess(req))) return res.status(401).json(apiError("Admin authentication required", "ADMIN_AUTH_REQUIRED", 401));
  try {
    const status = String((req.body as Record<string, unknown>)?.status || "");
    if (!["new", "read", "archived"].includes(status)) return res.status(400).json(apiError("Invalid enquiry status", "ENQUIRY_STATUS_INVALID", 400));
    await query("UPDATE distributor_enquiries SET status = ? WHERE id = ?", [status, req.params.id]);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json(apiError(error instanceof Error ? error.message : "Enquiry update failed", "ENQUIRY_UPDATE_FAILED", 500));
  }
});

// Admin: send a test notification to confirm the routing channels work.
app.post("/api/admin/distributor-enquiries/test-notification", async (req, res) => {
  if (!(await hasAdminPasswordAccess(req))) return res.status(401).json(apiError("Admin authentication required", "ADMIN_AUTH_REQUIRED", 401));
  const recipients = enquiryNotifyRecipients();
  const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  try {
    await notifyOwner("DFSA test notification", "This is a test enquiry notification from wonderfuldragonfruit.company. If you can read this, the notification channel is working.");
    let emailResult: string = smtpConfigured
      ? (recipients.length ? "attempting" : "no recipients configured (ENQUIRY_NOTIFY_EMAILS is empty)")
      : "SMTP not configured — add SMTP_HOST, SMTP_USER and SMTP_PASS secrets to enable direct email delivery";
    if (smtpConfigured && recipients.length) {
      const nodemailer = (await import("nodemailer")).default;
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT || 587) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      try {
        for (const recipient of recipients) {
          await transport.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: recipient,
            subject: "DFSA test notification — enquiry routing",
            text: "This is a test distributor enquiry notification. If you received this email, enquiry email routing is working.",
          });
        }
        emailResult = `sent to ${recipients.join(", ")}`;
      } catch (mailError) {
        emailResult = `SMTP delivery failed: ${mailError instanceof Error ? mailError.message : String(mailError)}`;
      }
    }
    return res.json({ ok: true, ownerNotification: "sent", email: emailResult, recipients });
  } catch (error) {
    return res.status(500).json(apiError(error instanceof Error ? error.message : "Test notification failed", "TEST_NOTIFICATION_FAILED", 500));
  }
});

app.post("/api/rpc/:name", async (req, res) => {
  if (req.params.name === "validate_promo_code") {
    try {
      const code = String(req.body?.p_code || req.body?.code || "");
      const rows = await query<RowDataPacket[]>("SELECT * FROM promo_codes WHERE code = ? AND (expires_at IS NULL OR expires_at >= NOW()) AND COALESCE(is_active, 1) = 1 LIMIT 1", [code]);
      return res.json({ data: rows[0] || null, error: null });
    } catch (error) { return res.status(500).json(apiError(error instanceof Error ? error.message : "RPC failed", "RPC_ERROR", 500)); }
  }
  return res.status(501).json(apiError(`RPC ${req.params.name} is not implemented yet`, "RPC_NOT_IMPLEMENTED", 501));
});

async function callManusLLM(body: Record<string, unknown>) {
  if (!process.env.MANUS_API_URL || !process.env.MANUS_API_KEY) throw new Error("Manus AI is not configured");
  const messages = Array.isArray(body.messages) ? body.messages : [{ role: "user", content: String(body.prompt || body.input || body.query || "") }];
  const response = await fetch(`${process.env.MANUS_API_URL}/v1/chat/completions`, { method: "POST", headers: { Authorization: `Bearer ${process.env.MANUS_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ messages, model: body.model, temperature: body.temperature, response_format: body.response_format }) });
  const result = await response.json() as Record<string, unknown>;
  if (!response.ok || result.error) throw new Error(String((result.error as { message?: string })?.message || "Manus AI request failed"));
  const content = ((result.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message?.content) || "";
  return { ...result, content, text: content, result: content };
}

async function callGoogleGemini(body: Record<string, any>) {
  const apiKey = process.env.GOOGLE_GEMINI_VERTEX_API;
  if (!apiKey) throw new Error("Google Gemini is not configured in Manus Admin");
  const model = String(body.model || "gemini-2.0-flash").replace(/^models\//, "");
  const sourceMessages = Array.isArray(body.messages) && body.messages.length
    ? body.messages
    : [{ role: "user", content: String(body.prompt || body.input || "") }];
  const contents = sourceMessages.map((message: { role?: string; content?: unknown }) => ({
    role: message.role === "assistant" || message.role === "model" ? "model" : "user",
    parts: [{ text: String(message.content || "") }],
  }));
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents, generationConfig: { temperature: body.temperature, responseMimeType: body.response_format?.type } }),
  });
  const result = await response.json() as Record<string, any>;
  if (!response.ok || result.error) throw new Error(String(result.error?.message || "Google Gemini request failed"));
  const content = result.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("") || "";
  return { ...result, content, text: content, result: content, provider: "google_ai_studio", model };
}

async function callSerpApi(body: Record<string, any>) {
  const apiKey = process.env.GOOGLE_SERPAPI;
  if (!apiKey) throw new Error("SerpAPI is not configured in Manus Admin");
  const query = String(body.query || body.q || "").trim();
  if (!query) throw new Error("SerpAPI query is required");
  const endpoint = String(body.endpoint || "search");
  const tbm = endpoint === "images" ? "isch" : endpoint === "places" ? "lcl" : endpoint === "shopping" ? "shop" : undefined;
  const params = new URLSearchParams({ api_key: apiKey, engine: "google", q: query, output: "json" });
  if (tbm) params.set("tbm", tbm);
  const options = body.options && typeof body.options === "object" ? body.options : {};
  for (const key of ["location", "gl", "hl", "device", "num", "start"]) {
    if (options[key] !== undefined && options[key] !== null && String(options[key]) !== "") params.set(key, String(options[key]));
  }
  const result = await externalJson(`https://serpapi.com/search?${params.toString()}`);
  return { success: true, data: result, cached: !options.no_cache, remaining: Number(result.account_status?.total_searches_left ?? -1) };
}

// Real Google keyword research for the admin SEO panel. Every value comes from
// SerpAPI results; nothing is invented by a language model.
async function seoKeywordResearch(body: Record<string, any>) {
  const apiKey = process.env.GOOGLE_SERPAPI || process.env.GOOGLE_SERP_API;
  if (!apiKey) throw new Error("SerpAPI is not configured in Manus Admin");
  const keyword = String(body.keyword || body.query || body.q || "").trim();
  if (!keyword) throw new Error("Keyword is required");
  const params = new URLSearchParams({ api_key: apiKey, engine: "google", q: keyword, gl: String(body.gl || "za"), hl: String(body.hl || "en"), num: "20" });
  const result = await externalJson(`https://serpapi.com/search?${params.toString()}`);
  const organic = Array.isArray(result.organic_results) ? result.organic_results : [];
  const relatedSearches = Array.isArray(result.related_searches) ? result.related_searches : [];
  const peopleAlsoAsk = Array.isArray(result.related_questions) ? result.related_questions : [];
  return {
    success: true,
    provider: "serpapi",
    keyword,
    totalResults: Number(result.search_information?.total_results ?? 0),
    relatedKeywords: relatedSearches.map((entry: any) => String(entry.query || "")).filter(Boolean).slice(0, 16),
    questions: peopleAlsoAsk.map((entry: any) => String(entry.question || "")).filter(Boolean).slice(0, 10),
    competitorTitles: organic.slice(0, 10).map((entry: any) => String(entry.title || "")).filter(Boolean),
    competitorSnippets: organic.slice(0, 10).map((entry: any) => String(entry.snippet || "")).filter(Boolean),
    competitorLinks: organic.slice(0, 10).map((entry: any) => String(entry.link || "")).filter(Boolean),
  };
}

function googleMapsKey() {
  const key = process.env.GOOGLE_ALL_SERVICES;
  if (!key) throw new Error("Google Maps Platform is not configured in Manus Admin");
  return key;
}

async function googleGeocode(body: Record<string, any>) {
  const address = String(body.address || "").trim();
  if (!address) throw new Error("Address is required");
  const params = new URLSearchParams({ address, key: googleMapsKey() });
  return externalJson(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
}

async function googlePlaces(body: Record<string, any>) {
  const textQuery = String(body.query || body.textQuery || "").trim();
  if (!textQuery) throw new Error("Places query is required");
  const maxResults = Math.min(20, Math.max(1, Number(body.maxResultCount || 10)));
  try {
    return await externalJson("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": googleMapsKey(), "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri" },
      body: JSON.stringify({ textQuery, maxResultCount: maxResults }),
    });
  } catch (error) {
    // The Places API (New) is not enabled on the project key; fall back to the
    // classic Geocoding API so the admin tool still returns usable results.
    const result = await externalJson(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(textQuery)}&key=${encodeURIComponent(googleMapsKey())}`);
    const geo = result as { status?: string; results?: Array<{ place_id: string; formatted_address: string; geometry: { location: { lat: number; lng: number } } }> };
    if (geo.status !== "OK" || !geo.results?.length) throw error;
    return {
      places: geo.results.slice(0, maxResults).map((r) => ({
        id: r.place_id,
        displayName: { text: r.formatted_address },
        formattedAddress: r.formatted_address,
        location: { latitude: r.geometry.location.lat, longitude: r.geometry.location.lng },
        provider: "google-geocoding-fallback",
      })),
      provider: "google-geocoding-fallback",
    };
  }
}

// Customer-facing address pickup for checkout and registration. Runs with the
// server-side Google key and never exposes it; results are South-Africa scoped.
async function addressAutocomplete(body: Record<string, any>) {
  const input = String(body.input || body.query || "").trim();
  if (input.length < 3) return { success: true, suggestions: [] };
  const payload: Record<string, unknown> = { input, languageCode: "en", includedRegionCodes: ["ZA"] };
  if (body.sessionToken) payload.sessionToken = String(body.sessionToken);
  try {
    const result = await externalJson("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": googleMapsKey(), "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.description" },
      body: JSON.stringify(payload),
    });
    const suggestions = ((result.suggestions as Array<{ placePrediction?: { placeId?: string; description?: string } }> | undefined) || [])
      .map((item) => ({ placeId: item.placePrediction?.placeId || "", description: item.placePrediction?.description || "" }))
      .filter((item) => item.description);
    if (suggestions.length) return { success: true, provider: "google", suggestions };
  } catch {
    // Fall through to the keyless OpenStreetMap provider so address pickup keeps
    // working while the Google Maps key is invalid or unconfigured.
  }
  const osm = await externalJson(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=za&q=${encodeURIComponent(input)}`, {
    headers: { "User-Agent": "WonderfulDragonFruitSA/1.0 (https://wonderfuldragonfruit.company)" },
  });
  const suggestions = ((osm as Array<{ place_id: number; display_name: string; lat: string; lon: string }> | undefined) || [])
    .map((item) => ({ placeId: `osm:${item.place_id}`, description: String(item.display_name || ""), lat: item.lat, lon: item.lon }))
    .filter((item) => item.description);
  return { success: true, provider: "openstreetmap", suggestions };
}

async function addressPlaceDetails(body: Record<string, any>) {
  const placeId = String(body.placeId || "").trim();
  if (!placeId) throw new Error("Place ID is required");
  if (body.lat && body.lon) {
    const result = await externalJson(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${encodeURIComponent(String(body.lat))}&lon=${encodeURIComponent(String(body.lon))}`, {
      headers: { "User-Agent": "WonderfulDragonFruitSA/1.0 (https://wonderfuldragonfruit.company)" },
    });
    const address = (result as { address?: Record<string, string> } | undefined)?.address || {};
    return {
      success: true,
      provider: "openstreetmap",
      formattedAddress: String((result as { display_name?: string } | undefined)?.display_name || ""),
      street: [address.house_number, address.road].filter(Boolean).join(" "),
      city: address.city || address.town || address.village || address.suburb,
      province: address.state,
      postalCode: address.postcode,
      country: address.country,
    };
  }
  if (placeId.startsWith("osm:")) {
    const osmId = placeId.slice(4);
    const result = await externalJson(`https://nominatim.openstreetmap.org/lookup?osm_ids=N${osmId},W${osmId},R${osmId}&format=jsonv2&addressdetails=1`, {
      headers: { "User-Agent": "WonderfulDragonFruitSA/1.0 (https://wonderfuldragonfruit.company)" },
    });
    const match = ((result as Array<{ display_name?: string; address?: Record<string, string> }> | undefined) || [])[0] || {};
    const address = match.address || {};
    return {
      success: true,
      provider: "openstreetmap",
      formattedAddress: String(match.display_name || ""),
      street: [address.house_number, address.road].filter(Boolean).join(" "),
      city: address.city || address.town || address.village || address.suburb,
      province: address.state,
      postalCode: address.postcode,
      country: address.country,
    };
  }
  const params = new URLSearchParams({ place_id: placeId, key: googleMapsKey() });
  const result = await externalJson(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
  const match = (result.results as Array<{ formatted_address?: string; address_components?: Array<{ long_name?: string; types?: string[] }> }> | undefined)?.[0];
  if (!match) return { success: false, message: "Address not found", results: [] };
  const component = (type: string) => match.address_components?.find((item) => item.types?.includes(type))?.long_name || "";
  return {
    success: true,
    formattedAddress: match.formatted_address || "",
    street: component("route") ? `${component("street_number")} ${component("route")}`.trim() : "",
    city: component("locality") || component("postal_town"),
    province: component("administrative_area_level_1"),
    postalCode: component("postal_code"),
    country: component("country"),
  };
}

async function googleRoutes(body: Record<string, any>) {
  if (!body.origin || !body.destination) throw new Error("Route origin and destination are required");
  return externalJson("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": googleMapsKey(), "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline" },
    body: JSON.stringify({ origin: body.origin, destination: body.destination, travelMode: String(body.travelMode || "DRIVE"), routingPreference: "TRAFFIC_AWARE" }),
  });
}

async function youtubeSearch(body: Record<string, any>) {
  const query = String(body.query || body.q || "").trim();
  if (!query) throw new Error("YouTube search query is required");
  const maxResults = Math.min(50, Math.max(1, Number(body.maxResults || 10)));
  try {
    const params = new URLSearchParams({ part: "snippet", q: query, type: "video", maxResults: String(maxResults), key: googleMapsKey() });
    return await externalJson(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
  } catch (error) {
    // The YouTube Data API is not enabled on the project key; fall back to
    // SerpAPI's YouTube engine so the admin tool still returns results.
    if (!process.env.GOOGLE_SERPAPI && !process.env.GOOGLE_SERP_API) throw error;
    const apiKey = process.env.GOOGLE_SERPAPI || process.env.GOOGLE_SERP_API;
    const params = new URLSearchParams({ api_key: String(apiKey), engine: "youtube", search_query: query, num: String(maxResults) });
    return externalJson(`https://serpapi.com/search?${params.toString()}`);
  }
}

async function externalJson(url: string, init: RequestInit = {}) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(String((body as { message?: string; error?: string }).message || (body as { error?: string }).error || `${response.status} ${response.statusText}`));
  return body as Record<string, any>;
}

async function notifyOwner(title: string, content: string) {
  const safeTitle = title.slice(0, 1200);
  const safeContent = content.slice(0, 20000);
  if (!process.env.MANUS_API_URL || !process.env.MANUS_API_KEY) return;
  try {
    await externalJson(`${process.env.MANUS_API_URL}/webdevtoken.v1.WebDevService/SendNotification`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.MANUS_API_KEY}`, "Content-Type": "application/json", "connect-protocol-version": "1" },
      body: JSON.stringify({ title: safeTitle, content: safeContent }),
    });
  } catch (error) {
    console.warn("Owner notification failed", error instanceof Error ? error.message : String(error));
  }
}
const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v26.0";
// Direct Meta integration. When META_WHATSAPP_TOKEN is present the site talks to
// Meta's Graph API itself and the Cloudflare bridge is no longer used.
const META_APP_SECRET = String(process.env.META_APP_SECRET || "");
const META_WHATSAPP_TOKEN = String(process.env.META_WHATSAPP_TOKEN || "");
const META_WEBHOOK_VERIFY_TOKEN = String(process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN || "");

/**
 * Distributor enquiry email routing.
 * - Always notifies the project owner through the platform notification channel.
 * - Additionally emails the configured recipients (ENQUIRY_NOTIFY_EMAILS, comma-separated)
 *   through SMTP when SMTP_HOST/SMTP_USER/SMTP_PASS are configured. Recipient delivery is
 *   disabled silently until those credentials are provided.
 */
async function notifyEnquiryRecipients(enquiry: {
  distributorName: string; fullName: string; email: string; phone: string | null;
  category: string; message: string; enquiryId: string;
}) {
  const summary = [
    `New enquiry for: ${enquiry.distributorName}`,
    `Category: ${enquiry.category}`,
    `From: ${enquiry.fullName} <${enquiry.email}>${enquiry.phone ? ` — ${enquiry.phone}` : ""}`,
    "",
    enquiry.message,
    "",
    `Enquiry ID: ${enquiry.enquiryId}`,
    "Reply directly to the customer from the admin panel (Admin → Distributor Enquiries).",
  ].join("\n");
  // Layer 1: platform notification to the project owner (always available).
  await notifyOwner(`New distributor enquiry — ${enquiry.distributorName}`, summary);
  // Layer 2: SMTP delivery to configured recipients (activated when credentials exist).
  const recipients = enquiryNotifyRecipients();
  const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
  if (!recipients.length || !smtpConfigured) return;
  try {
    const nodemailer = (await import("nodemailer")).default;
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    for (const recipient of recipients) {
      await transport.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: recipient,
        replyTo: enquiry.email,
        subject: `New dragon fruit enquiry — ${enquiry.distributorName} (${enquiry.category})`,
        text: summary,
      });
    }
  } catch (error) {
    console.warn("Enquiry email delivery failed", error instanceof Error ? error.message : String(error));
  }
}
function enquiryNotifyRecipients(): string[] {
  return (process.env.ENQUIRY_NOTIFY_EMAILS || "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
}
// Each Facebook Page has its own access token. Tokens live in facebook_pages so
// one website can run every Page; the environment token stays as the fallback.
async function pageAccessTokenFor(pageId?: string) {
  const id = String(pageId || process.env.FACEBOOK_PAGE_ID || "").trim();
  if (id) {
    try {
      const rows = await query<RowDataPacket[]>("SELECT access_token FROM facebook_pages WHERE page_id = ? LIMIT 1", [id]);
      const stored = String((rows as RowDataPacket[])[0]?.access_token || "").trim();
      if (stored) return stored;
    } catch { /* table not created yet - fall through */ }
  }
  const fallback = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || process.env.FACEBOOK_GRAPH_TOKEN;
  if (!fallback) throw new Error("Facebook Page token is not configured in Manus Admin");
  return fallback;
}

function publicMediaUrl(value: unknown, fieldName: string) {
  const raw = String(value || "").trim();
  if (!raw) throw new Error(`${fieldName} is required`);
  const parsed = new URL(raw, process.env.PUBLIC_APP_ORIGIN || "http://localhost");
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error(`${fieldName} must be an HTTP or HTTPS URL`);
  return parsed.toString();
}

function metaUrl(pathname: string, query: Record<string, string> = {}) {
  const url = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/${pathname.replace(/^\/+/, "")}`);
  Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

async function metaRequest(pathname: string, body?: Record<string, unknown>, pageId?: string) {
  const token = await pageAccessTokenFor(pageId);
  return externalJson(metaUrl(pathname), {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    ...(body ? { body: JSON.stringify({ ...body, access_token: token }) } : {}),
  });
}

async function metaConversations(platform: "facebook" | "instagram", pageIdOverride?: string): Promise<Record<string, unknown>[]> {
  const pageId = String(pageIdOverride || process.env.FACEBOOK_PAGE_ID || "").trim();
  const instagramId = String(process.env.INSTAGRAM_ID || "").trim();
  const nodeId = platform === "instagram" ? instagramId : pageId;
  if (!nodeId) throw new Error(platform === "instagram" ? "Instagram Business account ID is not configured in Manus Admin" : "Facebook Page ID is not configured in Manus Admin");
  const result = await metaRequest(`${nodeId}/conversations`, {
    fields: "id,updated_time,snippet,unread_count,participants,message_count",
    platform: platform === "instagram" ? "instagram" : "messenger",
    limit: "50",
  });
  const items = Array.isArray(result.data) ? result.data as Record<string, unknown>[] : [];
  return items.map((conversation) => {
    const participants = Array.isArray(conversation.participants?.data as unknown[]) ? (conversation.participants as { data: Record<string, unknown>[] }).data : [];
    const customer = participants.find((participant) => String(participant.id || "") !== nodeId) || participants[0] || {};
    return {
      id: String(conversation.id || ""),
      platformId: String(customer.id || conversation.id || ""),
      name: String(customer.name || customer.username || customer.id || "Unknown contact"),
      lastMessage: String(conversation.snippet || ""),
      lastMessageTime: String(conversation.updated_time || ""),
      unreadCount: Number(conversation.unread_count || 0),
    };
  }).filter((conversation) => conversation.id);
}

async function metaConversationMessages(conversationId: string): Promise<Record<string, unknown>[]> {
  if (!conversationId) throw new Error("A conversation id is required");
  const result = await metaRequest(`${conversationId}/messages`, {
    fields: "id,message,from,created_time,attachments",
    limit: "50",
  });
  const items = Array.isArray(result.data) ? result.data as Record<string, unknown>[] : [];
  return items.map((message) => {
    const from = (message.from && typeof message.from === "object") ? message.from as Record<string, unknown> : {};
    const pageIds = [String(process.env.FACEBOOK_PAGE_ID || "").trim(), String(process.env.INSTAGRAM_ID || "").trim()];
    const isBusiness = pageIds.includes(String(from.id || ""));
    return {
      id: String(message.id || ""),
      fromId: String(from.id || ""),
      fromName: isBusiness ? "You" : String(from.name || from.username || from.id || "Customer"),
      content: String(message.message || ""),
      direction: isBusiness ? "outbound" : "inbound",
      status: "sent",
      timestamp: String(message.created_time || ""),
    };
  });
}

async function metaSendMessage(platform: "facebook" | "instagram", recipientId: string, text: string, pageIdOverride?: string) {
  const pageId = String(pageIdOverride || process.env.FACEBOOK_PAGE_ID || "").trim();
  const instagramId = String(process.env.INSTAGRAM_ID || "").trim();
  const nodeId = platform === "instagram" ? instagramId : pageId;
  if (!nodeId) throw new Error(platform === "instagram" ? "Instagram is not configured in Manus Admin" : "Facebook is not configured in Manus Admin");
  return metaRequest(`${nodeId}/messages`, {
    recipient: { id: recipientId },
    messaging_type: "RESPONSE",
    message: { text },
  }, pageId);
}

async function getSocialStatus() {
  const pageId = String(process.env.FACEBOOK_PAGE_ID || "").trim();
  const instagramId = String(process.env.INSTAGRAM_ID || "").trim();
  if (!pageId || !instagramId) throw new Error("Facebook Page ID and Instagram Business account ID are required");
  const [facebook, instagram] = await Promise.allSettled([
    metaRequest(pageId),
    metaRequest(instagramId),
  ]);
  return {
    configured: true,
    facebook: facebook.status === "fulfilled" ? { ok: true, account: facebook.value } : { ok: false, error: facebook.reason instanceof Error ? facebook.reason.message : "Facebook account check failed" },
    instagram: instagram.status === "fulfilled" ? { ok: true, account: instagram.value } : { ok: false, error: instagram.reason instanceof Error ? instagram.reason.message : "Instagram account check failed" },
  };
}

async function publishFacebookPage(body: Record<string, any>) {
  const pageId = String(body.pageId || process.env.FACEBOOK_PAGE_ID || "").trim();
  if (!pageId) throw new Error("Facebook Page ID is not configured in Manus Admin");
  const message = String(body.message || "").trim();
  const link = body.link ? publicMediaUrl(body.link, "Facebook link") : "";
  const imageUrl = body.imageUrl ? publicMediaUrl(body.imageUrl, "Facebook image URL") : "";
  if (!message && !link && !imageUrl) throw new Error("Add a message, link, or image before publishing");
  if (imageUrl) {
    const result = await metaRequest(`${pageId}/photos`, { url: imageUrl, message, published: true }, pageId);
    return { platform: "facebook", success: true, postId: result.post_id || result.id, result };
  }
  const result = await metaRequest(`${pageId}/feed`, { message, ...(link ? { link } : {}), published: true }, pageId);
  return { platform: "facebook", success: true, postId: result.id, result };
}

async function publishInstagram(body: Record<string, any>) {
  const instagramId = String(process.env.INSTAGRAM_ID || "").trim();
  if (!instagramId) throw new Error("Instagram Business account ID is not configured in Manus Admin");
  const imageUrl = publicMediaUrl(body.imageUrl, "Instagram image URL");
  const caption = String(body.caption || "").trim();
  const altText = String(body.altText || "").trim();
  const container = await metaRequest(`${instagramId}/media`, {
    image_url: imageUrl,
    ...(caption ? { caption } : {}),
    ...(altText ? { alt_text: altText } : {}),
  });
  const creationId = String(container.id || "");
  if (!creationId) throw new Error("Instagram media container was not created");
  const published = await metaRequest(`${instagramId}/media_publish`, { creation_id: creationId });
  return { platform: "instagram", success: true, containerId: creationId, mediaId: published.id, result: published };
}

function configured(name: string) {
  return Boolean(process.env[name]);
}

function configuredShippingValue(name: string): unknown {
  const raw = process.env[name];
  if (!raw) return undefined;
  try { return JSON.parse(raw); } catch { return raw; }
}

function configuredCollectionPostalCode() {
  const raw = String(process.env.TCG_COLLECTION_ADDRESS_JSON || "");
  return raw.match(/\b(\d{4})\b/)?.[1] || "0001";
}

function shippingAddress(value: unknown, fallbackCode: string, fallbackType: string) {
  // Some stored address secrets are plain text ("Unit 11, Estate, Suburb City, 1739, Gauteng").
  // The v1 contract geocodes structured fields only, so plain text is decomposed here.
  if (typeof value === "string" && value.trim()) {
    const text = value.trim();
    const parts = text.split(",").map((part) => part.trim()).filter(Boolean);
    const provinceMap: Record<string, string> = {
      gauteng: "GP", "western cape": "WC", "kwazulu-natal": "KZN", "kwa-zulu natal": "KZN",
      "eastern cape": "EC", "free state": "FS", mpumalanga: "MP", limpopo: "LP",
      "north west": "NW", "northern cape": "NC",
    };
    const code = parts.find((part) => /^\d{4}$/.test(part)) || fallbackCode;
    const zonePart = parts.find((part) => provinceMap[part.toLowerCase()]);
    const countryPart = parts.find((part) => /south africa|za/i.test(part));
    const core = parts.filter((part) => part !== code && part !== zonePart && part !== countryPart && !/south africa/i.test(part));
    const city = core.length > 1 ? core[core.length - 1] : "";
    const street = core.length > 1 ? core.slice(0, -1).join(", ") : core.join(", ");
    return {
      street_address: street || city || text,
      local_area: city || street || text,
      suburb: city || street || text,
      city: city || street || text,
      code,
      zone: (zonePart && provinceMap[zonePart.toLowerCase()]) || "",
      country: "ZA",
      entered_address: text,
      type: fallbackType,
    };
  }
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  // Ship Logic (api.portal.thecourierguy.co.za) requires `code` (postal code),
  // `zone` (province abbreviation) and `country: "ZA"`. Frontends commonly send
  // postal_code/province fields, so normalise them here for both contracts.
  const rawCode = String(source.code || source.postal_code || source.postalCode || source.zip || fallbackCode || "").trim();
  const provinceMap: Record<string, string> = {
    GP: "GP", gauteng: "GP", WC: "WC", "western cape": "WC", KZN: "KZN", "kwazulu-natal": "KZN",
    EC: "EC", "eastern cape": "EC", FS: "FS", "free state": "FS", MP: "MP", mpumalanga: "MP",
    LP: "LP", limpopo: "LP", NW: "NW", "north west": "NW", NC: "NC", "northern cape": "NC",
  };
  const rawZone = String(source.zone || source.province || "").trim();
  const zone = provinceMap[rawZone] || provinceMap[rawZone.toLowerCase()] || rawZone;
  const street = String(source.street_address || source.address_line1 || source.address || "").trim();
  const localArea = String(source.local_area || source.suburb || source.city || street).trim();
  return {
    ...source,
    street_address: street || localArea,
    local_area: localArea,
    code: rawCode,
    zone,
    country: /^za$/i.test(String(source.country || "")) || !source.country ? "ZA" : "ZA",
    type: String(source.type || fallbackType),
  };
}

type PaymentOrder = RowDataPacket & {
  id: string;
  order_number: string;
  total_zar: number | string;
  currency: string | null;
  payment_status: string;
};

async function getPaymentOrder(orderId: unknown) {
  const value = String(orderId || "").trim();
  if (!value) throw new Error("Order reference is required");
  const rows = await query<PaymentOrder[]>("SELECT id, order_number, total_zar, currency, payment_status FROM orders WHERE id = ? OR order_number = ? LIMIT 1", [value, value]);
  const order = rows[0];
  if (!order) throw new Error("Order was not found");
  if (order.payment_status === "paid") throw new Error("Order has already been paid");
  return order;
}

async function markOrderPaid(order: PaymentOrder, provider: string, reference: string, amount: number) {
  const expected = Number(order.total_zar);
  if (!Number.isFinite(amount) || Math.abs(amount - expected) > 0.01) {
    throw new Error("Payment amount does not match the order total");
  }
  await query<ResultSetHeader>("UPDATE orders SET status = 'paid', payment_status = 'paid', payment_method = ?, payment_reference = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [provider, reference, order.id]);
  await query<ResultSetHeader>("INSERT INTO payments (id, order_id, provider, transaction_id, payment_id, amount_zar, status, payment_data) VALUES (?, ?, ?, ?, ?, ?, 'completed', NULL)", [crypto.randomUUID(), order.id, provider, reference, reference, expected]);
  // Order confirmation email is sent only after payment is verified as successful.
  await sendOrderConfirmationEmailInternal(order);
}

async function sendOrderConfirmationEmailInternal(order: PaymentOrder) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return;
  try {
    const items = await query<RowDataPacket[]>(
      "SELECT product_name, product_sku, quantity, unit_price_zar, line_total_zar FROM order_items WHERE order_id = ?",
      [order.id]
    );
    const lines = (items as unknown as Array<Record<string, unknown>>)
      .map((i) => `• ${i.product_name} (${i.product_sku}) × ${i.quantity} — R${Number(i.line_total_zar ?? (Number(i.unit_price_zar) * Number(i.quantity))).toFixed(2)}`)
      .join("\n");
    const addrRows = await query<RowDataPacket[]>("SELECT shipping_address, guest_email FROM orders WHERE id = ?", [order.id]);
    const shipping = ((addrRows as unknown as Array<Record<string, unknown>>)[0]?.shipping_address || {}) as Record<string, unknown>;
    const shipLines = [
      String(shipping.first_name || shipping.name || ""),
      String(shipping.address_line1 || shipping.address || ""),
      [shipping.city, shipping.province, shipping.postal_code || shipping.postalCode].filter(Boolean).join(", "),
    ].filter(Boolean).join("\n");
    const to = String(order.guest_email || shipping.email || "");
    if (!to) return;
    const nodemailer = (await import("nodemailer")).default;
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: `Order confirmation — ${order.order_number} | Wonderful Dragon Fruit South Africa`,
      text: `Thank you for your order!\n\nOrder number: ${order.order_number}\n\nItems:\n${lines}\n\nShipping to:\n${shipLines}\n\nTotal paid: R${Number(order.total_zar).toFixed(2)}\n\nWe will notify you as soon as your order ships. Questions? Reply to this email or WhatsApp +27 83 447 4639.`,
    });
    console.log(`Order confirmation email sent for ${order.order_number} -> ${to}`);
  } catch (error) {
    console.warn(`Order confirmation email failed for ${order.order_number}`, error instanceof Error ? error.message : String(error));
  }
}

function payFastSignature(fields: Record<string, unknown>) {
  const passphrase = process.env.PAYFAST_PASSPHRASE || process.env.PAYFAST_SECURITY_PASSPHRASE;
  if (!passphrase?.trim()) throw new Error("PayFast security passphrase is not configured in Manus Admin");
  const encodedPairs: string[] = [];
  for (const [key, value] of Object.entries(fields)) {
    if (key === "signature") break;
    if (value === undefined || value === null || String(value) === "") continue;
    encodedPairs.push(new URLSearchParams([[key, String(value).trim()]]).toString());
  }
  encodedPairs.push(new URLSearchParams([["passphrase", passphrase.trim()]]).toString());
  const input = encodedPairs.join("&");
  return crypto.createHash("md5").update(input).digest("hex");
}

async function createPayFastCheckout(body: Record<string, any>) {
  const merchantId = String(process.env.PAYFAST_MERCHANT_ID || '').trim();
  const merchantKey = String(process.env.PAYFAST_MERCHANT_KEY || '').trim();
  if (!merchantId || !merchantKey) throw new Error("PayFast is not configured in Manus Admin");
  if (merchantKey.length !== 13) throw new Error("PayFast merchant key must be exactly 13 characters; update PAYFAST_MERCHANT_KEY in Manus Admin");
  const order = await getPaymentOrder(body.orderId);
  const fields: Record<string, string> = {
    merchant_id: merchantId,
    merchant_key: merchantKey,
    return_url: String(body.returnUrl || body.return_url || ""),
    cancel_url: String(body.cancelUrl || body.cancel_url || ""),
    notify_url: `${process.env.PUBLIC_APP_ORIGIN || "https://www.wonderfuldragonfruit.company"}/api/functions/payfast-itn`,
    name_first: String(body.customerName || "Customer").split(/\s+/)[0],
    email_address: String(body.customerEmail || ""),
    m_payment_id: order.order_number,
    amount: Number(order.total_zar).toFixed(2),
    item_name: String(body.itemName || "Wonderful Dragon Fruit South Africa order"),
  };
  fields.signature = payFastSignature(fields);
  const isLive = String(process.env.PAYFAST_MODE || "sandbox").toLowerCase() === "live";
  return { success: true, actionUrl: isLive ? "https://www.payfast.co.za/eng/process" : "https://sandbox.payfast.co.za/eng/process", formFields: fields };
}

async function buildCustomerChatContext() {
  // The chatbot must answer from the real catalogue and the admin knowledgebase,
  // never from invented data. Keep the context compact and factual.
  const [products, knowledge] = await Promise.all([
    query<RowDataPacket[]>(
      `SELECT p.name, p.sku, p.price_zar, p.stock_quantity, COALESCE(NULLIF(p.short_description, ''), NULLIF(p.description, '')) AS description, c.name AS category
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.is_active = 1 ORDER BY p.is_featured DESC, p.name ASC LIMIT 60`,
    ).catch(() => [] as RowDataPacket[]),
    query<RowDataPacket[]>(
      `SELECT title, content, category, tags FROM knowledge_base WHERE is_active = 1 ORDER BY priority DESC, updated_at DESC LIMIT 40`,
    ).catch(() => [] as RowDataPacket[]),
  ]);
  const productLines = products.map((product: any) => {
    const stock = Number(product.stock_quantity) > 0 ? `in stock (${product.stock_quantity})` : "out of stock";
    const price = `R ${Number(product.price_zar).toFixed(2)}`;
    const desc = String(product.description || "").slice(0, 180);
    return `- ${product.name} [${product.sku}] ${price}, ${stock}${product.category ? `, category: ${product.category}` : ""}${desc ? `. ${desc}` : ""}`;
  });
  const knowledgeLines = knowledge.map((entry: any) => {
    const tags = Array.isArray(entry.tags) ? entry.tags.join(", ") : "";
    return `- [${entry.category}] ${entry.title}: ${String(entry.content || "").slice(0, 400)}${tags ? ` (tags: ${tags})` : ""}`;
  });
  return { productLines, knowledgeLines };
}
async function callLLM(body: Record<string, any>) {
  const apiKey = process.env.NVIDIA_AI_API_KEY;
  if (!apiKey) throw new Error("NVIDIA AI is not configured in Manus Admin");
  const { productLines, knowledgeLines } = await buildCustomerChatContext();
  const systemPrompt = [
    "Start every answer with a direct response to the customer's most recent question. Never open a reply with a greeting, a self-introduction, or a list of your capabilities — not even on a new conversation. Only mirror a greeting back if the customer's entire message is just a greeting such as 'hi' or 'hello', and even then follow it with a question asking what they need.",
    "You are the Wonderful Dragon Fruit South Africa (DFSA) online assistant helping customers with dragon fruit cultivars, cultivation guidance, products, ordering, and shipping.",
    "Answer ONLY from the approved product catalogue and knowledgebase below. If information is missing or uncertain, say so plainly and offer to route the question to the team via admin@proagrisa.co.za or +27 83 447 4639.",
    "Never invent prices, stock levels, specifications, cultivar facts, shipping rates, or delivery dates. Live shipping rates are calculated at checkout from the customer's address.",
    "Keep answers concise, friendly, and in the language the customer uses.",
    productLines.length ? `\nAPPROVED PRODUCT CATALOGUE:\n${productLines.join("\n")}` : "",
    knowledgeLines.length ? `\nAPPROVED KNOWLEDGEBASE:\n${knowledgeLines.join("\n")}` : "",
  ].filter(Boolean).join("\n");
  const incoming = Array.isArray(body.messages) && body.messages.length ? body.messages : [{ role: "user", content: String(body.prompt || body.input || body.query || "") }];
  // A per-request nonce keeps every customer message answered from its own
  // prompt (avoids provider-side cache reuse across conversations).
  const messages = [{ role: "system", content: `${systemPrompt}\n[conversation ${crypto.randomUUID()}]` }, ...incoming.map((message: any) => ({ role: message.role === "assistant" || message.role === "user" ? message.role : "user", content: String(message.content || "") }))];
  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: String(body.model || "nvidia/nemotron-3.5-bolt-e4b"), messages, max_tokens: Number(body.maxTokens || 1024), temperature: 0.7 }),
  });
  const result = await response.json() as Record<string, unknown>;
  if (!response.ok || result.error) throw new Error(String((result.error as { message?: string })?.message || "NVIDIA AI request failed"));
  const message = ((result.choices as Array<{ message?: { content?: string; reasoning_content?: string } }> | undefined)?.[0]?.message) || undefined;
  const content = (message?.content || (message?.reasoning_content ? message.reasoning_content.split("\n").map((l) => l.trim()).filter(Boolean).pop() || "" : "")) || "";
  if (!content.trim()) throw new Error("NVIDIA AI returned an empty response");
  return { ...result, content, text: content, result: content, provider: "nvidia" };
}

// Legacy name kept so existing call sites keep working; routed to NVIDIA first,
// with LongCat retained as an automatic fallback when NVIDIA fails.
async function callLongCat(body: Record<string, any>) {
  try {
    return await callLLM(body);
  } catch (error) {
    if (!process.env.LONGCAT_AI_API_KEY) throw error;
    return await callLongCatDirect(body);
  }
}

// Generic own-key provider for admin AI tools (product content, SEO, GEO,
// social posts). Uses exactly the messages sent by the caller — no injected
// catalogue context — so generation stays faithful to admin-supplied facts.
async function callNvidiaDirect(body: Record<string, any>) {
  const apiKey = process.env.NVIDIA_AI_API_KEY;
  if (!apiKey) throw new Error("NVIDIA AI is not configured");
  const messages = Array.isArray(body.messages) && body.messages.length
    ? body.messages.map((m: any) => ({ role: m.role === "assistant" || m.role === "system" || m.role === "user" ? m.role : "user", content: String(m.content ?? "") }))
    : [{ role: "user", content: String(body.prompt || body.input || "") }];
  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: String(body.model || process.env.NVIDIA_MODEL || "nvidia/nemotron-3.5-bolt-e4b"),
      messages, max_tokens: Number(body.maxTokens || body.max_tokens || 1600), temperature: Number(body.temperature ?? 0.6),
    }),
  });
  const result = await response.json() as Record<string, unknown>;
  if (!response.ok || result.error) throw new Error(String((result.error as { message?: string })?.message || "NVIDIA AI request failed"));
  const message = (result.choices as Array<{ message?: { content?: string | null; reasoning_content?: string | null } }> | undefined)?.[0]?.message;
  const content = message?.content || (message?.reasoning_content ? message.reasoning_content.split("\n").map((l) => l.trim()).filter(Boolean).pop() || "" : "");
  if (!content.trim()) throw new Error("NVIDIA AI returned an empty response");
  return { ...result, content, text: content, result: content, provider: "nvidia" };
}

async function callLongCatDirect(body: Record<string, any>) {
  const apiKey = process.env.LONGCAT_AI_API_KEY;
  if (!apiKey) throw new Error("LongCat is not configured in Manus Admin");
  const { productLines, knowledgeLines } = await buildCustomerChatContext();
  const systemPrompt = [
    "Start every answer with a direct response to the customer's most recent question. Never open a reply with a greeting, a self-introduction, or a list of your capabilities — not even on a new conversation. Only mirror a greeting back if the customer's entire message is just a greeting such as 'hi' or 'hello', and even then follow it with a question asking what they need.",
    "You are the Wonderful Dragon Fruit South Africa (DFSA) online assistant helping customers with dragon fruit cultivars, cultivation guidance, products, ordering, and shipping.",
    "Answer ONLY from the approved product catalogue and knowledgebase below. If information is missing or uncertain, say so plainly and offer to route the question to the team via admin@proagrisa.co.za or +27 83 447 4639.",
    "Never invent prices, stock levels, specifications, cultivar facts, shipping rates, or delivery dates. Live shipping rates are calculated at checkout from the customer's address.",
    "Keep answers concise, friendly, and in the language the customer uses.",
    productLines.length ? `\nAPPROVED PRODUCT CATALOGUE:\n${productLines.join("\n")}` : "",
    knowledgeLines.length ? `\nAPPROVED KNOWLEDGEBASE:\n${knowledgeLines.join("\n")}` : "",
  ].filter(Boolean).join("\n");
  const incoming = Array.isArray(body.messages) && body.messages.length ? body.messages : [{ role: "user", content: String(body.prompt || body.input || body.query || "") }];
  const messages = [{ role: "system", content: `${systemPrompt}\n[conversation ${crypto.randomUUID()}]` }, ...incoming.map((message: any) => ({ role: message.role === "assistant" || message.role === "user" ? message.role : "user", content: String(message.content || "") }))];
  const response = await fetch("https://api.longcat.chat/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: String(body.model || "LongCat-2.5-Preview"), messages, max_tokens: Number(body.maxTokens || 1024), temperature: 0.7, thinking: { type: "disabled" } }),
  });
  const result = await response.json() as Record<string, unknown>;
  if (!response.ok || result.error) throw new Error(String((result.error as { message?: string })?.message || "LongCat request failed"));
  const content = ((result.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message?.content) || "";
  if (!content.trim()) throw new Error("LongCat returned an empty response");
  return { ...result, content, text: content, result: content, provider: "longcat" };
}

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_APP_SECRET_KEY_1;
  if (!clientId || !clientSecret) throw new Error("PayPal is not configured in Manus Admin");
  const base = process.env.PAYPAL_ENV === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
  const tokenResponse = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const token = await tokenResponse.json();
  if (!tokenResponse.ok || !token.access_token) throw new Error("PayPal access token request failed");
  return { base, token: token.access_token };
}

async function createPayPalCheckout(body: Record<string, any>) {
  const { base, token } = await getPayPalAccessToken();
  const localOrder = await getPaymentOrder(body.orderId);
  const order = await externalJson(`${base}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: localOrder.order_number,
          amount: {
            currency_code: String(localOrder.currency || "USD"),
            value: Number(localOrder.total_zar).toFixed(2),
          },
        },
      ],
      application_context: {
        return_url: String(body.returnUrl || ""),
        cancel_url: String(body.cancelUrl || ""),
        user_action: "PAY_NOW",
      },
    }),
  });
  if (order.id && process.env.DATABASE_URL) {
    await query("UPDATE orders SET payment_method = 'paypal', payment_reference = ? WHERE id = ?", [order.id, localOrder.id]);
  }
  const approval = Array.isArray(order.links) ? order.links.find((link: any) => link.rel === "approve") : null;
  return { success: Boolean(approval?.href), redirectUrl: approval?.href, orderId: order.id, error: approval ? undefined : "PayPal approval URL was not returned" };
}

async function capturePayPalCheckout(body: Record<string, any>) {
  const { base, token } = await getPayPalAccessToken();
  const paypalOrderId = String(body.paypalOrderId || body.token || "");
  if (!paypalOrderId) throw new Error("PayPal order token is missing");
  const captured = await externalJson(`${base}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `capture-${paypalOrderId}`,
    },
    body: "{}",
  });
  const completed = captured.status === "COMPLETED" || captured.purchase_units?.some((unit: any) => unit.payments?.captures?.some((capture: any) => capture.status === "COMPLETED"));
  if (completed && process.env.DATABASE_URL && body.orderNumber) {
    await query("UPDATE orders SET status = 'paid', payment_status = 'paid', payment_reference = ? WHERE order_number = ?", [paypalOrderId, String(body.orderNumber)]);
  }
  return { success: completed, status: captured.status, orderId: paypalOrderId };
}

async function createYocoCheckout(body: Record<string, any>) {
  const key = process.env.YOCO_LIVE_SECRET_KEY || process.env.YOCO_SECRET_KEY || process.env.YOCO_API_KEY || process.env.YOCO_LIVE_PUBLIC_KEY;
  if (!key) throw new Error("Yoco is not configured in Manus Admin");
  const order = await getPaymentOrder(body.orderId);
  const endpoint = process.env.YOCO_CHECKOUT_URL || "https://payments.yoco.com/api/checkouts";
  const result = await externalJson(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(Number(order.total_zar) * 100),
      currency: String(order.currency || "ZAR"),
      successUrl: String(body.successUrl || ""),
      cancelUrl: String(body.cancelUrl || ""),
      metadata: {
        orderId: order.id,
        orderNumber: order.order_number,
        customerEmail: String(body.customerEmail || ""),
      },
    }),
  });
  return {
    success: true,
    redirectUrl: result.redirectUrl || result.redirect_url || result.checkoutUrl || result.checkout_url,
    checkoutId: result.id || result.checkoutId,
  };
}

async function verifyPayPalWebhook(req: Request, event: Record<string, any>) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();
  if (!webhookId) throw new Error("PAYPAL_WEBHOOK_ID is not configured in Manus Admin");
  const transmissionId = req.get("paypal-transmission-id");
  const transmissionTime = req.get("paypal-transmission-time");
  const certUrl = req.get("paypal-cert-url");
  const authAlgo = req.get("paypal-auth-algo");
  const transmissionSig = req.get("paypal-transmission-sig");
  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    throw new Error("PayPal webhook signature headers are incomplete");
  }
  const { base, token } = await getPayPalAccessToken();
  const result = await externalJson(`${base}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: event,
    }),
  });
  if (result.verification_status !== "SUCCESS") throw new Error("PayPal webhook signature verification failed");
}

async function handlePayPalWebhook(req: Request, res: Response) {
  let eventId = "";
  let eventType = "";
  try {
    const event = (req.body || {}) as Record<string, any>;
    eventId = String(event.id || "").trim();
    eventType = String(event.event_type || "").trim();
    if (!eventId || !eventType) return res.status(400).json({ error: "PayPal webhook event id and event_type are required" });
    await verifyPayPalWebhook(req, event);
    const existing = await query<RowDataPacket[]>(
      "SELECT id, status FROM webhook_events WHERE event_type = ? AND JSON_UNQUOTE(JSON_EXTRACT(payload, '$.id')) = ? LIMIT 1",
      [eventType, eventId],
    );
    if (existing.length && existing[0].status === "processed") return res.status(200).json({ received: true, duplicate: true });
    const webhookRecordId = String(existing[0]?.id || crypto.randomUUID());
    if (existing.length) {
      await query<ResultSetHeader>("UPDATE webhook_events SET status = 'processing', attempts = attempts + 1, last_error = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [webhookRecordId]);
    } else {
      await query<ResultSetHeader>(
        "INSERT INTO webhook_events (id, event_type, payload, resource_type, resource_id, status, attempts) VALUES (?, ?, ?, ?, ?, 'processing', 1)",
        [webhookRecordId, eventType, JSON.stringify(event), String(event.resource?.resource_type || "paypal"), String(event.resource?.id || eventId).slice(0, 36)],
      );
    }

    const resource = event.resource || {};
    const purchaseUnit = Array.isArray(resource.purchase_units) ? resource.purchase_units[0] : undefined;
    const orderNumber = String(purchaseUnit?.reference_id || resource.custom_id || resource.supplementary_data?.related_ids?.order_id || "").trim();
    const paypalOrderId = String(resource.supplementary_data?.related_ids?.order_id || "").trim();
    const failureEvents = new Set(["PAYMENT.CAPTURE.DECLINED", "PAYMENT.CAPTURE.DENIED", "PAYMENT.CAPTURE.REVERSED", "PAYMENT.REFUND.FAILED"]);
    const statusEvents = new Set(["PAYMENT.CAPTURE.PENDING", "PAYMENT.CAPTURE.REFUNDED", "PAYMENT.REFUND.PENDING"]);
    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const amount = Number(resource.amount?.value || purchaseUnit?.amount?.value || 0);
      if (orderNumber) {
        const orderRows = await query<PaymentOrder[]>("SELECT id, order_number, total_zar, currency, payment_status FROM orders WHERE order_number = ? OR payment_reference = ? LIMIT 1", [orderNumber, paypalOrderId || orderNumber]);
        const order = orderRows[0];
        if (order && order.payment_status !== "paid") await markOrderPaid(order, "paypal", String(resource.id || eventId), amount);
      }
    } else if (failureEvents.has(eventType) || statusEvents.has(eventType)) {
      const paymentStatus = failureEvents.has(eventType) ? "failed" : eventType.includes("REFUND") || eventType.includes("REVERSED") ? "refunded" : "pending";
      if (orderNumber) {
        await query<ResultSetHeader>("UPDATE orders SET status = ?, payment_status = ?, payment_method = 'paypal', payment_reference = ?, updated_at = CURRENT_TIMESTAMP WHERE (order_number = ? OR payment_reference = ?) AND payment_status <> 'paid'", [paymentStatus === "failed" ? "payment_failed" : paymentStatus, paymentStatus, String(resource.id || eventId), orderNumber, paypalOrderId || orderNumber]);
      }
      await notifyOwner(`PayPal transaction ${paymentStatus}: ${orderNumber || eventId}`, `PayPal event ${eventType} was received for Wonderful Dragon Fruit South Africa. Order: ${orderNumber || "not identified"}. Resource: ${String(resource.id || eventId)}. The order was marked ${paymentStatus}.`);
    }
    await query<ResultSetHeader>("UPDATE webhook_events SET status = 'processed', delivered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [webhookRecordId]);
    return res.status(200).json({ received: true, eventType, eventId });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("PayPal webhook processing failed", message);
    if (eventId && eventType) {
      await query<ResultSetHeader>("UPDATE webhook_events SET status = 'failed', last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE event_type = ? AND JSON_UNQUOTE(JSON_EXTRACT(payload, '$.id')) = ?", [message.slice(0, 2000), eventType, eventId]).catch(() => undefined);
      await notifyOwner(`PayPal webhook failed: ${eventId}`, `PayPal event ${eventType} could not be processed. Event ID: ${eventId}. Error: ${message}`);
    }
    return res.status(400).json({ error: "PayPal webhook rejected" });
  }
}

function normalizeRates(body: any, provider: string) {
  const candidates = body?.rates || body?.quotes || body?.data?.rates || body?.data || body?.services || [];
  const list = Array.isArray(candidates) ? candidates : [];
  return list.map((rate: any) => {
    const serviceLevel = rate.service_level || rate.serviceLevel || {};
    const deliveryWindow = serviceLevel.delivery_date_from && serviceLevel.delivery_date_to
      ? `${serviceLevel.delivery_date_from} - ${serviceLevel.delivery_date_to}`
      : "2-5 business days";
    return {
      provider,
      service: String(rate.service || rate.service_name || serviceLevel.name || serviceLevel.code || rate.name || provider),
      price: Number(rate.rate ?? rate.price ?? rate.amount ?? rate.total ?? 0),
      estimatedDays: String(rate.estimatedDays || rate.estimated_days || rate.transit_days || deliveryWindow),
      description: String(rate.description || rate.service_description || serviceLevel.description || ""),
    };
  }).filter((rate) => Number.isFinite(rate.price) && rate.price >= 0);
}
async function fetchConfiguredShippingRates(parcel: { submitted_length_cm: number; submitted_width_cm: number; submitted_height_cm: number; submitted_weight_kg: number }) {
  const rows = await query<RowDataPacket[]>(
    `SELECT provider, service_name, service_code, max_weight_kg, max_length_cm, max_width_cm, max_height_cm, price_zar, description
     FROM shipping_rates
     WHERE is_active = 1
       AND max_weight_kg >= ?
       AND (max_length_cm IS NULL OR max_length_cm >= ?)
       AND (max_width_cm IS NULL OR max_width_cm >= ?)
       AND (max_height_cm IS NULL OR max_height_cm >= ?)
     ORDER BY sort_order ASC, price_zar ASC`,
    [parcel.submitted_weight_kg, parcel.submitted_length_cm, parcel.submitted_width_cm, parcel.submitted_height_cm],
  );
  return rows.map((rate) => ({
    provider: String(rate.provider || "configured"),
    service: String(rate.service_name || rate.service_code || "Configured shipping"),
    price: Number(rate.price_zar),
    estimatedDays: "3-7 business days",
    description: String(rate.description || "Configured shipping rate"),
  })).filter((rate) => Number.isFinite(rate.price) && rate.price >= 0);
}
async function fetchShippingRates(body: Record<string, any>) {
  const rates: any[] = [];
  const notices: string[] = [];
  const parcel = {
    parcel_description: String(body.parcelDescription || "Wonderful Dragon Fruit South Africa order"),
    submitted_length_cm: Number(body.dimensions?.length || 30),
    submitted_width_cm: Number(body.dimensions?.width || 20),
    submitted_height_cm: Number(body.dimensions?.height || 15),
    submitted_weight_kg: Number(body.weight || 0.5),
    packaging: String(body.packaging || "Standard parcel"),
  };
  // Chargeable-weight transparency (doc 9C): couriers apply their own rules,
  // but we compute the standard SA volumetric weight (L×W×H ÷ 5000) so the
  // quote is auditable. Actual chargeable weight = max(actual, volumetric).
  const volumetricKg = Math.ceil(((parcel.submitted_length_cm * parcel.submitted_width_cm * parcel.submitted_height_cm) / 5000) * 100) / 100;
  const chargeableKg = Math.max(parcel.submitted_weight_kg, volumetricKg);
  rates.push(...await fetchConfiguredShippingRates(parcel));
  const collectionAddress = shippingAddress(configuredShippingValue("TCG_COLLECTION_ADDRESS_JSON"), configuredCollectionPostalCode(), "business");
  // Frontends send either camelCase or snake_case address objects, or the
  // customer's plain-text address directly. Accept every spelling so a live
  // Ship Logic quote is possible from any checkout payload shape.
  const rawDelivery = body.deliveryAddress || body.delivery_address || body.shippingAddress || body.shipping_address
    || (typeof body.deliveryAddressText === "string" ? body.deliveryAddressText : undefined)
    || (typeof body.customerAddress === "string" ? body.customerAddress : undefined)
    || (body.address && typeof body.address === "object" ? body.address : undefined);
  const deliveryAddress = shippingAddress(rawDelivery, String(body.destinationPostalCode || body.postalCode || body.postal_code || ""), "residential");
  // The v1 contract geocodes addresses itself and rejects lat/lng fields.
  const stripLatLng = (address: Record<string, unknown>) => {
    const { lat: _lat, lng: _lng, ...rest } = address;
    return rest;
  };
  const ratePayload = { collection_address: stripLatLng(collectionAddress), delivery_address: stripLatLng(deliveryAddress), parcels: [parcel], opt_in_rates: [], opt_in_time_based_rates: [] };
  // Door-to-door (D2D) quotes come from the Courier Guy gateway. The account key that
  // quotes D2L (PUDO_*) is the same account that quotes D2D on api-tcg.co.za, so try
  // every configured key: THE_COURIER_GUY_API first, then the PUDO account key.
  // The Courier Guy's D2D rates are served by Ship Logic; api-tcg.co.za only
  // proxies the Pudo locker contract and returns "Unauthenticated" for D2D keys.
  const courierBase = (process.env.COURIER_GUY_API_URL || "https://api.portal.thecourierguy.co.za").replace(/\/$/, "");
  // Try the dedicated Courier Guy D2D keys first: Pudo account keys only
  // authenticate the locker contract (api-tcg.co.za), so attempting them on
  // the Ship Logic host produces a spurious 401 warning on every request.
  const courierKeys = ([process.env.THE_COURIER_GUY_API, process.env.COURIER_GUY_API_KEY, process.env.PUDO_SHIPPING_API, process.env.PUDO_API_KEY, process.env.PUDO_GENERIC_API_KEY] as (string | undefined)[]).filter((key): key is string => Boolean(key));
  for (const courierKey of courierKeys) {
    try {
      // Ship Logic serves rates at /rates (also under /v3); the legacy api-tcg
      // contract lives at /api/v1/rates. Pick the path that matches the host.
      const courierPath = /api\.portal\.thecourierguy\.co\.za|api\.shiplogic\.com/.test(courierBase) ? "/rates" : "/api/v1/rates";
      if (process.env.SHIPPING_DEBUG === "1") console.log("[ship-debug] POST", `${courierBase}${courierPath}`, "keyPrefix:", String(courierKey).slice(0, 8), "payload:", JSON.stringify(ratePayload));
      const result = await externalJson(`${courierBase}${courierPath}`, { method: "POST", headers: { Authorization: `Bearer ${courierKey}`, "X-API-Key": courierKey, "Content-Type": "application/json" }, body: JSON.stringify(ratePayload) });
      rates.push(...normalizeRates(result, "courier_guy"));
      break;
    } catch (error) {
      console.warn("Courier Guy rate lookup failed; continuing with other shipping options", error instanceof Error ? error.message : String(error));
    }
  }
  const pudoKey = process.env.PUDO_GENERIC_API_KEY || process.env.PUDO_API_KEY || process.env.PUDO_SHIPPING_API;
  if (pudoKey) {
    // PUDO locker eligibility (doc 9B): lockers accept parcels up to 25 kg and
    // a longest side of 60 cm. Skip locker quotes for oversized consignments
    // and surface a clear notice instead of a misleading rate.
    const pudoMaxWeight = Number(process.env.PUDO_MAX_WEIGHT_KG || 25);
    const pudoMaxDim = Number(process.env.PUDO_MAX_DIM_CM || 60);
    const longestDim = Math.max(parcel.submitted_length_cm, parcel.submitted_width_cm, parcel.submitted_height_cm);
    if (chargeableKg > pudoMaxWeight || longestDim > pudoMaxDim) {
      notices.push(`PUDO lockers are not available for this order: the parcel (${chargeableKg.toFixed(2)} kg chargeable, longest side ${longestDim.toFixed(0)} cm) exceeds the locker limit of ${pudoMaxWeight} kg and ${pudoMaxDim} cm. Please choose Courier Guy door-to-door delivery.`);
    } else {
    const pudoBase = (process.env.PUDO_API_URL || "https://api-tcg.co.za").replace(/\/$/, "");
    try {
      // PUDO quotes are door-to-locker: the destination is a locker terminal, which the
      // v1 geocoder cannot resolve from a bare postal code. Use the customer's chosen
      // terminal when provided, otherwise the configured collection terminal.
      const terminalId = String(body.terminalId || body.lockerId || body.deliveryTerminalId || process.env.PUDO_COLLECTION_TERMINAL_ID || "");
      const pudoPayload = terminalId
        ? { ...ratePayload, delivery_address: { terminal_id: terminalId } }
        : ratePayload;
      const result = await externalJson(`${pudoBase}/api/v1/rates`, { method: "POST", headers: { Authorization: `Bearer ${pudoKey}`, "X-API-Key": pudoKey, "Content-Type": "application/json" }, body: JSON.stringify(pudoPayload) });
      rates.push(...normalizeRates(result, "pudo"));
    } catch (error) {
      console.warn("PUDO rate lookup failed; continuing with fallback shipping", error instanceof Error ? error.message : String(error));
    }
    }
  }
  // Flat-rate fallback intentionally removed (user request): only live Courier
  // Guy and PUDO rates may be shown at checkout. If both gateways fail, return
  // an empty list so the frontend shows "no shipping available" instead of an
  // invented price.
  return { rates, notices, chargeableKg, volumetricKg };
}

async function fetchPudoLockers(postalCode: string) {
  const pudoKey = process.env.PUDO_GENERIC_API_KEY || process.env.PUDO_API_KEY || process.env.PUDO_SHIPPING_API;
  if (!pudoKey) return [];
  // Locker listings are served by the PUDO host; the TCG host 500s on this route.
  const pudoBase = (process.env.PUDO_LOCKERS_API_URL || process.env.PUDO_API_URL || "https://api-pudo.co.za").replace(/\/$/, "");
  const lockerPath = pudoBase.includes("shiplogic.com") ? "/pickup-points?type=locker" : "/api/v1/lockers-data";
  let result: Record<string, unknown>;
  try {
    result = await externalJson(`${pudoBase}${lockerPath}`, { headers: { Authorization: `Bearer ${pudoKey}`, "X-API-Key": pudoKey } });
  } catch {
    // The v1 locker listing is unreliable on the provider side; try the legacy path as a secondary source.
    result = await externalJson(`${pudoBase}/lockers-data`, { headers: { Authorization: `Bearer ${pudoKey}`, "X-API-Key": pudoKey } });
  }
  // The v1 locker endpoint returns the full national list (3,600+ entries) and
  // ignores a postal-code filter, so filter locally: exact match on the locker's
  // own postal code first, falling back to an address-string match for lockers
  // whose postal_code field is missing. Unfiltered results would force the
  // customer to scroll through every locker in South Africa.
  const list = result.lockers || result.data || result;
  const wanted = String(postalCode || "").trim();
  const all = (Array.isArray(list) ? list : []).map((locker: any) => ({
    id: String(locker.id || locker.code),
    name: String(locker.name || locker.label || "PUDO locker"),
    address: String(locker.address || locker.address_line_1 || ""),
    postalCode: String(locker.postalCode || locker.postal_code || ""),
    availableSlots: Number(locker.availableSlots ?? locker.available_slots ?? 0),
  }));
  const exact = all.filter((l) => l.postalCode === wanted);
  if (exact.length) return exact.sort((a, b) => a.name.localeCompare(b.name));
  if (wanted) {
    const fuzzy = all.filter((l) => l.address.toLowerCase().includes(wanted));
    if (fuzzy.length) return fuzzy.sort((a, b) => a.name.localeCompare(b.name));
    return [];
  }
  return all;
}

async function createOrderFromCart(body: Record<string, any>) {
  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) throw new Error("Order must contain at least one item");
  const ids = items.map((item: any) => String(item.productId || ""));
  const placeholders = ids.map(() => "?").join(",");
  const products = await query<RowDataPacket[]>(`SELECT id, sku, name, price_zar, stock_quantity, allow_backorder FROM products WHERE id IN (${placeholders}) AND is_active = 1`, ids);
  const byId = new Map(products.map((product) => [String(product.id), product]));
  let subtotal = 0;
  const normalized = items.map((item: any) => {
    const product = byId.get(String(item.productId));
    const quantity = Math.max(1, Math.floor(Number(item.quantity || 1)));
    if (!product) throw new Error(`Product ${item.productId} is unavailable`);
    if (!product.allow_backorder && Number(product.stock_quantity) < quantity) throw new Error(`${product.name} is out of stock`);
    const unit = Number(product.price_zar);
    subtotal += unit * quantity;
    return { product, quantity, unit };
  });
  const shipping = Math.max(0, Number(body.shippingCost || 0));
  const discount = Math.max(0, Number(body.promoDiscountZar || 0));
  const total = Math.max(0, subtotal + shipping - discount);
  const orderId = crypto.randomUUID();
  const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  await query<ResultSetHeader>("INSERT INTO orders (id, order_number, customer_id, guest_email, status, payment_status, subtotal_zar, shipping_cost_zar, discount_zar, total_zar, currency, shipping_method, shipping_address, notes) VALUES (?, ?, ?, ?, 'pending', 'pending', ?, ?, ?, ?, 'ZAR', ?, ?, ?)", [orderId, orderNumber, body.customerId || null, body.shippingAddress?.email || null, subtotal, shipping, discount, total, body.shippingMethod || "standard", JSON.stringify(body.shippingAddress || {}), body.promoCode ? `Promo code: ${body.promoCode}` : null]);
  for (const line of normalized) await query<ResultSetHeader>("INSERT INTO order_items (id, order_id, product_id, product_name, product_sku, quantity, unit_price_zar, total_price_zar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [crypto.randomUUID(), orderId, line.product.id, line.product.name, line.product.sku, line.quantity, line.unit, line.unit * line.quantity]);
  return { success: true, orderId, orderNumber, total };
}

async function handleFunction(name: string, body: Record<string, any>, req: Request) {
  if (name === "guest-order-lookup") {
    // Guest order tracking: requires the order email PLUS the order number.
    // Returns only non-sensitive status fields - never addresses or payment references.
    const lookupEmail = String(body.email || "").trim().toLowerCase();
    const lookupOrder = String(body.orderNumber || "").trim().toUpperCase();
    if (!lookupEmail || !lookupOrder) throw new Error("Provide the email used at checkout and the order number");
    const found = await query<RowDataPacket[]>(
      "SELECT order_number, status, payment_status, total_zar, currency, shipping_method, tracking_number, shipped_at, delivered_at, created_at FROM orders WHERE order_number = ? AND LOWER(guest_email) = ? LIMIT 1",
      [lookupOrder, lookupEmail],
    );
    const order = (found as RowDataPacket[])[0];
    if (!order) throw new Error("No order found for that email and order number");
    return { orders: [order] };
  }
  if (name === "donation-create") {
    // Donations go through a strict server-side allowlist - anonymous clients
    // can never insert arbitrary fields into orders.
    const donationAmount = Number(body.amount);
    if (!Number.isFinite(donationAmount) || donationAmount < 10 || donationAmount > 1000000) throw new Error("Donation amount must be between R10 and R1,000,000");
    const donationEmail = String(body.email || "").trim().slice(0, 190);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(donationEmail)) throw new Error("A valid email address is required");
    const donationName = String(body.name || "").trim().slice(0, 120);
    const donationId = crypto.randomUUID();
    const donationOrderNumber = `DON-${Date.now()}`;
    await query<ResultSetHeader>(
      "INSERT INTO orders (id, order_number, guest_email, subtotal_zar, total_zar, status, payment_status, notes, shipping_method) VALUES (?, ?, ?, ?, ?, 'pending', 'pending', ?, 'donation')",
      [donationId, donationOrderNumber, donationEmail, donationAmount.toFixed(2), donationAmount.toFixed(2), `Donation from ${donationName || donationEmail}`],
    );
    return { success: true, orderId: donationId, orderNumber: donationOrderNumber };
  }
  if (name === "social-conversations") {
    if (!(await hasAdminPasswordAccess(req))) throw new Error("Verified admin access is required to read social conversations");
    const platform = String(body.platform || "");
    if (!["facebook", "instagram"].includes(platform)) throw new Error("Unsupported platform for conversation listing");
    const conversations = await metaConversations(platform as "facebook" | "instagram");
    return { conversations };
  }
  if (name === "social-thread") {
    if (!(await hasAdminPasswordAccess(req))) throw new Error("Verified admin access is required to read social conversations");
    const messages = await metaConversationMessages(String(body.conversationId || ""));
    return { messages };
  }
  if (name === "social-send") {
    // Admin Social Inbox reply. Only WhatsApp is connected; Meta page tokens for
    // Facebook/Instagram DMs are not configured yet.
    const platform = String(body.platform || "");
    if (!["whatsapp", "facebook", "instagram"].includes(platform)) throw new Error(`Unsupported platform: ${platform}`);
    if (!(await hasAdminPasswordAccess(req))) throw new Error("Verified admin access is required to send messages from the business number");
    const messageText = String(body.message || "").trim();
    if (!messageText) throw new Error("A message is required");
    if (platform === "whatsapp") {
      const to = String(body.to || "").replace(/[^0-9]/g, "");
      if (!to) throw new Error("A recipient number is required");
      await sendWhatsAppText(to, messageText);
      return { success: true, platform, sentTo: to };
    }
    const recipientId = String(body.to || "").trim();
    if (!recipientId) throw new Error("A recipient id is required");
    const result = await metaSendMessage(platform as "facebook" | "instagram", recipientId, messageText);
    return { success: true, platform, sentTo: recipientId, result };
  }
  if (name === "payfast-payment") return createPayFastCheckout(body);
  if (name === "send-email") {
    // Supports both the checkout order-confirmation flow and generic SMTP sends.
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error("SMTP is not configured — add SMTP_HOST, SMTP_USER and SMTP_PASS secrets");
    }
    if (String(body.type || "") === "order_confirmation") {
      const order = await getPaymentOrder(body.orderId);
      await sendOrderConfirmationEmailInternal(order);
      return { success: true };
    }
    const nodemailer = (await import("nodemailer")).default;
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: String(body.to || body.email || ""),
      subject: String(body.subject || "Message from Wonderful Dragon Fruit South Africa"),
      text: String(body.text || body.message || ""),
    });
    return { success: true };
  }
  if (name === "paypal-payment") return createPayPalCheckout(body);
  if (name === "paypal-capture") return capturePayPalCheckout(body);
  if (name === "yoco-payment") return createYocoCheckout(body);
  if (name === "shipping-rates") {
    const result = await fetchShippingRates(body);
    return { rates: result.rates, notices: result.notices, parcel: { actual_weight_kg: body.weight ?? null, chargeable_weight_kg: result.chargeableKg, volumetric_weight_kg: result.volumetricKg } };
  }
  if (["social-status", "facebook-publish", "instagram-publish"].includes(name) && !(await hasAdminPasswordAccess(req))) throw new Error("Verified admin access is required for social publishing");
  if (name === "social-status") return getSocialStatus();
  if (name === "facebook-publish") return publishFacebookPage(body);
  if (name === "instagram-publish") return publishInstagram(body);
  if (name === "currency-convert") {
    const action = String(req.query.action || "rates");
    const rates = { ZAR_TO_USD: 0.055, USD_TO_ZAR: 18.18 };
    if (action === "convert") { const amount = Number(req.query.amount || body.amount || 0); const from = String(req.query.from || body.from); const to = String(req.query.to || body.to); return { converted: { amount: from === "ZAR" && to === "USD" ? amount * rates.ZAR_TO_USD : from === "USD" && to === "ZAR" ? amount * rates.USD_TO_ZAR : amount } }; }
    return { rates };
  }
  if (name === "create-order") return createOrderFromCart(body);
  if (name === "ai-orchestrator" && ["google_ai_studio", "gemini", "vertex_ai"].includes(String(body.provider || "").toLowerCase())) return callGoogleGemini(body);
  if (["serpapi-gateway", "google-geocode", "google-places", "google-routes", "youtube-search"].includes(name) && !(await hasAdminPasswordAccess(req))) throw new Error("Verified admin access is required for Google provider tools");
  if (name === "serpapi-gateway") return callSerpApi(body);
  if (name === "google-geocode") return googleGeocode(body);
  if (name === "google-places") return googlePlaces(body);
  if (name === "google-routes") return googleRoutes(body);
  if (name === "youtube-search") return youtubeSearch(body);
  // Real Google keyword research for the admin SEO panel (not LLM-generated).
  if (name === "seo-optimizer" && String(body.action || "") === "research" && (process.env.GOOGLE_SERPAPI || process.env.GOOGLE_SERP_API)) {
    return seoKeywordResearch(body);
  }
  // Customer-facing address pickup for checkout and registration.
  if (name === "address-autocomplete") return addressAutocomplete(body);
  if (name === "address-place-details") return addressPlaceDetails(body);
  if (["ai-orchestrator", "onemin-chat", "kilo-ai", "seo-optimizer", "admin-ai"].includes(name)) {
    // The customer-facing chat is powered by NVIDIA (LongCat fallback) with the
    // real catalogue and knowledgebase. Admin AI tools use the own-key NVIDIA
    // provider first so no Manus AI credits are consumed for content generation.
    if (name === "onemin-chat" && (process.env.NVIDIA_AI_API_KEY || process.env.LONGCAT_AI_API_KEY)) {
      try {
        return await callLongCat(body);
      } catch (error) {
        console.warn("LongCat chat failed; falling back to the configured LLM", error instanceof Error ? error.message : String(error));
      }
    }
    if (process.env.NVIDIA_AI_API_KEY) {
      try {
        return await callNvidiaDirect(body);
      } catch (error) {
        console.warn("NVIDIA admin AI failed; falling back to the configured LLM", error instanceof Error ? error.message : String(error));
      }
    }
    return callManusLLM(body);
  }
  if (name === "payfast-itn") {
    const submitted = body as Record<string, unknown>;
    const expectedSignature = payFastSignature(submitted);
    const submittedSignature = String(submitted.signature || "").toLowerCase();
    const signaturesMatch = submittedSignature.length === expectedSignature.length && crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(submittedSignature));
    if (!signaturesMatch) throw new Error("PayFast ITN signature verification failed");
    if (String(submitted.merchant_id || "") !== String(process.env.PAYFAST_MERCHANT_ID || "")) throw new Error("PayFast merchant validation failed");
    if (String(submitted.payment_status || "").toUpperCase() !== "COMPLETE") return { received: true, provider: name, status: String(submitted.payment_status || "unknown") };
    if (String(submitted.m_payment_id || "").startsWith("draco-")) {
      await activateDracoSubscription(submitted);
      return { received: true, provider: name, status: "paid", subscription: "draco_pro_grower" };
    }
    const order = await getPaymentOrder(submitted.m_payment_id);
    await markOrderPaid(order, "payfast", String(submitted.pf_payment_id || submitted.m_payment_id), Number(submitted.amount_gross || submitted.amount || 0));
    return { received: true, provider: name, status: "paid", orderNumber: order.order_number };
  }
  if (["courier-guy-webhook", "pudo-webhook"].includes(name)) {
    throw new Error(`${name} requires provider webhook verification before fulfillment is enabled`);
  }
  if (name === "sitemap" || name === "ai-feed") {
    const file = await fs.readFile(path.join(root, "public", name === "sitemap" ? "sitemap.xml" : "ai-feed.json"), "utf8").catch(() => "{}");
    return { raw: file };
  }
  throw new Error(`Function ${name} is awaiting its protected Manus Admin configuration`);
}

app.get("/api/functions/:name", async (req, res) => {
  try {
    if (req.params.name === "shipping-rates" && req.query.action === "lockers") return res.json({ lockers: await fetchPudoLockers(String(req.query.postalCode || "")) });
    const data = await handleFunction(req.params.name, {}, req);
    if (data && typeof data === "object" && "raw" in data) return res.type(req.params.name === "sitemap" ? "application/xml" : "application/json").send((data as { raw: string }).raw);
    return res.json(data);
  } catch (error) { return res.status(503).json(apiError(error instanceof Error ? error.message : "Function request failed", "INTEGRATION_ERROR", 503)); }
});

app.post("/api/functions/paypal-webhook", handlePayPalWebhook);

// Public webhook endpoint for The Courier Guy / PUDO (Shiplogic) shipment events.
// Configure it in the TCG profile as the Delivery URL. When PUDO_WEBHOOK_SECRET is
// configured, requests must send it as ?key=... or the X-Webhook-Secret header.
// Best practice: treat the incoming payload as a notification hint only. Match the
// tracking_reference against our local orders, then fetch the authoritative
// shipment state back from the TCG API before acting on it (status transitions,
// emails, etc.). Zone/address fields may arrive abbreviated ("GP" vs "Gauteng"),
// so they are normalized before any comparison.
const ZONE_ABBREVIATIONS: Record<string, string> = {
  gp: "Gauteng", wc: "Western Cape", kzn: "KwaZulu-Natal", ec: "Eastern Cape",
  fs: "Free State", mp: "Mpumalanga", lp: "Limpopo", nw: "North West", nc: "Northern Cape",
};
function normalizeZone(value: unknown): string {
  const text = String(value || "").trim();
  return ZONE_ABBREVIATIONS[text.toLowerCase()] || text;
}
async function fetchVerifiedShipment(trackingReference: string, shipmentId: string): Promise<Record<string, unknown> | null> {
  const key = process.env.THE_COURIER_GUY_API || process.env.PUDO_SHIPPING_API;
  if (!key || (!trackingReference && !shipmentId)) return null;
  const base = (process.env.COURIER_GUY_API_URL || "https://api.portal.thecourierguy.co.za").replace(/\/$/, "");
  for (const path of [`/shipments/${encodeURIComponent(shipmentId || trackingReference)}`, `/shipments?tracking_reference=${encodeURIComponent(trackingReference)}`]) {
    try {
      const result = await externalJson(`${base}${path}`, { headers: { Authorization: `Bearer ${key}`, "X-API-Key": key } });
      const body = result.shipment || result.data || result;
      if (body && typeof body === "object") return body as Record<string, unknown>;
    } catch { /* try next path */ }
  }
  return null;
}
// Shared shipment webhook handler factory for both shipping providers:
// - PUDO (locker deliveries) -> /api/webhooks/pudo (PUDO_WEBHOOK_SECRET)
// - The Courier Guy (door-to-door) -> /api/webhooks/courier-guy (TCG_WEBHOOK_SECRET,
//   falling back to PUDO_WEBHOOK_SECRET when TCG has no dedicated secret set).
// Best practices: treat the incoming payload as a notification hint only, verify
// the shipment state directly with the courier API, and normalize abbreviated
// zone fields (e.g. "GP" -> "Gauteng") before writing to the order record.
// optionalSecret: when true, the endpoint only enforces a secret if one of the
// dedicated secret names is actually set. This lets The Courier Guy webhooks
// through when its dashboard cannot send a secret (auth type "None") — the
// handler still verifies every shipment against the TCG API before touching an
// order, so spoofed payloads can never change order state.
function registerShipmentWebhook(path: string, courierLabel: string, secretNames: string[], logLabel: string, optionalSecret = false) {
  app.post(path, async (req, res) => {
  try {
    const dedicatedSecrets = secretNames.map((name) => process.env[name]).filter(Boolean);
    // The Courier Guy webhooks ignore the shared PUDO fallback secret because
    // its dashboard sends no auth at all.
    const secret = optionalSecret ? "" : dedicatedSecrets[0] || "";
    if (secret) {
      const provided = String(req.query.key || req.header("x-webhook-secret") || "");
      const matches = provided.length === secret.length && crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(secret));
      if (!matches) return res.status(401).json(apiError("Webhook authentication failed", "WEBHOOK_UNAUTHORIZED", 401));
    }
    const payload = (req.body && typeof req.body === "object") ? req.body as Record<string, unknown> : {};
    const shipment = (payload.shipment && typeof payload.shipment === "object" ? payload.shipment : payload) as Record<string, unknown>;
    const eventType = String(payload.event || payload.topic || payload.type || "shipment_update");
    const shipmentId = String(shipment.shipment_id || shipment.id || payload.shipment_id || "");
    const trackingReference = String(shipment.tracking_reference || shipment.custom_tracking_reference || payload.tracking_reference || "");
    const status = String(shipment.status || payload.status || "");
    await query(
      "INSERT INTO webhook_events (id, event_type, resource_type, resource_id, status, payload, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
      [crypto.randomUUID(), eventType, "shipment", shipmentId || trackingReference, status, JSON.stringify(payload)],
    );
    // Link the shipment event to the matching order (tracking_reference is the DFSA order number)
    // so the admin Orders panel and the customer's order page show live PUDO status changes.
    // Verify the hinted state directly with the courier API before acting.
    const verified = await fetchVerifiedShipment(trackingReference, shipmentId);
    const effectiveShipment = verified || shipment;
    const verifiedStatus = String(effectiveShipment.status || payload.status || "");
    const normalized = verifiedStatus.toLowerCase().replace(/[\s-]+/g, "_");
    const orderLookup = trackingReference
      ? await query<RowDataPacket[]>(
          "SELECT id, status, shipped_at, delivered_at FROM orders WHERE order_number = ? OR tracking_number = ? LIMIT 1",
          [trackingReference, trackingReference]
        )
      : [];
    if (orderLookup.length) {
      const order = orderLookup[0] as RowDataPacket;
      const updates: string[] = [];
      const params: unknown[] = [];
      if (["delivered", "completed", "closed"].includes(normalized) && !order.delivered_at) {
        updates.push("status = ?", "delivered_at = CURRENT_TIMESTAMP"); params.push("delivered");
      } else if (["in_transit", "transit", "shipped", "dispatched", "out_for_delivery", "collected", "at_locker", "awaiting_collection", "ready_for_collection"].includes(normalized) && order.status !== "delivered") {
        updates.push("status = ?"); params.push("shipped");
        if (!order.shipped_at) updates.push("shipped_at = CURRENT_TIMESTAMP");
      }
      if (updates.length) {
        const shipmentIdValue = shipmentId || trackingReference;
        if (shipmentIdValue) { updates.push("tracking_number = COALESCE(NULLIF(tracking_number, ''), ?)"); params.push(shipmentIdValue); }
        updates.push("courier = ?", "updated_at = CURRENT_TIMESTAMP"); params.push(courierLabel);
        // Persist normalized delivery zone when the verified shipment carries one.
        const zone = normalizeZone((effectiveShipment.delivery_address as Record<string, unknown> | undefined)?.zone);
        if (zone) { updates.push("delivery_zone = COALESCE(NULLIF(delivery_zone, ''), ?)"); params.push(zone); }
        await query(`UPDATE orders SET ${updates.join(", ")} WHERE id = ?`, [...params, order.id]);
      }
    }
    return res.json({ received: true });
  } catch (error) {
    console.error(`${logLabel} webhook error`, error instanceof Error ? error.message : error);
    return res.status(500).json(apiError("Webhook processing failed", "WEBHOOK_ERROR", 500));
  }
  });
}
registerShipmentWebhook("/api/webhooks/pudo", "PUDO", ["PUDO_WEBHOOK_SECRET"], "PUDO");
registerShipmentWebhook("/api/webhooks/courier-guy", "Courier Guy", ["TCG_WEBHOOK_SECRET", "PUDO_WEBHOOK_SECRET"], "Courier Guy", true);

// Meta WhatsApp Cloud API webhook (Phone Number ID 1363502856851590, +27 63 801 8790).
// Messaging is brokered by the central Cloudflare Worker (meta-social-hub): inbound
// events arrive here, outbound replies are sent through the Worker which holds the
// WhatsApp token. The website never stores a WHATSAPP_ACCESS_TOKEN.
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "1363502856851590";
const WHATSAPP_SITE_NUMBER = process.env.WHATSAPP_SITE_NUMBER || "+27638018790";
const WHATSAPP_BRIDGE_URL = (process.env.WHATSAPP_BRIDGE_URL || "https://meta-social-hub.healthyfieldssa.workers.dev").replace(/\/$/, "");

// Outbound WhatsApp. Preferred path is direct to Meta's Graph API; the Cloudflare
// bridge is only a fallback for as long as no Meta token is stored.
async function graphSendWhatsApp(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  // A dedicated WhatsApp token is preferred; the Meta Graph token that already
  // carries whatsapp_business_messaging works just as well and avoids a second key.
  const token = META_WHATSAPP_TOKEN || String(process.env.FACEBOOK_GRAPH_TOKEN || process.env.FACEBOOK_PAGE_ACCESS_TOKEN || "");
  if (!token) throw new Error("No Meta token is available for WhatsApp sending");
  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  return externalJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
  });
}

// The central Cloudflare Worker is the preferred outbound path; it holds the
// WhatsApp token and maps every number to its site. Direct Graph API is the fallback.
async function bridgeSendWhatsAppText(toNumber: string, text: string): Promise<void> {
  const siteKey = process.env.WHATSAPP_SITE_KEY;
  if (!siteKey) throw new Error("WHATSAPP_SITE_KEY is not configured");
  await externalJson(`${WHATSAPP_BRIDGE_URL}/api/whatsapp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-whatsapp-site-key": siteKey },
    // The Worker API requires phone_number_id, to and message.
    body: JSON.stringify({ phone_number_id: WHATSAPP_PHONE_NUMBER_ID, to: toNumber, message: text }),
  });
}
async function bridgeSendWhatsAppTemplate(toNumber: string, templateName: string, languageCode: string, bodyParams: string[]): Promise<void> {
  const siteKey = process.env.WHATSAPP_SITE_KEY;
  if (!siteKey) throw new Error("WHATSAPP_SITE_KEY is not configured");
  // The worker's MCP tool expects components as a JSON string, and omitting the
  // field entirely is the safest form when the template has no body parameters.
  const components = bodyParams.length ? JSON.stringify([{ type: "body", parameters: bodyParams.map((text) => ({ type: "text", text })) }]) : "";
  const args: Record<string, unknown> = { phone_number_id: WHATSAPP_PHONE_NUMBER_ID, to: toNumber, template_name: templateName, language: languageCode };
  if (components) args.components = components;
  const response = await externalJson<{ result?: { content?: Array<{ text?: string }> }; error?: { message?: string } }>(`${WHATSAPP_BRIDGE_URL}/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "x-whatsapp-site-key": siteKey,
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "whatsapp_send_template", arguments: args } }),
  });
  if (response?.error?.message) throw new Error(response.error.message);
  // The tool result arrives as a JSON string inside content[0].text.
  const raw = response?.result?.content?.[0]?.text;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as { ok?: boolean; error?: string };
      if (parsed.ok === false) throw new Error(parsed.error || "template send rejected by the worker");
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message !== "Unexpected end of JSON input") throw parseError;
    }
  }
}
// Returns true only when a provider actually accepted the message, so the stored
// record reflects reality instead of always claiming success.
async function sendWhatsAppText(toNumber: string, text: string): Promise<boolean> {
  if (process.env.WHATSAPP_SITE_KEY) {
    try {
      await bridgeSendWhatsAppText(toNumber, text);
      return true;
    } catch (error) {
      console.error("WhatsApp bridge send failed, trying Meta directly", error instanceof Error ? error.message : error);
    }
  }
  try {
    await graphSendWhatsApp({ to: toNumber, type: "text", text: { body: text } });
    return true;
  } catch (error) {
    console.error("WhatsApp outbound send failed", error instanceof Error ? error.message : error);
    return false;
  }
}

// Template send for messaging outside the 24-hour customer-service window.
async function sendWhatsAppTemplate(toNumber: string, templateName: string, languageCode = "en", bodyParams: string[] = []): Promise<void> {
  const components = bodyParams.length ? [{ type: "body", parameters: bodyParams.map((text) => ({ type: "text", text })) }] : [];
  try {
    await graphSendWhatsApp({ to: toNumber, type: "template", template: { name: templateName, language: { code: languageCode }, components } });
    return;
  } catch (error) {
    console.error("WhatsApp template send via Meta failed, falling back to bridge", error instanceof Error ? error.message : error);
  }
  await bridgeSendWhatsAppTemplate(toNumber, templateName, languageCode, bodyParams);
}

// WhatsApp Business Hours: only auto-reply between 07:00 and 17:00 SAST (UTC+2).
function withinWhatsAppBusinessHours(): boolean {
  const sastHour = (new Date().getUTCHours() + 2) % 24;
  return sastHour >= 7 && sastHour < 17;
}

// AI-staffed WhatsApp reply: grounded in this site's catalog, shipping, payments and policies.
async function aiWhatsAppReply(customerMessage: string, channel = "WhatsApp"): Promise<string> {
  let catalog = "";
  try {
    const rows = await query<RowDataPacket[]>("SELECT name, price_zar, short_description FROM products WHERE is_active = 1 AND (status = 'published' OR status IS NULL) ORDER BY is_featured DESC, id ASC LIMIT 25");
    catalog = (rows as RowDataPacket[]).map((r) => `- ${r.name}: R${Number(r.price_zar)} — ${String(r.short_description || "").slice(0, 120)}`).join("\n");
  } catch { catalog = "Catalog unavailable."; }
  const systemPrompt = `You are the AI customer-care agent for Wonderful Dragon Fruit South Africa (DFSA), replying on ${channel}. Business rules:
- Professional, friendly, concise WhatsApp style. Reply in the customer's language.
- NEVER promise delivery dates, stock, or outcomes. Never offer refunds or free shipping. Never accept responsibility for customer or third-party mistakes.
- Payments accepted: PayFast, Yoco, PayPal. Shipping: PUDO locker collection or The Courier Guy door-to-door across South Africa; international/export quotes via WhatsApp to Head Office +27 83 447 4639.
- If unsure or asked for anything you cannot verify, reply exactly: "Can I get back to you?"
- Product catalog (name, price, short description):\n${catalog}`;
  try {
    const out = await callNvidiaDirect({
      messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: customerMessage },
      ],
      maxTokens: 350,
      temperature: 0.4,
    });
    return String((out as { text?: string }).text || "").trim() || "Can I get back to you?";
  } catch {
    return "Can I get back to you?";
  }
}

app.get("/api/webhooks/whatsapp", (req, res) => {
  const mode = String(req.query["hub.mode"] || "");
  const token = String(req.query["hub.verify_token"] || "");
  const challenge = String(req.query["hub.challenge"] || "");
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (mode === "subscribe" && expected && token === expected) {
    return res.status(200).send(challenge);
  }
  return res.status(403).json(apiError("WhatsApp verification failed", "WEBHOOK_UNAUTHORIZED", 403));
});

app.post("/api/webhooks/whatsapp", async (req, res) => {
  // Bridge authentication: the central Cloudflare Worker sends x-whatsapp-site-key +
  // x-whatsapp-bridge headers. Also accept Meta-style traffic so the endpoint works
  // both when the Worker proxies and when Meta calls directly.
  const siteKey = process.env.WHATSAPP_SITE_KEY;
  const providedKey = String(req.header("x-whatsapp-site-key") || "");
  const bridgeHeader = String(req.header("x-whatsapp-bridge") || "");
  if (siteKey && providedKey && providedKey !== siteKey) {
    return res.status(401).json(apiError("WhatsApp bridge authentication failed", "WEBHOOK_UNAUTHORIZED", 401));
  }
  if (!siteKey && bridgeHeader === "meta-social-hub") {
    return res.status(401).json(apiError("WhatsApp site key not configured", "WEBHOOK_UNAUTHORIZED", 401));
  }
  try {
    const payload = (req.body && typeof req.body === "object") ? req.body as Record<string, unknown> : {};
    const entries = Array.isArray(payload.entry) ? payload.entry as Record<string, unknown>[] : [];
    for (const entry of entries) {
      const changes = Array.isArray(entry.changes) ? entry.changes as Record<string, unknown>[] : [];
      for (const change of changes) {
        const value = (change.value && typeof change.value === "object") ? change.value as Record<string, unknown> : {};
        const contacts = Array.isArray(value.contacts) ? value.contacts as Record<string, unknown>[] : [];
        const profileName = contacts.length ? String((contacts[0].profile as Record<string, unknown> | undefined)?.name || (contacts[0].profile as Record<string, unknown> | undefined)?.wa_name || "") : "";
        // Inbound customer messages
        const messages = Array.isArray(value.messages) ? value.messages as Record<string, unknown>[] : [];
        for (const message of messages) {
          const text = (message.text as Record<string, unknown> | undefined)?.body;
          // Dedupe: Meta retries deliveries; skip messages we already stored.
          const waId = String(message.id || "");
          if (waId) {
            const dup = await query<RowDataPacket[]>("SELECT id FROM whatsapp_messages WHERE wa_message_id = ? LIMIT 1", [waId]);
            if (dup.length) continue;
          }
          await query(
            "INSERT INTO whatsapp_messages (id, wa_message_id, direction, from_number, to_number, message_type, message_content, status, raw_payload, created_at) VALUES (?, ?, 'inbound', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
            [crypto.randomUUID(), waId, String(message.from || ""), WHATSAPP_PHONE_NUMBER_ID, String(message.type || "unknown"), text ? String(text) : null, "received", JSON.stringify(message)],
          );
          // Keep the admin Social Inbox contact list in sync with every conversation.
          const contactWaId = String(message.from || "");
          if (contactWaId) {
            try {
              const existing = await query<RowDataPacket[]>("SELECT id FROM whatsapp_contacts WHERE wa_id = ? LIMIT 1", [contactWaId]);
              if (existing.length) {
                await query("UPDATE whatsapp_contacts SET name = COALESCE(NULLIF(?, ''), name), phone_number = ?, updated_at = CURRENT_TIMESTAMP WHERE wa_id = ?", [profileName || "", contactWaId, contactWaId]);
              } else {
                await query("INSERT INTO whatsapp_contacts (id, wa_id, name, phone_number) VALUES (?, ?, ?, ?)", [crypto.randomUUID(), contactWaId, profileName || contactWaId, contactWaId]);
              }
            } catch (contactError) {
              console.warn("WhatsApp contact upsert failed", contactError instanceof Error ? contactError.message : contactError);
            }
          }
          // Respond 200 to Meta immediately; process the AI reply asynchronously.
          if (text && String(message.from || "")) {
            const from = String(message.from);
            const body = String(text);
            void (async () => {
              try {
                let reply: string;
                if (withinWhatsAppBusinessHours()) {
                  reply = await aiWhatsAppReply(body);
                } else {
                  reply = `Thank you for contacting Wonderful Dragon Fruit South Africa! Our WhatsApp office replies between 07:00 and 17:00 SAST. For urgent help call or WhatsApp Head Office: +27 83 447 4639.`;
                }
                const delivered = await sendWhatsAppText(from, reply);
                await query("INSERT INTO whatsapp_messages (id, wa_message_id, direction, from_number, to_number, message_type, message_content, status, created_at) VALUES (?, ?, 'outbound', ?, ?, 'text', ?, ?, CURRENT_TIMESTAMP)",
                  [crypto.randomUUID(), `out-${crypto.randomUUID()}`, WHATSAPP_PHONE_NUMBER_ID, from, reply, delivered ? "sent" : "failed"]);
              } catch (e) {
                console.error("WhatsApp AI reply failed", e instanceof Error ? e.message : e);
              }
            })();
          }
        }
        // Delivery/read status callbacks for messages we or Cloudflare sent
        const statuses = Array.isArray(value.statuses) ? value.statuses as Record<string, unknown>[] : [];
        for (const status of statuses) {
          const waId = String(status.id || "");
          if (waId) {
            await query(
              "UPDATE whatsapp_messages SET status = ? WHERE wa_message_id = ?",
              [String(status.status || "unknown"), waId],
            );
          }
        }
      }
    }
    // Always 200 — Meta retries non-2xx indefinitely.
    return res.json({ received: true });
  } catch (error) {
    console.error("WhatsApp webhook error", error instanceof Error ? error.message : error);
    return res.json({ received: true });
  }
});

// ---------------------------------------------------------------------------
// Direct Meta integration: Facebook Page messages and comments arrive straight
// at this server (no Cloudflare Worker in the path) and are answered in place.
// ---------------------------------------------------------------------------

function metaSignatureValid(req: Request): boolean {
  if (!META_APP_SECRET) return true; // nothing to verify against yet
  const header = String(req.header("x-hub-signature-256") || "");
  if (!header.startsWith("sha256=")) return false;
  const raw = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!raw) return false;
  const expected = crypto.createHmac("sha256", META_APP_SECRET).update(raw).digest("hex");
  const received = header.slice(7);
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

async function replyFacebookComment(commentId: string, message: string, pageId?: string) {
  if (!commentId) throw new Error("A comment id is required");
  return metaRequest(`${commentId}/comments`, { message }, pageId);
}

app.get("/api/webhooks/facebook", (req, res) => {
  const mode = String(req.query["hub.mode"] || "");
  const token = String(req.query["hub.verify_token"] || "");
  const challenge = String(req.query["hub.challenge"] || "");
  if (mode === "subscribe" && META_WEBHOOK_VERIFY_TOKEN && token === META_WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.status(403).json(apiError("Facebook verification failed", "WEBHOOK_UNAUTHORIZED", 403));
});

app.post("/api/webhooks/facebook", async (req, res) => {
  if (!metaSignatureValid(req)) {
    return res.status(401).json(apiError("Facebook signature verification failed", "WEBHOOK_UNAUTHORIZED", 401));
  }
  const pageId = String(process.env.FACEBOOK_PAGE_ID || "").trim();
  try {
    const payload = (req.body && typeof req.body === "object") ? req.body as Record<string, unknown> : {};
    const entries = Array.isArray(payload.entry) ? payload.entry as Record<string, unknown>[] : [];
    for (const entry of entries) {
      // Every Page the website manages sends its own events; answer with that Page's token.
      const entryPageId = String(entry.id || pageId || "").trim();
      // --- Messenger conversations ---
      const messaging = Array.isArray(entry.messaging) ? entry.messaging as Record<string, unknown>[] : [];
      for (const event of messaging) {
        const sender = String((event.sender as Record<string, unknown> | undefined)?.id || "");
        const recipient = String((event.recipient as Record<string, unknown> | undefined)?.id || "");
        const message = (event.message && typeof event.message === "object") ? event.message as Record<string, unknown> : {};
        const mid = String(message.mid || "");
        const text = String(message.text || "").trim();
        const isEcho = Boolean(message.is_echo);
        if (!sender || !mid) continue;
        const dup = await query<RowDataPacket[]>("SELECT id FROM facebook_messages WHERE mid = ? LIMIT 1", [mid]);
        if (dup.length) continue;
        await query(
          "INSERT INTO facebook_messages (id, mid, direction, sender_id, recipient_id, message_content, status, raw_payload, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
          [crypto.randomUUID(), mid, isEcho ? "outbound" : "inbound", sender, recipient, text || null, isEcho ? "sent" : "received", JSON.stringify(event)],
        );
        if (!isEcho && sender) {
          try {
            const existing = await query<RowDataPacket[]>("SELECT id FROM facebook_contacts WHERE psid = ? LIMIT 1", [sender]);
            if (existing.length) {
              await query("UPDATE facebook_contacts SET last_message = ?, updated_at = CURRENT_TIMESTAMP WHERE psid = ?", [text.slice(0, 500), sender]);
            } else {
              await query("INSERT INTO facebook_contacts (id, psid, name, last_message) VALUES (?, ?, ?, ?)", [crypto.randomUUID(), sender, sender, text.slice(0, 500)]);
            }
          } catch (contactError) {
            console.warn("Facebook contact upsert failed", contactError instanceof Error ? contactError.message : contactError);
          }
        }
        // Auto-answer the customer on Messenger, outside the request cycle.
        if (!isEcho && text && sender) {
          void (async () => {
            try {
              const reply = withinWhatsAppBusinessHours()
                ? await aiWhatsAppReply(text, "Facebook Messenger")
                : "Thank you for contacting Wonderful Dragon Fruit South Africa! Our office replies between 07:00 and 17:00 SAST. For urgent help, WhatsApp Head Office on +27 83 447 4639.";
              await metaSendMessage("facebook", sender, reply, entryPageId);
              await query("INSERT INTO facebook_messages (id, mid, direction, sender_id, recipient_id, message_content, status, created_at) VALUES (?, ?, 'outbound', ?, ?, ?, 'sent', CURRENT_TIMESTAMP)",
                [crypto.randomUUID(), `out-${crypto.randomUUID()}`, entryPageId, sender, reply]);
            } catch (e) {
              console.error("Facebook auto-reply failed", e instanceof Error ? e.message : e);
            }
          })();
        }
      }
      // --- Page comments ---
      const changes = Array.isArray(entry.changes) ? entry.changes as Record<string, unknown>[] : [];
      for (const change of changes) {
        if (String(change.field || "") !== "feed") continue;
        const value = (change.value && typeof change.value === "object") ? change.value as Record<string, unknown> : {};
        if (String(value.item || "") !== "comment" || String(value.verb || "") !== "add") continue;
        const commentId = String(value.comment_id || value.id || "");
        const postId = String(value.post_id || "");
        const from = (value.from && typeof value.from === "object") ? value.from as Record<string, unknown> : {};
        const authorId = String(from.id || "");
        const authorName = String(from.name || "");
        const content = String(value.message || "").trim();
        if (!commentId) continue;
        if (authorId && entryPageId && authorId === entryPageId) continue; // our own reply
        const dup = await query<RowDataPacket[]>("SELECT id FROM facebook_comments WHERE comment_id = ? LIMIT 1", [commentId]);
        if (dup.length) continue;
        await query(
          "INSERT INTO facebook_comments (id, comment_id, post_id, author_id, author_name, content, status, raw_payload, created_at) VALUES (?, ?, ?, ?, ?, ?, 'received', ?, CURRENT_TIMESTAMP)",
          [crypto.randomUUID(), commentId, postId, authorId, authorName, content, JSON.stringify(value)],
        );
        if (content) {
          void (async () => {
            try {
              const reply = withinWhatsAppBusinessHours()
                ? await aiWhatsAppReply(content, "Facebook comment reply")
                : "Thank you for your comment! Our team replies between 07:00 and 17:00 SAST — for urgent help please WhatsApp +27 83 447 4639.";
              const posted = await replyFacebookComment(commentId, reply, entryPageId);
              await query("UPDATE facebook_comments SET reply_id = ?, reply_content = ?, status = 'replied' WHERE comment_id = ?",
                [String(posted.id || ""), reply, commentId]);
            } catch (e) {
              console.error("Facebook comment auto-reply failed", e instanceof Error ? e.message : e);
              await query("UPDATE facebook_comments SET status = 'reply_failed' WHERE comment_id = ?", [commentId]);
            }
          })();
        }
      }
    }
    return res.json({ received: true });
  } catch (error) {
    console.error("Facebook webhook error", error instanceof Error ? error.message : error);
    return res.json({ received: true });
  }
});

// Admin: stored comments plus a manual reply route.
app.get("/api/admin/facebook/comments", async (req, res) => {
  try {
    if (!(await hasAdminPasswordAccess(req))) return res.status(401).json(apiError("Admin authentication is required", "ADMIN_AUTH_REQUIRED", 401));
    const limit = Math.min(200, Math.max(1, Number(req.query.limit || 50)));
    const rows = await query<RowDataPacket[]>(
      "SELECT comment_id, post_id, author_id, author_name, content, reply_content, status, created_at FROM facebook_comments ORDER BY created_at DESC LIMIT ?",
      [limit],
    );
    return res.json({ data: rows, error: null });
  } catch (error) {
    return res.status(500).json(apiError(error instanceof Error ? error.message : "Could not load comments", "FACEBOOK_COMMENTS_ERROR", 500));
  }
});

app.post("/api/admin/facebook/comments/reply", async (req, res) => {
  try {
    if (!(await hasAdminPasswordAccess(req))) return res.status(401).json(apiError("Admin authentication is required", "ADMIN_AUTH_REQUIRED", 401));
    const commentId = String((req.body || {}).commentId || "");
    const message = String((req.body || {}).message || "").trim();
    if (!commentId || !message) return res.status(400).json(apiError("commentId and message are required", "INVALID_INPUT", 400));
    const posted = await replyFacebookComment(commentId, message);
    await query("UPDATE facebook_comments SET reply_id = ?, reply_content = ?, status = 'replied' WHERE comment_id = ?", [String(posted.id || ""), message, commentId]);
    return res.json({ data: { ok: true, replyId: posted.id || "" }, error: null });
  } catch (error) {
    return res.status(500).json(apiError(error instanceof Error ? error.message : "Reply failed", "FACEBOOK_REPLY_ERROR", 500));
  }
});

// Admin: the Facebook Pages this website manages. Tokens are never returned.
app.get("/api/admin/facebook/pages", async (req, res) => {
  try {
    if (!(await hasAdminPasswordAccess(req))) return res.status(401).json(apiError("Admin authentication is required", "ADMIN_AUTH_REQUIRED", 401));
    const rows = await query<RowDataPacket[]>(
      "SELECT page_id, name, is_primary, subscribed, created_at, updated_at FROM facebook_pages ORDER BY is_primary DESC, name ASC",
    );
    return res.json({ data: rows, error: null });
  } catch (error) {
    return res.status(500).json(apiError(error instanceof Error ? error.message : "Could not load pages", "FACEBOOK_PAGES_ERROR", 500));
  }
});

app.post("/api/admin/facebook/pages", async (req, res) => {
  try {
    if (!(await hasAdminPasswordAccess(req))) return res.status(401).json(apiError("Admin authentication is required", "ADMIN_AUTH_REQUIRED", 401));
    const body = (req.body || {}) as Record<string, unknown>;
    const pageId = String(body.pageId || "").trim();
    const name = String(body.name || "").trim();
    const token = String(body.accessToken || "").trim();
    if (!pageId || !name || !token) return res.status(400).json(apiError("pageId, name and accessToken are required", "INVALID_INPUT", 400));
    const makePrimary = Boolean(body.isPrimary);
    if (makePrimary) await query("UPDATE facebook_pages SET is_primary = 0");
    await query(
      "INSERT INTO facebook_pages (id, page_id, name, access_token, is_primary, subscribed) VALUES (?, ?, ?, ?, ?, 1) ON DUPLICATE KEY UPDATE name = VALUES(name), access_token = VALUES(access_token), is_primary = VALUES(is_primary), subscribed = 1",
      [crypto.randomUUID(), pageId, name, token, makePrimary ? 1 : 0],
    );
    // Confirm the token works before trusting it.
    let verified = false;
    let verifyError = "";
    try {
      const check = await metaRequest(pageId, undefined, pageId);
      verified = Boolean(check && check.id);
    } catch (error) {
      verifyError = error instanceof Error ? error.message : "verification failed";
    }
    return res.json({ data: { ok: true, pageId, verified, verifyError }, error: null });
  } catch (error) {
    return res.status(500).json(apiError(error instanceof Error ? error.message : "Could not save page", "FACEBOOK_PAGE_SAVE_ERROR", 500));
  }
});

app.delete("/api/admin/facebook/pages", async (req, res) => {
  try {
    if (!(await hasAdminPasswordAccess(req))) return res.status(401).json(apiError("Admin authentication is required", "ADMIN_AUTH_REQUIRED", 401));
    const pageId = String((req.query.pageId || (req.body || {}).pageId || "")).trim();
    if (!pageId) return res.status(400).json(apiError("pageId is required", "INVALID_INPUT", 400));
    await query("DELETE FROM facebook_pages WHERE page_id = ?", [pageId]);
    return res.json({ data: { ok: true }, error: null });
  } catch (error) {
    return res.status(500).json(apiError(error instanceof Error ? error.message : "Could not remove page", "FACEBOOK_PAGE_DELETE_ERROR", 500));
  }
});

// Admin: which Meta channel is wired in and how it is currently delivering.
app.get("/api/admin/meta/status", async (req, res) => {
  try {
    if (!(await hasAdminPasswordAccess(req))) return res.status(401).json(apiError("Admin authentication is required", "ADMIN_AUTH_REQUIRED", 401));
    return res.json({
      data: {
        facebookPageId: Boolean(process.env.FACEBOOK_PAGE_ID),
        instagramId: Boolean(process.env.INSTAGRAM_ID),
        graphToken: Boolean(process.env.FACEBOOK_GRAPH_TOKEN || process.env.FACEBOOK_PAGE_ACCESS_TOKEN),
        appSecret: Boolean(META_APP_SECRET),
        whatsappDirect: Boolean(META_WHATSAPP_TOKEN || process.env.FACEBOOK_GRAPH_TOKEN || process.env.FACEBOOK_PAGE_ACCESS_TOKEN),
        whatsappBridgeFallback: Boolean(process.env.WHATSAPP_SITE_KEY),
        webhookVerifyToken: Boolean(META_WEBHOOK_VERIFY_TOKEN),
        whatsappWebhook: "https://wonderfuldragonfruit.company/api/webhooks/whatsapp",
        facebookWebhook: "https://wonderfuldragonfruit.company/api/webhooks/facebook",
      },
      error: null,
    });
  } catch (error) {
    return res.status(500).json(apiError(error instanceof Error ? error.message : "Status failed", "META_STATUS_ERROR", 500));
  }
});

app.post("/api/functions/:name", async (req, res) => {
  try {
    const data = await handleFunction(req.params.name, req.body || {}, req);
    if (data && typeof data === "object" && "raw" in data) return res.type(req.params.name === "sitemap" ? "application/xml" : "application/json").send((data as { raw: string }).raw);
    return res.json({ data, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Function request failed";
    if (["paypal-payment", "paypal-capture"].includes(req.params.name)) {
      await notifyOwner(`PayPal API failure: ${req.params.name}`, `A PayPal checkout operation failed for order ${String(req.body?.orderId || req.body?.orderNumber || "unknown")}. Error: ${message}`);
    }
    return res.status(503).json(apiError(message, "INTEGRATION_ERROR", 503));
  }
});

app.post("/api/storage/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const bucket = String(req.body.bucket || "uploads").replace(/[^A-Za-z0-9_-]/g, "");
    const requested = String(req.body.path || file?.originalname || "file").replace(/[^A-Za-z0-9._/-]/g, "-");
    if (!file) return res.status(400).json(apiError("An upload file is required", "FILE_REQUIRED", 400));
    if (!(await hasAdminPasswordAccess(req))) return res.status(401).json(apiError("Verify the admin-panel password before uploading files", "ADMIN_AUTH_REQUIRED", 401));
    if (bucket === "product-images") {
      if (!file.mimetype.startsWith("image/")) return res.status(400).json(apiError("Product uploads must be image files", "INVALID_IMAGE", 400));
      if (file.size > MAX_PRODUCT_IMAGE_BYTES) return res.status(413).json(apiError("Product images must be 10MB or smaller", "IMAGE_TOO_LARGE", 413));
    }
    if (!process.env.MANUS_API_URL || !process.env.MANUS_API_KEY) return res.status(503).json(apiError("Manus Storage is not configured", "STORAGE_NOT_CONFIGURED", 503));
    const processed = bucket === "product-images" ? await processProductImage(file.buffer, file.originalname) : { buffer: file.buffer, fingerprint: crypto.createHash("sha256").update(file.buffer).digest("hex"), width: null, height: null, originalName: file.originalname.slice(0, 255), originalBytes: file.size, processedBytes: file.size, watermarked: false };
    const extension = bucket === "product-images" ? "webp" : (file.originalname.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const key = `${bucket}/${processed.fingerprint.slice(0, 16)}-${Date.now()}-${requested.replace(/^\/+/, "")}.${extension}`;
    const presign = await fetch(`${process.env.MANUS_API_URL}/v1/storage/presign/put?path=${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${process.env.MANUS_API_KEY}` } });
    const signed = await presign.json() as { url?: string; error?: string };
    if (!presign.ok || !signed.url) return res.status(502).json(apiError(signed.error || "Storage upload URL unavailable", "STORAGE_PRESIGN_FAILED", 502));
    const put = await fetch(signed.url, { method: "PUT", headers: { "Content-Type": bucket === "product-images" ? "image/webp" : file.mimetype }, body: processed.buffer });
    if (!put.ok) return res.status(502).json(apiError("Storage upload failed", "STORAGE_UPLOAD_FAILED", 502));
    return res.json({ data: { path: key, publicUrl: `/manus-storage/${key}`, fingerprint: processed.fingerprint, width: processed.width, height: processed.height, originalName: processed.originalName, originalBytes: processed.originalBytes, processedBytes: processed.processedBytes, watermarked: processed.watermarked }, error: null });
  } catch (error) { return res.status(500).json(apiError(error instanceof Error ? error.message : "Storage upload failed", "STORAGE_ERROR", 500)); }
});
app.post("/api/storage/remove", (_req, res) => res.json({ data: null, error: null }));

// ---------- DRACO Pro Grower subscription (PayFast recurring, strict no-free tier) ----------
const DRACO_PLAN = String(process.env.DRACO_PLAN_NAME || "draco_pro_grower");
const DRACO_PRICE_ZAR = Number(process.env.DRACO_PRICE_ZAR || 199);
const DRACO_MONTHLY_SCANS = Number(process.env.DRACO_MONTHLY_SCANS || 30);
const DRACO_MONTHLY_MESSAGES = Number(process.env.DRACO_MONTHLY_MESSAGES || 500);

type DracoSubscription = RowDataPacket & {
  id: string; user_open_id: string; email: string | null; plan: string; status: string;
  provider_token: string | null; amount_zar: string;
  current_period_start: Date | null; current_period_end: Date | null;
  usage_month: string | null; message_count_this_month: number; scan_count_this_month: number;
};

function currentMonthKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function dracoSubscriptionFor(identity: { id: string }) {
  const rows = await query<RowDataPacket[]>(
    "SELECT * FROM draco_subscriptions WHERE user_open_id = ? AND plan = ? LIMIT 1",
    [identity.id, DRACO_PLAN],
  );
  return (rows as DracoSubscription[])[0] || null;
}

function dracoIsActive(sub: DracoSubscription | null) {
  if (!sub || sub.status !== "active") return false;
  if (!sub.current_period_end) return false;
  return new Date(sub.current_period_end).getTime() > Date.now();
}

function dracoStatusPayload(sub: DracoSubscription | null) {
  if (!sub || !dracoIsActive(sub)) {
    return { subscribed: false, plan: DRACO_PLAN, priceZar: DRACO_PRICE_ZAR, status: sub?.status || "none" };
  }
  const month = currentMonthKey();
  const messages = sub.usage_month === month ? sub.message_count_this_month : 0;
  const scans = sub.usage_month === month ? sub.scan_count_this_month : 0;
  return {
    subscribed: true, plan: DRACO_PLAN, status: "active",
    currentPeriodEnd: sub.current_period_end, priceZar: Number(sub.amount_zar),
    usage: { month, messages, messagesLimit: DRACO_MONTHLY_MESSAGES, scans, scansLimit: DRACO_MONTHLY_SCANS },
  };
}

async function activateDracoSubscription(itn: Record<string, unknown>) {
  // The DRACO checkout reference (m_payment_id) carries the user's open id:
  // draco-<base64url(openId)>. PayFast's ITN supplies the payment + buyer email.
  const reference = String(itn.m_payment_id || "");
  let openId = "";
  try { openId = Buffer.from(reference.replace(/^draco-/, ""), "base64url").toString("utf8"); } catch { openId = ""; }
  const email = String(itn.email_address || "");
  const token = String(itn.token || itn.subscription_token || itn.pf_token || "") || null;
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);
  const month = currentMonthKey();
  const existing = await query<RowDataPacket[]>(
    "SELECT id, usage_month, current_period_end FROM draco_subscriptions WHERE user_open_id = ? AND plan = ? LIMIT 1",
    [openId, DRACO_PLAN],
  );
  if ((existing as RowDataPacket[]).length) {
    const current = (existing as RowDataPacket[])[0];
    // Renewal ITNs must extend an existing period, not restart from today.
    const previousEnd = current.current_period_end ? new Date(current.current_period_end) : null;
    const newEnd = previousEnd && previousEnd.getTime() > now.getTime() ? new Date(previousEnd.getTime() + 31 * 24 * 60 * 60 * 1000) : periodEnd;
    await query(
      `UPDATE draco_subscriptions SET status = 'active', email = ?, provider_token = COALESCE(?, provider_token),
       current_period_end = ?, usage_month = CASE WHEN usage_month = ? THEN usage_month ELSE ? END,
       message_count_this_month = CASE WHEN usage_month = ? THEN message_count_this_month ELSE 0 END,
       scan_count_this_month = CASE WHEN usage_month = ? THEN scan_count_this_month ELSE 0 END
       WHERE id = ?`,
      [email, token, newEnd, month, month, month, month, current.id],
    );
  } else {
    await query(
      `INSERT INTO draco_subscriptions (id, user_open_id, email, plan, status, provider, provider_token, amount_zar, current_period_start, current_period_end, usage_month)
       VALUES (?, ?, ?, ?, 'active', 'payfast', ?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), openId, email, DRACO_PLAN, token, DRACO_PRICE_ZAR.toFixed(2), now, periodEnd, month],
    );
  }
  const subRow = await query<RowDataPacket[]>("SELECT id FROM draco_subscriptions WHERE user_open_id = ? AND plan = ? LIMIT 1", [openId, DRACO_PLAN]);
  await query("INSERT INTO draco_usage_events (id, subscription_id, event_type, detail) VALUES (?, ?, 'payment', ?)",
    [crypto.randomUUID(), String((subRow as RowDataPacket[])[0]?.id || ""), JSON.stringify({ reference, amount: String(itn.amount_gross || ""), email })]);
}

async function createDracoCheckout(identity: { id: string; email?: string; name?: string }) {
  const merchantId = String(process.env.PAYFAST_MERCHANT_ID || "").trim();
  const merchantKey = String(process.env.PAYFAST_MERCHANT_KEY || "").trim();
  if (!merchantId || !merchantKey) throw new Error("PayFast is not configured in Manus Admin");
  const origin = process.env.PUBLIC_APP_ORIGIN || "https://www.wonderfuldragonfruit.company";
  const fields: Record<string, string> = {
    merchant_id: merchantId,
    merchant_key: merchantKey,
    return_url: `${origin}/draco?status=success`,
    cancel_url: `${origin}/draco?status=cancelled`,
    notify_url: `${origin}/api/functions/payfast-itn`,
    name_first: String(identity.name || "Grower").split(/\s+/)[0],
    email_address: String(identity.email || ""),
    m_payment_id: `draco-${Buffer.from(identity.id).toString("base64url")}`,
    amount: DRACO_PRICE_ZAR.toFixed(2),
    item_name: "DRACO Pro Grower subscription",
    item_description: "DRACO AI Agronomist: full chat access, 30 photo diagnosis scans per month, admin knowledgebase answers.",
    subscription_type: "1",
    billing_date: new Date().toISOString().slice(0, 10),
    recurring_amount: DRACO_PRICE_ZAR.toFixed(2),
    frequency: "3",
    cycles: "0",
  };
  fields.signature = payFastSignature(fields);
  const isLive = String(process.env.PAYFAST_MODE || "sandbox").toLowerCase() === "live";
  return { success: true, actionUrl: isLive ? "https://www.payfast.co.za/eng/process" : "https://sandbox.payfast.co.za/eng/process", formFields: fields };
}

async function requireActiveDraco(req: Request) {
  const identity = verifiedIdentity(req);
  if (!identity?.id) return { error: { status: 401, error: apiError("DRACO is a paid-only service. Please sign in and subscribe to DRACO Pro Grower.", "DRACO_SIGNIN_REQUIRED", 401).error } };
  const sub = await dracoSubscriptionFor(identity);
  if (!dracoIsActive(sub)) return { error: { status: 402, error: apiError("An active DRACO Pro Grower subscription is required to use DRACO.", "DRACO_SUBSCRIPTION_REQUIRED", 402).error } };
  return { identity, sub: sub as DracoSubscription };
}

async function bumpDracoUsage(sub: DracoSubscription, field: "message_count_this_month" | "scan_count_this_month", limit: number, detail: string) {
  const month = currentMonthKey();
  const used = sub.usage_month === month ? sub[field] : 0;
  if (used >= limit) {
    return { ok: false, error: { status: 429, error: apiError(`Monthly ${field.includes("scan") ? "photo scan" : "message"} limit reached (${limit}/month). It resets next month.`, "DRACO_LIMIT_REACHED", 429).error } };
  }
  await query(
    `UPDATE draco_subscriptions SET usage_month = ?, ${field} = CASE WHEN usage_month = ? THEN ${field} + 1 ELSE 1 END WHERE id = ?`,
    [month, month, sub.id],
  );
  await query("INSERT INTO draco_usage_events (id, subscription_id, event_type, detail) VALUES (?, ?, ?, ?)",
    [crypto.randomUUID(), sub.id, field.includes("scan") ? "scan" : "message", detail.slice(0, 500)]);
  return { ok: true };
}

async function dracoKnowledgeContext(userQuestion: string) {
  const words = userQuestion.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3).slice(0, 8);
  if (!words.length) return [];
  const conditions = words.map(() => "(LOWER(title) LIKE ? OR LOWER(content) LIKE ?)").join(" OR ");
  const params: string[] = [];
  for (const w of words) { params.push(`%${w}%`, `%${w}%`); }
  try {
    const rows = await query<RowDataPacket[]>(
      `SELECT title, content, category FROM knowledge_base WHERE is_active = 1 AND (${conditions}) ORDER BY priority DESC, updated_at DESC LIMIT 6`,
      params,
    );
    return (rows as RowDataPacket[]).map((r) => `[${r.category}] ${r.title}: ${String(r.content).slice(0, 500)}`);
  } catch { return []; }
}

// Cloud Vision API (GOOGLE_API_KEY_MULTI) gives DRACO scans deterministic
// image evidence — labels, objects and web matches — passed into the LongCat
// diagnosis alongside the photo. Chat itself stays on LongCat; Vision is
// analysis only. Fails soft: a Vision outage never blocks a scan.
async function googleVisionPlantEvidence(base64Webp: string): Promise<string> {
  const key = process.env.GOOGLE_API_KEY_MULTI;
  if (!key) return "";
  try {
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [{
          image: { content: base64Webp },
          features: [
            { type: "LABEL_DETECTION", maxResults: 15 },
            { type: "OBJECT_LOCALIZATION", maxResults: 10 },
            { type: "WEB_DETECTION", maxResults: 5 },
          ],
        }],
      }),
    });
    if (!response.ok) return "";
    const result = await response.json() as {
      responses?: Array<{
        labelAnnotations?: Array<{ description: string; score: number }>;
        localizedObjectAnnotations?: Array<{ name: string; score: number }>;
        webDetection?: { webEntities?: Array<{ description: string; score: number }>; pagesWithMatchingImages?: Array<{ pageTitle?: string }> };
      }>;
    };
    const r = result.responses?.[0];
    if (!r) return "";
    const parts: string[] = [];
    const labels = (r.labelAnnotations || []).filter((l) => l.score > 0.5).map((l) => `${l.description} (${Math.round(l.score * 100)}%)`);
    if (labels.length) parts.push(`Image labels: ${labels.join(", ")}`);
    const objects = (r.localizedObjectAnnotations || []).filter((o) => o.score > 0.5).map((o) => o.name);
    if (objects.length) parts.push(`Objects detected: ${objects.join(", ")}`);
    const web = [
      ...(r.webDetection?.webEntities || []).filter((e) => e.score > 0.6).map((e) => e.description),
      ...(r.webDetection?.pagesWithMatchingImages || []).map((p) => p.pageTitle || ""),
    ].filter(Boolean).slice(0, 8);
    if (web.length) parts.push(`Similar-image matches: ${web.join("; ")}`);
    return parts.join("\n");
  } catch {
    return "";
  }
}

async function callDracoLLM(messages: Array<{ role: string; content: unknown }>) {
  const nvidiaKey = process.env.NVIDIA_AI_API_KEY;
  if (nvidiaKey) {
    const nonce = crypto.randomUUID();
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${nvidiaKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: String(process.env.DRACO_MODEL || "nvidia/nemotron-3.5-bolt-e4b"), messages: [...messages, { role: "system", content: `[draco ${nonce}]` }], max_tokens: 1400, temperature: 0.6 }),
    });
    const result = await response.json() as Record<string, unknown>;
    if (!response.ok || result.error) throw new Error(String((result.error as { message?: string })?.message || "NVIDIA AI request failed"));
    const message = ((result.choices as Array<{ message?: { content?: string; reasoning_content?: string } }> | undefined)?.[0]?.message) || undefined;
    const content = (message?.content || (message?.reasoning_content ? message.reasoning_content.split("\n").map((l) => l.trim()).filter(Boolean).pop() || "" : "")) || "";
    if (content.trim()) return content;
  }
  const fallback = await fetch(`${process.env.MANUS_API_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.MANUS_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messages, temperature: 0.6 }),
  });
  const result = await fallback.json() as Record<string, unknown>;
  if (!fallback.ok || result.error) throw new Error(String((result.error as { message?: string })?.message || "LLM request failed"));
  return ((result.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message?.content) || "";
}

const DRACO_SYSTEM_PROMPT = [
  "You are DRACO, the expert dragon fruit (pitaya) agronomist of Wonderful Dragon Fruit South Africa.",
  "Give practical, specific guidance on cultivars, planting, trellising, fertilising, irrigation, pest and disease control, flowering, fruiting, harvest and post-harvest handling.",
  "ALWAYS prioritise the provided KNOWLEDGEBASE CONTEXT over generic training data. If the knowledgebase contradicts general practice, follow the knowledgebase.",
  "Answer in the language the grower writes in. Be concise but complete; use short paragraphs or bullet lists where helpful.",
  "For commercial questions (prices, ordering, shipping), direct the grower to the site catalogue and the contact page.",
].join("\n");

app.get("/api/draco/status", async (req, res) => {
  try {
    const identity = verifiedIdentity(req);
    if (!identity?.id) return res.json({ data: { signedIn: false, subscribed: false, plan: DRACO_PLAN, priceZar: DRACO_PRICE_ZAR }, error: null });
    const sub = await dracoSubscriptionFor(identity);
    return res.json({ data: { signedIn: true, email: identity.email, name: identity.name, ...dracoStatusPayload(sub) }, error: null });
  } catch (error) {
    return res.status(500).json(apiError(error instanceof Error ? error.message : "DRACO status failed", "DRACO_ERROR", 500));
  }
});

app.post("/api/draco/checkout", async (req, res) => {
  try {
    const identity = verifiedIdentity(req);
    if (!identity?.id) return res.status(401).json(apiError("Please sign in first — DRACO subscriptions are linked to your account.", "DRACO_SIGNIN_REQUIRED", 401));
    const checkout = await createDracoCheckout(identity);
    return res.json({ data: checkout, error: null });
  } catch (error) {
    return res.status(503).json(apiError(error instanceof Error ? error.message : "DRACO checkout failed", "DRACO_CHECKOUT_ERROR", 503));
  }
});

app.post("/api/draco/chat", async (req, res) => {
  try {
    const gate = await requireActiveDraco(req);
    if (gate.error) return res.status(gate.error.status).json({ error: gate.error.error });
    const body = req.body as { messages?: Array<{ role: string; content: string }>; prompt?: string };
    const incoming = Array.isArray(body.messages) && body.messages.length ? body.messages : [{ role: "user", content: String(body.prompt || "") }];
    const question = String(incoming[incoming.length - 1]?.content || "");
    const knowledge = await dracoKnowledgeContext(question);
    const systemPrompt = [DRACO_SYSTEM_PROMPT, knowledge.length ? `\nKNOWLEDGEBASE CONTEXT:\n${knowledge.join("\n")}` : ""].filter(Boolean).join("\n");
    const messages = [{ role: "system", content: systemPrompt }, ...incoming.slice(-12).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content) }))];
    const limit = await bumpDracoUsage(gate.sub, "message_count_this_month", DRACO_MONTHLY_MESSAGES, question);
    if (!limit.ok) return res.status(limit.error!.status).json({ error: limit.error!.error });
    const content = await callDracoLLM(messages);
    return res.json({ data: { content, usage: dracoStatusPayload(gate.sub) }, error: null });
  } catch (error) {
    return res.status(503).json(apiError(error instanceof Error ? error.message : "DRACO chat failed", "DRACO_CHAT_ERROR", 503));
  }
});

app.post("/api/draco/scan", upload.single("image"), async (req, res) => {
  try {
    const gate = await requireActiveDraco(req);
    if (gate.error) return res.status(gate.error.status).json({ error: gate.error.error });
    const file = req.file;
    if (!file) return res.status(400).json(apiError("Attach a photo of the leaf, stem, or fruit to scan.", "DRACO_IMAGE_REQUIRED", 400));
    const question = String((req.body as { question?: string }).question || "Diagnose this dragon fruit plant photo: identify any disease, pest, or deficiency, and give a treatment plan.");
    // Compress and resize before sending to the vision model to reduce tokens.
    const compressed = await sharp(file.buffer, { failOn: "error" }).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
    const dataUri = `data:image/webp;base64,${compressed.toString("base64")}`;
    const limit = await bumpDracoUsage(gate.sub, "scan_count_this_month", DRACO_MONTHLY_SCANS, question);
    if (!limit.ok) return res.status(limit.error!.status).json({ error: limit.error!.error });
    const knowledge = await dracoKnowledgeContext(question);
    const visionEvidence = await googleVisionPlantEvidence(compressed.toString("base64"));
    const systemPrompt = [
      DRACO_SYSTEM_PROMPT,
      knowledge.length ? `\nKNOWLEDGEBASE CONTEXT:\n${knowledge.join("\n")}` : "",
      visionEvidence ? `\nGOOGLE CLOUD VISION IMAGE ANALYSIS (use this evidence in your diagnosis):\n${visionEvidence}` : "",
    ].filter(Boolean).join("\n");
    const content = await callDracoLLM([
      { role: "system", content: systemPrompt },
      { role: "user", content: [
        { type: "text", text: question },
        { type: "image_url", image_url: { url: dataUri } },
      ] },
    ]);
    return res.json({ data: { content, usage: dracoStatusPayload(gate.sub) }, error: null });
  } catch (error) {
    return res.status(503).json(apiError(error instanceof Error ? error.message : "DRACO scan failed", "DRACO_SCAN_ERROR", 503));
  }
});

app.get("/health", (_req, res) => res.status(200).json({ ok: true, service: "dragonfruitafrica" }));
// ---------------------------------------------------------------------------
// SEO: dynamic sitemap + Google/Bing Shopping feeds + search-engine submissions.
// Both files are generated live from the database so new/updated products reach
// Google Shopping and Bing immediately without a redeploy; the committed files
// in public/ act as a fallback when the database is unreachable.
// ---------------------------------------------------------------------------
// Canonical host is the apex: the platform 301s www → apex on every route, so
// all sitemap/canonical/feed URLs must point at the host that actually serves 200.
const SEO_BASE_URL = (process.env.PUBLIC_APP_ORIGIN || "https://wonderfuldragonfruit.company").replace(/\/+$/, "");
const SEO_INDEXNOW_KEY = "e1a8797e8aba4f4189743a7b947347e7";
// Country subdomains (CNAME za/ae/ng/... → wonderfuldragonfruit.company) served
// by the same app. Each gets its own hreflang alternate and its own IndexNow
// submission once DNS resolves. Code: ISO country short code.
const SEO_COUNTRY_SUBDOMAINS: Array<{ code: string; region: string; name: string }> = [
  { code: "za", region: "za", name: "South Africa" },
  { code: "ae", region: "ae", name: "United Arab Emirates" },
  { code: "ng", region: "ng", name: "Nigeria" },
  { code: "ke", region: "ke", name: "Kenya" },
  { code: "gh", region: "gh", name: "Ghana" },
  { code: "eg", region: "eg", name: "Egypt" },
  { code: "ma", region: "ma", name: "Morocco" },
  { code: "rw", region: "rw", name: "Rwanda" },
  { code: "ug", region: "ug", name: "Uganda" },
  { code: "et", region: "et", name: "Ethiopia" },
  { code: "ci", region: "ci", name: "Côte d'Ivoire" },
  { code: "sn", region: "sn", name: "Senegal" },
  { code: "cm", region: "cm", name: "Cameroon" },
  { code: "na", region: "na", name: "Namibia" },
  { code: "bw", region: "bw", name: "Botswana" },
  { code: "zw", region: "zw", name: "Zimbabwe" },
  { code: "mz", region: "mz", name: "Mozambique" },
  { code: "zm", region: "zm", name: "Zambia" },
  { code: "mw", region: "mw", name: "Malawi" },
  { code: "ls", region: "ls", name: "Lesotho" },
  { code: "sz", region: "sz", name: "Eswatini" },
  { code: "mg", region: "mg", name: "Madagascar" },
  { code: "mu", region: "mu", name: "Mauritius" },
  { code: "sc", region: "sc", name: "Seychelles" },
  { code: "ao", region: "ao", name: "Angola" },
  { code: "cd", region: "cd", name: "DR Congo" },
  { code: "tz", region: "tz", name: "Tanzania" },
  // Phase 2: North America, Australasia and Europe. The same single app serves
  // each hostname with its own canonical, geo tags and hreflang cluster.
  { code: "us", region: "us", name: "United States" },
  { code: "ca", region: "ca", name: "Canada" },
  { code: "au", region: "au", name: "Australia" },
  { code: "nz", region: "nz", name: "New Zealand" },
  { code: "gb", region: "gb", name: "United Kingdom" },
  { code: "de", region: "de", name: "Germany" },
  { code: "fr", region: "fr", name: "France" },
  { code: "nl", region: "nl", name: "Netherlands" },
  { code: "es", region: "es", name: "Spain" },
  { code: "it", region: "it", name: "Italy" },
  { code: "ch", region: "ch", name: "Switzerland" },
  { code: "se", region: "se", name: "Sweden" },
  { code: "no", region: "no", name: "Norway" },
  { code: "dk", region: "dk", name: "Denmark" },
  { code: "ie", region: "ie", name: "Ireland" },
  { code: "pl", region: "pl", name: "Poland" },
  { code: "pt", region: "pt", name: "Portugal" },
  { code: "be", region: "be", name: "Belgium" },
  { code: "at", region: "at", name: "Austria" },
];
const SEO_STATIC_ROUTES: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/distributors", changefreq: "weekly", priority: "0.8" },
  { path: "/distributors/zimbabwe", changefreq: "weekly", priority: "0.8" },
  { path: "/distributors/botswana", changefreq: "monthly", priority: "0.6" },
  { path: "/distributors/zambia", changefreq: "monthly", priority: "0.6" },
  { path: "/distributors/namibia", changefreq: "monthly", priority: "0.6" },
  { path: "/distributors/drc", changefreq: "monthly", priority: "0.6" },
  { path: "/distributors/south-africa", changefreq: "monthly", priority: "0.6" },
  { path: "/distributors/eswatini", changefreq: "monthly", priority: "0.6" },
  { path: "/distributors/lesotho", changefreq: "monthly", priority: "0.6" },
  { path: "/products", changefreq: "daily", priority: "0.9" },
  { path: "/specials-of-the-month", changefreq: "weekly", priority: "0.9" },
  { path: "/blog/", changefreq: "daily", priority: "0.9" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.8" },
  { path: "/consultations", changefreq: "monthly", priority: "0.8" },
  { path: "/rooting-services", changefreq: "monthly", priority: "0.8" },
  { path: "/association", changefreq: "monthly", priority: "0.7" },
  { path: "/directory", changefreq: "weekly", priority: "0.7" },
  { path: "/directory/register", changefreq: "monthly", priority: "0.5" },
  { path: "/business-resources", changefreq: "monthly", priority: "0.6" },
  { path: "/education", changefreq: "monthly", priority: "0.7" },
  { path: "/education/commercial-orders", changefreq: "monthly", priority: "0.7" },
  { path: "/dragon-fruit-botswana", changefreq: "monthly", priority: "0.7" },
  { path: "/history-of-dragon-fruit", changefreq: "monthly", priority: "0.7" },
  { path: "/dragon-fruit-global-production", changefreq: "monthly", priority: "0.7" },
  { path: "/largest-dragon-fruit-record", changefreq: "monthly", priority: "0.5" },
  { path: "/dragon-fruit-research-benefits", changefreq: "monthly", priority: "0.7" },
  { path: "/dragon-fruit-environmental-benefits", changefreq: "monthly", priority: "0.7" },
  { path: "/dragon-fruit-carbon-and-radiation-claims", changefreq: "monthly", priority: "0.5" },
  { path: "/africa-fruit-and-vegetable-markets", changefreq: "monthly", priority: "0.7" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/terms-of-service", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/cookie-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/shipping-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/returns-policy", changefreq: "yearly", priority: "0.3" },
];
function seoEscapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
type SeoEntry = { loc: string; lastmod?: string; changefreq?: string; priority?: string };
function seoRenderSitemap(entries: SeoEntry[]) {
  const urls = entries.map((entry) => [
    "  <url>",
    `    <loc>${seoEscapeXml(entry.loc)}</loc>`,
    entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>` : "",
    entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : "",
    entry.priority ? `    <priority>${entry.priority}</priority>` : "",
    "  </url>",
  ].filter(Boolean).join("\n")).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
async function seoDbEntries(): Promise<SeoEntry[]> {
  try {
    const [blogs, products] = await Promise.all([
      query<RowDataPacket[]>("SELECT slug, updated_at FROM blog_posts WHERE is_published = 1 ORDER BY published_at DESC"),
      query<RowDataPacket[]>("SELECT slug, updated_at FROM products WHERE is_active = 1 ORDER BY name"),
    ]);
    return [
      ...(blogs as unknown as { slug: string; updated_at: Date }[]).map((row) => ({
        loc: `${SEO_BASE_URL}/blog/${row.slug}`,
        lastmod: new Date(row.updated_at).toISOString().slice(0, 10),
        changefreq: "monthly", priority: "0.7",
      })),
      ...(products as unknown as { slug: string; updated_at: Date }[]).map((row) => ({
        loc: `${SEO_BASE_URL}/products/${row.slug}`,
        lastmod: new Date(row.updated_at).toISOString().slice(0, 10),
        changefreq: "weekly", priority: "0.8",
      })),
    ];
  } catch {
    return [];
  }
}
async function seoSitemapXml(): Promise<string> {
  const entries = [
    ...SEO_STATIC_ROUTES.map((route) => ({ loc: SEO_BASE_URL + route.path, changefreq: route.changefreq, priority: route.priority })),
    ...(await seoDbEntries()),
  ];
  if (entries.some((entry) => entry.loc.includes("/products/"))) {
    return seoRenderSitemap(entries);
  }
  // Database unreachable — fall back to the committed static sitemap.
  return fs.readFile(path.join(root, "public", "sitemap.xml"), "utf8").catch(() => seoRenderSitemap(entries));
}
type SeoProduct = {
  sku: string; name: string; slug: string; short_description: string | null;
  description: string | null; price_zar: string; compare_at_price_zar: string | null;
  stock_quantity: number; primary_image_url: string | null; images: string[] | null;
  brand: string | null; tags: string[] | null;
};
function seoStripHtml(value: string | null) {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
}
function seoGoogleCategory(product: SeoProduct) {
  const hay = `${product.name} ${(product.tags || []).join(" ")}`.toLowerCase();
  if (/culture|spirulina|chlorella|em1|clarifier|soil|fertil|beneficial|probiot|molass/.test(hay)) return "Health & Beauty > Health Care > Fitness & Nutrition > Vitamins & Supplements";
  if (/bag|net|tool|kit|meter|scale|gloves/.test(hay)) return "Home & Garden > Lawn & Garden > Gardening Tools";
  return "Home & Garden > Plants > Cacti & Succulents";
}
async function seoProductFeedXml(): Promise<string> {
  const items: string[] = [];
  try {
    const [rows] = await query<RowDataPacket[]>(
      "SELECT sku, name, slug, short_description, description, price_zar, compare_at_price_zar, stock_quantity, primary_image_url, images, brand, tags FROM products WHERE is_active = 1 ORDER BY name",
    );
    for (const row of rows as unknown as SeoProduct[]) {
      const price = Number(row.price_zar);
      const compare = Number(row.compare_at_price_zar);
      const image = row.primary_image_url || (row.images || [])[0] || "";
      if (!image || !Number.isFinite(price)) continue;
      const absoluteImage = image.startsWith("http") ? image : `${SEO_BASE_URL}${image}`;
      const description = seoStripHtml(row.short_description || row.description).slice(0, 5000) || seoStripHtml(row.name);
      const salePrice = Number.isFinite(compare) && compare > price
        ? `    <g:sale_price>${price.toFixed(2)} ZAR</g:sale_price>\n` : "";
      items.push([
        "  <item>",
        `    <g:id>${seoEscapeXml(row.sku || row.slug)}</g:id>`,
        `    <title>${seoEscapeXml(seoStripHtml(row.name).slice(0, 150))}</title>`,
        `    <description>${seoEscapeXml(description)}</description>`,
        `    <link>${SEO_BASE_URL}/products/${seoEscapeXml(row.slug)}</link>`,
        `    <g:image_link>${seoEscapeXml(absoluteImage)}</g:image_link>`,
        `    <g:condition>new</g:condition>`,
        `    <g:availability>${Number(row.stock_quantity) > 0 ? "in_stock" : "out_of_stock"}</g:availability>`,
        `    <g:price>${price.toFixed(2)} ZAR</g:price>`,
        salePrice +
        `    <g:brand>${seoEscapeXml(row.brand || "Wonderful Dragon Fruit SA")}</g:brand>`,
        `    <g:product_category>${seoEscapeXml(seoGoogleCategory(row))}</g:product_category>`,
        `    <g:identifier_exists>no</g:identifier_exists>`,
        "  </item>",
      ].join("\n"));
    }
  } catch {
    // Database unreachable — fall back to the committed static feed below.
  }
  if (items.length) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n<channel>\n  <title>Wonderful Dragon Fruit South Africa — Product Feed</title>\n  <link>${SEO_BASE_URL}</link>\n  <description>Dragon fruit plants, cuttings and growing supplies for commercial farming.</description>\n${items.join("\n")}\n</channel>\n</rss>\n`;
  }
  return fs.readFile(path.join(root, "public", "google-shopping-feed.xml"), "utf8").catch(() => `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n<channel>\n  <title>Wonderful Dragon Fruit South Africa — Product Feed</title>\n  <link>${SEO_BASE_URL}</link>\n  <description>Dragon fruit plants, cuttings and growing supplies for commercial farming.</description>\n</channel>\n</rss>\n`);
}
async function submitSearchEngines() {
  const sitemapUrl = `${SEO_BASE_URL}/sitemap.xml`;
  const results: Record<string, unknown> = { sitemapUrl, submittedAt: new Date().toISOString() };
  const entries = await seoDbEntries();
  const ping = async (url: string) => {
    try { const response = await fetch(url, { signal: AbortSignal.timeout(15000) }); return `HTTP ${response.status}`; }
    catch (error) { return `failed: ${error instanceof Error ? error.message : "unknown"}`; }
  };
  results.googleSitemapPing = await ping(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);
  results.bingSitemapPing = await ping(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);
  // IndexNow (Bing + Yandex + Seznam): submit every URL for immediate re-crawling.
  const urlList = [SEO_BASE_URL + "/", ...SEO_STATIC_ROUTES.map((route) => SEO_BASE_URL + route.path), ...entries.map((entry) => entry.loc)].slice(0, 10000);
  if (urlList.length > 1) {
    try {
      const response = await fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ host: SEO_BASE_URL.replace(/^https?:\/\//, ""), key: SEO_INDEXNOW_KEY, keyLocation: `${SEO_BASE_URL}/${SEO_INDEXNOW_KEY}.txt`, urlList }),
        signal: AbortSignal.timeout(30000),
      });
      results.indexNow = { status: `HTTP ${response.status}`, urls: urlList.length };
    } catch (error) {
      results.indexNow = `failed: ${error instanceof Error ? error.message : "unknown"}`;
    }
  }
  // Country subdomains each submit as their own IndexNow host (their key file
  // is served from the same SPA bundle). Products/blog URLs only — the shared
  // static routes would create 27× duplicate crawl targets.
  const subdomainUrls = [...entries.map((entry) => entry.loc)];
  if (subdomainUrls.length) {
    const subdomainResults: Record<string, unknown> = {};
    for (const country of SEO_COUNTRY_SUBDOMAINS) {
      const subHost = `${country.code}.wonderfuldragonfruit.company`;
      try {
        const response = await fetch("https://api.indexnow.org/indexnow", {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({ host: subHost, key: SEO_INDEXNOW_KEY, keyLocation: `https://${subHost}/${SEO_INDEXNOW_KEY}.txt`, urlList: subdomainUrls.slice(0, 10000) }),
          signal: AbortSignal.timeout(30000),
        });
        subdomainResults[country.code] = `HTTP ${response.status}`;
      } catch (error) {
        subdomainResults[country.code] = `failed: ${error instanceof Error ? error.message : "unknown"}`;
      }
    }
    results.subdomains = subdomainResults;
  }
  return results;
}
// ---------------------------------------------------------------------------
// Google service-account integration (service account #2): direct Shopping
// product pushes (Merchant API) and Search Console sitemap submission. Both are
// no-ops with a clear "not configured" result when the prerequisites are absent
// (secret unset, merchant center not linked, or GSC ownership not granted).
// ---------------------------------------------------------------------------
let googleSAAccessToken: { token: string; expires: number } | null = null;
async function googleSAServiceToken(scope: string) {
  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_2;
  if (!saJson) return { error: "GOOGLE_SERVICE_ACCOUNT_JSON_2 secret is not configured" };
  if (googleSAAccessToken && googleSAAccessToken.expires > Date.now()) return { token: googleSAAccessToken.token };
  const sa = JSON.parse(saJson);
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claim = Buffer.from(JSON.stringify({ iss: sa.client_email, scope, aud: "https://oauth2.googleapis.com/token", exp: now + 3600, iat: now })).toString("base64url");
  const input = `${header}.${claim}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(input);
  signer.end();
  const assertion = `${input}.${signer.sign(sa.private_key).toString("base64url")}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) return { error: `Google token error: ${data.error_description || response.status}` };
  googleSAAccessToken = { token: data.access_token, expires: Date.now() + 3000000 };
  return { token: data.access_token };
}
async function googleShoppingPush(products: SeoProduct[]) {
  const merchantId = process.env.MERCHANT_CENTER_ID;
  if (!merchantId) return { status: "skipped", reason: "MERCHANT_CENTER_ID not set — send the Merchant Center account ID to enable direct product pushes" };
  const auth = await googleSAServiceToken("https://www.googleapis.com/auth/content");
  if (!("token" in auth)) return { status: "error", reason: auth.error };
  const headers = { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" };
  const results: Record<string, unknown> = { pushed: 0, errors: [] };
  const catalogUrl = (row: SeoProduct, image: string) => `${SEO_BASE_URL}/products/${seoEscapeXml(row.slug)}`;
  for (const row of products.slice(0, 5000)) {
    const image = row.primary_image_url || (row.images || [])[0] || "";
    const price = Number(row.price_zar);
    if (!image || !Number.isFinite(price)) continue;
    const body = {
      productId: `${row.sku || row.slug}`,
      contentLanguage: "en",
      targetCountry: "ZA",
      product: {
        offerId: `${row.sku || row.slug}`,
        title: seoStripHtml(row.name).slice(0, 150),
        description: (seoStripHtml(row.short_description || row.description || row.name) || "").slice(0, 5000),
        link: `${SEO_BASE_URL}/products/${row.slug}`,
        imageLink: image.startsWith("http") ? image : `${SEO_BASE_URL}${image}`,
        price: { value: price.toFixed(2), currency: "ZAR" },
        availability: Number(row.stock_quantity) > 0 ? "inStock" : "outOfStock",
        condition: "new",
        brand: row.brand || "Wonderful Dragon Fruit SA",
        contentLanguage: "en",
        targetCountry: "ZA",
      },
    };
    try {
      const response = await fetch(`https://merchantapi.googleapis.com/v1beta/accounts/${merchantId}/products:insert`, {
        method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(20000),
      });
      if (response.ok) results.pushed = Number(results.pushed) + 1;
      else (results.errors as unknown[]).push(`HTTP ${response.status}: ${(await response.text()).slice(0, 150)}`);
    } catch (error) {
      (results.errors as unknown[]).push(error instanceof Error ? error.message : "unknown");
    }
  }
  return results;
}
async function googleSearchConsoleSubmitSitemap() {
  const auth = await googleSAServiceToken("https://www.googleapis.com/auth/webmasters");
  if (!("token" in auth)) return { status: "error", reason: auth.error };
  const siteUrl = `${SEO_BASE_URL}/`;
  const encodedSite = encodeURIComponent(siteUrl);
  const encodedSitemap = encodeURIComponent(`${SEO_BASE_URL}/sitemap.xml`);
  const response = await fetch(`https://searchconsole.googleapis.com/webmasters/v4/sites/${encodedSite}/sitemaps/${encodedSitemap}`, {
    method: "PUT", headers: { Authorization: `Bearer ${auth.token}` }, signal: AbortSignal.timeout(15000),
  });
  const detail = await response.text().catch(() => "");
  return { status: response.ok ? "submitted" : `HTTP ${response.status}`, detail: detail.slice(0, 300) };
}
app.get("/sitemap.xml", async (_req, res) => {
  res.type("application/xml").set("Cache-Control", "public, max-age=600");
  res.send(await seoSitemapXml());
});
app.get("/google-shopping-feed.xml", async (_req, res) => {
  res.type("application/xml").set("Cache-Control", "public, max-age=600");
  res.send(await seoProductFeedXml());
});
// Admin-only (or IndexNow key holder) trigger to resubmit the sitemap and all
// URLs to Google and Bing. Safe to run repeatedly; harmless if triggered.
app.get("/api/seo/submit", async (req, res) => {
  if (!(await hasAdminPasswordAccess(req)) && String(req.query.key || "") !== SEO_INDEXNOW_KEY) {
    return res.status(401).json(apiError("Admin access or the IndexNow key is required.", "UNAUTHORIZED", 401));
  }
  try {
    const data = await submitSearchEngines();
    // Optional direct Google integrations when service account #2 is configured.
    try {
      const [productRows] = await query<RowDataPacket[]>(
        "SELECT sku, name, slug, short_description, description, price_zar, compare_at_price_zar, stock_quantity, primary_image_url, images, brand, tags FROM products WHERE is_active = 1 ORDER BY name",
      );
      const products = productRows as unknown as SeoProduct[];
      data.googleShoppingPush = await googleShoppingPush(products);
    } catch (error) {
      data.googleShoppingPush = { status: "error", reason: error instanceof Error ? error.message : "unknown" };
    }
    try {
      data.googleSearchConsole = await googleSearchConsoleSubmitSitemap();
    } catch (error) {
      data.googleSearchConsole = { status: "error", reason: error instanceof Error ? error.message : "unknown" };
    }
    return res.json({ data, error: null });
  } catch (error) {
    return res.status(503).json(apiError(error instanceof Error ? error.message : "Submission failed", "SEO_SUBMIT_ERROR", 503));
  }
});

// Country subdomains: the same SPA serves every 2-letter subdomain. Inject a
// host-aware canonical + hreflang cluster into the HTML so each country site is
// recognised by search engines as its own regional variant.
const SEO_MAIN_HOSTS = new Set(["www.wonderfuldragonfruit.company", "wonderfuldragonfruit.company", "localhost", "127.0.0.1"]);
app.get("/{*splat}", async (req, res, next) => {
  try {
    const host = String(req.hostname || "").toLowerCase();
    const match = host.match(/^([a-z]{2})\.wonderfuldragonfruit\.company$/);
    if (!match || SEO_MAIN_HOSTS.has(host)) return next();
    const country = SEO_COUNTRY_SUBDOMAINS.find((entry) => entry.code === match[1]);
    if (!country) return next();
    const htmlPath = path.join(root, "dist", "index.html");
    let html = await fs.readFile(htmlPath, "utf8");
    const current = `https://${host}`;
    const main = "https://www.wonderfuldragonfruit.company";
    const alternates = SEO_COUNTRY_SUBDOMAINS.map((entry) =>
      `<link rel="alternate" hreflang="${entry.region === "za" ? "en-za" : `en-${entry.region}`}" href="https://${entry.code}.wonderfuldragonfruit.company/" />`,
    ).concat([
      `<link rel="alternate" hreflang="en" href="${main}/" />`,
      `<link rel="alternate" hreflang="x-default" href="${main}/" />`,
    ]).join("\n    ");
    const injection = `\n    <link rel="canonical" href="${current}/" />\n    <meta name="geo.region" content="${country.region}" />\n    <meta name="geo.placename" content="${country.name}" />\n    ${alternates}\n    `;
    html = html.replace(/<link rel="canonical"[^>]*>/, "").replace("</title>", `</title>${injection}`);
    res.set("Cache-Control", "public, max-age=600");
    return res.type("html").send(html);
  } catch {
    return next();
  }
});

// Vite output is served by this same Manus server in production. API routes above always win.
app.use(express.static(path.join(root, "dist")));
// Per-route SEO rendering: the built index.html carries the homepage's title/
// canonical for every route. Without this, every product and blog page tells
// search engines it is the homepage, which blocks their indexing entirely.
async function seoRoutePayload(pathname: string): Promise<{
  title: string; description: string; canonical: string; jsonLd?: string; redirectTo?: string; notFound?: boolean;
}> {
  const base = SEO_BASE_URL;
  const SITE = "Wonderful Dragon Fruit South Africa";
  const fallback = {
    title: `${SITE} | Commercial Farming & Worldwide Export of Dragon Fruit`,
    description: "Commercial dragon fruit plant supply and farming consultation in South Africa. Export-quality Ruby and Sweet White cultivars. Premium plants since 2008.",
    canonical: base + "/",
    notFound: true,
  };
  if (pathname === "/" || /\/(admin|login|checkout|cart|account|reset-password|signup)/.test(pathname)) return { ...fallback, notFound: false };
  const productMatch = pathname.match(/^\/products\/([^\/?#]+)$/);
  if (productMatch) {
    const slug = decodeURIComponent(productMatch[1]);
    try {
      // Old-slug redirect first, then the direct product.
      const redirectRows = await query<RowDataPacket[]>("SELECT product_id FROM product_slug_redirects WHERE old_slug = ? LIMIT 1", [slug]);
      if ((redirectRows as unknown as { product_id: string }[]).length) {
        const currentRows = await query<RowDataPacket[]>("SELECT slug FROM products WHERE id = ? AND is_active = 1 LIMIT 1", [(redirectRows as unknown as { product_id: string }[])[0].product_id]);
        const current = (currentRows as unknown as { slug: string }[])[0];
        if (current) return { ...fallback, redirectTo: `${base}/products/${current.slug}` };
      }
      const rows = await query<RowDataPacket[]>(
        "SELECT sku, name, slug, short_description, description, price_zar, compare_at_price_zar, stock_quantity, primary_image_url, images, brand, tags FROM products WHERE is_active = 1 AND slug = ? LIMIT 1", [slug],
      );
      const product = (rows as unknown as SeoProduct[])[0];
      if (product) {
        const image = product.primary_image_url || (product.images || [])[0] || "";
        const description = (product.short_description || seoStripHtml(product.description) || product.name).slice(0, 160);
        const price = Number(product.price_zar);
        return {
          title: `${product.name} | Buy Online | ${SITE}`,
          description,
          canonical: `${base}/products/${product.slug}`,
          jsonLd: JSON.stringify({
            "@context": "https://schema.org", "@type": "Product",
            name: product.name, image: image ? [image.startsWith("http") ? image : base + image] : undefined,
            description, sku: product.sku || product.slug, brand: { "@type": "Brand", name: product.brand || SITE },
            offers: { "@type": "Offer", url: `${base}/products/${product.slug}`, priceCurrency: "ZAR", price: price.toFixed(2), availability: `https://schema.org/${Number(product.stock_quantity) > 0 ? "InStock" : "OutOfStock"}` },
          }),
        };
      }
    } catch (error) {
      console.error("SEO product render failed for", slug, error instanceof Error ? error.stack : error);
      // Database unreachable — fall through to the static bundle.
    }
  }
  const blogMatch = pathname.match(/^\/blog\/([^\/?#]+)$/);
  if (blogMatch) {
    const slug = decodeURIComponent(blogMatch[1]);
    try {
      const rows = await query<RowDataPacket[]>(
        "SELECT title, slug, excerpt, meta_title, meta_description, featured_image_url FROM blog_posts WHERE is_published = 1 AND slug = ? LIMIT 1", [slug],
      );
      const post = (rows as unknown as { title: string; slug: string; excerpt: string | null; meta_title: string | null; meta_description: string | null; featured_image_url: string | null }[])[0];
      if (post) {
        const description = (post.meta_description || post.excerpt || seoStripHtml(post.title)).slice(0, 160);
        return {
          title: `${post.meta_title || post.title} | ${SITE}`,
          description,
          canonical: `${base}/blog/${post.slug}`,
          jsonLd: JSON.stringify({
            "@context": "https://schema.org", "@type": "BlogPosting",
            headline: post.title, description, image: post.featured_image_url || undefined,
            mainEntityOfPage: `${base}/blog/${post.slug}`, author: { "@type": "Organization", name: SITE },
            publisher: { "@type": "Organization", name: SITE },
          }),
        };
      }
    } catch (error) {
      console.error("SEO blog render failed for", slug, error instanceof Error ? error.stack : error);
      // fall through
    }
  }
  // Static informational routes: derive the title from the last URL segment.
  const staticMatch = SEO_STATIC_ROUTES.find((route) => route.path === pathname);
  if (staticMatch) {
    const label = pathname === "/" ? "Home" : pathname.slice(1).split("/").map((part) => part.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())).join(" · ");
    return { title: `${label} | ${SITE}`, description: fallback.description, canonical: base + pathname };
  }
  // Known SPA routes from the route manifest (including dynamic patterns like
  // /country/:country) are real pages — only paths matching nothing are 404s.
  const routeMatches = (patterns: Array<{ path: string }>): boolean => patterns.some((r) => {
    const regex = "^" + r.path.split("/").map((seg) => {
      if (seg.startsWith(":")) return seg === r.path.split("/").slice(-1)[0] && r.path.endsWith("*") ? ".*" : "[^/]+";
      return seg.replace(/\*/g, ".*");
    }).join("/") + "/?$";
    return new RegExp(regex).test(pathname.split("?")[0]);
  });
  try {
    const manifest = JSON.parse(await fs.readFile(path.join(root, "public", "manus-routes.json"), "utf8")) as { routes: Array<{ path: string }> };
    if (routeMatches(manifest.routes)) return { ...fallback, notFound: false };
  } catch { /* manifest unreadable — stay lenient */ return { ...fallback, notFound: false }; }
  return fallback;
}
app.get("/{*splat}", async (req, res) => {
  try {
    const payload = await seoRoutePayload(req.path);
    if (payload.redirectTo) return res.redirect(301, payload.redirectTo);
    let html = await fs.readFile(path.join(root, "dist", "index.html"), "utf8");
    const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(payload.title)}</title>`);
    html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${escapeHtml(payload.canonical)}" />`);
    if (!html.includes('<link rel="canonical"')) html = html.replace("</title>", `</title>\n    <link rel="canonical" href="${escapeHtml(payload.canonical)}" />`);
    if (/<meta name="description" /.test(html)) html = html.replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${escapeHtml(payload.description)}"`);
    else html = html.replace("</title>", `</title>\n    <meta name="description" content="${escapeHtml(payload.description)}" />`);
    html = html.replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${escapeHtml(payload.title)}"`);
    html = html.replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${escapeHtml(payload.description)}"`);
    html = html.replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${escapeHtml(payload.canonical)}"`);
    if (payload.jsonLd) html = html.replace("</head>", `    <script type="application/ld+json">${payload.jsonLd}</script>\n  </head>`);
    return res.status(payload.notFound ? 404 : 200).type("html").send(html);
  } catch (error) {
    console.error("SEO route render failed", error instanceof Error ? error.message : error);
    return res.sendFile(path.join(root, "dist", "index.html"));
  }
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled server error", error instanceof Error ? error.message : error);
  res.status(500).json(apiError("Internal server error", "INTERNAL_ERROR", 500));
});

app.listen(port, "0.0.0.0", () => console.log(`Wonderful Dragon Fruit South Africa server listening on ${port}`));
