import { Header } from '@/components/layout/Header';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FlaskConical, AlertTriangle, ArrowRight, BookOpen } from 'lucide-react';

const nutritionProfile = [
  { nutrient: 'Energy', per100g: '50–60 kcal', source: 'USDA FoodData Central (2023)' },
  { nutrient: 'Water', per100g: '~84 g', source: 'USDA FoodData Central' },
  { nutrient: 'Carbohydrates', per100g: '11–13 g', source: 'USDA FoodData Central' },
  { nutrient: 'Dietary Fibre', per100g: '1.8–3.0 g', source: 'USDA FoodData Central' },
  { nutrient: 'Protein', per100g: '1.1–1.2 g', source: 'USDA FoodData Central' },
  { nutrient: 'Vitamin C', per100g: '3–9 mg (varies by cultivar)', source: 'Mahattanatawee et al. (2006), J. Food Composition and Analysis' },
  { nutrient: 'Magnesium', per100g: '30–40 mg', source: 'USDA FoodData Central' },
  { nutrient: 'Iron', per100g: '0.6–1.9 mg', source: 'USDA FoodData Central; Stintzing et al. (2003)' },
  { nutrient: 'Calcium', per100g: '8–10 mg', source: 'USDA FoodData Central' },
  { nutrient: 'Betacyanins (red-fleshed)', per100g: '10–32 mg (varies significantly)', source: 'Wybraniec, S. & Mizrahi, Y. (2002), J. Chromatography A' },
];

const researchAreas = [
  { area: 'Antioxidant Activity', findings: 'Multiple in vitro studies have demonstrated antioxidant activity in dragon fruit extracts, particularly from red-fleshed varieties. Betacyanins and phenolic compounds have been identified as the primary contributors. However, in vitro antioxidant activity does not directly translate to clinical health benefits in humans.', evidenceLevel: 'Moderate (in vitro)', sources: ['Wu, L.C. et al. (2006). "Antioxidant and antiproliferative activities of red pitaya." Food Chemistry, 95(2), 319–327.', 'Tenore, G.C. et al. (2012). "Antioxidant and antimicrobial properties of polyphenolic fractions from pitaya." LWT, 46(1), 167–172.'] },
  { area: 'Blood Glucose', findings: 'Some animal studies suggest that dragon fruit extracts may have a modest effect on blood glucose regulation. A limited number of small human studies have been conducted. Results are preliminary and not sufficient for clinical recommendations.', evidenceLevel: 'Low-to-Moderate (animal + small human studies)', sources: ['Luu, T.T.H. et al. (2021). "Effects of Hylocereus polyrhizus extract on blood glucose levels in type 2 diabetic rats." J. Ethnopharmacology, 269, 113715.', 'Widianingsih, M. (2016). "Activity of Pitaya peel extract on glycaemic control." Indonesian Journal of Human Nutrition, 3(1).'] },
  { area: 'Prebiotic Potential', findings: 'Dragon fruit oligosaccharides have shown prebiotic-like properties in laboratory settings, supporting growth of beneficial gut bacteria (Bifidobacterium, Lactobacillus). Human dietary studies are limited.', evidenceLevel: 'Low (in vitro / preliminary)', sources: ['Wichienchot, S. et al. (2010). "Oligosaccharides of pitaya (dragon fruit)." Carbohydrate Polymers, 81(2), 227–230.'] },
  { area: 'Natural Food Colouring', findings: 'Betacyanin pigments from red-fleshed dragon fruit are commercially viable as natural food colorants, with applications in beverages, dairy products, and confectionery. This is one of the most established commercial applications beyond fresh consumption.', evidenceLevel: 'High (commercial application)', sources: ['Stintzing, F.C. & Carle, R. (2004). "Functional properties of anthocyanins and betalains in plants, food, and in human nutrition." Trends in Food Science & Technology, 15(1), 19–38.'] },
];

const DragonFruitResearchBenefits = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Dragon Fruit Research | Nutrition, Compounds & Findings"
        description="Summary of published research on dragon fruit: nutrition profile, compounds studied, and what evidence does (and doesn't) say."
        keywords="dragon fruit research, dragon fruit nutrition, pitaya health benefits, dragon fruit antioxidants, dragon fruit science"
        url="/dragon-fruit-research-benefits"
      />
      <Header />
      <CartSidebar />

      <main className="pt-20">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: 'Education', href: '/history-of-dragon-fruit' }, { label: 'Research & Benefits' }]} />
        </div>

        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-dragon-pink/10" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-4xl mx-auto">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <FlaskConical className="h-4 w-4" /> Educational Resource
              </span>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
                Scientific Research on Dragon Fruit: <span className="text-gradient-dragon">What Studies Show</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                An honest summary of what published scientific research tells us about dragon fruit nutrition, bioactive compounds, and potential applications.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="py-8">
          <div className="container mx-auto px-4 max-w-4xl">
            <Card className="border-l-4 border-l-yellow-500 bg-yellow-500/5">
              <CardContent className="p-6 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-foreground mb-1">Medical Disclaimer</p>
                  <p className="text-foreground/80 text-sm">This page summarises published research for educational purposes only. It is <strong>not medical advice</strong>. Dragon fruit is a food, not a medicine. Consult a qualified healthcare professional before making dietary changes for health conditions.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Nutrition */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-8">Nutrition Profile (per 100g fresh fruit)</h2>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-bold">Nutrient</th>
                        <th className="text-left p-4 font-bold">Per 100g</th>
                        <th className="text-left p-4 font-bold">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nutritionProfile.map((n, i) => (
                        <tr key={i} className="border-b last:border-b-0">
                          <td className="p-4 font-medium">{n.nutrient}</td>
                          <td className="p-4">{n.per100g}</td>
                          <td className="p-4 text-xs text-muted-foreground">{n.source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Research Areas */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-8">Key Research Areas</h2>
            <div className="space-y-6">
              {researchAreas.map((r, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <h3 className="font-bold text-lg">{r.area}</h3>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${r.evidenceLevel.includes('High') ? 'bg-primary/10 text-primary' : r.evidenceLevel.includes('Moderate') ? 'bg-yellow-500/10 text-yellow-700' : 'bg-orange-500/10 text-orange-700'}`}>
                        Evidence: {r.evidenceLevel}
                      </span>
                    </div>
                    <p className="text-foreground/80 mb-3">{r.findings}</p>
                    <div className="space-y-1">
                      {r.sources.map((s, j) => (
                        <p key={j} className="text-xs text-muted-foreground italic">• {s}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Limitations */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-8">Research Limitations</h2>
            <div className="prose prose-lg max-w-none">
              <ul className="space-y-3 text-foreground/80">
                <li><strong>In vitro ≠ in vivo:</strong> Many studies are laboratory-based (test tube / cell culture). Results do not automatically apply to human health.</li>
                <li><strong>Small sample sizes:</strong> Human studies on dragon fruit health effects are typically small and short-term.</li>
                <li><strong>Cultivar variation:</strong> Nutritional content varies significantly between white-fleshed, red-fleshed, and yellow-fleshed varieties.</li>
                <li><strong>Publication bias:</strong> Studies showing positive effects are more likely to be published than those showing no effect.</li>
                <li><strong>No drug-level claims:</strong> No regulatory authority (FDA, EFSA, SAHPRA) has approved dragon fruit for the treatment or prevention of any disease.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Sources */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-8">Sources</h2>
            <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
              <li>USDA FoodData Central (2023). "Dragon Fruit, Raw." <a href="https://fdc.nal.usda.gov" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">fdc.nal.usda.gov</a></li>
              <li>Wu, L.C. et al. (2006). <em>Food Chemistry</em>, 95(2), 319–327.</li>
              <li>Mahattanatawee, K. et al. (2006). <em>J. Food Composition and Analysis</em>, 19(6-7), 669–675.</li>
              <li>Stintzing, F.C. & Carle, R. (2004). <em>Trends in Food Science & Technology</em>, 15(1), 19–38.</li>
              <li>Wybraniec, S. & Mizrahi, Y. (2002). <em>J. Chromatography A</em>, 957(1), 41–47.</li>
              <li>Wichienchot, S. et al. (2010). <em>Carbohydrate Polymers</em>, 81(2), 227–230.</li>
              <li>Tenore, G.C. et al. (2012). <em>LWT</em>, 46(1), 167–172.</li>
            </ol>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/dragon-fruit-environmental-benefits" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">Environmental Benefits <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors">Shop Plants <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DragonFruitResearchBenefits;
