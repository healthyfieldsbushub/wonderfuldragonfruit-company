import { Header } from '@/components/layout/Header';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, Factory, Truck, Globe, ArrowRight } from 'lucide-react';

const demandDrivers = [
  { driver: 'Health & Wellness Trend', detail: 'Consumer demand for exotic, nutrient-rich fruits has grown steadily. Dragon fruit benefits from the "superfood" marketing trend, driven by its visual appeal and perceived health benefits.', source: 'Euromonitor International (2022). "Health and Wellness in Fresh Food: Global Overview."' },
  { driver: 'Food Processing & Colouring', detail: 'Betacyanin pigments from red-fleshed dragon fruit are used as natural food colourants in beverages, yoghurts, ice cream, and confectionery. The global shift away from synthetic dyes (E-numbers) creates demand for natural alternatives.', source: 'Stintzing, F.C. & Carle, R. (2004). Trends in Food Science & Technology, 15(1), 19–38; Grand View Research (2023).' },
  { driver: 'Dried Fruit & Snack Market', detail: 'Freeze-dried and dehydrated dragon fruit has become a popular snack and ingredient in trail mixes, granola, and smoothie bowls. The dried fruit market is projected to grow at 5–7% CAGR through 2030.', source: 'Allied Market Research (2022). "Dried Fruit Market Outlook."' },
  { driver: 'Beverage Industry', detail: 'Dragon fruit puree and concentrates are used in juices, smoothies, craft cocktails, energy drinks, and flavoured waters. Several major beverage companies have launched dragon fruit-flavoured products.', source: 'Industry observation; Mintel Global New Products Database (2023).' },
  { driver: 'Cosmetics & Skincare', detail: 'Dragon fruit seed oil and extracts are used in premium skincare products. The oil is rich in essential fatty acids (linoleic and linolenic acid) and is marketed for moisturising and antioxidant properties.', source: 'Ariffin, A.A. et al. (2009). "Essential fatty acids of pitaya (dragon fruit) seed oil." Food Chemistry, 114(2), 561–564.' },
];

const valueChainSteps = [
  { step: 'Nursery & Propagation', description: 'Cultivar selection, cutting propagation, and grafting. DFSA provides 50+ varieties adapted for African conditions.' },
  { step: 'Orchard Establishment', description: 'Trellising (A-frame, single-pole), drip irrigation setup, soil preparation. Typical establishment cost: R60,000–R120,000 per hectare in South Africa.' },
  { step: 'Production & Harvest', description: 'First fruit typically 12–18 months after planting. Full production from year 3. Hand-pollination for quality. 20–30 tonnes/hectare potential at maturity.' },
  { step: 'Post-Harvest & Packing', description: 'Sorting, grading, cold chain management. Shelf life 7–14 days refrigerated. Phytosanitary treatments for export.' },
  { step: 'Fresh Market', description: 'Domestic retail, food service, farmers markets. Premium pricing for locally grown fruit vs imports.' },
  { step: 'Processing', description: 'Puree, freeze-dried, powder, juice concentrate, natural colourant extraction. Adds value and extends shelf life.' },
  { step: 'Export', description: 'Regional SADC markets, Middle East, EU. Requires compliance with phytosanitary regulations, GlobalG.A.P. certification for major retailers.' },
];

const DragonFruitIndustryGrowth = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Dragon Fruit Industry Growth | Trends, Demand & Opportunities"
        description="Dragon fruit industry overview: demand drivers, supply trends, and what growers should watch. Practical, SA-friendly insights."
        keywords="dragon fruit industry, dragon fruit market growth, dragon fruit demand, dragon fruit business opportunity, pitaya market"
        url="/dragon-fruit-industry-growth"
      />
      <Header />
      <CartSidebar />

      <main className="pt-20">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: 'Education', href: '/history-of-dragon-fruit' }, { label: 'Industry Growth' }]} />
        </div>

        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-dragon-pink/10" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-4xl mx-auto">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <TrendingUp className="h-4 w-4" /> Industry Analysis
              </span>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
                Dragon Fruit Industry Growth: <span className="text-gradient-dragon">What's Driving Demand</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                A practical overview of the global dragon fruit industry — demand drivers, value chain, processing opportunities, and what this means for South African and African growers.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Market Overview */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-8">Global Market Overview</h2>
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="grid gap-6 md:grid-cols-3 text-center">
                  <div>
                    <p className="text-3xl font-bold text-primary">~US $4.4B</p>
                    <p className="text-sm text-muted-foreground">Market Size (2022)</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary">~9.4%</p>
                    <p className="text-sm text-muted-foreground">Projected CAGR to 2030</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary">~US $9.1B</p>
                    <p className="text-sm text-muted-foreground">Projected Market (2030)</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic text-center mt-4">Source: Grand View Research (2023). "Dragon Fruit Market Size, Share & Trends Analysis Report."</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Demand Drivers */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-8">Key Demand Drivers</h2>
            <div className="space-y-6">
              {demandDrivers.map((d, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-2">{d.driver}</h3>
                    <p className="text-foreground/80 mb-2">{d.detail}</p>
                    <p className="text-xs text-muted-foreground italic">Source: {d.source}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Value Chain */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-8">Dragon Fruit Value Chain</h2>
            <div className="space-y-4">
              {valueChainSteps.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                  <Card>
                    <CardContent className="p-4 flex items-start gap-4">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">{i + 1}</span>
                      <div>
                        <h3 className="font-bold">{s.step}</h3>
                        <p className="text-sm text-foreground/80">{s.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Export Considerations */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-8">Export Considerations for SA Growers</h2>
            <div className="prose prose-lg max-w-none">
              <ul className="space-y-3 text-foreground/80">
                <li><strong>Phytosanitary compliance</strong>: South African exports must meet DALRRD (Department of Agriculture, Land Reform and Rural Development) phytosanitary standards plus the importing country's requirements.</li>
                <li><strong>Certification</strong>: GlobalG.A.P. certification is typically required by EU and UK retail chains. HACCP certification is recommended for processed products.</li>
                <li><strong>Cold chain</strong>: Dragon fruit should be stored at 5–10°C. Shelf life under proper cold chain is 14–21 days. Breaks in the cold chain significantly reduce quality and shelf life.</li>
                <li><strong>SADC opportunities</strong>: Neighbouring markets (Botswana, Namibia, Mozambique, Zambia, Zimbabwe) represent near-term export opportunities with lower logistical barriers than intercontinental export.</li>
                <li><strong>African Continental Free Trade Area (AfCFTA)</strong>: The AfCFTA, operational since 2021, may reduce tariff barriers for intra-African agricultural trade over time.</li>
              </ul>
              <p className="text-xs text-muted-foreground italic mt-4">Sources: DALRRD phytosanitary guidelines; AfCFTA Secretariat (<a href="https://au-afcfta.org" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">au-afcfta.org</a>); GlobalG.A.P. (<a href="https://www.globalgap.org" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">globalgap.org</a>).</p>
            </div>
          </div>
        </section>

        {/* Sources */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-8">Sources</h2>
            <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
              <li>Grand View Research (2023). "Dragon Fruit Market Size, Share & Trends Analysis Report."</li>
              <li>Allied Market Research (2022). "Dried Fruit Market Outlook."</li>
              <li>Euromonitor International (2022). "Health and Wellness in Fresh Food."</li>
              <li>Stintzing, F.C. & Carle, R. (2004). <em>Trends in Food Science & Technology</em>, 15(1), 19–38.</li>
              <li>Ariffin, A.A. et al. (2009). <em>Food Chemistry</em>, 114(2), 561–564.</li>
              <li>AfCFTA Secretariat. <a href="https://au-afcfta.org" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">au-afcfta.org</a></li>
              <li>GlobalG.A.P. <a href="https://www.globalgap.org" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">globalgap.org</a></li>
            </ol>
          </div>
        </section>

        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/africa-fruit-and-vegetable-markets" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">Africa Markets Directory <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/consultations" className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">Book Consultation <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors">Shop Plants <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DragonFruitIndustryGrowth;
