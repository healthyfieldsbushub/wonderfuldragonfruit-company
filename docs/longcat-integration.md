# LongCat chatbot integration notes

## API reference (verified live 2026-10-24)
- Endpoint: `POST https://api.longcat.chat/openai/v1/chat/completions` (OpenAI-compatible)
- Auth: `Authorization: Bearer $LONGCAT_API_KEY` — key stored in Manus secrets as `LONGCAT_AI_API_KEY`
- Models: `LongCat-2.5-Preview` (default used), `LongCat-2.0`
- Body: `{ model, messages[{role, content}], stream, max_tokens, temperature, top_p, thinking: {"type":"enabled"|"disabled"} }`
- Response: standard OpenAI `choices[0].message.content`; with thinking enabled there is also
  `reasoning_content`. Temperature is fixed at 1.0 with thinking enabled, 0.7 with thinking disabled.
- Verified live: key valid, model responds, `finish_reason: stop` with `thinking: disabled`.
- Docs sources:
  - https://longcat.chat/platform/docs/api/chat
  - https://longcat.chat/platform/docs/api-docs (base URL https://api.longcat.chat)
  - https://longcat.chat/platform/docs/api/models

## Implementation in this project (server/index.ts)
- `buildCustomerChatContext()` — loads up to 60 active products (name, SKU, price, stock,
  description, category) and up to 40 active knowledge_base entries (title, content, category,
  tags) from the MySQL database.
- `callLongCat(body)` — builds a system prompt with the approved catalogue + knowledgebase and
  strict "answer only from provided data; never invent prices, stock, specs, rates" rules;
  calls LongCat with `thinking: disabled`, temperature 0.7, max_tokens 1024.
- Routing: `onemin-chat` (the customer chat widget endpoint, src/components/ai/AIAssistantWidget.tsx)
  uses LongCat when `LONGCAT_AI_API_KEY` is set, falling back to the configured Manus LLM on any
  failure. Other AI tools (`ai-orchestrator`, `kilo-ai`, `seo-optimizer`, `admin-ai`) still use
  the Manus LLM.
- Verified live via `/api/functions/onemin-chat`: provider `longcat`, response lists real
  catalogue prices (e.g. Purple Haze R 400, Black Dragon R 1,500, bulk trays R 26,000–R 78,000)
  and stock status straight from the products table.

## Priority 3 remaining sub-item
- Chatbot connection to admin SEO tools: the SEO admin pages (SEOManager, SEOValidator,
  RobotsAudit) exist; the brief asks the chatbot to use genuine SEO analysis results "where
  appropriate" and never fabricate rankings. No live keyword-ranking provider credentials are
  configured (no SerpAPI key verified), so the chatbot must not present ranking data; this is
  enforced by the "answer only from provided data" rule. Genuine keyword ranking data remains
  blocked on provider credentials (see TODO.md).
