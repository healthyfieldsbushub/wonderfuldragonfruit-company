# TikTok for Business Integration — Healthy Fields Business Hub

CA VAN HEERDEN TA HEALTHY FIELDS · TikTok for Business API **v1.3**

## 1. Callback URL

Configure exactly this URL in the TikTok Developer Portal (replace with your production domain,
which must match `TIKTOK_REDIRECT_URI` byte-for-byte):

```
https://<YOUR-DOMAIN>/api/tiktok/callback
```

That path is forwarded by the hosting layer to the backend callback function
(`public/_redirects`). The direct backend URL, which also works if you prefer to register it,
is:

```
https://bauwmqvlwnodcyntddot.Manus.co/functions/v1/tiktok-callback
```

## 2. Environment variables (server-side only)

| Variable | Purpose |
| --- | --- |
| `TIKTOK_CLIENT_ID` | TikTok app id (App ID / client key) |
| `TIKTOK_CLIENT_SECRET` | TikTok app secret — server only, never in the browser |
| `TIKTOK_REDIRECT_URI` | Exact redirect URI registered in the TikTok Developer Portal |
| `TIKTOK_SCOPES` | Optional, comma separated. Defaults to `user.info.basic` |
| `TIKTOK_TOKEN_ENC_KEY` | Auto-generated. AES-256-GCM key used to encrypt tokens at rest |

These are stored as backend secrets, not in `.env` and not in any frontend file.

## 3. Permissions / scopes requested

Only what the connection needs today:

- `user.info.basic` — read the connected account's basic identity so the dashboard can display it.

Additional scopes (reporting, ads management, catalog, lead management, pixel) can be added later
by extending `TIKTOK_SCOPES` and approving them in the TikTok Developer Portal — no code change needed.

## 4. Database tables

- `tiktok_connections` — one row per Hub user: `tiktok_user_id`, `business_id`, `account_name`,
  `access_token_encrypted`, `refresh_token_encrypted`, `token_expires_at`,
  `refresh_token_expires_at`, `scopes`, `status`, `connected_at`. RLS: a user can only read/delete
  their own row; only the backend can write. Tokens are AES-256-GCM encrypted.
- `tiktok_oauth_states` — single-use, 10-minute OAuth state records (state stored **hashed**).
  Backend-only access.

## 5. Backend endpoints

| Endpoint | Auth | Purpose |
| --- | --- | --- |
| `POST /functions/v1/tiktok-oauth-start` | Signed-in user | Creates a cryptographically random state, stores its hash, returns the TikTok authorize URL |
| `GET /functions/v1/tiktok-callback` | Public (state-protected) | Receives `auth_code`, `state`, `error`, `error_description`; validates state; exchanges the code server-side; stores encrypted tokens; redirects to the success/error page |
| `POST /functions/v1/tiktok-connection` | Signed-in user | `action`: `status` \| `test` \| `refresh` \| `disconnect` |

TikTok endpoints used (documented v1.3 only):
`/oauth2/access_token/`, `/oauth2/refresh_token/`, `/oauth2/revoke_token/`, `/user/info/`.

## 6. TikTok Developer Portal configuration

1. Create/open the app **Healthy Fields Business Hub**.
2. Add the redirect URI above (exact match, HTTPS, no trailing slash differences).
3. Request only the scopes listed in section 3.
4. Copy the App ID and App Secret into `TIKTOK_CLIENT_ID` / `TIKTOK_CLIENT_SECRET`.

## 7. Backend configuration

Add `TIKTOK_CLIENT_ID`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI` (and optionally
`TIKTOK_SCOPES`) as backend secrets. `TIKTOK_TOKEN_ENC_KEY` is already generated.

## 8. Test procedure

1. **Reachability / HTTPS** — open
   `https://bauwmqvlwnodcyntddot.Manus.co/functions/v1/tiktok-callback?healthcheck=1`;
   expect `{"ok":true,...,"https":true}`.
2. **Missing state** — open the callback with `?auth_code=abc`; expect a redirect to
   `/settings/integrations/tiktok/error?reason=missing_state`.
3. **Invalid state** — `?auth_code=abc&state=deadbeef`; expect `reason=invalid_state`.
4. **Missing auth code** — `?state=<real state>`; expect `reason=missing_auth_code`.
5. **Provider error** — `?error=access_denied&error_description=User+denied`; expect a friendly
   error page with no raw payload.
6. **Happy path** — sign in, open `/settings/integrations/tiktok`, click *Connect TikTok Business
   Account*, approve on TikTok; you land on `/settings/integrations/tiktok/success` showing the
   account name, status and scopes.
7. **Replay** — reuse the same callback URL from step 6; expect `reason=state_replayed`.
8. **No token leakage** — inspect the network responses and `localStorage`: the status endpoint
   returns only account name, ids, scopes and expiry; no `access_token` anywhere.
9. **Test / Refresh** — use the dashboard buttons; both report success against TikTok.
10. **Disconnect** — confirm the dialog; the row is deleted (`status` back to Not Connected) and
    the token is revoked at TikTok where supported.
