import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music2 } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

export default function IntegrationsIndex() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <SEOHead title="Integrations | Healthy Fields Business Hub" description="Manage the third-party integrations connected to Healthy Fields Business Hub." noIndex />
      <p className="text-sm uppercase tracking-wide text-muted-foreground">Healthy Fields Business Hub</p>
      <h1 className="mb-8 font-display text-3xl font-bold">Integrations</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Music2 className="h-6 w-6" />
            <div>
              <CardTitle>TikTok Business</CardTitle>
              <CardDescription>Connect a TikTok for Business account for reporting and marketing features.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/settings/integrations/tiktok">Manage TikTok Integration</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
