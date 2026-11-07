import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/integrations/manus/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Zap, 
  Settings, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  ArrowUp,
  ArrowDown,
  Activity,
  BarChart3,
  DollarSign,
  Clock,
  AlertTriangle
} from "lucide-react";
import { AI_PROVIDERS, AI_FUNCTION_TYPES, getModelsForProvider } from "@/lib/ai-models";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProviderConfig {
  id: string;
  provider_name: string;
  display_name: string;
  is_active: boolean;
  priority: number;
}

interface UsageStats {
  provider_name: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  total_tokens: number;
  avg_response_time: number;
}

export default function AIProviderDashboard() {
  const queryClient = useQueryClient();
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  // Fetch provider configurations
  const { data: providers, isLoading: loadingProviders } = useQuery({
    queryKey: ["ai-providers"],
    queryFn: async () => {
      const { data, error } = await appClient
        .from("ai_provider_config")
        .select("*")
        .order("priority", { ascending: true });
      
      if (error) throw error;
      return data as ProviderConfig[];
    },
  });

  // Fetch usage statistics
  const { data: usageStats } = useQuery({
    queryKey: ["ai-usage-stats"],
    queryFn: async () => {
      const { data, error } = await appClient
        .from("ai_usage_log")
        .select("provider_name, success, total_tokens, response_time_ms")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;

      // Aggregate stats by provider
      const stats: Record<string, UsageStats> = {};
      data?.forEach((log: any) => {
        if (!stats[log.provider_name]) {
          stats[log.provider_name] = {
            provider_name: log.provider_name,
            total_requests: 0,
            successful_requests: 0,
            failed_requests: 0,
            total_tokens: 0,
            avg_response_time: 0,
          };
        }
        stats[log.provider_name].total_requests++;
        if (log.success) {
          stats[log.provider_name].successful_requests++;
        } else {
          stats[log.provider_name].failed_requests++;
        }
        stats[log.provider_name].total_tokens += log.total_tokens || 0;
        stats[log.provider_name].avg_response_time += log.response_time_ms || 0;
      });

      // Calculate averages
      Object.values(stats).forEach(s => {
        if (s.total_requests > 0) {
          s.avg_response_time = Math.round(s.avg_response_time / s.total_requests);
        }
      });

      return stats;
    },
  });

  // Fetch model configurations
  const { data: modelConfigs } = useQuery({
    queryKey: ["ai-model-configs"],
    queryFn: async () => {
      const { data, error } = await appClient
        .from("ai_model_config")
        .select("*")
        .order("function_type");
      
      if (error) throw error;
      return data;
    },
  });

  // Toggle provider active status
  const toggleProvider = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await appClient
        .from("ai_provider_config")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-providers"] });
      toast.success("Provider status updated");
    },
    onError: (error: any) => {
      toast.error("Failed to update provider: " + error.message);
    },
  });

  // Update provider priority
  const updatePriority = useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: number }) => {
      const { error } = await appClient
        .from("ai_provider_config")
        .update({ priority })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-providers"] });
      toast.success("Priority updated");
    },
  });

  // Update model config
  const updateModelConfig = useMutation({
    mutationFn: async ({ functionType, provider, modelId }: { functionType: string; provider: string; modelId: string }) => {
      const { error } = await appClient
        .from("ai_model_config")
        .upsert({
          function_type: functionType,
          provider,
          model_id: modelId,
          model_name: modelId,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: "function_type" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-model-configs"] });
      toast.success("Model configuration saved");
    },
    onError: (error: any) => {
      toast.error("Failed to save: " + error.message);
    },
  });

  // Test provider connection
  const testProvider = async (providerName: string) => {
    setTestingProvider(providerName);
    try {
      const response = await fetch(
        `${"/api"}/api/functions/ai-orchestrator`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${""}`,
          },
          body: JSON.stringify({
            type: "custom",
            prompt: "Test message - respond with 'OK'",
            provider: providerName,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTestResults(prev => ({
          ...prev,
          [providerName]: { success: true, message: `Connected! Model: ${data.model}` }
        }));
        toast.success(`${providerName} connection successful`);
      } else {
        const error = await response.json();
        setTestResults(prev => ({
          ...prev,
          [providerName]: { success: false, message: error.error || "Connection failed" }
        }));
        toast.error(`${providerName} test failed`);
      }
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        [providerName]: { success: false, message: err.message }
      }));
      toast.error(`${providerName} test failed: ${err.message}`);
    } finally {
      setTestingProvider(null);
    }
  };

  const movePriority = (id: string, currentPriority: number, direction: "up" | "down") => {
    const newPriority = direction === "up" ? currentPriority - 1 : currentPriority + 1;
    if (newPriority < 1) return;
    updatePriority.mutate({ id, priority: newPriority });
  };

  const getCurrentConfig = (functionType: string) => {
    return modelConfigs?.find((c: any) => c.function_type === functionType);
  };

  if (loadingProviders) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            AI Provider Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage AI providers, models, and monitor usage across all features
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["ai-providers"] })}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="models">Model Config</TabsTrigger>
          <TabsTrigger value="usage">Usage Stats</TabsTrigger>
        </TabsList>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Provider Priority & Status
              </CardTitle>
              <CardDescription>
                Configure which AI providers are active and their fallback order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {providers?.map((provider) => {
                  const providerInfo = AI_PROVIDERS.find(p => p.id === provider.provider_name);
                  const testResult = testResults[provider.provider_name];
                  const stats = usageStats?.[provider.provider_name];

                  return (
                    <motion.div
                      key={provider.id}
                      layout
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        provider.is_active ? "border-primary/30 bg-primary/5" : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => movePriority(provider.id, provider.priority, "up")}
                            disabled={provider.priority <= 1}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => movePriority(provider.id, provider.priority, "down")}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">#{provider.priority}</Badge>
                            <span className="font-medium">{provider.display_name}</span>
                            {provider.priority === 1 && (
                              <Badge className="bg-green-600">Primary</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {providerInfo?.models.length || 0} models available
                          </p>
                          {stats && (
                            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                              <span>{stats.total_requests} requests</span>
                              <span>{stats.successful_requests} success</span>
                              <span>{stats.avg_response_time}ms avg</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <AnimatePresence mode="wait">
                          {testResult && (
                            <motion.div
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0 }}
                              className={`flex items-center gap-2 text-sm ${
                                testResult.success ? "text-green-600" : "text-destructive"
                              }`}
                            >
                              {testResult.success ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                              <span className="max-w-32 truncate">{testResult.message}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testProvider(provider.provider_name)}
                          disabled={testingProvider === provider.provider_name}
                        >
                          {testingProvider === provider.provider_name ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Zap className="h-4 w-4" />
                          )}
                          Test
                        </Button>

                        <Switch
                          checked={provider.is_active}
                          onCheckedChange={(checked) => 
                            toggleProvider.mutate({ id: provider.id, isActive: checked })
                          }
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Function Model Assignment</CardTitle>
              <CardDescription>
                Assign specific providers and models to each AI function
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {AI_FUNCTION_TYPES.map((func) => {
                  const config = getCurrentConfig(func.id);
                  const activeProviders = providers?.filter(p => p.is_active) || [];

                  return (
                    <Card key={func.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{func.name}</h4>
                          <p className="text-sm text-muted-foreground">{func.description}</p>
                        </div>
                        <Badge variant={config?.is_active ? "default" : "secondary"}>
                          {config?.is_active ? "Active" : "Default"}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <Select
                          value={config?.provider || "openrouter"}
                          onValueChange={(provider) => {
                            const models = getModelsForProvider(provider);
                            if (models.length > 0) {
                              updateModelConfig.mutate({
                                functionType: func.id,
                                provider,
                                modelId: models[0].id,
                              });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                          <SelectContent>
                            {activeProviders.map((p) => (
                              <SelectItem key={p.provider_name} value={p.provider_name}>
                                {p.display_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={config?.model_id || ""}
                          onValueChange={(modelId) => {
                            updateModelConfig.mutate({
                              functionType: func.id,
                              provider: config?.provider || "openrouter",
                              modelId,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {getModelsForProvider(config?.provider || "zai").map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                <div className="flex items-center gap-2">
                                  {model.name}
                                  {model.recommended && <Badge className="text-xs">⭐</Badge>}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {Object.values(usageStats || {}).map((stat: UsageStats) => (
              <Card key={stat.provider_name}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{stat.provider_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Requests</span>
                      <span className="font-medium">{stat.total_requests}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Success Rate</span>
                      <span className="font-medium">
                        {stat.total_requests > 0 
                          ? Math.round((stat.successful_requests / stat.total_requests) * 100)
                          : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={stat.total_requests > 0 
                        ? (stat.successful_requests / stat.total_requests) * 100
                        : 0} 
                      className="h-2"
                    />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Tokens: {stat.total_tokens.toLocaleString()}</span>
                      <span className="text-muted-foreground">{stat.avg_response_time}ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {Object.keys(usageStats || {}).length === 0 && (
              <Card className="col-span-4">
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Activity className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No usage data yet</p>
                  <p className="text-sm text-muted-foreground">
                    Usage statistics will appear here after AI features are used
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
