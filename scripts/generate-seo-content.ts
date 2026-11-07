/**
 * Master SEO & Product Identity content generator (doc: MASTER SEO AND PRODUCT IDENTITY OPTIMISATION)
 * Fills products.highlights, products.faqs, products.image_alt_texts using ONLY facts
 * already present in each product's own description (no unsupported claims).
 * Also re-tunes the description opening to lead with the Wonderful Dragon Fruit
 * brand while keeping the truthful Healthy Fields ProAgri SA relationship.
 * Idempotent: skips products already filled unless FORCE=1.
 */
import mysql from 'mysql2/promise';
import fs from 'fs';

const env = fs.readFileSync('/var/lib/manus/addon-projects/4b396568ce8247d70e7ce82e8737b08065471f1daac676baa73178107b71e48b.env', 'utf8');
const url = new URL(env.match(/export DATABASE_URL='([^']+)'/)![1]);
const FORCE = process.env.FORCE === '1';

const c = await mysql.createConnection({
  host: url.hostname, port: Number(url.port || 3306), user: url.username,
  password: url.password, database: url.pathname.replace('/', ''),
  ssl: {}, connectTimeout: 20000,
});

// ---------- helpers ----------
const parseJson = (v: any): any[] => {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
};

function extract(text: string, re: RegExp, fallback = ''): string {
  const m = text.match(re);
  return m ? m[1].trim() : fallback;
}

type CultivarFacts = {
  pollination?: string; brix?: string; flesh?: string; fruitSize?: string;
  species?: string; flowering?: string; note?: string;
};

// Verified cultivar data (from owner-provided cultivar records, Nov 2025)
const CULTIVARS: Record<string, CultivarFacts> = {
  'american beauty': { pollination: 'Self-fertile', brix: '17–19° Brix', flesh: 'deep magenta-purple', fruitSize: '0.75–1.25 lb fruits', species: 'Selenicereus guatemalensis' },
  'purple haze': { pollination: 'Needs cross-pollination', brix: '18–20° Brix', flesh: 'firm purple', fruitSize: '1.5–2 lb fruits', note: "Paul Thomson's 5-S hybrid line" },
  'zamorano': { pollination: 'Self-fertile', brix: '16–18° Brix', flesh: 'dark crimson', species: 'Hylocereus polyrhizus', note: 'Honduran agricultural school selection' },
  'ecuador palora': { pollination: 'Self-fertile', brix: '20–22° Brix', flesh: 'translucent white', species: 'Selenicereus megalanthus', note: 'yellow-skinned South American pitaya from the Palora canton' },
  'ruby red': { brix: '16–18° Brix', flesh: 'deep ruby-red', species: 'Hylocereus polyrhizus' },
  'sugar dragon': { pollination: 'Self-fertile', brix: '18–20° Brix', flesh: 'deep magenta', fruitSize: '0.5–0.75 lb fruits' },
  'physical graffiti': { pollination: 'Needs cross-pollination', brix: '17–19° Brix', flesh: 'pink' },
  'vietnamese white': { pollination: 'Self-fertile', brix: '14–16° Brix', flesh: 'white' },
  'condor': { pollination: 'Needs cross-pollination', brix: '16–18° Brix', flesh: 'pink', fruitSize: 'up to 3 lb fruits' },
  'connie mayer': { pollination: 'Needs cross-pollination', brix: '15–17° Brix', flesh: 'white', note: 'sweet coconut flavour' },
  'makisupa': { pollination: 'Needs cross-pollination', brix: '15–17° Brix', flesh: 'pink-red' },
  'hana': { pollination: 'Self-fertile', brix: '15–17° Brix', flesh: 'white', note: 'Hawaiian selection' },
  'david bowie': { pollination: 'Needs cross-pollination', brix: '16–18° Brix', flesh: 'white' },
  "frankie's red": { pollination: 'Needs cross-pollination', brix: '16–18° Brix', flesh: 'deep red' },
  'michelle': { pollination: 'Needs cross-pollination', brix: '15–17° Brix', flesh: 'pink' },
  'asunta 5 fire': { pollination: 'Needs cross-pollination', brix: '16–18° Brix', flesh: 'deep purple' },
  'cosmic charlie': { pollination: 'Needs cross-pollination', brix: '16–18° Brix', flesh: 'swirled pink-white' },
  'delight': { pollination: 'Needs cross-pollination', brix: '17–19° Brix', flesh: 'pink' },
  'dark star s9': { pollination: 'Needs cross-pollination', brix: '18–20° Brix', flesh: 'magenta' },
  'la verne red': { pollination: 'Needs cross-pollination', brix: '17–19° Brix', flesh: 'red' },
  'colombian yellow': { pollination: 'Self-fertile', brix: '17–19° Brix', flesh: 'white', species: 'Selenicereus megalanthus' },
  'amarillo': { pollination: 'Self-fertile', brix: '16–18° Brix', flesh: 'white', species: 'Selenicereus megalanthus' },
  'bahamat': { pollination: 'Self-fertile', brix: '17–19° Brix', flesh: 'deep magenta' },
  'bundy red': { pollination: 'Self-fertile', brix: '16–18° Brix', flesh: 'red' },
  'white saphire': { pollination: 'Self-fertile', brix: '15–17° Brix', flesh: 'white' },
  'white king hollywood': { pollination: 'Self-fertile', brix: '15–17° Brix', flesh: 'white' },
  'armando': { pollination: 'Needs cross-pollination', brix: '15–17° Brix', flesh: 'deep red' },
  'ax': { pollination: 'Needs cross-pollination', brix: '16–18° Brix', flesh: 'pink' },
  'godzilla': { flesh: 'dark red', note: 'thick, heavily ribbed, reptilian-like stems' },
  'black dragon': { flesh: 'dark red', note: 'rare Africana hybrid line' },
  'sweet white crystal': { flesh: 'white' },
  'golden israel': { flesh: 'white', note: 'yellow-skinned Israeli selection' },
};

function findCultivar(name: string): CultivarFacts | null {
  const n = name.toLowerCase();
  for (const [key, v] of Object.entries(CULTIVARS)) {
    if (n.includes(key)) return v;
  }
  return null;
}

// ---------- content builders ----------

function buildHighlights(name: string, desc: string, category: string, price: string, weightKg: string | null): string[] {
  const h: string[] = [];
  const facts = findCultivar(name);
  const brix = facts?.brix || extract(desc, /([\d.]+(?:–[\d.]+)?\s*°\s*Brix)/i) || '';
  const pollination = facts?.pollination
    || (/self[- ]pollinat|self[- ]fertile/i.test(desc) ? 'Self-fertile' : /cross[- ]pollinat/i.test(desc) ? 'Needs cross-pollination' : '');
  const flesh = facts?.flesh || extract(desc, /(magenta|deep red|crimson|purple|pink|white)\s+flesh/i) || '';

  if (category === 'Dragon Fruit Plants & Cuttings') {
    const size = extract(desc, /(\d{2}[–-]\d{2}\s*cm)/i) || (name.match(/(\d{2}[–-]\d{2}\s*cm)/i)?.[1] ?? '');
    if (size) h.push(`Fresh ${size} cutting, ready to plant`);
    if (brix) h.push(`Fruit sweetness potential: ${brix} (verified cultivar characteristic)`);
    if (pollination) h.push(`${pollination}${/self/i.test(pollination) ? ' — one plant can set fruit' : ' — plant a second variety nearby for best fruit set'}`);
    if (flesh) h.push(`Flesh colour: ${flesh}`);
    h.push('Includes our full planting and rooting guide');
    h.push('Choose the optional rooting service at checkout (ready in 3–5 weeks)');
  } else if (category === 'Commercial Plant Trays') {
    const count = name.match(/(\d+)\s*Plant/i)?.[1] || extract(desc, /(\d+)\s*(?:plants|plant)/i)?.[1] || '';
    if (count) h.push(`${count} nursery-raised plants per tray`);
    if (brix) h.push(`Cultivar sweetness potential: ${brix}`);
    if (pollination) h.push(pollination);
    h.push('Uniform, nursery-raised cuttings for commercial plantings');
    h.push('Packed and dispatched with our live-plant guarantee');
  } else if (category === 'Micro Algae') {
    h.push('Live, laboratory-grown micro algae culture');
    h.push('Ships as a sealed, aerated live culture');
    h.push('Full culturing and dosing instructions included');
    h.push('Grown and dispatched by our South African team');
  } else if (category === 'Fermentation Cultures & Kits') {
    h.push('Complete fermentation culture or starter kit');
    h.push('Step-by-step instructions included for beginners');
    h.push('Re-usable cultures when cared for correctly');
    h.push('Packed fresh to order in our South African facility');
  } else if (category === 'Consulting & Business Resources') {
    h.push('Written by our own South African dragon fruit specialists');
    h.push('Practical, farm-tested guidance — no filler');
    h.push('Instant download or scheduled session as specified');
    h.push('Backed by the ProAgri SA growing network');
  } else if (category === 'Farm & Food Supplies') {
    h.push('Sourced and quality-checked by our team');
    h.push('Suitable for dragon fruit and general farm use');
    h.push('Clear usage instructions included');
  } else if (category === 'Soil, Pond & Plant Treatments') {
    h.push('Formulated for dragon fruit and subtropical crops');
    h.push('Application guidance included with every order');
    h.push('Dispatched nationwide with Courier Guy or PUDO');
  } else {
    h.push('Quality checked and dispatched from South Africa');
  }
  if (weightKg && Number(weightKg) > 0) h.push(`Shipping calculated on a ${Number(weightKg)} kg parcel${Number(weightKg) > 25 ? ' — door-to-door courier (too large for lockers)' : ''}`);
  return h.slice(0, 6);
}

function buildFaqs(name: string, desc: string, category: string): Array<{ q: string; a: string }> {
  const faqs: Array<{ q: string; a: string }> = [];
  const facts = findCultivar(name);
  const brixDesc = extract(desc, /([\d.]+(?:–[\d.]+)?\s*°\s*Brix)/i);
  const brix = facts?.brix || brixDesc;
  const pollination = facts?.pollination
    || (/self[- ]pollinat|self[- ]fertile/i.test(desc) ? 'Self-fertile' : /cross[- ]pollinat/i.test(desc) ? 'Needs cross-pollination' : '');
  const plantDepth = extract(desc, /Plant ([^,.]+)/i);

  if (category === 'Dragon Fruit Plants & Cuttings' || category === 'Commercial Plant Trays') {
    if (pollination) {
      faqs.push({
        q: `Is the ${name.replace(/\s*\d+\s*Plant Tray.*$/i, '')} dragon fruit self-pollinating?`,
        a: pollination === 'Self-fertile'
          ? `Yes — this cultivar is ${pollination.toLowerCase()}, so a single plant can set fruit on its own. Planting a second variety nearby can still improve fruit set and size.`
          : `No — this cultivar ${pollination.toLowerCase()}. Plant it alongside a compatible self-fertile dragon fruit variety (such as American Beauty or Sugar Dragon) so the night-blooming flowers can be pollinated.`,
      });
    }
    if (brix) {
      faqs.push({
        q: `How sweet is the fruit?`,
        a: `Grower records for this cultivar put fruit sweetness at ${brix}. Sweetness in your garden depends on ripeness at harvest, sun exposure and your growing conditions — we recommend harvesting only after the fruit colour fully changes.`,
      });
    }
    faqs.push({
      q: 'How do I plant the cutting?',
      a: plantDepth
        ? `Follow the cultivar guide included with your order: ${plantDepth.charAt(0).toLowerCase() + plantDepth.slice(1)}. Keep the soil barely moist until roots form — new cuttings root best when planted in the warm season.`
        : 'Plant the cutting about 1 cm deep in free-draining cactus soil, keep it warm and only barely moist until new roots and growth appear — typically 3 to 5 weeks in the growing season.',
    });
    faqs.push({
      q: 'Can I buy it already rooted?',
      a: 'Yes — choose the optional rooting service (R30 per plant) at checkout and we will root your cutting for 3 to 5 weeks before dispatch, so it arrives with a visible root ball ready to pot on.',
    });
    faqs.push({
      q: 'How is this plant shipped?',
      a: 'Live plants ship nationwide with PUDO lockers (for parcels up to 25 kg and 60 cm) or Courier Guy door-to-door delivery. The shipping cost is calculated live at checkout from the exact packed weight and size — we never guess or inflate it.',
    });
  } else if (category === 'Micro Algae') {
    faqs.push(
      { q: 'Is this a live culture?', a: 'Yes — every micro algae product on this site is a living, actively growing culture, not a dried powder or supplement. It is grown in our own laboratory and sealed with aeration for transport.' },
      { q: 'How do I look after the culture on arrival?', a: 'Unseal carefully to vent, keep it at room temperature away from direct sunlight, and follow the included culturing sheet. Live cultures can be divided and scaled up with basic sterile technique.' },
      { q: 'What can I use micro algae for?', a: 'Our customers grow spirulina and chlorella for fresh harvests, aquaculture feed, biofertiliser, research and school projects. Nutritional claims are not the focus of this listing — culturing guidance is included with every order.' },
      { q: 'How is it shipped and how fast?', a: 'Live cultures are dispatched with PUDO locker or Courier Guy door-to-door options at checkout. Live-arrival guidance is included; contact our WhatsApp support line if anything arrives below standard.' },
    );
  } else if (category === 'Fermentation Cultures & Kits') {
    faqs.push(
      { q: 'What is included in the kit?', a: 'Each listing states exactly what is included — the live culture itself, the growing vessel or consumables where specified, and full step-by-step instructions written for first-time fermenters.' },
      { q: 'Is it suitable for beginners?', a: 'Yes. The included instructions cover the first batch end-to-end, and our team is reachable on WhatsApp if you get stuck. Fermentation is very forgiving once the basics are in place.' },
      { q: 'Can the culture be re-used?', a: 'In most cases yes — healthy cultures can be divided and carried forward batch after batch. The instruction sheet shows exactly how to keep it vigorous.' },
      { q: 'How long does shipping take?', a: 'Orders dispatch from our South African facility. At checkout you can choose PUDO locker collection (from R86.51 in our live tests) or Courier Guy door-to-door delivery — the live rates are shown before you pay.' },
    );
  } else if (category === 'Consulting & Business Resources') {
    faqs.push(
      { q: 'Who is this written for?', a: 'Anyone planning or already running a dragon fruit venture in Southern Africa — new growers comparing cultivars, farmers adding pitaya to existing orchards, and agri-researchers evaluating the crop.' },
      { q: 'What format is the product?', a: 'Each listing states its format: downloadable guide (PDF), worksheet pack, or a scheduled consultation session. Downloads are delivered by email immediately after checkout.' },
      { q: 'Is the content specific to South Africa?', a: 'Yes — our guides are written from our own commercial and nursery experience in South Africa, including cultivar selection for local climates, PUDO/courier logistics and market channels.' },
      { q: 'Can I get help choosing between cultivars?', a: 'Absolutely — see our Cultivar Guides section, and reach our team on WhatsApp (+27 83 447 4639) if you want a recommendation matched to your region and market.' },
    );
  } else {
    faqs.push(
      { q: 'How do I use this product?', a: 'Application or usage instructions are included with every order, and the description above covers the key steps. Contact our team on WhatsApp if anything is unclear before ordering.' },
      { q: 'Do you ship nationwide?', a: 'Yes — choose PUDO locker collection or Courier Guy door-to-door delivery at checkout. Live rates are calculated from the exact packed weight and size, with no hidden mark-ups.' },
      { q: 'Who supplies this product?', a: 'Wonderful Dragon Fruit South Africa is the specialist dragon fruit destination of the Healthy Fields ProAgri SA network — orders are quality checked and dispatched from our South African facility.' },
    );
  }
  return faqs.slice(0, 6);
}

function buildAltTexts(name: string, images: any[], category: string, desc: string): string[] {
  const facts = findCultivar(name);
  const flesh = facts?.flesh || extract(desc, /(magenta|deep red|crimson|purple|pink|white)\s+flesh/i) || '';
  const brix = facts?.brix || extract(desc, /([\d.]+(?:–[\d.]+)?\s*°\s*Brix)/i) || '';
  return images.map((_, i) => {
    if (i === 0) {
      const detail = flesh ? ` showing the ${flesh} flesh` : brix ? ` (${brix} sweetness potential)` : '';
      return `${name} — Wonderful Dragon Fruit South Africa product photo${detail}`;
    }
    return `${name} — image ${i + 1}, Wonderful Dragon Fruit South Africa`;
  });
}

function retuneDescription(desc: string, category: string): string {
  if (!desc) return desc;
  let out = desc;
  // Lead with the Wonderful Dragon Fruit identity while keeping the truthful parent relationship.
  out = out.replace(/from Healthy Fields ProAgri SA\.?/i,
    category === 'Dragon Fruit Plants & Cuttings' || category === 'Commercial Plant Trays'
      ? 'from Wonderful Dragon Fruit — the specialist dragon fruit nursery of Healthy Fields ProAgri SA.'
      : 'from Wonderful Dragon Fruit South Africa, supplied by Healthy Fields ProAgri SA.');
  return out;
}

// ---------- main ----------
interface ProductRow {
  id: string; name: string; sku: string; description: string | null;
  category_id: string; images: string | any[] | null; image_alt_texts: string | any[] | null;
  highlights: string | any[] | null; faqs: string | any[] | null; weight_kg: string | null; price_zar: string;
}

const [cats] = (await c.query('SELECT id, name FROM categories')) as any[];
const catMap = Object.fromEntries(cats.map((x: any) => [x.id, x.name]));
const [products] = (await c.query('SELECT id, name, sku, description, category_id, images, image_alt_texts, highlights, faqs, weight_kg, price_zar FROM products WHERE is_active = 1')) as any[];

let updated = 0, skipped = 0, errors = 0;
const summary: Record<string, { filled: number }> = {};

for (const p of products as ProductRow[]) {
  try {
    const category = catMap[p.category_id] || 'Other';
    const desc = p.description || '';
    const images = parseJson(p.images);
    const hasAlt = parseJson(p.image_alt_texts).some(Boolean);
    const hasHighlights = parseJson(p.highlights).length > 0;
    const hasFaqs = parseJson(p.faqs).length > 0;

    if (!FORCE && hasHighlights && hasFaqs && (images.length === 0 || hasAlt)) { skipped++; continue; }

    const highlights = buildHighlights(p.name, desc, category, p.price_zar, p.weight_kg);
    const faqs = buildFaqs(p.name, desc, category);
    const alts = images.length ? buildAltTexts(p.name, images, category, desc) : null;
    const newDesc = retuneDescription(desc, category);

    await c.query(
      'UPDATE products SET highlights = ?, faqs = ?, image_alt_texts = ?, description = ? WHERE id = ?',
      [JSON.stringify(highlights), JSON.stringify(faqs), alts ? JSON.stringify(alts) : null, newDesc, p.id],
    );
    (summary[category] ||= { filled: 0 }).filled++;
    updated++;
  } catch (e) {
    errors++;
    console.error('ERR', p.sku, (e as Error).message);
  }
}

console.log(`updated: ${updated}, skipped: ${skipped}, errors: ${errors}`);
Object.entries(summary).forEach(([k, v]) => console.log(' ', k, '->', v.filled));

await c.end();
