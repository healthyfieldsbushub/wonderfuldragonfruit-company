/**
 * AI Diagnostics Page
 * 
 * Production readiness checks for AI system:
 * - Provider Key Tests (verify secrets without exposing values)
 * - Model Smoke Tests (actual API calls)
 * - Fetch Models (for providers with model list APIs)
 * - Debug info display
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/integrations/manus/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Server, 
  Key, 
  Zap,
  Search,
  Globe,
  List,
  TestTube,
  Play
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface DiagnosticResult {
  provider: string;
  status: "success" | "error" | "warning" | "pending";
  message: string;
  responseTime?: number;
  model?: string;
  keySource?: "vault" | "env" | null;
  debug?: Record<string, any>;
}

interface ProviderStatus {
  provider_name: string;
  display_name: string;
  is_active: boolean;
  priority: number;
  settings?: Record<string, any>;
}

interface GeminiModel {
  id: string;
  name: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
}

const AI_GATEWAY_URL = `${"/api"}/api/functions/ai-orchestrator`;

export default function AIDiagnostics() {
  const [keyTestResults, setKeyTestResults] = useState<DiagnosticResult[]>([]);
  const [smokeTestResults, setSmokeTestResults] = useState<DiagnosticResult[]>([]);
  const [geminiModels, setGeminiModels] = useState<GeminiModel[]>([]);
  const [testing, setTesting] = useState<string | null>(null);
  const [fetchingModels, setFetchingModels] = useState(false);

  // Detect environment
  const isProduction =
    window.location.hostname === "wonderfuldragonfruit.company" ||
    window.location.hostname === "www.wonderfuldragonfruit.company";
  const isPreview = window.location.hostname.includes("preview--");
  const environmentMode = isProduction ? "Production" : isPreview ? "Preview" : "Development";

  // Fetch active providers
  const { data: providers, isLoading: loadingProviders, refetch: refetchProviders } = useQuery({
    queryKey: ["ai-providers-diagnostic"],
    queryFn: async () => {
      const { data, error } = await appClient
        .from("ai_provider_config")
        .select("provider_name, display_name, is_active, priority, settings")
        .order("priority", { ascending: true });
      
      if (error) throw error;
      return data as ProviderStatus[];
    },
  });

  // Test API key availability (without making AI call)
  const testProviderKey = async (providerName: string) => {
    setTesting(`key-${providerName}`);
    const startTime = Date.now();

    try {
      const response = await fetch(AI_GATEWAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosticAction: "key_test",
          provider: providerName,
        }),
      });

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      setKeyTestResults((prev) => [
        ...prev.filter((r) => r.provider !== providerName),
        {
          provider: providerName,
          status: data.status_code === 200 ? "success" : "error",
          message: data.message,
          responseTime,
          keySource: data.key_source_used,
        },
      ]);

      if (data.status_code === 200) {
        toast.success(`${providerName}: Key found (${data.key_source_used})`);
      } else {
        toast.error(`${providerName}: ${data.message}`);
      }
    } catch (error: any) {
      setKeyTestResults((prev) => [
        ...prev.filter((r) => r.provider !== providerName),
        {
          provider: providerName,
          status: "error",
          message: error.message || "Network error",
        },
      ]);
      toast.error(`${providerName}: ${error.message}`);
    } finally {
      setTesting(null);
    }
  };

  // Model smoke test (actual AI call)
  const runSmokeTest = async (providerName: string) => {
    setTesting(`smoke-${providerName}`);
    const startTime = Date.now();

    try {
      // Get a suitable model for the provider
      let model = "meta-llama/llama-3.3-70b-instruct";
      if (providerName === "google_ai_studio") {
        model = "gemini-1.5-flash";
      } else if (providerName === "onemin") {
        model = "gpt-4o-mini";
      } else if (providerName === "groq") {
        model = "llama-3.1-8b-instant";
      }

      const response = await fetch(AI_GATEWAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ai_control_panel",
          prompt: "Respond with exactly: DIAGNOSTIC_OK",
          provider: providerName,
          model,
          testMode: true,
        }),
      });

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      if (!response.ok || data.error) {
        setSmokeTestResults((prev) => [
          ...prev.filter((r) => r.provider !== providerName),
          {
            provider: providerName,
            status: "error",
            message: data.error || "Request failed",
            responseTime,
          },
        ]);
        toast.error(`Smoke test failed: ${data.error}`);
      } else {
        setSmokeTestResults((prev) => [
          ...prev.filter((r) => r.provider !== providerName),
          {
            provider: providerName,
            status: "success",
            message: "Model responded successfully",
            responseTime,
            model: data.debug?.model_used || model,
            keySource: data.debug?.key_source_used,
            debug: data.debug,
          },
        ]);
        toast.success(`${providerName}: Smoke test passed in ${responseTime}ms`);
      }
    } catch (error: any) {
      setSmokeTestResults((prev) => [
        ...prev.filter((r) => r.provider !== providerName),
        {
          provider: providerName,
          status: "error",
          message: error.message || "Network error",
        },
      ]);
      toast.error(`Smoke test error: ${error.message}`);
    } finally {
      setTesting(null);
    }
  };

  // Fetch models from provider
  const fetchModels = async (providerName: string) => {
    setFetchingModels(true);

    try {
      const response = await fetch(AI_GATEWAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosticAction: "fetch_models",
          provider: providerName,
        }),
      });

      const data = await response.json();

      if (data.models === "manual_list") {
        toast.info(`${providerName}: No models API available. Use model IDs from documentation.`);
        return;
      }

      if (Array.isArray(data.models)) {
        setGeminiModels(data.models);
        toast.success(`Fetched ${data.models.length} models from ${providerName}`);
      }
    } catch (error: any) {
      toast.error(`Failed to fetch models: ${error.message}`);
    } finally {
      setFetchingModels(false);
    }
  };

  // Test SerpAPI
  const testSerpAPI = async () => {
    setTesting("serpapi");
    const startTime = Date.now();

    try {
      const response = await fetch(
        `${"/api"}/api/functions/serpapi-gateway`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: "search",
            query: "test",
            testMode: true,
          }),
        }
      );

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      setKeyTestResults((prev) => [
        ...prev.filter((r) => r.provider !== "serpapi"),
        {
          provider: "serpapi",
          status: response.ok ? "success" : "error",
          message: response.ok 
            ? (data.cached ? "Connection successful (cached)" : "Connection successful")
            : (data.error || "Request failed"),
          responseTime,
        },
      ]);
    } catch (error: any) {
      setKeyTestResults((prev) => [
        ...prev.filter((r) => r.provider !== "serpapi"),
        {
          provider: "serpapi",
          status: "error",
          message: error.message || "Network error",
        },
      ]);
    } finally {
      setTesting(null);
    }
  };

  // Run all key tests
  const runAllKeyTests = async () => {
    const activeProviders = providers?.filter(p => p.is_active) || [];
    for (const provider of activeProviders) {
      await testProviderKey(provider.provider_name);
    }
    await testSerpAPI();
  };

  const getResultForProvider = (results: DiagnosticResult[], providerName: string) => {
    return results.find((r) => r.provider === providerName);
  };

  const StatusIcon = ({ status }: { status?: string }) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-primary" />;
      case "error":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-muted" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Diagnostics</h1>
          <p className="text-muted-foreground">
            Test provider connectivity, keys, and model availability
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchProviders()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Badge 
            variant={isProduction ? "default" : "secondary"}
            className="text-sm px-3 py-1"
          >
            <Globe className="h-4 w-4 mr-1" />
            {environmentMode}
          </Badge>
        </div>
      </div>

      {/* Environment Alert */}
      <Alert variant={isProduction ? "default" : "destructive"}>
        <Server className="h-4 w-4" />
        <AlertTitle>Environment: {environmentMode}</AlertTitle>
        <AlertDescription>
          {isProduction 
            ? "Running in production. Secrets must be in Manus project Secrets."
            : "Running in development. Secrets read from API Key Vault or environment."}
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="key-tests">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="key-tests">
            <Key className="h-4 w-4 mr-2" />
            Key Tests
          </TabsTrigger>
          <TabsTrigger value="smoke-tests">
            <TestTube className="h-4 w-4 mr-2" />
            Smoke Tests
          </TabsTrigger>
          <TabsTrigger value="models">
            <List className="h-4 w-4 mr-2" />
            Fetch Models
          </TabsTrigger>
        </TabsList>

        {/* Key Tests Tab */}
        <TabsContent value="key-tests">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    API Key Verification
                  </CardTitle>
                  <CardDescription>
                    Test if API keys are configured (never displays values)
                  </CardDescription>
                </div>
                <Button variant="default" size="sm" onClick={runAllKeyTests}>
                  <Play className="h-4 w-4 mr-1" />
                  Test All Keys
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingProviders ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-3">
                  {providers?.map((provider) => {
                    const result = getResultForProvider(keyTestResults, provider.provider_name);
                    const isTesting = testing === `key-${provider.provider_name}`;

                    return (
                      <motion.div
                        key={provider.provider_name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <StatusIcon status={result?.status} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{provider.display_name}</span>
                              <Badge variant={provider.is_active ? "default" : "secondary"}>
                                {provider.is_active ? "Active" : "Disabled"}
                              </Badge>
                              {result?.keySource && (
                                <Badge variant="outline">{result.keySource}</Badge>
                              )}
                            </div>
                            {result && (
                              <p className={`text-sm ${result.status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                                {result.message}
                                {result.responseTime !== undefined && ` (${result.responseTime}ms)`}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testProviderKey(provider.provider_name)}
                          disabled={isTesting}
                        >
                          {isTesting ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            "Test Key"
                          )}
                        </Button>
                      </motion.div>
                    );
                  })}

                  <Separator className="my-4" />

                  {/* SerpAPI */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <StatusIcon status={getResultForProvider(keyTestResults, "serpapi")?.status} />
                      <div>
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4" />
                          <span className="font-medium">SerpAPI</span>
                          <Badge variant="secondary">Search Tool</Badge>
                        </div>
                        {getResultForProvider(keyTestResults, "serpapi") && (
                          <p className={`text-sm ${getResultForProvider(keyTestResults, "serpapi")?.status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                            {getResultForProvider(keyTestResults, "serpapi")?.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={testSerpAPI}
                      disabled={testing === "serpapi"}
                    >
                      {testing === "serpapi" ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        "Test Key"
                      )}
                    </Button>
                  </motion.div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Smoke Tests Tab */}
        <TabsContent value="smoke-tests">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Model Smoke Tests
              </CardTitle>
              <CardDescription>
                Run actual AI requests to verify provider connectivity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProviders ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-3">
                  {providers?.filter(p => p.is_active).map((provider) => {
                    const result = getResultForProvider(smokeTestResults, provider.provider_name);
                    const isTesting = testing === `smoke-${provider.provider_name}`;

                    return (
                      <motion.div
                        key={provider.provider_name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <StatusIcon status={result?.status} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{provider.display_name}</span>
                              {result?.model && (
                                <Badge variant="outline">{result.model}</Badge>
                              )}
                            </div>
                            {result && (
                              <p className={`text-sm ${result.status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                                {result.message}
                                {result.responseTime !== undefined && ` (${result.responseTime}ms)`}
                              </p>
                            )}
                            {result?.debug && (
                              <div className="mt-2 text-xs bg-muted p-2 rounded font-mono">
                                <div>provider_used: {result.debug.provider_used}</div>
                                <div>model_used: {result.debug.model_used}</div>
                                <div>base_url_used: {result.debug.base_url_used}</div>
                                <div>key_source_used: {result.debug.key_source_used}</div>
                                {result.debug.fallback_used && (
                                  <div className="text-yellow-600">
                                    fallback_used: true ({result.debug.fallback_reason})
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => runSmokeTest(provider.provider_name)}
                          disabled={isTesting}
                        >
                          {isTesting ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-1" />
                              Run Test
                            </>
                          )}
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fetch Models Tab */}
        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Available Models
              </CardTitle>
              <CardDescription>
                Fetch available models from providers with model list APIs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant="default"
                  onClick={() => fetchModels("google_ai_studio")}
                  disabled={fetchingModels}
                >
                  {fetchingModels ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <List className="h-4 w-4 mr-2" />
                  )}
                  Fetch Gemini Models
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fetchModels("onemin")}
                  disabled={fetchingModels}
                >
                  Fetch 1min.ai Models
                </Button>
              </div>

              {geminiModels.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Google AI Studio Models</h4>
                  <ScrollArea className="h-64 border rounded-lg">
                    <div className="p-4 space-y-2">
                      {geminiModels.map((model) => (
                        <div key={model.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div>
                            <code className="text-sm font-mono">{model.id}</code>
                            <p className="text-xs text-muted-foreground">{model.name}</p>
                          </div>
                          <div className="text-xs text-right">
                            {model.inputTokenLimit && (
                              <div>Input: {model.inputTokenLimit.toLocaleString()}</div>
                            )}
                            {model.outputTokenLimit && (
                              <div>Output: {model.outputTokenLimit.toLocaleString()}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Required Secrets Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Required Secrets for Launch</CardTitle>
          <CardDescription>
            Add these keys to API Key Vault for full functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Badge variant="destructive">Required</Badge>
              <code className="bg-muted px-2 py-0.5 rounded">OPENROUTER_API_KEY</code>
              <span className="text-muted-foreground">- Primary AI provider (fallback)</span>
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="secondary">Optional</Badge>
              <code className="bg-muted px-2 py-0.5 rounded">GOOGLE_AI_API_KEY</code>
              <span className="text-muted-foreground">- Google AI Studio (Gemini)</span>
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="secondary">Optional</Badge>
              <code className="bg-muted px-2 py-0.5 rounded">ONEMIN_AI_API_KEY</code>
              <span className="text-muted-foreground">- 1min.ai multi-model gateway</span>
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="secondary">Optional</Badge>
              <code className="bg-muted px-2 py-0.5 rounded">GROQ_API_KEY</code>
              <span className="text-muted-foreground">- Groq fast inference</span>
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="secondary">Optional</Badge>
              <code className="bg-muted px-2 py-0.5 rounded">SERPAPI_API_KEY</code>
              <span className="text-muted-foreground">- Search enrichment for SEO</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
