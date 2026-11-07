import { Header } from '@/components/layout/Header';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Globe, ExternalLink, ArrowRight, Mail, AlertTriangle } from 'lucide-react';

interface MarketListing {
  name: string;
  city: string;
  type: string;
  website: string | null;
  notes?: string;
}

const southAfricaMarkets: MarketListing[] = [
  { name: 'Tshwane Fresh Produce Market (Pretoria)', city: 'Pretoria, Gauteng', type: 'Municipal Fresh Produce Market', website: 'https://www.tshwanemarket.co.za', notes: 'One of the largest fresh produce markets in Africa. Handles over 300,000 tonnes annually.' },
  { name: 'Johannesburg Fresh Produce Market (City Deep)', city: 'Johannesburg, Gauteng', type: 'Municipal Fresh Produce Market', website: 'https://www.joburgmarket.co.za', notes: 'The largest fresh produce market in Africa by volume. Operated by Joburg Market SOC Ltd.' },
  { name: 'Cape Town Market (Epping)', city: 'Cape Town, Western Cape', type: 'Municipal Fresh Produce Market', website: 'https://www.capetownmarket.co.za', notes: 'Major market serving the Western Cape region. Fresh fruit, vegetables, and flowers.' },
  { name: 'Durban Fresh Produce Market (Clairwood)', city: 'Durban, KwaZulu-Natal', type: 'Municipal Fresh Produce Market', website: 'https://www.durbanfreshproducemarket.co.za', notes: 'Primary market for KwaZulu-Natal. Operated by eThekwini Municipality.' },
  { name: 'Springs Fresh Produce Market', city: 'Springs, Gauteng', type: 'Municipal Fresh Produce Market', website: null, notes: 'Official site not found; contact details pending verification. Operated by Ekurhuleni Metropolitan Municipality.' },
  { name: 'Pietermaritzburg Fresh Produce Market', city: 'Pietermaritzburg, KwaZulu-Natal', type: 'Municipal Fresh Produce Market', website: null, notes: 'Official site not found; contact details pending verification. Operated by Msunduzi Municipality.' },
  { name: 'Bloemfontein Fresh Produce Market', city: 'Bloemfontein, Free State', type: 'Municipal Fresh Produce Market', website: null, notes: 'Official site not found; contact details pending verification. Operated by Mangaung Metropolitan Municipality.' },
  { name: 'East London Fresh Produce Market', city: 'East London, Eastern Cape', type: 'Municipal Fresh Produce Market', website: null, notes: 'Official site not found; contact details pending verification. Operated by Buffalo City Metropolitan Municipality.' },
  { name: 'Nelson Mandela Bay Fresh Produce Market', city: 'Port Elizabeth, Eastern Cape', type: 'Municipal Fresh Produce Market', website: null, notes: 'Official site not found; contact details pending verification.' },
  { name: 'Institute of Market Agents of South Africa (IMASA)', city: 'National', type: 'Industry Body', website: 'https://www.imasa.co.za', notes: 'National body representing fresh produce market agents across South Africa.' },
];

const zambiaMarkets: MarketListing[] = [
  { name: 'Lusaka City Market (Soweto Market)', city: 'Lusaka', type: 'Municipal Market', website: null, notes: 'Lusaka\'s largest open market. Official site not found; contact details pending verification.' },
  { name: 'Zambia National Farmers\' Union (ZNFU)', city: 'Lusaka', type: 'Farmers\' Union / Industry Body', website: 'https://www.znfu.org.zm', notes: 'National farmers\' union providing market linkages, advocacy, and agricultural services.' },
  { name: 'Zambia Development Agency (ZDA)', city: 'Lusaka', type: 'Government Agency', website: 'https://www.zda.org.zm', notes: 'Promotes investment in agriculture and agribusiness. Provides market access support.' },
  { name: 'COMESA (Common Market for Eastern and Southern Africa)', city: 'Lusaka (Secretariat)', type: 'Regional Trade Body', website: 'https://www.comesa.int', notes: 'Regional trading bloc facilitating cross-border agricultural trade.' },
];

const zimbabweMarkets: MarketListing[] = [
  { name: 'Mbare Musika Market', city: 'Harare', type: 'Municipal Wholesale Market', website: null, notes: 'Zimbabwe\'s largest fresh produce market. Official site not found; contact details pending verification.' },
  { name: 'Bulawayo Municipal Market', city: 'Bulawayo', type: 'Municipal Market', website: null, notes: 'Official site not found; contact details pending verification. Operated by Bulawayo City Council.' },
  { name: 'Horticultural Promotion Council (HPC)', city: 'Harare', type: 'Industry Body', website: null, notes: 'Official site not found; contact details pending verification. Promotes horticulture development in Zimbabwe.' },
  { name: 'Zimbabwe Agricultural Society', city: 'Harare', type: 'Agricultural Society', website: 'https://www.zas.co.zw', notes: 'Organises the Zimbabwe Agricultural Show. Platform for agricultural networking.' },
  { name: 'Agricultural Marketing Authority (AMA)', city: 'Harare', type: 'Government Authority', website: 'https://www.ama.co.zw', notes: 'Regulates and promotes orderly marketing of agricultural products in Zimbabwe.' },
];

const restOfAfricaMarkets: MarketListing[] = [
  { name: 'Kenya National Farmers\' Federation (KENAFF)', city: 'Nairobi, Kenya', type: 'Farmers\' Federation', website: 'https://www.kenaff.org', notes: 'National farmers\' organisation providing market linkages across Kenya.' },
  { name: 'Nairobi City Market', city: 'Nairobi, Kenya', type: 'Municipal Market', website: null, notes: 'Official site not found; contact details pending verification.' },
  { name: 'Tanzania Horticultural Association (TAHA)', city: 'Arusha, Tanzania', type: 'Industry Body', website: 'https://www.taha.or.tz', notes: 'Supports horticultural producers with market access, quality standards, and logistics.' },
  { name: 'Uganda National Farmers\' Federation (UNFFE)', city: 'Kampala, Uganda', type: 'Farmers\' Federation', website: 'https://www.unffe.org', notes: 'Represents farmers across Uganda. Provides agricultural market information.' },
  { name: 'Maputo Municipal Markets', city: 'Maputo, Mozambique', type: 'Municipal Markets', website: null, notes: 'Official site not found; contact details pending verification. Key market for fresh produce in southern Mozambique.' },
  { name: 'National Agricultural Marketing Board (NAMBOARD) – Malawi', city: 'Lilongwe, Malawi', type: 'Government Body', website: null, notes: 'Official site not found; contact details pending verification. Government body for agricultural marketing.' },
  { name: 'Botswana National Agricultural Marketing Board', city: 'Gaborone, Botswana', type: 'Government Body', website: null, notes: 'Official site not found; contact details pending verification.' },
  { name: 'NAMBoard Namibia (Namibian Agronomic Board)', city: 'Windhoek, Namibia', type: 'Government Body', website: 'https://www.nab.com.na', notes: 'Regulates the marketing of controlled agronomic produce in Namibia.' },
  { name: 'Ghana Vegetable Growers & Exporters Association', city: 'Accra, Ghana', type: 'Industry Body', website: null, notes: 'Official site not found; contact details pending verification.' },
  { name: 'Ethiopian Horticulture Producer Exporters Association (EHPEA)', city: 'Addis Ababa, Ethiopia', type: 'Industry Body', website: 'https://www.ehpea.org', notes: 'Promotes Ethiopian horticultural exports including fruits and vegetables.' },
];

const MarketTable = ({ markets, regionTitle }: { markets: MarketListing[]; regionTitle: string }) => (
  <div className="mb-12">
    <h3 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
      <MapPin className="h-5 w-5 text-primary" /> {regionTitle}
    </h3>
    <div className="space-y-4">
      {markets.map((m, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-foreground">{m.name}</h4>
                <p className="text-sm text-muted-foreground">{m.city} · {m.type}</p>
                {m.notes && <p className="text-sm text-foreground/70 mt-1">{m.notes}</p>}
              </div>
              {m.website ? (
                <a href={m.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline shrink-0">
                  <ExternalLink className="h-3 w-3" /> Official Site
                </a>
              ) : (
                <span className="text-xs text-muted-foreground italic shrink-0">No verified URL</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const AfricaFruitMarkets = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Africa Fruit & Vegetable Markets | Directory of Official Links"
        description="A practical directory of fruit and vegetable markets across Africa, including South Africa, Zambia, Zimbabwe and more. Official links and notes."
        keywords="africa fruit markets, south africa fresh produce markets, zambia markets, zimbabwe markets, african agricultural markets"
        url="/africa-fruit-and-vegetable-markets"
      />
      <Header />
      <CartSidebar />

      <main className="pt-20">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: 'Education', href: '/history-of-dragon-fruit' }, { label: 'Africa Markets Directory' }]} />
        </div>

        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-dragon-pink/10" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-4xl mx-auto">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Globe className="h-4 w-4" /> Market Directory
              </span>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
                Africa Fruit & Vegetable Markets <span className="text-gradient-dragon">Directory</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                A practical directory of fruit and vegetable markets, industry bodies, and agricultural organisations across Africa. Official links included where verified.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Verification Note */}
        <section className="py-8">
          <div className="container mx-auto px-4 max-w-5xl">
            <Card className="border-l-4 border-l-yellow-500 bg-yellow-500/5">
              <CardContent className="p-6 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-foreground/80 text-sm">
                  <strong>Link verification note:</strong> We verify all links before publishing. Where an official website could not be confirmed, we note "Official site not found; contact details pending verification." If you know the correct URL for any listing, please use the "Suggest a Market" form below.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <MarketTable markets={southAfricaMarkets} regionTitle="South Africa" />
            <MarketTable markets={zambiaMarkets} regionTitle="Zambia" />
            <MarketTable markets={zimbabweMarkets} regionTitle="Zimbabwe" />
            <MarketTable markets={restOfAfricaMarkets} regionTitle="Rest of Africa" />
          </div>
        </section>

        {/* Suggest a Market CTA */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl font-display font-bold mb-4">Suggest a Market</h2>
            <p className="text-muted-foreground mb-6">
              Know a fruit or vegetable market that should be listed here? Help us build Africa's most comprehensive agricultural market directory. We verify all submissions before publishing.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                <Mail className="h-4 w-4" /> Suggest a Market
              </Link>
              <Link to="/directory" className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors">
                Business Directory <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/dragon-fruit-global-production" className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">Global Production <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/dragon-fruit-industry-growth" className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">Industry Growth <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors">Shop Plants <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AfricaFruitMarkets;
