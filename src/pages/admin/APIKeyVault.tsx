import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/integrations/manus/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Plus, Key, Eye, EyeOff, Trash2, Edit, Copy, 
  Facebook, Instagram, MessageCircle, Loader2, Search,
  Shield, RefreshCw, Zap, Bot, Cloud, Database, Info
} from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface APIKey {
  id: string;
  key_name: string;
  key_value: string;
  service_type: string;
  description: string | null;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

interface KeyForm {
  key_name: string;
  key_value: string;
  service_type: string;
  description: string;
}

const emptyForm: KeyForm = {
  key_name: "",
  key_value: "",
  service_type: "whatsapp",
  description: "",
};

// Service types organized by category
const SERVICE_TYPES = [
  // AI Providers (referenced by AI Configuration Layer)
  { value: "ai_provider", label: "AI Provider", icon: Bot, color: "bg-purple-500" },
  { value: "openrouter", label: "OpenRouter", icon: Zap, color: "bg-orange-500" },
  { value: "1min_ai", label: "1min.AI", icon: Bot, color: "bg-indigo-500" },
  // Social & Communication
  { value: "whatsapp", label: "WhatsApp Business", icon: MessageCircle, color: "bg-green-500" },
  { value: "facebook", label: "Facebook Page", icon: Facebook, color: "bg-blue-600" },
  { value: "instagram", label: "Instagram Page", icon: Instagram, color: "bg-gradient-to-r from-purple-500 to-pink-500" },
  { value: "meta_api", label: "Meta API Token", icon: Shield, color: "bg-blue-500" },
  // Payment & Services
  { value: "payment", label: "Payment Gateway", icon: Shield, color: "bg-emerald-500" },
  { value: "storage", label: "Storage/CDN", icon: Cloud, color: "bg-cyan-500" },
  { value: "database", label: "Database", icon: Database, color: "bg-amber-500" },
  { value: "other", label: "Other Service", icon: Key, color: "bg-gray-500" },
];

export default function APIKeyVault() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterService, setFilterService] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<APIKey | null>(null);
  const [form, setForm] = useState<KeyForm>(emptyForm);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  // Fetch all API keys
  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async (): Promise<APIKey[]> => {
      const { data, error } = await appClient
        .from("api_keys_vault")
        .select("*")
        .order("service_type", { ascending: true })
        .order("key_name", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: KeyForm) => {
      if (editingKey) {
        const { error } = await appClient
          .from("api_keys_vault")
          .update({
            key_name: data.key_name,
            key_value: data.key_value,
            service_type: data.service_type,
            description: data.description || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingKey.id);
        if (error) throw error;
      } else {
        const { error } = await appClient
          .from("api_keys_vault")
          .insert({
            key_name: data.key_name,
            key_value: data.key_value,
            service_type: data.service_type,
            description: data.description || null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success(editingKey ? "API key updated" : "API key added");
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingKey(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save API key");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await appClient
        .from("api_keys_vault")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API key deleted");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete API key");
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await appClient
        .from("api_keys_vault")
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });

  const handleEdit = (key: APIKey) => {
    setEditingKey(key);
    setForm({
      key_name: key.key_name,
      key_value: key.key_value,
      service_type: key.service_type,
      description: key.description || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.key_name || !form.key_value) {
      toast.error("Please fill in all required fields");
      return;
    }
    saveMutation.mutate(form);
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  };

  const maskValue = (value: string) => {
    if (value.length <= 20) return "•".repeat(value.length);
    return value.substring(0, 10) + "•".repeat(20) + value.substring(value.length - 10);
  };

  // Filter keys
  const filteredKeys = apiKeys.filter((key) => {
    const matchesSearch =
      key.key_name.toLowerCase().includes(search.toLowerCase()) ||
      (key.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesService = filterService === "all" || key.service_type === filterService;
    return matchesSearch && matchesService;
  });

  // Group keys by service type
  const groupedKeys = filteredKeys.reduce((acc, key) => {
    if (!acc[key.service_type]) acc[key.service_type] = [];
    acc[key.service_type].push(key);
    return acc;
  }, {} as Record<string, APIKey[]>);

  const getServiceConfig = (type: string) => {
    return SERVICE_TYPES.find((s) => s.value === type) || SERVICE_TYPES[SERVICE_TYPES.length - 1]; // Default to "other"
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Key className="h-8 w-8 text-primary" />
            API Key Vault
          </h1>
          <p className="text-muted-foreground">
            Secure storage for API credentials and service tokens
          </p>
        </div>

      {/* Architecture Layer Info */}
      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Architecture Layer 1:</strong> This vault stores API keys securely. Keys are referenced by the{" "}
          <strong>AI Configuration</strong> layer (Layer 2) and consumed by feature pages (Layer 3). No AI logic
          or model selection occurs here.
        </AlertDescription>
      </Alert>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="btn-sunset"
              onClick={() => {
                setEditingKey(null);
                setForm(emptyForm);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingKey ? "Edit API Key" : "Add New API Key"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Service Type *</Label>
                <Select
                  value={form.service_type}
                  onValueChange={(value) => setForm({ ...form, service_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Key Name / Page Name *</Label>
                <Input
                  value={form.key_name}
                  onChange={(e) => setForm({ ...form, key_name: e.target.value })}
                  placeholder="e.g., Wonderful Dragon Fruit South Africa"
                />
              </div>

              <div className="space-y-2">
                <Label>API Key / Access Token *</Label>
                <Textarea
                  value={form.key_value}
                  onChange={(e) => setForm({ ...form, key_value: e.target.value })}
                  placeholder="Paste your API key or access token here"
                  rows={3}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label>Description / Page ID</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g., Page ID: 123456789"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingKey ? "Update" : "Add"} Key
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search keys..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterService} onValueChange={setFilterService}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {SERVICE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {SERVICE_TYPES.map((service) => {
          const count = apiKeys.filter((k) => k.service_type === service.value).length;
          const ServiceIcon = service.icon;
          return (
            <Card key={service.value} className="glass-card">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${service.color}`}>
                    <ServiceIcon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{service.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Keys by service */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Keys ({filteredKeys.length})</TabsTrigger>
            {Object.entries(groupedKeys).map(([type, keys]) => {
              const config = getServiceConfig(type);
              return (
                <TabsTrigger key={type} value={type}>
                  <config.icon className="h-3 w-3 mr-1" />
                  {config.label} ({keys.length})
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {Object.entries(groupedKeys).map(([type, keys]) => {
              const config = getServiceConfig(type);
              const ServiceIcon = config.icon;
              return (
                <Card key={type} className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className={`p-1.5 rounded ${config.color}`}>
                        <ServiceIcon className="h-4 w-4 text-white" />
                      </div>
                      {config.label}
                      <Badge variant="secondary">{keys.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Token/Key</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {keys.map((key) => (
                            <TableRow key={key.id}>
                              <TableCell className="font-medium">{key.key_name}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <code className="text-xs bg-muted px-2 py-1 rounded max-w-[200px] truncate">
                                    {visibleKeys.has(key.id) ? key.key_value : maskValue(key.key_value)}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => toggleKeyVisibility(key.id)}
                                  >
                                    {visibleKeys.has(key.id) ? (
                                      <EyeOff className="h-3 w-3" />
                                    ) : (
                                      <Eye className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => copyToClipboard(key.key_value)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {key.description || "-"}
                              </TableCell>
                              <TableCell>
                                <Switch
                                  checked={key.is_active ?? true}
                                  onCheckedChange={(checked) =>
                                    toggleActiveMutation.mutate({ id: key.id, is_active: checked })
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(key)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                    onClick={() => {
                                      if (confirm("Delete this API key?")) {
                                        deleteMutation.mutate(key.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredKeys.length === 0 && (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No API Keys Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first API key to get started
                  </p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add API Key
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {Object.entries(groupedKeys).map(([type, keys]) => (
            <TabsContent key={type} value={type}>
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Token/Key</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {keys.map((key) => (
                          <TableRow key={key.id}>
                            <TableCell className="font-medium">{key.key_name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-muted px-2 py-1 rounded max-w-[200px] truncate">
                                  {visibleKeys.has(key.id) ? key.key_value : maskValue(key.key_value)}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => toggleKeyVisibility(key.id)}
                                >
                                  {visibleKeys.has(key.id) ? (
                                    <EyeOff className="h-3 w-3" />
                                  ) : (
                                    <Eye className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(key.key_value)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {key.description || "-"}
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={key.is_active ?? true}
                                onCheckedChange={(checked) =>
                                  toggleActiveMutation.mutate({ id: key.id, is_active: checked })
                                }
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(key)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive"
                                  onClick={() => {
                                    if (confirm("Delete this API key?")) {
                                      deleteMutation.mutate(key.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
