import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, Unplug } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { useTikTokIntegration } from '@/hooks/use-tiktok-integration';
import { toast } from 'sonner';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TikTokSuccess() {
  const { status, isLoading, disconnect } = useTikTokIntegration();
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const connection = status?.connection;

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect your TikTok Business account? Stored credentials will be deleted.')) return;
    setBusy(true);
    try {
      const result = await disconnect();
      toast.success(result.message || 'TikTok disconnected');
      navigate('/settings/integrations/tiktok');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not disconnect');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <SEOHead title="TikTok Connected | Healthy Fields Business Hub" description="Your TikTok Business account is connected to Healthy Fields Business Hub." noIndex />
      <Card>
        <CardHeader className="items-center text-center">
          <CheckCircle2 className="mb-2 h-12 w-12 text-primary" />
          <CardTitle className="font-display text-2xl">TikTok Connected Successfully</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            Your TikTok Business account has been successfully connected to Healthy Fields Business Hub.
          </p>

          {isLoading ? (
            <div className="flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
            <dl className="space-y-4 rounded-lg border p-4">
              <div>
                <dt className="text-sm text-muted-foreground">Connected account</dt>
                <dd className="font-medium">{connection?.account_name || 'Name not provided by TikTok'}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Connection status</dt>
                <dd><Badge>{connection?.connected ? 'Connected' : 'Not Connected'}</Badge></dd>
              </div>
              <div>
                <dt className="mb-2 text-sm text-muted-foreground">Permissions</dt>
                <dd className="flex flex-wrap gap-2">
                  {connection?.scopes?.length ? (
                    connection.scopes.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)
                  ) : (
                    <span className="text-sm">As approved in your TikTok Developer app</span>
                  )}
                </dd>
              </div>
            </dl>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/settings/integrations/tiktok">Go to TikTok Integration Dashboard</Link>
            </Button>
            <Button variant="destructive" onClick={handleDisconnect} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Unplug className="mr-2 h-4 w-4" />}
              Disconnect TikTok Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
