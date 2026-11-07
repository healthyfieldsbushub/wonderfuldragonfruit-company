/**
 * AI Configuration Page
 * 
 * Architecture Layer: AI Configuration (Layer 2)
 * 
 * This page serves as the single source of truth for AI behavior.
 * It consolidates:
 * - AI scope configuration (which models for which features)
 * - Provider management (priority, enable/disable)
 * - Usage monitoring
 * 
 * Note: API keys are managed separately in the API Key Vault (Layer 1)
 */

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  MessageCircle,
  Code,
  Shield,
  Search,
  FileText,
  Image,
  Eye,
  Layout,
  Menu,
  Cpu,
  Wrench,
  Settings2,
  Zap,
  RefreshCw,
  Save,
  Loader2,
  CheckCircle,
  BarChart3,
  Layers,
  ArrowUpDown,
  ToggleLeft,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

import {
  AI_SCOPES,
  useAIScopeConfigs,
  useAIProviders,
  useUpdateAIScopeConfig,
  useToggleAIScope,
  useUpdateAIProvider,
  useUpdateSerpAPISettings,
  type AIScopeConfig,
  type AIProviderConfig,
} from "@/hooks/use-ai-config";

import { AI_PROVIDERS, getModelsForProvider } from "@/lib/ai-models";

// Icon mapping for scopes
const SCOPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  customer_chat: MessageCircle,
  admin_ai_assistant: Bot,
  ai_control_panel: Settings2,
  code_generation: Code,
  code_fixing: Wrench,
  security_audit: Shield,
  seo_optimization: Search,
  content_generation: FileText,
  image_prompt_generation: Image,
  vision_documents: Eye,
  page_builder: Layout,
  menu_builder: Menu,
  agentic_tasks: Cpu,
};

export default function AIConfiguration() {
  const queryClient = useQueryClient();
  const [pendingChanges, setPendingChanges] = useState<Record<string, { provider: string; model_id: string; model_name: string }>>({});

  // Data hooks
  const { data: scopeConfigs = [], isLoading: loadingScopes } = useAIScopeConfigs();
  const { data: providers = [], isLoading: loadingProviders } = useAIProviders();

  // Mutation hooks
  const updateScopeMutation = useUpdateAIScopeConfig();
  const toggleScopeMutation = useToggleAIScope();
  const updateProviderMutation = useUpdateAIProvider();
  const updateSerpAPISettingsMutation = useUpdateSerpAPISettings();

  const isLoading = loadingScopes || loadingProviders;

  const getConfigForScope = (scopeId: string): AIScopeConfig | undefined => {
    return scopeConfigs.find((c) => c.function_type === scopeId);
  };

  const getCurrentSelection = (scopeId: string) => {
    const pending = pendingChanges[scopeId];
    if (pending) return pending;

    const config = getConfigForScope(scopeId);
    if (config) {
      return { provider: config.provider, model_id: config.model_id, model_name: config.model_name };
    }
    return null;
  };

  const handleModelChange = (scopeId: string, provider: string, modelId: string) => {
    const allModels = AI_PROVIDERS.flatMap((p) => p.models);
    const model = allModels.find((m) => m.id === modelId);

    setPendingChanges((prev) => ({
      ...prev,
      [scopeId]: { provider, model_id: modelId, model_name: model?.name || modelId },
    }));
  };

  const saveChange = async (scopeId: string) => {
    const change = pendingChanges[scopeId];
    if (!change) return;

    await updateScopeMutation.mutateAsync({
      scopeId,
      provider: change.provider,
      modelId: change.model_id,
      modelName: change.model_name,
    });

    setPendingChanges((prev) => {
      const next = { ...prev };
      delete next[scopeId];
      return next;
    });
  };

  const saveAllChanges = async () => {
    for (const scopeId of Object.keys(pendingChanges)) {
      await saveChange(scopeId);
    }
  };

  const handleProviderToggle = (providerId: string, isActive: boolean) => {
    updateProviderMutation.mutate({ providerId, updates: { is_active: isActive } });
  };

  const handleProviderPriorityChange = (providerId: string, priority: number) => {
    updateProviderMutation.mutate({ providerId, updates: { priority } });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Layers className="h-8 w-8 text-primary" />
            AI Configuration
          </h1>
          <p className="text-muted-foreground mt-1">
            Central configuration for all AI capabilities across the system
          </p>
        </div>
        <div className="flex items-center gap-2">
          {Object.keys(pendingChanges).length > 0 && (
            <Badge variant="secondary" className="animate-pulse">
              {Object.keys(pendingChanges).length} unsaved changes
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["ai-scope-configs"] });
              queryClient.invalidateQueries({ queryKey: ["ai-providers"] });
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {Object.keys(pendingChanges).length > 0 && (
            <Button onClick={saveAllChanges} disabled={updateScopeMutation.isPending}>
              {updateScopeMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save All
            </Button>
          )}
        </div>
      </div>

      {/* Architecture Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Architecture Layer 2:</strong> This page configures AI behavior per scope. API keys are stored
          separately in the <strong>API Key Vault</strong> (Layer 1). Feature pages (Layer 3) consume AI through the
          shared gateway without hardcoding providers.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="scopes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scopes" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Scope Configuration
          </TabsTrigger>
          <TabsTrigger value="providers" className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Provider Priority
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Usage Analytics
          </TabsTrigger>
        </TabsList>

        {/* Scope Configuration Tab */}
        <TabsContent value="scopes" className="space-y-4">
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">
                Each scope represents a logical AI responsibility. Assign the best provider and model for each use case.
              </p>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {AI_SCOPES.map((scope, index) => {
                  const config = getConfigForScope(scope.id);
                  const current = getCurrentSelection(scope.id);
                  const hasPending = !!pendingChanges[scope.id];
                  const Icon = SCOPE_ICONS[scope.id] || Bot;

                  return (
                    <motion.div
                      key={scope.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card className={`relative overflow-hidden transition-all ${hasPending ? "ring-2 ring-primary/50" : ""}`}>
                        {hasPending && <div className="absolute top-0 left-0 right-0 h-1 bg-primary animate-pulse" />}
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Icon className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-base">{scope.name}</CardTitle>
                                <CardDescription className="text-xs">{scope.description}</CardDescription>
                              </div>
                            </div>
                            <Switch
                              checked={config?.is_active ?? true}
                              onCheckedChange={(checked) =>
                                toggleScopeMutation.mutate({ scopeId: scope.id, isActive: checked })
                              }
                            />
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Provider Selection */}
                          <div className="space-y-2">
                            <Label className="text-xs">Provider</Label>
                            <Select
                              value={current?.provider || "openrouter"}
                              onValueChange={(provider) => {
                                const providerModels = getModelsForProvider(provider);
                                if (providerModels.length > 0) {
                                  handleModelChange(scope.id, provider, providerModels[0].id);
                                }
                              }}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {AI_PROVIDERS.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Model Selection */}
                          <div className="space-y-2">
                            <Label className="text-xs">Model</Label>
                            <Select
                              value={current?.model_id || ""}
                              onValueChange={(modelId) => {
                                const provider = current?.provider || "openrouter";
                                handleModelChange(scope.id, provider, modelId);
                              }}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select model..." />
                              </SelectTrigger>
                              <SelectContent>
                                {getModelsForProvider(current?.provider || "zai").map((model) => (
                                  <SelectItem key={model.id} value={model.id}>
                                    <div className="flex items-center gap-2">
                                      <span>{model.name}</span>
                                      {model.recommended && (
                                        <Badge variant="outline" className="text-[10px] py-0">
                                          ⭐
                                        </Badge>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* SerpAPI Tool Controls */}
                          <Separator className="my-2" />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Search className="h-3 w-3 text-muted-foreground" />
                              <Label className="text-xs">SerpAPI Tool</Label>
                            </div>
                            <Switch
                              checked={config?.tools_enabled_serpapi ?? false}
                              onCheckedChange={(checked) => {
                                // Update via mutation
                                updateSerpAPISettingsMutation.mutate({
                                  scopeId: scope.id,
                                  serpApiEnabled: checked,
                                  maxCalls: config?.serpapi_max_calls ?? 10,
                                });
                              }}
                            />
                          </div>
                          {config?.tools_enabled_serpapi && (
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground">Max calls/hr:</Label>
                              <Select
                                value={(config?.serpapi_max_calls ?? 10).toString()}
                                onValueChange={(v) => {
                                  updateSerpAPISettingsMutation.mutate({
                                    scopeId: scope.id,
                                    serpApiEnabled: true,
                                    maxCalls: parseInt(v),
                                  });
                                }}
                              >
                                <SelectTrigger className="h-7 w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[5, 10, 20, 50, 100].map((n) => (
                                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* Save Button */}
                          {hasPending && (
                            <Button
                              size="sm"
                              className="w-full mt-2"
                              onClick={() => saveChange(scope.id)}
                              disabled={updateScopeMutation.isPending}
                            >
                              {updateScopeMutation.isPending ? (
                                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3 w-3 mr-2" />
                              )}
                              Save
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        {/* Provider Priority Tab */}
        <TabsContent value="providers" className="space-y-4">
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">
                Configure provider fallback order. When the primary provider fails, the system automatically tries the
                next available provider in priority order.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {loadingProviders ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              providers
                .sort((a, b) => a.priority - b.priority)
                .map((provider, index) => (
                  <Card key={provider.id} className={!provider.is_active ? "opacity-50" : ""}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-medium">{provider.display_name}</h3>
                            <p className="text-xs text-muted-foreground">{provider.base_url}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Priority</Label>
                            <Select
                              value={provider.priority.toString()}
                              onValueChange={(v) => handleProviderPriorityChange(provider.id, parseInt(v))}
                            >
                              <SelectTrigger className="w-20 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                                  <SelectItem key={p} value={p.toString()}>
                                    {p}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2">
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                            <Switch
                              checked={provider.is_active}
                              onCheckedChange={(checked) => handleProviderToggle(provider.id, checked)}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>

        {/* Usage Analytics Tab */}
        <TabsContent value="usage" className="space-y-4">
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">
                Monitor AI usage across all scopes and providers. Track token usage, costs, and performance.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage Summary</CardTitle>
              <CardDescription>Coming soon: Detailed analytics charts and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Usage analytics will appear here once data is collected.</p>
                <p className="text-sm">View the ai_usage_log table in the database for raw data.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
