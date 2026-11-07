# PUDO / Courier Guy API integration findings (2026-10-22)

## Situation
- Legacy endpoints `https://api-tcg.co.za/rates` and `/lockers-data` are GONE (Laravel 404 "route not found"). Production checkout currently falls back to flat-rate R250 (`provider: fallback`).
- New contract discovered by probing: **`https://api-tcg.co.za/api/v1/...`**.
  - `GET /api/v1/lockers-data` exists (401 Unauthenticated without valid key; 500 with pasted key after auth — needs exact header test).
  - `POST /api/v1/rates` exists (GET returns 405 "Supported methods: POST").
- Alternative newer contract: Shiplogic `https://api.shiplogic.com` (per Aug 2025 PDF https://thecourierguy.co.za/wp-content/uploads/2025/08/The-Courier-Guy-Locker-API-docs.pdf):
  - Pickup points: `GET /pickup-points?type=locker` with `lat`/`lng` (20km radius), or `search=`, or bbox `min_lat/max_lat/min_lng/max_lng`.
  - Rates: `POST /rates` with `collection_address` OR `collection_pickup_point_id`/`delivery_pickup_point_id` + `*_pickup_point_provider: "tcg-locker"` (generic collection locker ID `CG0000`), `parcels[{parcel_description, submitted_length_cm, submitted_width_cm, submitted_height_cm, submitted_weight_kg, packaging}]`.
  - On shiplogic, the stored secret `PUDO_SHIPPING_API` authenticates (validation errors, not 401) but the account returns "no pickup points found" for every documented query and `/rates` demands `provider_id` (+ `account_id`). Pasted key 401s on shiplogic.
- Key facts: sandbox env secret `PUDO_SHIPPING_API` hash f7288348 ≠ pasted key hash 32a8fc93. The PASTED key (`63561459|dHKpH...`) auths on `api-tcg.co.za/api/v1/*` (500 after auth). Verify with the user which key is final; the working contract test should decide.
- Auth header candidates: `Authorization: Bearer <key>` and/or `X-API-Key: <key>`.
- Collection address secret `TCG_COLLECTION_ADDRESS_JSON` currently stores a PLAIN TEXT address string ("Unit 11, Franschhoek Estate 22 Wren St, Rant en Dal Krugersdorp..."), not JSON. Payload builder must handle both.
- Server code to update: `server/index.ts` lines ~1058–1103 (courier + PUDO rate lookups and `fetchPudoLockers`), env default base `https://api-tcg.co.za`, code checks `PUDO_GENERIC_API_KEY || PUDO_API_KEY || PUDO_SHIPPING_API`.
- Read-only validation: `POST /api/functions/shipping-rates` on production with sample payload; scripts/test_shipping_api.mjs pattern; skill `/home/ubuntu/skills/courier-pudo-shipping-integration/SKILL.md`.
- Fallback env: `FALLBACK_SHIPPING_FLAT_RATE_ZAR` (currently 250 default).

## Next steps
1. Probe `/api/v1/lockers-data` header variants with pasted key (Bearer only, X-API-Key only, both, Accept json) until 200 + locker list.
2. Probe `POST /api/v1/rates` with pasted key + legacy payload (collection_address/delivery_address/parcels) and locker payload.
3. If `/api/v1` works with pasted key: ask user to confirm key, then update `server/index.ts` PUDO + Courier Guy paths to `/api/v1/...` and restart services; re-test production shipping endpoint for live rates.
4. If only shiplogic works: switch to shiplogic contract (needs account provisioning check with provider).
## TCG key test round 2 (2026-10-22, key d3552bddc07a45ec88ce54c9eb80cf6f)
- Stored as `THE_COURIER_GUY_API` (hash matches the value the owner pasted in chat).
- Result: **401 "Unauthenticated."** on `api-tcg.co.za/api/v1/rates`, `/api/v1/shipments`, `/api/v1/lockers-data`
  with every header variant tried: `Authorization: Bearer <key>`, raw `Authorization: <key>`,
  `Authorization: Token <key>`, `X-API-Key: <key>`, `X-CG-Api-Key: <key>`, query `?api_key=`,
  and combined `Bearer 63561459|<key>`. Same 401 on api-pudo.co.za/api/v1/*.
- Also 401 on Shiplogic (`api.shiplogic.com/accounts`, `/pickup-points`) with Bearer.
- Conclusion: the door-to-door token is rejected by the api/v1 platform as-is. The working PUDO key has
  the shape `<account_id>|<token>` (63561459|...). The bare 32-hex TCG token may be incomplete (missing
  account prefix), wrong scope (locker-only vs door-to-door), or disabled. Need the owner to re-copy the
  full key string from the Courier Guy dashboard (including any `123456|` prefix) or generate a new one.
- Production impact: PUDO rates + lockers fully live (verified: rates 200 with 4+ services; lockers 200
  with 3610 lockers via api-pudo.co.za). Courier Guy door-to-door quotes fall back to PUDO/fallback only.
- Code deployed (commit 7fb75ba): courier key preference is now THE_COURIER_GUY_API first; locker host
  defaults to https://api-pudo.co.za (lockers-data only 200s there; rates work on api-tcg.co.za).
- thecourierguy.co.za/api-docs is Cloudflare-captcha-gated; unrenderable via fetch, jina, or sandbox browser.

## Docs findings (2026-10-22)
- api-docs.tcglocker.co.za (official docs mirror) confirms: AUTHORIZATION = Bearer Token; sandbox at
  sandbox.tcglocker.co.za / sandbox.pudo.co.za. No separate production door-to-door host exists:
  api.tcglocker.co.za / api.pudo.co.za do not resolve. Production remains api-tcg.co.za/api/v1 and
  api-pudo.co.za/api/v1 (both Bearer).
- thecourierguy.co.za/api-docs is Cloudflare-gated (unfetchable); Shopify plugin PDF notes legacy
  "Key ID + Access Key" auth was discontinued in favour of Bearer access tokens.
- Next owner action: re-copy the FULL Courier Guy key from the dashboard. The working PUDO key format is
  `<account_id>|<token>`; the pasted door-to-door value is a bare 32-hex token with no account prefix,
  which the v1 API rejects as Unauthenticated.

## Door-to-door (Courier Guy) test round 3 (2026-10-24)
- Unified gateway api-tcg.co.za/api/v1/rates with the PUDO account key (63561459|...):
  - Without a `type` on both addresses: 422 "Address type is missing."
  - With `"type":"DOOR"` on both addresses: validation passes.
  - Geocoding needs a clean street address; "Rant en Dal" text fails geocoding, lat/lng supplied lets it pass.
  - After geocoding the gateway returns 500 "Rates error" for every parcel/contact variant -> the
    account (63561459) appears to be locker-service only on this gateway; door-to-door quoting is
    not available with this key.
- The standalone Courier Guy key (d3552bdd..., no account prefix) returns 401 Unauthenticated on
  api-tcg.co.za/api/v1, api.thecourierguy.co.za and api.shiplogic.com — it is not a complete key
  for any known gateway. A Shiplogic/PUDO key format is "<account_id>|<token>".
- Conclusion: door-to-door quotes at checkout need either (a) door-to-door enabled on the
  Courier Guy account behind the 63561459 key, or (b) the complete Courier Guy API key with its
  account prefix. Checkout remains safe: PUDO door-to-locker rates (R86.90–R193.60 tested live)
  and locker selection work in production.

## Door-to-door activation (2026-10-24)
- Live D2D quotes confirmed on api-tcg.co.za/api/v1/rates with the PUDO account key:
  - Cape Town (Mandalay) -> Pretoria (Arcadia), 2 kg 40x30x8: Economy R773.33, Priority R800.03.
  - Through the checkout adapter with the configured TCG collection address: "Local Priority
    Parcel" R728.76 (geocoded as a local rate from the configured collection address).
- The adapter now tries every configured key for D2D: PUDO_SHIPPING_API first (working),
  then PUDO_API_KEY / PUDO_GENERIC_API_KEY / THE_COURIER_GUY_API / COURIER_GUY_API_KEY.
  The standalone THE_COURIER_GUY_API value still returns 401 (incomplete key).
- Checkout therefore shows real Courier Guy door-to-door rates alongside the existing
  PUDO door-to-locker rates (R86.90-R262.90).
