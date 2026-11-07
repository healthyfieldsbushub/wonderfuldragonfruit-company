/**
 * Parse Healthy_Fields_Living_Culture_Master_Product_Catalog.md into structured
 * product records. Read-only against the markdown; outputs JSON for the importer.
 *
 * Detailed entries (### N. Title + field bullets) carry the full field set.
 * Summary-table rows (| n | Name | Category | SKU | Price |) covering products
 * 126-167 carry name/category/SKU/price only; variant rows are expanded into
 * one record per concrete SKU via an explicit mapping table below.
 */
import fs from "fs";

const SRC = "/home/ubuntu/upload/Healthy_Fields_Living_Culture_Master_Product_Catalog.md";
const OUT = "/home/ubuntu/dragonfruitafrica/scripts/master-catalog.json";

const text = fs.readFileSync(SRC, "utf8");
const lines = text.split("\n");

// ---------- 1. Parse detailed ### entries ----------
const FIELD_RE = /^\* \*\*(.+?):\*\* (.*)$/;
const HEAD_RE = /^### (\d+)\. (.+)$/;
const CAT_RE = /^## CATEGORY (\d+): (.+)$/;

interface Rec {
  num: number; title: string; name: string; short: string; long: string;
  category: string; sku: string; slug: string; keywords: string; tags: string;
  hashtags: string; dimensions: string; weight: string; price: string;
}

const detailed: Rec[] = [];
let cur: Rec | null = null;
let curField: string | null = null;
let curCat = "";

for (const raw of lines) {
  const line = raw.trim();
  const cm = line.match(CAT_RE);
  if (cm) { curCat = cm[2].trim(); continue; }
  const hm = line.match(HEAD_RE);
  if (hm) {
    cur = { num: Number(hm[1]), title: hm[2].trim(), name: "", short: "", long: "",
      category: curCat, sku: "", slug: "", keywords: "", tags: "", hashtags: "",
      dimensions: "", weight: "", price: "" };
    detailed.push(cur);
    curField = null;
    continue;
  }
  const fm = line.match(FIELD_RE);
  if (fm && cur) {
    const key = fm[1].trim();
    curField = key;
    const val = fm[2].trim();
    if (/^Product Name/i.test(key)) cur.name = val;
    else if (/^Short Description/i.test(key)) cur.short = val;
    else if (/^Long Description/i.test(key)) cur.long = val;
    else if (/^Category/i.test(key)) cur.category = val;
    else if (/^SKU/i.test(key)) cur.sku = val;
    else if (/^Slug/i.test(key)) cur.slug = val;
    else if (/^Keywords/i.test(key)) cur.keywords = val;
    else if (/^Tags/i.test(key)) cur.tags = val;
    else if (/^Hashtags/i.test(key)) cur.hashtags = val;
    else if (/^Dimensions/i.test(key)) cur.dimensions = val;
    else if (/^Weight/i.test(key)) cur.weight = val;
    else if (/^Price/i.test(key)) cur.price = val;
    continue;
  }
  // continuation line for long description
  if (cur && curField && /^Long Description/i.test(curField) && line && !line.startsWith("* **") && !line.startsWith("###") && !line.startsWith("---")) {
    cur.long += " " + line;
  }
}

// ---------- 2. Parse summary table rows ----------
const ROW_RE = /^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/;
const summary: { num: number; name: string; category: string; sku: string; price: string }[] = [];
for (const raw of lines) {
  const m = raw.trim().match(ROW_RE);
  if (m && Number(m[1]) >= 100) {
    summary.push({ num: Number(m[1]), name: m[2].trim(), category: m[3].trim(), sku: m[4].trim(), price: m[5].trim() });
  }
}

// ---------- 3. Expand summary rows 126-167 into concrete SKU records ----------
// Each row becomes one or more concrete products. SKUs follow the live/backup
// conventions already present in the store.
interface Variant { sku: string; nameSuffix: string; price: number; note?: string }

function expandSummary(row: { num: number; name: string; category: string; sku: string; price: string }): { sku: string; name: string; price: number; category: string; baseName: string }[] {
  const out: { sku: string; name: string; price: number; category: string; baseName: string }[] = [];
  const n = row.num;
  const cat = row.category;
  const push = (sku: string, name: string, price: number) => out.push({ sku, name, price, category: cat, baseName: row.name });
  const parseR = (s: string) => Number(s.replace(/[R,\s]/g, ""));

  switch (n) {
    case 126: push("HF-BUS-1073", "Complete Dragon Fruit Business Plan Combo", 1500); break;
    case 127: push("HF-BUS-1HA-001", "1 Hectare Dragon Fruit Business Plan", 1500); break;
    case 128: push("HF-BUS-2HA-001", "2 Hectare Dragon Fruit Business Plan", 1500); break;
    case 129: push("HF-BUS-3HA-001", "3 Hectare Dragon Fruit Business Plan", 1500); break;
    case 130: push("HF-BUS-5HA-001", "5 Hectare Dragon Fruit Business Plan", 1500); break;
    case 131: push("HF-BUS-AFM-001", "Agricultural Funding Manual & Contact Directory", 250); break;
    case 132: push("HF-CON-1074", "One-on-One Consultation", 250); break;
    case 133: push("HF-CON-VID-001", "Video Consultation", 250); break;
    case 134: push("HF-CON-FVC-001", "Farm Visit & Consultation Package", 850); break;
    case 135: push("HF-CON-PGC-001", "Premium Genetics Consultation", 850); break;
    case 136: push("HF-CON-1075", "Farm Setup Consulting Package", 1850); break;
    case 137: push("HF-SER-1076", "Cutting Rooting Service", 30); break;
    case 138: push("HF-MEM-DFA-1M", "Dragon Fruit Association Membership — 1 Month", 3000); break;
    case 139: push("HF-MEM-DFA-3M", "Dragon Fruit Association Membership — 3 Months", 6000); break;
    case 140: push("HF-MEM-DFA-6M", "Dragon Fruit Association Membership — 6 Months", 12000); break;
    case 141: push("HF-MEM-1077", "Dragon Fruit Association Membership — 12 Months", 25000); break;
    case 142:
      push("HF-ALG-CHL-100L", "100L Chlorella Vulgaris Live Culture", 54999);
      push("HF-ALG-CHL-100L-INST", "100L Chlorella Vulgaris Live Culture (Institutional)", 19249.65); break;
    case 143:
      push("HF-ALG-CHL-50L", "50L Chlorella Vulgaris Live Culture", 29999);
      push("HF-ALG-CHL-50L-INST", "50L Chlorella Vulgaris Live Culture (Institutional)", 10499.65); break;
    case 144:
      push("HF-ALG-CHL-20L", "20L Chlorella Vulgaris Live Culture", 12499);
      push("HF-ALG-CHL-20L-INST", "20L Chlorella Vulgaris Live Culture (Institutional)", 4374.65); break;
    case 145:
      push("HF-ALG-CHL-10L", "10L Chlorella Vulgaris Live Culture", 6499);
      push("HF-ALG-CHL-5L", "5L Chlorella Vulgaris Live Culture", 3499);
      push("HF-ALG-CHL-1L", "1L Chlorella Vulgaris Live Culture", 849);
      push("HF-ALG-CHL-500ML", "500ml Chlorella Vulgaris Live Culture", 449);
      push("HF-ALG-CHL-250ML", "250ml Chlorella Vulgaris Live Culture", 249); break;
    case 146:
      push("HF-ALG-SPI-100L", "100L Spirulina Platensis Live Culture", 54999);
      push("HF-ALG-SPI-100L-INST", "100L Spirulina Platensis Live Culture (Institutional)", 19249.65); break;
    case 147:
      push("HF-ALG-SPI-50L", "50L Spirulina Platensis Live Culture", 29999);
      push("HF-ALG-SPI-50L-INST", "50L Spirulina Platensis Live Culture (Institutional)", 10499.65); break;
    case 148:
      push("HF-ALG-SPI-20L", "20L Spirulina Platensis Live Culture", 12499);
      push("HF-ALG-SPI-20L-INST", "20L Spirulina Platensis Live Culture (Institutional)", 4374.65); break;
    case 149:
      push("HF-ALG-SPI-10L", "10L Spirulina Platensis Live Culture", 6499);
      push("HF-ALG-SPI-5L", "5L Spirulina Platensis Live Culture", 3499);
      push("HF-ALG-SPI-1L", "1L Spirulina Platensis Live Culture", 849);
      push("HF-ALG-SPI-500ML", "500ml Spirulina Platensis Live Culture", 449);
      push("HF-ALG-SPI-250ML", "250ml Spirulina Platensis Live Culture", 249); break;
    case 150:
      push("HF-FER-SPI-1KG", "Premium Spirulina Growth Fertilizer 1kg", 500);
      push("HF-FER-CHL-1KG", "Premium Chlorella Growth Fertilizer 1kg", 500);
      push("HF-FER-SPI-250ML", "Premium Spirulina Growth Fertilizer 250ml", 250);
      push("HF-FER-CHL-250ML", "Premium Chlorella Growth Fertilizer 250ml", 250); break;
    case 151: push("HF-FER-ACV-10C", "Raw Apple Cider Vinegar Mother — 10 Live Cultures Combo", 1400); break;
    case 152:
      push("HF-FER-KEFIR-B10", "Bulk Water Kefir Grains 10 Pack", 1400);
      push("HF-FER-KEFIR-W1", "Water Kefir Grains Single Pack", 200);
      push("HF-FER-KEFIR-M1", "Milk Kefir Grains Single Pack", 200);
      push("HF-FER-KEFIR-KIT", "Kefir Starter Kit", 300); break;
    case 153:
      push("HF-FER-COCO-M1", "Coconut Milk Kefir Starter", 350);
      push("HF-FER-COCO-W1", "Coconut Water Kefir Kit", 350); break;
    case 154: push("HF-FER-GBP-001", "Genuine Live Ginger Beer Plant", 200); break;
    case 155:
      push("HF-FER-VMO-WW", "Artisan White Wine Vinegar Mother", 200);
      push("HF-FER-VMO-RW", "Artisan Red Wine Vinegar Mother", 200);
      push("HF-FER-VMO-AC", "Artisan Apple Cider Vinegar Mother", 200); break;
    case 156:
      push("HF-FER-SRD-WG", "Wholegrain Sourdough Starter", 200);
      push("HF-FER-SRD-RY", "Rye Sourdough Starter", 200);
      push("HF-FER-SRD-WB", "White Bread Sourdough Starter", 200); break;
    case 157:
      push("HF-FER-SKB-GRN", "Premium Kombucha SCOBY — Green Tea", 200);
      push("HF-FER-SKB-BLK", "Premium Kombucha SCOBY — Black Tea", 200);
      push("HF-FER-SKB-ROO", "Premium Kombucha SCOBY — Rooibos", 250);
      push("HF-FER-SKB-COF", "Premium Kombucha SCOBY — Coffee", 250); break;
    case 158:
      push("HF-FER-TMP", "Tempeh Starter Culture", 250);
      push("HF-FER-NTT", "Natto Starter Culture", 250);
      push("HF-FER-LCT", "Lacto-Fermentation Starter", 149);
      push("HF-FER-GBG", "Ginger Bug Starter", 149);
      push("HF-FER-YGT", "Yogurt Starter Culture", 149); break;
    case 159: push("HF-FZN-POWDER-5L", "Premium Frozen Yogurt Powder 5L Mix (7 Flavors)", 350); break;
    case 160:
      push("HF-BIO-PND-1L", "BioPond EM1 Water Treatment 1L", 299);
      push("HF-BIO-PND-5L", "BioPond EM1 Water Treatment 5L", 1099);
      push("HF-BIO-PND-20L", "BioPond EM1 Water Treatment 20L Bulk", 3499); break;
    case 161:
      push("HF-BIO-GRN-1L", "BioGreen A-Z Liquid Bio-Fertilizer 1L", 299);
      push("HF-BIO-GRN-5L", "BioGreen A-Z Liquid Bio-Fertilizer 5L", 1099);
      push("HF-BIO-GRN-20L", "BioGreen A-Z Liquid Bio-Fertilizer 20L Bulk", 3699); break;
    case 162:
      push("HF-BIO-SL-1L", "EM1 Soil Treatment 1L", 249);
      push("HF-BIO-SL-5L", "EM1 Soil Treatment 5L", 899);
      push("HF-BIO-SL-20L", "EM1 Soil Treatment 20L Bulk", 2999); break;
    case 163:
      push("HF-SUP-BSG-2KG", "Premium Natural Brown Sugar 2kg", 89);
      push("HF-SUP-BSG-10KG", "Premium Natural Brown Sugar 10kg", 349);
      push("HF-SUP-BSG-25KG", "Premium Natural Brown Sugar 25kg", 749);
      push("HF-SUP-BSG-50KG", "Premium Natural Brown Sugar 50kg Bulk", 1349); break;
    case 164:
      push("HF-SUP-DE-1KG", "100% Pure Food Grade Diatomaceous Earth 1kg", 149);
      push("HF-SUP-DE-10KG", "100% Pure Food Grade Diatomaceous Earth 10kg", 599);
      push("HF-SUP-DE-25KG", "100% Pure Food Grade Diatomaceous Earth 25kg Bulk", 1199); break;
    case 165:
      push("HF-WHT-TRAY", "Premium Live Wheatgrass Tray", 80);
      push("HF-WHT-SED-5KG", "Premium Wheatgrass Seeds 5kg", 160);
      push("HF-WHT-SED-10KG", "Premium Wheatgrass Seeds 10kg", 320);
      push("HF-WHT-SED-25KG", "Premium Wheatgrass Seeds 25kg Bulk", 1199); break;
    case 166:
      push("HF-SOY-5KG", "Premium Non-GMO Soya Beans 5kg", 160);
      push("HF-SOY-10KG", "Premium Non-GMO Soya Beans 10kg", 359);
      push("HF-SOY-25KG", "Premium Non-GMO Soya Beans 25kg Wholesale", 799); break;
    case 167:
      push("HF-EQP-KIT", "Artisan Fermentation Complete Kit", 899);
      push("HF-EQP-STRAINER", "Fermentation Strainer", 129);
      push("HF-EQP-NUTMILK", "Nut Milk Bag", 89);
      push("HF-EQP-CHEESECLOTH", "Cheesecloth", 69); break;
    default:
      // 107-125 overlap with detailed entries; skip (detailed wins)
      break;
  }
  return out;
}

const summaryOnly = summary.filter(r => r.num >= 126).flatMap(expandSummary);

fs.writeFileSync(OUT, JSON.stringify({ detailed, summaryOnly, summaryCount: summary.length }, null, 2));
console.log(`detailed entries: ${detailed.length}`);
console.log(`summary rows: ${summary.length}`);
console.log(`summary-only expanded products: ${summaryOnly.length}`);
console.log(`total catalog products: ${detailed.length + summaryOnly.length}`);
const missingFields = detailed.filter(d => !d.sku || !d.slug || !d.price || !d.short || !d.long);
console.log(`detailed entries missing required fields: ${missingFields.length}`);
missingFields.slice(0, 5).forEach(d => console.log(`  #${d.num} ${d.title} sku=${d.sku} slug=${d.slug} price=${d.price}`));
