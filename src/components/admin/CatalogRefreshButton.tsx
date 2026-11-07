import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCatalogRefresh } from '@/hooks/use-catalog-refresh';
import { useToast } from '@/hooks/use-toast';
import { RefreshCcw, Zap } from 'lucide-react';

interface Props {
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

/** Admin button: refreshes the React Query cache and broadcasts a cache-bust to all connected shoppers/admins. */
export function CatalogRefreshButton({ variant = 'default', size = 'default', className }: Props) {
  const refresh = useCatalogRefresh();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      await refresh();
      toast({
        title: 'Catalog refreshed',
        description: 'All shoppers and admin sessions will reload product data.',
      });
    } catch (err: any) {
      toast({
        title: 'Refresh failed',
        description: err?.message ?? 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={busy} variant={variant} size={size} className={`gap-2 ${className ?? ''}`}>
      {busy ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
      {busy ? 'Refreshing…' : 'Refresh catalog'}
    </Button>
  );
}
