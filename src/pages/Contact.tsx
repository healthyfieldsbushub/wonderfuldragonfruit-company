import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  Clock, 
  MapPin, 
  Send,
  Headphones,
  Globe,
  Copy
} from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { LocalBusinessSchema } from "@/components/seo/LocalBusinessSchema";
import { ConnectWithUs } from "@/components/contact/ConnectWithUs";
import { appClient } from "@/integrations/manus/client";
import { toast } from "sonner";
import { useState } from "react";

const contactMethods = [
  {
    icon: MessageCircle,
    title: "WhatsApp (Primary)",
    description: "Fastest way to reach us — instant messaging for orders, pricing, and consultations.",
    contact: "+27 83 447 4639",
    action: "https://wa.me/27834474639",
    actionLabel: "Chat on WhatsApp",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Clock,
    title: "Office Hours",
    description: "Monday – Saturday, 08:00 – 17:00 SAST. Main office: 22 Wren Street, Rant and Dal, Gauteng.",
    contact: "+27 83 447 4639",
    secondaryContact: "Krugersdorp, West Rand, Gauteng",
    action: "tel:+27834474639",
    actionLabel: "Call Office",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Mail,
    title: "Email",
    description: "Send us an email and we'll respond within 24 hours.",
    contact: "admin@proagrisa.co.za",
    action: "mailto:admin@proagrisa.co.za",
    actionLabel: "Send Email",
    gradient: "from-amber-500 to-orange-500",
  },
];

const whatsappNumbers = [
  {
    label: "Sales, Orders & Farming Advice",
    number: "+27834474639",
    display: "+27 83 447 4639",
    isAi: false,
  },
];

const companyContact = {
  group: "Healthy Fields Group",
  administrationEmail: "admin@proagrisa.co.za",
  ordersEmail: "orders@proagrisa.co.za",
  southAfricaWhatsApp: "+27 83 447 4639",
  southAfricaWhatsAppLink: "+27834474639",
  internationalContact: "+1 351 777 2848",
  internationalContactLink: "+13517772848",
  office: "22 Wren Street, Rant and Dal, Gauteng, South Africa",
};

const websiteRouting = [
  { name: "Wonderful Dragon Fruit / Wonderful Dragon Fruit South Africa", domain: "wonderfuldragonfruit.company", email: true, orders: true },
  { name: "Purely Health Nutra", domain: "purelyhealthnutra.company", email: true, orders: true },
  { name: "Living Culture Health", domain: "livingculturehealth.company", email: true, orders: true },
  { name: "Marketplace Hub", domain: "marketplacehub.company", email: true, orders: false },
  { name: "African Heritage Marketplace", domain: "africanheritagemarketplace.company", email: true, orders: false },
  { name: "Business OS Pro", domain: "businessospro.company", email: true, orders: false },
  { name: "Pocket School Pro", domain: "pocketschoolpro.company", email: true, orders: false },
  { name: "WildCamp", domain: "wildcamp.company", email: true, orders: false },
];

const Contact = () => {
  const [submitting, setSubmitting] = useState(false);

  const copyContact = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const subject = String(formData.get("subject") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    if (!name || !email || !message) {
      toast.error("Please fill in name, email and message");
      return;
    }

    setSubmitting(true);
    try {
      // Save enquiry to admin panel (works for both guests and signed-in users)
      const { error } = await appClient.from("customer_enquiries").insert({
        name: name.slice(0, 200),
        email: email.slice(0, 255),
        phone: phone || null,
        subject: subject || null,
        message: message.slice(0, 5000),
        source: "contact_form",
      });

      if (error) {
        console.error("Enquiry save error:", error);
        toast.error("Could not save your enquiry, but we'll still open WhatsApp.");
      } else {
        toast.success("Thanks! We've received your enquiry.");
        form.reset();
      }

      // Continue to WhatsApp for instant follow-up
      const whatsappMessage = `Hi DFSA! My name is ${name}.${subject ? `\nSubject: ${subject}` : ""}\n\n${message}\n\nEmail: ${email}${phone ? `\nPhone: ${phone}` : ""}`;
      window.open(
        `https://wa.me/27834474639?text=${encodeURIComponent(whatsappMessage)}`,
        "_blank"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Structured data: ContactPage + Organization with multiple ContactPoints
  // and a small FAQ block — both are eligible for Google rich results and
  // strengthen the page's topical authority for "contact dragon fruit ..." queries.
  const contactJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ContactPage',
        '@id': 'https://www.wonderfuldragonfruit.company/contact#contactpage',
        url: 'https://www.wonderfuldragonfruit.company/contact',
        name: 'Contact Wonderful Dragon Fruit South Africa (DFSA)',
        description:
          'Reach DFSA by phone, WhatsApp or email for dragon fruit plant orders, rooting services, training and farm consultations across South Africa and the rest of Africa.',
        inLanguage: 'en-ZA',
        isPartOf: { '@id': 'https://www.wonderfuldragonfruit.company#website' },
      },
      {
        '@type': 'Organization',
        '@id': 'https://www.wonderfuldragonfruit.company#organization',
        name: 'Wonderful Dragon Fruit South Africa',
        alternateName: ['DFSA', 'Wonderful Dragonfruit'],
        url: 'https://www.wonderfuldragonfruit.company',
        logo: 'https://www.wonderfuldragonfruit.company/og-image.png',
        email: 'admin@proagrisa.co.za',
        areaServed: ['ZA', 'BW', 'ZW', 'NA', 'ZM', 'MW', 'UG', 'Africa'],
        contactPoint: [
          {
            '@type': 'ContactPoint',
            telephone: '+27-83-447-4639',
            contactType: 'customer service',
            areaServed: 'ZA',
            availableLanguage: ['English', 'Afrikaans'],
            contactOption: ['TollFree', 'HearingImpairedSupported'],
          },
          {
            '@type': 'ContactPoint',
            telephone: '+27-83-447-4639',
            contactType: 'sales',
            areaServed: ['ZA', 'BW', 'ZW', 'NA'],
            availableLanguage: 'English',
          },
          {
            '@type': 'ContactPoint',
            telephone: '+1-351-777-2848',
            contactType: 'international customer service',
            areaServed: 'Worldwide',
            availableLanguage: 'English',
          },
          {
            '@type': 'ContactPoint',
            email: 'orders@proagrisa.co.za',
            contactType: 'sales and orders',
            areaServed: 'Worldwide',
            availableLanguage: 'English',
          },
          {
            '@type': 'ContactPoint',
            telephone: '+27-83-447-4639',
            contactType: 'technical support',
            areaServed: 'Africa',
            availableLanguage: 'English',
            hoursAvailable: 'Mo-Sa 08:00-17:00',
          },
        ],
        address: {
          '@type': 'PostalAddress',
          streetAddress: '22 Wren Street',
          addressLocality: 'Rant and Dal',
          addressRegion: 'Gauteng',
          addressCountry: 'ZA',
        },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
            opens: '08:00',
            closes: '17:00',
          },
        ],
        sameAs: [
          'https://www.wonderfuldragonfruit.company/',
          'https://www.tiktok.com/@maxvanheerden_proagrisa',
          'https://www.instagram.com/wonderful_dragon_fruit_dfsa',
          'https://www.linkedin.com/in/cornelius-andrias-van-heerden-10b18a350/',
          'https://www.youtube.com/@CorneliusAndriasVanHeerden',
          'https://x.com/HealthyFieldssa',
          'https://web.facebook.com/profile.php?id=61571339863052',
          'https://web.facebook.com/profile.php?id=61589209614070',
          'https://web.facebook.com/profile.php?id=61565301583319',
          'https://web.facebook.com/profile.php?id=61564586858163',
          'https://web.facebook.com/profile.php?id=61563159332764',
          'https://web.facebook.com/profile.php?id=61564791460426',
          'https://web.facebook.com/profile.php?id=61560728786177',
          'https://web.facebook.com/profile.php?id=61562992080499',
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How can I contact Wonderful Dragon Fruit South Africa?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Call or WhatsApp +27 83 447 4639, or email admin@proagrisa.co.za. We respond to all enquiries within 24 hours.',
            },
          },
          {
            '@type': 'Question',
            name: 'Do you ship dragon fruit plants outside South Africa?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. DFSA exports across Africa including Botswana, Zimbabwe, Namibia, Zambia, Malawi and Uganda. Cross-border orders require phytosanitary certification arranged at checkout.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I book a dragon fruit farming consultation?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Visit /consultations to book a paid consultation, or message us on WhatsApp for a quick discovery call.',
            },
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Contact DFSA | Dragon Fruit Plants & Farming Support Africa"
        description="Contact Wonderful Dragon Fruit South Africa (DFSA). Call or WhatsApp +27 83 447 4639, email admin@proagrisa.co.za for plant orders, rooting, training and consultations."
        keywords="contact dragon fruit south africa, buy dragon fruit plants, dragon fruit farming contact, whatsapp dragon fruit order, DFSA contact, dragon fruit consultation africa"
        url="/contact"
      />
      <Header />
      <CartSidebar />
      <LocalBusinessSchema />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <Breadcrumbs items={[{ label: 'Contact' }]} className="container mx-auto px-4 mb-4 relative z-10" />
        <div className="absolute inset-0 bg-gradient-to-br from-dragon-green/20 via-transparent to-dragon-pink/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.1),transparent_50%)]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <MessageCircle className="h-4 w-4" />
              Get in Touch
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Contact{" "}
              <span className="text-gradient-tropical">Us</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              We're always happy to help! Feel free to reach out to us using any of the options below, 
              and we'll make sure you get the support you need.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {contactMethods.map((method, index) => (
              <motion.div
                key={method.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full glass-card hover:shadow-xl transition-all duration-300 group overflow-hidden">
                  <CardContent className="p-6 relative">
                    {/* Gradient accent */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${method.gradient}`} />
                    
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${method.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <method.icon className="h-7 w-7 text-white" />
                    </div>
                    
                    <h3 className="font-display text-xl font-bold mb-2">{method.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{method.description}</p>
                    
                    <div className="space-y-1 mb-4">
                      <p className="font-semibold text-foreground">{method.contact}</p>
                      {method.secondaryContact && (
                        <p className="text-sm text-muted-foreground">{method.secondaryContact}</p>
                      )}
                    </div>
                    
                    <Button asChild className={`w-full bg-gradient-to-r ${method.gradient} hover:opacity-90`}>
                      <a href={method.action}>
                        {method.actionLabel}
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Healthy Fields Group contact directory */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-6 mb-12"
          >
            <div className="text-center max-w-3xl mx-auto">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary mb-2">Main company contact details</p>
              <h2 className="font-display text-3xl font-bold">{companyContact.group}</h2>
              <p className="text-muted-foreground mt-2">General enquiries, orders, sales and website administration.</p>
            </div>

            <Card className="glass-card overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="rounded-xl border bg-background/50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold mb-2"><Mail className="h-4 w-4 text-primary" />General enquiries & administration</div>
                    <a href={`mailto:${companyContact.administrationEmail}`} className="text-sm text-primary hover:underline break-all">{companyContact.administrationEmail}</a>
                    <Button type="button" variant="outline" size="sm" className="mt-3 gap-2" onClick={() => copyContact(companyContact.administrationEmail, "Administration email")}>
                      <Copy className="h-3.5 w-3.5" /> Copy email address
                    </Button>
                  </div>

                  <div className="rounded-xl border bg-background/50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold mb-2"><Mail className="h-4 w-4 text-primary" />Orders & sales</div>
                    <a href={`mailto:${companyContact.ordersEmail}`} className="text-sm text-primary hover:underline break-all">{companyContact.ordersEmail}</a>
                    <Button type="button" variant="outline" size="sm" className="mt-3 gap-2" onClick={() => copyContact(companyContact.ordersEmail, "Orders email")}>
                      <Copy className="h-3.5 w-3.5" /> Copy orders email
                    </Button>
                  </div>

                  <div className="rounded-xl border bg-background/50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold mb-2"><MessageCircle className="h-4 w-4 text-[#25D366]" />WhatsApp — South Africa</div>
                    <a href={`https://wa.me/${companyContact.southAfricaWhatsAppLink.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{companyContact.southAfricaWhatsApp}</a>
                    <Button type="button" variant="outline" size="sm" className="mt-3 gap-2" onClick={() => copyContact(companyContact.southAfricaWhatsApp, "South Africa number")}>
                      <Copy className="h-3.5 w-3.5" /> Copy SA number
                    </Button>
                  </div>

                  <div className="rounded-xl border bg-background/50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold mb-2"><Globe className="h-4 w-4 text-primary" />International contact</div>
                    <a href={`tel:${companyContact.internationalContactLink}`} className="text-sm text-primary hover:underline">{companyContact.internationalContact}</a>
                    <Button type="button" variant="outline" size="sm" className="mt-3 gap-2" onClick={() => copyContact(companyContact.internationalContact, "International number")}>
                      <Copy className="h-3.5 w-3.5" /> Copy international number
                    </Button>
                  </div>

                  <div className="rounded-xl border bg-background/50 p-4 sm:col-span-2">
                    <div className="flex items-center gap-2 text-sm font-semibold mb-2"><MapPin className="h-4 w-4 text-primary" />Main office</div>
                    <p className="text-sm text-muted-foreground">{companyContact.office}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center max-w-3xl mx-auto pt-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary mb-2">Website contact routing</p>
              <h2 className="font-display text-3xl font-bold">Choose the right team for each website</h2>
              <p className="text-muted-foreground mt-2">Dedicated addresses are shown where available. All listed websites currently route through the Healthy Fields Group administration team.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {websiteRouting.map((site) => (
                <Card key={site.domain} className="glass-card">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="font-display text-lg font-bold">{site.name}</h3>
                        <a href={`https://${site.domain}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{site.domain}</a>
                      </div>
                      <Globe className="h-5 w-5 text-primary shrink-0" />
                    </div>
                    <div className="space-y-3 text-sm">
                      {site.email && (
                        <div className="flex items-center justify-between gap-3 rounded-lg border bg-background/50 px-3 py-2">
                          <a href={`mailto:${companyContact.administrationEmail}`} className="text-primary hover:underline break-all">{companyContact.administrationEmail}</a>
                          <Button type="button" variant="ghost" size="sm" className="shrink-0 gap-1.5" onClick={() => copyContact(companyContact.administrationEmail, `${site.name} email`)}>
                            <Copy className="h-3.5 w-3.5" /> Copy
                          </Button>
                        </div>
                      )}
                      {site.orders && (
                        <div className="flex items-center justify-between gap-3 rounded-lg border bg-background/50 px-3 py-2">
                          <a href={`mailto:${companyContact.ordersEmail}`} className="text-primary hover:underline break-all">{companyContact.ordersEmail}</a>
                          <Button type="button" variant="ghost" size="sm" className="shrink-0 gap-1.5" onClick={() => copyContact(companyContact.ordersEmail, `${site.name} orders email`)}>
                            <Copy className="h-3.5 w-3.5" /> Copy
                          </Button>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-3 rounded-lg border bg-background/50 px-3 py-2">
                        <a href={`https://wa.me/${companyContact.southAfricaWhatsAppLink.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{companyContact.southAfricaWhatsApp}</a>
                        <Button type="button" variant="ghost" size="sm" className="shrink-0 gap-1.5" onClick={() => copyContact(companyContact.southAfricaWhatsApp, `${site.name} WhatsApp number`)}>
                          <Copy className="h-3.5 w-3.5" /> Copy
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* WhatsApp Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-card overflow-hidden">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2">
                  {/* WhatsApp Info */}
                  <div className="p-8 bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center">
                        <MessageCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-display text-2xl font-bold">WhatsApp Support</h3>
                        <p className="text-muted-foreground">Fastest way to reach us</p>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground mb-6">
                      Connect with our team instantly via WhatsApp. Get quick responses about products, 
                      pricing, bulk orders, and farming consultations.
                    </p>
                    
                    <div className="space-y-4">
                      {whatsappNumbers.map((wa, index) => {
                        const waLink = `https://wa.me/${wa.number.replace(/\D/g, "")}?text=${encodeURIComponent("Hi DFSA! I'd like dragon fruit advice and product information.")}`;
                        return (
                          <div key={index} className="flex items-center justify-between p-4 bg-background/50 rounded-xl border-2 border-[#25D366]/30">
                            <div>
                              <p className="font-medium flex items-center gap-2">
                                <Headphones className="h-4 w-4 text-[#25D366]" />
                                {wa.label}
                              </p>
                              <p className="text-sm text-muted-foreground">{wa.display}</p>
                              <p className="text-xs text-muted-foreground/80 mt-1">
                                AI-powered reception for instant dragon fruit advice & enquiries
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-[#25D366] hover:bg-[#128C7E] text-white text-sm font-medium transition-colors"
                              >
                                <MessageCircle className="h-4 w-4" />
                                Chat
                              </a>
                              <a
                                href={`tel:${wa.number}`}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-input text-sm font-medium hover:bg-accent transition-colors"
                              >
                                <Phone className="h-4 w-4" />
                                Call
                              </a>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* After-hours WhatsApp */}
                      <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl border-2 border-[#25D366]/30">
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[#25D366]" />
                            After-Hours WhatsApp
                          </p>
                          <p className="text-sm text-muted-foreground">+27 83 447 4639</p>
                        </div>
                        <WhatsAppButton 
                          message="Hi DFSA! I need after-hours assistance."
                          className="px-4"
                        >
                          Chat
                        </WhatsAppButton>
                      </div>
                    </div>
                  </div>

                  {/* Contact Form */}
                  <div className="p-8 bg-card">
                    <h3 className="font-display text-2xl font-bold mb-2">Send us a Message</h3>
                    <p className="text-muted-foreground mb-6">
                      Fill out the form and we'll get back to you shortly.
                    </p>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Your Name</Label>
                          <Input 
                            id="name" 
                            name="name" 
                            placeholder="John Doe" 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input 
                            id="email" 
                            name="email" 
                            type="email" 
                            placeholder="john@example.com" 
                            required 
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number (Optional)</Label>
                        <Input 
                          id="phone" 
                          name="phone" 
                          type="tel" 
                          placeholder="+27 83 000 0000" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input 
                          id="subject" 
                          name="subject" 
                          placeholder="Product inquiry, bulk order, consultation..." 
                          required 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="message">Your Message</Label>
                        <Textarea 
                          id="message" 
                          name="message" 
                          placeholder="Tell us how we can help you..." 
                          rows={4}
                          required 
                        />
                      </div>
                      
                      <Button type="submit" disabled={submitting} className="w-full btn-sunset gap-2">
                        <Send className="h-4 w-4" />
                        {submitting ? "Sending..." : "Send Message"}
                      </Button>
                      
                      <p className="text-xs text-center text-muted-foreground">
                        Your message will open in WhatsApp for instant delivery
                      </p>
                    </form>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Connect With Us — Social & Regional Networks */}
      <ConnectWithUs />

      {/* Business Info */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="glass-card">
              <CardContent className="p-6">
                <MapPin className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-display text-lg font-bold mb-1">Office</h3>
                <p className="text-muted-foreground text-sm">22 Wren Street, Rant and Dal<br />Gauteng, South Africa</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-6">
                <Clock className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-display text-lg font-bold mb-1">Business Hours</h3>
                <p className="text-muted-foreground text-sm">Monday – Saturday<br />08:00 – 17:00 SAST</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-6">
                <Globe className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-display text-lg font-bold mb-1">Website</h3>
                <p className="text-muted-foreground text-sm"><a href="https://www.wonderfuldragonfruit.company" className="hover:text-primary">wonderfuldragonfruit.company</a><br /><a href="mailto:admin@proagrisa.co.za" className="hover:text-primary">admin@proagrisa.co.za</a><br /><a href="mailto:orders@proagrisa.co.za" className="hover:text-primary">orders@proagrisa.co.za</a></p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Countries Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Globe className="h-6 w-6 text-primary" />
              <h2 className="font-display text-2xl font-bold">We Ship Worldwide</h2>
            </div>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Wonderful Dragon Fruit South Africa exports premium dragon fruit plants to farmers across Africa and worldwide.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3">
              {['South Africa', 'Botswana', 'Zambia', 'Zimbabwe', 'Uganda', 'Namibia', 'Malawi', 'Worldwide'].map((country) => (
                <span
                  key={country}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background border text-sm font-medium"
                >
                  <MapPin className="h-3 w-3 text-primary" />
                  {country}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-8 md:p-12 rounded-3xl max-w-3xl mx-auto"
          >
            <h2 className="font-display text-3xl font-bold mb-4">
              Ready to Start Your Dragon Fruit Journey?
            </h2>
            <p className="text-muted-foreground mb-8">
              Whether you're a hobbyist or a commercial farmer, we're here to help you succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <WhatsAppButton className="text-lg px-8 py-6 rounded-full">
                Chat on WhatsApp
              </WhatsAppButton>
              <Button asChild size="lg" variant="outline" className="rounded-full px-8">
                <a href="tel:+27834474639">
                  <Phone className="h-5 w-5 mr-2" />
                  Call +27 83 447 4639
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
