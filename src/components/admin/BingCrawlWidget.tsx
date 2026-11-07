import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bot, RefreshCw, AlertCircle, ExternalLink, TrendingUp, Search, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { appClient } from '@/integrations/manus/client';

interface BingStats {
  site: string;
  fetchedAt: string;
  crawlStats?: any;
  urlInfo?: any;
  quota?: any;
  rankAndTraffic?: any;
  error?: string;
}

const sumField = (arr: any, field: string): number => {
  if (!Array.isArray(arr)) return 0;
  return arr.reduce((s, r) => s + (Number(r?.[field]) || 0), 0);
};

const latest = (arr: any) => (Array.isArray(arr) && arr.length ? arr[arr.length - 1] : null);

export default function BingCrawlWidget() {
  const { data, isLoading, error, refetch, isRefetching } = useQuery<BingStats>({
    queryKey: ['bing-crawl-stats'],
    queryFn: async () => {
      const { data, error } = await appClient.functions.invoke('bing-crawl-stats');
      if (error) throw error;
      return data as BingStats;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const notConfigured = (error as any)?.context?.status === 503 ||
    (data as any)?.error?.includes('not configured');

  const crawl = Array.isArray(data?.crawlStats) ? data.crawlStats : [];
  const totalCrawled = sumField(crawl, 'CrawledPages');
  const totalErrors = sumField(crawl, 'CrawlErrors');
  const inIndex = data?.urlInfo?.TotalIndexed ?? data?.urlInfo?.IndexedPagesCount ?? null;
  const lastCrawl = latest(crawl);
  const dailyQuota = data?.quota?.DailyQuota ?? null;
  const dailyUsed = data?.quota?.DailyUsed ?? null;
  const impressions = data?.rankAndTraffic ? sumField(data.rankAndTraffic, 'Impressions') : 0;
  const clicks = data?.rankAndTraffic ? sumField(data.rankAndTraffic, 'Clicks') : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Bing Indexing & Crawl Signals
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
            <a
              href="https://www.bing.com/webmasters/home"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading Bing signals…</p>
          ) : notConfigured ? (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
              <div className="text-sm space-y-1">
                <p className="font-medium">Bing Webmaster API key not configured</p>
                <p className="text-muted-foreground">
                  Get an API key at{' '}
                  <a
                    href="https://www.bing.com/webmasters/home"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary"
                  >
                    Bing Webmaster Tools → Settings → API Access
                  </a>
                  , then add it as <code className="px-1 rounded bg-muted">BING_WEBMASTER_API_KEY</code>.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm">{(error as Error).message}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Top stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Activity className="h-3 w-3" /> Pages crawled
                  </div>
                  <div className="text-xl font-bold mt-1">{totalCrawled.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">last 30 days</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <AlertCircle className="h-3 w-3" /> Crawl errors
                  </div>
                  <div className={`text-xl font-bold mt-1 ${totalErrors > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                    {totalErrors.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">last 30 days</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Search className="h-3 w-3" /> Pages indexed
                  </div>
                  <div className="text-xl font-bold mt-1">
                    {inIndex !== null ? Number(inIndex).toLocaleString() : '—'}
                  </div>
                  <div className="text-xs text-muted-foreground">in Bing index</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" /> Impressions
                  </div>
                  <div className="text-xl font-bold mt-1">{impressions.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{clicks.toLocaleString()} clicks</div>
                </div>
              </div>

              {/* Recent crawl + quota */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="p-3 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-2">Most recent crawl day</p>
                  {lastCrawl ? (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date</span>
                        <span className="font-medium">
                          {lastCrawl.Date
                            ? new Date(parseInt(String(lastCrawl.Date).replace(/\D/g, ''))).toLocaleDateString()
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Crawled</span>
                        <span className="font-medium">{lastCrawl.CrawledPages ?? 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Blocked by robots</span>
                        <span className="font-medium">{lastCrawl.Robots ?? 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">HTTP errors</span>
                        <Badge variant={lastCrawl.HttpErrors > 0 ? 'destructive' : 'secondary'}>
                          {lastCrawl.HttpErrors ?? 0}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No crawl activity reported.</p>
                  )}
                </div>

                <div className="p-3 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-2">URL submission quota</p>
                  {dailyQuota !== null ? (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Daily used</span>
                        <span className="font-medium">{dailyUsed ?? 0} / {dailyQuota}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monthly quota</span>
                        <span className="font-medium">{data?.quota?.MonthlyQuota ?? '—'}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mt-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, ((Number(dailyUsed) || 0) / Math.max(1, Number(dailyQuota))) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Quota unavailable.</p>
                  )}
                </div>
              </div>

              {data?.fetchedAt && (
                <p className="text-xs text-muted-foreground text-right">
                  Updated {new Date(data.fetchedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
