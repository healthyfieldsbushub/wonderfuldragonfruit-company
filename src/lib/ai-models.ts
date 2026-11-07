// Alibaba Model Studio (DashScope) - Coding Plan
// OpenAI-compatible endpoint
// Provider: Alibaba Cloud Model Studio

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  recommended?: boolean;
  lightweight?: boolean;
  capabilities?: string[];
}

export interface AIProvider {
  id: string;
  name: string;
  baseUrl: string;
  authType: "bearer";
  models: AIModel[];
}

// All Coding Plan models available
export const DASHSCOPE_MODELS: AIModel[] = [
  // Qwen
  { id: "qwen3.5-plus", name: "Qwen 3.5 Plus", provider: "dashscope", recommended: true, capabilities: ["chat", "coding", "reasoning", "vision", "content", "seo"] },
  { id: "qwen3-max-2026-01-23", name: "Qwen 3 Max", provider: "dashscope", capabilities: ["chat", "reasoning", "content"] },
  { id: "qwen3-coder-next", name: "Qwen 3 Coder Next", provider: "dashscope", capabilities: ["coding"] },
  { id: "qwen3-coder-plus", name: "Qwen 3 Coder Plus", provider: "dashscope", capabilities: ["coding"] },
  // Zhipu
  { id: "glm-5", name: "GLM-5", provider: "dashscope", capabilities: ["chat", "reasoning", "content"] },
  { id: "glm-4.7", name: "GLM-4.7", provider: "dashscope", lightweight: true, capabilities: ["chat", "content", "fast"] },
  // Kimi
  { id: "kimi-k2.5", name: "Kimi K2.5", provider: "dashscope", capabilities: ["chat", "reasoning", "vision"] },
  // MiniMax (lightest for chat)
  { id: "MiniMax-M2.5", name: "MiniMax M2.5", provider: "dashscope", lightweight: true, capabilities: ["chat", "content", "fast"] },
];

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: "dashscope",
    name: "Alibaba Model Studio",
    baseUrl: "https://coding-intl.dashscope.aliyuncs.com/v1/chat/completions",
    authType: "bearer",
    models: DASHSCOPE_MODELS,
  },
];

export const AI_FUNCTION_TYPES = [
  { id: "chat", name: "Customer Chat", icon: "MessageCircle", description: "Website chat and support" },
  { id: "content", name: "Content Generation", icon: "FileText", description: "Product descriptions, marketing" },
  { id: "seo", name: "SEO Optimization", icon: "Search", description: "Meta tags, keywords" },
  { id: "coding", name: "Code Generation", icon: "Code", description: "Code writing and debugging" },
  { id: "audit", name: "Security Audit", icon: "Shield", description: "Security analysis and review" },
  { id: "blog", name: "Blog Generation", icon: "BookOpen", description: "Blog posts and articles" },
  { id: "page", name: "Page Builder", icon: "Layout", description: "Website page content" },
  { id: "image", name: "Image Prompts", icon: "Image", description: "Image generation prompts" },
];

export function getModelsForProvider(providerId: string): AIModel[] {
  const provider = AI_PROVIDERS.find(p => p.id === providerId);
  return provider?.models || DASHSCOPE_MODELS;
}

function findModel(modelId: string): { model: AIModel; provider: AIProvider } | null {
  for (const provider of AI_PROVIDERS) {
    const model = provider.models.find(m => m.id === modelId);
    if (model) return { model, provider };
  }
  return null;
}

function getRecommendedModels(): AIModel[] {
  return DASHSCOPE_MODELS.filter(m => m.recommended);
}

// Backward-compat exports (some code may still import ZAI_MODELS)
const ZAI_MODELS = DASHSCOPE_MODELS;
