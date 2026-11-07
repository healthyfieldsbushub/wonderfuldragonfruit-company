import { useState } from 'react';
import { appClient } from '@/integrations/manus/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Globe, Play, RefreshCw } from 'lucide-react';
import { useCountries } from '@/hooks/use-geo-pages';

export default function GeoContentGenerator() {
  const { data: countries = [] } = useCountries();
  const [running, setRunning] = useState(false);
  const [batchSize, setBatchSize] = useState(10);
  const [overwrite, setOverwrite] = useState(false);
  const [country, setCountry] = useState<string>('');
  const [progress, setProgress] = useState<{ done: number; remaining: number } | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const append = (s: string) => setLog(l => [s, ...l].slice(0, 200));

  const runOnce = async () => {
    const { data, error } = await appClient.functions.invoke('geo-content-generator', {
      body: {
        limit: batchSize,
        overwrite,
        ...(country ? { country_slug: country } : {}),
      },
    });
    if (error) throw error;
    return data as { processed: number; remaining: number; results: any[] };
  };

  const runUntilDone = async () => {
    setRunning(true);
    setLog([]);
    try {
      let safety = 200;
      while (safety-- > 0) {
        const r = await runOnce();
        setProgress({ done: r.processed, remaining: r.remaining });
        const okCount = r.results.filter((x: any) => x.ok).length;
        const failCount = r.results.length - okCount;
        append(`Batch: ${okCount} ok, ${failCount} failed, ${r.remaining} remaining`);
        r.results.filter((x: any) => !x.ok).forEach((x: any) =>
          append(`  ✗ ${x.country}/${x.region}/${x.page}: ${x.error}`),
        );
        if (r.remaining === 0 || r.processed === 0) break;
      }
      toast.success('Generation complete');
    } catch (e: any) {
      toast.error(e?.message || 'Generation failed');
      append(`ERROR: ${e?.message || e}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <Globe className="h-7 w-7" /> Africa Geo Content Generator
        </h1>
        <p className="text-muted-foreground mt-1">
          Pre-generate localized SEO pages for every country / region / topic in the SADC network.
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Country (optional)</Label>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="w-full h-10 rounded-md border bg-background px-3 mt-1"
            >
              <option value="">All SADC countries</option>
              {countries.map(c => (
                <option key={c.id} value={c.slug}>{c.flag_emoji} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Batch size</Label>
            <Input
              type="number"
              min={1}
              max={25}
              value={batchSize}
              onChange={e => setBatchSize(parseInt(e.target.value || '10', 10))}
              className="mt-1"
            />
          </div>
          <div className="flex items-end gap-2">
            <Switch checked={overwrite} onCheckedChange={setOverwrite} id="ow" />
            <Label htmlFor="ow">Overwrite existing</Label>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={runUntilDone} disabled={running} size="lg">
            {running
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…</>
              : <><Play className="h-4 w-4 mr-2" /> Generate all pending</>}
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              setRunning(true);
              try {
                const r = await runOnce();
                setProgress({ done: r.processed, remaining: r.remaining });
                append(`Single batch: ${r.processed} processed, ${r.remaining} remaining`);
              } catch (e: any) {
                toast.error(e?.message || 'Failed');
              } finally { setRunning(false); }
            }}
            disabled={running}
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Run one batch
          </Button>
        </div>

        {progress && (
          <div className="text-sm text-muted-foreground">
            Last batch processed: <strong>{progress.done}</strong> · Remaining: <strong>{progress.remaining}</strong>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-bold mb-3">Activity log</h2>
        <div className="font-mono text-xs space-y-1 max-h-96 overflow-auto bg-muted/30 p-3 rounded">
          {log.length === 0 ? (
            <div className="text-muted-foreground">No activity yet.</div>
          ) : (
            log.map((l, i) => <div key={i}>{l}</div>)
          )}
        </div>
      </Card>
    </div>
  );
}
