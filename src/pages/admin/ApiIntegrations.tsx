import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/integrations/manus/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Copy, Plus, Trash2, Send, RefreshCw } from "lucide-react";

const MANUS_URL = "/api" as string;

const ALL_EVENTS = [
  "order.created", "order.paid", "order.status_changed", "order.shipped",
  "order.delivered", "order.cancelled", "order.refunded", "order.tracking_added",
  "customer.created", "customer.updated",
  "product.created", "product.updated", "product.low_stock", "product.out_of_stock",
  "newsletter.subscribed", "newsletter.unsubscribed",
  "directory.submitted", "directory.approved", "directory.rejected",
];

export default function ApiIntegrations() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">API & Integrations</h1>
        <p className="text-muted-foreground">External API keys and webhook subscriptions for Monday CRM, WhatsApp, Facebook Leads.</p>
      </div>
      <Tabs defaultValue="keys">
        <TabsList>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="events">Delivery Log</TabsTrigger>
          <TabsTrigger value="docs">API Docs</TabsTrigger>
        </TabsList>
        <TabsContent value="keys"><ApiKeysTab /></TabsContent>
        <TabsContent value="webhooks"><WebhooksTab /></TabsContent>
        <TabsContent value="events"><EventsTab /></TabsContent>
        <TabsContent value="docs"><DocsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function ApiKeysTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [issued, setIssued] = useState<{ api_key: string; key_prefix: string } | null>(null);

  const { data: keys, isLoading } = useQuery({
    queryKey: ["api_clients"],
    queryFn: async () => {
      const { data, error } = await appClient.from("api_clients" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const issueMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await appClient.auth.getSession();
      const res = await fetch(`${MANUS_URL}/functions/api-keys-issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ name, description, scopes: ["read", "write"] }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      return await res.json();
    },
    onSuccess: (data) => {
      setIssued(data);
      setName(""); setDescription("");
      qc.invalidateQueries({ queryKey: ["api_clients"] });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: { session } } = await appClient.auth.getSession();
      const res = await fetch(`${MANUS_URL}/functions/api-keys-issue/revoke/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error("Revoke failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api_clients"] });
      toast({ title: "Revoked" });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Issue keys for Monday CRM, scripts, and Facebook lead syncs.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setIssued(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />New API Key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{issued ? "Save your API key now" : "Issue API key"}</DialogTitle></DialogHeader>
            {issued ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">This is the only time you'll see the full key. Copy it now.</p>
                <div className="flex gap-2">
                  <Input value={issued.api_key} readOnly className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(issued.api_key); toast({ title: "Copied" }); }}><Copy className="w-4 h-4" /></Button>
                </div>
                <Button className="w-full" onClick={() => { setOpen(false); setIssued(null); }}>Done</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Monday CRM Sync" /></div>
                <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                <DialogFooter>
                  <Button onClick={() => issueMutation.mutate()} disabled={!name || issueMutation.isPending}>Issue Key</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? <p>Loading...</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Prefix</TableHead><TableHead>Scopes</TableHead><TableHead>Last used</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {(keys ?? []).map((k: any) => (
                <TableRow key={k.id}>
                  <TableCell>{k.name}</TableCell>
                  <TableCell className="font-mono text-xs">{k.key_prefix}…</TableCell>
                  <TableCell>{k.scopes?.join(", ")}</TableCell>
                  <TableCell>{k.last_used_at ? new Date(k.last_used_at).toLocaleString() : "Never"}</TableCell>
                  <TableCell><Badge variant={k.is_active ? "default" : "secondary"}>{k.is_active ? "Active" : "Revoked"}</Badge></TableCell>
                  <TableCell>{k.is_active && <Button size="sm" variant="ghost" onClick={() => revokeMutation.mutate(k.id)}><Trash2 className="w-4 h-4" /></Button>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function WebhooksTab() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", url: "", events: [] as string[] });
  const [open, setOpen] = useState(false);

  const { data: subs } = useQuery({
    queryKey: ["webhook_subscriptions"],
    queryFn: async () => {
      const { data, error } = await appClient.from("webhook_subscriptions" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const secret = Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, "0")).join("");
      const { error } = await appClient.from("webhook_subscriptions" as any).insert({ name: form.name, url: form.url, events: form.events, secret });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhook_subscriptions"] });
      setOpen(false);
      setForm({ name: "", url: "", events: [] });
      toast({ title: "Webhook created" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async (sub: any) => {
      await appClient.from("webhook_subscriptions" as any).update({ is_active: !sub.is_active }).eq("id", sub.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhook_subscriptions"] }),
  });

  const testMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await appClient.from("webhook_events" as any).insert({
        event_type: "webhook.test",
        payload: { message: "Test event", at: new Date().toISOString() },
        subscription_id: id,
      });
      if (error) throw error;
      // trigger immediate dispatch
      await fetch(`${MANUS_URL}/functions/webhook-dispatch`, { method: "POST" });
    },
    onSuccess: () => toast({ title: "Test event sent" }),
  });

  const dispatchMutation = useMutation({
    mutationFn: async () => { await fetch(`${MANUS_URL}/functions/webhook-dispatch`, { method: "POST" }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["webhook_events"] }); toast({ title: "Queue processed" }); },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Webhook Subscriptions</CardTitle>
          <CardDescription>HMAC-signed deliveries with 3 retries.</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => dispatchMutation.mutate()}><RefreshCw className="w-4 h-4 mr-2" />Process queue</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />New Webhook</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>New Webhook</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Monday CRM" /></div>
                <div><Label>URL</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." /></div>
                <div>
                  <Label>Events</Label>
                  <div className="grid grid-cols-2 gap-1 mt-2 max-h-60 overflow-auto border rounded p-2">
                    <label className="flex items-center gap-2 text-sm col-span-2 font-medium">
                      <input type="checkbox" checked={form.events.includes("*")} onChange={(e) => setForm({ ...form, events: e.target.checked ? ["*"] : [] })} />
                      All events (*)
                    </label>
                    {ALL_EVENTS.map(ev => (
                      <label key={ev} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" disabled={form.events.includes("*")} checked={form.events.includes(ev)} onChange={(e) => setForm({ ...form, events: e.target.checked ? [...form.events, ev] : form.events.filter(x => x !== ev) })} />
                        <span className="font-mono text-xs">{ev}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <DialogFooter><Button onClick={() => createMutation.mutate()} disabled={!form.name || !form.url || form.events.length === 0}>Create</Button></DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>URL</TableHead><TableHead>Events</TableHead><TableHead>Status</TableHead><TableHead>Failures</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {(subs ?? []).map((s: any) => (
              <TableRow key={s.id}>
                <TableCell>{s.name}</TableCell>
                <TableCell className="font-mono text-xs max-w-[260px] truncate">{s.url}</TableCell>
                <TableCell><Badge variant="outline">{s.events?.length} events</Badge></TableCell>
                <TableCell><Badge variant={s.is_active ? "default" : "secondary"}>{s.is_active ? "Active" : "Paused"}</Badge></TableCell>
                <TableCell>{s.failure_count ?? 0}</TableCell>
                <TableCell className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => testMutation.mutate(s.id)}><Send className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleMutation.mutate(s)}>{s.is_active ? "Pause" : "Resume"}</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function EventsTab() {
  const { data: events, refetch } = useQuery({
    queryKey: ["webhook_events"],
    queryFn: async () => {
      const { data, error } = await appClient.from("webhook_events" as any).select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div><CardTitle>Delivery Log</CardTitle><CardDescription>Last 100 webhook events. Auto-refreshes.</CardDescription></div>
        <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Event</TableHead><TableHead>Status</TableHead><TableHead>Attempts</TableHead><TableHead>HTTP</TableHead><TableHead>Error</TableHead></TableRow></TableHeader>
          <TableBody>
            {(events ?? []).map((e: any) => (
              <TableRow key={e.id}>
                <TableCell className="text-xs">{new Date(e.created_at).toLocaleString()}</TableCell>
                <TableCell><Badge variant="outline" className="font-mono text-xs">{e.event_type}</Badge></TableCell>
                <TableCell><Badge variant={e.status === "delivered" ? "default" : e.status === "dead" ? "destructive" : "secondary"}>{e.status}</Badge></TableCell>
                <TableCell>{e.attempts}/{e.max_attempts}</TableCell>
                <TableCell>{e.last_response_status ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[280px] truncate">{e.last_error}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function DocsTab() {
  const base = `${MANUS_URL}/functions/external-api`;
  return (
    <Card>
      <CardHeader><CardTitle>API Reference</CardTitle><CardDescription>All requests authenticate with <code className="text-xs bg-muted px-1 py-0.5 rounded">X-API-Key: &lt;your_key&gt;</code></CardDescription></CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="font-semibold">Base URL</p>
          <code className="block bg-muted p-2 rounded text-xs mt-1 break-all">{base}</code>
        </div>
        <Section title="Customers" rows={[
          ["GET", "/customers", "List (?search=, ?customer_type=, ?limit=, ?offset=)"],
          ["POST", "/customers", "Create"],
          ["POST", "/customers/upsert", "Create-or-update by email (Facebook leads)"],
          ["GET", "/customers/:id", "Retrieve"],
          ["PATCH", "/customers/:id", "Update"],
          ["DELETE", "/customers/:id", "Delete"],
          ["GET", "/customers/:id/orders", "Order history"],
        ]} />
        <Section title="Products" rows={[
          ["GET", "/products", "List"], ["POST", "/products", "Create"],
          ["GET", "/products/:id", "Retrieve"], ["PATCH", "/products/:id", "Update"],
          ["PATCH", "/products/:id/stock", "Update stock {stock_quantity}"],
          ["PATCH", "/products/:id/price", "Update price {price_zar}"],
          ["DELETE", "/products/:id", "Delete"],
        ]} />
        <Section title="Orders" rows={[
          ["GET", "/orders", "List (?status=, ?payment_status=)"],
          ["POST", "/orders", "Create with items[]"],
          ["GET", "/orders/stats", "Aggregate stats"],
          ["GET", "/orders/:id", "Retrieve"],
          ["GET", "/orders/:id/items", "Line items"],
          ["PATCH", "/orders/:id/status", "Change status"],
          ["PATCH", "/orders/:id/tracking", "Add tracking {tracking_number, courier, tracking_url}"],
        ]} />
        <Section title="Blog" rows={[
          ["GET", "/blog", "List"], ["POST", "/blog", "Create"],
          ["PATCH", "/blog/:id", "Update"],
          ["POST", "/blog/:id/publish", "Publish"], ["POST", "/blog/:id/unpublish", "Unpublish"],
        ]} />
        <Section title="Newsletter" rows={[
          ["GET", "/newsletter", "List subscribers"],
          ["POST", "/newsletter", "Add subscriber"],
          ["POST", "/newsletter/:id/unsubscribe", "Unsubscribe"],
        ]} />
        <Section title="Directory" rows={[
          ["GET", "/directory", "List"], ["POST", "/directory", "Submit listing"],
          ["POST", "/directory/:id/approve", "Approve"], ["POST", "/directory/:id/reject", "Reject {reason}"],
        ]} />
        <Section title="Webhooks" rows={[
          ["GET", "/webhooks", "List subscriptions"], ["POST", "/webhooks", "Create"],
          ["DELETE", "/webhooks/:id", "Delete"],
          ["POST", "/webhooks/:id/test", "Send test event"],
          ["GET", "/webhooks/events", "Recent delivery log"],
        ]} />
        <Section title="Public (no auth)" rows={[
          ["GET", "/public/products", "Frontend catalog"],
          ["GET", "/public/categories", "Categories"],
          ["GET", "/public/blog", "Published posts"],
          ["GET", "/public/directory", "Approved listings"],
          ["POST", "/public/newsletter", "Visitor subscribe"],
          ["POST", "/public/directory", "Visitor submit listing"],
          ["POST", "/public/enquiries", "Contact form"],
        ]} />
        <div className="border-t pt-4">
          <p className="font-semibold mb-2">Webhook signature verification</p>
          <pre className="bg-muted p-3 rounded text-xs overflow-auto">{`// Each delivery includes:
//   X-Webhook-Signature: sha256=<hex>
//   X-Webhook-Event:     order.paid
//   X-Webhook-Id:        <uuid>
const expected = hmacSha256Hex(SUBSCRIPTION_SECRET, rawBody);
if (\`sha256=\${expected}\` !== headers['x-webhook-signature']) reject();`}</pre>
        </div>
      </CardContent>
    </Card>
  );
}

function Section({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div>
      <p className="font-semibold mb-1">{title}</p>
      <Table>
        <TableBody>
          {rows.map(([method, path, desc]) => (
            <TableRow key={method + path}>
              <TableCell className="w-16"><Badge variant="outline" className="font-mono text-[10px]">{method}</Badge></TableCell>
              <TableCell className="font-mono text-xs">{path}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{desc}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
