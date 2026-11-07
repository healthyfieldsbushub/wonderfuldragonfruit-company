import { Header } from '@/components/layout/Header';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Award, Droplets, Sun, Leaf, ArrowRight, BookOpen, AlertTriangle } from 'lucide-react';

const records = [
  { weight: '~1.5 kg (3.3 lbs)', variety: 'Reported from Vietnam', note: 'Various agricultural fairs in Vietnam have displayed exceptionally large Hylocereus specimens. Exact verification is limited as Guinness World Records does not currently maintain a specific "largest dragon fruit" category.', source: 'Reported by Vietnamese agricultural media; not independently verified by Guinness World Records as of 2024.' },
  { weight: '~1.3 kg (2.9 lbs)', variety: 'Physical Graffiti (Hylocereus hybrid)', note: 'Large-fruited hybrid cultivars such as Physical Graffiti and American Beauty have been reported to produce individual fruits exceeding 1 kg under optimal growing conditions.', source: 'Grower reports documented by the Rare Fruit Council International and Tropical Fruit Forum communities.' },
  { weight: '~1.0 kg (2.2 lbs)', variety: 'Various cultivars', note: 'Fruits in the 800g–1,000g range are achievable with proper hand-pollination, adequate irrigation, and appropriate nutrient management. This is considered the upper range of commercially viable fruit.', source: 'Crane, J.H. & Balerdi, C.F. (2005). University of Florida IFAS Extension; DFSA field observations.' },
];

const growingFactors = [
  { factor: 'Pollination', icon: <Leaf className="h-5 w-5 text-primary" />, detail: 'Cross-pollination (using pollen from a different cultivar) consistently produces larger, more uniform fruit than self-pollination. Hand-pollination at night (when flowers are open, typically 8 PM–6 AM) is standard practice for commercial growers seeking larger fruit.', source: 'Weiss, J., Nerd, A. & Mizrahi, Y. (1994). "Flowering Behavior and Pollination Requirements in Climbing Cacti with Fruit Crop Potential." HortScience, 29(12), 1487–1492.' },
  { factor: 'Irrigation', icon: <Droplets className="h-5 w-5 text-primary" />, detail: 'Dragon fruit requires 3–5 litres per plant per day during the fruiting season in semi-arid conditions, adjusted for rainfall. Drip irrigation is recommended. Over-watering causes fruit splitting; under-watering reduces fruit size. During non-fruiting periods, 1–2 litres/day is typically sufficient.', source: 'Mizrahi, Y. et al. (2002). Ben-Gurion University of the Negev; Zee, F. et al. (2004). University of Hawaii CTAHR.' },
  { factor: 'Nutrition', icon: <Leaf className="h-5 w-5 text-primary" />, detail: 'Balanced NPK fertilisation (with emphasis on potassium during fruiting) supports larger fruit development. Recommended application: 200–300g of 3:1:5 or 2:3:4 fertiliser per plant per quarter for mature plants. Organic compost and foliar micronutrient sprays (zinc, boron, manganese) are also beneficial.', source: 'Nerd, A., Tel-Zur, N. & Mizrahi, Y. (2002). In Cacti: Biology and Uses, UC Press; DFSA grower guidelines.' },
  { factor: 'Temperature', icon: <Sun className="h-5 w-5 text-primary" />, detail: 'Optimal fruit development occurs at daytime temperatures of 25–35°C and nighttime temperatures of 18–25°C. Temperatures below 10°C can damage fruit and stems. Temperatures consistently above 40°C can cause sunburn on exposed fruit.', source: 'Le Bellec, F. et al. (2006). Fruits, 61(4), 237–250; Lim, T.K. (2012). Edible Medicinal and Non-Medicinal Plants, Vol. 1, Springer.' },
  { factor: 'Thinning', icon: <Leaf className="h-5 w-5 text-primary" />, detail: 'Removing excess fruitlets (thinning to 2–3 fruits per branch tip per flush) redirects plant energy to fewer, larger fruits. Without thinning, plants produce more but smaller fruit.', source: 'Standard horticultural practice documented in Crane & Balerdi (2005), UF IFAS Extension.' },
];

const LargestDragonFruitRecord = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Largest Dragon Fruit Ever | Record Sizes & What Affects Size"
        description="A factual look at record-size dragon fruit reports, what affects fruit size, and realistic expectations for growers."
        keywords="largest dragon fruit, biggest dragon fruit, dragon fruit record, dragon fruit size, how to grow large dragon fruit"
        url="/largest-dragon-fruit-record"
      />
      <Header />
      <CartSidebar />

      <main className="pt-20">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: 'Education', href: '/history-of-dragon-fruit' }, { label: 'Largest Dragon Fruit Record' }]} />
        </div>

        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-dragon-pink/10" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-4xl mx-auto">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Award className="h-4 w-4" /> Educational Resource
              </span>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
                Largest Dragon Fruit: <span className="text-gradient-dragon">Records, Reality & Growing Factors</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                What are the biggest dragon fruits ever grown? We examine reported records with honest citations, then explain the horticultural factors that actually determine fruit size.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Note on records */}
        <section className="py-8">
          <div className="container mx-auto px-4 max-w-4xl">
            <Card className="border-l-4 border-l-yellow-500 bg-yellow-500/5">
              <CardContent className="p-6 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-foreground mb-1">Note on Record Verification</p>
                  <p className="text-foreground/80 text-sm">As of 2024, Guinness World Records does not maintain a specific category for "largest dragon fruit." The records listed below are based on agricultural fair reports, grower communities, and media coverage. Independent scientific verification is limited.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Records */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-8">Reported Record Sizes</h2>
            <div className="grid gap-6">
              {records.map((r, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl font-bold text-primary">{r.weight}</span>
                      <span className="text-sm text-muted-foreground">— {r.variety}</span>
                    </div>
                    <p className="text-foreground/80 mb-2">{r.note}</p>
                    <p className="text-xs text-muted-foreground italic">Source: {r.source}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Growing Factors */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-8">What Actually Affects Fruit Size</h2>
            <div className="space-y-6">
              {growingFactors.map((f, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      {f.icon}
                      <h3 className="font-bold text-lg">{f.factor}</h3>
                    </div>
                    <p className="text-foreground/80 mb-2">{f.detail}</p>
                    <p className="text-xs text-muted-foreground italic">Source: {f.source}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Realistic Expectations */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-8">Realistic Expectations for Growers</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-foreground/80 mb-4">
                For commercial growers, the target should be consistent fruit quality rather than record size. Most commercial dragon fruit weighs between <strong>300g and 700g</strong>. Fruit in this range typically has the best flavour-to-size ratio, the best shelf life, and meets export market specifications.
              </p>
              <p className="text-foreground/80">
                Consistently producing fruit above 500g requires attention to all the factors described above: correct cultivar selection, cross-pollination, disciplined irrigation, balanced nutrition, fruit thinning, and appropriate microclimate management.
              </p>
            </div>
          </div>
        </section>

        {/* Sources */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-8">Sources</h2>
            <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
              <li>Weiss, J., Nerd, A. & Mizrahi, Y. (1994). "Flowering Behavior and Pollination Requirements in Climbing Cacti." <em>HortScience</em>, 29(12), 1487–1492.</li>
              <li>Crane, J.H. & Balerdi, C.F. (2005). University of Florida IFAS Extension, HS1068. <a href="https://edis.ifas.ufl.edu/publication/HS303" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Link</a></li>
              <li>Zee, F., Yen, C.R. & Nishina, M. (2004). "Pitaya (Dragon Fruit)." University of Hawaii CTAHR. <a href="https://www.ctahr.hawaii.edu" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">ctahr.hawaii.edu</a></li>
              <li>Le Bellec, F. et al. (2006). <em>Fruits</em>, 61(4), 237–250.</li>
              <li>Lim, T.K. (2012). <em>Edible Medicinal and Non-Medicinal Plants</em>, Vol. 1. Springer.</li>
              <li>Nerd, A., Tel-Zur, N. & Mizrahi, Y. (2002). In <em>Cacti: Biology and Uses</em>, UC Press.</li>
            </ol>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/dragon-fruit-research-benefits" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">Research & Benefits <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/consultations" className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">Book a Consultation <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LargestDragonFruitRecord;
