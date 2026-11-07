import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Music2, RefreshCw, ShieldCheck, Unplug, Zap } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { useAuth } from '@/lib/auth-context';
import { useTikTokIntegration } from '@/hooks/use-tiktok-integration';

export default function TikTokIntegration() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { status, isLoading, error, reload, connect, test, refresh, disconnect } = useTikTokIntegration();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const connection = status?.connection;

  const run = async (key: string, fn: () => Promise<{ ok?: boolean; message?: string }>) => {
    setBusy(key);
    try {
      const result = await fn();
      toast[result?.ok === false ? 'error' : 'success'](result?.message || 'Done');
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(null);
    }
  };

  const handleConnect = async () => {
    setBusy('connect');
    try {
      await connect();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start TikTok authorization');
      setBusy(null);
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
        <SEOHead title="TikTok Business Integration | Healthy Fields Business Hub" description="Connect your TikTok Business account to Healthy Fields Business Hub." noIndex />
        <h1 className="mb-4 font-display text-3xl font-bold">Sign in required</h1>
        <p className="mb-6 text-muted-foreground">
          Please sign in to manage the TikTok Business integration for Healthy Fields Business Hub.
        </p>
        <Button onClick={() => navigate('/login')}>Sign in</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <SEOHead title="TikTok Business Integration | Healthy Fields Business Hub" description="Connect and manage your TikTok Business account inside Healthy Fields Business Hub." noIndex />

      <div className="mb-8">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Healthy Fields Business Hub</p>
        <h1 className="flex items-center gap-3 font-display text-3xl font-bold">
          <Music2 className="h-7 w-7" /> TikTok Business Integration
        </h1>
        <p className="mt-2 text-muted-foreground">
          Securely connect your TikTok for Business account. Credentials are stored encrypted on the server and are never
          exposed to your browser.
        </p>
      </div>

      {status && !status.configured && (
        <Card className="mb-6 border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base">Configuration required</CardTitle>
            <CardDescription>
              The following server settings are still missing: {status.missing_env.join(', ')}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Connection status</CardTitle>
              <CardDescription>TikTok for Business API v1.3</CardDescription>
            </div>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : connection?.connected ? (
              <Badge className="gap-1"><ShieldCheck className="h-3 w-3" /> TikTok Connected ✓</Badge>
            ) : (
              <Badge variant="outline">Not Connected</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && <p className="text-sm text-destructive">{error}</p>}

          {connection?.connected && (
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">Connected TikTok account</dt>
                <dd className="font-medium">{connection.account_name || 'Name not provided by TikTok'}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">TikTok Business ID</dt>
                <dd className="font-medium">{connection.business_id || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Connected</dt>
                <dd className="font-medium">
                  {connection.connected_at ? new Date(connection.connected_at).toLocaleString() : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Access valid until</dt>
                <dd className="font-medium">
                  {connection.token_expires_at
                    ? new Date(connection.token_expires_at).toLocaleString()
                    : 'No expiry reported by TikTok'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="mb-2 text-sm text-muted-foreground">Authorized permissions</dt>
                <dd className="flex flex-wrap gap-2">
                  {connection.scopes.length ? (
                    connection.scopes.map((scope) => (
                      <Badge key={scope} variant="secondary">{scope}</Badge>
                    ))
                  ) : (
                    <span className="text-sm">As approved in your TikTok Developer app</span>
                  )}
                </dd>
              </div>
            </dl>
          )}

          <div className="flex flex-wrap gap-3">
            {!connection?.connected ? (
              <Button onClick={handleConnect} disabled={busy === 'connect' || !status?.configured}>
                {busy === 'connect' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Connect TikTok Business Account
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => run('test', test)} disabled={busy === 'test'}>
                  {busy === 'test' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                  Test Connection
                </Button>
                <Button variant="outline" onClick={() => run('refresh', refresh)} disabled={busy === 'refresh'}>
                  {busy === 'refresh' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Refresh Connection
                </Button>
                <Button variant="outline" onClick={handleConnect} disabled={busy === 'connect'}>
                  Reconnect
                </Button>
                {!confirmDisconnect ? (
                  <Button variant="destructive" onClick={() => setConfirmDisconnect(true)}>
                    <Unplug className="mr-2 h-4 w-4" /> Disconnect TikTok
                  </Button>
                ) : (
                  <div className="flex w-full flex-col gap-2 rounded-lg border border-destructive/40 p-4">
                    <p className="text-sm">
                      Disconnect TikTok? Stored access and refresh tokens will be revoked and permanently deleted.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={async () => {
                          setConfirmDisconnect(false);
                          await run('disconnect', disconnect);
                        }}
                        disabled={busy === 'disconnect'}
                      >
                        {busy === 'disconnect' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Yes, disconnect
                      </Button>
                      <Button variant="ghost" onClick={() => setConfirmDisconnect(false)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Access tokens, refresh tokens and your TikTok client secret are never sent to the browser or stored in this
            device. Need help? <Link className="underline" to="/contact">Contact us</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
