import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, AlertTriangle, Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { appClient } from "@/integrations/manus/client";

interface CheckResult {
  url: string;
  type: string;
  status: number | null;
  ok: boolean;
  issues: string[];
  warnings: string[];
  title?: string;
  description?: string;
  h1Count?: number;
  hasOG?: boolean;
  hasCanonical?: boolean;
  canonicalUrl?: string;
  canonicalMatches?: boolean;
  robotsMeta?: string;
  xRobotsTag?: string;
  indexable?: boolean;
  noindexReason?: string;
  responseTime?: number;
  renderedUsed?: boolean;
  finalUrl?: string;
  redirected?: boolean;
}

interface ValidationResponse {
  success: boolean;
  baseUrl: string;
  summary: {
    total: number;
    ok: number;
    withIssues: number;
    withWarnings: number;
    broken: number;
    notFound: number;
    nonIndexable: number;
    redirected: number;
    missingCanonical: number;
  };
  infra: any;
  results: CheckResult[];
}

const SCOPES = [
  { id: "all", label: "All" },
  { id: "static", label: "Static" },
  { id: "categories", label: "Categories" },
  { id: "products", label: "Products" },
  { id: "blog", label: "Blog" },
  { id: "pages", label: "Pages" },
];

export default function SEOValidator() {
  const [baseUrl, setBaseUrl] = useState("https://www.wonderfuldragonfruit.company");
  const [scope, setScope] = useState("all");
  const [filter, setFilter] = useState<"all" | "issues" | "warnings" | "broken" | "404" | "noindex" | "redirected" | "missing-canonical">("all");
  const [loading, setLoading] = useState(false);
  const [rendered, setRendered] = useState(true);
  const [data, setData] = useState<ValidationResponse | null>(null);

  const runScan = async () => {
    setLoading(true);
    setData(null);
    try {
      const { data: res, error } = await appClient.functions.invoke("seo-validator", {
        body: { baseUrl, scope, rendered },
      });
      if (error) throw error;
      setData(res);
      toast.success(`Scanned ${res.summary.total} URLs`);
    } catch (e: any) {
      toast.error(e.message || "Scan failed");
    } finally {
      setLoading(false);
    }
  };

  const filtered = data?.results.filter(r => {
    if (filter === "issues") return r.issues.length > 0;
    if (filter === "warnings") return r.warnings.length > 0;
    if (filter === "broken") return !r.status || r.status >= 400;
    if (filter === "404") return r.status === 404;
    if (filter === "noindex") return r.indexable === false;
    if (filter === "redirected") return r.redirected === true;
    if (filter === "missing-canonical") return r.hasCanonical === false;
    return true;
  }) || [];

  const StatusIcon = ({ r }: { r: CheckResult }) => {
    if (!r.status || r.status >= 400) return <XCircle className="h-4 w-4 text-destructive" />;
    if (r.issues.length > 0) return <XCircle className="h-4 w-4 text-destructive" />;
    if (r.warnings.length > 0) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SEO Validator</h1>
        <p className="text-muted-foreground">Live validation of sitemap, robots.txt and metadata across all pages.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Run Scan</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <Input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="https://..." className="flex-1" />
            <div className="flex gap-2 flex-wrap">
              {SCOPES.map(s => (
                <Button key={s.id} variant={scope === s.id ? "default" : "outline"} size="sm" onClick={() => setScope(s.id)}>
                  {s.label}
                </Button>
              ))}
            </div>
            <Button onClick={runScan} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Scan
            </Button>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={rendered}
              onChange={e => setRendered(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            Headless render mode (recommended for SPA — fetches client-rendered HTML when static shell is empty)
          </label>
        </CardContent>
      </Card>

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-9 gap-3">
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{data.summary.total}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Healthy</p><p className="text-2xl font-bold text-green-600">{data.summary.ok}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Issues</p><p className="text-2xl font-bold text-destructive">{data.summary.withIssues}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Warnings</p><p className="text-2xl font-bold text-yellow-600">{data.summary.withWarnings}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Broken</p><p className="text-2xl font-bold text-destructive">{data.summary.broken}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">404s</p><p className="text-2xl font-bold text-destructive">{data.summary.notFound ?? 0}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Noindex</p><p className="text-2xl font-bold text-yellow-600">{data.summary.nonIndexable ?? 0}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Redirected</p><p className="text-2xl font-bold">{data.summary.redirected ?? 0}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">No canonical</p><p className="text-2xl font-bold text-yellow-600">{data.summary.missingCanonical ?? 0}</p></CardContent></Card>
          </div>

          {data.infra && Object.keys(data.infra).length > 0 && (
            <Card>
              <CardHeader><CardTitle>Infrastructure</CardTitle></CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-4">
                {data.infra.sitemap && (
                  <div className="border rounded-lg p-3">
                    <p className="font-semibold flex items-center gap-2">Static sitemap.xml {data.infra.sitemap.ok ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-destructive" />}</p>
                    <p className="text-sm text-muted-foreground">Status: {data.infra.sitemap.status} · {data.infra.sitemap.urls} URLs</p>
                  </div>
                )}
                {data.infra.dynamicSitemap && (
                  <div className="border rounded-lg p-3">
                    <p className="font-semibold flex items-center gap-2">Dynamic sitemap {data.infra.dynamicSitemap.ok ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-destructive" />}</p>
                    <p className="text-sm text-muted-foreground">Status: {data.infra.dynamicSitemap.status} · {data.infra.dynamicSitemap.urls} URLs</p>
                  </div>
                )}
                {data.infra.robots && (
                  <div className="border rounded-lg p-3">
                    <p className="font-semibold flex items-center gap-2">robots.txt {data.infra.robots.ok ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-destructive" />}</p>
                    <p className="text-sm text-muted-foreground">Sitemap ref: {data.infra.robots.hasSitemap ? "✓" : "✗"} · Admin disallow: {data.infra.robots.disallowsAdmin ? "✓" : "✗"}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <Tabs value={filter} onValueChange={v => setFilter(v as any)}>
                <TabsList className="flex-wrap h-auto">
                  <TabsTrigger value="all">All ({data.results.length})</TabsTrigger>
                  <TabsTrigger value="issues">Issues ({data.summary.withIssues})</TabsTrigger>
                  <TabsTrigger value="warnings">Warnings ({data.summary.withWarnings})</TabsTrigger>
                  <TabsTrigger value="broken">Broken ({data.summary.broken})</TabsTrigger>
                  <TabsTrigger value="404">404s ({data.summary.notFound ?? 0})</TabsTrigger>
                  <TabsTrigger value="noindex">Noindex ({data.summary.nonIndexable ?? 0})</TabsTrigger>
                  <TabsTrigger value="redirected">Redirected ({data.summary.redirected ?? 0})</TabsTrigger>
                  <TabsTrigger value="missing-canonical">No canonical ({data.summary.missingCanonical ?? 0})</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Index</TableHead>
                      <TableHead>Canonical</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Desc</TableHead>
                      <TableHead>OG</TableHead>
                      <TableHead>Issues / Warnings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell><StatusIcon r={r} /></TableCell>
                        <TableCell className="max-w-xs">
                          <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs">
                            <span className="truncate">{r.url.replace(/^https?:\/\/[^/]+/, "")}</span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                          {r.redirected && r.finalUrl && (
                            <p className="text-[10px] text-muted-foreground truncate" title={r.finalUrl}>→ {r.finalUrl.replace(/^https?:\/\/[^/]+/, "")}</p>
                          )}
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{r.type}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={r.status && r.status < 400 ? "default" : "destructive"}>{r.status || "—"}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {r.indexable === false ? (
                            <Badge variant="destructive" className="text-xs" title={r.noindexReason}>noindex</Badge>
                          ) : (
                            <Badge variant="default" className="text-xs">index</Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[180px] text-xs">
                          {r.hasCanonical ? (
                            <span title={r.canonicalUrl} className={r.canonicalMatches ? "text-green-600" : "text-yellow-600"}>
                              {r.canonicalMatches ? "self" : "cross"}
                            </span>
                          ) : (
                            <span className="text-destructive">missing</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs">{r.title || <span className="text-destructive">missing</span>}</TableCell>
                        <TableCell className="text-xs">{r.description ? `${r.description.length}c` : <span className="text-destructive">missing</span>}</TableCell>
                        <TableCell>{r.hasOG ? "✓" : <span className="text-yellow-600">✗</span>}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {r.issues.map((iss, j) => <Badge key={j} variant="destructive" className="text-xs mr-1">{iss}</Badge>)}
                            {r.warnings.map((w, j) => <Badge key={j} variant="secondary" className="text-xs mr-1">{w}</Badge>)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No results match this filter.</p>}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
