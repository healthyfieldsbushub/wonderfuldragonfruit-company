import { useParams, Navigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { useCountry } from '@/hooks/use-geo-pages';
import { COUNTRY_PAGES } from '@/lib/region-pages';
import { isReservedTopLevelSlug } from '@/lib/reserved-slugs';
import NotFound from '@/pages/NotFound';

export default function CountryPage() {
  const { country: countrySlug, page: pageSlug } = useParams<{ country: string; page: string }>();

  // Guard: never claim a top-level reserved route like /about/team.
  if (isReservedTopLevelSlug(countrySlug)) return <NotFound />;

  const { data: country, isLoading } = useCountry(countrySlug);
  const def = COUNTRY_PAGES.find(p => p.slug === pageSlug);

  if (!isLoading && (!country || !def)) return <NotFound />;
  if (!country || !def) return null;

  const title = `${def.title} – Dragon Fruit Farming ${country.name} | DFSA`;
  const description = `${def.title} for dragon fruit growers in ${country.name}. Find services, listings, markets and association support across the country.`;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={title.slice(0, 60)} description={description.slice(0, 155)} url={`/country/${countrySlug}/${pageSlug}`} />
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        <Breadcrumbs
          items={[
            { label: country.name, href: `/country/${countrySlug}` },
            { label: def.title },
          ]}
          className="mb-6"
        />
        <h1 className="text-4xl font-display font-bold mb-4">{def.title} in {country.name}</h1>
        <p className="text-lg text-muted-foreground mb-6">
          DFSA's {def.title.toLowerCase()} resources for dragon fruit growers and businesses across {country.name}.
        </p>
        <div className="prose prose-lg max-w-none">
          <p>
            {country.name} is part of the DFSA Africa-wide dragon fruit farming network.
            Explore region-specific listings, training, market access and association support
            tailored to growers in {country.name}. For region-level resources, choose your
            province or district from the {country.name} country hub.
          </p>
        </div>
      </main>
    </div>
  );
}
