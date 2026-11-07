# Secure Antigravity Bridge

The Manus server exposes `POST` and `GET /api/antigravity/bridge`. Requests must include the protected `X-Antigravity-Bridge-Key` header and are rate-limited to 120 requests per minute per client/IP bucket. Every accepted action writes an audit record to `bridge_audit_log` when the table is available.

## Allowlisted actions

- `ping`: returns bridge capabilities and the presence of the managed application tables.
- `db_schema`: reads schema metadata for `products`, `pages`, `blog_posts`, or `orders`.
- `db_query`: performs a read-only query against those tables using allowlisted columns, filters, sort fields, limits, and bound parameters. Raw SQL is not accepted.
- `products_list`, `products_upsert`, `products_delete`: product CRUD; delete is implemented as a safe `is_active = 0` soft delete.
- `pages_list`, `pages_upsert`: page CRUD through the allowlisted page fields.
- `blogs_list`, `blogs_upsert`, `blogs_delete`: blog CRUD; delete is implemented as a safe `is_published = 0` soft delete.
- `orders_list`, `orders_update`: read orders and update only tracking/status-note fields.
- `code_list`, `code_read`: read-only project inspection for `src`, `server`, and `public`; remote code writes and deletes are not exposed.

The bridge does not execute arbitrary SQL, accept base64 media, write or delete arbitrary files, or expose provider credentials. Media uploads use the existing authenticated multipart Manus Storage route.

## Product image processing

Authenticated product-image uploads accept source files up to 10 MB. The server rotates according to EXIF, resizes without enlarging to a maximum of 2400×2400, applies the Dragon Fruit Africa logo in the bottom-left corner, converts the result to WebP at quality 88, and returns a SHA-256 fingerprint plus image dimensions and byte counts. The fingerprint identifies the processed asset; it cannot guarantee that search engines will ignore visual similarity across different websites.

The `products` table stores image metadata in `image_metadata` and primary-image processing fields. The upload route requires the protected admin-panel password session; it does not require a username or Manus OAuth login. The password verification endpoint is rate-limited and issues an HttpOnly, Secure, cross-site-compatible signed session cookie. The footer Admin Login link opens this password gate directly.

## Shipping calculator

The admin Shipping Rates page now sends origin postal code, destination postal code, weight in kilograms, and parcel length/width/height in centimetres through the same PUDO/Courier Guy/fallback calculator used by checkout. Provider failures remain non-fatal and return the configured flat-rate fallback.
