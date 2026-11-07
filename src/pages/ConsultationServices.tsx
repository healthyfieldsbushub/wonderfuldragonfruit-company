import { SEOHead } from '@/components/seo/SEOHead';
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
  Phone, 
  Video, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Users, 
  TrendingUp,
  Leaf,
  Target,
  Award
} from 'lucide-react';
import { useState } from 'react';

const consultationPackages = [
  {
    id: 'starter',
    name: 'Starter Consultation',
    price: 'R250',
    duration: '30 minutes',
    type: 'Video Call',
    icon: Video,
    gradient: 'from-emerald-500 to-teal-600',
    features: [
      'Basic growing guidance',
      'Variety selection advice',
      'Climate assessment',
      'Q&A session',
      'Email follow-up summary'
    ],
    bestFor: 'Hobbyists & beginners'
  },
  {
    id: 'grower',
    name: 'Growers Pack',
    price: 'R850',
    duration: '1 hour',
    type: 'Video Call + Report',
    icon: FileText,
    gradient: 'from-primary to-dragon-magenta',
    popular: true,
    features: [
      'Comprehensive site analysis',
      'Variety recommendations',
      'Planting schedule',
      'Irrigation planning',
      'Pest & disease management',
      'Written action plan',
      '30-day email support'
    ],
    bestFor: 'Small-scale farmers'
  },
  {
    id: 'commercial',
    name: 'Commercial Farm Planning',
    price: 'R3,500',
    duration: '2 hours + Site Visit',
    type: 'On-site + Virtual',
    icon: MapPin,
    gradient: 'from-amber-500 to-orange-600',
    features: [
      'On-site farm assessment',
      'Soil & water analysis review',
      'Complete farm layout design',
      'Infrastructure planning',
      'Financial projections',
      'Funding application support',
      'Business plan framework',
      '90-day support package'
    ],
    bestFor: 'Commercial operations'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Partnership',
    price: 'Custom',
    duration: 'Ongoing',
    type: 'Full Partnership',
    icon: Users,
    gradient: 'from-purple-500 to-indigo-600',
    features: [
      'Dedicated farm consultant',
      'Monthly site visits',
      'Continuous optimization',
      'Market access support',
      'Export documentation',
      'Staff training program',
      'Priority plant supply',
      'Revenue sharing options'
    ],
    bestFor: 'Large-scale investors'
  }
];

const expertise = [
  {
    icon: Leaf,
    title: 'Variety Selection',
    description: '110+ cultivars with expertise in matching varieties to your specific climate and market needs'
  },
  {
    icon: Target,
    title: 'Farm Planning',
    description: 'Complete farm layouts, trellising systems, and irrigation design for optimal production'
  },
  {
    icon: TrendingUp,
    title: 'Business Strategy',
    description: 'Market analysis, pricing strategies, and financial projections for profitable farming'
  },
  {
    icon: Award,
    title: '16+ Years Experience',
    description: 'Pioneering dragon fruit cultivation in Africa since 2008 with proven success stories'
  }
];

export default function ConsultationServices() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    package: '',
    farmSize: '',
    experience: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPackage = consultationPackages.find(p => p.id === formData.package);
    const message = `Hi DFSA! I'd like to book a consultation.

📦 Package: ${selectedPackage?.name || 'Not selected'}
👤 Name: ${formData.name}
📧 Email: ${formData.email}
📱 Phone: ${formData.phone}
📍 Location: ${formData.location}
🌱 Farm Size: ${formData.farmSize}
📊 Experience: ${formData.experience}

Message: ${formData.message}`;
    
    window.open(`https://wa.me/27834474639?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Dragon Fruit Farming Consultations | Expert Advice | DFSA"
        description="Book expert dragon fruit farming consultations from R250. Farm planning, variety selection, pest management & business strategy. Since 2008."
        keywords="dragon fruit consultation, farming advice, farm planning, DFSA consultation, dragon fruit expert"
        url="/consultations"
      />
      <Header />
      <CartSidebar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-dragon-magenta/10 to-background" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-4xl mx-auto"
            >
              <span className="inline-block px-4 py-2 rounded-full bg-primary/20 text-primary font-medium mb-6">
                Expert Guidance
              </span>
              <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
                Consultation <span className="text-gradient-dragon">Services</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Get expert advice from Africa's leading dragon fruit specialists. 
                From hobby growers to commercial operations, we guide your journey to success.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <WhatsAppButton message="Hi! I'm interested in your consultation services. Can you tell me more about your packages?">
                  Chat About Options
                </WhatsAppButton>
                <Button variant="outline" size="lg" asChild>
                  <a href="tel:+27834474639">
                    <Phone className="h-5 w-5 mr-2" />
                    Call Us Directly
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Expertise Grid */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {expertise.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full glass-card border-border/50 hover:border-primary/50 transition-colors">
                    <CardContent className="p-6 text-center">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-dragon-magenta flex items-center justify-center mx-auto mb-4">
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
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Choose Your <span className="text-gradient-dragon">Package</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                From quick advice calls to comprehensive farm partnerships, we have the right solution for your needs.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {consultationPackages.map((pkg, index) => (
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
                        Most Popular
                      </span>
                    </div>
                  )}
                  <Card className={`h-full ${pkg.popular ? 'border-primary border-2 shadow-lg shadow-primary/20' : 'border-border/50'} hover:border-primary/50 transition-all`}>
                    <CardHeader className="text-center pb-4">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${pkg.gradient} flex items-center justify-center mx-auto mb-4`}>
                        <pkg.icon className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-xl">{pkg.name}</CardTitle>
                      <CardDescription>{pkg.bestFor}</CardDescription>
                      <div className="pt-4">
                        <span className="text-3xl font-bold text-gradient-dragon">{pkg.price}</span>
                      </div>
                      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {pkg.duration}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground pt-1">{pkg.type}</p>
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
          </div>
        </section>

        {/* Booking Form */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                  Book Your <span className="text-gradient-dragon">Consultation</span>
                </h2>
                <p className="text-muted-foreground">
                  Fill out the form below and we'll get back to you within 24 hours to confirm your booking.
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
                          <Label htmlFor="package">Consultation Package *</Label>
                          <Select
                            value={formData.package}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, package: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a package" />
                            </SelectTrigger>
                            <SelectContent>
                              {consultationPackages.map(pkg => (
                                <SelectItem key={pkg.id} value={pkg.id}>
                                  {pkg.name} - {pkg.price}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="farmSize">Planned Farm Size</Label>
                          <Select
                            value={formData.farmSize}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, farmSize: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hobby">Hobby (1-10 plants)</SelectItem>
                              <SelectItem value="small">Small (10-50 plants)</SelectItem>
                              <SelectItem value="medium">Medium (50-500 plants)</SelectItem>
                              <SelectItem value="large">Large (500-2000 plants)</SelectItem>
                              <SelectItem value="commercial">Commercial (2000+ plants)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="experience">Your Experience Level</Label>
                        <Select
                          value={formData.experience}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, experience: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select your experience" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Complete beginner</SelectItem>
                            <SelectItem value="hobbyist">Hobbyist gardener</SelectItem>
                            <SelectItem value="farmer">Experienced farmer (other crops)</SelectItem>
                            <SelectItem value="dragon">Dragon fruit experience</SelectItem>
                            <SelectItem value="investor">Investor / Business owner</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Tell Us About Your Project</Label>
                        <Textarea
                          id="message"
                          placeholder="Describe your goals, challenges, or specific questions..."
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
      </main>
    </div>
  );
}
