# DRACO AI Agronomist — Implementation Plan

## Goal
Paid-only AI agronomist "DRACO" for wonderfuldragonfruit.company, reusable across the group's dragon fruit sites.

## Phase 1 — Database (migration 005)
- `subscriptions`: id, user_id, plan (draco_pro_grower), status (active/past_due/canceled), currency, price_cents, current_period_start/end, scan_count_this_month, message_count_this_month, provider (paystack/stripe), provider_ref, created_at
- `knowledge_base`: id, title, content, tags (JSON), is_active, updated_at, created_at
- `subscription_events`: id, user_id, event (granted/revoked/renewed/canceled), provider, payload, created_at

## Phase 2 — Backend
- `/api/draco/session` — POST: requires auth + active subscription; creates chat session
- `/api/draco/chat` — POST: metered, checks subscription + monthly limits
- `/api/draco/upload` — POST: image upload, sharp-compress to ≤1600px WebP before LLM vision call; decrements scan quota (30/mo)
- `/api/knowledge-base` — admin CRUD; public search endpoint for RAG
- RAG: keyword/embedding retrieval of top-k KB articles injected into DRACO system prompt (KB content takes priority)
- Paystack webhook: `charge.success` on DRACO plan → grant/extend subscription; cancel webhook → revoke

## Phase 3 — Frontend
- Homepage feature card below hero: glassmorphism dark-green gradient, "Unlock DRACO Pro Agronomist" CTA
- Paywall modal for anonymous/unsubscribed users (R199/mo)
- Inline quick-chat for active subscribers
- Floating widget ("Ask DFSA Assistant") rewired to DRACO Pro workflow
- Admin `/admin/knowledge-base` CRUD UI with tags

## Phase 4 — Config
- `DRACO_PLAN_NAME`, `DRACO_PRICE_ZAR`, `DRACO_MONTHLY_SCANS`, `PAYSTACK_SECRET_KEY` env vars
- Site strings (site name, currency) in `src/config/site.ts`

## Testing
- Anonymous → paywall modal
- Subscriber → chat + upload works, quota decrements
- Admin CRUD → KB article appears in DRACO answers
- Webhook → subscription granted/revoked
