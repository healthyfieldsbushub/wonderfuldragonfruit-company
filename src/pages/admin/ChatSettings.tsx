import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/integrations/manus/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MessageCircle, 
  Settings, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  RefreshCw,
  Bot,
  Sparkles,
  Info
} from "lucide-react";
import { callAIGateway, useAIScopeConfig } from "@/hooks/use-ai-config";

interface ChatConfig {
  id: string;
  provider_name: string;
  selected_model: string;
  is_active: boolean;
  settings: Record<string, any>;
  feature_scope: string[];
  created_at: string;
  updated_at: string;
}

export default function ChatSettings() {
  const queryClient = useQueryClient();
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");

  // Get scope config from unified source
  const { data: scopeConfig } = useAIScopeConfig("customer_chat");

  // Fetch chat configuration (for 1min.ai specific settings)
  const { data: config, isLoading } = useQuery({
    queryKey: ["chat-config"],
    queryFn: async () => {
      const { data, error } = await appClient
        .from("chat_provider_config")
        .select("*")
        .eq("provider_name", "1min.ai")
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data as ChatConfig | null;
    },
  });

  // Update config mutation
  const updateConfig = useMutation({
    mutationFn: async (updates: Partial<ChatConfig>) => {
      if (config?.id) {
        const { error } = await appClient
          .from("chat_provider_config")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await appClient
          .from("chat_provider_config")
          .insert({
            provider_name: "1min.ai",
            selected_model: updates.selected_model || "gpt-4o-mini",
            is_active: updates.is_active ?? true,
            feature_scope: ["chat", "customer-support"],
            settings: {},
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-config"] });
      toast.success("Chat settings updated");
    },
    onError: (error: any) => {
      toast.error("Failed to update settings: " + error.message);
    },
  });

  // Test connection via unified gateway
  const testConnection = async () => {
    setTestStatus("testing");
    setTestMessage("");

    try {
      const result = await callAIGateway({
        scope: "customer_chat",
        prompt: "Hello, this is a test message. Please respond briefly.",
      });

      setTestStatus("success");
      setTestMessage(`Connection successful! Using ${result.provider}/${result.model}`);
    } catch (error: any) {
      setTestStatus("error");
      setTestMessage(error.message || "Connection failed");
    }
  };

  const isActive = config?.is_active ?? true;

  if (isLoading) {
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
            <MessageCircle className="h-8 w-8 text-primary" />
            Chat Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure customer chat powered by the unified AI gateway
          </p>
        </div>
        <Badge variant={isActive ? "default" : "secondary"} className="text-sm">
          {isActive ? "Active" : "Disabled"}
        </Badge>
      </div>

      {/* Architecture Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Chat settings are now managed through the <strong>AI Configuration</strong> page. 
          Provider and model selection for customer_chat scope are configured centrally.
          This page controls chat-specific features like enable/disable and connection testing.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Main Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Chat Configuration
            </CardTitle>
            <CardDescription>
              Enable/disable chat and view current AI configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="chat-active">Enable Chat</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle chat feature across all pages
                </p>
              </div>
              <Switch
                id="chat-active"
                checked={isActive}
                onCheckedChange={(checked) => updateConfig.mutate({ is_active: checked })}
              />
            </div>

            <Separator />

            {/* Current Configuration (read from unified source) */}
            <div className="space-y-3">
              <Label>Current AI Configuration</Label>
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                {scopeConfig ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Provider</span>
                      <Badge variant="outline">{scopeConfig.provider}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Model</span>
                      <span className="font-medium">{scopeConfig.model_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={scopeConfig.is_active ? "default" : "secondary"}>
                        {scopeConfig.is_active ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No configuration found. Configure in AI Configuration page.
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                To change provider/model, go to AI Configuration → customer_chat scope
              </p>
            </div>

            <Separator />

            {/* Feature Scope */}
            <div className="space-y-2">
              <Label>Feature Scope</Label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Chat Widget
                </Badge>
                <Badge variant="secondary">
                  <Bot className="h-3 w-3 mr-1" />
                  Customer Support
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Connection Status
            </CardTitle>
            <CardDescription>
              Test the AI gateway connection for chat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Gateway Status</span>
                <AnimatePresence mode="wait">
                  {testStatus === "idle" && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-muted-foreground"
                    >
                      Not tested
                    </motion.span>
                  )}
                  {testStatus === "testing" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Testing...</span>
                    </motion.div>
                  )}
                  {testStatus === "success" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-green-600"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm">Connected</span>
                    </motion.div>
                  )}
                  {testStatus === "error" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-destructive"
                    >
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm">Failed</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {testMessage && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-sm ${
                    testStatus === "success" ? "text-green-600" : "text-destructive"
                  }`}
                >
                  {testMessage}
                </motion.p>
              )}

              <Button
                onClick={testConnection}
                disabled={testStatus === "testing"}
                className="w-full"
                variant="outline"
              >
                {testStatus === "testing" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Test Gateway Connection
                  </>
                )}
              </Button>
            </div>

            {/* Architecture Summary */}
            <div className="space-y-2">
              <Label>Architecture</Label>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p>Gateway: <span className="text-foreground">ai-orchestrator</span></p>
                <p>Proxy: <span className="text-foreground">onemin-chat → orchestrator</span></p>
                <p>Config: <span className="text-foreground">ai_model_config table</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
