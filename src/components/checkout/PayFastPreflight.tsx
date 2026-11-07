import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { 
  Bug, 
  ChevronDown, 
  Copy, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2,
  Eye,
  EyeOff,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MANUS_URL = "/api";

interface PayFastPreflightProps {
  orderId: string;
  amount: number;
  itemName: string;
  customerEmail: string;
  customerName: string;
  returnUrl: string;
  cancelUrl: string;
}

interface PreflightData {
  success: boolean;
  actionUrl?: string;
  formFields?: Record<string, string>;
  signatureInput?: string;
  error?: string;
}

export function PayFastPreflight({
  orderId,
  amount,
  itemName,
  customerEmail,
  customerName,
  returnUrl,
  cancelUrl,
}: PayFastPreflightProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preflightData, setPreflightData] = useState<PreflightData | null>(null);
  const [showSignature, setShowSignature] = useState(false);

  const fetchPreflight = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${MANUS_URL}/functions/payfast-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Preflight": "true", // Signal preflight mode
        },
        body: JSON.stringify({
          orderId,
          amount,
          itemName,
          customerEmail,
          customerName,
          returnUrl,
          cancelUrl,
          preflight: true, // Also in body for compatibility
        }),
      });

      const data = await response.json();
      setPreflightData(data);
      
      if (data.success) {
        toast.success("Preflight check completed");
      } else {
        toast.error(data.error || "Preflight check failed");
      }
    } catch (error: any) {
      setPreflightData({ success: false, error: error.message });
      toast.error("Failed to run preflight check");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const redactValue = (key: string, value: string): string => {
    const sensitiveKeys = ["merchant_key", "passphrase", "signature"];
    if (sensitiveKeys.includes(key)) {
      return showSignature ? value : `${value.slice(0, 4)}...${value.slice(-4)}`;
    }
    return value;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4">
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-between text-muted-foreground hover:text-foreground"
        >
          <span className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            PayFast Debug (Preflight)
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <Card className="mt-3 border-dashed border-amber-500/50 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                PayFast Preflight Diagnostics
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSignature(!showSignature)}
                  className="h-7 px-2 text-xs"
                >
                  {showSignature ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                  {showSignature ? "Hide" : "Show"} Secrets
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchPreflight}
                  disabled={loading}
                  className="h-7 px-2 text-xs"
                >
                  {loading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Run Check
                    </>
                  )}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {/* Input Parameters */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Input Parameters</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/50 rounded p-2">
                  <span className="text-muted-foreground">Order ID:</span>
                  <p className="font-mono truncate">{orderId}</p>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <span className="text-muted-foreground">Amount:</span>
                  <p className="font-mono">R {amount.toFixed(2)}</p>
                </div>
                <div className="bg-muted/50 rounded p-2 col-span-2">
                  <span className="text-muted-foreground">Item:</span>
                  <p className="font-mono truncate">{itemName}</p>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <span className="text-muted-foreground">Customer:</span>
                  <p className="font-mono truncate">{customerName}</p>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-mono truncate">{customerEmail}</p>
                </div>
              </div>
            </div>

            {/* Preflight Results */}
            <AnimatePresence mode="wait">
              {preflightData && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  {/* Status */}
                  <div className="flex items-center gap-2">
                    {preflightData.success ? (
                      <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Preflight OK
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Error: {preflightData.error}
                      </Badge>
                    )}
                  </div>

                  {/* Form Fields */}
                  {preflightData.formFields && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-medium text-muted-foreground">Form Fields (POST to PayFast)</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(
                            JSON.stringify(preflightData.formFields, null, 2),
                            "Form fields"
                          )}
                          className="h-6 px-2 text-xs"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <ScrollArea className="h-48 rounded border bg-muted/30 p-2">
                        <div className="space-y-1">
                          {Object.entries(preflightData.formFields).map(([key, value]) => (
                            <div 
                              key={key} 
                              className="flex items-start gap-2 text-xs font-mono py-1 border-b border-border/50 last:border-0"
                            >
                              <span className="text-primary font-semibold min-w-[120px]">{key}:</span>
                              <span className="text-muted-foreground break-all">
                                {redactValue(key, value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Signature Input String */}
                  {preflightData.signatureInput && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-medium text-muted-foreground">Signature Input String</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(preflightData.signatureInput!, "Signature input")}
                          className="h-6 px-2 text-xs"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <ScrollArea className="h-24 rounded border bg-muted/30 p-2">
                        <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all">
                          {showSignature 
                            ? preflightData.signatureInput 
                            : preflightData.signatureInput.replace(/merchant_key=[^&]+/, "merchant_key=[REDACTED]")
                              .replace(/passphrase=[^&]+/, "passphrase=[REDACTED]")
                          }
                        </pre>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Action URL */}
                  {preflightData.actionUrl && (
                    <div className="bg-muted/50 rounded p-2 text-xs">
                      <span className="text-muted-foreground">Action URL:</span>
                      <p className="font-mono text-primary">{preflightData.actionUrl}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {!preflightData && !loading && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Click "Run Check" to generate PayFast form data without submitting payment
              </p>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
