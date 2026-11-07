/**
 * Unified AI Configuration Hook
 * 
 * Single provider: z.ai (GLM-4.7)
 * All AI requests route through the ai-orchestrator edge function.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/integrations/manus/client";
import { toast } from "sonner";

// AI Functional Scopes
export const AI_SCOPES = [
  { id: "customer_chat", name: "Customer Chat", description: "Customer-facing AI assistant widget", icon: "MessageCircle" },
  { id: "admin_ai_assistant", name: "Admin AI Assistant", description: "Admin panel AI chat interface", icon: "Bot" },
  { id: "ai_control_panel", name: "AI Control Panel", description: "Manual AI prompt testing", icon: "Settings2" },
  { id: "content_generation", name: "Content Generation", description: "Product descriptions, marketing copy", icon: "FileText" },
  { id: "seo_optimization", name: "SEO Optimization", description: "Meta tags, keywords, content SEO", icon: "Search" },
  { id: "blog_generation", name: "Blog Generation", description: "Auto-generate blog articles", icon: "BookOpen" },
  { id: "page_builder", name: "Page Builder", description: "AI-assisted page creation", icon: "Layout" },
  { id: "image_prompt_generation", name: "Image Prompts", description: "Generate prompts for image AI", icon: "Image" },
  { id: "security_audit", name: "Security Audit", description: "Code security analysis", icon: "Shield" },
  { id: "code_generation", name: "Code Generation", description: "Generate code snippets", icon: "Code" },
] as const;

export type AIScopeId = typeof AI_SCOPES[number]["id"];

// Canonical type mappings for backward compatibility
export const TYPE_TO_SCOPE: Record<string, AIScopeId> = {
  chat: "customer_chat",
  custom: "ai_control_panel",
  product_description: "content_generation",
  seo_meta: "seo_optimization",
  content: "content_generation",
  code_review: "security_audit",
  audit: "security_audit",
  vision: "image_prompt_generation",
  blog: "blog_generation",
  page: "page_builder",
};

export interface AIScopeConfig {
  id: string;
  function_type: string;
  provider: string;
  model_id: string;
  model_name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tools_enabled_serpapi: boolean;
  serpapi_max_calls: number;
}

export interface AIProviderConfig {
  id: string;
  provider_name: string;
  display_name: string;
  base_url: string;
  auth_type: string;
  auth_header: string | null;
  is_active: boolean;
  priority: number;
  rate_limit_per_minute: number | null;
  daily_credit_limit: number | null;
  settings: Record<string, any>;
}

/**
 * Hook to fetch all AI scope configurations
 */
export function useAIScopeConfigs() {
  return useQuery({
    queryKey: ["ai-scope-configs"],
    queryFn: async () => {
      const { data, error } = await appClient
        .from("ai_model_config")
        .select("*")
        .order("function_type");
      if (error) throw error;
      return data as AIScopeConfig[];
    },
  });
}

/**
 * Hook to fetch configuration for a specific scope
 */
export function useAIScopeConfig(scopeId: AIScopeId | string) {
  return useQuery({
    queryKey: ["ai-scope-config", scopeId],
    queryFn: async () => {
      const { data, error } = await appClient
        .from("ai_model_config")
        .select("*")
        .eq("function_type", scopeId)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as AIScopeConfig | null;
    },
  });
}

/**
 * Hook to fetch all active AI providers
 */
export function useAIProviders() {
  return useQuery({
    queryKey: ["ai-providers"],
    queryFn: async () => {
      const { data, error } = await appClient
        .from("ai_provider_config")
        .select("*")
        .order("priority", { ascending: true });
      if (error) throw error;
      return data as AIProviderConfig[];
    },
  });
}

/**
 * Hook to update a scope's AI configuration
 */
export function useUpdateAIScopeConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      scopeId, provider, modelId, modelName,
    }: { scopeId: string; provider: string; modelId: string; modelName: string }) => {
      const { data: existing } = await appClient
        .from("ai_model_config")
        .select("id")
        .eq("function_type", scopeId)
        .single();

      if (existing) {
        const { error } = await appClient
          .from("ai_model_config")
          .update({ provider, model_id: modelId, model_name: modelName, updated_at: new Date().toISOString() })
          .eq("function_type", scopeId);
        if (error) throw error;
      } else {
        const { error } = await appClient.from("ai_model_config").insert({
          function_type: scopeId, provider, model_id: modelId, model_name: modelName,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-scope-configs"] });
      queryClient.invalidateQueries({ queryKey: ["ai-scope-config"] });
      toast.success("AI configuration updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update configuration");
    },
  });
}

/**
 * Hook to toggle a scope on/off
 */
export function useToggleAIScope() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ scopeId, isActive }: { scopeId: string; isActive: boolean }) => {
      const { error } = await appClient
        .from("ai_model_config")
        .update({ is_active: isActive })
        .eq("function_type", scopeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-scope-configs"] });
    },
  });
}

/**
 * Hook to update SerpAPI settings for a scope
 */
export function useUpdateSerpAPISettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ scopeId, serpApiEnabled, maxCalls }: { scopeId: string; serpApiEnabled: boolean; maxCalls: number }) => {
      const { error } = await appClient
        .from("ai_model_config")
        .update({ tools_enabled_serpapi: serpApiEnabled, serpapi_max_calls: maxCalls, updated_at: new Date().toISOString() })
        .eq("function_type", scopeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-scope-configs"] });
      toast.success("SerpAPI settings updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update SerpAPI settings");
    },
  });
}

/**
 * Hook to update provider priority/status
 */
export function useUpdateAIProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ providerId, updates }: { providerId: string; updates: Partial<AIProviderConfig> }) => {
      const { error } = await appClient
        .from("ai_provider_config")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", providerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-providers"] });
      toast.success("Provider updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update provider");
    },
  });
}

/**
 * Get the AI gateway URL
 */
function getAIGatewayUrl(): string {
  return `${"/api"}/api/functions/ai-orchestrator`;
}

/**
 * Make an AI request through the z.ai gateway
 * This is the PRIMARY and ONLY way to interact with AI
 */
export interface AIDebugInfo {
  scope_used: string;
  provider_used: string;
  model_used: string;
}

export async function callAIGateway(params: {
  scope: AIScopeId | string;
  prompt: string;
  messages?: Array<{ role: string; content: string }>;
  context?: Record<string, any>;
  stream?: boolean;
  provider?: string;
  model?: string;
}): Promise<{
  success: boolean;
  content: string;
  model: string;
  provider: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  debug?: AIDebugInfo;
}> {
  const type = TYPE_TO_SCOPE[params.scope] || params.scope;
  const { appClient } = await import("@/integrations/manus/client");
  const { data, error } = await appClient.functions.invoke("ai-orchestrator", {
    body: {
      type,
      prompt: params.prompt,
      messages: params.messages,
      context: params.context,
      stream: params.stream,
      provider: params.provider,
      model: params.model,
    },
  });
  if (error) throw new Error(error.message || "AI request failed");
  return {
    success: true,
    content: data.content,
    model: data.model,
    provider: data.provider,
    usage: data.usage,
    debug: data.debug,
  };
}

/**
 * Call SerpAPI through the shared gateway
 */
export async function callSerpAPI(params: {
  endpoint: "search" | "images" | "places" | "shopping";
  query: string;
  scope?: AIScopeId | string;
  options?: { location?: string; num?: number; gl?: string; hl?: string };
}): Promise<{ success: boolean; data: any; cached: boolean; remaining: number }> {
  const { appClient } = await import("@/integrations/manus/client");
  const { data, error } = await appClient.functions.invoke("serpapi-gateway", { body: params });
  if (error) throw new Error(error.message || "SerpAPI request failed");
  return data;
}
