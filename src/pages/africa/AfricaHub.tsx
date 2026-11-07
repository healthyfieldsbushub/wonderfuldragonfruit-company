import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { useCountries } from '@/hooks/use-geo-pages';
import { useAgriFeedItems, useDragonFruitPrices } from '@/hooks/use-agri';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, TrendingUp, Newspaper } from 'lucide-react';

const SUB_ORDER = ['Southern Africa', 'East Africa', 'West Africa', 'Central Africa', 'North Africa'];

export default function AfricaHub() {
  const { data: countries = [] } = useCountries();
  const { data: feed = [] } = useAgriFeedItems(undefined, 12);
  const { data: prices = [] } = useDragonFruitPrices(8);

  const grouped = countries.reduce<Record<string, typeof countries>>((acc, c) => {
    (acc[c.sub_region] ||= []).push(c);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Africa Agricultural Markets & Dragon Fruit Intelligence | DFSA"
        description="Africa-wide hub for fresh produce markets, retail buyers, exporters, government bodies and live dragon fruit market intelligence across all 54 African countries."
        keywords="african agriculture, fresh produce markets africa, dragon fruit prices africa, agri exporters, african retailers"
        url="/africa"
      />
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <Breadcrumbs items={[{ label: 'Africa' }]} className="mb-6" />

        <section className="mb-12 text-center max-w-4xl mx-auto">
          <Badge className="mb-4">54 Countries · Live Markets</Badge>
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-4">
            Africa Agricultural Markets & Dragon Fruit Intelligence
          </h1>
          <p className="text-lg text-muted-foreground">
            A continental directory of fresh produce markets, retail buyers, exporters,
            government bodies and processing facilities — paired with live news feeds
            and dragon fruit price intelligence.
          </p>
        </section>

        {/* Live snapshots row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-12">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-display font-bold">Latest Dragon Fruit Prices</h2>
            </div>
            {prices.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No price snapshots yet. Admins can add them from the admin panel or via
                scheduled feed ingestion.
              </p>
            ) : (
              <ul className="divide-y">
                {prices.map((p: any) => (
                  <li key={p.id} className="py-2 flex items-center justify-between text-sm">
                    <span>
                      <strong>{p.currency} {Number(p.price_per_kg).toFixed(2)}/kg</strong>
                      {p.variety && <span className="text-muted-foreground"> · {p.variety}</span>}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {p.wholesale_or_retail} · {new Date(p.recorded_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Newspaper className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-display font-bold">Latest Agri News</h2>
            </div>
            {feed.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Feed cache is empty. Admins can run "Refresh feeds" from the Agri Intelligence admin page.
              </p>
            ) : (
              <ul className="divide-y">
                {feed.slice(0, 6).map((it: any) => (
                  <li key={it.id} className="py-2">
                    <a href={it.link} target="_blank" rel="noopener noreferrer"
                       className="text-sm font-medium hover:text-primary flex items-start gap-1">
                      <span className="line-clamp-2">{it.title}</span>
                      <ExternalLink className="h-3 w-3 mt-1 flex-shrink-0" />
                    </a>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {it.published_at ? new Date(it.published_at).toLocaleDateString() : ''} · {it.country_scope}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Countries grouped */}
        {SUB_ORDER.filter(s => grouped[s]?.length).map(sub => (
          <section key={sub} className="mb-10">
            <h2 className="text-2xl font-display font-bold mb-4">{sub}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {grouped[sub].map(c => (
                <Link key={c.id} to={`/africa/${c.slug}`}>
                  <Card className="p-4 text-center hover:border-primary transition-colors">
                    <div className="text-3xl mb-2">{c.flag_emoji}</div>
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.iso_code}</div>
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
