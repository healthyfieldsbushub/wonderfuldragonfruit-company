# SEO Action Plan — Wonderful Dragon Fruit South Africa
**Live rank check run:** 2026-10-24 (SerpApi, Google, South Africa, desktop, organic positions 1–100)
**Method:** 10 commercial keywords measured with the project's Google SERP API key (`GOOGLE_SERPAPI`), `gl=za&hl=en`, top 100 scanned for `wonderfuldragonfruit.company`.

## 1. Live ranking results

| # | Keyword | Best rank today | Top-100 presence |
|---|---------|----------------|------------------|
| 1 | dragon fruit cuttings for sale south africa | none (top 100) | not ranking |
| 2 | buy dragon fruit cuttings | none (top 100) | not ranking |
| 3 | dragon fruit plants for sale | none (top 100) | not ranking |
| 4 | live spirulina culture | none (top 100) | not ranking |
| 5 | live spirulina south africa | none (top 100) | not ranking |
| 6 | chlorella vulgaris live culture | none (top 100) | not ranking |
| 7 | purple dragon fruit cutting | none (top 100) | not ranking |
| 8 | yellow dragon fruit plant for sale | none (top 100) | not ranking |
| 9 | rare dragon fruit varieties | none (top 100) | not ranking |
| 10 | dragon fruit farming south africa | none (top 100) | not ranking |

**Who currently owns these searches in SA:** Livingseeds, DragonFruit Den / yourgzone.co.za, bilwudhuseedlings.co.za, dragonfruit-sa.co.za, Amorentia Nursery, mayumigarden.com, spicyexotics.com, plus Facebook groups and directory pages (southafrica.co.za). Competitors win largely on exact-match titles ("Sugar Dragon Fruit Cuttings Rooted And Non-Rooted") and product-category landing pages.

**What is working in your favour already:** 205-URL sitemap (155 products + 10 blogs + 40 static pages), Product JSON-LD, clean `/products/:slug` URLs, optimised images, AI/Bing verification tags, and a live Google Shopping feed.

## 2. Prioritised action plan

### P1 — This week (highest impact, low effort)
1. **Build keyword-targeted category landing pages** for the three money phrases: "dragon fruit cuttings for sale", "dragon fruit plants for sale", "rare dragon fruit varieties". Each needs ~600+ words, internal links to every cultivar in that group, and an H1 with the exact phrase. Today's `/products` page is a generic catalogue — it cannot outrank exact-match pages.
2. **Rewrite product titles to match search language.** Competitors rank with titles like "Sugar Dragon Fruit Cuttings Rooted and Non-Rooted". Our titles use brand-first patterns. Set `meta_title` (and ideally product name) to `"<Cultivar> Dragon Fruit Cutting — Buy Online South Africa"` pattern in the admin panel for the top 20 cultivars first.
3. **Submit the sitemap in Google Search Console and Bing Webmaster Tools** (owner has both verification tags live now) and request indexing for the 10 blog posts + top 20 product pages. Without GSC submission, discovery of new pages can take weeks.

### P2 — Next 2–4 weeks
4. **Google Merchant Center setup + Shopping listings** (feed is live at `/google-shopping-feed.xml`, 121 products — see below). Free listings in Google Shopping add a second surface for product queries and build domain authority.
5. **Spirulina/chlorella content cluster:** three posts targeting "live spirulina", "spirulina live culture vs powder", "how to grow chlorella at home", each internally linking to the culture products. Health-adjacent queries have weak competition in SA.
6. **Location pages:** /dragon-fruit-limpopo, /dragon-fruit-mpumalanga, /dragon-fruit-kwazulu-natal — province pages matching how SA buyers search, mirroring the existing Zimbabwe/Botswana page template.
7. **Backlinks:** get listed on SA nursery/agriculture directories (Livingseeds-adjacent lists, fellow farmer groups), replace the southafrica.co.za directory listing with our own domain presence, and pursue one guest post on an SA gardening blog per month.

### P3 — Ongoing / monitoring
8. **Monthly rank tracking** — rerun this same 10-keyword SERP check (script saved, key already configured) and compare positions; log to `docs/`.
9. **Fix thin duplicate descriptions:** many products share an identical short_description tail ("Collector-grade pitaya selections…"). Unique descriptions per cultivar matter for both Google and Bing.
10. **Add FAQ schema** to the 10 blog posts and category pages (Rich results eligible).

## 3. Google Shopping integration status
- Feed: **live** at `https://wonderfuldragonfruit.company/google-shopping-feed.xml` (HTTP 200, 121 products with images, prices, availability, brand, Google category).
- Regenerate any time with `npm run feed`.
- **Owner action:** create a Google Merchant Center account, add a "Products" feed with the URL above (fetch method, daily), and claim/verify the website. Once Merchant Center approves, products become eligible for free Shopping listings.
- 34 items without images (digital products like business plans) were excluded — Merchant Center rejects imageless items.

## 4. Sitemap status
- Regenerated and live: **205 URLs** (40 static + 10 blog + 155 products) at `/sitemap.xml`, with `robots.txt` referencing it. All 24 recently added cultivars are included with correct lastmod dates.
