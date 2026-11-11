import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Bot, CheckCircle2, Image as ImageIcon, Loader2, RefreshCw, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

type AiModel = {
  id: string;
  provider: string;
  owned_by: string;
  capabilities: string;
  is_active: number | boolean;
  last_seen_at?: string;
};

type AiTask = {
  task_key: string;
  label: string;
  category: string;
  provider: string;
  model: string;
  fallback_model: string;
  max_tokens: number;
  is_enabled: number | boolean;
  notes: string;
};

type AiStatus = {
  configured: boolean;
  text_model_count: number;
  image_model_count: number;
  settings: Record<string, string>;
  endpoints: { text: string; image: string };
};

type AiUsage = {
  totals: Record<string, unknown> | null;
  byTask: Record<string, unknown>[];
  byModel: Record<string, unknown>[];
  recent: Record<string, unknown>[];
};

async function api(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || `Request failed (${response.status})`);
  return payload.data;
}

export default function AIMarketing() {
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [tasks, setTasks] = useState<AiTask[]>([]);
  const [models, setModels] = useState<AiModel[]>([]);
  const [usage, setUsage] = useState<AiUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyTask, setBusyTask] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ task: string; reply: string; model: string; ms: number } | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statusData, taskData, usageData] = await Promise.all([
        api("/api/admin/ai/status"),
        api("/api/admin/ai/tasks"),
        api("/api/admin/ai/usage?days=30"),
      ]);
      setStatus(statusData);
      setTasks(taskData || []);
      setUsage(usageData);
      setSettings(statusData?.settings || {});
      if (statusData?.configured) {
        setModels((await api("/api/admin/ai/models")) || []);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load the AI engine");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refreshCatalog = async () => {
    setRefreshing(true);
    try {
      const result = await api("/api/admin/ai/models/refresh", { method: "POST" });
      toast.success(`Refreshed ${result.refreshed} live models from 1min.ai`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Model refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  const saveTask = async (taskKey: string, patch: Partial<AiTask>) => {
    setBusyTask(taskKey);
    try {
      await api("/api/admin/ai/tasks", { method: "PUT", body: JSON.stringify({ task_key: taskKey, ...patch }) });
      setTasks((current) => current.map((task) => (task.task_key === taskKey ? { ...task, ...patch } as AiTask : task)));
      toast.success("Model assignment saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the assignment");
    } finally {
      setBusyTask(null);
    }
  };

  const saveSetting = async (key: string, value: string) => {
    setSettings((current) => ({ ...current, [key]: value }));
    try {
      await api("/api/admin/ai/settings", { method: "PUT", body: JSON.stringify({ [key]: value }) });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the setting");
    }
  };

  const testTask = async (taskKey: string) => {
    setBusyTask(taskKey);
    setTestResult(null);
    try {
      const result = await api("/api/admin/ai/test", {
        method: "POST",
        body: JSON.stringify({ task_key: taskKey, prompt: "In one short sentence, what is a dragon fruit cutting?" }),
      });
      setTestResult({ task: taskKey, reply: result.reply, model: result.model, ms: result.latency_ms });
      toast.success(`${result.model} replied in ${result.latency_ms} ms`);
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Test failed");
    } finally {
      setBusyTask(null);
    }
  };

  const textModels = models.filter((model) => model.capabilities === "text" && model.is_active);
  const modelOptions = textModels.map((model) => model.id);

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading the 1min.ai engine…
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Sparkles className="h-6 w-6" /> 1min.ai — AI Marketing &amp; Customer Service
        </h1>
        <p className="text-sm text-muted-foreground">
          Central AI engine. Text runs on the OpenAI-compatible endpoint; images use the legacy feature endpoint.
          API keys are used server-side only and are never sent to the browser.
        </p>
      </div>

      {/* Connection status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {status?.configured ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
            API connection
          </CardTitle>
          <CardDescription>
            {status?.configured
              ? "The 1min.ai key is loaded on the server and the engine is ready."
              : "ONEMIN_API_KEY is not available to the server yet. Add it in Manus Admin → Secrets (Production + Development), then restart."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Text models cached:</span>{" "}
            <strong>{status?.text_model_count ?? 0}</strong>
          </div>
          <div>
            <span className="text-muted-foreground">Image models:</span>{" "}
            <strong>{status?.image_model_count ?? 0}</strong>
          </div>
          <div className="sm:col-span-2 text-xs text-muted-foreground">
            Text endpoint: <code>{status?.endpoints.text}</code> · Image endpoint: <code>{status?.endpoints.image}</code>
          </div>
          <div className="sm:col-span-2">
            <Button onClick={refreshCatalog} disabled={refreshing || !status?.configured} variant="outline" size="sm">
              {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh live model catalog
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Automation settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Automation controls</CardTitle>
          <CardDescription>Master switches. Nothing publishes automatically until these are enabled.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable AI marketing</Label>
              <p className="text-xs text-muted-foreground">Allows generation, scheduling and publishing jobs to run.</p>
            </div>
            <Switch
              checked={settings.ai_marketing_enabled === "1"}
              onCheckedChange={(checked) => void saveSetting("ai_marketing_enabled", checked ? "1" : "0")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Require manual approval</Label>
              <p className="text-xs text-muted-foreground">Articles and posts wait for your review before publishing.</p>
            </div>
            <Switch
              checked={settings.require_manual_approval === "1"}
              onCheckedChange={(checked) => void saveSetting("require_manual_approval", checked ? "1" : "0")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-publish to Facebook</Label>
              <p className="text-xs text-muted-foreground">Posts to the correct country Page without review.</p>
            </div>
            <Switch
              checked={settings.auto_publish_facebook === "1"}
              onCheckedChange={(checked) => void saveSetting("auto_publish_facebook", checked ? "1" : "0")}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="blogs-per-day">Blog articles per Page per day</Label>
              <Input
                id="blogs-per-day"
                type="number"
                min={0}
                max={10}
                defaultValue={settings.blog_articles_per_page_per_day || "2"}
                onBlur={(event) => void saveSetting("blog_articles_per_page_per_day", event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tz">Publishing timezone</Label>
              <Input
                id="tz"
                defaultValue={settings.publishing_timezone || "Africa/Johannesburg"}
                onBlur={(event) => void saveSetting("publishing_timezone", event.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-4 w-4" /> Model assignment per task
          </CardTitle>
          <CardDescription>
            Choose which 1min.ai model performs each job. Changes take effect immediately with no code deploy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.map((task) => (
            <div key={task.task_key} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{task.label}</span>
                    <Badge variant={task.category === "image" ? "secondary" : "outline"}>{task.category}</Badge>
                    <code className="text-xs text-muted-foreground">{task.task_key}</code>
                  </div>
                  {task.notes ? <p className="mt-1 text-xs text-muted-foreground">{task.notes}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={Number(task.is_enabled) === 1}
                    onCheckedChange={(checked) => void saveTask(task.task_key, { is_enabled: checked ? 1 : 0 })}
                  />
                  <Button size="sm" variant="outline" onClick={() => void testTask(task.task_key)} disabled={busyTask === task.task_key}>
                    {busyTask === task.task_key ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                    Test
                  </Button>
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <Label className="text-xs">Primary model</Label>
                  {task.category === "image" ? (
                    <Input
                      defaultValue={task.model}
                      onBlur={(event) => void saveTask(task.task_key, { model: event.target.value })}
                    />
                  ) : (
                    <select
                      className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"
                      defaultValue={task.model}
                      onChange={(event) => void saveTask(task.task_key, { model: event.target.value })}
                    >
                      <option value={task.model}>{task.model}</option>
                      {modelOptions
                        .filter((id) => id !== task.model)
                        .map((id) => (
                          <option key={id} value={id}>{id}</option>
                        ))}
                    </select>
                  )}
                </div>
                {task.category !== "image" ? (
                  <>
                    <div>
                      <Label className="text-xs">Fallback model</Label>
                      <select
                        className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"
                        defaultValue={task.fallback_model}
                        onChange={(event) => void saveTask(task.task_key, { fallback_model: event.target.value })}
                      >
                        <option value={task.fallback_model}>{task.fallback_model || "none"}</option>
                        {modelOptions
                          .filter((id) => id !== task.fallback_model)
                          .map((id) => (
                            <option key={id} value={id}>{id}</option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Max output tokens</Label>
                      <Input
                        type="number"
                        defaultValue={task.max_tokens}
                        onBlur={(event) => void saveTask(task.task_key, { max_tokens: Number(event.target.value) })}
                      />
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          ))}
          {testResult ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950">
              <strong>{testResult.task}</strong> via <code>{testResult.model}</code> ({testResult.ms} ms):
              <p className="mt-1">{testResult.reply}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage and errors (last 30 days)</CardTitle>
          <CardDescription>
            1min.ai reports tokens, not credits, so credit balances must be read in the 1min.ai app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {usage?.totals ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div><span className="text-muted-foreground">Calls</span><div className="text-lg font-semibold">{String(usage.totals.calls ?? 0)}</div></div>
              <div><span className="text-muted-foreground">Failures</span><div className="text-lg font-semibold">{String(usage.totals.failures ?? 0)}</div></div>
              <div><span className="text-muted-foreground">Total tokens</span><div className="text-lg font-semibold">{String(usage.totals.total_tokens ?? 0)}</div></div>
              <div><span className="text-muted-foreground">Avg latency</span><div className="text-lg font-semibold">{String(usage.totals.avg_latency_ms ?? 0)} ms</div></div>
            </div>
          ) : (
            <p className="text-muted-foreground">No AI calls recorded yet.</p>
          )}
          {usage?.recent?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-left text-muted-foreground">
                  <tr><th className="py-1">Task</th><th>Model</th><th>Tokens</th><th>Status</th><th>When</th></tr>
                </thead>
                <tbody>
                  {usage.recent.slice(0, 15).map((row, index) => (
                    <tr key={index} className="border-t">
                      <td className="py-1">{String(row.task_key)}</td>
                      <td>{String(row.model)}</td>
                      <td>{String(row.total_tokens)}</td>
                      <td className={String(row.status) === "error" ? "text-red-600" : "text-emerald-600"}>{String(row.status)}</td>
                      <td>{String(row.created_at).slice(0, 16)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-4 w-4" /> Image generation
          </CardTitle>
          <CardDescription>
            Images are generated through the legacy 1min.ai feature endpoint. The engine logs every generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Image generation is wired to the <code>image_generation</code> task above. Blog images will use the model selected there.
        </CardContent>
      </Card>
    </div>
  );
}
