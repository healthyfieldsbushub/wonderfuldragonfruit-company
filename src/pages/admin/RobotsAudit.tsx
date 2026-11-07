import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  FileCode2,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
} from 'lucide-react';

const ROBOTS_URL = 'https://www.wonderfuldragonfruit.company/robots.txt';
const SITEMAP_URL = 'https://www.wonderfuldragonfruit.company/sitemap.xml';

interface Rule {
  name: string;
  passed: boolean;
  detail: string;
  severity: 'error' | 'warning' | 'info';
}

function audit(content: string): Rule[] {
  const rules: Rule[] = [];
  const lower = content.toLowerCase();
  const lines = content.split(/\r?\n/);

  // User-agent groups
  const uaLines = lines
    .filter((l) => /^\s*user-agent\s*:/i.test(l))
    .map((l) => l.split(':')[1].trim().toLowerCase());

  const has = (ua: string) => uaLines.includes(ua.toLowerCase());

  rules.push({
    name: 'Bingbot user-agent group',
    passed: has('bingbot'),
    detail: has('bingbot') ? 'Bingbot rules declared' : 'No explicit Bingbot block — Bing falls back to User-agent: *',
    severity: has('bingbot') ? 'info' : 'warning',
  });

  rules.push({
    name: 'MSNBot (legacy Bing) user-agent group',
    passed: has('msnbot'),
    detail: has('msnbot') ? 'MSNBot rules declared' : 'Optional but recommended',
    severity: has('msnbot') ? 'info' : 'warning',
  });

  rules.push({
    name: 'Wildcard user-agent group',
    passed: has('*'),
    detail: has('*') ? 'Default rules for all bots present' : 'Missing User-agent: * group',
    severity: has('*') ? 'info' : 'error',
  });

  // Sitemap directives
  const sitemapLines = lines.filter((l) => /^\s*sitemap\s*:/i.test(l));
  const hasCanonicalSitemap = sitemapLines.some((l) =>
    l.toLowerCase().includes(SITEMAP_URL.toLowerCase()),
  );

  rules.push({
    name: 'Sitemap directive present',
    passed: sitemapLines.length > 0,
    detail: sitemapLines.length > 0
      ? `${sitemapLines.length} Sitemap line(s)`
      : 'No Sitemap: directive — Bing/Google will fall back to /sitemap.xml',
    severity: sitemapLines.length > 0 ? 'info' : 'error',
  });

  rules.push({
    name: 'Canonical sitemap URL listed',
    passed: hasCanonicalSitemap,
    detail: hasCanonicalSitemap ? SITEMAP_URL : `Expected: ${SITEMAP_URL}`,
    severity: hasCanonicalSitemap ? 'info' : 'error',
  });

  // Allow rules for sitemap.xml
  rules.push({
    name: 'sitemap.xml not disallowed',
    passed: !/disallow:\s*\/sitemap\.xml/i.test(content),
    detail: 'sitemap.xml must remain crawlable',
    severity: 'error',
  });

  rules.push({
    name: 'Allow: /*.xml$ rule',
    passed: /allow:\s*\/\*\.xml\$/i.test(content),
    detail: 'Lets crawlers fetch any XML asset (sitemaps, feeds)',
    severity: /allow:\s*\/\*\.xml\$/i.test(content) ? 'info' : 'warning',
  });

  // Host directive
  rules.push({
    name: 'Host directive (canonical hostname)',
    passed: /host:\s*wonderfuldragonfruit\.com/i.test(content),
    detail: 'Host: wonderfuldragonfruit.company',
    severity: /host:\s*wonderfuldragonfruit\.com/i.test(content) ? 'info' : 'warning',
  });

  // Disallow root sanity
  const disallowRoot = /\n\s*disallow:\s*\/\s*$/im.test(`\n${content}\n`);
  rules.push({
    name: 'Site is NOT fully blocked',
    passed: !disallowRoot,
    detail: disallowRoot
      ? 'Found `Disallow: /` — the entire site is blocked from crawling!'
      : 'No global disallow detected',
    severity: 'error',
  });

  // Sensitive routes blocked
  ['/admin', '/checkout', '/login'].forEach((path) => {
    const blocked = new RegExp(`disallow:\\s*${path.replace('/', '\\/')}`, 'i').test(lower);
    rules.push({
      name: `Sensitive route blocked: ${path}`,
      passed: blocked,
      detail: blocked ? 'Disallowed' : `Consider adding Disallow: ${path}`,
      severity: blocked ? 'info' : 'warning',
    });
  });

  return rules;
}

export default function RobotsAudit() {
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);

  const fetchRobots = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ROBOTS_URL, { cache: 'no-store' });
      setStatus(res.status);
      const text = await res.text();
      setContent(text);
      setRules(audit(text));
      if (res.ok) toast.success('robots.txt fetched');
      else toast.error(`HTTP ${res.status}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      toast.error('Failed to fetch robots.txt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRobots();
  }, []);

  const errors = rules.filter((r) => !r.passed && r.severity === 'error');
  const warnings = rules.filter((r) => !r.passed && r.severity === 'warning');
  const allOk = rules.length > 0 && errors.length === 0 && warnings.length === 0;

  const copyContent = () => {
    navigator.clipboard.writeText(content);
    toast.success('robots.txt copied');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <FileCode2 className="h-8 w-8" />
            robots.txt Audit
          </h1>
          <p className="text-muted-foreground">
            Live check of <code>{ROBOTS_URL}</code> with Bing & sitemap rule validation.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href={ROBOTS_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" /> Open Live
            </a>
          </Button>
          <Button onClick={fetchRobots} disabled={loading}>
            {loading ? (
              <><RefreshCw className="h-4 w-4 mr-1 animate-spin" /> Fetching…</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-1" /> Re-check</>
            )}
          </Button>
        </div>
      </div>

      {/* Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2">
                {allOk ? (
                  <><CheckCircle2 className="h-5 w-5 text-green-500" /> All rules passed</>
                ) : errors.length > 0 ? (
                  <><XCircle className="h-5 w-5 text-destructive" /> {errors.length} error(s)</>
                ) : (
                  <><AlertCircle className="h-5 w-5 text-yellow-500" /> {warnings.length} warning(s)</>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">HTTP {status ?? '—'}</Badge>
                <Badge variant="outline">{content.length} bytes</Badge>
              </div>
            </div>
            <CardDescription>
              {error
                ? `Fetch failed: ${error}`
                : 'Each rule checks something Bing Webmaster Tools or Google Search Console will flag.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {rules.map((rule) => (
                <li key={rule.name} className="flex items-start gap-2 text-sm">
                  {rule.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  ) : rule.severity === 'error' ? (
                    <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium flex items-center gap-2 flex-wrap">
                      <span>{rule.name}</span>
                      {!rule.passed && (
                        <Badge
                          variant="outline"
                          className={
                            rule.severity === 'error'
                              ? 'text-destructive border-destructive text-xs'
                              : 'text-yellow-500 border-yellow-500 text-xs'
                          }
                        >
                          {rule.severity}
                        </Badge>
                      )}
                    </div>
                    <div className="text-muted-foreground text-xs">{rule.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>

      {/* Raw contents */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle>Live robots.txt</CardTitle>
              <Button variant="outline" size="sm" onClick={copyContent} disabled={!content}>
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
            </div>
            <CardDescription>Fetched fresh — no cache.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="p-3 bg-muted rounded-lg text-xs overflow-auto max-h-96 whitespace-pre-wrap">
              {content || (loading ? 'Loading…' : 'Empty')}
            </pre>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
