import mysql from 'mysql2/promise';
import fs from 'fs';

const env = fs.readFileSync('/var/lib/manus/addon-projects/4b396568ce8247d70e7ce82e8737b08065471f1daac676baa73178107b71e48b.env', 'utf8');
const url = new URL(env.match(/export DATABASE_URL='([^']+)'/)[1]);
const c = await mysql.createConnection({ host: url.hostname, port: url.port || 3306, user: url.username, password: url.password, database: url.pathname.replace('/', ''), ssl: {} });

const base = ['HF-DRA-RGC-001','HF-DRA-RIX-001','HF-DRA-SET-001','HF-DRA-AX-001','HF-DRA-BRU-001','HF-DRA-ZAM-001','HF-DRA-CSC-001','HF-DRA-TWP-001','HF-DRA-ORE-001','HF-DRA-PMG-001','HF-DRA-SES-001','HF-DRA-PTH-001','HF-DRA-THK-001','HF-DRA-SKT-001','HF-DRA-HWR-001','HF-DRA-VLR-001','HF-DRA-AZP-001','HF-DRA-CND-001','HF-DRA-ARM-001','HF-DRA-RJN-001','HF-DRA-TRC-001','HF-DRA-BLM-001','HF-DRA-MRS-001','HF-DRA-HLC-001','HF-DRA-CNM-001','HF-DRA-DLG-001','HF-DRA-LAT-001','HF-DRA-DKS-001','HF-DRA-MKS-001','HF-DRA-PHG-001','HF-DRA-PHZ-001','HF-DRA-HRP-001','HF-DRA-DVB-001','HF-DRA-AS2-001','HF-DRA-SDS-001','HF-DRA-AS1-001','HF-DRA-AS5-001','HF-DRA-VDC-001','HF-DRA-AMB-001','HF-DRA-M1-001','HF-DRA-KKG-001','HF-DRA-RCR-001','HF-DRA-BHM-001','HF-DRA-SSH-001','HF-DRA-AS3-001','HF-DRA-BRD-001','HF-DRA-TRD-001','HF-DRA-ZRR-001','HF-DRA-BRH-001','HF-DRA-HLB-001','HF-DRA-BCR-001','HF-DRA-OCM-001','HF-DRA-WCR-001','HF-DRA-WSP-001','HF-DRA-WSF-001','HF-DRA-WKH-001','HF-DRA-ALS-001','HF-DRA-HGH-001','HF-DRA-RNB-001','HF-DRA-CHM-001','HF-DRA-DSP-001','HF-DRA-VGR-001','HF-DRA-EDB-001','HF-DRA-RBR-001','HF-DRA-VJN-001'];
const ph = base.map(() => '?').join(',');
const [rows] = await c.query('SELECT * FROM products WHERE sku IN (' + ph + ')', base);
console.log('Matched rows:', rows.length, 'of', base.length);

const checkFields = ['name','slug','short_description','description','price_zar','category_id','meta_title','meta_description','tags','images','primary_image_url','image_alt_texts','specific_attributes','search_text','highlights','benefits','features','specifications','primary_keyword','secondary_keywords','long_tail_keywords','hashtags','search_tags','ai_search_title','ai_search_summary','entity_description','knowledge_summary','qa_content','og_title','og_description','stock_quantity','is_active','weight_kg'];
const report = {};
for (const f of checkFields) report[f] = [];
function isBad(f, v) {
  if (f === 'images') {
    if (!v) return true;
    try { return JSON.parse(v).length === 0; } catch { return true; }
  }
  return v === null || v === '' || (typeof v === 'string' && v.trim() === '');
}
for (const r of rows) {
  for (const f of checkFields) if (isBad(f, r[f])) report[f].push(r.sku);
}
let missingTotal = 0;
for (const f of checkFields) {
  if (report[f].length) {
    missingTotal += report[f].length;
    console.log(f.toUpperCase(), '- missing on', report[f].length, ':', report[f].slice(0, 8).join(', '), report[f].length > 8 ? '...' : '');
  }
}
console.log(missingTotal === 0 ? '*** ALL FIELDS COMPLETE ***' : '*** TOTAL missing field instances:', missingTotal, '***');

const s = rows.find(r => r.sku === 'HF-DRA-RGC-001');
console.log('SAMPLE HF-DRA-RGC-001: name=', s.name, '| price=', s.price_zar, '| stock=', s.stock_quantity, '| desc len=', (s.description || '').length, '| ai_summary len=', (s.ai_search_summary || '').length, '| images=', String(s.images || '').slice(0, 100));
await c.end();
