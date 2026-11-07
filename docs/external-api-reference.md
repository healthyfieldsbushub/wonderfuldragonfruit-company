# External API reference (verified 2026-10-24)

## SerpAPI (Google SERP data) — keyword research
- Endpoint used: `https://serpapi.com/search?api_key=KEY&engine=google&q=QUERY&gl=za&hl=en&num=20`
- Env var: `GOOGLE_SERPAPI` (also accepts `GOOGLE_SERP_API` in server code)
- Response fields used: `organic_results[].title/snippet/link`, `related_searches[].query`,
  `related_questions[].question`, `search_information.total_results`
- Owner-supplied key (2026-10-24): `c82e78e9213eb353eb...` (full value provided in chat; to be
  stored via Manus secrets card under GOOGLE_SERPAPI, never committed)
- Verified live: query "dragon fruit South Africa" returned real Google organic results and
  related searches ("Dragon fruit south africa price", "Where to buy dragon fruit south africa").

## Google Maps Places (New) — address autocomplete
- Endpoint: `POST https://places.googleapis.com/v1/places:autocomplete`
- Header auth: `X-Goog-Api-Key` (env `GOOGLE_ALL_SERVICES`), FieldMask:
  `suggestions.placePrediction.placeId,suggestions.placePrediction.description`
- STATUS: stored `GOOGLE_ALL_SERVICES` key returns `API_KEY_INVALID` for Places API (New).
- Geocoding legacy API (`/maps/api/geocode/json?key=...`) also uses the same stored key.

## OpenStreetMap Nominatim fallback (keyless, currently active)
- Autocomplete: `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=za&q=...`
  - Requires User-Agent header. Returns `place_id`, `display_name`, `lat`, `lon`.
- Details: reverse geocode `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=..&lon=..`
  - Parse `address.house_number`, `address.road`, `address.city/town/village/suburb`,
    `address.state`, `address.postcode`, `address.country`.
- Server functions: `/api/functions/address-autocomplete` and `/api/functions/address-place-details`
  (public, no admin gate; key never exposed). Google tried first, OSM fallback when the key fails.
- OSM `lookup` by osm_ids did NOT return data for search place_ids; use lat/lon reverse geocode instead.

## LongCat chatbot
- `POST https://api.longcat.chat/openai/v1/chat/completions`, Bearer `LONGCAT_AI_API_KEY`,
  model `LongCat-2.5-Preview`, OpenAI-compatible.
- Production deploy runs `tsx server/index.ts` from source (Dockerfile: npm run build then npm start),
  so deploys always include latest committed server code.

## Primary SEO keywords (owner-supplied list, 2026-10-24)
dragon fruit south africa; dragon fruit plants south africa; dragon fruit plants for sale south
africa; buy dragon fruit plants south africa; where to buy dragon fruit plants in south africa;
dragon fruit farming south africa; dragon fruit sa; dfsa dragon fruit south africa; wonderful
dragon fruit south africa; dragon fruit nursery south africa; dragon fruit cuttings for sale
south africa; commercial dragon fruit plants south africa; dragon fruit suppliers south africa;
dragon fruit cultivars south africa; dragon fruit farming support south africa
- Applied to: index.html `<meta name="keywords">` (full list) and Organization/AgricultureBusiness
  schema keywords in index.html.
