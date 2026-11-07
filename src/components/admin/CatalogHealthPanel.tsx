import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react';
import { useCatalogHealth, type HealthCheck } from '@/hooks/use-catalog-health';

const ICONS: Record<HealthCheck['status'], typeof CheckCircle2> = {
  pass: CheckCircle2,
  warn: AlertTriangle,
  fail: XCircle,
};

const TONES: Record<HealthCheck['status'], string> = {
  pass: 'text-primary',
  warn: 'text-amber-500',
  fail: 'text-destructive',
};

export function CatalogHealthPanel() {
  const { data, isLoading } = useCatalogHealth();

  const summary = data
    ? {
        pass: data.checks.filter((c) => c.status === 'pass').length,
        warn: data.checks.filter((c) => c.status === 'warn').length,
        fail: data.checks.filter((c) => c.status === 'fail').length,
      }
    : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Catalog Health
        </CardTitle>
        {summary && (
          <div className="flex gap-2 text-sm">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {summary.pass} passing
            </Badge>
            {summary.warn > 0 && (
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                {summary.warn} warnings
              </Badge>
            )}
            {summary.fail > 0 && (
              <Badge variant="destructive">{summary.fail} failing</Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <ul className="divide-y">
            {data.checks.map((c) => {
              const Icon = ICONS[c.status];
              return (
                <li key={c.id} className="flex items-start gap-3 py-3">
                  <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${TONES[c.status]}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{c.label}</span>
                      <Badge
                        variant={
                          c.status === 'fail'
                            ? 'destructive'
                            : c.status === 'warn'
                              ? 'outline'
                              : 'secondary'
                        }
                        className="text-xs uppercase"
                      >
                        {c.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{c.detail}</p>
                    {c.hint && c.status !== 'pass' && (
                      <p className="text-xs text-muted-foreground/80 mt-1 italic">→ {c.hint}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
