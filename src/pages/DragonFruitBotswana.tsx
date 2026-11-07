import { Header } from '@/components/layout/Header';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle2, MapPin, Truck, Leaf, Sun, Droplets, ArrowRight } from 'lucide-react';

const DragonFruitBotswana = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Dragon Fruit Botswana | Buy Dragon Fruit Plants in Botswana"
        description="Buy dragon fruit plants in Botswana. DFSA supplies premium dragon fruit cuttings to Gaborone, Francistown & across Botswana. Expert farming support for Botswana's climate."
        keywords="dragon fruit botswana, dragon fruit farming botswana, buy dragon fruit plants botswana, dragon fruit cuttings botswana, pitaya botswana"
        url="/dragon-fruit-botswana"
      />
      <Header />
      <CartSidebar />

      <main className="pt-20">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: 'Dragon Fruit Botswana' }]} />
        </div>

        {/* Hero */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-dragon-pink/10" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-4xl mx-auto"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <MapPin className="h-4 w-4" />
                Botswana
              </span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Dragon Fruit <span className="text-gradient-tropical">Botswana</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
                Botswana's semi-arid climate and abundant sunshine make it an excellent region for dragon fruit cultivation. 
                DFSA has been supplying premium dragon fruit plants to Botswana farmers since 2008, with proven varieties 
                that thrive in Botswana's unique growing conditions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/products">
                  <Button size="lg" className="gap-2">
                    <Leaf className="h-5 w-5" />
                    Shop Dragon Fruit Plants
                  </Button>
                </Link>
                <WhatsAppButton message="Hi DFSA! I'm interested in buying dragon fruit plants for my farm in Botswana. Can you help?">
                  Order via WhatsApp
                </WhatsAppButton>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Why Botswana */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-3xl font-bold text-center mb-12">
              Why Grow Dragon Fruit in <span className="text-gradient-tropical">Botswana</span>?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Sun, title: 'Ideal Climate', description: 'Botswana\'s warm temperatures and long growing season are perfect for dragon fruit. With proper irrigation, yields can match those of leading producing countries.' },
                { icon: Droplets, title: 'Water-Efficient Crop', description: 'Dragon fruit requires significantly less water than many traditional crops, making it ideal for Botswana\'s semi-arid conditions. Drip irrigation works exceptionally well.' },
                { icon: Truck, title: 'Direct Shipping from SA', description: 'We ship directly from South Africa to Gaborone, Francistown, and across Botswana with tracked, secure delivery of healthy cuttings.' },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <item.icon className="h-10 w-10 text-primary mb-4" />
                      <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* What We Offer */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-3xl font-bold text-center mb-4">
              What DFSA Offers Botswana Farmers
            </h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
              Complete dragon fruit farming solutions tailored for Botswana's unique agricultural landscape.
            </p>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {[
                'Premium dragon fruit cuttings (100+ varieties available)',
                'Varieties selected for Botswana\'s climate and soil',
                'Complete farm planning and trellis design consultation',
                'Soil preparation and irrigation guidance',
                'Ongoing technical support after planting',
                'Bulk pricing for commercial farms',
                'Export-quality cultivars for international markets',
                'Tracked shipping to all major Botswana cities',
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-r from-dragon-green to-dragon-pink text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-3xl font-bold mb-4">
              Ready to Start Dragon Fruit Farming in Botswana?
            </h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              Contact us today for a free consultation about the best varieties and setup for your Botswana farm.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/consultations">
                <Button size="lg" variant="secondary" className="gap-2">
                  Book Consultation
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/products">
                <Button size="lg" variant="outline" className="gap-2 border-white text-white hover:bg-white/10">
                  Browse All Plants
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DragonFruitBotswana;
