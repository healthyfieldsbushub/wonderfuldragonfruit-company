import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { useCountries } from '@/hooks/use-geo-pages';
import { Card } from '@/components/ui/card';

export default function CountriesIndex() {
  const { data: countries = [] } = useCountries();

  const grouped = countries.reduce<Record<string, typeof countries>>((acc, c) => {
    (acc[c.sub_region] ||= []).push(c);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Dragon Fruit Farming Across Africa | DFSA Countries"
        description="Explore DFSA's Africa-wide dragon fruit farming network. Country and regional hubs, training, listings, markets and exports across SADC."
        url="/countries"
      />
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <Breadcrumbs items={[{ label: 'Countries' }]} className="mb-6" />
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-3">Countries</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mb-10">
          DFSA's growing network of dragon fruit farming hubs across Africa. Choose a country to
          explore regional pages, services, listings and market information.
        </p>

        {Object.entries(grouped).map(([sub, list]) => (
          <section key={sub} className="mb-10">
            <h2 className="text-2xl font-display font-bold mb-4">{sub}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {list.map(c => (
                <Link key={c.id} to={`/country/${c.slug}`}>
                  <Card className="p-4 text-center hover:border-primary transition-colors">
                    <div className="text-3xl mb-2">{c.flag_emoji}</div>
                    <div className="font-medium">{c.name}</div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
