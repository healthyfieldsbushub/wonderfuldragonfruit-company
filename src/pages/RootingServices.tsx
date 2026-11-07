import { Header } from '@/components/layout/Header';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { motion } from 'framer-motion';
import { 
  Sprout, 
  Shield, 
  Truck, 
  Timer,
  CheckCircle2,
  Package,
  Phone,
  Leaf,
  ThermometerSun,
  Droplets,
  AlertCircle,
  Calculator,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { FAQSchema } from '@/components/seo/FAQSchema';

// Volume discount tiers for rooting service
const volumeTiers = [
  { min: 1, max: 10, pricePerPlant: 30, label: 'Starter', color: 'from-blue-500 to-blue-600' },
  { min: 11, max: 149, pricePerPlant: 30, label: 'Small Batch', color: 'from-blue-500 to-blue-600' },
  { min: 150, max: 599, pricePerPlant: 5, label: 'Farm Package', color: 'from-emerald-500 to-emerald-600' },
  { min: 600, max: 9999, pricePerPlant: 2.50, label: 'Commercial', color: 'from-amber-500 to-orange-600' }
];

function getRootingPrice(quantity: number): number {
  if (quantity >= 600) return 2.50;
  if (quantity >= 150) return 5;
  return 30;
}

function calculateSavings(quantity: number): number {
  const standardPrice = quantity * 30;
  const discountedPrice = quantity * getRootingPrice(quantity);
  return standardPrice - discountedPrice;
}

const rootingPackages = [
  {
    id: 'basic',
    name: 'Basic Rooting',
    pricePerCutting: 'R25',
    minQuantity: 10,
    timeline: '3-4 weeks',
    icon: Sprout,
    gradient: 'from-emerald-500 to-teal-600',
    features: [
      'Standard rooting medium',
      'Basic root development',
      'Quality inspection',
      'Collection notification',
      'Care instructions'
    ],
    includes: 'Standard pot & medium'
  },
  {
    id: 'premium',
    name: 'Premium Rooting',
    pricePerCutting: 'R45',
    minQuantity: 5,
    timeline: '4-6 weeks',
    icon: Leaf,
    gradient: 'from-primary to-dragon-magenta',
    popular: true,
    features: [
      'Premium rooting hormone',
      'Enhanced root mass',
      'Mycorrhizal treatment',
      'Progress photos',
      'Hardening period included',
      'Detailed care guide',
      'WhatsApp support'
    ],
    includes: 'Premium pot, medium & fertilizer'
  },
  {
    id: 'commercial',
    name: 'Commercial Contract',
    pricePerCutting: 'R35',
    minQuantity: 100,
    timeline: '4-6 weeks',
    icon: Package,
    gradient: 'from-amber-500 to-orange-600',
    features: [
      'Bulk pricing advantage',
      'Scheduled delivery batches',
      'Custom variety selection',
      'Phytosanitary certificates',
      'Farm-ready conditioning',
      'Planting support visit',
      'Priority supply guarantee'
    ],
    includes: 'Bulk packaging & documentation'
  }
];

const process = [
  {
    step: 1,
    title: 'Submit Your Cuttings',
    description: 'Drop off or courier your unrooted cuttings to our facility. We accept cuttings from 15-40cm in length.',
    icon: Package
  },
  {
    step: 2,
    title: 'Treatment & Planting',
    description: 'Cuttings are treated with rooting hormone and fungicide, then planted in our specialized medium.',
    icon: Droplets
  },
  {
    step: 3,
    title: 'Controlled Environment',
    description: 'Your cuttings develop roots in our climate-controlled shade house with optimal humidity and temperature.',
    icon: ThermometerSun
  },
  {
    step: 4,
    title: 'Collection / Delivery',
    description: 'Once fully rooted and hardened, collect your plants or we deliver nationwide.',
    icon: Truck
  }
];

const faqs = [
  {
    question: 'How long does rooting take?',
    answer: 'Rooting typically takes 3-6 weeks depending on the variety and season. Basic rooting is 3-4 weeks, premium and commercial batches 4-6 weeks.'
  },
  {
    question: 'Can I send cuttings by courier?',
    answer: 'Yes! Package cuttings in newspaper, ensure good ventilation, and ship via overnight courier. Contact us for packaging guidelines.'
  },
  {
    question: 'What is your success rate?',
    answer: 'We maintain a 95%+ success rate. Any cuttings that fail to root are replaced at no charge or credited.'
  },
  {
    question: 'Do you offer nationwide delivery?',
    answer: 'Yes, we deliver rooted plants throughout South Africa and export to select African countries with proper documentation.'
  },
  {
    question: 'Can you root rare varieties?',
    answer: 'Absolutely! We specialize in rare and exotic varieties. Some may require additional time or have adjusted pricing.'
  }
];

export default function RootingServices() {
  const [calcQuantity, setCalcQuantity] = useState(50);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    package: '',
    quantity: '',
    varieties: '',
    hasOwnCuttings: '',
    message: ''
  });

  const calcResults = useMemo(() => {
    const pricePerPlant = getRootingPrice(calcQuantity);
    const totalCost = calcQuantity * pricePerPlant;
    const savings = calculateSavings(calcQuantity);
    const tier = volumeTiers.find(t => calcQuantity >= t.min && calcQuantity <= t.max) || volumeTiers[0];
    
    // Calculate progress to next tier
    let nextTier = null;
    let progressToNext = 100;
    let plantsToNext = 0;
    
    if (calcQuantity < 150) {
      nextTier = { threshold: 150, price: 5, label: 'Farm Package' };
      plantsToNext = 150 - calcQuantity;
      progressToNext = (calcQuantity / 150) * 100;
    } else if (calcQuantity < 600) {
      nextTier = { threshold: 600, price: 2.50, label: 'Commercial' };
      plantsToNext = 600 - calcQuantity;
      progressToNext = ((calcQuantity - 150) / (600 - 150)) * 100;
    }
    
    return { pricePerPlant, totalCost, savings, tier, nextTier, progressToNext, plantsToNext };
  }, [calcQuantity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPackage = rootingPackages.find(p => p.id === formData.package);
    const message = `Hi DFSA! I'm interested in your rooting services.

📦 Package: ${selectedPackage?.name || 'Not selected'}
📊 Quantity: ${formData.quantity} cuttings
🌱 Varieties: ${formData.varieties}
🪴 Own Cuttings: ${formData.hasOwnCuttings}

👤 Name: ${formData.name}
📧 Email: ${formData.email}
📱 Phone: ${formData.phone}
📍 Location: ${formData.location}

Message: ${formData.message}`;
    
    window.open(`https://wa.me/27834474639?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CartSidebar />
      
      <main className="pt-20">
        <SEOHead
          title="Dragon Fruit Rooting Services | Professional Plant Propagation | DFSA"
          description="Professional dragon fruit rooting services with 95%+ success rate. 110+ varieties. Bulk pricing from R2.50/plant. Send us your cuttings or choose from our collection."
          keywords="dragon fruit rooting, plant propagation, dragon fruit cuttings, rooting service South Africa, pitaya propagation"
          url="/rooting-services"
        />
        <Breadcrumbs items={[{ label: 'Rooting Services' }]} className="container mx-auto px-4 mb-4" />
        <FAQSchema faqs={faqs} />
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-primary/10 to-background" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-4xl mx-auto"
            >
              <span className="inline-block px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium mb-6">
                Professional Plant Propagation
              </span>
              <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
                Rooting <span className="text-gradient-dragon">Services</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Let our experts root your dragon fruit cuttings with a 95%+ success rate. 
                Send us your cuttings or choose from our 110+ varieties.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <WhatsAppButton message="Hi! I'm interested in your rooting services. Can you tell me more about your packages and process?">
                  Get Started Today
                </WhatsAppButton>
                <Button variant="outline" size="lg" asChild>
                  <a href="#packages">View Packages</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Banner */}
        <section className="py-8 bg-primary/10">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              {[
                { value: '95%+', label: 'Success Rate' },
                { value: '110+', label: 'Varieties Available' },
                { value: '3-6', label: 'Weeks Timeline' },
                { value: '10,000+', label: 'Plants Rooted Annually' }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold text-gradient-dragon">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Volume Discount Calculator */}
        <section className="py-20 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary font-medium mb-6">
                <Calculator className="h-4 w-4" />
                Volume Pricing Calculator
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Save More with <span className="text-gradient-dragon">Bulk Orders</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our tiered pricing rewards larger orders. Use the calculator to see your savings.
              </p>
            </motion.div>

            <div className="max-w-5xl mx-auto">
              {/* Pricing Tiers Visual */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
              >
                {[
                  { range: '1-149 plants', price: 'R30', label: 'Standard', icon: Sprout, active: calcQuantity < 150 },
                  { range: '150-599 plants', price: 'R5', label: 'Farm Package', icon: Leaf, discount: '83% OFF', active: calcQuantity >= 150 && calcQuantity < 600 },
                  { range: '600+ plants', price: 'R2.50', label: 'Commercial', icon: Package, discount: '92% OFF', active: calcQuantity >= 600 }
                ].map((tier, index) => (
                  <Card 
                    key={tier.range}
                    className={`relative overflow-hidden transition-all duration-300 ${
                      tier.active 
                        ? 'border-primary border-2 shadow-lg shadow-primary/20 scale-105' 
                        : 'border-border/50 opacity-70'
                    }`}
                  >
                    {tier.discount && (
                      <div className="absolute top-0 right-0">
                        <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                          <TrendingDown className="h-3 w-3" />
                          {tier.discount}
                        </div>
                      </div>
                    )}
                    <CardContent className="p-6 text-center">
                      <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${
                        tier.active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        <tier.icon className="h-6 w-6" />
                      </div>
                      <div className="text-sm text-muted-foreground mb-1">{tier.label}</div>
                      <div className="text-3xl font-bold text-gradient-dragon mb-1">{tier.price}</div>
                      <div className="text-sm text-muted-foreground">per plant</div>
                      <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">{tier.range}</div>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>

              {/* Interactive Calculator */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card className="glass-card-strong">
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Slider Input */}
                      <div className="space-y-6">
                        <div>
                          <Label className="text-lg font-semibold mb-4 block">
                            How many plants do you need rooted?
                          </Label>
                          <div className="flex items-center gap-4 mb-4">
                            <Input
                              type="number"
                              min="1"
                              max="2000"
                              value={calcQuantity}
                              onChange={(e) => setCalcQuantity(Math.min(2000, Math.max(1, parseInt(e.target.value) || 1)))}
                              className="w-28 text-center text-lg font-bold"
                            />
                            <span className="text-muted-foreground">plants</span>
                          </div>
                          <Slider
                            value={[calcQuantity]}
                            onValueChange={(value) => setCalcQuantity(value[0])}
                            min={1}
                            max={1000}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-2">
                            <span>1</span>
                            <span>150</span>
                            <span>600</span>
                            <span>1000+</span>
                          </div>
                        </div>

                        {/* Quick Select Buttons */}
                        <div className="flex flex-wrap gap-2">
                          <span className="text-sm text-muted-foreground w-full mb-1">Quick select:</span>
                          {[10, 50, 150, 300, 600, 1000].map((qty) => (
                            <Button
                              key={qty}
                              variant={calcQuantity === qty ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCalcQuantity(qty)}
                            >
                              {qty}
                            </Button>
                          ))}
                        </div>

                        {/* Progress to Next Tier */}
                        {calcResults.nextTier && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium flex items-center gap-2">
                                <TrendingDown className="h-4 w-4 text-primary" />
                                Next tier: {calcResults.nextTier.label}
                              </span>
                              <span className="text-sm text-primary font-bold">
                                R{calcResults.nextTier.price.toFixed(2)}/plant
                              </span>
                            </div>
                            
                            {/* Animated Progress Bar */}
                            <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-2">
                              <motion.div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-dragon-magenta rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${calcResults.progressToNext}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                              />
                              {/* Animated shimmer effect */}
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                initial={{ x: "-100%" }}
                                animate={{ x: "100%" }}
                                transition={{ 
                                  duration: 1.5, 
                                  repeat: Infinity, 
                                  repeatDelay: 1,
                                  ease: "easeInOut"
                                }}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                {Math.round(calcResults.progressToNext)}% to {calcResults.nextTier.label}
                              </span>
                              <span className="text-primary font-medium">
                                +{calcResults.plantsToNext} more plants needed
                              </span>
                            </div>
                            
                            {calcResults.plantsToNext <= 50 && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mt-3 p-2 rounded-lg bg-primary/20 text-center"
                              >
                                <span className="text-sm text-primary font-medium flex items-center justify-center gap-1">
                                  <Sparkles className="h-4 w-4" />
                                  Almost there! Add {calcResults.plantsToNext} more to save R{((30 - calcResults.nextTier.price) * (calcQuantity + calcResults.plantsToNext)).toFixed(0)}
                                </span>
                              </motion.div>
                            )}
                          </motion.div>
                        )}

                        {!calcResults.nextTier && (
                          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                              <CheckCircle2 className="h-5 w-5" />
                              <span className="font-medium">You've unlocked the best rate!</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Commercial tier: Maximum savings of 92% off standard pricing
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Results */}
                      <div className="space-y-4">
                        <div className={`p-4 rounded-xl bg-gradient-to-r ${calcResults.tier.color} text-white`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Your Tier</span>
                            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-bold">
                              {calcResults.tier.label}
                            </span>
                          </div>
                          <div className="text-4xl font-bold">
                            R{calcResults.pricePerPlant.toFixed(2)}
                            <span className="text-lg font-normal opacity-80"> /plant</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <Card className="bg-muted/50">
                            <CardContent className="p-4 text-center">
                              <div className="text-sm text-muted-foreground mb-1">Total Cost</div>
                              <div className="text-2xl font-bold text-foreground">
                                R{calcResults.totalCost.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                              </div>
                            </CardContent>
                          </Card>
                          <Card className={`${calcResults.savings > 0 ? 'bg-primary/10 border-primary/30' : 'bg-muted/50'}`}>
                            <CardContent className="p-4 text-center">
                              <div className="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-1">
                                {calcResults.savings > 0 && <Sparkles className="h-3 w-3 text-primary" />}
                                You Save
                              </div>
                              <div className={`text-2xl font-bold ${calcResults.savings > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                                R{calcResults.savings.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {calcResults.savings > 0 && (
                          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-center">
                            <span className="text-primary font-medium">
                              🎉 You're saving {Math.round((calcResults.savings / (calcQuantity * 30)) * 100)}% with bulk pricing!
                            </span>
                          </div>
                        )}

                        <WhatsAppButton 
                          message={`Hi! I'd like to get ${calcQuantity} plants rooted at R${calcResults.pricePerPlant.toFixed(2)}/plant (${calcResults.tier.label} tier). Total: R${calcResults.totalCost.toFixed(2)}`}
                          className="w-full"
                        >
                          Get Quote for {calcQuantity} Plants
                        </WhatsAppButton>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                How It <span className="text-gradient-dragon">Works</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our professional rooting process ensures your cuttings develop strong, healthy root systems.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {process.map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full glass-card border-border/50 relative overflow-hidden">
                    <div className="absolute top-4 right-4 text-6xl font-bold text-primary/10">
                      {item.step}
                    </div>
                    <CardContent className="p-6 relative z-10">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-dragon-magenta flex items-center justify-center mb-4">
                        <item.icon className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Packages Grid */}
        <section id="packages" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Rooting <span className="text-gradient-dragon">Packages</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Choose the package that fits your needs. All packages include our quality guarantee.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {rootingPackages.map((pkg, index) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        Recommended
                      </span>
                    </div>
                  )}
                  <Card className={`h-full ${pkg.popular ? 'border-primary border-2 shadow-lg shadow-primary/20' : 'border-border/50'} hover:border-primary/50 transition-all`}>
                    <CardHeader className="text-center pb-4">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${pkg.gradient} flex items-center justify-center mx-auto mb-4`}>
                        <pkg.icon className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-xl">{pkg.name}</CardTitle>
                      <CardDescription>Min. {pkg.minQuantity} cuttings</CardDescription>
                      <div className="pt-4">
                        <span className="text-3xl font-bold text-gradient-dragon">{pkg.pricePerCutting}</span>
                        <span className="text-muted-foreground">/cutting</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
                        <Timer className="h-4 w-4" />
                        {pkg.timeline}
                      </div>
                      <p className="text-xs text-muted-foreground pt-1">{pkg.includes}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {pkg.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button 
                        className="w-full" 
                        variant={pkg.popular ? 'default' : 'outline'}
                        onClick={() => setFormData(prev => ({ ...prev, package: pkg.id }))}
                      >
                        Select Package
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Guarantee Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12"
            >
              <Card className="bg-gradient-to-r from-primary/20 to-dragon-magenta/20 border-primary/30">
                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
                  <Shield className="h-12 w-12 text-primary shrink-0" />
                  <div>
                    <h3 className="font-bold text-lg">Our Rooting Guarantee</h3>
                    <p className="text-muted-foreground">
                      If any cutting fails to root due to our process, we'll replace it free of charge or credit your fee.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Booking Form */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                  Start Your <span className="text-gradient-dragon">Order</span>
                </h2>
                <p className="text-muted-foreground">
                  Tell us about your rooting needs and we'll provide a custom quote.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card className="glass-card-strong">
                  <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            placeholder="Your name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            required
                            maxLength={100}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            required
                            maxLength={255}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+27 XX XXX XXXX"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            required
                            maxLength={20}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">Location / Country *</Label>
                          <Input
                            id="location"
                            placeholder="City, Country"
                            value={formData.location}
                            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                            required
                            maxLength={100}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="package">Rooting Package *</Label>
                          <Select
                            value={formData.package}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, package: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a package" />
                            </SelectTrigger>
                            <SelectContent>
                              {rootingPackages.map(pkg => (
                                <SelectItem key={pkg.id} value={pkg.id}>
                                  {pkg.name} - {pkg.pricePerCutting}/cutting
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quantity">Number of Cuttings *</Label>
                          <Input
                            id="quantity"
                            type="number"
                            placeholder="e.g., 50"
                            value={formData.quantity}
                            onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                            required
                            min={1}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hasOwnCuttings">Do you have your own cuttings?</Label>
                        <Select
                          value={formData.hasOwnCuttings}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, hasOwnCuttings: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes-dropoff">Yes, I'll drop them off</SelectItem>
                            <SelectItem value="yes-courier">Yes, I'll courier them</SelectItem>
                            <SelectItem value="no-buy">No, I want to buy cuttings from DFSA</SelectItem>
                            <SelectItem value="mixed">Mixed - some of each</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="varieties">Varieties (if known)</Label>
                        <Input
                          id="varieties"
                          placeholder="e.g., Physical Graffiti, American Beauty, Vietnam White"
                          value={formData.varieties}
                          onChange={(e) => setFormData(prev => ({ ...prev, varieties: e.target.value }))}
                          maxLength={500}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Additional Information</Label>
                        <Textarea
                          id="message"
                          placeholder="Any special requirements, questions, or details about your cuttings..."
                          value={formData.message}
                          onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                          rows={4}
                          maxLength={1000}
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button type="submit" size="lg" className="flex-1 btn-dragon">
                          Send via WhatsApp
                        </Button>
                        <Button type="button" variant="outline" size="lg" asChild>
                          <a href="tel:+27834474639">
                            <Phone className="h-5 w-5 mr-2" />
                            Call Instead
                          </a>
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Frequently Asked <span className="text-gradient-dragon">Questions</span>
              </h2>
            </motion.div>

            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="glass-card border-border/50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <AlertCircle className="h-5 w-5 text-primary mt-1 shrink-0" />
                        <div>
                          <h3 className="font-bold mb-2">{faq.question}</h3>
                          <p className="text-muted-foreground text-sm">{faq.answer}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
