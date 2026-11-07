import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, MessageCircle, Phone, Mail, Award, Globe, Users, Package, ChevronRight, Shield, Truck, Sprout } from 'lucide-react';
import { appClient } from '@/integrations/manus/client';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

import heroImg from '@/assets/commercial-hero.jpg';
import nurseryImg from '@/assets/commercial-nursery.jpg';
import africaImg from '@/assets/commercial-africa.jpg';
import exportImg from '@/assets/commercial-export.jpg';
import supportImg from '@/assets/commercial-support.jpg';
import processImg from '@/assets/commercial-process.jpg';
import ctaImg from '@/assets/commercial-cta.jpg';

const WHATSAPP_NUMBER = '27696569846';
const WHATSAPP_MSG = encodeURIComponent(
  `Hello and welcome to DFSA Healthy Fields SA 🌱\nThank you for your interest in our dragon fruit plants.\n\nPlease let us know:\n✅ Your country\n✅ Number of plants required\n✅ When you would like to start\n\nWe will assist you with pricing, availability, and full guidance.`
);

function BannerSection({ image, children, id, overlay = true }: { image: string; children: React.ReactNode; id?: string; overlay?: boolean }) {
  return (
    <section id={id} className="relative w-full">
      <div className="absolute inset-0">
        <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" />
        {overlay && <div className="absolute inset-0 bg-black/55" />}
      </div>
      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        {children}
      </div>
    </section>
  );
}

function TrustBadge({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-white text-sm font-medium">
      <Icon className="h-4 w-4 text-primary" />
      {label}
    </div>
  );
}

export default function CommercialOrders() {
  const [formData, setFormData] = useState({
    full_name: '', country: '', phone: '', email: '', plants_needed: '', message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.country || !formData.phone || !formData.email || !formData.plants_needed) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await appClient.from('commercial_leads').insert({
      full_name: formData.full_name,
      country: formData.country,
      phone: formData.phone,
      email: formData.email,
      plants_needed: formData.plants_needed,
      message: formData.message || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Submission failed', description: error.message, variant: 'destructive' });
    } else {
      setSubmitted(true);
      toast({ title: 'Quote request submitted!', description: 'We will respond within 24 hours.' });
    }
  };

  const openWhatsApp = () => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`, '_blank');

  const faqs = [
    { q: 'How long does shipping take?', a: 'Domestic (South Africa): 3–5 business days. Africa: 7–14 business days. International: 5–10 business days. All shipments include tracking and are carefully packed to ensure plant quality on arrival.' },
    { q: 'How do I care for newly received plants?', a: 'Unbox immediately. Place cuttings in a shaded area for 2–3 days. Plant in well-draining soil at a depth of 5–10 cm. Water lightly and avoid direct sunlight for the first week.' },
    { q: 'What is the export process?', a: 'We handle all phytosanitary certificates, export permits, and customs documentation. Plants are treated, inspected, and packed to meet international plant health standards.' },
    { q: 'Do you offer ongoing support after purchase?', a: 'Yes, we offer ongoing support to all our clients to ensure successful plant establishment and growth. Access to the Dragon Fruit Association of Africa and its full benefits is available under the following conditions: Clients who purchase 1,000 plants or more are automatically included. Alternatively, clients may join through a monthly membership. Association benefits begin after membership activation and include training, guidance, and access to the farmer network.' },
  ];

  return (
    <>
      <SEOHead
        title="Commercial Dragon Fruit Plant Orders | DFSA Healthy Fields SA"
        description="Order commercial dragon fruit plants from Africa's pioneer supplier. 18+ years experience. Bulk orders 100–5 000+ plants. Export to Africa, USA, Europe & UAE."
        url="/education/commercial-orders"
      />

      <Header />
      <main className="pt-16 md:pt-20">

        {/* HERO */}
        <section className="relative w-full min-h-[80vh] flex items-center">
          <div className="absolute inset-0">
            <img src={heroImg} alt="Commercial dragon fruit farm with rows of plants on trellis poles" className="w-full h-full object-cover" width={1920} height={1080} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
          </div>
          <div className="relative z-10 container mx-auto px-4 py-20 md:py-32">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl">
              <div className="flex flex-wrap gap-3 mb-6">
                <TrustBadge icon={Award} label="18+ Years Experience" />
                <TrustBadge icon={Globe} label="Africa's Pioneer Supplier" />
                <TrustBadge icon={Shield} label="Export Certified" />
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 leading-tight">
                Commercial Dragon Fruit Plant Orders
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl">
                Trusted African supplier with over 18 years of proven experience
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="text-lg px-8 py-6" onClick={() => document.getElementById('quote-form')?.scrollIntoView({ behavior: 'smooth' })}>
                  Request a Quote <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" className="text-lg px-8 py-6 bg-[#25D366] hover:bg-[#1da851] text-white border-none" onClick={openWhatsApp}>
                  <MessageCircle className="mr-2 h-5 w-5" /> WhatsApp Us
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 1 — EXPERIENCE */}
        <BannerSection image={nurseryImg}>
          <div className="max-w-3xl">
            <span className="text-primary font-semibold uppercase tracking-wider text-sm">Our Heritage</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mt-2 mb-6">18+ Years of Dragon Fruit Expertise</h2>
            <p className="text-lg text-white/90 leading-relaxed">
              DFSA Healthy Fields SA has been actively involved in the dragon fruit industry since 2008, bringing over 18 years of hands-on experience in plant propagation, commercial farming, and farmer support across Africa. Our knowledge is built on real farming success, not theory.
            </p>
          </div>
        </BannerSection>

        {/* SECTION 2 — AFRICA IMPACT */}
        <BannerSection image={africaImg}>
          <div className="max-w-3xl">
            <span className="text-primary font-semibold uppercase tracking-wider text-sm">Continental Impact</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mt-2 mb-6">Pioneers of Dragon Fruit in Africa</h2>
            <p className="text-lg text-white/90 leading-relaxed mb-8">
              We are proud pioneers of the dragon fruit industry in Africa, being the first to import dragon fruit plants onto the continent and establish commercial production.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { year: '2009', country: 'Botswana' },
                { year: '2010', country: 'Namibia' },
                { year: '2010', country: 'First Commercial Farm in South Africa (KwaZulu-Natal)' },
                { year: '2014', country: 'Kenya' },
              ].map((item) => (
                <div key={item.country} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-5 py-4 border border-white/20">
                  <span className="text-primary font-bold text-2xl">{item.year}</span>
                  <span className="text-white font-medium">{item.country}</span>
                </div>
              ))}
            </div>
          </div>
        </BannerSection>

        {/* SECTION 3 — EXPORT */}
        <BannerSection image={exportImg}>
          <div className="max-w-3xl">
            <span className="text-primary font-semibold uppercase tracking-wider text-sm">Global Reach</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mt-2 mb-6">Local & Global Distribution</h2>
            <p className="text-lg text-white/90 leading-relaxed mb-8">
              We supply dragon fruit plants across all African countries and export internationally to the United States, Europe, and the United Arab Emirates. Our logistics process ensures plants arrive safely, healthy, and ready for planting.
            </p>
            <div className="flex flex-wrap gap-3">
              {['All African Countries', 'United States', 'Europe', 'United Arab Emirates'].map((r) => (
                <span key={r} className="bg-primary/20 text-primary border border-primary/30 rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2">
                  <Truck className="h-4 w-4" /> {r}
                </span>
              ))}
            </div>
          </div>
        </BannerSection>

        {/* SECTION 4 — SUPPORT */}
        <BannerSection image={supportImg}>
          <div className="max-w-3xl">
            <span className="text-primary font-semibold uppercase tracking-wider text-sm">Your Success Partner</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mt-2 mb-6">Full Farmer Support & Association Backing</h2>
            <p className="text-lg text-white/90 leading-relaxed mb-8">
              When you order from DFSA Healthy Fields SA, you gain access to ongoing support through the Dragon Fruit Association of Africa.
            </p>
            <div className="space-y-3">
              {[
                'Professional training and guidance',
                'Ongoing farming support',
                'Proven cultivation methods',
                'Access to a growing farmer network',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-white">
                  <div className="h-6 w-6 rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-lg">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </BannerSection>

        {/* SECTION 5 — ORDER PROCESS */}
        <BannerSection image={processImg}>
          <div className="max-w-3xl">
            <span className="text-primary font-semibold uppercase tracking-wider text-sm">Our Process</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mt-2 mb-6">How Commercial Orders Work</h2>
            <p className="text-lg text-white/90 leading-relaxed mb-8">
              For large commercial orders of 500 to 1 000 plants, preparation takes 5 to 7 working days.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {['Cutting', 'Treatment', 'Rooting Hormone', 'Drying', 'Packing & Shipping'].map((step, i) => (
                <div key={step} className="flex flex-col items-center text-center">
                  <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold mb-3">
                    {i + 1}
                  </div>
                  <span className="text-white font-medium text-sm">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </BannerSection>

        {/* LEAD CAPTURE FORM */}
        <section id="quote-form" className="bg-background py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">Request Your Commercial Quote</h2>
                  <p className="text-muted-foreground text-lg mb-8">Get expert guidance and pricing within 24 hours</p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-foreground">
                      <Phone className="h-5 w-5 text-primary" />
                      <span>+27 83 447 4639 (SA) / +1 351 777 2848 (Intl)</span>
                    </div>
                    <div className="flex items-center gap-3 text-foreground">
                      <Mail className="h-5 w-5 text-primary" />
                      <span>admin@proagrisa.co.za</span>
                    </div>
                    <div className="flex items-center gap-3 text-foreground">
                      <MessageCircle className="h-5 w-5 text-primary" />
                      <button onClick={openWhatsApp} className="text-primary hover:underline font-medium">Chat on WhatsApp</button>
                    </div>
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <span className="bg-primary/10 text-primary rounded-full px-4 py-2 text-xs font-semibold flex items-center gap-1"><Award className="h-3 w-3" /> 18+ Years</span>
                    <span className="bg-primary/10 text-primary rounded-full px-4 py-2 text-xs font-semibold flex items-center gap-1"><Globe className="h-3 w-3" /> Pioneer</span>
                    <span className="bg-primary/10 text-primary rounded-full px-4 py-2 text-xs font-semibold flex items-center gap-1"><Shield className="h-3 w-3" /> Export Certified</span>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-lg">
                  {submitted ? (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                        <Check className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground mb-2">Quote Request Received!</h3>
                      <p className="text-muted-foreground mb-6">Our team will respond within 24 hours with pricing and guidance.</p>
                      <Button onClick={openWhatsApp} className="gap-2">
                        <MessageCircle className="h-4 w-4" /> Get Faster Response on WhatsApp
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">Full Name *</label>
                        <Input placeholder="Your full name" value={formData.full_name} onChange={(e) => setFormData(p => ({ ...p, full_name: e.target.value }))} required maxLength={100} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">Country *</label>
                        <Input placeholder="e.g. South Africa, Botswana, Kenya" value={formData.country} onChange={(e) => setFormData(p => ({ ...p, country: e.target.value }))} required maxLength={100} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">Phone (WhatsApp) *</label>
                        <Input placeholder="+27 ..." type="tel" value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} required maxLength={20} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">Email *</label>
                        <Input placeholder="your@email.com" type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} required maxLength={255} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">Number of Plants Needed *</label>
                        <Select value={formData.plants_needed} onValueChange={(v) => setFormData(p => ({ ...p, plants_needed: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select quantity" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="150">150 Plants</SelectItem>
                            <SelectItem value="600">600 Plants</SelectItem>
                            <SelectItem value="1000">1 000 Plants</SelectItem>
                            <SelectItem value="2000">2 000 Plants</SelectItem>
                            <SelectItem value="3000">3 000 Plants</SelectItem>
                            <SelectItem value="5000">5 000 Plants</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">Message</label>
                        <Textarea placeholder="Any additional details or questions..." value={formData.message} onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))} maxLength={1000} rows={3} />
                      </div>
                      <Button type="submit" className="w-full text-lg py-6" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Request Commercial Quote'}
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <BannerSection image={ctaImg}>
          <div className="text-center max-w-3xl mx-auto">
            <Sprout className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">Start Your Dragon Fruit Farming Journey Today</h2>
            <p className="text-lg text-white/80 mb-8">Join hundreds of successful farmers across Africa and beyond. Let DFSA Healthy Fields SA be your trusted partner.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="text-lg px-8 py-6" onClick={() => document.getElementById('quote-form')?.scrollIntoView({ behavior: 'smooth' })}>
                Request Commercial Quote <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white/20" onClick={openWhatsApp}>
                <MessageCircle className="mr-2 h-5 w-5" /> Speak to an Expert
              </Button>
            </div>
          </div>
        </BannerSection>

        {/* TESTIMONIALS */}
        <section className="bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-display font-bold text-foreground text-center mb-12">What Our Farmers Say</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                { name: 'Thabo M.', location: 'KwaZulu-Natal, South Africa', text: 'DFSA provided me with 1 000 plants and full guidance. My first harvest exceeded expectations. Their support is unmatched.' },
                { name: 'Grace K.', location: 'Nairobi, Kenya', text: 'The plants arrived in perfect condition after international shipping. The team helped me every step of the way from planting to first fruit.' },
                { name: 'David N.', location: 'Gaborone, Botswana', text: 'I started with 500 plants in 2019. Today I have a thriving commercial farm. DFSA\'s expertise made all the difference.' },
              ].map((t) => (
                <div key={t.name} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-500">★</span>
                    ))}
                  </div>
                  <p className="text-muted-foreground italic mb-4">"{t.text}"</p>
                  <p className="font-bold text-foreground">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.location}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-background py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-display font-bold text-foreground text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <details key={faq.q} className="group bg-card border border-border rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between p-5 cursor-pointer font-medium text-foreground hover:bg-muted/50 transition-colors">
                    {faq.q}
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="px-5 pb-5 text-muted-foreground">{faq.a}</div>
                </details>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-8">For detailed pricing, please refer to our website or request a custom quote.</p>
          </div>
        </section>

        {/* JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "Commercial Dragon Fruit Plants",
          "description": "Bulk dragon fruit plant orders for commercial farming. 100-5000+ plants available.",
          "brand": { "@type": "Brand", "name": "DFSA Healthy Fields SA" },
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "ZAR",
            "availability": "https://schema.org/InStock",
            "offerCount": "4"
          },
          "manufacturer": {
            "@type": "Organization",
            "name": "Dragon Fruit Association of Africa",
            "url": "https://www.wonderfuldragonfruit.company",
            "foundingDate": "2008",
            "telephone": "+27834474639"
          }
        }) }} />
      </main>
      <footer className="py-8 bg-muted/50">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2026 Wonderful Dragon Fruit South Africa. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
