# Shipping Integration Debug State — 2026-11-04

## Working
- **PUDO (Door-to-Locker)**: FULLY WORKING with rotated key `64247020|1swuDuuj...`
  - Returns 5 locker-tier rates (XS R86.51 → XL R261.71), 09-10 Nov delivery
  - Endpoint: POST https://api-pudo.co.za/api/v1/rates via server /api/functions/shipping-rates

## Courier Guy D2D — Root-cause chain (fixed step by step)
1. OLD host `api-tcg.co.za` → "Unauthenticated"/"Unauthorized" for D2D keys. FIXED:
   base URL changed to `https://api.portal.thecourierguy.co.za` (Ship Logic production host).
2. Path `/api/v1/rates` → 404 on Ship Logic host. FIXED:
   host-conditional path: `/rates` for api.portal.thecourierguy.co.za | api.shiplogic.com,
   `/api/v1/rates` for legacy api-tcg.co.za.
3. Address schema → 400 Bad Request. FIXED:
   `shippingAddress()` structured branch now normalizes `postal_code/postalCode/zip` → `code`,
   `province` → `zone` (2-letter map: Gauteng→GP, Western Cape→WC, etc.), country forced `ZA`,
   `street_address` + `local_area` derived.

## CONFIRMED WORKING DIRECT CURL (uses THE_COURIER_GUY_API=72c763af...)
- POST https://api.portal.thecourierguy.co.za/rates
- Headers: Authorization: Bearer <key>, Content-Type: application/json
- Payload (verbatim, works):
{"collection_address":{"street_address":"Willem Booysen Street","suburb":"Derdepoort","local_area":"Derdepoort","city":"Pretoria","code":"0181","zone":"GP","country":"ZA","entered_address":"Wonderful Dragon Fruit SA"},"delivery_address":{"street_address":"123 Adderley Street","suburb":"Cape Town City Centre","local_area":"Cape Town City Centre","city":"Cape Town","code":"8001","zone":"WC","country":"ZA","entered_address":"123 Adderley Street"},"parcels":[{"parcel_description":"Dragon fruit cutting 20-30cm","submitted_length_cm":35,"submitted_width_cm":8,"submitted_height_cm":8,"submitted_weight_kg":0.3,"packaging":"Standard parcel"}],"opt_in_rates":[],"opt_in_time_based_rates":[]}
- Response: {"message":"Success","rates":[{"rate":129.95,"service_level":{"code":"ECO","name":"Economy",...}}]}
- NOTE: zone full names ALSO accepted ("Gauteng", "Western Cape") — earlier curl with full names worked.
- /v3/rates also works identically.

## REMAINING ISSUE (server-side only)
Server E2E still fails: "Courier Guy rate lookup failed ... 401 Unauthorized" then "400 Bad Request"
even though identical payload + key works via curl. 401 comes from PUDO keys tried first on the
Ship Logic host (expected noise); the 400 for the TCG key persists after restart.

### Next debugging steps (in order)
1. Check whether server process env actually holds the NEW keys:
   `cat /proc/$(pgrep -f "tsx server/index.ts")/environ | tr '\0' '\n' | grep THE_COURIER`
   (runtime regenerates /var/lib/manus/addon-projects/*.env and may revert sed edits)
2. Dump the server's EXACT generated payload: add temporary console.log of
   JSON.stringify(ratePayload) + chosen courierKey prefix before the externalJson call.
3. Reproduce server payload with curl (esp. the `collection_address` object built from
   TCG_COLLECTION_ADDRESS_JSON secret — its stored schema may differ from the working curl).
4. If needed, reorder courierKeys so THE_COURIER_GUY_API is tried FIRST on the Ship Logic host
   (PUDO keys only for the Pudo locker path).

## Key facts
- Keys rotated & saved on platform (webdev config rev 26): THE_COURIER_GUY_API (rev 3), PUDO_SHIPPING_API (rev 2).
- Sandbox env file must be re-sed'ed after every runtime regeneration (it reverts to old keys).
- E2E test request that reaches server:
  POST /api/functions/shipping-rates {"delivery_address":{...},"destinationPostalCode":"8001","parcels":[...]}
- normalizeRates() maps rate.rate / rate.price / rate.amount / rate.total → price.

## Product shipping data
- scripts/fill-shipping-details.ts committed (d880a88): all 96 products now have weight+dimensions.
