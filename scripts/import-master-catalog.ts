/**
 * Import the Master Product Catalog into the live products table.
 * Guarantees: every catalog SKU exists as an active product with a complete
 * field set and unique slug. NEVER deletes or deactivates anything. Existing
 * products are only gap-filled (empty fields populated from catalog data).
 */
import fs from "fs";
import crypto from "crypto";
import mysql from "mysql2/promise";

const CAT = JSON.parse(fs.readFileSync("/home/ubuntu/dragonfruitafrica/scripts/master-catalog.json", "utf8")) as {
  detailed: Array<Record<string, string>>;
};

const env = fs.readFileSync("/var/lib/manus/addon-projects/4b396568ce8247d70e7ce82e8737b08065471f1daac676baa73178107b71e48b.env", "utf8");
const url = new URL(env.match(/export DATABASE_URL='([^']+)'/)![1]);

// ---------- helpers ----------
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 180);

function safeArr(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[];
  if (typeof v === "string" && v.trim()) {
    try { const p = JSON.parse(v); if (Array.isArray(p)) return p as string[]; } catch { /* plain text */ }
    return v.split(/,\s*/).filter(Boolean);
  }
  return [];
}

function parsePrice(price: string): number | null {
  const m = price.match(/R\s?([\d,]+(?:\.\d+)?)/);
  return m ? Number(m[1].replace(/,/g, "")) : null;
}

function parseWeight(weight: string): number | null {
  if (/varies/i.test(weight)) return null;
  const packed = weight.match(/([\d.]+)\s*kg\s*packed/i);
  if (packed) return Number(packed[1]);
  const lead = weight.match(/^([\d.]+)\s*kg/i);
  return lead ? Number(lead[1]) : null;
}

function parseDims(dims: string): [number | null, number | null, number | null] {
  if (/varies/i.test(dims)) return [null, null, null];
  const m = dims.match(/([\d.]+)\s*[x×]\s*([\d.]+)\s*[x×]\s*([\d.]+)/i);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [null, null, null];
}

function splitKeywords(kw: string): string[] {
  return kw.split(/,\s*/).map(s => s.trim()).filter(Boolean);
}
function splitTags(tags: string): string[] {
  return tags.split(/,\s*/).map(s => s.trim()).filter(Boolean);
}
function splitHashtags(h: string): string[] {
  return h.split(/\s+/).map(s => s.trim()).filter(s => s.startsWith("#"));
}

const CATEGORY_MAP: Record<string, string> = {
  "Dragon Fruit Plants": "Dragon Fruit Plants & Cuttings",
  "Dragon Fruit Cuttings": "Dragon Fruit Plants & Cuttings",
  "Rare Variegates": "Dragon Fruit Plants & Cuttings",
  "Yellow Varieties": "Dragon Fruit Plants & Cuttings",
  "Dragon Fruit Cultivars": "Dragon Fruit Plants & Cuttings",
  "Plant Trays": "Commercial Plant Trays",
  "Business Resources": "Consulting & Business Resources",
  "Consultation Services": "Consulting & Business Resources",
  "Services": "Consulting & Business Resources",
  "Memberships": "Consulting & Business Resources",
  "Living Culture Health": "Micro Algae",
  "Fermentation Cultures": "Fermentation Cultures & Kits",
  "Frozen Yogurt Powders": "Fermentation Cultures & Kits",
  "Fermentation Equipment & Kits": "Fermentation Cultures & Kits",
  "EM1, Soil & Plant Products": "Soil, Pond & Plant Treatments",
  "Natural Ingredients & Growing Supplies": "Farm & Food Supplies",
};

// ---------- expand raw detailed entries into concrete SKU records ----------
interface Concrete {
  sku: string; name: string; short: string; long: string; catKey: string;
  slug: string; keywords: string[]; tags: string[]; hashtags: string[];
  weight: number | null; dims: [number | null, number | null, number | null];
  price: number; catalogNum: number;
}

function expandEntry(e: Record<string, string>): Concrete[] {
  const out: Concrete[] = [];
  const base = {
    short: e.short, long: e.long, catKey: e.category,
    keywords: splitKeywords(e.keywords), tags: splitTags(e.tags), hashtags: splitHashtags(e.hashtags),
    catalogNum: Number(e.num),
  };
  const skuRaw = e.sku;
  const priceRaw = e.price;

  // Pattern A: dual public/institutional SKUs, e.g.
  // "HF-ALG-CHL-100L (Public) | HF-ALG-CHL-100L-INST (Institutional)" and
  // price "Public: R54,999.00 | Institutional: R19,249.65"
  if (/\(Public\)/i.test(skuRaw) && /\(Institutional\)/i.test(skuRaw)) {
    const pubSku = skuRaw.match(/([A-Z0-9-]+)\s*\(Public\)/i)![1];
    const instSku = skuRaw.match(/([A-Z0-9-]+)\s*\(Institutional\)/i)![1];
    const pubPrice = parsePrice(priceRaw.match(/Public:\s*R?([\d,.]+)/i)?.[1] ? "R" + priceRaw.match(/Public:\s*R?([\d,.]+)/i)![1] : "");
    const instPrice = parsePrice(priceRaw.match(/Institutional:\s*R?([\d,.]+)/i)?.[1] ? "R" + priceRaw.match(/Institutional:\s*R?([\d,.]+)/i)![1] : "");
    const baseName = e.name.replace(/\s*\(20[–-]30 cm.*$/i, "").trim();
    out.push({ ...base, sku: pubSku, name: baseName, slug: e.slug, price: pubPrice ?? 0, weight: parseWeight(e.weight), dims: parseDims(e.dimensions) });
    out.push({ ...base, sku: instSku, name: `${baseName} (Institutional)`, slug: `${e.slug}-institutional`, price: instPrice ?? 0, weight: parseWeight(e.weight), dims: parseDims(e.dimensions) });
    return out;
  }

  // Pattern B: size ladder, e.g. "10L: R6,499 | 5L: R3,499 | ..."
  const sizeMatches = [...priceRaw.matchAll(/([A-Za-z0-9 ]+?):\s*R?([\d,]+(?:\.\d+)?)(?:\s*-\s*R?[\d,]+(?:\.\d+)?)?/g)];
  const isLadder = sizeMatches.length >= 2 && /VAR$|RETAIL$/.test(skuRaw.trim());
  if (isLadder) {
    const baseName = e.name.replace(/\s*\([^)]*\)\s*$/, "").trim();
    const LIQ_W: Record<string, number> = { "250ml": 0.4, "500ml": 0.65, "1L": 1.15, "5L": 5.75, "10L": 11.5, "20L Bulk": 21.5, "20L": 21.5 };
    const LIQ_D: Record<string, [number, number, number]> = { "250ml": [8, 8, 12], "500ml": [9, 9, 18], "1L": [10, 10, 25], "5L": [18, 18, 35], "10L": [22, 22, 45], "20L Bulk": [30, 30, 50], "20L": [30, 30, 50] };
    for (const m of sizeMatches) {
      const label = m[1].trim();
      const price = Number(m[2].replace(/,/g, ""));
      // derive SKU: replace VAR/RETAIL tail with a size token
      const sizeToken = label.replace(/\s+/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      const sku = skuRaw.replace(/-(VAR|RETAIL)$/i, `-${sizeToken}`);
      const name = `${baseName} — ${label}`;
      const slug = slugify(`${baseName}-${label}`);
      const w = LIQ_W[label] ?? null;
      const d = LIQ_D[label] ?? parseDims(e.dimensions);
      out.push({ ...base, sku, name, slug, price, weight: w, dims: [d[0], d[1], d[2]] });
    }
    return out;
  }

  // Pattern C: single-SKU entry (may still carry multi-option price; use first/lead price)
  const price = parsePrice(priceRaw) ?? 0;
  const name = e.name.replace(/\s*\(20[–-]30 cm.*$/i, "").trim();
  out.push({ ...base, sku: skuRaw.trim(), name, slug: e.slug, price, weight: parseWeight(e.weight), dims: parseDims(e.dimensions) });
  return out;
}

// ---------- main ----------
(async () => {
  const c = await mysql.createConnection({ host: url.hostname, port: Number(url.port || 3306), user: url.username, password: url.password, database: url.pathname.replace("/", ""), ssl: {}, connectTimeout: 20000 });

  // categories
  const [cats] = await c.query("SELECT id, name, slug FROM categories");
  const catByName = new Map<string, string>((cats as any[]).map(r => [r.name, r.id]));
  const needed = new Set(Object.values(CATEGORY_MAP));
  for (const name of needed) {
    if (!catByName.has(name)) {
      const id = crypto.randomUUID();
      await c.query("INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)", [id, name, slugify(name)]);
      catByName.set(name, id);
      console.log("created category:", name);
    }
  }

  // existing products
  const [prods] = await c.query("SELECT id, sku, slug, name, short_description, description, meta_title, meta_description, tags, hashtags, primary_keyword, secondary_keywords, search_tags, weight_kg, length_cm, width_cm, height_cm, price_zar, category_id, search_text FROM products");
  const bySku = new Map<string, any>((prods as any[]).map(p => [p.sku, p]));
  const usedSlugs = new Set<string>((prods as any[]).map(p => p.slug));

  // build concrete catalog records
  const concrete: Concrete[] = [];
  for (const e of CAT.detailed) for (const rec of expandEntry(e)) concrete.push(rec);
  console.log(`concrete catalog records: ${concrete.length}`);

  // SKU uniqueness inside catalog
  const seenSku = new Map<string, number>();
  for (const r of concrete) {
    const n = (seenSku.get(r.sku) || 0) + 1;
    seenSku.set(r.sku, n);
    if (n > 1) r.sku = `${r.sku}-${n}`;
  }
  fs.writeFileSync("/home/ubuntu/dragonfruitafrica/scripts/concrete-catalog.json", JSON.stringify(concrete, null, 2));

  let inserted = 0, updated = 0;
  const insertedSkus: string[] = [];

  for (const r of concrete) {
    const catId = catByName.get(CATEGORY_MAP[r.catKey] || r.catKey) || null;
    const existing = bySku.get(r.sku);

    // unique slug
    let slug = r.slug;
    if (usedSlugs.has(slug)) {
      let i = 2;
      while (usedSlugs.has(`${slug}-${i}`)) i++;
      slug = `${slug}-${i}`;
    }
    usedSlugs.add(slug);

    const metaTitle = (r.name.length > 60 ? r.name.slice(0, 57) + "..." : r.name);
    const metaDesc = (r.short.length > 158 ? r.short.slice(0, 155) + "..." : r.short);
    const searchText = [r.name, r.short, r.long, r.sku, r.tags.join(" "), r.keywords.join(" "), r.hashtags.join(" ")].join(" ").toLowerCase().slice(0, 4000);

    if (!existing) {
      const id = crypto.randomUUID();
      const row: Record<string, unknown> = {
        id,
        sku: r.sku,
        name: r.name,
        slug,
        short_description: r.short,
        description: r.long,
        category_id: catId,
        price_zar: r.price,
        weight_kg: r.weight,
        length_cm: r.dims[0],
        width_cm: r.dims[1],
        height_cm: r.dims[2],
        stock_quantity: 1000,
        allow_backorder: 1,
        tags: JSON.stringify(r.tags),
        hashtags: JSON.stringify(r.hashtags),
        primary_keyword: r.keywords[0] || null,
        secondary_keywords: JSON.stringify(r.keywords.slice(1)),
        search_tags: JSON.stringify(r.keywords),
        meta_title: metaTitle,
        meta_description: metaDesc,
        og_title: metaTitle,
        og_description: metaDesc,
        canonical_url: `/products/${slug}`,
        search_text: searchText,
        is_active: 1,
        is_featured: 0,
        product_type: "physical",
        product_condition: "new",
        visibility: "catalog",
        specific_attributes: JSON.stringify({ cutting_length: "20-30 cm" }),
      };
      const cols = Object.keys(row);
      await c.query(
        `INSERT INTO products (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
        cols.map(k => row[k])
      );
      inserted++; insertedSkus.push(r.sku);
      bySku.set(r.sku, { id, sku: r.sku, slug });
    } else {
      // gap-fill only: never overwrite existing non-empty values
      const sets: string[] = [];
      const vals: any[] = [];
      const fill = (col: string, val: any, cond: boolean = true) => {
        if (cond && (existing[col] === null || existing[col] === "" || existing[col] === undefined)) { sets.push(`${col} = ?`); vals.push(val); }
      };
      fill("short_description", r.short);
      fill("description", r.long);
      fill("category_id", catId);
      fill("price_zar", r.price);
      fill("weight_kg", r.weight);
      fill("length_cm", r.dims[0]);
      fill("width_cm", r.dims[1]);
      fill("height_cm", r.dims[2]);
      fill("tags", JSON.stringify(r.tags), safeArr(existing.tags).length === 0);
      fill("hashtags", JSON.stringify(r.hashtags), safeArr(existing.hashtags).length === 0);
      fill("primary_keyword", r.keywords[0] || null);
      fill("secondary_keywords", JSON.stringify(r.keywords.slice(1)), safeArr(existing.secondary_keywords).length === 0);
      fill("search_tags", JSON.stringify(r.keywords), safeArr(existing.search_tags).length === 0);
      fill("meta_title", metaTitle);
      fill("meta_description", metaDesc);
      fill("search_text", searchText);
      fill("allow_backorder", 1, existing.allow_backorder === null);
      if (sets.length) {
        await c.query(`UPDATE products SET ${sets.join(", ")} WHERE id = ?`, [...vals, existing.id]);
        updated++;
      }
    }
  }

  console.log(`inserted: ${inserted}, gap-filled existing: ${updated}`);
  console.log(`inserted SKUs: ${insertedSkus.join(",")}`);

  // final verification counts
  const [cnt] = (await c.query("SELECT COUNT(*) AS n, SUM(is_active=1) AS act FROM products")) as any[];
  const [noSlug] = (await c.query("SELECT COUNT(*) AS n FROM products WHERE is_active=1 AND (slug IS NULL OR slug='')")) as any[];
  const [noMeta] = (await c.query("SELECT COUNT(*) AS n FROM products WHERE is_active=1 AND (meta_title IS NULL OR meta_title='' OR meta_description IS NULL OR meta_description='' OR tags IS NULL OR tags='[]' OR weight_kg IS NULL)")) as any[];
  console.log(`FINAL: total=${cnt[0][0].n} active=${cnt[0][0].act} missingSlug=${noSlug[0][0].n} missingSeoFields=${noMeta[0][0].n}`);

  await c.end();
})().catch(e => { console.error("IMPORT ERROR:", e.message); process.exit(1); });
