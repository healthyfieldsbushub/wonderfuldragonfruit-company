import { Header } from '@/components/layout/Header';
import { PackagePricing, CultivarGuide } from '@/components/association/PricelistCultivars';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { motion } from 'framer-motion';
import {
  Shield,
  Globe,
  Sprout,
  TrendingUp,
  Brain,
  Users,
  Lock,
  BadgeCheck,
  Handshake,
  BarChart3,
  Bug,
  Beaker,
  Wrench,
  ShoppingCart,
  FileText,
  Lightbulb,
  CheckCircle2,
  BookOpen,
  Download,
  Package,
  GraduationCap,
  Network,
} from 'lucide-react';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const countries = [
  'South Africa', 'Botswana', 'Zambia', 'Zimbabwe',
  'Uganda', 'Namibia', 'Malawi', 'Mozambique',
];

const membershipPackages = [
  {
    name: '6-Month Membership',
    duration: '6 Months',
    price: 'R12,600',
    perMonth: 'R2,100/mo',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    name: '12-Month Membership',
    duration: '12 Months',
    price: 'R26,250',
    perMonth: 'R2,187.50/mo',
    badge: 'Best Value',
    gradient: 'from-primary to-dragon-magenta',
  },
];

const membershipBenefits = [
  'Access to DFSA technical farming support & consultation',
  'Promotion of member farms on the DFSA platform',
  'Access to local & international marketing exposure',
  'Participation in farmer training & cultivation updates',
  'Networking with dragon fruit farmers across Africa',
  'Listing in the DFSA business & farm directory',
  'Opportunities for collaboration & knowledge sharing',
  'Access to local & international market agents',
];

export default function Association() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Dragon Fruit Farmers Association | Join Africa's Leading Agricultural Body"
        description="Join the Dragon Fruit Association of Africa. Technical support, market access, AI farming platform, youth training & commercial opportunities for dragon fruit farmers across South Africa, Botswana, Zambia & beyond."
        keywords="dragon fruit association, dragon fruit farmers, DFSA membership, agricultural association Africa, dragon fruit South Africa"
        url="/association"
      />
      <Header />
      <CartSidebar />

      <main className="pt-20">
        <Breadcrumbs items={[{ label: 'Association' }]} className="container mx-auto px-4 mb-4" />
        {/* Hero */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-dragon-magenta/10 to-background" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div {...fadeIn} className="text-center max-w-4xl mx-auto">
              <span className="inline-block px-4 py-2 rounded-full bg-primary/20 text-primary font-medium mb-6">
                <Shield className="inline h-4 w-4 mr-1 -mt-0.5" /> Industry Body
              </span>
              <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
                Dragon Fruit <span className="text-gradient-dragon">Association</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                A professional agricultural support and coordination platform built to develop, support, and scale the dragon fruit industry across Africa.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <WhatsAppButton message="Hi! I'm interested in joining the Dragon Fruit Association. Please share more details.">
                  Join the Association
                </WhatsAppButton>
                <Button variant="outline" size="lg" asChild>
                  <a href="#membership">View Membership</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 1 – What is the Association */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div {...fadeIn}>
              <h2 className="text-3xl font-display font-bold mb-6">
                What is the <span className="text-gradient-dragon">Dragon Fruit Association</span>?
              </h2>
              <p className="text-muted-foreground mb-4">
                The Dragon Fruit Association is a <strong>professional agricultural support and coordination platform</strong> created to develop, support, and scale the dragon fruit industry across Africa.
              </p>
              <p className="text-muted-foreground mb-6">
                The association connects farmers across <strong>one central system</strong> that links production, knowledge, markets, and commercial opportunities.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {countries.map((c) => (
                  <span key={c} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" /> {c}
                  </span>
                ))}
              </div>
              <p className="text-muted-foreground italic">
                Founded over <strong>six years ago</strong> as a long-term industry development body — not just a plant supplier.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Section 2 – Core Purpose */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div {...fadeIn}>
              <h2 className="text-3xl font-display font-bold mb-6">
                Core <span className="text-gradient-dragon">Purpose</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                This is <strong>not a social group</strong>. It is a <strong>commercial agricultural support organization</strong>.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  'Help farmers succeed technically',
                  'Help farmers become profitable',
                  'Reduce production risk',
                  'Provide real market access',
                  'Professionalize the industry',
                  'Prevent failed farms due to lack of knowledge',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* What Does the Association Do? – Extended Detail */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <motion.div {...fadeIn}>
              <h2 className="text-3xl font-display font-bold mb-4">
                What Does the Association <span className="text-gradient-dragon">Actually Do</span>?
              </h2>
              <p className="text-muted-foreground mb-8">
                Beyond technical support and market access, the Dragon Fruit Association serves as a <strong>collaborative body</strong> that educates, connects, supports, and promotes growers across the continent.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    icon: Network,
                    emoji: '🌱',
                    title: 'Connect Farmers & Growers',
                    description: 'A platform for dragon fruit farmers to meet, share knowledge, and collaborate — including established commercial farmers, new growers, nursery owners, and anyone interested in cultivation.',
                  },
                  {
                    icon: BookOpen,
                    emoji: '📚',
                    title: 'Share Information & Best Practices',
                    description: 'Members discuss cultivation techniques, pest management, harvesting methods, fertilising techniques, and market trends. Forums, workshops, and training spread technical knowledge.',
                  },
                  {
                    icon: Handshake,
                    emoji: '💼',
                    title: 'Support Market Access',
                    description: 'Connecting growers with domestic buyers and export opportunities, plus free advertising and promotional platforms for members\' products.',
                  },
                  {
                    icon: Globe,
                    emoji: '🌍',
                    title: 'Industry Development & Advocacy',
                    description: 'Growing the dragon fruit industry by encouraging sustainable market growth, supporting new entrants, and engaging international partners to expand trade.',
                  },
                  {
                    icon: Package,
                    emoji: '📦',
                    title: 'Access to Inputs & Resources',
                    description: 'Facilitating access to planting materials — dragon fruit cuttings at bulk prices, importing new varieties, and lowering barriers for starting or expanding operations.',
                  },
                  {
                    icon: GraduationCap,
                    emoji: '👩‍🌾',
                    title: 'Training & Youth Development',
                    description: 'Running training programmes and youth farms to help new and young farmers enter the industry, build skills, and create employment opportunities.',
                  },
                ].map((card) => (
                  <Card key={card.title} className="border-border/50 hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <card.icon className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-2xl">{card.emoji}</span>
                      </div>
                      <CardTitle className="text-lg">{card.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{card.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 3 – Technical Farming Support */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <motion.div {...fadeIn}>
              <h2 className="text-3xl font-display font-bold mb-8">
                Technical <span className="text-gradient-dragon">Farming Support</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    icon: Bug,
                    title: 'Pest & Disease Management',
                    items: ['Identification of common and rare pests', 'Treatment protocols', 'Biological vs chemical control', 'Preventative spraying programs', 'Emergency outbreak response'],
                  },
                  {
                    icon: Beaker,
                    title: 'Fertilization & Nutrition',
                    items: ['Crop stage-specific fertilizer programs', 'Organic and synthetic options', 'Soil analysis interpretation', 'Nutrient deficiency diagnosis', 'Seasonal feeding schedules'],
                  },
                  {
                    icon: Wrench,
                    title: 'Farm Establishment',
                    items: ['Orchard layout design', 'Trellis systems', 'Plant spacing', 'Irrigation planning', 'Shade and wind protection'],
                  },
                  {
                    icon: Sprout,
                    title: 'Production Management',
                    items: ['Flowering stimulation', 'Pollination strategies', 'Yield optimization', 'Pruning methods', 'Harvest timing'],
                  },
                  {
                    icon: Lightbulb,
                    title: 'Problem Solving',
                    items: ['On-demand diagnostics', 'Photo-based issue identification', 'AI-assisted farming decisions', 'Direct expert consultation'],
                  },
                ].map((card) => (
                  <Card key={card.title} className="border-border/50 hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-dragon-magenta flex items-center justify-center mb-3">
                        <card.icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-lg">{card.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1.5">
                        {card.items.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 4 – Market Access */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div {...fadeIn}>
              <h2 className="text-3xl font-display font-bold mb-8">
                Market Access & <span className="text-gradient-dragon">Commercial Support</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    icon: ShoppingCart,
                    title: 'Local Markets',
                    items: ['Fresh produce markets', 'Retail chains', 'Wholesalers'],
                  },
                  {
                    icon: Globe,
                    title: 'International Markets',
                    items: ['Export agents', 'Import companies', 'International buyers'],
                  },
                  {
                    icon: Handshake,
                    title: 'Commercial Sourcing',
                    items: ['Urgent bulk orders', 'Contract supply opportunities', 'Seasonal high-demand sourcing'],
                  },
                ].map((card) => (
                  <Card key={card.title} className="border-border/50">
                    <CardHeader className="pb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                        <card.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{card.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1.5">
                        {card.items.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-muted-foreground mt-6">
                The association often <strong>sources fruit directly from members</strong> when large buyers request supply.
              </p>
            </motion.div>
          </div>
        </section>


        {/* Section 6 – Knowledge & Industry Intelligence */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div {...fadeIn}>
              <h2 className="text-3xl font-display font-bold mb-6">
                Knowledge & <span className="text-gradient-dragon">Industry Intelligence</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                Members stay <strong>ahead of the market</strong>, not reacting to it.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  'Market trend updates',
                  'Price movement reports',
                  'New product alerts',
                  'New fertilizer technologies',
                  'New pest control solutions',
                  'New market openings',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <BarChart3 className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 7 – AI Farming Platform */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div {...fadeIn}>
              <h2 className="text-3xl font-display font-bold mb-6">
                AI <span className="text-gradient-dragon">Farming Platform</span>
              </h2>
              <p className="text-muted-foreground mb-4">
                The association is building the <strong>world's largest AI-based dragon fruit farming system</strong>, launching in 2026.
              </p>
              <p className="text-muted-foreground mb-6">
                Developed with major companies, it will serve as a <strong>global reference platform</strong>.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  'Crop diagnostics',
                  'Farm planning tools',
                  'Financial forecasting',
                  'Pest identification',
                  'Fertilizer optimization',
                  'Yield prediction',
                  'Market intelligence',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
                    <Brain className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 8 – Membership System */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div {...fadeIn}>
              <h2 className="text-3xl font-display font-bold mb-6">
                Membership <span className="text-gradient-dragon">System</span>
              </h2>
              <p className="text-muted-foreground mb-6">Each member receives:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  'Unique membership number',
                  'Digital profile',
                  'Farm registration',
                  'Access to experts',
                  'Access to AI systems',
                  'Access to markets',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground mt-6 italic">
                All data is stored electronically and integrated into the AI platform.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Section 9 – Why Membership Is Restricted */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div {...fadeIn}>
              <h2 className="text-3xl font-display font-bold mb-6">
                Why Membership Is <span className="text-gradient-dragon">Restricted</span>
              </h2>
              <p className="text-muted-foreground mb-4">
                The association only supports farmers who <strong>purchase plants through the association</strong> or <strong>join through paid membership</strong>.
              </p>
              <p className="text-muted-foreground mb-6">
                We do not provide free consulting to farmers who bought plants elsewhere. The plant seller is responsible for supporting their own customers.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Prevents abuse of resources', 'Eliminates time loss', 'Ensures sustainable support'].map((item) => (
                  <span key={item} className="flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive text-sm font-medium">
                    <Lock className="h-3.5 w-3.5" /> {item}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Commercial Package Prices */}
        <PackagePricing />

        {/* Cultivar Guide */}
        <CultivarGuide />

        {/* Section 10 – Membership Packages */}
        <section id="membership" className="py-20">
          <div className="container mx-auto px-4">
            <motion.div {...fadeIn} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Membership <span className="text-gradient-dragon">Packages</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                For farmers who purchased plants from other suppliers — gain full access to support, markets, and the AI platform. A 6- or 12-month membership contract is required.
              </p>
              <p className="text-sm text-primary font-medium mt-2">Effective 16 March 2025 – 2027</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {membershipPackages.map((pkg, index) => (
                <motion.div
                  key={pkg.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full border-border/50 hover:border-primary/50 transition-all hover:shadow-lg relative overflow-hidden">
                    {pkg.badge && (
                      <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {pkg.badge}
                      </div>
                    )}
                    <CardHeader className="text-center pb-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pkg.gradient} flex items-center justify-center mx-auto mb-4`}>
                        <Users className="h-7 w-7 text-white" />
                      </div>
                      <CardTitle className="text-xl">{pkg.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{pkg.duration}</p>
                    </CardHeader>
                    <CardContent className="space-y-4 text-center">
                      <div>
                        <p className="text-3xl font-bold text-gradient-dragon">{pkg.price}</p>
                        <p className="text-sm text-muted-foreground mt-1">{pkg.perMonth}</p>
                      </div>
                      <ul className="text-left space-y-1.5 pt-2">
                        {membershipBenefits.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <WhatsAppButton
                        message={`Hi! I'd like to join the Dragon Fruit Association – ${pkg.name} (${pkg.duration}).`}
                        className="w-full"
                      >
                        Join Now
                      </WhatsAppButton>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 max-w-3xl mx-auto">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <Lock className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Important:</strong> The African Dragon Fruit Association does not provide take-off agreements or guaranteed fruit purchasing contracts.
                </p>
              </div>
            </div>

              <div className="mt-6 text-center">
                <a href="/documents/DFSA-Pricelist-2025-2028.pdf" download>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Download Full Pricelist (PDF)
                  </Button>
                </a>
              </div>
          </div>
        </section>

        {/* Section 11 – Free Membership */}
        <section className="py-16 bg-gradient-to-br from-primary/10 via-dragon-magenta/5 to-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div {...fadeIn} className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-dragon-magenta flex items-center justify-center mx-auto mb-6">
                <BadgeCheck className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-display font-bold mb-6">
                Free <span className="text-gradient-dragon">Membership</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                Farmers who purchase plants <strong>directly from the association</strong>:
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                {['Pay no membership fees', 'Automatically receive full access', 'Prioritized for market opportunities'].map((item) => (
                  <span key={item} className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
                    <CheckCircle2 className="h-4 w-4" /> {item}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <WhatsAppButton message="Hi! I'd like to purchase plants and join the Dragon Fruit Association with free membership.">
                  Get Started Today
                </WhatsAppButton>
                <Button variant="outline" size="lg" asChild>
                  <a href="/products">Browse Plants</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="py-16">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <motion.div {...fadeIn}>
              <h2 className="text-3xl font-display font-bold mb-4">
                Ready to Join Africa's Leading <span className="text-gradient-dragon">Dragon Fruit Network</span>?
              </h2>
              <p className="text-muted-foreground mb-8">
                Whether you're starting your first orchard or scaling a commercial operation, the Dragon Fruit Association is your gateway to <strong>expertise, markets, and long-term profitability</strong>.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <WhatsAppButton message="Hi! I'd like to learn more about the Dragon Fruit Association and how to join.">
                  Contact Us on WhatsApp
                </WhatsAppButton>
                <Button variant="outline" size="lg" asChild>
                  <a href="/consultations">Book a Consultation</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
