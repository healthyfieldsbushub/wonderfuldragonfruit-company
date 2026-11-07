# Wonderful Dragon Fruit South Africa migration outcomes

## 1. Manus infrastructure is enabled

- The app runs as a Manus Webdev project with managed server and managed database capabilities.
- No third-party hosting or external database is used by the Manus deployment.
- Runtime, build, container, health and published-route configuration match the server-backed Vite application.

## 2. Repository is imported without exposed credentials

- The selected repository is present in the Manus canonical workspace.
- Committed `.env` credentials and other secret values are removed from the working tree.
- Protected external values are represented only by Manus Admin secret declarations and runtime lookups.

## 3. Legacy provider artifacts are fully removed

- No legacy SDK, client, generated types, URL, project ID, publishable/anon/service-role key, Edge Function, migration/configuration directory, storage URL, redirect, or provider-specific comment/test remains in tracked source.
- Browser code no longer calls the legacy provider directly; it uses the Manus-managed relative API.

## 4. Manus server API replaces Manus behavior

- Relative `/api/*` endpoints replace database reads/writes, RPCs, Edge Functions, authentication, uploads and webhooks.
- The server validates input, authorizes admin/customer operations and returns stable JSON error shapes.
- `/api/health` is unauthenticated and returns a successful readiness response when the server is ready.

## 5. Manus database schema is migrated

- The former PostgreSQL schema is converted to ordered MySQL migrations.
- Table names and business fields are preserved where possible, with conversion notes for PostgreSQL-only types, policies, triggers and functions.
- Data initialization remains blocked until the user supplies the approved Manus export.

## 6. Authentication and storage are Manus-native

- Login, signup, logout and password/session flows use Manus OAuth and the required `webdev_app_session` cookie.
- Profile and role lookups use the Manus database.
- Product/admin uploads use Manus project storage and stable managed asset paths.

## 7. Public and admin application behavior is preserved

- Existing public ecommerce, directory, blog, SEO, education, market and legal routes remain available.
- Existing admin routes remain protected by application roles.
- Checkout presents PayFast, PayPal and Yoco options; each gateway creates a server-side hosted checkout, stores the internal order reference, and never exposes secret credentials or card data to the browser.
- Shipping presents rates from The Courier Guy and PUDO when their protected API configuration is present; PUDO locker lookup uses the managed server adapter and the checkout remains safe when either integration is not configured.
- AI, social, messaging, email and CRM integrations use server-side protected configuration and remain safe when secrets are absent.

## 8. Facebook and Instagram publishing are wired

- The protected admin area includes a Social Publisher page at `/admin/social-publisher`.
- Facebook publishing supports a Page message, optional public link, and optional public image through the server-side Pages API.
- Instagram publishing supports a caption, accessibility alt text, and one public JPEG image through the server-side media-container and media-publish flow.
- Publishing and read-only connection checks require the signed Manus session, the application admin role, and the additional website admin-password session.
- Facebook and Instagram credentials remain in Manus Admin secrets; no access token or app secret is committed or exposed to browser code.
- Publishing is manual and requires an administrator to press the relevant publish button.

## 9. Validation and delivery are complete

- Route manifest is present and matches the React route set.
- Diagnostics, lint, tests, production build and health checks pass or have documented blockers.
- The migration is committed to Manus canonical Git, checkpointed, and published only after successful validation.
- The final delivery reports the published Manus URL or, if blocked, the current Preview and the exact blocker.
---

# Product System Upgrade (2026-10-22)

## 10. Product fields exist in database and admin add/edit form
- Every product supports: Name; Slug (auto-generated from name, lowercase hyphens, unique, editable, old URL keeps working after a change); SKU (unique, auto-suggested when left empty); Short description (max 160 characters with a live character counter); Long description (rich text); Keywords/tags; Category and brand; Price and optional sale price in ZAR; Stock quantity and stock status; Weight in kg; Length, width and height in cm; SEO meta title and meta description (auto-filled from name and short description, editable); Multiple images with per-image alt text and one marked main image; Draft/Published status.
- Products can have variants (e.g. size or pack), and each variant carries its own SKU, price, weight and dimensions.

## 11. Existing products are complete and guarded
- All existing products have slugs and SKUs (verified: 0 missing).
- The admin product list shows a clear warning for products missing weight or dimensions and offers a "Missing shipping data" filter to fix them quickly.
- A product cannot be published without weight and dimensions.

## 12. Product SEO on the website
- Every published product has a clean page at /products/slug, and the previous /product/slug URLs keep working.
- Product pages carry Product structured data (name, image, description, sku, brand, price, currency, availability), Open Graph tags, a canonical URL and breadcrumbs.
- sitemap.xml is generated from the database (published products + blog posts) via scripts/generate-sitemap.ts; robots.txt stays correct.
- Site search matches keywords, SKU and short description in addition to the name.

## 13. Admin usability and CSV round-trip
- The add/edit form is organized in clear sections (General, Pricing, Shipping, SEO, Images, Variants, Status) with helpful hint text under each field for a non-technical user.
- Bulk CSV export and import of products uses all these fields.

## 14. Validation and delivery
- Build, lint of touched files and preview checks pass for: admin form, product page on the new URL, old URL redirect, sitemap regeneration.
- No existing products, prices or images are deleted or changed apart from autofilling empty SEO fields.
- A short plain-English summary explains what changed and how to use the new fields.
## Distributors & Distributing Countries (2026-10-24)
- /distributors and /distributors/:country live with the full supplied content and no invented data.
- Homepage DISTRIBUTING COUNTRIES section with 8 working country buttons.
- Two distributor contact forms validate, identify distributor, store securely, show true success/error.
- Admin can edit distributor details, upload documents, and view enquiry submissions.
- Nav/footer links, SEO metadata, sitemap and routes manifest updated; build, lint and preview verified.


# Distributor Enquiry Notifications (24 Oct 2026)
- [x] Owner notification channel live — every enquiry notifies the project owner (tested on production).
- [x] Admin test-notification button (Admin -> Distributor Enquiries).
- [ ] Direct SMTP email delivery — code complete; activates when the owner supplies recipient addresses (ENQUIRY_NOTIFY_EMAILS) and SMTP credentials (SMTP_HOST/PORT/USER/PASS/FROM) via the secrets card.

## Done — 2026-10-24: Customer address auto-fill fix (checkpoint 9720c2c+)
- Shipping address stored at checkout now auto-fills for returning customers at checkout AND in the account panel.
- Root cause fixed: production lookup route returned 404/401 because the serverless router registered `/api/customers/profile-lookup` only under the admin path prefix and checked a bearer token it could never match.
- Security: lookup now requires an HS256 session JWT signed with the project secret, and the JWT email must match the requested email (cross-account probes return 403).
- Verified end-to-end on production: save → lookup returns address; wrong email → 403; unauthenticated → 401.

## Done — 2026-10-24: PUDO webhook lockdown + full E2E pass (checkpoint e4ae890)
- Webhook endpoint https://wonderfuldragonfruit.company/api/webhooks/pudo is now locked with PUDO_WEBHOOK_SECRET (production env var). Unsigned/wrong-secret posts get 401; signed posts (?key=...) are accepted.
- Webhook now auto-links shipment events to orders via tracking_reference (order number) and updates status: in_transit/collected → shipped + shipped_at; delivered → delivered + delivered_at; sets courier=PUDO and tracking number.
- Full E2E on production passed: order ORD-20261024-DE4529 placed via PUDO locker flow (R944) → in_transit event set shipped → delivered event set delivered. Evidence webhook events PUDO-SHIP-E2E-001 (x2) retained in webhook_events.
- OWNER ACTION: in the PUDO dashboard, set the webhook URL to https://wonderfuldragonfruit.company/api/webhooks/pudo?key=PUDO-7826ed2d73fcb7a78b36f0335889a25203d269ba75bbd5d7

---

# Product Management System Implementation (master prompt, 2026-11-04)

## Phase 1 — Catalogue cleared (DONE 2026-11-04)
- All 108 product listings removed; `products` count verified = 0. All old descriptions, prices, SKUs, SEO info, tags, promo data removed with the rows.
- 2 obsolete slug redirects removed; `product_slug_redirects` = 0.
- Backup before deletion: SQL snapshot tables `products_backup_2026_11_04` (108 rows) and `product_slug_redirects_backup_2026_11_04` (2 rows) plus JSON export in `docs/backups/`.
- Categories kept (7) — not confirmed obsolete. Orders preserved (6) with historical snapshots intact in order_items (product_name, product_sku, quantity, unit_price_zar, total_price_zar independent of products). customers table had 0 rows before and after. No admin accounts, payments, shipping records, courier integrations, config, Secrets, blog posts, pages or business settings touched.

## Phase 2 — General product management system (IN PROGRESS)
- Add Product and Edit Product use exactly the same fields, validation, AI, SEO, GEO and social functionality; both connected to the database.
- Fields to implement and persist: name (required), unique SKU (required), automatic URL slug, category, subcategory, website brand (site identity only — never another website's brand), manufacturer, supplier, product type, condition, status, visibility, short description, long description (rich text), highlights, benefits, features, specifications, applications/uses, origin country, countries of availability, target customer, target industry, intended use, instructions, warnings/safety, FAQs, related products, attachments/downloads.

## Phase 3 — Advanced search, SEO and GEO
- Keyword/tag fields (primary/secondary/long-tail, related phrases, synonyms, alternative names, spelling variations, customer questions, tags, search tags, hashtags, industry terms, geographic/country/city keywords, identification terms, classification, use cases, problem/solution keywords, search intent, audience keywords) — multiple entries, comma-separated or removable tags.
- Search must actually find products via name, SKU, descriptions, categories, brand, keywords, tags, hashtags, specifications, synonyms, alternative names — not just store them. Hashtags reusable for social.
- SEO fields: meta title/description, focus keyword, secondary keywords, slug, canonical, image alt/title/description, OG title/description/image, Twitter card title/description/image, internal linking suggestions, related links, SEO content score, keyword coverage score, duplicate detection.
- GEO fields: AI search title/summary, entity description, knowledge summary, Q&A content, natural-language phrases, conversational questions, product facts, classification, geographic relevance, target countries/regions, business identity, brand identity, expertise info, structured specs.
- Technical SEO: Product schema.org, price/availability data, brand/manufacturer, SKU+GTIN/MPN when available, image data, breadcrumbs, Organization schema, FAQ where eligible, canonicals, XML product sitemap, robots directives, crawlable mobile pages, fast images. Structured data reflects real info — no fabricated reviews, prices, ratings or availability. No ranking guarantees promised.

## Phase 4 — Product-specific optional field groups
- Agricultural group (variety, species, plant type, cutting length, plant age, fruit colour, flesh colour, growing conditions, climate suitability, planting instructions, harvest info, agricultural classification) for agricultural products.
- Health group (ingredients, composition, nutritional info, serving size, usage, storage, packaging size, product form, allergens, safety warnings, manufacturer info, certifications) for health products; no unverified medical/nutritional/health claims generated.
- General group (material, dimensions, colour, size, model, warranty) for general products. Groups adapt to category; irrelevant groups not forced.

## Phase 5 — Pricing, inventory, shipping
- Normal/compare-at/sale/promotional prices, promo start/end dates, tax config, stock quantity, low-stock threshold, backorder, inventory tracking, variants with per-variant SKU/price/stock/weight/dimensions.
- Shipping fields: packed weight kg, parcel L/W/H cm, parcel count, shipping class, special handling — connected to the existing live courier quotation (The Courier Guy / PUDO); live rates not replaced with flat rates.

## Phase 6 — LongCat AI generation (CRITICAL)
- "Generate with AI" in BOTH Add and Edit Product uses the existing LongCat API key from Manus Secrets via server-side calls only. No Manus AI, no Manus AI credits, no duplicate key, key never exposed or hardcoded in frontend.
- AI populates all applicable fields: name suggestions, SKU suggestion where appropriate, slug, short/long description, highlights, benefits, features, specs where supplied, keywords, search tags, hashtags, SEO keywords, meta title/description, GEO title/summary, AI search questions, FAQs, image alt text, image descriptions, OG info, social descriptions, social hashtags, category, attributes, internal linking suggestions, related product suggestions.
- AI uses only administrator-supplied info; never invents ingredients, specifications, variety characteristics, plant age, production figures, nutritional values, medical benefits, certifications, prices, stock, shipping weights/dimensions, manufacturer details. Missing info left blank or flagged for input.
- Output always editable before saving; never auto-published. Controls: generate all / SEO only / GEO only / keywords+tags only / description only / social content only / regenerate selected / improve existing / duplicate product check / duplicate description check. Editing preserves verified info unless regenerated. Content uses the website's own brand.

## Phase 7 — Social media management and publishing
- Social Media Settings: 10 Facebook Pages, 10 Instagram, 10 TikTok, 10 Threads, 5 each LinkedIn, Pinterest, YouTube, X, Reddit, Blogger, Snapchat, Telegram, WhatsApp; 3 each Facebook Messenger, Google Chat; 10 other. Each entry: account name, URL, platform, status, enable/disable, optional API status, default selection; add/edit/remove; independent per website.
- Every product has a Social Media Publishing section: share to all configured accounts, share to a single platform (all 12 listed), multi-select individual accounts, or select a specific saved URL.
- LongCat generates platform-specific content per platform. Saving a URL grants no publish permission. Official APIs where available; otherwise prepare content, copyable caption, downloadable image, product URL for manual publishing. No success message unless the platform confirms publication. Publishing history records product, platform, account, date/time, content, status, errors, post URL. Tokens never exposed.

## Phase 8 — Email/SMTP and inbox
- Email config section: SMTP server, port, username, password, encryption (SSL/TLS/STARTTLS), sender name/address, reply-to, default admin email, test recipient; Test SMTP Connection and Send Test Email buttons; save/update; passwords server-side only, never in frontend or API responses.
- IMAP inbox (Afrihost): incoming server, port, IMAP encryption, username, password, connection test, sent config, sync status. Flow: read customer emails, identify enquiries/product questions, connect to products, use product DB as knowledge source, generate replies with LongCat, prepare drafts, send approved replies, optional auto-reply behind admin setting, keep conversation history. Human approval default; never auto-send sensitive advice.

## Phase 9 — Administrator dashboard
- Product Management Dashboard: totals (products, published, draft, out-of-stock, low-stock), gaps (missing SEO, missing GEO, missing images, missing keywords, missing shipping dimensions, incomplete specs), duplicate warnings, social publishing activity, email integration status, LongCat connection status. Shortcuts: Add Product, Edit Products, Generate SEO, Generate GEO, Generate Product Content, Publish to Social Media, Manage Social Accounts, Email Settings, AI Settings, Product Search, Import/Export.

## Phase 10 — Database and functionality integrity
- Every field connected to a DB column/model, saved, retrieved, editable, validated, exposed to relevant website functions, admin screens, search, SEO/GEO/social generation. Add/Edit/Save/Draft/Publish/Delete, images, variants, stock, URLs, social settings, email settings, LongCat generation, search indexing all work. No duplicate fields/records. Existing auth/permissions/admin access preserved. Social/email credentials and API config restricted to authorized administrators.

## Phase 11 — Testing and verification
- Test in the actual application: add product, LongCat generation (verify LongCat not Manus), SEO generation, GEO generation, keyword/hashtag generation, save, edit, field retention, search by name/keyword/tag/synonym, Google metadata, structured data, social sharing, SMTP test, customer/order records intact after the catalogue swap.
- Final report: what was deleted, fields implemented, tables/relationships updated, LongCat connection status, SEO/GEO generation status, search behavior, working social integrations, platforms needing API authorization, tests performed, outstanding issues.
