# Shipping Fix + Server State — 2026-11-06 17:46

## Root cause of the 401 shipping failures (FIXED & VERIFIED)
- The runtime env file `/var/lib/manus/addon-projects/4b396568...env` had been reverted to the OLD PUDO/TCG keys by an earlier `webdev.config` "sync to platform values" (12:58 on 11-04). The owner's ROTATED keys (given 11-04: TCG `72c763af...`, PUDO `64247020|1swu...`) were overwritten.
- Fix: re-wrote the rotated keys into the env file (backup created: `*.env.bak.<ts>`). **The platform secrets store may still hold OLD values — if shipping 401s again after a webdev.config sync, re-write these keys into the env file and ideally update the platform secrets via webdev.request_secrets.**
- Server restarted (session `dev-server`, `npm run start`, PID 284063+). Env keys now: THE_COURIER_GUY_API=72c763..., PUDO_SHIPPING_API=64247020|1...

## Verified working (live API tests, 2026-11-06 17:45-17:46)
- POST /api/functions/shipping-rates (0.35 kg, 30×10×8, Cape Town 7806): **8 rates** — courier_guy R129.95/R219.03/R1155.89 + pudo R86.51/R97.46/R130.31...
- Response envelope: `{ rates, notices, parcel: { actual_weight_kg, chargeable_weight_kg, volumetric_weight_kg } }`
- Volumetric: L×W×H/5000; chargeable = max(actual, volumetric). 0.35→0.48 kg ✓
- Oversize test (60 kg, 120×100×105): PUDO excluded (0 pudo rates), notice fires: "PUDO lockers are not available... 252.00 kg chargeable... exceeds 25 kg and 60 cm" ✓; Courier Guy rates still returned ✓
- PUDO limits env-configurable: PUDO_MAX_WEIGHT_KG (default 25), PUDO_MAX_DIM_CM (default 60)

## Code changes in this session (server/index.ts)
1. `fetchShippingRates` now returns `{ rates, notices, chargeableKg, volumetricKg }` (was: bare array).
2. shipping-rates route returns `{ rates, notices, parcel: { actual_weight_kg, chargeable_weight_kg, volumetric_weight_kg } }`.
3. PUDO eligibility gate + notices (doc 9B).
4. BRIDGE_TABLES.products: writable += promo_start_date, promo_end_date, image_alt_texts; columns array now includes ALL product columns (full SEO fields etc.).
5. db/migrations/008_packaging_shipping_fields.sql applied: products.packaging_weight_kg, packed_length_cm, packed_width_cm, packed_height_cm (NULLable, additive).
6. tsc --noEmit: 0 errors.

## Master catalog state (from earlier today, commit dddd6d8, live)
- All 200 catalog SKUs live; 204 active products; 0 incomplete fields; 0 duplicate slugs; sitemap 250 URLs.
- Pre-import snapshot: products_backup_pre_master_import (95 rows). products_backup_2026_11_04 (108 rows) UNTOUCHED.
- Known pending: promo dates existed in admin form + DB but were dropped only via the external BRIDGE path — fixed by writable allowlist addition. /api/data path (admin) never had an allowlist.

## NEXT: SEO & Product Identity optimisation (pasted_content_5.txt)
Key requirements:
- Website: wonderfuldragonfruit.company — independent SEO identity (NOT duplicating Dragon Fruit Africa content).
- Brand: "Wonderful Dragon Fruit"; relationship to Healthy Fields/ProAgriSA must be truthful; no invented company/address.
- Rewrite public product descriptions for cultivar characteristics (colour/flesh, taste-verified only, flowering/pollination, growth, suitability); NO unsupported claims (yields, sweetness, shelf life, disease resistance).
- Unique per product: SEO title, meta description, H1, intro paragraph, H2/H3 sections, image ALT text, keywords/tags, product FAQs.
- Cultivar profiles/comparison pages for: Ruby/Sweet Ruby Rose/Ruby Red, Sweet White Crystal, Black Dragon Africana Hybrid, Golden Israel, Purple Haze, Zamorano, Palora, Godzilla, American Beauty.
- Technical: self-referencing canonicals, heading hierarchy, sitemap, robots.txt, breadcrumbs, Organization+WebSite schema, Product+Offer schema, FAQ schema where eligible, mobile/fast, internal links.
- Google Merchant prep: accurate names/images/prices/currency/availability/identifiers; NO invented GTINs.
- CRITICAL: preserve checkout/payments/couriers/dimensions — test before deploy.
- Deliverable: detailed report of corrected vs outstanding.

## Product data sources for rewriting
- Rich cultivar data was previously collected (Nov 2025 user messages in history: American Beauty, Physical Graffiti, Sugar Dragon, Vietnamese White, Dark Star S9, La Verne Red, Purple Haze, Colombian Yellow, Amarillo, Cosmic Charlie, Delight, Ecuador Palora, Condor, Connie Mayer, Makisupa, Hana, Zamorano, David Bowie, Frankie's Red, Michelle, Asunta 5 Fire, AX, Armando, Bahamat, Bundy Red, White Saphire, White King Hollywood — Brix/flesh/pollination/flowering data).
- products table fields available: meta_title, meta_description, primary_keyword, secondary_keywords, search_tags, hashtags, highlights, benefits, features, specifications, faqs, canonical_url, og_* etc. (all in schema; many may be empty for the 78 new products — fill from catalog data + rewrite).
- Admin AI generation exists (admin-ai endpoint routes NVIDIA→LongCat→Manus fallback) but bulk SEO rewrite should be done via a script using the same LLM stack or direct content generation.
