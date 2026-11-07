import mysql from 'mysql2/promise';
import fs from 'fs';

const env = fs.readFileSync('/var/lib/manus/addon-projects/4b396568ce8247d70e7ce82e8737b08065471f1daac676baa73178107b71e48b.env', 'utf8');
const url = new URL(env.match(/export DATABASE_URL='([^']+)'/)[1]);
const c = await mysql.createConnection({ host: url.hostname, port: url.port || 3306, user: url.username, password: url.password, database: url.pathname.replace('/', ''), ssl: {} });

const skus = ['HF-DRA-RGC-001','HF-DRA-RIX-001','HF-DRA-SET-001','HF-DRA-AX-001','HF-DRA-BRU-001','HF-DRA-ZAM-001','HF-DRA-CSC-001','HF-DRA-TWP-001','HF-DRA-ORE-001','HF-DRA-PMG-001','HF-DRA-SES-001','HF-DRA-PTH-001','HF-DRA-THK-001','HF-DRA-SKT-001','HF-DRA-HWR-001','HF-DRA-VLR-001','HF-DRA-AZP-001','HF-DRA-CND-001','HF-DRA-ARM-001','HF-DRA-RJN-001','HF-DRA-TRC-001','HF-DRA-BLM-001','HF-DRA-MRS-001','HF-DRA-HLC-001','HF-DRA-CNM-001','HF-DRA-DLG-001','HF-DRA-LAT-001','HF-DRA-DKS-001','HF-DRA-MKS-001','HF-DRA-PHG-001','HF-DRA-PHZ-001','HF-DRA-HRP-001','HF-DRA-DVB-001','HF-DRA-AS2-001','HF-DRA-SDS-001','HF-DRA-AS1-001','HF-DRA-AS5-001','HF-DRA-VDC-001','HF-DRA-AMB-001','HF-DRA-M1-001','HF-DRA-KKG-001','HF-DRA-RCR-001','HF-DRA-BHM-001','HF-DRA-SSH-001','HF-DRA-AS3-001','HF-DRA-BRD-001','HF-DRA-TRD-001','HF-DRA-ZRR-001','HF-DRA-BRH-001','HF-DRA-HLB-001','HF-DRA-BCR-001','HF-DRA-OCM-001','HF-DRA-WCR-001','HF-DRA-WSP-001','HF-DRA-WSF-001','HF-DRA-WKH-001','HF-DRA-ALS-001','HF-DRA-HGH-001','HF-DRA-RNB-001','HF-DRA-CHM-001','HF-DRA-DSP-001','HF-DRA-VGR-001','HF-DRA-EDB-001','HF-DRA-RBR-001','HF-DRA-VJN-001'];
const ph = skus.map(() => '?').join(',');
const [rows] = await c.query('SELECT * FROM products WHERE sku IN (' + ph + ')', skus);
console.log('Rows fetched:', rows.length);

let updated = 0, failed = 0;
const errors = [];
for (const r of rows) {
  const name = r.name;
  const desc = r.description || '';

  // All these columns are strict JSON type -> write real JSON values
  const upd = {};
  if (!r.long_tail_keywords) upd.long_tail_keywords = JSON.stringify([
    `${name} dragon fruit for sale South Africa`,
    `buy ${name} pitaya cutting online`,
    `${name} dragon fruit cutting price`,
    `where to buy ${name} dragon fruit cultivar`,
    `${name} pitaya nursery South Africa`,
    `${name} dragon fruit grow guide`,
  ]);
  if (!r.highlights) upd.highlights = JSON.stringify([
    `Genuine ${name} cultivar, nursery-propagated from verified mother stock.`,
    'Thrives on trellis systems; produces market-grade fruit when mature.',
    'Requires well-draining cactus media and 1 cm planting depth.',
    'Ships as a healthy rooted cutting, 20-30 cm stem segment.',
  ]);
  if (!r.benefits) upd.benefits = JSON.stringify([
    `Grow your own ${name} dragon fruit at a fraction of retail fruit cost.`,
    'Beautiful nocturnal blooms add ornamental value to any garden.',
    'High-antioxidant, low-glycemic fruit ideal for fresh eating and smoothies.',
    'Drought-hardy cactus; low water requirement once established.',
  ]);
  if (!r.features) upd.features = JSON.stringify([
    'Vigorous climbing cactus habit, three-sided stems.',
    'Nocturnal white to pink flowers, 20-30 cm across.',
    'Self-fertile or cross-pollinating (see description).',
    'Roots readily in free-draining media at 20-30C.',
  ]);
  if (!r.specifications) upd.specifications = JSON.stringify([
    'Planting depth: 1 cm',
    'Sun exposure: Full sun to light shade',
    'Soil: Well-draining cactus/succulent mix',
    'Water: Low, drought tolerant once established',
    'Climate: USDA 9-11 equivalent / frost-free',
    'Fruit maturity: 30-50 days after flowering',
  ]);
  if (!r.specific_attributes) upd.specific_attributes = JSON.stringify({
    cultivar: name,
    species_group: 'Dragon fruit (Selenicereus / Hylocereus)',
    plant_type: 'Rooted cutting',
    fruit_colour: 'Varies by cultivar (see description)',
    origin: 'Nursery-propagated in South Africa',
  });
  if (!r.knowledge_summary) upd.knowledge_summary = `${name} is a dragon fruit cultivar (Selenicereus / Hylocereus genus) sold by Healthy Fields ProAgri SA as a rooted cutting. It grows as a climbing cactus and produces edible pitaya fruit rich in antioxidants. ${desc.slice(0, 250)}`;
  if (!r.qa_content) upd.qa_content = JSON.stringify([
    { q: `How long does ${name} take to fruit?`, a: 'Typically 6-12 months from planting for first fruit set, with full production by year 2-3.' },
    { q: `Is ${name} self-fertile?`, a: 'Check the description - some cultivars are self-fertile; others need a compatible pollinator planted nearby.' },
    { q: `How much water does ${name} need?`, a: 'Low. Water deeply but infrequently; allow soil to dry between watering. Overwatering causes stem rot.' },
    { q: `Can ${name} grow in a pot?`, a: 'Yes, in a 40-60 L container with well-draining cactus mix and a sturdy trellis.' },
  ]);

  if (Object.keys(upd).length) {
    try {
      const setSql = Object.keys(upd).map(k => `${k} = ?`).join(', ');
      const vals = Object.values(upd);
      const [res] = await c.query(`UPDATE products SET ${setSql} WHERE id = ?`, [...vals, r.id]);
      if (res.affectedRows === 0) errors.push(`${r.sku}: no rows affected`);
      else updated++;
    } catch (err) {
      failed++;
      errors.push(`${r.sku}: code=${err.code} errno=${err.errno} msg=${String(err.message).slice(0, 150)}`);
    }
  }
}
console.log('Updated:', updated, '| Failed:', failed);
if (errors.length) {
  console.log('--- ERRORS (first 8) ---');
  errors.slice(0, 8).forEach(e => console.log(e));
}
await c.end();
