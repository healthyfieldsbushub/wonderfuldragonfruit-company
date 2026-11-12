# Security audit and promo admin upgrade — 12 November 2026

## Commits (all pushed to origin + mirror)

| Commit | What |
| --- | --- |
| `399d475` | Security: re-quote shipping on the server so it cannot be zeroed by a client |
| `fa20dbc` | Promo codes: bulk creation, usage caps and a live redemption dashboard |
| `66ca30b` | Promo admin: use the storefront currency formatter |

## The vulnerability found and fixed

Audited every amount the checkout accepts. Only one was spoofable:

```ts
// BEFORE — the browser decided what shipping cost
const shipping = Math.max(0, Number(body.shippingCost || 0));
```

A request sending `shippingCost: 0` received **free delivery**. Confirmed on
production: a R200 product was ordered for **R200 total instead of R342.32**,
losing R142.32 per order and breaching the never-free-shipping rule.

Safe already (verified, no change needed):
- product prices — read from the database by id
- promo discount — resolved server-side from the code

Do not exist (verified absent, nothing to fix):
- loyalty points / rewards / store credit
- bundle or quantity deals
- manual admin discounts

### The fix

Shipping is re-quoted from the live carriers at order time:

- `parcelForOrderLines` rebuilds the parcel from the cart's products using the
  same rules the checkout uses to display its quote
- `quoteOrderShipping` fetches live quotes, retrying up to 3 times so a transient
  carrier failure does not remove that carrier's services from the quote
- `selectQuotedRate` matches the chosen service. A named service must appear on
  the quote; otherwise the order is declined, because substituting a rate would
  let someone pay a locker price while expecting door delivery
- no quote at all → order declined rather than silently free
- `orders.shipping_method` now stores the service actually charged

### Verified attacks, all blocked

| Attack | Result |
| --- | --- |
| `shippingCost: 0` | charged the real R142.32 |
| `shippingCost: -500` | charged the real R142.32 |
| `shippingCost: 0.01` | charged the real R142.32 |
| field omitted | charged the real R142.32 |
| bogus service name | declined |
| honest Economy order | R342.32, method stored as "Economy" |

## Promo admin upgrade

- **Bulk create** up to 500 codes: numbered from a prefix, random unguessable
  suffixes, or a pasted list. Previewed before saving; existing codes skipped and
  reported so a re-run is harmless; malformed codes listed not dropped.
- **Usage caps** shown as used/cap, remaining count, and a bar that turns red
  past 90%.
- **Live dashboard** from real orders: total codes, capped count, redemptions
  today, all-time redemptions, discount given, revenue, 30-day trend, plus a
  spotlight panel (defaults to BLACKNOVEMBER2026).
- Endpoints: `GET /api/admin/promo-analytics`, `POST /api/admin/promo-codes/bulk`.
  Both admin-gated; anonymous access returns 401.
- Migration `018_order_promo_code.sql` adds an indexed `orders.promo_code` and
  backfills it from the old note text. Safe to re-run.
- An order whose code stopped qualifying is now declined with the reason instead
  of silently charging full price.

### Verified

- anonymous analytics request → 401
- bulk create made 3 codes; re-run skipped all 3
- a 5-use cap accepted exactly 5 discounted orders, declined the 6th with
  "That promo code has reached its usage limit"
- invalid codes reported, not dropped
- BLACKNOVEMBER2026 unchanged (R60 fixed, unlimited, active 12–30 Nov 2026)
- RPC `/api/rpc/validate_promo_code` returns valid/R60, case-insensitive
- no test rows left in the database

## Publishing state

`POST publish` via the platform API is refused:

```
{"ok":false,"error":{"code":"github_canonical_active",
 "note":"this project hosts its canonical repository on GitHub — publish it from
         the project Dashboard; the platform-API publish surface only serves
         Manus-hosted projects"}}
```

So the fix must be published from the Dashboard. **Production was still
vulnerable at the time of writing** — the exploit succeeded live.

Dashboard path used: Websites → www.wonderfuldragonfruit.company →
the Publish tab in the workspace toolbar.
