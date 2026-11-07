import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

/**
 * Bridge for the canonical callback URL /api/tiktok/callback.
 *
 * On the published site the hosting layer forwards this path straight to the
 * Manus backend callback function. This component only runs
 * when the request reaches the SPA instead (e.g. in preview), and it forwards
 * the exact query string to the backend so the token exchange still happens
 * server-side. No secrets or tokens are handled here.
 */
export default function TikTokCallbackBridge() {
  const [message, setMessage] = useState('Finishing your TikTok connection…');

  useEffect(() => {
    const target = `/api/functions/tiktok-callback${window.location.search}`;
    window.location.replace(target);
  }, []);

  return (
    <div className="container mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-24 text-center">
      <SEOHead title="Connecting TikTok | Healthy Fields Business Hub" description="Completing your TikTok Business authorization." noIndex />
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
