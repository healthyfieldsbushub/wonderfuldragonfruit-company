import mysql from 'mysql2/promise';
import fs from 'fs';

const env = fs.readFileSync('/var/lib/manus/addon-projects/4b396568ce8247d70e7ce82e8737b08065471f1daac676baa73178107b71e48b.env', 'utf8');
const url = new URL(env.match(/export DATABASE_URL='([^']+)'/)[1]);
const c = await mysql.createConnection({ host: url.hostname, port: url.port || 3306, user: url.username, password: url.password, database: url.pathname.replace('/', ''), ssl: {} });

const [withImg] = await c.query("SELECT sku, images, primary_image_url, image_alt_texts FROM products WHERE sku LIKE 'HF-DRA-%-001' AND images IS NOT NULL AND images <> '' AND images <> '[]' LIMIT 3");
console.log('--- dragonfruit products WITH images ---');
withImg.forEach(r => console.log(r.sku, '|', String(r.images).slice(0, 250), '|', String(r.primary_image_url).slice(0, 120)));

const [others] = await c.query("SELECT sku, primary_image_url FROM products WHERE primary_image_url <> '' LIMIT 6");
console.log('--- other products image URL patterns ---');
others.forEach(r => console.log(r.sku, r.primary_image_url));

await c.end();
