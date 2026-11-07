# SEO Audit Report — Wonderful Dragon Fruit South Africa
**Date:** 2026-11-04 · **Domain:** wonderfuldragonfruit.company (27 country subdomains) · **Catalogue:** 96 active products

---

## 1. Executive Summary

The site's **technical SEO foundation is strong**: every one of the 96 active products has a complete SEO field set (meta title, meta description, primary keyword, secondary keywords, tags, hashtags, AI search summary, OG tags, product facts) — 100% coverage. The dynamic sitemap serves **142 URLs**, every product page renders **Product JSON-LD structured data**, an `ai-feed.json` endpoint is live for AI crawlers, and robots.txt is correctly configured on the canonical apex domain.

However, **live Google rankings (South Africa, checked via SerpAPI today) show the site is NOT in the top 20** for any of the four core commercial keywords tested. This is expected for a young domain — the gap is not technical, it is **authority, images, and fresh signal**. Two critical product-data gaps were found: **0% of products have images** and **0% have shipping weights**, both of which block Google Merchant Center, image search traffic, and the rich results that competitors use.

---

## 2. Technical SEO Health (verified live)

| Check | Status | Detail |
|---|---|---|
| Sitemap.xml | ✅ | 142 URLs, dynamic, auto-updates from DB |
| robots.txt | ✅ | Canonical apex host, Googlebot allowed |
| Product structured data (JSON-LD) | ✅ | `@type: Product` with SKU, variants, offers, keywords |
| AI feed (`/ai-feed.json`) | ✅ | HTTP 200 — machine-readable catalogue for ChatGPT/Perplexity |
| Per-route meta rendering | ✅ | Titles/descriptions/canonicals server-rendered per page |
| Slug redirects | ✅ | Old slugs auto-redirect (301) — no link equity lost |
| HTTPS country subdomains (27) | ✅ | Live with hreflang tags + IndexNow submissions |
| Google/Bing verification | ✅ | Meta tags live; IndexNow key published |

## 3. On-Page Content Coverage (96 active products)

| Field | Coverage | Impact |
|---|---|---|
| Meta title | 100% | ✅ Ready |
| Meta description | 100% | ✅ Ready |
| Primary keyword | 100% | ✅ Ready |
| Secondary keywords | 100% | ✅ Ready |
| Tags / hashtags | 100% | ✅ Ready |
| Short + long description (200+ chars) | 100% | ✅ Ready |
| AI search title + summary | 100% | ✅ Ready |
| OG title/description | 100% | ✅ Ready |
| Product facts (JSON) | 100% | ✅ Ready |
| **Primary product image** | **0%** | 🔴 Blocks Merchant Center, image search, social previews |
| **Shipping weight (kg)** | **0%** | 🔴 Blocks accurate live shipping rates + Merchant Center |

## 4. Live Keyword Rankings (Google ZA, SerpAPI — checked 2026-11-04)

| Keyword | Position |
|---|---|
| dragon fruit cuttings for sale south africa | Not in top 20 |
| buy dragon fruit plants south africa | Not in top 20 |
| spirulina live culture south africa | Not in top 20 |
| dragon fruit farm setup south africa | Not in top 20 |

**ChatGPT / AI answer visibility:** the `ai-feed.json` endpoint and fully populated `ai_search_summary`/`product_facts` fields mean AI crawlers *can* read the catalogue — but AI engines favour sources that are **already cited across the web**. With near-zero backlinks and no third-party mentions, ChatGPT has no reason to cite DFSA yet (see §6).

## 5. Keyword Gap Analysis — what to target

High-intent commercial keywords with buying intent, currently untargeted or under-targeted:

1. **"dragon fruit cuttings for sale"** (+ provincial variants: Gauteng, KZN, Western Cape) — highest commercial intent
2. **"pitaya plants for sale"** / **"pitahaya cuttings"** — the Latin/alternate names competitors rank for
3. **"self-fertile dragon fruit varieties"** — spec-driven queries with low competition
4. **"dragon fruit farming profit per hectare"** — matches the 1-hectare business plan page
5. **"where to buy spirulina culture"** / **"chlorella culture south africa"** — micro-algae category
6. **"dragon fruit wholesale South Africa"** / **B2B bulk queries** — distributor funnel
7. Cultivar-specific long-tails: **"American Beauty dragon fruit cutting"**, **"Sugar Dragon cutting price"** — 77 cultivar pages exist; each should target its own name
8. **"dragon fruit trellis design"**, **"dragon fruit fertilizer schedule"** — informational cluster feeding DRACO/blog authority

## 6. Prioritised Recommendations

**🔴 Critical (blocks indexing/rich results — do first)**
1. **Upload product images** — every product needs ≥1 optimised image (<200 KB WebP). Without images, no Google Images traffic, no Merchant Center, weak social sharing. 0/96 today.
2. **Add shipping weights & dimensions** — required for Merchant Center *and* currently forcing checkout to use a 0.5 kg default that underquotes real shipping.

**🟠 High impact (authority & rankings)**
3. **Backlink building** — the single biggest ranking lever. Target: provincial agricultural directories, +1 per week from gardening/farming blogs, supplier listings (Livingseeds and dragonfruit-sa rank because they have years of links).
4. **Publish cultivar comparison content** — "Best self-fertile dragon fruit varieties for South Africa" style posts target the long-tail and feed internal links to product pages.
5. **Google Merchant Center feed** — the `google-shopping-feed.xml` exists; once images are added, submit it. Product listings on Google Shopping beat organic SEO for purchase-intent queries.
6. **Google Search Console monitoring** — verified now; request indexing for the top 20 product pages after images land.

**🟡 Ongoing**
7. **ChatGPT/AI visibility** — publish the catalogue on 2–3 neutral third-party platforms (Pindu/Plantinfo, Facebook Marketplace with links, local directories). AI engines cite sources that appear in multiple independent places.
8. **Review schema (stars)** — collect first customer reviews, then add `aggregateRating` to Product JSON-LD; review stars lift CTR significantly.
9. **Weekly IndexNow + sitemap submissions** — already automated via the daily scheduled task; keep running.

## 7. What is already working — keep it

- Dynamic sitemap + slug redirect system (no orphan pages)
- Server-rendered per-route meta (crawlers see full content without JS)
- Country subdomain network with hreflang (ZA, NG, KE, … 27 markets)
- AI-optimised fields on every product (ai_search_title, ai_search_summary, product_facts)
- Knowledgebase + DRACO chat adds unique indexable agronomy content competitors don't have

**Bottom line:** the content and technical layer is done. Rankings will come from **images + backlinks + Merchant Center** — those three items are now the priority.
