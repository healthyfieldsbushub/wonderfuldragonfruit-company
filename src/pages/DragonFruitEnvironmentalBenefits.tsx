import { Header } from '@/components/layout/Header';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Leaf, Droplets, Sun, Bug, TreePine, ArrowRight } from 'lucide-react';

const sections = [
  {
    icon: <Droplets className="h-6 w-6 text-primary" />,
    title: 'Water-Wise Irrigation',
    content: `Dragon fruit (Hylocereus spp.) is a cactus-family plant that requires significantly less water than many conventional fruit crops. Under drip irrigation in semi-arid conditions:

• **Mature plant water requirement**: 3–5 litres per plant per day during fruiting season; 1–2 litres per day during dormancy.
• **Comparison**: Citrus orchards typically require 40–60 litres per tree per day; avocado trees 50–70 litres per day (FAO Irrigation and Drainage Paper 56).
• **CAM photosynthesis**: As a member of the Cactaceae family, dragon fruit uses Crassulacean Acid Metabolism (CAM), opening stomata at night to reduce daytime water loss through transpiration.

For South African conditions, this makes dragon fruit particularly suitable for water-scarce regions in Limpopo, the Northern Cape, and parts of the Free State.`,
    source: 'FAO (1998). Irrigation and Drainage Paper 56; Nobel, P.S. (1988). Environmental Biology of Agaves and Cacti, Cambridge University Press; Mizrahi, Y. et al. (1997). Journal of the Professional Association for Cactus Development, 2, 36–48.'
  },
  {
    icon: <Leaf className="h-6 w-6 text-primary" />,
    title: 'Soil Health & Erosion Control',
    content: `Dragon fruit's extensive root system helps bind soil, reducing erosion on slopes and in areas vulnerable to wind erosion.

• **Root coverage**: Aerial roots from the climbing stems create additional soil contact points when allowed to root along supports.
• **Mulch compatibility**: Dragon fruit rows are well-suited to organic mulching (wood chips, grass clippings), which improves soil moisture retention, suppresses weeds, and builds organic matter.
• **Minimal tillage**: Once established, dragon fruit orchards require minimal soil disturbance compared to annual crops, preserving soil structure and microbial communities.`,
    source: 'Lal, R. (2004). "Soil Carbon Sequestration Impacts on Global Climate Change and Food Security." Science, 304(5677), 1623–1627; general horticultural practice as documented in DFSA field guides.'
  },
  {
    icon: <Bug className="h-6 w-6 text-primary" />,
    title: 'Pollinators & Biodiversity',
    content: `Dragon fruit flowers open at night and are naturally pollinated by nocturnal pollinators including:

• **Bats** (particularly fruit bats in tropical regions) — key pollinators in native Central American habitats.
• **Hawk moths** (Sphingidae family) — important nocturnal pollinators documented in both tropical and subtropical growing regions.
• **Honeybees** — while dragon fruit is not a primary bee crop, flower nectar and pollen are visited by bees during early morning hours before flowers close.

Establishing dragon fruit orchards can support local pollinator populations, especially when integrated with wildflower strips and native plant hedgerows. This contributes to farm-level biodiversity, which is a requirement for some sustainability certifications (e.g., GlobalG.A.P., Rainforest Alliance).`,
    source: 'Fleming, T.H. et al. (2009). "The evolution of bat pollination." Annals of Botany, 104(6), 1017–1043; Weiss, J. et al. (1994). HortScience, 29(12), 1487–1492.'
  },
  {
    icon: <Sun className="h-6 w-6 text-primary" />,
    title: 'Shade & Microclimate Benefits',
    content: `Dragon fruit trellising systems (typically A-frame or single-pole structures) create partial shade beneath the canopy. This has practical microclimate benefits:

• **Understory planting**: Shade-tolerant herbs, groundcovers, or low-growing crops can be grown beneath dragon fruit trellises in an agroforestry-style arrangement.
• **Temperature moderation**: Trellis canopies reduce ground-level temperatures by 2–5°C during peak heat, benefiting soil biology and reducing irrigation water loss to evaporation.
• **Wind reduction**: Trellis rows serve as partial windbreaks, reducing wind speed and associated crop desiccation in exposed locations.`,
    source: 'General agroforestry principles; Jose, S. (2009). "Agroforestry for ecosystem services and environmental benefits." Agroforestry Systems, 76(1), 1–10.'
  },
  {
    icon: <TreePine className="h-6 w-6 text-primary" />,
    title: 'Climate Change Resilience',
    content: `Dragon fruit's drought tolerance, heat resistance, and CAM photosynthesis make it a climate-resilient crop option for regions experiencing:

• **Increasing temperatures**: Dragon fruit tolerates daytime temperatures up to 38–40°C, though production may slow above 35°C.
• **Erratic rainfall**: The plant's cactus physiology allows it to survive extended dry periods (though irrigation is needed for commercial production).
• **Shifting growing zones**: As traditional temperate fruit zones shift, dragon fruit may become viable in areas previously considered too warm for conventional crops.

The South African Agricultural Research Council (ARC) and the Department of Agriculture have identified climate-smart agriculture as a national priority. Dragon fruit aligns with this strategy as a high-value, low-water crop suitable for emerging and smallholder farmers.`,
    source: 'South African ARC. Climate-Smart Agriculture framework; IPCC (2022). "Climate Change 2022: Impacts, Adaptation and Vulnerability." IPCC Sixth Assessment Report, Working Group II.'
  },
];

const DragonFruitEnvironmentalBenefits = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Dragon Fruit & Sustainability | Water-Wise, Climate-Ready Farming"
        description="Explore dragon fruit sustainability: water-wise practices, climate resilience, pollinators, and farm design for lower environmental impact."
        keywords="dragon fruit sustainability, dragon fruit water usage, dragon fruit environment, climate smart agriculture, water wise farming South Africa"
        url="/dragon-fruit-environmental-benefits"
      />
      <Header />
      <CartSidebar />

      <main className="pt-20">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: 'Education', href: '/history-of-dragon-fruit' }, { label: 'Environmental Benefits' }]} />
        </div>

        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-dragon-pink/10" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-4xl mx-auto">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Leaf className="h-4 w-4" /> Educational Resource
              </span>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
                Environmental Benefits of <span className="text-gradient-dragon">Dragon Fruit Farming</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                How dragon fruit supports water-wise agriculture, biodiversity, soil health, and climate resilience — with practical guidance for African growers.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="space-y-8">
              {sections.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        {s.icon}
                        <h2 className="text-2xl font-display font-bold">{s.title}</h2>
                      </div>
                      <div className="prose prose-sm max-w-none text-foreground/80 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: s.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                      <p className="text-xs text-muted-foreground italic mt-4">Source: {s.source}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-8">Sources</h2>
            <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
              <li>FAO (1998). Irrigation and Drainage Paper 56. <a href="https://www.fao.org/3/x0490e/x0490e00.htm" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Link</a></li>
              <li>Nobel, P.S. (1988). <em>Environmental Biology of Agaves and Cacti</em>. Cambridge University Press.</li>
              <li>Fleming, T.H. et al. (2009). <em>Annals of Botany</em>, 104(6), 1017–1043.</li>
              <li>Jose, S. (2009). <em>Agroforestry Systems</em>, 76(1), 1–10.</li>
              <li>Lal, R. (2004). <em>Science</em>, 304(5677), 1623–1627.</li>
              <li>IPCC (2022). Sixth Assessment Report, Working Group II. <a href="https://www.ipcc.ch/report/ar6/wg2/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">ipcc.ch</a></li>
              <li>South African Agricultural Research Council. <a href="https://www.arc.agric.za" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">arc.agric.za</a></li>
            </ol>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/dragon-fruit-carbon-and-radiation-claims" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">Carbon & Radiation Claims <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/consultations" className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors">Book Consultation <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DragonFruitEnvironmentalBenefits;
