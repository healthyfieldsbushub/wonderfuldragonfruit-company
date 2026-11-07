import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Loader2,
  FileCode,
  Database,
  Lock,
  Zap,
  Bug,
  Code,
  RefreshCw,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { callAIGateway, useAIScopeConfig } from "@/hooks/use-ai-config";

interface AuditResult {
  success: boolean;
  content: string;
  model: string;
  provider: string;
}

interface ParsedFinding {
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  category: string;
  title: string;
  description: string;
  recommendation?: string;
}

const severityConfig = {
  CRITICAL: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30" },
  HIGH: { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  MEDIUM: { icon: Info, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  LOW: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  INFO: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/30" },
};

const auditTemplates = [
  {
    id: "payment",
    label: "Payment Gateway Audit",
    icon: Lock,
    prompt: `Audit the payment integration code for security issues. Check for signature verification bypass, amount manipulation, race conditions, and credential exposure.`,
  },
  {
    id: "auth",
    label: "Authentication Audit",
    icon: Shield,
    prompt: `Audit the authentication system for vulnerabilities. Check for session fixation, role escalation, JWT validation issues, and RLS policy bypasses.`,
  },
  {
    id: "database",
    label: "Database Security Audit",
    icon: Database,
    prompt: `Audit database security and RLS policies. Check for unauthorized access, SQL injection risks, and data exposure in API responses.`,
  },
  {
    id: "api",
    label: "API Security Audit",
    icon: Zap,
    prompt: `Audit edge functions and API endpoints. Check for input validation, rate limiting, CORS configuration, and webhook signature verification.`,
  },
  {
    id: "frontend",
    label: "Frontend Security Audit",
    icon: Code,
    prompt: `Audit React frontend for security issues. Check for XSS vulnerabilities, CSRF protection, and sensitive data exposure.`,
  },
  {
    id: "full",
    label: "Full Stack Audit",
    icon: Bug,
    prompt: `Perform a comprehensive fullstack security audit covering authentication, payments, database, APIs, frontend, and configuration security.`,
  },
];

export default function CodeAudit() {
  const [customPrompt, setCustomPrompt] = useState("");
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [expandedFindings, setExpandedFindings] = useState<Set<number>>(new Set());
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  // Get current config for display
  const { data: scopeConfig } = useAIScopeConfig("security_audit");

  const auditMutation = useMutation({
    mutationFn: async (prompt: string): Promise<AuditResult> => {
      // Route through unified gateway
      return callAIGateway({
        scope: "security_audit",
        prompt,
      });
    },
    onSuccess: (data) => {
      setAuditResult(data);
      toast.success("Audit completed", {
        description: `${data.provider}/${data.model}`,
      });
    },
    onError: (error: Error) => {
      toast.error("Audit failed", { description: error.message });
    },
  });

  const runAudit = (templateId: string) => {
    const template = auditTemplates.find((t) => t.id === templateId);
    if (template) {
      setActiveTemplate(templateId);
      auditMutation.mutate(template.prompt);
    }
  };

  const runCustomAudit = () => {
    if (!customPrompt.trim()) {
      toast.error("Please enter code or context to audit");
      return;
    }
    setActiveTemplate(null);
    auditMutation.mutate(customPrompt);
  };

  const parseFindings = (content: string): ParsedFinding[] => {
    const findings: ParsedFinding[] = [];
    const lines = content.split("\n");

    let currentFinding: Partial<ParsedFinding> | null = null;

    for (const line of lines) {
      const severityMatch = line.match(/\*?\*?(CRITICAL|HIGH|MEDIUM|LOW|INFO)\*?\*?:?\s*(.+)?/i);
      if (severityMatch) {
        if (currentFinding?.severity && currentFinding?.title) {
          findings.push(currentFinding as ParsedFinding);
        }
        currentFinding = {
          severity: severityMatch[1].toUpperCase() as ParsedFinding["severity"],
          title: severityMatch[2]?.trim() || "",
          category: "General",
          description: "",
        };
        continue;
      }

      if (currentFinding && line.trim()) {
        currentFinding.description += line.trim() + " ";
      }
    }

    if (currentFinding?.severity && currentFinding?.title) {
      findings.push(currentFinding as ParsedFinding);
    }

    return findings;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const toggleFinding = (index: number) => {
    const newExpanded = new Set(expandedFindings);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedFindings(newExpanded);
  };

  const findings = auditResult?.content ? parseFindings(auditResult.content) : [];
  const criticalCount = findings.filter((f) => f.severity === "CRITICAL").length;
  const highCount = findings.filter((f) => f.severity === "HIGH").length;
  const mediumCount = findings.filter((f) => f.severity === "MEDIUM").length;
  const lowCount = findings.filter((f) => f.severity === "LOW" || f.severity === "INFO").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Code Security Audit
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered security analysis via unified gateway
          </p>
        </div>
        {scopeConfig && (
          <Badge variant="outline" className="self-start md:self-auto">
            {scopeConfig.provider}/{scopeConfig.model_name}
          </Badge>
        )}
      </div>

      {/* Audit Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Quick Audit Templates
          </CardTitle>
          <CardDescription>
            Run pre-configured security audits on specific areas of the codebase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {auditTemplates.map((template) => (
              <Button
                key={template.id}
                variant={activeTemplate === template.id ? "default" : "outline"}
                className="h-auto py-4 flex-col gap-2"
                onClick={() => runAudit(template.id)}
                disabled={auditMutation.isPending}
              >
                <template.icon className="h-5 w-5" />
                <span className="text-xs text-center">{template.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Audit */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Code Audit</CardTitle>
          <CardDescription>
            Paste code snippets or describe specific areas to audit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste code here or describe the security concern you want to analyze..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="min-h-[150px] font-mono text-sm"
          />
          <div className="flex gap-2">
            <Button onClick={runCustomAudit} disabled={auditMutation.isPending}>
              {auditMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Run Audit
                </>
              )}
            </Button>
            {auditResult && (
              <Button variant="outline" onClick={() => setAuditResult(null)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Results
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      <AnimatePresence>
        {auditMutation.isPending && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-primary/30">
              <CardContent className="py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                    <Shield className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Running Security Analysis...</p>
                    <p className="text-sm text-muted-foreground">
                      Analyzing code via AI orchestrator
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {auditResult && !auditMutation.isPending && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className={cn("border-red-500/30", criticalCount > 0 && "bg-red-500/5")}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Critical</p>
                      <p className="text-2xl font-bold text-red-500">{criticalCount}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className={cn("border-orange-500/30", highCount > 0 && "bg-orange-500/5")}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">High</p>
                      <p className="text-2xl font-bold text-orange-500">{highCount}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-orange-500/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className={cn("border-yellow-500/30", mediumCount > 0 && "bg-yellow-500/5")}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Medium</p>
                      <p className="text-2xl font-bold text-yellow-500">{mediumCount}</p>
                    </div>
                    <Info className="h-8 w-8 text-yellow-500/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-green-500/30">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Low/Info</p>
                      <p className="text-2xl font-bold text-green-500">{lowCount}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Results */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Audit Results</CardTitle>
                  <CardDescription>
                    {findings.length} findings detected
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(auditResult.content)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Report
                </Button>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="findings">
                  <TabsList className="mb-4">
                    <TabsTrigger value="findings">Findings</TabsTrigger>
                    <TabsTrigger value="raw">Raw Output</TabsTrigger>
                  </TabsList>

                  <TabsContent value="findings">
                    {findings.length > 0 ? (
                      <div className="space-y-3">
                        {findings.map((finding, index) => {
                          const config = severityConfig[finding.severity];
                          const Icon = config.icon;
                          const isExpanded = expandedFindings.has(index);

                          return (
                            <div
                              key={index}
                              className={`p-4 rounded-lg border ${config.bg} ${config.border}`}
                            >
                              <button
                                onClick={() => toggleFinding(index)}
                                className="w-full flex items-center justify-between text-left"
                              >
                                <div className="flex items-center gap-3">
                                  <Icon className={`h-5 w-5 ${config.color}`} />
                                  <div>
                                    <Badge variant="outline" className={config.color}>
                                      {finding.severity}
                                    </Badge>
                                    <span className="ml-2 font-medium">{finding.title}</span>
                                  </div>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>
                              {isExpanded && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  className="mt-3 pt-3 border-t border-border/50"
                                >
                                  <p className="text-sm text-muted-foreground">{finding.description}</p>
                                </motion.div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        No structured findings detected. Check raw output.
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="raw">
                    <ScrollArea className="h-[400px]">
                      <pre className="p-4 rounded-lg bg-muted text-sm whitespace-pre-wrap">
                        {auditResult.content}
                      </pre>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
