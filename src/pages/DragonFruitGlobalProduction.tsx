import { Header } from '@/components/layout/Header';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Globe, TrendingUp, MapPin, ArrowRight, BookOpen } from 'lucide-react';

const topProducers = [
  { country: '🇻🇳 Vietnam', details: 'Largest global producer and exporter. Estimated 55,000+ hectares under cultivation as of 2020. Bình Thuận and Long An provinces are primary growing regions. Exports exceeded US $1.4 billion in 2021.', source: 'General Statistics Office of Vietnam (2021); Vietnam Ministry of Agriculture and Rural Development.' },
  { country: '🇨🇳 China', details: 'Second-largest producer globally. Guangxi, Guangdong, Hainan, and Yunnan provinces have expanded cultivation rapidly since 2010. China is also the world\'s largest importer of dragon fruit.', source: 'China Ministry of Agriculture and Rural Affairs; FAO Trade Data (FAOSTAT, 2022).' },
  { country: '🇮🇩 Indonesia', details: 'Significant production in Banyuwangi (East Java), Central Kalimantan, and Bali. Growing domestic market and export potential to Middle East and East Asia.', source: 'Indonesian Central Bureau of Statistics (BPS); Directorate General of Horticulture, Ministry of Agriculture Indonesia.' },
  { country: '🇹🇭 Thailand', details: 'Established producer with exports primarily to China, Hong Kong, and ASEAN markets. Chon Buri, Chanthaburi, and Nakhon Pathom are key growing areas.', source: 'Office of Agricultural Economics, Ministry of Agriculture and Cooperatives, Thailand.' },
  { country: '🇲🇽 Mexico', details: 'Native range of wild pitaya species. Commercial cultivation expanding, particularly in Puebla, Oaxaca, Quintana Roo, and Yucatán. Both yellow and red-fleshed varieties are grown.', source: 'SIAP (Servicio de Información Agroalimentaria y Pesquera), Mexico.' },
  { country: '🇮🇱 Israel', details: 'Pioneer in arid-climate dragon fruit cultivation. Research-driven production in the Negev Desert region. Key contributions to cultivar development and irrigation science.', source: 'Mizrahi, Y. et al. (various). Ben-Gurion University of the Negev research publications.' },
  { country: '🇨🇴 Colombia', details: 'Leading producer of yellow pitaya (Selenicereus megalanthus), exported primarily to Europe. Boyacá and Cundinamarca departments are major growing regions.', source: 'ASOHOFRUCOL (Colombian Fruit Growers Association); ProColombia export data.' },
  { country: '🇮🇳 India', details: 'Rapid expansion since 2018, driven by government subsidies in Gujarat, Maharashtra, Karnataka, and Telangana. National Horticulture Board supports cultivation.', source: 'National Horticulture Board, India; Indian Council of Agricultural Research (ICAR).' },
  { country: '🇿🇦 South Africa', details: 'Emerging producer with suitable climates in Limpopo, Mpumalanga, KwaZulu-Natal, and Western Cape. DFSA leads cultivar research and distribution with 50+ varieties.', source: 'DFSA records; South African Department of Agriculture, Land Reform and Rural Development.' },
];

const marketTrends = [
  { trend: 'Global Market Size', detail: 'The global dragon fruit market was valued at approximately US $4.4 billion in 2022 and is projected to reach US $9.1 billion by 2030, growing at a CAGR of roughly 9.4%.', source: 'Grand View Research (2023). "Dragon Fruit Market Size, Share & Trends Analysis Report."' },
  { trend: 'Demand Drivers', detail: 'Rising health consciousness, demand for exotic fruits, and use in beverages, smoothies, and food colouring are key growth drivers.', source: 'Allied Market Research (2022). "Exotic Fruits Market Report."' },
  { trend: 'Export Challenges', detail: 'Phytosanitary requirements, cold chain logistics, and shelf life (7–14 days post-harvest) remain challenges for exporting countries. Irradiation and hot water treatment are used for some markets.', source: 'USDA APHIS Phytosanitary Regulations; Paull, R.E. & Duarte, O. (2011). Tropical Fruits, 2nd Edition, CABI.' },
];

const DragonFruitGlobalProduction = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Dragon Fruit Countries | Where It's Grown & Top Suppliers"
        description="Which countries grow dragon fruit and who supplies the most? A practical overview of global production, exports, and market trends."
        keywords="dragon fruit production, dragon fruit countries, dragon fruit exporters, pitaya global market, dragon fruit suppliers"
        url="/dragon-fruit-global-production"
      />
      <Header />
      <CartSidebar />

      <main className="pt-20">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: 'Education', href: '/history-of-dragon-fruit' }, { label: 'Global Production' }]} />
        </div>

        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-dragon-pink/10" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-4xl mx-auto">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Globe className="h-4 w-4" /> Educational Resource
              </span>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
                Dragon Fruit Around the World: <span className="text-gradient-dragon">Growers & Suppliers</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                A practical overview of which countries grow dragon fruit commercially, who the top exporters are, and what the global market outlook means for African growers.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Top Producers */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-display font-bold mb-8">Top Dragon Fruit Producing Countries</h2>
            <div className="grid gap-6">
              {topProducers.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-2">{p.country}</h3>
                      <p className="text-foreground/80 mb-2">{p.details}</p>
                      <p className="text-xs text-muted-foreground italic">Source: {p.source}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Market Trends */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-8">Global Market Trends</h2>
            <div className="space-y-6">
              {marketTrends.map((t, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <h3 className="font-bold text-lg">{t.trend}</h3>
                    </div>
                    <p className="text-foreground/80 mb-2">{t.detail}</p>
                    <p className="text-xs text-muted-foreground italic">Source: {t.source}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* What it means for SA */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-8">What This Means for South African Growers</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-foreground/80 mb-4">
                South Africa is uniquely positioned in the global dragon fruit landscape. With suitable microclimates across Limpopo, Mpumalanga, KwaZulu-Natal, and parts of the Western Cape, the country can produce dragon fruit for both domestic consumption and export.
              </p>
              <p className="text-foreground/80 mb-4">
                <strong>Import substitution</strong> represents the immediate opportunity. South Africa imports dragon fruit from Vietnam and other Asian producers. Locally grown fruit can command premium prices due to freshness and reduced transport costs.
              </p>
              <p className="text-foreground/80 mb-4">
                <strong>Regional export</strong> to neighbouring SADC countries (Botswana, Namibia, Mozambique, Zambia, Zimbabwe) is a viable medium-term strategy, as these markets currently have limited local production.
              </p>
              <p className="text-foreground/80">
                <strong>DFSA's role</strong>: As the leading cultivar supplier in Africa with 50+ varieties, DFSA provides the planting material, technical guidance, and industry connections needed for growers to enter this market successfully.
              </p>
            </div>
          </div>
        </section>

        {/* Sources */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-8">Sources</h2>
            <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
              <li>General Statistics Office of Vietnam (2021). <a href="https://www.gso.gov.vn" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">gso.gov.vn</a></li>
              <li>FAOSTAT Trade Data (2022). <a href="https://www.fao.org/faostat" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">fao.org/faostat</a></li>
              <li>Grand View Research (2023). "Dragon Fruit Market Size, Share & Trends Analysis Report."</li>
              <li>Allied Market Research (2022). "Exotic Fruits Market Report."</li>
              <li>USDA APHIS. Phytosanitary Regulations for Imported Fruits. <a href="https://www.aphis.usda.gov" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">aphis.usda.gov</a></li>
              <li>Paull, R.E. & Duarte, O. (2011). <em>Tropical Fruits</em>, 2nd Edition. CABI Publishing.</li>
              <li>National Horticulture Board, India. <a href="https://nhb.gov.in" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">nhb.gov.in</a></li>
              <li>ProColombia. <a href="https://procolombia.co" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">procolombia.co</a></li>
            </ol>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-display font-bold mb-4">Continue Exploring</h2>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/dragon-fruit-industry-growth" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">Industry Growth <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/history-of-dragon-fruit" className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">History <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors">Shop Plants <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DragonFruitGlobalProduction;
