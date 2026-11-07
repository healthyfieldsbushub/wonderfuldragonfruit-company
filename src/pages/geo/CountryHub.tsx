import { useParams, Link, Navigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { useCountry, useRegions } from '@/hooks/use-geo-pages';
import { COUNTRY_PAGES } from '@/lib/region-pages';
import { Card } from '@/components/ui/card';
import { MapPin, ArrowRight, Store, ShoppingBag, Building2, FileText, Users, Info } from 'lucide-react';
import { isReservedTopLevelSlug } from '@/lib/reserved-slugs';
import NotFound from '@/pages/NotFound';

export default function CountryHub() {
  const { country: countrySlug } = useParams<{ country: string }>();

  // Guard: never claim a top-level reserved route like /about, /blog, /shop.
  if (isReservedTopLevelSlug(countrySlug)) return <NotFound />;

  const { data: country, isLoading } = useCountry(countrySlug);
  const { data: regions = [] } = useRegions(country?.id);

  if (!isLoading && !country) return <NotFound />;

  const title = country?.meta_title || `Dragon Fruit Farming in ${country?.name ?? ''} | DFSA`;
  const description = country?.meta_description ||
    `Africa's leading dragon fruit farming network in ${country?.name}. Growers, training, listings, exports and market prices across ${regions.length} regions.`;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={title.slice(0, 60)}
        description={description.slice(0, 155)}
        url={`/country/${countrySlug}`}
        keywords={(country?.keywords ?? []).join(', ')}
      />
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <Breadcrumbs items={[{ label: country?.name ?? '' }]} className="mb-6" />

        <section className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">{country?.flag_emoji}</span>
            <span className="text-sm uppercase tracking-wide text-muted-foreground">{country?.sub_region}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            {country?.hero_title || `Dragon Fruit Farming in ${country?.name}`}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            {country?.hero_subtitle || country?.intro || `Discover dragon fruit farming opportunities, growers and resources across ${country?.name}.`}
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-display font-bold mb-4">Country Resources</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {COUNTRY_PAGES.map(p => (
              <Link key={p.slug} to={`/country/${countrySlug}/${p.slug}`}>
                <Card className="p-4 text-center hover:bg-muted transition-colors">
                  <span className="font-medium">{p.title}</span>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-display font-bold mb-4">Regions ({regions.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regions.map(r => (
              <Link key={r.id} to={`/country/${countrySlug}/${r.slug}`}>
                <Card className="p-5 hover:border-primary transition-colors h-full">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-display font-bold text-lg">{r.name}</h3>
                      {r.capital_city && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" /> {r.capital_city}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* SEO internal-link block — descriptive anchors boost crawl depth and
            distribute link equity from this country hub to high-value pages. */}
        <section aria-labelledby="explore-dfsa" className="mt-14">
          <h2 id="explore-dfsa" className="text-2xl font-display font-bold mb-4">
            Explore DFSA in {country?.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                to: `/country/${countrySlug}/listings`,
                icon: Building2,
                title: `Dragon Fruit Listings in ${country?.name}`,
                desc: 'Growers, nurseries and traders directory.',
              },
              {
                to: `/country/${countrySlug}/markets`,
                icon: Store,
                title: `Fresh Produce Markets in ${country?.name}`,
                desc: 'Wholesale and retail dragon fruit markets.',
              },
              {
                to: '/products',
                icon: ShoppingBag,
                title: 'Shop Dragon Fruit Plants',
                desc: 'Premium cultivars shipped across Africa.',
              },
              {
                to: `/country/${countrySlug}/about`,
                icon: Info,
                title: `About DFSA in ${country?.name}`,
                desc: 'Our story, mission and Africa-wide network.',
              },
              {
                to: `/country/${countrySlug}/association`,
                icon: Users,
                title: `Join the DFSA Association`,
                desc: 'Member pricing, training and trade access.',
              },
              {
                to: `/country/${countrySlug}/terms`,
                icon: FileText,
                title: 'Terms of Service',
                desc: 'Ordering, shipping and refund policies.',
              },
            ].map(({ to, icon: Icon, title, desc }) => (
              <Link
                key={to + title}
                to={to}
                className="group block"
                title={title}
              >
                <Card className="h-full p-4 flex gap-3 items-start hover:border-primary transition-colors">
                  <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-medium leading-snug group-hover:text-primary transition-colors">
                      {title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
