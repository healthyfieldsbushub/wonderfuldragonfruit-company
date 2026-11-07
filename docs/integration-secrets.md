# External integration secrets

All values in this inventory are supplied through the Manus Admin panel. They are never committed to the repository or sent to the browser.

## Checkout gateways

- PayFast is the only checkout gateway: `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE` (with the legacy `PAYFAST_SECURITY_PASSPHRASE` alias supported), `PAYFAST_MODE`, and optional `PAYFAST_PDT_KEY`. The signed form is posted to the provider-hosted checkout and payment fulfillment must come from its verified ITN.

## Shipping providers

- The Courier Guy: `THE_COURIER_GUY_API` is supported by the current project declaration and is used as the bearer API key. The default documented base URL is `https://api.portal.thecourierguy.co.za`; `COURIER_GUY_API_URL` can override it through Admin configuration if required.
- The Courier Guy collection settings: `TCG_COLLECTION_ADDRESS_JSON` and `TCG_COLLECTION_CONTACT_JSON` are protected production values used in the collection address payload. The configured address postal code is extracted server-side for the origin quote code.
- PUDO: `PUDO_SHIPPING_API` is supported by the current project declaration and is used by the server adapter. The published base URL is `https://api-tcg.co.za`; `PUDO_API_URL` can override it through Admin configuration if required. `PUDO_COLLECTION_TERMINAL_ID` supplies the selected collection terminal for PUDO rates. The public PUDO documentation does not provide a complete authentication or webhook contract, so locker/rate behavior should be verified with the supplied account credentials before go-live.

If both live provider lookups fail or return no quotes, the server returns a flat-rate fallback option using `FALLBACK_SHIPPING_FLAT_RATE_ZAR` (default `250` ZAR). Provider errors are isolated so one invalid PUDO or Courier Guy response cannot block checkout. The fallback is explicitly labeled to customers and never marks an order as paid. It never exposes client-side secrets.

## Google services

- Google Maps Platform, Places, Geocoding, Routes, and public YouTube search use the protected `GOOGLE_ALL_SERVICES` key through server-side proxy functions. The proxy routes are protected by the verified website-admin gate so the key cannot be used anonymously from the browser.
- SerpAPI Google Search, Images, Places, and Shopping use `GOOGLE_SERPAPI` through the protected `serpapi-gateway` function. The server maps the requested search type to SerpApi's `tbm` values.
- Gemini content and chat can be selected explicitly by sending `provider: "google_ai_studio"`, `"gemini"`, or `"vertex_ai"` to the AI orchestrator. The server reads `GOOGLE_GEMINI_VERTEX_API` at runtime and never embeds it in frontend output. The supplied credential must be valid for the Generative Language API; standard Vertex AI OAuth/service-account credentials require a separate adapter and secret shape.
- Google Analytics Data API and private Google Search Console data are not activated by these API keys. They require a Google user OAuth flow or a service-account credential with property/site access. YouTube write operations also require OAuth; the current server adapter is read-only public search.

The Google API project must separately enable the Maps, Places, Routes, YouTube Data, and Generative Language APIs that the website will call. Google recommends restricting API keys to the required APIs and allowed origins or server usage.

## Facebook and Instagram publishing

- Facebook Page publishing uses `FACEBOOK_PAGE_ACCESS_TOKEN` with `FACEBOOK_PAGE_ID`. `FACEBOOK_GRAPH_TOKEN` is retained as a server-side fallback for environments where the Page token is supplied under the generic Graph token declaration.
- `FACEBOOK_PAGE_NAME`, `FACEBOOK_APP_ID`, and `FACEBOOK_APP_SECRET` are stored for account identification and future Meta OAuth/account-management work. They are not sent to the browser.
- Instagram image publishing uses `INSTAGRAM_ID` and the server-side Facebook Page access token. Meta must have the required Page and Instagram publishing permissions, the Instagram account must be a professional account connected to the Page, and the image URL must be public and JPEG-compatible.
- The admin-only server functions are `social-status`, `facebook-publish`, and `instagram-publish`. The browser reaches them through the `/admin/social-publisher` screen; it never calls Meta directly.
- The older misspelled `FACEBOOK_PAGE_ACCSESS_TOKEN` declaration is not used by the application. The integration uses the correctly named `FACEBOOK_PAGE_ACCESS_TOKEN` declaration.
