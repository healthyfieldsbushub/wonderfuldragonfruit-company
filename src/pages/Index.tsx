import { Header } from '@/components/layout/Header';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { Testimonials } from '@/components/home/Testimonials';
import { AIAssistantWidget } from '@/components/ai/AIAssistantWidget';
import { DracoSection } from '@/components/draco/DracoSection';
import { motion } from 'framer-motion';
import { Truck, Shield, Headphones, CreditCard, CheckCircle2, Leaf, Globe, Award } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { LocalBusinessSchema } from '@/components/seo/LocalBusinessSchema';
import { DistributingCountries } from '@/components/home/DistributingCountries';

const features = [
  { icon: Truck, title: 'Fast Delivery', description: 'Nationwide shipping with tracking' },
  { icon: Shield, title: 'Secure Payment', description: 'Secure PayFast hosted checkout' },
  { icon: Headphones, title: '24/7 Support', description: 'WhatsApp & email support' },
  { icon: CreditCard, title: 'Trusted Since 2008', description: 'Established & reliable' },
];

const Index = () => {
  return (

    <div className="min-h-screen">
      <Header />
      <CartSidebar />
      
      <SEOHead
        title="Wonderful Dragon Fruit South Africa — Commercial Farming & Export"
        description="Commercial dragon fruit plant supply and farming consultation in South Africa. Export-quality Ruby and Sweet White cultivars. Premium plants since 2008. #DragonFruitFarming #AgriTech"
        keywords="dragon fruit south africa, buy dragon fruit plants, dragon fruit cuttings south africa, dragon fruit farming south africa, ruby cultivar, sweet white cultivar, commercial dragon fruit, dragon fruit export, dragon fruit plants for sale, wonderful dragon fruit"
        url="/"
      />
      <LocalBusinessSchema />
      <main>
        <HeroSection />
        <DracoSection />
        
        {/* Features Bar */}
        <section className="bg-earth-brown text-white py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <feature.icon className="h-8 w-8 text-sahara-gold flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">{feature.title}</h4>
                    <p className="text-sm text-white/70">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <FeaturedProducts />

        {/* Why Choose DFSA - Trust Signals */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Why Choose <span className="text-gradient-tropical">DFSA</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Cultivating excellence in African agriculture since 2008. We don't just sell plants — we partner with farmers to establish sustainable, export-quality plantations.
              </p>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: CheckCircle2,
                  title: 'Verified Cultivars',
                  description: 'Our plants are sourced from mother stock with proven high-brix (sugar) levels and heavy fruiting capabilities.',
                },
                {
                  icon: Leaf,
                  title: 'Agronomy Support',
                  description: 'Over a decade of hands-on experience in soil preparation, irrigation design, and trellis systems for African climates.',
                },
                {
                  icon: Globe,
                  title: 'Global Export Standards',
                  description: 'We understand international fruit export requirements, helping you grow fruit that meets global market demands.',
                },
                {
                  icon: Award,
                  title: 'Nationwide & International Shipping',
                  description: 'Secure, tracked delivery of rooted cuttings and plants across South Africa, Africa, and worldwide.',
                },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-card rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow"
                >
                  <item.icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Distributing Countries */}
        <DistributingCountries />

        <Testimonials />

        {/* Newsletter Section */}
        <section className="py-20 bg-gradient-to-r from-dragon-green to-dragon-pink text-white">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Join the Dragon Fruit Farming Community
              </h2>
              <p className="text-white/80 mb-8 max-w-xl mx-auto">
                Subscribe for exclusive deals, farming tips, and updates on new cultivars.
              </p>
              <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button type="submit" className="btn-sunset">
                  Subscribe
                </button>
              </form>
            </motion.div>
          </div>
        </section>

        {/* AI Assistant Widget */}
        <AIAssistantWidget />

        {/* Global site footer is rendered once in App.tsx */}

      </main>
    </div>
  );
};

export default Index;
