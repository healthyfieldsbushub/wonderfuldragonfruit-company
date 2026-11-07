import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Webhook,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Copy,
  ChevronDown,
  AlertTriangle,
  Loader2,
  CreditCard,
  FileText,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { appClient } from "@/integrations/manus/client";
import { cn } from "@/lib/utils";

const MANUS_URL = "/api";

interface WebhookLog {
  id: string;
  provider: "payfast";
  event: string;
  status: "success" | "error" | "pending";
  request: Record<string, unknown>;
  response: string;
  timestamp: Date;
}

const payfastStatuses = [
  { value: "COMPLETE", label: "Payment Complete", color: "text-green-500" },
  { value: "FAILED", label: "Payment Failed", color: "text-red-500" },
  { value: "PENDING", label: "Payment Pending", color: "text-yellow-500" },
  { value: "CANCELLED", label: "Payment Cancelled", color: "text-gray-500" },
];

export default function WebhookTester() {
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [payfastStatus, setPayfastStatus] = useState("COMPLETE");
  const [customPayload, setCustomPayload] = useState("");
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  // Fetch recent orders for testing
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["test-orders"],
    queryFn: async () => {
      const { data, error } = await appClient
        .from("orders")
        .select("id, order_number, total_zar, payment_status, status, guest_email, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  // PayFast ITN simulation
  const payfastMutation = useMutation({
    mutationFn: async (payload: Record<string, string>) => {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await fetch(`${MANUS_URL}/functions/payfast-itn`, {
        method: "POST",
        body: formData,
      });

      const text = await response.text();
      return { status: response.status, body: text, ok: response.ok };
    },
    onSuccess: (result, variables) => {
      const log: WebhookLog = {
        id: crypto.randomUUID(),
        provider: "payfast",
        event: variables.payment_status,
        status: result.ok ? "success" : "error",
        request: variables,
        response: result.body,
        timestamp: new Date(),
      };
      setWebhookLogs((prev) => [log, ...prev]);
      toast.success("PayFast ITN sent", {
        description: `Response: ${result.body}`,
      });
    },
    onError: (error: Error) => {
      toast.error("PayFast ITN failed", { description: error.message });
    },
  });

  const sendPayfastITN = () => {
    if (!selectedOrderId) {
      toast.error("Please select an order");
      return;
    }

    const order = orders?.find((o) => o.id === selectedOrderId);
    if (!order) return;

    const payload: Record<string, string> = {
      m_payment_id: order.id,
      pf_payment_id: `PF_TEST_${Date.now()}`,
      payment_status: payfastStatus,
      amount_gross: order.total_zar?.toString() || "0",
      amount_fee: "0",
      amount_net: order.total_zar?.toString() || "0",
      name_first: "Test",
      name_last: "Customer",
      email_address: order.guest_email || "test@example.com",
      merchant_id: "11071120",
      item_name: `Order ${order.order_number}`,
      item_description: "Test webhook",
      custom_int1: "",
      custom_str1: "",
      signature: "test_signature_for_debugging",
    };

    payfastMutation.mutate(payload);
  };

  const sendCustomWebhook = () => {
    if (!customPayload.trim()) {
      toast.error("Please enter a custom payload");
      return;
    }

    try {
      const payload = JSON.parse(customPayload);
      const formPayload: Record<string, string> = {};
      Object.entries(payload).forEach(([key, value]) => {
        formPayload[key] = String(value);
      });
      payfastMutation.mutate(formPayload);
    } catch {
      toast.error("Invalid JSON payload");
    }
  };

  const copyPayload = (payload: Record<string, unknown>) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    toast.success("Payload copied to clipboard");
  };

  const toggleLog = (id: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedLogs(newExpanded);
  };

  const getStatusIcon = (status: WebhookLog["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Webhook className="h-8 w-8 text-primary" />
            Webhook Tester
          </h1>
          <p className="text-muted-foreground mt-1">
            Simulate PayFast ITN callbacks for debugging
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Test Mode Only
          </Badge>
        </div>
      </div>

      {/* Order Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Select Test Order
          </CardTitle>
          <CardDescription>
            Choose an order to simulate webhook callbacks for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Order</Label>
                <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an order..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ordersLoading ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Loading orders...
                      </div>
                    ) : orders?.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No orders found
                      </div>
                    ) : (
                      orders?.map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs">{order.order_number}</span>
                            <Badge
                              variant={order.payment_status === "paid" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {order.payment_status}
                            </Badge>
                            <span className="text-muted-foreground">
                              R{order.total_zar?.toFixed(2)}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedOrderId && (
                <div className="space-y-2">
                  <Label>Selected Order Details</Label>
                  <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                    {(() => {
                      const order = orders?.find((o) => o.id === selectedOrderId);
                      if (!order) return null;
                      return (
                        <>
                          <p>
                            <strong>Order:</strong> {order.order_number}
                          </p>
                          <p>
                            <strong>Amount:</strong> R{order.total_zar?.toFixed(2)}
                          </p>
                          <p>
                            <strong>Status:</strong> {order.status} / {order.payment_status}
                          </p>
                          <p>
                            <strong>Email:</strong> {order.guest_email || "N/A"}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Testers */}
      <Tabs defaultValue="payfast" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payfast" className="gap-2">
            <CreditCard className="h-4 w-4" />
            PayFast ITN
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-2">
            <FileText className="h-4 w-4" />
            Custom Payload
          </TabsTrigger>
        </TabsList>

        {/* PayFast Tab */}
        <TabsContent value="payfast">
          <Card>
            <CardHeader>
              <CardTitle>PayFast ITN Simulator</CardTitle>
              <CardDescription>
                Simulate Instant Transaction Notification (ITN) callbacks from PayFast
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Payment Status</Label>
                <Select value={payfastStatus} onValueChange={setPayfastStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {payfastStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <span className={status.color}>{status.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm font-medium">ITN Payload Preview:</p>
                <pre className="text-xs font-mono overflow-x-auto">
                  {JSON.stringify(
                    {
                      m_payment_id: selectedOrderId || "[order_id]",
                      pf_payment_id: "PF_TEST_xxx",
                      payment_status: payfastStatus,
                      amount_gross: orders?.find((o) => o.id === selectedOrderId)?.total_zar || 0,
                      merchant_id: "11071120",
                    },
                    null,
                    2
                  )}
                </pre>
              </div>

              <Button
                onClick={sendPayfastITN}
                disabled={!selectedOrderId || payfastMutation.isPending}
                className="w-full"
              >
                {payfastMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending ITN...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send PayFast ITN
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Tab */}
        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle>Custom Webhook Payload</CardTitle>
              <CardDescription>
                Send custom JSON payloads to test edge cases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>JSON Payload</Label>
                <Textarea
                  placeholder='{"m_payment_id": "xxx", "payment_status": "COMPLETE", ...}'
                  value={customPayload}
                  onChange={(e) => setCustomPayload(e.target.value)}
                  className="font-mono text-sm min-h-[200px]"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={sendCustomWebhook}
                  disabled={payfastMutation.isPending}
                  variant="outline"
                  className="flex-1"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send to PayFast ITN
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Webhook Logs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Webhook Logs
            </CardTitle>
            <CardDescription>Recent webhook test results</CardDescription>
          </div>
          {webhookLogs.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setWebhookLogs([])}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear Logs
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {webhookLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No webhook tests yet. Send a test webhook to see results here.</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                <AnimatePresence>
                  {webhookLogs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <Collapsible
                        open={expandedLogs.has(log.id)}
                        onOpenChange={() => toggleLog(log.id)}
                      >
                        <Card
                          className={cn(
                            "transition-all",
                            log.status === "success" && "border-green-500/30",
                            log.status === "error" && "border-red-500/30"
                          )}
                        >
                          <CollapsibleTrigger asChild>
                            <CardContent className="py-3 cursor-pointer hover:bg-muted/50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {getStatusIcon(log.status)}
                                  <Badge variant="outline" className="uppercase text-xs">
                                    {log.provider}
                                  </Badge>
                                  <span className="font-medium">{log.event}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {log.timestamp.toLocaleTimeString()}
                                  </span>
                                  <ChevronDown
                                    className={cn(
                                      "h-4 w-4 transition-transform",
                                      expandedLogs.has(log.id) && "rotate-180"
                                    )}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="px-4 pb-4 space-y-3">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium">Request Payload:</p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyPayload(log.request)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <pre className="text-xs font-mono bg-muted/50 p-3 rounded-lg overflow-x-auto">
                                  {JSON.stringify(log.request, null, 2)}
                                </pre>
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Response:</p>
                                <pre
                                  className={cn(
                                    "text-xs font-mono p-3 rounded-lg",
                                    log.status === "success"
                                      ? "bg-green-500/10"
                                      : "bg-red-500/10"
                                  )}
                                >
                                  {log.response}
                                </pre>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
