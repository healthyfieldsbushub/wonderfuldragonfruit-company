import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { useCountry } from '@/hooks/use-geo-pages';
import {
  useAgriMarkets, useAgriBuyers, useAgriGov, useAgriOrgs,
  useAgriProcessing, useAgriFeedItems,
} from '@/hooks/use-agri';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Building2, ShoppingBag, Landmark, Users, Factory, Newspaper, ExternalLink, MapPin, Phone, Mail, Globe } from 'lucide-react';

function ContactBlock({ item }: { item: any }) {
  return (
    <div className="space-y-1 text-sm text-muted-foreground">
      {item.physical_address && <div className="flex gap-2"><MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /><span>{item.physical_address}</span></div>}
      {item.phone && <div className="flex gap-2"><Phone className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /><a href={`tel:${item.phone}`}>{item.phone}</a></div>}
      {item.email && <div className="flex gap-2"><Mail className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /><a className="hover:text-primary" href={`mailto:${item.email}`}>{item.email}</a></div>}
      {item.website && <div className="flex gap-2"><Globe className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /><a className="hover:text-primary truncate" href={item.website} target="_blank" rel="noopener noreferrer">{item.website}</a></div>}
    </div>
  );
}

export default function AfricaCountry() {
  const { country: slug } = useParams<{ country: string }>();
  const { data: country, isLoading } = useCountry(slug);
  const { data: markets = [] } = useAgriMarkets(country?.id);
  const { data: buyers = [] } = useAgriBuyers(country?.id);
  const { data: gov = [] } = useAgriGov(country?.id);
  const { data: orgs = [] } = useAgriOrgs(country?.id);
  const { data: processing = [] } = useAgriProcessing(country?.id);
  const { data: feed = [] } = useAgriFeedItems(country?.iso_code ?? undefined, 12);

  if (isLoading) return <div className="min-h-screen"><Header /><div className="container mx-auto pt-24 px-4">Loading…</div></div>;
  if (!country) return <div className="min-h-screen"><Header /><div className="container mx-auto pt-24 px-4">Country not found.</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${country.name} Agricultural Markets, Buyers & Dragon Fruit Hub | DFSA`}
        description={`Directory of ${country.name} fresh produce markets, retail buyers, government agriculture bodies, organizations and dragon fruit market intelligence.`}
        keywords={`${country.name} agriculture, ${country.name} fresh produce markets, ${country.name} dragon fruit, ${country.name} retailers`}
        url={`/africa/${country.slug}`}
      />
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <Breadcrumbs items={[{ label: 'Africa', href: '/africa' }, { label: country.name }]} className="mb-6" />

        <section className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-5xl">{country.flag_emoji}</span>
            <div>
              <Badge variant="secondary" className="mb-1">{country.sub_region}</Badge>
              <h1 className="text-3xl md:text-4xl font-display font-bold">{country.name}</h1>
            </div>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            {country.intro || `${country.name}'s hub for fresh produce markets, buyers, government agriculture bodies, organizations and dragon fruit intelligence.`}
          </p>
        </section>

        <Tabs defaultValue="markets">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="markets"><Building2 className="h-4 w-4 mr-1" />Markets ({markets.length})</TabsTrigger>
            <TabsTrigger value="buyers"><ShoppingBag className="h-4 w-4 mr-1" />Buyers ({buyers.length})</TabsTrigger>
            <TabsTrigger value="government"><Landmark className="h-4 w-4 mr-1" />Government ({gov.length})</TabsTrigger>
            <TabsTrigger value="organizations"><Users className="h-4 w-4 mr-1" />Organizations ({orgs.length})</TabsTrigger>
            <TabsTrigger value="processing"><Factory className="h-4 w-4 mr-1" />Processing ({processing.length})</TabsTrigger>
            <TabsTrigger value="news"><Newspaper className="h-4 w-4 mr-1" />News ({feed.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="markets" className="mt-6">
            {markets.length === 0 ? <Empty label="market" /> : (
              <div className="grid md:grid-cols-2 gap-4">
                {markets.map((m: any) => (
                  <Card key={m.id} className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold">{m.name}</h3>
                      {m.is_featured && <Badge>Featured</Badge>}
                    </div>
                    {m.city && <div className="text-xs text-muted-foreground mb-2">{m.city}</div>}
                    <ContactBlock item={m} />
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="buyers" className="mt-6">
            {buyers.length === 0 ? <Empty label="buyer or retailer" /> : (
              <div className="grid md:grid-cols-2 gap-4">
                {buyers.map((b: any) => (
                  <Card key={b.id} className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold">{b.name}</h3>
                      <Badge variant="outline">{b.category.replace(/_/g, ' ')}</Badge>
                    </div>
                    <ContactBlock item={b} />
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="government" className="mt-6">
            {gov.length === 0 ? <Empty label="government body" /> : (
              <div className="grid md:grid-cols-2 gap-4">
                {gov.map((g: any) => (
                  <Card key={g.id} className="p-5">
                    <h3 className="font-semibold mb-1">{g.name}</h3>
                    <Badge variant="outline" className="mb-2">{g.level}</Badge>
                    <ContactBlock item={g} />
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="organizations" className="mt-6">
            {orgs.length === 0 ? <Empty label="organization" /> : (
              <div className="grid md:grid-cols-2 gap-4">
                {orgs.map((o: any) => (
                  <Card key={o.id} className="p-5">
                    <h3 className="font-semibold mb-1">{o.name}</h3>
                    {o.focus && <Badge variant="outline" className="mb-2">{o.focus}</Badge>}
                    <ContactBlock item={o} />
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="processing" className="mt-6">
            {processing.length === 0 ? <Empty label="processing facility" /> : (
              <div className="grid md:grid-cols-2 gap-4">
                {processing.map((p: any) => (
                  <Card key={p.id} className="p-5">
                    <h3 className="font-semibold mb-1">{p.name}</h3>
                    <Badge variant="outline" className="mb-2">{p.segment}</Badge>
                    <ContactBlock item={p} />
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="news" className="mt-6">
            {feed.length === 0 ? <Empty label="news item" /> : (
              <ul className="space-y-3">
                {feed.map((it: any) => (
                  <li key={it.id} className="border-l-2 border-primary/30 pl-4">
                    <a href={it.link} target="_blank" rel="noopener noreferrer"
                       className="font-medium hover:text-primary flex items-start gap-1">
                      {it.title}
                      <ExternalLink className="h-3 w-3 mt-1 flex-shrink-0" />
                    </a>
                    {it.summary && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{it.summary}</p>}
                    <div className="text-xs text-muted-foreground mt-1">
                      {it.published_at ? new Date(it.published_at).toLocaleDateString() : ''} · {it.country_scope}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-10 pt-6 border-t flex flex-wrap gap-3 text-sm">
          <Link to={`/${country.slug}`} className="text-primary hover:underline">
            See {country.name} dragon fruit farming hub →
          </Link>
        </div>
      </main>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <Card className="p-8 text-center text-muted-foreground">
      No {label} entries yet for this country. Admins can add them from the Agri Intelligence admin page.
    </Card>
  );
}
