import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

const FRIENDLY: Record<string, string> = {
  missing_state: 'The security token was missing from the TikTok response.',
  invalid_state: 'The security token was not recognised. Please start the connection again.',
  expired_state: 'The authorization request expired. Please try again.',
  state_replayed: 'That authorization link was already used. Please start a new connection.',
  missing_auth_code: 'TikTok did not return an authorization code.',
  token_exchange_failed: 'TikTok declined to issue an access token for this request.',
  provider_error: 'TikTok denied the authorization request.',
  not_configured: 'The TikTok integration is not fully configured yet.',
  storage_failed: 'We could not save the connection. Please try again.',
  rate_limited: 'Too many attempts. Please wait a minute and try again.',
  unexpected_error: 'Something went wrong while connecting TikTok.',
};

function sanitize(value: string | null): string | null {
  if (!value) return null;
  return value.replace(/[<>]/g, '').slice(0, 200);
}

export default function TikTokError() {
  const [params] = useSearchParams();
  const reason = params.get('reason') ?? '';
  const message = sanitize(params.get('message')) || FRIENDLY[reason] || 'An unknown error occurred.';

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <SEOHead title="TikTok Connection Failed | Healthy Fields Business Hub" description="We could not connect your TikTok Business account." noIndex />
      <Card className="border-destructive/40">
        <CardHeader className="items-center text-center">
          <AlertTriangle className="mb-2 h-12 w-12 text-destructive" />
          <CardTitle className="font-display text-2xl">TikTok Connection Failed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-muted-foreground">We could not connect your TikTok Business account.</p>
          <p className="rounded-lg border bg-muted/40 p-4 text-sm">{message}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/settings/integrations/tiktok">Try Again</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/settings/integrations">Return to Integrations</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
