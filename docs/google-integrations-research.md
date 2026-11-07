# Google integration authentication findings

- Google Maps Platform products require an API key, billing, and each required API enabled; Google recommends restricting the key. Source: https://developers.google.com/maps/documentation/places/web-service/get-api-key
- Gemini API supports standard or authorization API keys. Google documents environment-variable use and warns against unrestricted keys. Source: https://ai.google.dev/gemini-api/docs/api-key
- Google Analytics Data API quickstart authenticates with a user account or service account and requires property access; it is not configured by one general browser API key. Source: https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart
- Google Search Console API requires OAuth 2.0 for user data. The Search Console Testing Tools API can use an API key for its public/testing surface. Source: https://developers.google.com/webmaster-tools/v1/how-tos/authorizing
- YouTube Data API supports API-key access for public list requests and OAuth 2.0 for user-authorized operations; API enablement and quota apply. Source: https://developers.google.com/youtube/v3/getting-started
- SerpApi uses a server-side `api_key` and the `engine=google` search endpoint. Its `tbm` values include images (`isch`), local (`lcl`), and shopping (`shop`). Source: https://serpapi.com/search-api
