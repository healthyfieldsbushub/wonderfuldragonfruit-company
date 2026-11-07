import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/integrations/manus/client';

const CHANNEL = 'catalog-refresh';
const EVENT = 'bust';
const STORAGE_KEY = 'catalog_version';

/** Invalidate all product/category queries locally and clear browser caches. */
export async function invalidateCatalogLocally(qc: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    qc.invalidateQueries({ queryKey: ['products'] }),
    qc.invalidateQueries({ queryKey: ['product'] }),
    qc.invalidateQueries({ queryKey: ['categories'] }),
    qc.invalidateQueries({ queryKey: ['admin', 'product-audit'] }),
  ]);
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

/** Admin-side: invalidate locally and notify every connected client (shoppers + other admins). */
export function useCatalogRefresh() {
  const qc = useQueryClient();
  return useCallback(async () => {
    await invalidateCatalogLocally(qc);
    const channel = appClient.channel(CHANNEL);
    await new Promise<void>((resolve) => {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') resolve();
      });
    });
    await channel.send({ type: 'broadcast', event: EVENT, payload: { ts: Date.now() } });
    await appClient.removeChannel(channel);
  }, [qc]);
}

/** Mounted globally — listens for catalog bust broadcasts and refreshes data on every device. */
export function useCatalogBroadcastListener() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = appClient
      .channel(CHANNEL)
      .on('broadcast', { event: EVENT }, () => {
        invalidateCatalogLocally(qc);
      })
      .subscribe();
    return () => {
      appClient.removeChannel(channel);
    };
  }, [qc]);
}
