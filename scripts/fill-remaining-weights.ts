/** Fill weight_kg/dims for products the catalog marked "Varies". Idempotent, fills only nulls. */
import fs from "fs";
import mysql from "mysql2/promise";

const env = fs.readFileSync("/var/lib/manus/addon-projects/4b396568ce8247d70e7ce82e8737b08065471f1daac676baa73178107b71e48b.env", "utf8");
const url = new URL(env.match(/export DATABASE_URL='([^']+)'/)![1]);

// SKU -> [weight_kg, L, W, H] — derived from catalog hints and standard packaging
const W: Record<string, [number, number, number, number]> = {
  "HF-SUP-BSG-2KG": [2.15, 20, 15, 8], "HF-SUP-BSG-10KG": [10.3, 40, 30, 15], "HF-SUP-BSG-25KG": [25.6, 50, 40, 18], "HF-SUP-BSG-50KGBULK": [50.8, 60, 45, 25],
  "HF-SUP-DE-1KG": [1.1, 25, 18, 10], "HF-SUP-DE-10KG": [10.3, 40, 30, 20], "HF-SUP-DE-25KGBULK": [25.6, 50, 40, 25],
  "HF-WHT-SED-LIVETRAY": [1.5, 30, 20, 6], "HF-WHT-SED-5KGSEEDS": [5.1, 30, 25, 12], "HF-WHT-SED-10KGSEEDS": [10.2, 35, 30, 15], "HF-WHT-SED-25KGBULK": [25.5, 50, 40, 20],
  "HF-SOY-BEA-5KG": [5.1, 30, 25, 12], "HF-SOY-BEA-10KG": [10.2, 35, 30, 15], "HF-SOY-BEA-25KGWHOLESALE": [25.5, 50, 40, 20],
  "HF-EQP-COMPLETEKIT": [2.5, 30, 25, 20], "HF-EQP-STRAINER": [0.3, 25, 12, 8], "HF-EQP-NUTMILKBAG": [0.1, 20, 15, 2], "HF-EQP-CHEESECLOTH": [0.1, 25, 20, 2],
  "HF-FER-COCO-KEFIR": [0.5, 10, 10, 18], "HF-FER-ALGAE-FERT": [1.2, 10, 10, 25],
};

(async () => {
  const c = await mysql.createConnection({ host: url.hostname, port: Number(url.port || 3306), user: url.username, password: url.password, database: url.pathname.replace("/", ""), ssl: {}, connectTimeout: 20000 });
  let fixed = 0;
  for (const [sku, [w, l, wd, h]] of Object.entries(W)) {
    const [res] = (await c.query("UPDATE products SET weight_kg = ?, length_cm = COALESCE(length_cm, ?), width_cm = COALESCE(width_cm, ?), height_cm = COALESCE(height_cm, ?) WHERE sku = ? AND (weight_kg IS NULL OR weight_kg = 0)", [w, l, wd, h, sku])) as any;
    if (res.affectedRows) { fixed++; console.log("fixed", sku, "->", w, "kg"); }
  }
  const [left] = (await c.query("SELECT sku FROM products WHERE is_active=1 AND (weight_kg IS NULL OR weight_kg=0)")) as any;
  console.log(`fixed: ${fixed} | products still missing weight: ${left.length}`, left.map((r: any) => r.sku).join(","));
  await c.end();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
