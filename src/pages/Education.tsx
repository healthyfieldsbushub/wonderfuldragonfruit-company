import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { SEOHead } from '@/components/seo/SEOHead';
import { BookOpen, TrendingUp, Globe, Leaf, History, Microscope, Zap, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const educationPages = [
  {
    title: 'History & Origins of Dragon Fruit',
    description: 'Explore the fascinating journey of dragon fruit from ancient Central America to modern African agriculture.',
    href: '/history-of-dragon-fruit',
    icon: History,
  },
  {
    title: 'Global Production & Top Suppliers',
    description: 'Discover worldwide dragon fruit production statistics, leading exporting countries, and market trends.',
    href: '/dragon-fruit-global-production',
    icon: Globe,
  },
  {
    title: 'Research & Health Benefits',
    description: 'Science-backed health benefits of dragon fruit including antioxidants, vitamins, and nutritional value.',
    href: '/dragon-fruit-research-benefits',
    icon: Microscope,
  },
  {
    title: 'Environmental Benefits',
    description: 'How dragon fruit farming supports biodiversity, water conservation, and sustainable agriculture in Africa.',
    href: '/dragon-fruit-environmental-benefits',
    icon: Leaf,
  },
  {
    title: 'Carbon & Radiation Research',
    description: 'Scientific claims and studies on dragon fruit\'s carbon sequestration and radiation-related properties.',
    href: '/dragon-fruit-carbon-and-radiation-claims',
    icon: Zap,
  },
  {
    title: 'Industry Growth & Market Opportunity',
    description: 'Market analysis, growth projections, and commercial opportunities in the African dragon fruit industry.',
    href: '/dragon-fruit-industry-growth',
    icon: TrendingUp,
  },
  {
    title: 'Largest Dragon Fruit on Record',
    description: 'The story behind the world\'s largest dragon fruit and what it means for cultivar development.',
    href: '/largest-dragon-fruit-record',
    icon: BookOpen,
  },
  {
    title: 'Africa Fruit & Vegetable Markets Directory',
    description: 'Comprehensive directory of fresh produce markets across South Africa, Zambia, Zimbabwe, and more.',
    href: '/africa-fruit-and-vegetable-markets',
    icon: Globe,
  },
  {
    title: 'Dragon Fruit in Botswana',
    description: 'Growing dragon fruit in Botswana — climate suitability, pioneers, and farming potential.',
    href: '/dragon-fruit-botswana',
    icon: Leaf,
  },
  {
    title: 'Dragon Fruit in Zimbabwe',
    description: 'Opportunities and challenges for dragon fruit cultivation in Zimbabwe\'s diverse climate zones.',
    href: '/dragon-fruit-zimbabwe',
    icon: Leaf,
  },
  {
    title: 'Dragon Fruit in Namibia',
    description: 'Dragon fruit farming in Namibia — water-wise cultivation in arid and semi-arid regions.',
    href: '/dragon-fruit-namibia',
    icon: Leaf,
  },
];

const Education = () => {
  return (
    <>
      <SEOHead
        title="Dragon Fruit Education Hub | Research, History & Industry Insights | DFSA"
        description="Comprehensive educational resources on dragon fruit farming in Africa. Learn about history, health benefits, environmental impact, global production, and commercial growing opportunities."
      />
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Dragon Fruit <span className="text-gradient-dragon">Education Hub</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Your complete knowledge centre for dragon fruit farming in Africa. Explore research-backed articles on history, health benefits, environmental science, market data, and commercial growing guides — curated by DFSA with 18+ years of industry expertise.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <Link to="/education/commercial-orders">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Commercial Orders
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/consultations">Book a Consultation</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-12">
              Explore Our Educational Resources
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {educationPages.map((page) => (
                <Link key={page.href} to={page.href} className="group">
                  <Card className="h-full transition-all duration-300 hover:shadow-lg hover:border-primary/40 group-hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
                          <page.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                            {page.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">{page.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              Ready to Start Your Dragon Fruit Journey?
            </h2>
            <p className="text-muted-foreground mb-8">
              Whether you're a small-scale grower or planning a commercial farm, DFSA provides the plants, knowledge, and support to help you succeed.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <Link to="/products">Browse Plants</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/association">Join the Association</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Education;
