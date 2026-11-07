import { Header } from '@/components/layout/Header';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Globe, BookOpen, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

const timeline = [
  { year: 'Pre-Columbian Era', event: 'Wild pitaya species (Hylocereus and Selenicereus) are native to southern Mexico, Central America, and northern South America. Indigenous peoples consumed the fruit and used the plant medicinally.', source: 'Mizrahi, Y. & Nerd, A. (1999). "Climbing and Columnar Cacti: New Arid Land Fruit Crops." In Perspectives on New Crops and New Uses.' },
  { year: '16th–17th Century', event: 'Spanish and Portuguese colonisers encountered pitaya in the Americas. The fruit was transported to Southeast Asia (particularly Vietnam and the Philippines) via colonial trade routes.', source: 'Le Bellec, F., Vaillant, F. & Imbert, E. (2006). "Pitahaya (Hylocereus spp.): a new fruit crop, a market with a future." Fruits, 61(4), 237–250.' },
  { year: '1800s', event: 'The French introduced dragon fruit to Vietnam, where it was cultivated as an ornamental and later as a food crop. The Vietnamese name "thanh long" (meaning "green dragon") gave rise to the English common name "dragon fruit."', source: 'Crane, J.H. & Balerdi, C.F. (2005). "Pitaya Growing in the Florida Home Landscape." University of Florida IFAS Extension, HS1068.' },
  { year: '1980s–1990s', event: 'Commercial cultivation expanded significantly in Vietnam, which became the world\'s leading producer. Israel, Colombia, and Nicaragua also began commercial production during this period.', source: 'Nerd, A., Tel-Zur, N. & Mizrahi, Y. (2002). "Fruits of vine and columnar cacti." In Nobel, P.S. (Ed.), Cacti: Biology and Uses, University of California Press.' },
  { year: '2000–2010', event: 'Dragon fruit entered supermarkets across Europe, North America, and East Asia as a "superfruit." Global production expanded to include Thailand, the Philippines, Malaysia, Indonesia, India, and parts of Australia.', source: 'FAO (2010). "Tropical Fruits Compendium." Food and Agriculture Organization of the United Nations.' },
  { year: '2010–2020', event: 'Vietnam\'s dragon fruit exports exceeded US $1 billion annually, with China as the primary market. New cultivation regions emerged in Africa (South Africa, Mozambique, Kenya) and the Middle East.', source: 'Vietnam Ministry of Agriculture and Rural Development, Annual Reports (2015–2020); General Statistics Office of Vietnam.' },
  { year: '2020–Present', event: 'Global interest in climate-resilient, water-wise crops has positioned dragon fruit as a strategic crop for arid and semi-arid regions. South Africa\'s DFSA leads African development with over 50+ cultivar varieties adapted to local conditions.', source: 'DFSA internal records; South African Department of Agriculture, Land Reform and Rural Development.' },
];

const mythsFacts = [
  { myth: 'Dragon fruit is genetically modified.', fact: 'Dragon fruit is not a GMO. It is a naturally occurring cactus fruit. The different flesh colours (white, red, purple, yellow) result from natural species variation within the Hylocereus and Selenicereus genera.', isMyth: true },
  { myth: 'Dragon fruit only grows in tropical climates.', fact: 'While tropical climates are ideal, dragon fruit is successfully cultivated in subtropical and semi-arid regions including South Africa, Israel, and parts of Australia, provided frost protection is managed.', isMyth: true },
  { myth: 'The name "dragon fruit" comes from its appearance.', fact: 'True. The scaly outer skin resembles dragon scales. The Vietnamese name "thanh long" (green dragon) also references the plant\'s climbing, dragon-like growth habit on support structures.', isMyth: false },
  { myth: 'Dragon fruit has no nutritional value—it\'s mostly water.', fact: 'While dragon fruit is approximately 84% water, it contains meaningful amounts of vitamin C, magnesium, iron, and dietary fibre. Red-fleshed varieties contain betacyanins, which have documented antioxidant properties (Wu et al., 2006, Food Chemistry).', isMyth: true },
];

const HistoryOfDragonFruit = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="History of Dragon Fruit | Origins & Global Popularity"
        description="Learn the history of dragon fruit: origins, global spread, and how it became popular in world markets. Clear timeline and key milestones."
        keywords="history of dragon fruit, dragon fruit origins, pitaya history, dragon fruit timeline, thanh long history"
        url="/history-of-dragon-fruit"
      />
      <Header />
      <CartSidebar />

      <main className="pt-20">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: 'Education', href: '/history-of-dragon-fruit' }, { label: 'History of Dragon Fruit' }]} />
        </div>

        {/* Hero */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-dragon-pink/10" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-4xl mx-auto">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <BookOpen className="h-4 w-4" /> Educational Resource
              </span>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
                History of Dragon Fruit <span className="text-gradient-dragon">(Pitaya)</span>: Timeline & Origins
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                From the rainforests of Central America to supermarket shelves worldwide—trace the remarkable journey of one of the world's most visually striking fruits.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-12 text-center">Timeline of Dragon Fruit</h2>
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary/20 hidden md:block" />
              <div className="space-y-8">
                {timeline.map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                    <Card className="ml-0 md:ml-16 relative">
                      <div className="absolute -left-[2.55rem] top-6 w-5 h-5 rounded-full bg-primary border-4 border-background hidden md:block" />
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="font-bold text-primary">{item.year}</span>
                        </div>
                        <p className="text-foreground/90 mb-3">{item.event}</p>
                        <p className="text-xs text-muted-foreground italic">Source: {item.source}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* First Commercialisation */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-8">How Dragon Fruit Became a Commercial Crop</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-foreground/80 mb-4">
                The transition from wild fruit to commercial commodity occurred primarily in <strong>Vietnam during the late 20th century</strong>. Vietnamese farmers in Bình Thuận Province developed cultivation techniques for <em>Hylocereus undatus</em> (white-fleshed) that enabled consistent yields and quality suitable for export markets.
              </p>
              <p className="text-foreground/80 mb-4">
                By the early 2000s, Vietnam was exporting dragon fruit to over 40 countries. China became the dominant market, absorbing approximately 80% of Vietnam's exports according to the Vietnam Ministry of Agriculture and Rural Development (2018).
              </p>
              <p className="text-foreground/80 mb-4">
                Parallel developments occurred in <strong>Israel</strong>, where researchers at Ben-Gurion University developed cultivation methods for arid conditions (Mizrahi et al., 1997), and in <strong>Colombia</strong>, where yellow pitaya (<em>Selenicereus megalanthus</em>) became an important export crop.
              </p>
              <p className="text-foreground/80">
                In <strong>Africa</strong>, commercial interest began in the 2010s. South Africa's Limpopo, Mpumalanga, and KwaZulu-Natal provinces proved suitable for dragon fruit production, with DFSA establishing the continent's most comprehensive cultivar collection and distribution network.
              </p>
            </div>
          </div>
        </section>

        {/* Myths vs Facts */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-8 text-center">Myths vs Facts</h2>
            <div className="grid gap-6">
              {mythsFacts.map((item, i) => (
                <Card key={i} className={`border-l-4 ${item.isMyth ? 'border-l-destructive' : 'border-l-primary'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-3">
                      {item.isMyth ? (
                        <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      )}
                      <div>
                        <p className="font-bold text-foreground">{item.isMyth ? '❌ Myth' : '✅ True'}: "{item.myth}"</p>
                        <p className="text-foreground/80 mt-2">{item.fact}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Sources */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-8">Sources</h2>
            <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
              <li>Mizrahi, Y. & Nerd, A. (1999). "Climbing and Columnar Cacti: New Arid Land Fruit Crops." In <em>Perspectives on New Crops and New Uses</em>, ASHS Press.</li>
              <li>Le Bellec, F., Vaillant, F. & Imbert, E. (2006). "Pitahaya (Hylocereus spp.): a new fruit crop, a market with a future." <em>Fruits</em>, 61(4), 237–250. <a href="https://doi.org/10.1051/fruits:2006021" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">DOI</a></li>
              <li>Crane, J.H. & Balerdi, C.F. (2005). "Pitaya Growing in the Florida Home Landscape." University of Florida IFAS Extension, HS1068. <a href="https://edis.ifas.ufl.edu/publication/HS303" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Link</a></li>
              <li>Nerd, A., Tel-Zur, N. & Mizrahi, Y. (2002). "Fruits of vine and columnar cacti." In Nobel, P.S. (Ed.), <em>Cacti: Biology and Uses</em>, University of California Press.</li>
              <li>FAO (2010). "Tropical Fruits Compendium." Food and Agriculture Organization of the United Nations. <a href="https://www.fao.org" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">fao.org</a></li>
              <li>Vietnam Ministry of Agriculture and Rural Development, Annual Reports (2015–2020). <a href="https://www.mard.gov.vn" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">mard.gov.vn</a></li>
              <li>Wu, L.C., Hsu, H.W., Chen, Y.C., Chiu, C.C., Lin, Y.I., Ho, J.A. (2006). "Antioxidant and antiproliferative activities of red pitaya." <em>Food Chemistry</em>, 95(2), 319–327.</li>
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-display font-bold mb-4">Explore More Educational Resources</h2>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/dragon-fruit-global-production" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                Global Production <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/dragon-fruit-research-benefits" className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">
                Research & Science <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors">
                Shop Dragon Fruit Plants <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HistoryOfDragonFruit;
