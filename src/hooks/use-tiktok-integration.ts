import { useEffect, useState, useCallback } from 'react';
import { appClient } from '@/integrations/manus/client';

interface TikTokConnection {
  connected: boolean;
  status: string;
  account_name?: string | null;
  tiktok_user_id?: string | null;
  business_id?: string | null;
  scopes: string[];
  connected_at?: string | null;
  token_expires_at?: string | null;
  has_refresh_token?: boolean;
}

export interface TikTokStatus {
  configured: boolean;
  missing_env: string[];
  connection: TikTokConnection;
}

async function invoke<T>(name: string, body?: Record<string, unknown>): Promise<T> {
  const { data, error } = await appClient.functions.invoke(name, { body });
  if (error) {
    let detail = error.message;
    // Surface the real server message instead of "non-2xx status code".
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.text === 'function') {
      const raw = await ctx.text().catch(() => '');
      try {
        const parsed = JSON.parse(raw);
        detail = parsed.error || parsed.message || raw || detail;
      } catch {
        detail = raw || detail;
      }
    }
    throw new Error(detail);
  }
  return data as T;
}

export function useTikTokIntegration() {
  const [status, setStatus] = useState<TikTokStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setStatus(await invoke<TikTokStatus>('tiktok-connection', { action: 'status' }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load TikTok status.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const connect = useCallback(async () => {
    const data = await invoke<{ authorize_url: string }>('tiktok-oauth-start');
    window.location.href = data.authorize_url;
  }, []);

  const test = useCallback(
    () => invoke<{ ok: boolean; message: string }>('tiktok-connection', { action: 'test' }),
    [],
  );
  const refresh = useCallback(
    () => invoke<{ ok: boolean; message: string }>('tiktok-connection', { action: 'refresh' }),
    [],
  );
  const disconnect = useCallback(
    () => invoke<{ ok: boolean; message: string }>('tiktok-connection', { action: 'disconnect' }),
    [],
  );

  return { status, isLoading, error, reload: load, connect, test, refresh, disconnect };
}
