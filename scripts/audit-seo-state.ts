import mysql from 'mysql2/promise';
import fs from 'fs';

const env = fs.readFileSync('/var/lib/manus/addon-projects/4b396568ce8247d70e7ce82e8737b08065471f1daac676baa73178107b71e48b.env', 'utf8');
const url = new URL(env.match(/export DATABASE_URL='([^']+)'/)![1]);

const c = await mysql.createConnection({
  host: url.hostname, port: Number(url.port || 3306), user: url.username,
  password: url.password, database: url.pathname.replace('/', ''),
  ssl: {}, connectTimeout: 20000,
});

const [cats] = (await c.query('SELECT id,name FROM categories')) as any[];
const catMap = Object.fromEntries(cats.map((x: any) => [x.id, x.name]));

const [rows] = (await c.query(`
  SELECT category_id, COUNT(*) n,
    SUM(meta_title IS NULL OR meta_title = '') mt,
    SUM(meta_description IS NULL OR meta_description = '') md,
    SUM(tags IS NULL OR JSON_LENGTH(tags) = 0) tg,
    SUM(highlights IS NULL OR JSON_LENGTH(COALESCE(JSON_EXTRACT(highlights, '$'), '[]')) = 0) hl,
    SUM(faqs IS NULL OR JSON_LENGTH(COALESCE(JSON_EXTRACT(faqs, '$'), '[]')) = 0) fq,
    SUM(description IS NULL OR CHAR_LENGTH(description) < 80) ds
  FROM products WHERE is_active = 1 GROUP BY category_id
`)) as any[];

console.log('category | products | no meta_title | no meta_desc | no tags | no highlights | no faqs | thin description');
rows.forEach((r: any) =>
  console.log(
    String(catMap[r.category_id] || '?').slice(0, 38).padEnd(38), '|',
    String(r.n).padStart(3), '|', String(r.mt).padStart(3), '|', String(r.md).padStart(3), '|',
    String(r.tg).padStart(3), '|', String(r.hl).padStart(3), '|', String(r.fq).padStart(3), '|', String(r.ds).padStart(3),
  ),
);

const flag = ['Ruby', 'Sweet White Crystal', 'Black Dragon', 'Golden Israel', 'Purple Haze', 'Zamorano', 'Palora', 'Godzilla', 'American Beauty'];
const [fl] = (await c.query(
  'SELECT name, sku, slug FROM products WHERE is_active = 1 AND (' +
  flag.map(() => 'name LIKE ?').join(' OR ') +
  ') ORDER BY name LIMIT 40',
  flag.map((f) => `%${f}%`),
)) as any[];

console.log('\nflagship cultivar products found:');
fl.forEach((p: any) => console.log(' -', p.name, '|', p.sku, '|', p.slug));

await c.end();
