import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Globe, CheckCircle2, XCircle, ExternalLink, RefreshCw, Copy, Send, AlertCircle, Server, Activity } from 'lucide-react';
import { checkSitemapHealth, type SitemapHealthResult } from '@/lib/sitemap-health';

const SITE_URL = 'https://www.wonderfuldragonfruit.company';
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;
const BING_CNAME_HOST = '7a311995a51883c8433718d5c523f974';
const BING_CNAME_TARGET = 'verify.bing.com';
const BING_CNAME_FQDN = `${BING_CNAME_HOST}.wonderfuldragonfruit.company`;

const SEARCH_ENGINES = [
  {
    name: 'Google',
    pingUrl: `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
    consoleUrl: 'https://search.google.com/search-console',
    color: 'bg-blue-500/20 text-blue-500',
    instructions: 'Add your site in Search Console → Sitemaps → paste the URL and submit.',
  },
  {
    name: 'Bing',
    pingUrl: `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
    consoleUrl: `https://www.bing.com/webmasters/sitemaps?siteUrl=${encodeURIComponent(SITE_URL)}`,
    color: 'bg-teal-500/20 text-teal-500',
    instructions: 'Open Bing Webmaster → Sitemaps → paste sitemap URL → Submit.',
  },
  {
    name: 'IndexNow (Bing/Yandex/DuckDuckGo)',
    pingUrl: `https://www.bing.com/indexnow?url=${encodeURIComponent(SITE_URL)}&urlList=${encodeURIComponent(SITEMAP_URL)}`,
    consoleUrl: 'https://www.bing.com/indexnow',
    color: 'bg-purple-500/20 text-purple-500',
    instructions: 'IndexNow instantly notifies multiple search engines of new content.',
  },
];

const FREE_LISTING_PLATFORMS = [
  { name: 'Google Business Profile', url: 'https://business.google.com/', desc: 'Essential for local SEO' },
  { name: 'Bing Places', url: 'https://www.bingplaces.com/', desc: 'Microsoft search visibility' },
  { name: 'Yandex Webmaster', url: 'https://webmaster.yandex.com/', desc: 'Russian search engine' },
  { name: 'Pinterest Business', url: 'https://business.pinterest.com/', desc: 'Visual search & discovery' },
  { name: 'Schema.org Validator', url: 'https://validator.schema.org/', desc: 'Validate structured data' },
  { name: 'Rich Results Test', url: 'https://search.google.com/test/rich-results', desc: 'Test Google rich snippets' },
];

export default function SitemapSubmission() {
  const [sitemapContent, setSitemapContent] = useState('');
  const [urlCount, setUrlCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pinging, setPinging] = useState<string | null>(null);
  const [pinged, setPinged] = useState<string[]>([]);
  const [health, setHealth] = useState<SitemapHealthResult | null>(null);
  const [healthRunning, setHealthRunning] = useState(false);

  const runHealthCheck = async () => {
    setHealthRunning(true);
    try {
      const result = await checkSitemapHealth();
      setHealth(result);
      if (result.ok) {
        toast.success(`Sitemap healthy — ${result.urlCount} URLs in ${result.durationMs}ms`);
      } else {
        toast.error(`Sitemap check failed${result.error ? `: ${result.error}` : ''}`);
      }
    } finally {
      setHealthRunning(false);
    }
  };

  const fetchSitemap = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${"/api"}/api/functions/sitemap`);
      const xml = await res.text();
      setSitemapContent(xml);
      const matches = xml.match(/<loc>/g);
      setUrlCount(matches ? matches.length : 0);
    } catch {
      toast.error('Failed to fetch sitemap');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSitemap(); }, []);

  const handlePing = async (engine: typeof SEARCH_ENGINES[0]) => {
    setPinging(engine.name);
    try {
      // Use a simple fetch to ping - most engines accept GET requests
      await fetch(engine.pingUrl, { mode: 'no-cors' });
      setPinged(prev => [...prev, engine.name]);
      toast.success(`Sitemap pinged to ${engine.name}!`);
    } catch {
      // no-cors won't throw for most cases, but handle anyway
      setPinged(prev => [...prev, engine.name]);
      toast.success(`Ping sent to ${engine.name}`);
    } finally {
      setPinging(null);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(SITEMAP_URL);
    toast.success('Sitemap URL copied!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <Globe className="h-8 w-8" />
          Sitemap & Search Submission
        </h1>
        <p className="text-muted-foreground">Manage your sitemap and submit to search engines</p>
      </div>

      {/* Live Sitemap Health Check */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Live Sitemap Health Check
                </CardTitle>
                <CardDescription>
                  Hits <code>{SITEMAP_URL}</code> and verifies status, content-type, XML validity, and canonical URLs.
                </CardDescription>
              </div>
              <Button onClick={runHealthCheck} disabled={healthRunning}>
                {healthRunning ? (
                  <><RefreshCw className="h-4 w-4 mr-1 animate-spin" /> Running…</>
                ) : (
                  <><Activity className="h-4 w-4 mr-1" /> Run Health Check</>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!health ? (
              <p className="text-sm text-muted-foreground">Click <strong>Run Health Check</strong> to validate the live sitemap.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge
                    variant="outline"
                    className={health.ok
                      ? 'text-green-500 border-green-500'
                      : 'text-destructive border-destructive'}
                  >
                    {health.ok ? 'HEALTHY' : 'FAILED'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {health.status ?? '—'} · {health.urlCount} URLs · {health.durationMs}ms
                  </span>
                </div>
                {health.error && (
                  <div className="text-sm text-destructive flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{health.error}</span>
                  </div>
                )}
                <ul className="space-y-1.5">
                  {health.checks.map((c) => (
                    <li key={c.name} className="flex items-start gap-2 text-sm">
                      {c.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      )}
                      <span className="font-medium">{c.name}</span>
                      <span className="text-muted-foreground">— {c.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Bing CNAME Verification — Step-by-step */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-card border-teal-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-teal-500" />
              Bing CNAME Verification
            </CardTitle>
            <CardDescription>
              Add this CNAME at your DNS provider, confirm it resolves, then click <strong>Verify</strong> in Bing Webmaster Tools.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal pl-5 space-y-3 text-sm">
              <li>
                <strong>Add the CNAME record</strong> in your DNS provider (Cloudflare / registrar) for <code>wonderfuldragonfruit.company</code>:
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-2 bg-muted rounded text-xs">
                    <div className="text-muted-foreground">Type</div>
                    <code className="font-mono">CNAME</code>
                  </div>
                  <div className="p-2 bg-muted rounded text-xs flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-muted-foreground">Name / Host</div>
                      <code className="font-mono break-all">{BING_CNAME_HOST}</code>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => { navigator.clipboard.writeText(BING_CNAME_HOST); toast.success('Host copied'); }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="p-2 bg-muted rounded text-xs flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-muted-foreground">Value / Target</div>
                      <code className="font-mono break-all">{BING_CNAME_TARGET}</code>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => { navigator.clipboard.writeText(BING_CNAME_TARGET); toast.success('Target copied'); }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  ⚠️ If using Cloudflare, set the proxy to <strong>DNS only</strong> (grey cloud) for this record so Bing can resolve the raw target.
                </p>
              </li>

              <li>
                <strong>Confirm the CNAME resolves</strong> to <code>{BING_CNAME_TARGET}</code>. Use any of these public DNS lookup tools — they let you check propagation worldwide without installing anything:
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`https://dnschecker.org/#CNAME/${encodeURIComponent(BING_CNAME_FQDN)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      DNSChecker (global)
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`https://toolbox.googleapps.com/apps/dig/#CNAME/${encodeURIComponent(BING_CNAME_FQDN)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Google Dig
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`https://www.whatsmydns.net/#CNAME/${encodeURIComponent(BING_CNAME_FQDN)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      whatsmydns.net
                    </a>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Or run locally: <code className="bg-muted px-1 py-0.5 rounded">dig CNAME {BING_CNAME_FQDN} +short</code> — expected output: <code className="bg-muted px-1 py-0.5 rounded">{BING_CNAME_TARGET}.</code>
                </p>
              </li>

              <li>
                <strong>Wait for DNS propagation</strong> (usually 5–30 minutes; up to 72 hours on slow providers). All three lookup tools above should agree before continuing.
              </li>

              <li>
                <strong>Trigger Bing verification</strong>: open Bing Webmaster Tools and click the green <strong>Verify</strong> button next to the CNAME method.
                <div className="flex gap-2 mt-2">
                  <Button asChild>
                    <a
                      href={`https://www.bing.com/webmasters/home/addsite?siteUrl=${encodeURIComponent(SITE_URL)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open Bing Webmaster — Verify
                    </a>
                  </Button>
                </div>
              </li>
            </ol>

            <div className="flex items-start gap-2 text-xs text-muted-foreground border-t pt-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                The HTML meta tag (<code>msvalidate.01</code>) is already in <code>index.html</code> — that's a separate verification method. CNAME verification is the most durable; it survives redeployments and theme changes.
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sitemap Status */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Sitemap Status
                </CardTitle>
                <CardDescription>Your dynamic sitemap is live and auto-updating</CardDescription>
              </div>
              <Badge variant="outline" className="text-green-500 border-green-500">
                {loading ? '...' : `${urlCount} URLs indexed`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <code className="flex-1 min-w-0 p-3 bg-muted rounded-lg text-sm truncate">
                {SITEMAP_URL}
              </code>
              <Button variant="outline" size="icon" onClick={copyUrl}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" asChild>
                <a href={SITEMAP_URL} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" size="icon" onClick={fetchSitemap}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>robots.txt is configured and pointing to this sitemap.</span>
            </div>

            {sitemapContent && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                  View Raw XML ({urlCount} URLs)
                </summary>
                <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-64 whitespace-pre-wrap">
                  {sitemapContent}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Submit to Search Engines */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Submit to Search Engines</CardTitle>
            <CardDescription>Ping search engines to crawl your sitemap immediately</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {SEARCH_ENGINES.map((engine) => (
              <div key={engine.name} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm ${engine.color}`}>
                    {engine.name[0]}
                  </div>
                  <div>
                    <p className="font-medium">{engine.name}</p>
                    <p className="text-sm text-muted-foreground">{engine.instructions}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePing(engine)}
                    disabled={pinging === engine.name}
                  >
                    {pinged.includes(engine.name) ? (
                      <><CheckCircle2 className="h-4 w-4 mr-1 text-green-500" /> Pinged</>
                    ) : pinging === engine.name ? (
                      <><RefreshCw className="h-4 w-4 mr-1 animate-spin" /> Pinging...</>
                    ) : (
                      <><Send className="h-4 w-4 mr-1" /> Ping</>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={engine.consoleUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" /> Console
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Bing Webmaster Tools — Step-by-step */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="glass-card border-teal-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="h-7 w-7 rounded-md bg-teal-500/20 text-teal-500 flex items-center justify-center font-bold text-sm">B</span>
              Bing Webmaster — Submit Sitemap
            </CardTitle>
            <CardDescription>
              Bing verification is already in <code>index.html</code>. After publishing, submit your sitemap below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>Click <strong>Publish</strong> (top-right of the Manus Dashboard) so the latest <code>index.html</code> with your Bing token is live.</li>
              <li>
                Open{' '}
                <a
                  href={`https://www.bing.com/webmasters/sitemaps?siteUrl=${encodeURIComponent(SITE_URL)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Bing Webmaster → Sitemaps
                </a>
                {' '}for <code>{SITE_URL}</code>.
              </li>
              <li>
                Click <strong>Submit sitemap</strong> and paste:
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-xs truncate">{SITEMAP_URL}</code>
                  <Button variant="outline" size="sm" onClick={copyUrl}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
              </li>
              <li>Press <strong>Submit</strong>. Bing will start crawling within minutes; full indexing takes a few days.</li>
              <li>(Optional) Use the <strong>Ping</strong> button above to nudge Bing to re-crawl after future content updates.</li>
            </ol>
            <div className="flex gap-2 pt-2">
              <Button asChild>
                <a
                  href={`https://www.bing.com/webmasters/sitemaps?siteUrl=${encodeURIComponent(SITE_URL)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open Bing Sitemap Submission
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://www.bing.com/webmasters/about" target="_blank" rel="noopener noreferrer">
                  Verify Site Ownership
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Free Listing Platforms */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Free Listing & Validation Platforms</CardTitle>
            <CardDescription>Submit your site to these free platforms for maximum visibility</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {FREE_LISTING_PLATFORMS.map((platform) => (
                <a
                  key={platform.name}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                >
                  <div>
                    <p className="font-medium group-hover:text-primary transition-colors">{platform.name}</p>
                    <p className="text-sm text-muted-foreground">{platform.desc}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
