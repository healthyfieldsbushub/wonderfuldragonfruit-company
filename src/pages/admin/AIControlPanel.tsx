import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2,
  Loader2,
  Send,
  Copy,
  RefreshCw,
  Settings2,
  Sparkles,
  Code,
  FileText,
  Image,
  Layout,
  Menu,
  PenTool,
  Zap,
  Brain,
  Bot,
  CheckCircle,
  ExternalLink,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { 
  callAIGateway, 
  useAIScopeConfigs, 
  useAIProviders, 
  AI_SCOPES,
  type AIScopeId,
} from "@/hooks/use-ai-config";
import {
  createPageFromAI,
  createBlogFromAI,
  createMenuItemFromAI,
  type ContentCreationResult,
} from "@/hooks/use-ai-content-creator";

// Content creation templates - these actually CREATE content in the database
const CREATION_TEMPLATES = [
  {
    id: "create-page",
    label: "Create Page",
    icon: Layout,
    scope: "page_builder" as AIScopeId,
    action: "create_page",
    template: `Create a new website page with the following details:

# [PAGE TITLE HERE]

[Write the full page content here. Include headings, paragraphs, and any relevant information.]

Meta Description: [A brief 150-character description for SEO]`,
    description: "Creates a page AND adds it to site navigation automatically",
  },
  {
    id: "create-blog",
    label: "Create Blog Post",
    icon: PenTool,
    scope: "content_generation" as AIScopeId,
    action: "create_blog",
    template: `Write a blog post about:

# [BLOG POST TITLE]

[Write the full blog post content here. Include introduction, main points, and conclusion.]

Excerpt: [A brief 2-3 sentence summary]
Meta Description: [SEO description under 160 characters]`,
    description: "Creates and publishes a blog post immediately",
  },
  {
    id: "add-menu",
    label: "Add Menu Item",
    icon: Menu,
    scope: "menu_builder" as AIScopeId,
    action: "create_menu",
    template: `Add a new navigation menu item:

Label: [Menu Text to Display]
Link To: /[page-url-path]`,
    description: "Adds an item to the main site navigation",
  },
];

// AI-only templates (no database creation)
const AI_ONLY_TEMPLATES = [
  {
    id: "seo-update",
    label: "SEO Optimization",
    icon: FileText,
    scope: "seo_optimization" as AIScopeId,
    template: `Optimize SEO for the following page/content:

Page/Product: [NAME]
Current URL: [URL]

Generate optimized title, description, and keywords.`,
  },
  {
    id: "add-images",
    label: "Image Prompt",
    icon: Image,
    scope: "image_prompt_generation" as AIScopeId,
    template: `Generate image requirements for:

Purpose: [WHERE IMAGES WILL BE USED]

Theme: Dragon fruit farming in Africa, vibrant colors, professional agricultural imagery.`,
  },
  {
    id: "code-help",
    label: "Code Help",
    icon: Code,
    scope: "code_generation" as AIScopeId,
    template: `Help me with the following code task:

Task: [DESCRIBE WHAT YOU NEED]
Technology: React/TypeScript/Tailwind`,
  },
];

interface AIResponse {
  success: boolean;
  content: string;
  model: string;
  provider: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  debug?: {
    scope_used: string;
    provider_used: string;
    model_used: string;
  };
}

export default function AIControlPanel() {
  const [selectedScope, setSelectedScope] = useState<AIScopeId>("ai_control_panel");
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [creationResult, setCreationResult] = useState<ContentCreationResult | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const queryClient = useQueryClient();

  // Get configs from database
  const { data: scopeConfigs } = useAIScopeConfigs();
  const { data: providers } = useAIProviders();

  const currentConfig = scopeConfigs?.find(c => c.function_type === selectedScope);
  const activeProviders = providers?.filter(p => p.is_active) || [];

  // Get the active creation template
  const activeCreationTemplate = CREATION_TEMPLATES.find(t => t.id === activeTemplate);

  const aiMutation = useMutation({
    mutationFn: async ({ prompt, scope }: { prompt: string; scope: AIScopeId }): Promise<AIResponse> => {
      return callAIGateway({ scope, prompt });
    },
    onSuccess: async (data) => {
      setResponse(data);
      
      // If this is a creation template, automatically create the content
      if (activeCreationTemplate) {
        setIsCreating(true);
        try {
          let result: ContentCreationResult;
          
          switch (activeCreationTemplate.action) {
            case "create_page":
              result = await createPageFromAI(data.content);
              break;
            case "create_blog":
              result = await createBlogFromAI(data.content);
              break;
            case "create_menu":
              result = await createMenuItemFromAI(data.content);
              break;
            default:
              result = { success: false, type: "page", message: "Unknown action" };
          }
          
          setCreationResult(result);
          
          if (result.success) {
            toast.success(result.message, {
              action: result.viewUrl ? {
                label: "View",
                onClick: () => window.open(result.viewUrl, "_blank"),
              } : undefined,
            });
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ["admin-pages"] });
            queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
            queryClient.invalidateQueries({ queryKey: ["menus"] });
          } else {
            toast.error(result.message);
          }
        } catch (error: any) {
          toast.error("Failed to create content: " + error.message);
        } finally {
          setIsCreating(false);
        }
      } else {
        toast.success("AI Response Generated", {
          description: `${data.provider}/${data.model}`,
        });
      }
    },
    onError: (error: Error) => {
      toast.error("AI Request Failed", { description: error.message });
    },
  });

  const applyCreationTemplate = (templateId: string) => {
    const template = CREATION_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setPrompt(template.template);
      setSelectedScope(template.scope);
      setActiveTemplate(templateId);
      setCreationResult(null);
    }
  };

  const applyAITemplate = (templateId: string) => {
    const template = AI_ONLY_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setPrompt(template.template);
      setSelectedScope(template.scope);
      setActiveTemplate(templateId);
      setCreationResult(null);
    }
  };

  const sendPrompt = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    setCreationResult(null);
    aiMutation.mutate({ prompt, scope: selectedScope });
  };

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(response.content);
      toast.success("Response copied to clipboard");
    }
  };

  const isLoading = aiMutation.isPending || isCreating;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Bot className="h-8 w-8 text-primary" />
            AI Control Panel
          </h1>
          <p className="text-muted-foreground mt-1">
            Create pages, blog posts, and menu items with AI - content is saved automatically
          </p>
        </div>
        {currentConfig && (
          <Badge variant="outline" className="gap-2 self-start md:self-auto">
            <Sparkles className="h-4 w-4" />
            {currentConfig.provider}/{currentConfig.model_name}
          </Badge>
        )}
      </div>

      {/* CREATION TEMPLATES - These actually create content */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Rocket className="h-5 w-5" />
            Content Creation (Creates Real Content)
          </CardTitle>
          <CardDescription>
            These templates generate AND save content to the database automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CREATION_TEMPLATES.map((template) => (
              <Button
                key={template.id}
                variant={activeTemplate === template.id ? "default" : "outline"}
                className="h-auto py-4 flex-col gap-2 text-left items-start"
                onClick={() => applyCreationTemplate(template.id)}
              >
                <div className="flex items-center gap-2 w-full">
                  <template.icon className="h-5 w-5" />
                  <span className="font-semibold">{template.label}</span>
                </div>
                <span className="text-xs opacity-70 text-left">{template.description}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI-Only Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            AI Assistance (Text Only)
          </CardTitle>
          <CardDescription>
            Generate text content, SEO suggestions, and code help
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {AI_ONLY_TEMPLATES.map((template) => (
              <Button
                key={template.id}
                variant={activeTemplate === template.id ? "default" : "outline"}
                className="h-auto py-3 flex-col gap-2"
                onClick={() => applyAITemplate(template.id)}
              >
                <template.icon className="h-5 w-5" />
                <span className="text-xs text-center">{template.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scope Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            AI Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">AI Scope</label>
              <Select value={selectedScope} onValueChange={(v) => setSelectedScope(v as AIScopeId)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_SCOPES.map((scope) => (
                    <SelectItem key={scope.id} value={scope.id}>
                      {scope.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Active Providers</label>
              <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                {activeProviders.slice(0, 3).map((provider) => (
                  <Badge key={provider.id} variant="secondary">
                    {provider.display_name}
                  </Badge>
                ))}
                {activeProviders.length === 0 && (
                  <span className="text-sm text-muted-foreground">No active providers</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Prompt Input
              {activeCreationTemplate && (
                <Badge className="ml-2 bg-primary">{activeCreationTemplate.label}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {activeCreationTemplate 
                ? "Edit the content below - it will be created in the database when you click Generate"
                : "Enter your prompt and click Generate"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter content to create or describe what you need..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[350px] font-mono text-sm"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {prompt.length} characters
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPrompt("");
                    setActiveTemplate(null);
                    setCreationResult(null);
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <Button onClick={sendPrompt} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isCreating ? "Creating..." : "Generating..."}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {activeCreationTemplate ? "Generate & Create" : "Generate"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Output */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Result
              </CardTitle>
              <CardDescription>
                {activeCreationTemplate ? "Content created in database" : "AI generated content"}
              </CardDescription>
            </div>
            {response && (
              <Button variant="outline" size="sm" onClick={copyResponse}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-[350px] flex flex-col items-center justify-center"
                >
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                    <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    {isCreating ? "Creating content in database..." : "Generating with AI..."}
                  </p>
                </motion.div>
              ) : creationResult ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  {/* Success Card */}
                  <div className={`p-6 rounded-lg border-2 ${
                    creationResult.success 
                      ? "bg-primary/10 border-primary/30" 
                      : "bg-destructive/10 border-destructive/30"
                  }`}>
                    <div className="flex items-center gap-3 mb-4">
                      {creationResult.success ? (
                        <CheckCircle className="h-8 w-8 text-primary" />
                      ) : (
                        <Zap className="h-8 w-8 text-destructive" />
                      )}
                      <div>
                        <h3 className="font-bold text-lg">
                          {creationResult.success ? "Content Created!" : "Creation Failed"}
                        </h3>
                        <p className="text-sm text-muted-foreground">{creationResult.message}</p>
                      </div>
                    </div>
                    
                    {creationResult.success && (
                      <div className="flex flex-wrap gap-3">
                        {creationResult.viewUrl && (
                          <Button asChild>
                            <a href={creationResult.viewUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View {creationResult.type === "page" ? "Page" : "Post"}
                            </a>
                          </Button>
                        )}
                        {creationResult.editUrl && (
                          <Button variant="outline" asChild>
                            <Link to={creationResult.editUrl}>
                              Edit in Admin
                            </Link>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Show AI response below */}
                  {response && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">{response.provider}</Badge>
                        <Badge variant="secondary">{response.model}</Badge>
                      </div>
                      <ScrollArea className="h-[200px]">
                        <pre className="whitespace-pre-wrap text-sm p-4 rounded-lg bg-muted">
                          {response.content}
                        </pre>
                      </ScrollArea>
                    </div>
                  )}
                </motion.div>
              ) : response ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{response.provider}</Badge>
                    <Badge variant="secondary">{response.model}</Badge>
                  </div>
                  <ScrollArea className="h-[320px]">
                    <pre className="whitespace-pre-wrap text-sm p-4 rounded-lg bg-muted">
                      {response.content}
                    </pre>
                  </ScrollArea>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-[350px] flex flex-col items-center justify-center text-muted-foreground"
                >
                  <Wand2 className="h-12 w-12 mb-4 opacity-30" />
                  <p>Select a template and click Generate</p>
                  <p className="text-sm mt-2">Content will be created automatically</p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
