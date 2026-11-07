// Generates a Google Merchant Center product feed (RSS 2.0 with g: namespace)
// at public/google-shopping-feed.xml from the live product catalog.
// Submit this URL in Google Merchant Center: Products → Feeds → Add file/fetch:
//   https://www.wonderfuldragonfruit.company/google-shopping-feed.xml
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const BASE_URL = "https://www.wonderfuldragonfruit.company";

type Row = {
  sku: string; name: string; slug: string; short_description: string | null;
  description: string | null; price_zar: string; compare_at_price_zar: string | null;
  stock_quantity: number; primary_image_url: string | null; images: string[] | null;
  brand: string | null; tags: string[] | null;
};

function googleCategory(row: Row): string {
  const hay = `${row.name} ${(row.tags || []).join(" ")}`.toLowerCase();
  if (/culture|spirulina|chlorella|em1|clarifier|soil|fertil|beneficial|probiotic|enzym|molass/.test(hay)) {
    return "Health & Beauty > Health Care > Fitness & Nutrition > Vitamins & Supplements";
  }
  if (/cheesecloth|bag|net|pot|trellis|tool|kit/.test(hay)) {
    return "Home & Garden > Lawn & Garden > Gardening > Gardening Tools";
  }
  return "Home & Garden > Plants > Live Plants";
}

function stripHtml(value: string | null): string {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

async function main() {
  const mysql = (await import("mysql2/promise")).default;
  const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL as string });
  const [rows] = await conn.query<import("mysql2").RowDataPacket[]>(
    "SELECT sku, name, slug, short_description, description, price_zar, compare_at_price_zar, stock_quantity, primary_image_url, images, brand, tags FROM products WHERE is_active = 1 ORDER BY name"
  );
  await conn.end();

  const usable = (rows as unknown as Row[]).filter((row) => {
    // Merchant Center rejects items without an image; skip digital items with no asset.
    const image = row.primary_image_url || (row.images && row.images[0]) || "";
    return Boolean(image) && Number.isFinite(Number(row.price_zar));
  });
  const items = usable.map((row) => {
    const price = Number(row.price_zar);
    const compare = Number(row.compare_at_price_zar);
    const inStock = Number(row.stock_quantity) > 0;
    const image = row.primary_image_url || (row.images && row.images[0]) || "";
    const absoluteImage = image.startsWith("http") ? image : `${BASE_URL}${image}`;
    const description = stripHtml(row.short_description || row.description).slice(0, 5000) || stripHtml(row.name);
    return [
      "  <item>",
      `    <g:id>${escapeXml(row.sku || row.slug)}</g:id>`,
      `    <title>${escapeXml(row.name.slice(0, 150))}</title>`,
      `    <description>${escapeXml(description)}</description>`,
      `    <link>${escapeXml(`${BASE_URL}/products/${row.slug}`)}</link>`,
      image ? `    <g:image_link>${escapeXml(absoluteImage)}</g:image_link>` : "",
      `    <g:condition>new</g:condition>`,
      `    <g:availability>${inStock ? "in_stock" : "out_of_stock"}</g:availability>`,
      Number.isFinite(price) ? `    <g:price>${price.toFixed(2)} ZAR</g:price>` : "",
      Number.isFinite(compare) && compare > price ? `    <g:sale_price>${price.toFixed(2)} ZAR</g:sale_price><g:price>${compare.toFixed(2)} ZAR</g:price>` : "",
      `    <g:brand>${escapeXml(row.brand || "Wonderful Dragon Fruit South Africa")}</g:brand>`,
      `    <g:google_product_category>${escapeXml(googleCategory(row))}</g:google_product_category>`,
      `    <g:identifier_exists>no</g:identifier_exists>`,
      `    <g:link_text>Wonderful Dragon Fruit South Africa</g:link_text>`,
      "  </item>",
    ].filter(Boolean).join("\n");
  });

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>Wonderful Dragon Fruit South Africa — Product Feed</title>
  <link>${BASE_URL}</link>
  <description>Google Shopping product feed for Wonderful Dragon Fruit South Africa. Dragon fruit cuttings, live spirulina and chlorella cultures, and organic growing supplies, delivered across South Africa.</description>
${items.join("\n")}
</channel>
</rss>
`;
  writeFileSync(resolve("public/google-shopping-feed.xml"), feed);
  console.log(`google-shopping-feed.xml written (${items.length} products; ${(rows as unknown as Row[]).length - items.length} skipped without image/price)`);
}

main().catch((error) => {
  console.error("feed generation failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
