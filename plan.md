# Wonderful Dragon Fruit South Africa Manus migration plan

## Approved scope

Migrate the existing `GRADEMASTER007/dragonfruitafrica-company` Vite/React ecommerce and administration application to Manus-only infrastructure:

- Manus-managed Webdev hosting and server runtime.
- Manus-managed MySQL database.
- Manus project storage for user-uploaded assets.
- Manus OAuth/session handling for application accounts and admin roles.
- Manus platform APIs for AI and other built-in capabilities where applicable.
- Protected Manus Admin secrets for external providers; no credentials in source.
- No legacy provider hosting, database, storage, auth, SDK, Edge Functions, URLs, migrations, redirects, or generated leftovers in the final repository.

The user approved a data-preserving pause: the repository contains schema history but no usable Manus data export. Code and schema migration can proceed, but database initialization and any data import will remain blocked until the user supplies the export.

## Implementation approach

1. Preserve the current public route surface and React presentation layer.
2. Add an Express server runtime that serves the Vite build, exposes `/api/health`, implements database-backed application APIs, and hosts provider/webhook endpoints that formerly lived in Manus Edge Functions.
3. Replace browser-side Manus calls with a small typed Manus API client. Browser code will use relative `/api/*` URLs only.
4. Replace the Manus auth context with Manus OAuth and the required `webdev_app_session` application cookie, resolving application profiles and roles from the managed database.
5. Convert the Manus/PostgreSQL migration history into deterministic MySQL migrations. Preserve logical table and column names where MySQL supports them; explicitly document any type, policy, trigger, or function conversion.
6. Replace direct Manus Storage access with server-authorized Manus Storage presigned uploads and stable `/manus-storage/...` paths, plus an application file index.
7. Keep external integrations (PayFast, PayPal, Yoco, The Courier Guy, PUDO, WhatsApp, TikTok, Facebook Page, Instagram, Zoho, email, analytics and AI providers) behind server routes and protected secret lookups. The app must remain safe when a secret is not configured.
8. Add a password-protected Social Publisher admin page. Facebook Page posts use the Pages API, while Instagram image posts use the media-container and media-publish flow. Publishing is manual and never automatic.
9. Add the complete `public/manus-routes.json`, build/deploy configuration, Docker runtime, health endpoint and diagnostics before starting Preview.
10. Run type checks, lint, unit tests, production build, route-manifest checks, Manus scans and server health checks. Do not use the shared managed database for destructive test data.
11. Commit the migration to the Manus canonical repository, record a checkpoint, and publish only after the build and health checks pass. Publishing auto-approval remains disabled.

## Project structure after migration

- `src/`: existing React application and route components, with Manus imports replaced by Manus API/auth/storage helpers.
- `server/`: Express runtime, auth/session middleware, database connection and queries, application API routes, provider/webhook adapters and health endpoint.
- `db/`: MySQL schema and ordered migration files derived from the supplied Manus schema history.
- `public/manus-routes.json`: public route inventory for Manus discovery.
- `Dockerfile`: production server image that installs dependencies, builds the frontend and runs the server on `PORT`.
- `docs/`: migration notes, secret inventory, social-publishing research and the required Manus data-import handoff.

## Design decisions

### Candidate styles

- **African agritech editorial:** 0.07 — warm field colors, strong photography and magazine-like storytelling.
- **Trade-catalog precision:** 0.03 — structured product browsing, clear prices and compact operational controls.
- **Cinematic farm-to-market:** 0.08 — immersive hero media, restrained typography and high-contrast commercial CTAs.

### Chosen style: African agritech editorial

**Design movement:** contemporary African editorial design blended with practical agricultural trade interfaces.

**Core principles:** credible, warm, useful and locally grounded. Public pages prioritize trust, education and product discovery; admin pages prioritize speed and clarity.

**Color philosophy:** retain the existing brand palette and strengthen it with soil brown, leaf green and dragon-fruit magenta as semantic accents. Green communicates cultivation and growth; magenta marks the fruit and primary actions; neutral cream keeps long-form content readable.

**Layout paradigm:** editorial asymmetry on storytelling pages, with media-led sections and offset content blocks; practical two-column and table layouts inside commerce and admin workflows.

**Signature elements:** organic gradient bands, image-led section breaks and compact status chips for operational information.

**Interaction philosophy:** interactions should reduce uncertainty: explain price, availability, shipping and next steps at the point of decision; preserve keyboard focus and clear error states.

**Animation:** use restrained reveal and hover transitions only; never delay content or essential checkout/admin actions.

**Typography system:** preserve the existing type system unless inspection shows a broken fallback; use a high-legibility sans-serif for UI/body and a distinctive display face only for major editorial headlines.

**Brand essence:** a trusted African dragon-fruit network connecting growers, buyers and knowledge. Personality: grounded, capable, generous.

**Brand voice:** direct and practical. Example lines: “Grow with a clearer plan.” and “From planting material to market insight.”

**Wordmark & logo:** preserve the existing Wonderful Dragon Fruit South Africa identity and favicon assets; platform `logoUrl` will point to a durable HTTPS logo asset before checkpointing.

**Signature brand color:** dragon-fruit magenta, used sparingly for primary actions and key editorial accents.
---

# Product System Upgrade (2026-10-22 request)

## Current state (verified)
- `products` table already has: unique `slug`, unique `sku`, `short_description`, `description` (rich text), `tags` JSON, `brand`, `price_zar`, `compare_at_price_zar` (sale price), `weight_kg`, `length_cm/width_cm/height_cm`, `stock_quantity`, `allow_backorder`, `images` JSON (URL strings), `primary_image_url`, `image_metadata` JSON, `meta_title`, `meta_description`, `is_active` (Draft/Published), 121 products all with slug+SKU, only 2 missing weight/dimensions.
- Admin form (`src/pages/admin/Products.tsx`) covers only part of these fields; no sections, no variants, no image alt text, no publish validation, no CSV import/export.
- Storefront product page is `/product/:slug` with Product JSON-LD already present.
- `scripts/generate-sitemap.ts` writes only static routes; live `public/sitemap.xml` (169 URLs) includes products and serves fine.

## Implementation plan
1. **DB migration** (`db/migrations/…-product-system-upgrade.sql`, run via `npm run db:migrate`):
   - `product_variants` (id, product_id, name, sku unique, price_zar, weight_kg, length_cm, width_cm, height_cm, stock_quantity, is_active, sort_order, created/updated) — variant-level SKU/price/weight/dimensions.
   - `product_slug_redirects` (old_slug unique, product_id, created_at) — keeps old URLs working after slug edits.
   - `products.image_alt_texts` JSON NULL — per-image alt text aligned to `images` array; main image stays `primary_image_url`.
   - Backfill: autofill empty `meta_title`/`meta_description` from name/short description (2 products); never overwrite existing values.
2. **Server** (`server/index.ts`):
   - Add `product_variants` and `product_slug_redirects` to the `/api/data` table allowlist (read via appClient).
   - Special-case products UPDATE in the data API: when `slug` changes, insert the old slug into `product_slug_redirects`.
3. **Admin form rebuild** with sections: General (name, slug auto-gen + unique check, SKU auto-suggest, short description with 160-char live counter, rich long description, tags, category, brand), Pricing (price ZAR, sale price, stock quantity + stock status), Shipping (weight kg, L/W/H cm — required to publish, hint text), SEO (meta title/description with autofill-from-name/short-description buttons and counters), Images (multi upload, per-image alt text, set-main-image), Variants (per-variant SKU/price/weight/dimensions/stock), Status (Draft/Published select; block publish without weight+dimensions).
   - List view: shipping-data warning badge, "Missing shipping data" filter, status badges.
   - CSV export/import (all fields; images as `|`-separated; alt texts aligned) using papaparse.
4. **Storefront SEO**:
   - New route `/products/:slug` for product pages; `/product/:slug` kept and redirects users/SEO to the new path.
   - Slug-redirect resolution: on unknown slug, look up `product_slug_redirects` → navigate to current slug.
   - ProductDetail: canonical + OG to `/products/:slug`, existing Product JSON-LD kept, add BreadcrumbList JSON-LD + visible breadcrumbs.
   - ProductDetail shows variants (own SKU/price/stock) when present.
5. **Sitemap & search**:
   - Rewrite `scripts/generate-sitemap.ts`: static routes + products + categories + blog from DB (skips DB parts gracefully when DATABASE_URL is absent, e.g. Docker build), run after `vite build`.
   - Extend Products page site search to match name, SKU, short description, tags/keywords, brand.
6. **Validation**: build, lint on touched files, preview screenshots of admin form, product page (old + new URL), sitemap regeneration; verify no product data changed except the documented backfills.
## Distributors & Distributing Countries enhancement (2026-10-24)
In-place enhancement only. Reuse existing tables (distributors, distributor_countries), admin layout, design system and SEO components.
- Migration 005: `distributor_enquiries` (secure submissions, distributor_id, spam honeypot, ip hash) and `distributor_documents` (name, description, version_label, file_url, is_active, sort_order).
- Seed `distributor_countries` with the 8 countries (ZA, ZW, BW, ZM, NA, CD, SZ, LS); seed two Zimbabwe distributor rows with empty contact fields (no invented data).
- New page `/distributors` (+ `/distributors/:country` deep-link): intro, 8-country grid, Zimbabwe distributor cards (blank-labelled fields, tel:/mailto: only when present), two independent validated forms posting to `POST /api/distributor-enquiries`, DFSA role, farm registration & out-grower sections, existing-farmer replanting note, cultivar protection, farming standards, documents area (only shows uploaded documents), export opportunities, traceability, FAQ (10 items, accordions), trust elements. Exact supplied wording; no guarantees invented.
- Homepage: "DISTRIBUTING COUNTRIES" section mid-page linking to `/distributors/<country>`.
- Nav + footer: Distributors link. SEO: title/description per prompt, sitemap + manus-routes entries.
- Admin: extend admin Distributors page for distributor details + documents upload; new admin enquiry inbox; enquiry routing destination configurable via settings.
