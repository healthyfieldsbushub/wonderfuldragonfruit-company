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

const DragonFruitZimbabwe = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Dragon Fruit Zimbabwe | Buy Dragon Fruit Plants in Zimbabwe"
        description="Buy dragon fruit plants in Zimbabwe. DFSA supplies premium dragon fruit cuttings to Harare, Bulawayo & across Zimbabwe. Expert farming support for Zimbabwe's tropical climate."
        keywords="dragon fruit zimbabwe, dragon fruit farming zimbabwe, buy dragon fruit plants zimbabwe, dragon fruit cuttings zimbabwe, pitaya zimbabwe"
        url="/dragon-fruit-zimbabwe"
      />
      <Header />
      <CartSidebar />

      <main className="pt-20">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: 'Dragon Fruit Zimbabwe' }]} />
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
                Zimbabwe
              </span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Dragon Fruit <span className="text-gradient-tropical">Zimbabwe</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
                Zimbabwe's tropical and subtropical climate zones offer excellent potential for dragon fruit farming. 
                DFSA has helped numerous Zimbabwean farmers establish profitable dragon fruit plantations with 
                varieties proven to excel in the region's diverse growing conditions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/products">
                  <Button size="lg" className="gap-2">
                    <Leaf className="h-5 w-5" />
                    Shop Dragon Fruit Plants
                  </Button>
                </Link>
                <WhatsAppButton message="Hi DFSA! I'm interested in buying dragon fruit plants for my farm in Zimbabwe. Can you help?">
                  Order via WhatsApp
                </WhatsAppButton>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Why Zimbabwe */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-3xl font-bold text-center mb-12">
              Why Grow Dragon Fruit in <span className="text-gradient-tropical">Zimbabwe</span>?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Sun, title: 'Tropical Growing Conditions', description: 'Zimbabwe\'s warm Lowveld and Eastern Highlands provide diverse microclimates perfect for different dragon fruit varieties, enabling year-round production potential.' },
                { icon: Droplets, title: 'Fertile Agricultural Land', description: 'Zimbabwe\'s rich soils, combined with established irrigation infrastructure, create ideal conditions for high-yield dragon fruit farming.' },
                { icon: Truck, title: 'Cross-Border Delivery', description: 'We deliver directly from South Africa to Harare, Bulawayo, Mutare, and across Zimbabwe with secure, tracked shipments.' },
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
              What DFSA Offers Zimbabwe Farmers
            </h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
              End-to-end dragon fruit farming solutions designed for Zimbabwe's agricultural landscape.
            </p>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {[
                'Premium dragon fruit cuttings (100+ varieties available)',
                'Heat-tolerant varieties suited for Zimbabwe\'s climate',
                'Complete farm layout and trellis design consultation',
                'Soil analysis recommendations and preparation guidance',
                'Post-planting technical support and troubleshooting',
                'Bulk discounts for commercial-scale operations',
                'High-brix cultivars for export-quality fruit production',
                'Reliable cross-border shipping to all Zimbabwe regions',
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
              Ready to Start Dragon Fruit Farming in Zimbabwe?
            </h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              Get expert advice on the best varieties and farm setup for your Zimbabwe location.
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

export default DragonFruitZimbabwe;
