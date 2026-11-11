/**
 * Central 1min.ai engine.
 *
 * Text generation uses the OpenAI-compatible endpoint
 * (https://api.1min.ai/openai/v1) with `Authorization: Bearer <key>`.
 * Image generation is NOT implemented on that endpoint (it returns 404), so it
 * uses the legacy feature endpoint (https://api.1min.ai/api/features) with the
 * `API-KEY` header instead.
 *
 * Model IDs are never hardcoded as truth: the catalog is refreshed live from
 * /openai/v1/models and cached in `ai_models`.
 *
 * Per-task model choice lives in the pre-existing `ai_model_config` table
 * (`function_type` is the task key) so the engine and the existing AI
 * Configuration admin page share one source of truth. Usage is recorded in the
 * pre-existing `ai_usage_log` table.
 */

type QueryFn = (sql: string, params?: unknown[]) => Promise<unknown[]>;
type FallbackFn = (body: Record<string, unknown>) => Promise<string>;

let dbQuery: QueryFn | null = null;
let fallbackFn: FallbackFn | null = null;

export function configureOneMin(options: { query: QueryFn; fallback?: FallbackFn }) {
  dbQuery = options.query;
  if (options.fallback) fallbackFn = options.fallback;
}

const OPENAI_BASE = () => (process.env.ONEMIN_API_BASE || "https://api.1min.ai/openai/v1").replace(/\/$/, "");
const LEGACY_BASE = () => (process.env.ONEMIN_API_BASE_LEGACY || "https://api.1min.ai/api").replace(/\/$/, "");
const apiKey = () => String(process.env.ONEMIN_API_KEY || "").trim();

export function isOneMinConfigured() {
  return apiKey().length > 0;
}

/**
 * OpenAI reasoning families reject sampling controls (temperature, top_p) with a
 * provider parameter error rather than ignoring them, so they are omitted.
 */
function rejectsSampling(model: string) {
  return /^(gpt-5|gpt-6|o3|o4)|^deepseek|^glm/i.test(model);
}

async function readError(response: Response) {
  const text = await response.text().catch(() => "");
  try {
    const parsed = JSON.parse(text) as { error?: { message?: string }; message?: string; errorCode?: string };
    return parsed.error?.message || parsed.message || parsed.errorCode || text.slice(0, 300) || `HTTP ${response.status}`;
  } catch {
    return text.slice(0, 300) || `HTTP ${response.status}`;
  }
}

// ---------------------------------------------------------------------------
// Model catalog
// ---------------------------------------------------------------------------

export async function refreshModelCatalog(): Promise<{ count: number; models: string[] }> {
  if (!isOneMinConfigured()) throw new Error("1min.ai is not configured (ONEMIN_API_KEY missing)");
  if (!dbQuery) throw new Error("1min.ai engine is not initialised");
  const response = await fetch(`${OPENAI_BASE()}/models`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  });
  if (!response.ok) throw new Error(`Model catalog failed: ${await readError(response)}`);
  const payload = (await response.json()) as { data?: { id?: string; owned_by?: string }[] };
  const models = Array.isArray(payload.data) ? payload.data : [];
  const seen: string[] = [];
  for (const model of models) {
    const id = String(model.id || "").trim();
    if (!id) continue;
    seen.push(id);
    await dbQuery(
      `INSERT INTO ai_models (id, provider, owned_by, capabilities, is_active, last_seen_at)
       VALUES (?, 'onemin', ?, 'text', 1, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE owned_by = VALUES(owned_by), is_active = 1, last_seen_at = CURRENT_TIMESTAMP`,
      [id, String(model.owned_by || "unknown")],
    );
  }
  // Anything the provider no longer advertises is marked inactive rather than deleted,
  // so historical usage rows keep a resolvable model reference.
  if (seen.length) {
    await dbQuery(
      `UPDATE ai_models SET is_active = 0 WHERE provider = 'onemin' AND capabilities = 'text' AND id NOT IN (${seen.map(() => "?").join(",")})`,
      seen,
    );
  }
  await dbQuery(
    `INSERT INTO ai_models (id, provider, owned_by, capabilities, is_active)
     VALUES ('black-forest-labs/flux-2-pro', 'onemin', 'black-forest-labs', 'image', 1)
     ON DUPLICATE KEY UPDATE capabilities = 'image', is_active = 1`,
  );
  return { count: seen.length, models: seen };
}

export async function listCachedModels(capability?: string) {
  if (!dbQuery) return [];
  return (await dbQuery(
    capability
      ? "SELECT id, provider, owned_by, capabilities, is_active, last_seen_at FROM ai_models WHERE capabilities = ? ORDER BY is_active DESC, owned_by, id"
      : "SELECT id, provider, owned_by, capabilities, is_active, last_seen_at FROM ai_models ORDER BY is_active DESC, capabilities, owned_by, id",
    capability ? [capability] : [],
  )) as Record<string, unknown>[];
}

// ---------------------------------------------------------------------------
// Task assignments (stored in the pre-existing ai_model_config table)
// ---------------------------------------------------------------------------

export async function getTaskAssignments() {
  if (!dbQuery) return [];
  return (await dbQuery(
    `SELECT function_type AS task_key,
            COALESCE(NULLIF(label, ''), function_type) AS label,
            COALESCE(NULLIF(category, ''), 'text') AS category,
            provider,
            model_id AS model,
            fallback_model,
            max_tokens,
            is_active AS is_enabled,
            notes,
            updated_at
       FROM ai_model_config
      ORDER BY category, function_type`,
  )) as Record<string, unknown>[];
}

export async function resolveAssignment(taskKey: string) {
  if (!dbQuery) throw new Error("1min.ai engine is not initialised");
  const rows = (await dbQuery(
    `SELECT function_type, model_id, fallback_model, max_tokens, is_active, provider
       FROM ai_model_config WHERE function_type = ? LIMIT 1`,
    [taskKey],
  )) as Record<string, unknown>[];
  if (!rows.length) throw new Error(`Unknown AI task: ${taskKey}`);
  const row = rows[0];
  if (!Number(row.is_active)) throw new Error(`AI task "${taskKey}" is disabled`);
  return {
    taskKey,
    model: String(row.model_id || ""),
    fallbackModel: String(row.fallback_model || ""),
    maxTokens: Number(row.max_tokens) || 2048,
    temperature: null as number | null,
    provider: String(row.provider || "onemin"),
  };
}

export async function updateTaskAssignment(taskKey: string, patch: Record<string, unknown>) {
  if (!dbQuery) throw new Error("1min.ai engine is not initialised");
  // The admin UI speaks the engine's vocabulary; map it onto the existing columns.
  const columnFor: Record<string, string> = {
    model: "model_id",
    fallback_model: "fallback_model",
    max_tokens: "max_tokens",
    is_enabled: "is_active",
    notes: "notes",
    label: "label",
  };
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [field, column] of Object.entries(columnFor)) {
    if (!(field in patch)) continue;
    sets.push(`${column} = ?`);
    values.push(patch[field]);
  }
  if (!sets.length) throw new Error("No updatable fields supplied");
  sets.push("provider = 'onemin'");
  values.push(taskKey);
  await dbQuery(`UPDATE ai_model_config SET ${sets.join(", ")} WHERE function_type = ?`, values);
  return resolveAssignment(taskKey);
}

// ---------------------------------------------------------------------------
// Usage accounting (stored in the pre-existing ai_usage_log table)
// ---------------------------------------------------------------------------

export async function logUsage(entry: {
  taskKey: string;
  model: string;
  provider?: string;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs?: number;
  status?: string;
  error?: string;
  countryCode?: string;
  pageId?: string;
}) {
  if (!dbQuery) return;
  try {
    await dbQuery(
      `INSERT INTO ai_usage_log
         (provider_name, model_id, function_type, prompt_tokens, completion_tokens, total_tokens, success, error_message, response_time_ms, country_code, page_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.provider || "onemin",
        entry.model || "",
        entry.taskKey,
        entry.promptTokens || 0,
        entry.completionTokens || 0,
        (entry.promptTokens || 0) + (entry.completionTokens || 0),
        entry.status === "error" ? 0 : 1,
        String(entry.error || "").slice(0, 500),
        entry.latencyMs || 0,
        entry.countryCode || "",
        entry.pageId || "",
      ],
    );
  } catch (error) {
    console.error("AI usage log failed", error instanceof Error ? error.message : error);
  }
}

export async function usageSummary(days = 30) {
  if (!dbQuery) return { totals: null, byTask: [], byDay: [], byModel: [], recent: [] };
  const window = Math.max(1, Math.min(365, Math.floor(days)));
  const totals = (await dbQuery(
    `SELECT COUNT(*) AS calls,
            SUM(success = 0) AS failures,
            SUM(prompt_tokens) AS prompt_tokens,
            SUM(completion_tokens) AS completion_tokens,
            SUM(total_tokens) AS total_tokens,
            ROUND(AVG(response_time_ms)) AS avg_latency_ms
       FROM ai_usage_log WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${window} DAY)`,
  )) as Record<string, unknown>[];
  const byTask = (await dbQuery(
    `SELECT function_type AS task_key, COUNT(*) AS calls, SUM(total_tokens) AS total_tokens, SUM(success = 0) AS failures
       FROM ai_usage_log WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${window} DAY)
       GROUP BY function_type ORDER BY calls DESC`,
  )) as Record<string, unknown>[];
  const byDay = (await dbQuery(
    `SELECT DATE(created_at) AS day, COUNT(*) AS calls, SUM(total_tokens) AS total_tokens
       FROM ai_usage_log WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${window} DAY)
       GROUP BY DATE(created_at) ORDER BY day`,
  )) as Record<string, unknown>[];
  const byModel = (await dbQuery(
    `SELECT model_id AS model, COUNT(*) AS calls, SUM(total_tokens) AS total_tokens
       FROM ai_usage_log WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${window} DAY)
       GROUP BY model_id ORDER BY calls DESC LIMIT 25`,
  )) as Record<string, unknown>[];
  const recent = (await dbQuery(
    `SELECT function_type AS task_key, model_id AS model, total_tokens, response_time_ms AS latency_ms,
            IF(success = 1, 'success', 'error') AS status, error_message, created_at
       FROM ai_usage_log ORDER BY created_at DESC LIMIT 40`,
  )) as Record<string, unknown>[];
  return { totals: totals[0] || null, byTask, byDay, byModel, recent };
}

// ---------------------------------------------------------------------------
// Text generation
// ---------------------------------------------------------------------------

export async function chatForTask(options: {
  taskKey: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  maxTokens?: number;
  jsonSchema?: { name: string; schema: Record<string, unknown> };
  countryCode?: string;
  pageId?: string;
}): Promise<{ text: string; model: string; provider: string; usage: { promptTokens: number; completionTokens: number } }> {
  const assignment = await resolveAssignment(options.taskKey);
  const limit = options.maxTokens || assignment.maxTokens;
  const started = Date.now();

  const attempt = async (model: string, provider: string) => {
    const body: Record<string, unknown> = {
      model,
      messages: options.messages,
      max_completion_tokens: limit,
    };
    if (assignment.temperature !== null && !rejectsSampling(model)) body.temperature = assignment.temperature;
    if (options.jsonSchema) {
      body.response_format = {
        type: "json_schema",
        json_schema: { name: options.jsonSchema.name, strict: true, schema: options.jsonSchema.schema },
      };
    }
    const response = await fetch(`${OPENAI_BASE()}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(await readError(response));
    const payload = (await response.json()) as {
      choices?: { message?: { content?: string }; finish_reason?: string }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const choice = payload.choices?.[0];
    const text = String(choice?.message?.content || "").trim();
    if (!text) throw new Error(`Empty response from ${model} (finish_reason: ${choice?.finish_reason || "unknown"})`);
    return {
      text,
      model,
      provider,
      usage: {
        promptTokens: Number(payload.usage?.prompt_tokens) || 0,
        completionTokens: Number(payload.usage?.completion_tokens) || 0,
      },
    };
  };

  const base = { taskKey: options.taskKey, countryCode: options.countryCode, pageId: options.pageId };

  try {
    const result = await attempt(assignment.model, "onemin");
    await logUsage({ ...base, model: result.model, promptTokens: result.usage.promptTokens, completionTokens: result.usage.completionTokens, latencyMs: Date.now() - started, status: "success" });
    return result;
  } catch (primaryError) {
    const message = primaryError instanceof Error ? primaryError.message : String(primaryError);

    if (assignment.fallbackModel && assignment.fallbackModel !== assignment.model) {
      try {
        const result = await attempt(assignment.fallbackModel, "onemin-fallback");
        await logUsage({
          ...base,
          model: result.model,
          provider: "onemin-fallback",
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          latencyMs: Date.now() - started,
          status: "success",
          error: `primary failed: ${message}`,
        });
        return result;
      } catch (fallbackError) {
        const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        await logUsage({ ...base, model: assignment.model, latencyMs: Date.now() - started, status: "error", error: `${message} | fallback: ${fallbackMessage}` });
        // Last resort: the site's existing NVIDIA provider keeps customer-facing
        // replies alive if 1min.ai is rate limited or out of credits.
        if (fallbackFn) {
          const text = await fallbackFn({ messages: options.messages, max_tokens: limit });
          return { text, model: "nvidia-fallback", provider: "nvidia", usage: { promptTokens: 0, completionTokens: 0 } };
        }
        throw new Error(`1min.ai failed (${message}); fallback failed (${fallbackMessage})`);
      }
    }

    await logUsage({ ...base, model: assignment.model, latencyMs: Date.now() - started, status: "error", error: message });
    if (fallbackFn) {
      const text = await fallbackFn({ messages: options.messages, max_tokens: limit });
      return { text, model: "nvidia-fallback", provider: "nvidia", usage: { promptTokens: 0, completionTokens: 0 } };
    }
    throw primaryError;
  }
}

// ---------------------------------------------------------------------------
// Image generation (legacy feature endpoint)
// ---------------------------------------------------------------------------

export async function generateImage(options: {
  prompt: string;
  aspectRatio?: string;
  model?: string;
  outputFormat?: "png" | "jpg";
  quality?: number;
  countryCode?: string;
  pageId?: string;
}): Promise<{ url: string; model: string; assetPath: string }> {
  if (!isOneMinConfigured()) throw new Error("1min.ai is not configured (ONEMIN_API_KEY missing)");
  const assignment = await resolveAssignment("image_generation").catch(() => null);
  const model = options.model || assignment?.model || "black-forest-labs/flux-2-pro";
  const started = Date.now();
  const response = await fetch(`${LEGACY_BASE()}/features`, {
    method: "POST",
    headers: { "API-KEY": apiKey(), "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "IMAGE_GENERATOR",
      model,
      promptObject: {
        prompt: options.prompt,
        aspect_ratio: options.aspectRatio || "16:9",
        output_format: options.outputFormat || "jpg",
        output_quality: options.quality ?? 85,
      },
    }),
  });
  if (!response.ok) {
    const message = await readError(response);
    await logUsage({ taskKey: "image_generation", model, latencyMs: Date.now() - started, status: "error", error: message, countryCode: options.countryCode, pageId: options.pageId });
    throw new Error(message);
  }
  const payload = (await response.json()) as {
    aiRecord?: { status?: string; temporaryUrl?: string; aiRecordDetail?: { resultObject?: string[] } };
  };
  const record = payload.aiRecord || {};
  const url = String(record.temporaryUrl || "");
  if (!url) throw new Error("1min.ai returned no image URL");
  const assetPath = String(record.aiRecordDetail?.resultObject?.[0] || "");
  await logUsage({ taskKey: "image_generation", model, latencyMs: Date.now() - started, status: "success", countryCode: options.countryCode, pageId: options.pageId });
  return { url, model, assetPath };
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function getSettings() {
  if (!dbQuery) return {} as Record<string, string>;
  const rows = (await dbQuery("SELECT setting_key, setting_value FROM ai_settings")) as Record<string, unknown>[];
  const out: Record<string, string> = {};
  for (const row of rows) out[String(row.setting_key)] = String(row.setting_value ?? "");
  return out;
}

export async function setSetting(key: string, value: string) {
  if (!dbQuery) throw new Error("1min.ai engine is not initialised");
  await dbQuery(
    "INSERT INTO ai_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
    [key, value],
  );
}
