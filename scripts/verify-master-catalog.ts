/** Verify every concrete catalog SKU exists live with complete fields. Read-only. */
import fs from "fs";
import mysql from "mysql2/promise";

const env = fs.readFileSync("/var/lib/manus/addon-projects/4b396568ce8247d70e7ce82e8737b08065471f1daac676baa73178107b71e48b.env", "utf8");
const url = new URL(env.match(/export DATABASE_URL='([^']+)'/)![1]);
const concrete = JSON.parse(fs.readFileSync("/home/ubuntu/dragonfruitafrica/scripts/concrete-catalog.json", "utf8")) as Array<{ sku: string; name: string; slug: string }>;

(async () => {
  const c = await mysql.createConnection({ host: url.hostname, port: Number(url.port || 3306), user: url.username, password: url.password, database: url.pathname.replace("/", ""), ssl: {}, connectTimeout: 20000 });
  const [rows] = (await c.query("SELECT sku, slug, name, short_description, description, meta_title, meta_description, tags, hashtags, weight_kg, price_zar, category_id, search_text FROM products WHERE is_active=1")) as any[];
  const by = new Map<string, any>(rows.map((r: any) => [r.sku, r]));

  const missing = concrete.filter(r => !by.has(r.sku));
  console.log(`catalog concrete: ${concrete.length} | live active: ${rows.length}`);
  console.log(`catalog SKUs missing from live: ${missing.length}`);
  missing.forEach(r => console.log("  MISSING:", r.sku, "|", r.name));

  // field completeness for all active products
  let bad = 0;
  for (const r of rows) {
    const probs: string[] = [];
    if (!r.slug) probs.push("slug");
    if (!r.short_description) probs.push("short");
    if (!r.description) probs.push("long");
    if (!r.meta_title) probs.push("meta_title");
    if (!r.meta_description) probs.push("meta_desc");
    if (!r.tags || r.tags === "[]") probs.push("tags");
    if (!r.weight_kg) probs.push("weight");
    if (!r.price_zar) probs.push("price");
    if (!r.category_id) probs.push("category");
    if (!r.search_text) probs.push("search_text");
    if (probs.length) { bad++; if (bad <= 15) console.log("  INCOMPLETE:", r.sku, "->", probs.join(",")); }
  }
  console.log(`active products with incomplete fields: ${bad}`);

  // duplicate slug check
  const slugCount = new Map<string, number>();
  rows.forEach((r: any) => slugCount.set(r.slug, (slugCount.get(r.slug) || 0) + 1));
  const dupSlugs = [...slugCount.entries()].filter(([, n]) => n > 1);
  console.log(`duplicate slugs: ${dupSlugs.length}`, dupSlugs.slice(0, 5).map(([s, n]) => `${s}(x${n})`).join(", "));

  await c.end();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
