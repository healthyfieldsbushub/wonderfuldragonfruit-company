import { SEOHead } from '@/components/seo/SEOHead';
import { Header } from '@/components/layout/Header';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FAQSection } from '@/components/seo/FAQSection';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Download,
  Sprout,
  Warehouse,
  Leaf,
  Droplets,
  Sun,
  Tractor,
  Users,
  FlaskConical,
  ShieldCheck,
  Package,
  CheckCircle2,
  Award,
  Globe2,
  TrendingUp,
  Clock,
  Calendar,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import heroImg from '@/assets/hero-1ha-dragonfruit-farm.jpg';
import businessPlan from '@/assets/business-plan-1ha.pdf.asset.json';

const costRows = [
  { item: 'Land Preparation', description: 'Clearing, levelling, ripping and soil conditioning', cost: 'R15,000', notes: 'Varies by site condition' },
  { item: 'Support Poles & Trellising', description: 'Concrete posts, cross-arms, wire and fittings (≈800 stations)', cost: 'R32,000', notes: 'Long-life infrastructure (15–20 yr)' },
  { item: 'Irrigation System', description: 'Drip lines, filters, mainline, pump connections', cost: 'R25,000', notes: 'Essential for consistent yields' },
  { item: 'Certified Plant Material', description: '800 plants @ R30 (Association member rate)', cost: 'R24,000', notes: 'True-to-type, disease-screened' },
  { item: 'Soil Preparation & Amendments', description: 'Compost, organic matter, initial fertiliser base', cost: 'R8,000', notes: 'Critical for first-year establishment' },
  { item: 'Miscellaneous Establishment', description: 'Tools, planting labour, admin, contingency', cost: 'R6,000', notes: 'Adjust to farm scale' },
];

const included = [
  { icon: Sprout, title: 'Land Preparation', text: 'Site clearing, soil conditioning and layout planning.' },
  { icon: Warehouse, title: 'Concrete Posts', text: 'Durable trellis system engineered for 15–20 year orchards.' },
  { icon: Leaf, title: 'Certified Plant Material', text: 'True-to-type, self-pollinating commercial cultivars.' },
  { icon: Droplets, title: 'Irrigation System', text: 'Drip irrigation designed for water efficiency and uniform growth.' },
  { icon: Sun, title: 'Shade Structures', text: 'Optional shade netting for high-heat regions.' },
  { icon: Tractor, title: 'Equipment', text: 'Basic orchard tools and planting equipment.' },
  { icon: Users, title: 'Labour', text: 'Planting, training and establishment labour costs.' },
  { icon: FlaskConical, title: 'Fertiliser Programme', text: 'Balanced quarterly nutrition schedule for optimal growth.' },
  { icon: ShieldCheck, title: 'Pest & Disease Management', text: 'Integrated management protocol from year one.' },
  { icon: Package, title: 'Packing & Harvest Equipment', text: 'Post-harvest handling essentials for market-ready fruit.' },
];

const timeline = [
  {
    year: 'Year 1',
    title: 'Farm Establishment',
    points: ['Site preparation & trellis installation', 'Irrigation system commissioning', 'Planting of certified cuttings', 'Root establishment and vine training'],
  },
  {
    year: 'Year 2',
    title: 'Early Production',
    points: ['First flowering & fruit set', 'Canopy shaping and vine training', 'Infrastructure optimisation', 'Fertiliser programme refinement'],
  },
  {
    year: 'Year 3+',
    title: 'Commercial Production',
    points: ['Full commercial yields', 'Increasing annual output', 'Local & export market opportunities', 'Long productive lifespan of 15–20 years'],
  },
];

const returns = [
  { icon: Clock, title: 'Long Productive Lifespan', text: '15–20 year orchard life with stable annual production.' },
  { icon: TrendingUp, title: 'Increasing Annual Yields', text: 'Yields build progressively from year 2 through maturity.' },
  { icon: Globe2, title: 'High-Value Export Crop', text: 'Ruby, Purple Haze and Gold Israel are proven export cultivars.' },
  { icon: Sparkles, title: 'Growing International Demand', text: 'Rising superfood demand across EU, Middle East and Asia.' },
  { icon: Award, title: 'Premium Fruit Quality', text: 'Certified genetics deliver consistent size, colour and Brix.' },
  { icon: TrendingUp, title: 'Commercial Profitability', text: 'A high-margin diversification crop for African growers.' },
];

const memberBenefits = [
  'Certified commercial planting material',
  'Professional establishment guidance',
  'Ongoing technical support',
  'Farm development advice',
  'Production management assistance',
  'Cultivar selection recommendations',
  'Access to local market opportunities*',
  'Access to international market opportunities*',
  'Industry networking',
  'Educational resources',
  'Future training opportunities',
];

const whyChoose = [
  { title: 'Since 2008', text: 'Over 15 years of commercial dragon fruit expertise in Africa.' },
  { title: 'Commercial Farming Specialists', text: 'From backyard orchards to large-scale commercial plantations.' },
  { title: 'African Industry Leaders', text: 'Founding members of the Dragon Fruit Association of Africa.' },
  { title: 'International Experience', text: 'Global network of agents, agronomists and export partners.' },
  { title: 'Professional Consultation', text: 'End-to-end farm planning and site assessment services.' },
  { title: 'Farm Planning', text: 'Layout, irrigation, trellis and cultivar mix designed to your site.' },
  { title: 'Certified Cultivars', text: 'True-to-type, disease-screened, self-pollinating varieties.' },
  { title: 'Ongoing Farmer Support', text: 'Technical guidance long after your orchard is established.' },
];

const faqs = [
  {
    question: 'How much does it cost to establish a 1 hectare dragon fruit farm?',
    answer:
      'A commercial 1-hectare dragon fruit farm typically requires around R110,000 in establishment costs, covering land preparation, concrete trellis posts, irrigation, 800 certified plants, soil amendments and miscellaneous setup. Actual costs vary by country, labour rates and site conditions.',
  },
  {
    question: 'How many dragon fruit plants per hectare?',
    answer:
      'The Dragon Fruit Association of Africa recommends a commercial planting density of 800 plants per hectare. This balance optimises light interception, airflow and access for pruning, harvesting and machinery.',
  },
  {
    question: 'When does a dragon fruit farm become profitable?',
    answer:
      'Most commercial orchards reach meaningful production in Year 2 and full commercial yields from Year 3 onwards, with the productive lifespan extending 15–20 years when planted with certified material and correctly managed.',
  },
  {
    question: 'Why buy certified dragon fruit plants through the Association?',
    answer:
      'Certified material guarantees true-to-type cultivars, disease-screened genetics and pollination compatibility. Association buyers also gain ongoing technical support, cultivar advice and access to local and international market opportunities.',
  },
  {
    question: 'Can I download the full 1 hectare dragon fruit business plan?',
    answer:
      'Yes. Use the download button on this page to access the complete PDF, including the detailed establishment budget, infrastructure plan, production timeline and financial projection.',
  },
];

export default function OneHectareCost() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="How Much Does It Cost to Establish a 1 Hectare Dragon Fruit Farm? | Wonderful Dragon Fruit South Africa"
        description="Discover the estimated costs of establishing a commercial 1-hectare dragon fruit farm. Download our comprehensive business plan, learn about certified cultivars, ongoing farmer support, and access to local and international market opportunities through the Dragon Fruit Association of Africa."
        keywords="1 hectare dragon fruit farm cost, dragon fruit business plan, commercial dragon fruit farming, dragon fruit establishment cost, pitaya farm investment, dragon fruit south africa"
        url="/education/1-hectare-dragon-fruit-farm-cost"
        type="article"
        image={heroImg}
      />
      <Header />
      <CartSidebar />

      {/* HERO */}
      <section className="relative min-h-[78vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Commercial dragon fruit plantation at sunrise"
            className="w-full h-full object-cover"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
        </div>
        <div className="container relative z-10 mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl text-white"
          >
            <Badge className="mb-5 bg-dragon-gold/20 text-dragon-gold border-dragon-gold/40 backdrop-blur">
              Commercial Investment Guide
            </Badge>
            <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight tracking-tight mb-4">
              How Much Does It Cost to Establish a 1 Hectare Dragon Fruit Farm?
            </h1>
            <p className="text-lg md:text-2xl text-white/90 mb-3 font-light">
              A Complete Investment Guide for Commercial Dragon Fruit Farming
            </p>
            <p className="text-base md:text-lg text-white/80 mb-8 max-w-2xl">
              Plan your investment with confidence using our comprehensive 1-hectare commercial dragon fruit farm establishment guide — budget, infrastructure requirements, and long-term investment outlook.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="bg-dragon-pink hover:bg-dragon-magenta text-white shadow-2xl shadow-dragon-pink/40"
              >
                <a href={businessPlan.url} target="_blank" rel="noopener noreferrer" download>
                  <Download className="mr-2 h-5 w-5" />
                  Download the Complete 1 Hectare Business Plan
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-white/10 backdrop-blur border-white/40 text-white hover:bg-white/20"
              >
                <Link to="/consultations">Book a Consultation</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* INTRODUCTION */}
      <section className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">Introduction</h2>
          <div className="prose prose-lg max-w-none text-foreground/85 space-y-4">
            <p>
              Commercial dragon fruit farming is one of the fastest-growing high-value fruit industries worldwide. Proper planning before establishment is essential to ensure long-term profitability, high yields and sustainable production.
            </p>
            <p>
              This guide has been developed by <strong>Wonderful Dragon Fruit South Africa (DFSA)</strong> and the <strong>Dragon Fruit Association of Africa</strong> to help new farmers understand the estimated costs involved in establishing a professional 1-hectare dragon fruit farm.
            </p>
            <p className="text-sm text-muted-foreground italic border-l-4 border-dragon-gold/60 pl-4">
              The figures provided are estimates and may vary depending on country, labour costs, exchange rates, infrastructure and site conditions.
            </p>
          </div>
        </motion.div>
      </section>

      {/* COST TABLE */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Estimated Establishment Costs</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A breakdown of the core investments required to establish a productive 1-hectare commercial orchard.
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl overflow-hidden shadow-xl border border-border bg-card"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gradient-to-r from-dragon-pink to-dragon-magenta text-white">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Item</th>
                    <th className="px-6 py-4 font-semibold">Description</th>
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Estimated Cost</th>
                    <th className="px-6 py-4 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {costRows.map((row) => (
                    <tr key={row.item} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-foreground">{row.item}</td>
                      <td className="px-6 py-4 text-foreground/80">{row.description}</td>
                      <td className="px-6 py-4 font-mono font-semibold text-dragon-magenta whitespace-nowrap">{row.cost}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{row.notes}</td>
                    </tr>
                  ))}
                  <tr className="bg-dragon-gold/10">
                    <td className="px-6 py-5 font-bold text-lg" colSpan={2}>
                      Total Establishment Cost (per hectare)
                    </td>
                    <td className="px-6 py-5 font-mono font-bold text-lg text-dragon-magenta whitespace-nowrap">R110,000</td>
                    <td className="px-6 py-5 text-sm text-muted-foreground">Estimate — see full plan for detail</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
          <p className="text-xs text-muted-foreground italic text-center mt-4">
            Figures based on Wonderful Dragonfruit / DFSA 2025 estimates.
          </p>
          <div className="mt-6 rounded-xl border border-dragon-gold/40 bg-dragon-gold/10 p-4 md:p-5 max-w-4xl mx-auto">
            <p className="text-sm text-foreground/80 leading-relaxed">
              <span className="font-semibold text-foreground">Disclaimer:</span> The estimated establishment costs provided are intended as a general planning guide. Actual costs may vary depending on current market conditions, regional labour rates, infrastructure requirements, supplier pricing, and increases in the cost of certified planting material and other agricultural inputs.
            </p>
          </div>
        </div>
      </section>

      {/* WHAT'S INCLUDED */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">What's Included</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            The essential components of a professionally established commercial dragon fruit orchard.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {included.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
            >
              <Card className="h-full hover:shadow-lg hover:-translate-y-1 transition-all border-border/60 group">
                <CardContent className="p-5">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-dragon-pink/15 to-dragon-magenta/15 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <item.icon className="h-5 w-5 text-dragon-magenta" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TIMELINE */}
      <section className="bg-gradient-to-br from-dragon-dark/[0.03] to-dragon-magenta/[0.03] py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Investment Timeline</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              What to expect at each stage of your commercial dragon fruit journey.
            </p>
          </div>
          <div className="relative grid md:grid-cols-3 gap-6 md:gap-8">
            <div className="hidden md:block absolute top-14 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-dragon-pink via-dragon-gold to-dragon-green" />
            {timeline.map((stage, i) => (
              <motion.div
                key={stage.year}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                <div className="flex flex-col items-center text-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-dragon-pink to-dragon-magenta flex items-center justify-center text-white shadow-lg shadow-dragon-pink/30 mb-3 relative z-10">
                    <Calendar className="h-7 w-7" />
                  </div>
                  <div className="text-sm font-semibold text-dragon-magenta tracking-widest uppercase">{stage.year}</div>
                  <h3 className="font-display text-2xl font-bold mt-1">{stage.title}</h3>
                </div>
                <Card className="bg-card/80 backdrop-blur border-border/60">
                  <CardContent className="p-6">
                    <ul className="space-y-2">
                      {stage.points.map((p) => (
                        <li key={p} className="flex items-start gap-2 text-sm text-foreground/80">
                          <CheckCircle2 className="h-4 w-4 text-dragon-green mt-0.5 flex-shrink-0" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPECTED RETURNS */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Expected Returns</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Dragon fruit rewards patient, professional growers with a durable, high-value crop.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {returns.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="h-full border-t-4 border-t-dragon-gold hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <r.icon className="h-8 w-8 text-dragon-gold mb-3" />
                  <h3 className="font-display text-xl font-bold mb-2">{r.title}</h3>
                  <p className="text-foreground/75">{r.text}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* IMPORTANT NOTICE */}
      <section className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-dragon-magenta/10 via-dragon-pink/5 to-dragon-gold/10 border-2 border-dragon-magenta/20 p-8 md:p-12 shadow-xl"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-dragon-magenta/15 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="h-7 w-7 text-dragon-magenta" />
            </div>
            <div>
              <div className="text-sm font-semibold text-dragon-magenta uppercase tracking-wider mb-1">Important Notice</div>
              <h3 className="font-display text-2xl md:text-3xl font-bold">Certified Plant Material Matters</h3>
            </div>
          </div>
          <p className="text-foreground/85 mb-4 leading-relaxed">
            For commercial success, the quality and genetic authenticity of your planting material is one of the most important investments you will make.
          </p>
          <p className="text-foreground/85 mb-6 leading-relaxed">
            The <strong>Dragon Fruit Association of Africa</strong> strongly recommends that new commercial farmers establish their orchards using certified planting material obtained through the Association or its authorised members.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              'True-to-type cultivars',
              'Healthy disease-free planting material',
              'High-yield commercial genetics',
              'Reliable pollination compatibility',
              'Consistent fruit quality',
              'Long-term productivity',
            ].map((b) => (
              <div key={b} className="flex items-center gap-3 bg-white/60 backdrop-blur rounded-lg px-4 py-3">
                <CheckCircle2 className="h-5 w-5 text-dragon-green flex-shrink-0" />
                <span className="text-sm font-medium">{b}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* EXCLUSIVE MEMBER BENEFITS - GOLD CARD */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto relative rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#c9a24b] via-[#e6c168] to-[#a37a2a]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_45%)]" />
          <div className="relative p-8 md:p-14 text-white">
            <Badge className="mb-4 bg-white/20 text-white border-white/40 backdrop-blur">
              <Award className="h-3 w-3 mr-1" /> Exclusive Association Benefit
            </Badge>
            <h3 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Exclusive Benefits for Association Plant Buyers
            </h3>
            <p className="text-white/90 mb-8 max-w-2xl">
              Farmers who purchase their plants through the Dragon Fruit Association of Africa receive access to:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              {memberBenefits.map((b) => (
                <div key={b} className="flex items-start gap-3 bg-white/10 backdrop-blur rounded-lg px-4 py-3 border border-white/20">
                  <CheckCircle2 className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium">{b}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/80 italic leading-relaxed max-w-3xl">
              *Market access opportunities are subject to product quality, production standards, seasonal demand, and applicable export or local market requirements. Purchasing plants does not guarantee market placement but provides access to the Association's support network and industry connections.
            </p>
          </div>
        </motion.div>
      </section>

      {/* WHY CHOOSE DFSA */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Why Choose Wonderful Dragon Fruit South Africa?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Africa's most experienced commercial dragon fruit specialists.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {whyChoose.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="h-full bg-card border-border/60 hover:border-dragon-pink/40 hover:shadow-lg transition-all">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-display">{c.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">{c.text}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DOWNLOAD SECTION */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center bg-gradient-to-br from-dragon-pink/10 via-background to-dragon-magenta/10 border border-dragon-pink/20 rounded-3xl p-10 md:p-14 shadow-xl"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-dragon-pink to-dragon-magenta flex items-center justify-center mx-auto mb-6 shadow-lg shadow-dragon-pink/30">
            <Download className="h-10 w-10 text-white" />
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Download the Complete 1 Hectare Business Plan</h2>
          <p className="text-muted-foreground mb-6">Our comprehensive PDF contains everything you need to plan a commercial dragon fruit orchard.</p>
          <ul className="text-left max-w-md mx-auto space-y-2 mb-8">
            {[
              'Detailed establishment budget',
              'Infrastructure planning',
              'Equipment recommendations',
              'Production timelines',
              'Commercial planting layout',
              'Financial planning',
              'Return on investment overview',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-foreground/85">
                <CheckCircle2 className="h-4 w-4 text-dragon-green flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-dragon-pink to-dragon-magenta hover:opacity-90 text-white shadow-xl shadow-dragon-pink/40 text-base px-8 py-6"
          >
            <a href={businessPlan.url} target="_blank" rel="noopener noreferrer" download>
              <Download className="mr-2 h-5 w-5" />
              Download Business Plan (PDF)
            </a>
          </Button>
        </motion.div>
      </section>

      {/* CONSULTATION CTA */}
      <section className="relative overflow-hidden bg-gradient-to-r from-dragon-dark via-dragon-magenta to-dragon-pink text-white py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="container relative mx-auto px-4 max-w-5xl text-center">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">Planning Your Commercial Dragon Fruit Farm?</h2>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Whether you are planning a 1-hectare orchard or a much larger commercial operation, our experienced team can help guide you through the planning and establishment process.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl mx-auto mb-10 text-left">
            {['Farm planning', 'Cultivar recommendations', 'Irrigation planning', 'Plant supply', 'Commercial production advice', 'Expansion planning'].map((s) => (
              <div key={s} className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-lg px-4 py-3 border border-white/20">
                <CheckCircle2 className="h-4 w-4 text-dragon-gold flex-shrink-0" />
                <span className="text-sm">{s}</span>
              </div>
            ))}
          </div>
          <Button
            asChild
            size="lg"
            className="bg-white text-dragon-magenta hover:bg-white/90 text-base px-8 py-6 shadow-2xl"
          >
            <Link to="/consultations">
              Book a Consultation
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection
        title="Frequently Asked Questions"
        description="Common questions about establishing a commercial 1-hectare dragon fruit farm."
        faqs={faqs}
      />
    </div>
  );
}
