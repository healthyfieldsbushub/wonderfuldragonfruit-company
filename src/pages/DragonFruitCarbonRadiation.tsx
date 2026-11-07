import { Header } from '@/components/layout/Header';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Leaf, Atom, Info } from 'lucide-react';

const evidenceLevels = [
  { level: 'Well-Established', color: 'bg-primary/10 text-primary', description: 'Supported by multiple peer-reviewed studies and scientific consensus.' },
  { level: 'Emerging', color: 'bg-yellow-500/10 text-yellow-700', description: 'Some evidence exists but more research is needed for definitive conclusions.' },
  { level: 'Unsubstantiated', color: 'bg-destructive/10 text-destructive', description: 'Claims not supported by credible scientific evidence.' },
];

const DragonFruitCarbonRadiation = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Dragon Fruit Carbon Uptake & Radiation Claims | Evidence Check"
        description="Carbon uptake and 'radiation' claims explained: what plants can and can't do, what science supports, and practical takeaways."
        keywords="dragon fruit carbon uptake, dragon fruit radiation, CAM photosynthesis carbon, dragon fruit claims evidence"
        url="/dragon-fruit-carbon-and-radiation-claims"
      />
      <Header />
      <CartSidebar />

      <main className="pt-20">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: 'Education', href: '/history-of-dragon-fruit' }, { label: 'Carbon & Radiation Claims' }]} />
        </div>

        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-dragon-pink/10" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-4xl mx-auto">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Atom className="h-4 w-4" /> Evidence-Based Analysis
              </span>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
                Carbon Uptake & Radiation: <span className="text-gradient-dragon">Evidence-Based Explanation</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Separating science from speculation — what dragon fruit plants can and cannot do regarding carbon capture and radiation-related claims.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Evidence Level Key */}
        <section className="py-8">
          <div className="container mx-auto px-4 max-w-4xl">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Info className="h-5 w-5 text-primary" /> Evidence Level Key</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  {evidenceLevels.map((e, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium shrink-0 ${e.color}`}>{e.level}</span>
                      <p className="text-xs text-muted-foreground">{e.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Carbon Uptake */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-8 flex items-center gap-3">
              <Leaf className="h-7 w-7 text-primary" /> Carbon Uptake in Dragon Fruit
            </h2>

            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h3 className="font-bold text-lg">Plants Absorb CO₂ Through Photosynthesis</h3>
                  <span className="text-xs px-3 py-1 rounded-full font-medium bg-primary/10 text-primary">Well-Established</span>
                </div>
                <p className="text-foreground/80 mb-3">
                  All plants absorb carbon dioxide (CO₂) from the atmosphere during photosynthesis and convert it into organic carbon compounds. This is fundamental plant biology established since the work of Calvin and Benson in the 1950s. Dragon fruit, as a photosynthesising plant, participates in this process.
                </p>
                <p className="text-xs text-muted-foreground italic">Source: Nobel, P.S. (2009). Physicochemical and Environmental Plant Physiology, 4th Ed., Academic Press.</p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h3 className="font-bold text-lg">CAM Photosynthesis & Nocturnal CO₂ Fixation</h3>
                  <span className="text-xs px-3 py-1 rounded-full font-medium bg-primary/10 text-primary">Well-Established</span>
                </div>
                <p className="text-foreground/80 mb-3">
                  Dragon fruit uses <strong>Crassulacean Acid Metabolism (CAM)</strong> photosynthesis. CAM plants open their stomata at night (when it is cooler and humidity is higher) to take in CO₂, which is temporarily stored as malic acid. During the day, this stored CO₂ is released internally and used in the Calvin cycle for carbon fixation. This process is well-documented in cactus biology.
                </p>
                <p className="text-foreground/80 mb-3">
                  The practical benefit of CAM is <strong>water efficiency</strong>, not extraordinary carbon capture. CAM plants lose less water per unit of carbon fixed compared to C3 and C4 plants, but their overall carbon fixation rate per unit of land area is typically <strong>lower</strong>, not higher, than fast-growing C3 or C4 crops.
                </p>
                <p className="text-xs text-muted-foreground italic">Source: Nobel, P.S. (1988). Environmental Biology of Agaves and Cacti, Cambridge University Press; Borland, A.M. et al. (2009). "Exploiting the potential of plants with crassulacean acid metabolism for bioenergy production on marginal lands." J. Experimental Botany, 60(10), 2879–2896.</p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h3 className="font-bold text-lg">Claims of "Superior Carbon Capture"</h3>
                  <span className="text-xs px-3 py-1 rounded-full font-medium bg-yellow-500/10 text-yellow-700">Emerging / Context-Dependent</span>
                </div>
                <p className="text-foreground/80 mb-3">
                  Some sources claim that dragon fruit or other CAM plants capture "more carbon" than other crops. This requires careful context:
                </p>
                <ul className="list-disc list-inside text-foreground/80 space-y-2 mb-3">
                  <li><strong>Per unit of water</strong>: CAM plants are more carbon-efficient per litre of water used. This is accurate.</li>
                  <li><strong>Per unit of land area</strong>: CAM plants typically fix less carbon per hectare than fast-growing C3 trees (e.g., eucalyptus) or C4 grasses. Claims of superior per-hectare carbon capture compared to forests are not supported by the scientific literature.</li>
                  <li><strong>On marginal land</strong>: On land too dry for conventional crops, CAM plants provide carbon fixation where other plants cannot survive. This is a valid niche benefit.</li>
                </ul>
                <p className="text-xs text-muted-foreground italic">Source: Borland, A.M. et al. (2009). J. Experimental Botany, 60(10); Lüttge, U. (2004). "Ecophysiology of Crassulacean Acid Metabolism (CAM)." Annals of Botany, 93(6), 629–652.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Radiation Claims */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-8 flex items-center gap-3">
              <Atom className="h-7 w-7 text-primary" /> "Radiation" Claims
            </h2>

            <Card className="border-l-4 border-l-yellow-500 bg-yellow-500/5 mb-6">
              <CardContent className="p-6 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-foreground/80 text-sm">
                  The term "radiation" in the context of dragon fruit appears in various online sources with different meanings. It is important to define what is being discussed before evaluating claims.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h3 className="font-bold text-lg">Electromagnetic Radiation (EMF) Absorption</h3>
                  <span className="text-xs px-3 py-1 rounded-full font-medium bg-destructive/10 text-destructive">Unsubstantiated</span>
                </div>
                <p className="text-foreground/80 mb-3">
                  Claims that dragon fruit plants "absorb radiation from electronic devices" or "reduce harmful electromagnetic radiation" are <strong>not supported by scientific evidence</strong>. No peer-reviewed study demonstrates that any houseplant, including cacti or dragon fruit, meaningfully absorbs or shields against electromagnetic fields from phones, computers, or WiFi routers.
                </p>
                <p className="text-foreground/80 mb-3">
                  This claim appears to originate from a misinterpretation of a 1998 study about cacti near computer monitors, which was not peer-reviewed and has not been replicated.
                </p>
                <p className="text-xs text-muted-foreground italic">Source: No credible peer-reviewed source supports this claim. See: Skeptical Inquirer; WHO Electromagnetic Fields and Public Health fact sheets. <a href="https://www.who.int/news-room/questions-and-answers/item/radiation-electromagnetic-fields" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">WHO Link</a></p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h3 className="font-bold text-lg">UV Radiation & Antioxidant Production</h3>
                  <span className="text-xs px-3 py-1 rounded-full font-medium bg-primary/10 text-primary">Well-Established</span>
                </div>
                <p className="text-foreground/80 mb-3">
                  Plants, including dragon fruit, produce antioxidant compounds (betacyanins, flavonoids, phenolic acids) partly in response to UV radiation from sunlight. This is a well-documented plant defence mechanism. However, this describes the plant's own physiology — it does not mean that <em>eating</em> the fruit protects humans from radiation.
                </p>
                <p className="text-xs text-muted-foreground italic">Source: Stintzing, F.C. & Carle, R. (2004). Trends in Food Science & Technology, 15(1), 19–38; Grotewold, E. (2006). "The genetics and biochemistry of floral pigments." Annual Review of Plant Biology, 57, 761–780.</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h3 className="font-bold text-lg">Food Irradiation for Export</h3>
                  <span className="text-xs px-3 py-1 rounded-full font-medium bg-primary/10 text-primary">Well-Established</span>
                </div>
                <p className="text-foreground/80 mb-3">
                  <strong>Food irradiation</strong> is a legitimate post-harvest treatment used on some exported dragon fruit to eliminate insect pests and extend shelf life. This process uses controlled doses of ionising radiation (gamma rays, electron beams, or X-rays) and is approved by the WHO, FAO, and Codex Alimentarius. Irradiated food does not become radioactive.
                </p>
                <p className="text-xs text-muted-foreground italic">Source: WHO (1999). "High-dose irradiation: Wholesomeness of food irradiated with doses above 10 kGy." WHO Technical Report 890; USDA APHIS phytosanitary treatment guidelines.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Sources */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-8">Sources</h2>
            <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
              <li>Nobel, P.S. (2009). <em>Physicochemical and Environmental Plant Physiology</em>, 4th Ed. Academic Press.</li>
              <li>Nobel, P.S. (1988). <em>Environmental Biology of Agaves and Cacti</em>. Cambridge University Press.</li>
              <li>Borland, A.M. et al. (2009). <em>J. Experimental Botany</em>, 60(10), 2879–2896.</li>
              <li>Lüttge, U. (2004). <em>Annals of Botany</em>, 93(6), 629–652.</li>
              <li>WHO (1999). Technical Report 890.</li>
              <li>WHO. "Electromagnetic fields and public health." <a href="https://www.who.int/news-room/questions-and-answers/item/radiation-electromagnetic-fields" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">who.int</a></li>
              <li>Stintzing, F.C. & Carle, R. (2004). <em>Trends in Food Science & Technology</em>, 15(1), 19–38.</li>
            </ol>
          </div>
        </section>

        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/dragon-fruit-environmental-benefits" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">Environmental Benefits <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/dragon-fruit-industry-growth" className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">Industry Growth <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DragonFruitCarbonRadiation;
