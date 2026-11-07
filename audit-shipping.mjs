import mysql from 'mysql2/promise';
import fs from 'fs';

const env = fs.readFileSync('/var/lib/manus/addon-projects/4b396568ce8247d70e7ce82e8737b08065471f1daac676baa73178107b71e48b.env', 'utf8');
const url = new URL(env.match(/export DATABASE_URL='([^']+)'/)[1]);
const c = await mysql.createConnection({ host: url.hostname, port: url.port || 3306, user: url.username, password: url.password, database: url.pathname.replace('/', ''), ssl: {} });

// Full column list for products (shipping-relevant fields)
const [cols] = await c.query("SHOW COLUMNS FROM products");
const colNames = cols.map(x => x.Field);
console.log('PRODUCT COLUMNS:', colNames.join(', '));
const has = (n) => colNames.includes(n);

const [all] = await c.query(`SELECT sku, name, subcategory AS category, price_zar, weight_kg, length_cm, width_cm, height_cm,
  ${has('shipping_class') ? 'shipping_class' : "'' AS shipping_class"},
  ${has('parcel_count') ? 'parcel_count' : "0 AS parcel_count"},
  ${has('special_handling') ? 'special_handling' : "'' AS special_handling"},
  ${has('stock_quantity') ? 'stock_quantity' : '0 AS stock_quantity'},
  ${has('is_active') ? 'is_active' : '1 AS is_active'}
  FROM products ORDER BY subcategory, sku`);

console.log('\nTOTAL PRODUCTS:', all.length);
console.log('ACTIVE:', all.filter(p => p.is_active).length);

// Group by category and show shipping profile
const byCat = {};
for (const p of all) {
  (byCat[p.category || 'uncategorised'] ||= []).push(p);
}
for (const [cat, list] of Object.entries(byCat)) {
  const weights = list.map(p => Number(p.weight_kg) || 0);
  console.log(`\n=== ${cat} (${list.length} products) ===`);
  console.log(` weight range: ${Math.min(...weights).toFixed(2)} – ${Math.max(...weights).toFixed(2)} kg | zero: ${weights.filter(w => !w).length}`);
  const noDims = list.filter(p => !p.length_cm || !p.width_cm || !p.height_cm);
  console.log(` missing dims: ${noDims.length}`);
  console.log(` shipping_class values: ${[...new Set(list.map(p => p.shipping_class || '(none)'))].join(', ')}`);
  console.log(` special_handling values: ${[...new Set(list.map(p => p.special_handling || '(none)'))].join(', ')}`);
}

// Detailed list of outliers / suspicious values
console.log('\n=== SUSPICIOUS / OUTLIER ENTRIES ===');
for (const p of all) {
  const w = Number(p.weight_kg) || 0;
  const dim = `${p.length_cm}x${p.width_cm}x${p.height_cm}`;
  const issues = [];
  if (w <= 0) issues.push('no weight');
  if (w > 25) issues.push('very heavy (>25kg)');
  if (!p.length_cm || !p.width_cm || !p.height_cm) issues.push('no dims');
  if ([p.length_cm, p.width_cm, p.height_cm].some(v => v && v > 120)) issues.push('very large dim (>120cm)');
  if (issues.length) console.log(` ${p.sku} | ${p.name} | w=${w}kg | ${dim} | ${issues.join(', ')}`);
}

await c.end();
