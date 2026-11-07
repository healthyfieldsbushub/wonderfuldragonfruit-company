import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { useCountry, useRegion } from '@/hooks/use-geo-pages';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Clock, ArrowLeft } from 'lucide-react';
import { isReservedTopLevelSlug } from '@/lib/reserved-slugs';
import NotFound from '@/pages/NotFound';

/**
 * Generic "Coming Soon" page for ALL region routes.
 * Region-level content is intentionally deferred — keep users on-site with a
 * clear message + paths back to country and contact pages, while still emitting
 * proper SEO metadata + noindex so search engines don't index thin pages.
 */
export default function RegionHub() {
  const { country: countrySlug, region: regionSlug } = useParams<{ country: string; region: string }>();

  if (isReservedTopLevelSlug(countrySlug)) return <NotFound />;

  const { data: country, isLoading: lc } = useCountry(countrySlug);
  const { data: region, isLoading: lr } = useRegion(country?.id, regionSlug);

  if (!lc && !country) return <NotFound />;
  if (!country) return null;

  // Pretty fallback name from slug if region row is missing
  const regionName =
    region?.name ||
    (regionSlug ? regionSlug.split('-').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ') : 'Region');

  const title = `${regionName}, ${country.name} – Coming Soon | DFSA`;
  const description = `Region-level dragon fruit farming pages for ${regionName}, ${country.name} are coming soon. In the meantime, explore the ${country.name} country hub.`;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={title.slice(0, 60)}
        description={description.slice(0, 155)}
        url={`/country/${countrySlug}/${regionSlug}`}
        noIndex
      />
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <Breadcrumbs
          items={[
            { label: country.name, href: `/country/${countrySlug}` },
            { label: regionName },
          ]}
          className="mb-6"
        />

        <Card className="p-8 md:p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
            <Clock className="h-8 w-8" />
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-3">
            <MapPin className="h-4 w-4" />
            <span>{regionName}, {country.name}</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">Coming Soon</h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            We're building dedicated dragon fruit farming resources for{' '}
            <strong>{regionName}</strong>. In the meantime, browse the {country.name} hub
            or get in touch with the DFSA team directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to={`/country/${countrySlug}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to {country.name}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/contact">Contact DFSA</Link>
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
