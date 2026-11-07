import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Facebook,
  Instagram,
  Sprout,
  GraduationCap,
  Brain,
  Handshake,
  Users,
  School,
  Tractor,
  Cpu,
  Send,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SEOHead } from "@/components/seo/SEOHead";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { appClient } from "@/integrations/manus/client";
import { toast } from "sonner";

const enquiryCategories = [
  "Community Development",
  "School Education",
  "Agricultural Training",
  "Farmer Development",
  "AI & Technology",
  "Project Sponsorship",
  "Business Partnership",
  "Affiliate Partnership",
  "General Enquiry",
];

const communityTopics = [
  { icon: Users, title: "Rural community agricultural development", text: "Exploring practical farming opportunities that fit local climates, soils and community needs." },
  { icon: Sprout, title: "Emerging and developing farmer support", text: "Sharing cultivation knowledge with new and developing farmers getting started in commercial agriculture." },
  { icon: Users, title: "Community food production initiatives", text: "Supporting community-based food gardens and small-scale production projects." },
  { icon: Sprout, title: "Sustainable agricultural practices", text: "Promoting soil health, water-wise production and environmentally responsible farming." },
  { icon: Tractor, title: "Agricultural entrepreneurship", text: "Encouraging farm business thinking, record keeping and market readiness." },
  { icon: Tractor, title: "Agricultural demonstration projects", text: "Proposed demonstration plots to show cultivation methods in practice, subject to partnerships." },
  { icon: Users, title: "Community-based farming opportunities", text: "Exploring shared farming models where land, labour and knowledge can come together." },
  { icon: Sprout, title: "Soil health and sustainable production", text: "Education on composting, soil biology and low-input production methods." },
  { icon: Tractor, title: "Water conservation and irrigation awareness", text: "Practical guidance on efficient irrigation and water-stewardship in water-scarce regions." },
  { icon: Users, title: "Access to agricultural knowledge and resources", text: "Making reliable, practical growing information freely accessible to communities." },
];

const educationTopics = [
  { icon: School, title: "Introducing agriculture into schools", text: "Working with schools to bring agriculture into the classroom and schoolyard." },
  { icon: School, title: "School agricultural development programmes", text: "Proposed structured programmes, subject to school and partner collaboration." },
  { icon: Sprout, title: "School gardens and food production", text: "Practical school gardens where learners grow real crops and see the results." },
  { icon: GraduationCap, title: "Practical crop production education", text: "Hands-on teaching of planting, care, harvesting and post-harvest basics." },
  { icon: Sprout, title: "Soil management and composting", text: "Understanding healthy soil as the foundation of all farming." },
  { icon: Sprout, title: "Sustainable agriculture", text: "Farming methods that protect land and water for future generations." },
  { icon: Tractor, title: "Hydroponics and alternative farming", text: "Introducing soilless and water-efficient growing technologies." },
  { icon: Sprout, title: "Water conservation", text: "Practical water stewardship for learners and small growers." },
  { icon: Cpu, title: "Modern farming technologies", text: "Exposure to the digital tools changing modern agriculture." },
  { icon: GraduationCap, title: "Agricultural entrepreneurship", text: "Turning growing skills into small-business opportunities." },
  { icon: Tractor, title: "Introduction to commercial agriculture", text: "How commercial farms plan, produce and sell at scale." },
  { icon: GraduationCap, title: "Future agricultural career opportunities", text: "Careers in agronomy, farm management, agricultural technology and beyond." },
];

const trainingTopics = [
  { icon: Sprout, title: "Dragon fruit farming and commercial cultivation", text: "Site selection, trellising, pollination, pruning and harvest fundamentals." },
  { icon: Tractor, title: "Crop production and farm management", text: "Planning, scheduling and managing a productive operation." },
  { icon: Sprout, title: "Soil improvement and biofertilizers", text: "Building soil fertility with biological inputs and composting." },
  { icon: Tractor, title: "Irrigation and water management", text: "Designing efficient irrigation for water-scarce conditions." },
  { icon: Sprout, title: "Sustainable farming methods", text: "Low-input, high-responsibility production practices." },
  { icon: Users, title: "Agricultural business administration", text: "Records, costing, invoicing and compliance basics for farm businesses." },
  { icon: GraduationCap, title: "Agricultural entrepreneurship", text: "From business plan to first sale: building a viable farming enterprise." },
  { icon: Cpu, title: "Digital farming", text: "Using data and digital tools to make better decisions on the farm." },
  { icon: Brain, title: "AI-assisted agricultural management", text: "An introduction to how AI tools can support planning and information access." },
  { icon: Users, title: "Farm record keeping", text: "Practical, simple systems for tracking inputs, outputs and costs." },
  { icon: Cpu, title: "Agricultural technology", text: "Sensors, automation and tools relevant to African growing conditions." },
];

const deliveryOptions = [
  "Online education",
  "Practical demonstrations",
  "Agricultural workshops",
  "Community outreach",
  "School programmes",
  "Collaborative agricultural projects",
];

const partnerAudiences = [
  "Corporate sponsors",
  "Agricultural businesses",
  "Educational institutions",
  "Development organisations",
  "Community organisations",
  "Agricultural suppliers",
  "Technology companies",
  "International development partners",
  "Individuals interested in agricultural development",
];

const collaborationAreas = [
  "Community agricultural projects",
  "School agricultural programmes",
  "Youth development",
  "Farmer training",
  "Agricultural demonstrations",
  "Equipment sponsorship",
  "Agricultural resource sponsorship",
  "Digital agriculture",
  "AI and technology development",
  "Community food production",
  "Agricultural knowledge sharing",
];

// Affiliated business network. URLs are used exactly as supplied; do not
// replace them with proposed usernames. Business #24 is withheld pending
// confirmation of its identity.
const businessNetwork = [
  { name: "African Heritage Marketplace", tagline: "Africa's Cultural Commerce Platform", fb: "https://web.facebook.com/profile.php?id=61594862187424", ig: null },
  { name: "Business OS Pro", tagline: "AI CRM & Business Automation Platform", fb: "https://web.facebook.com/profile.php?id=61594693144944", ig: null },
  { name: "DFSA Members Network", tagline: "Dragon fruit farmer development network", fb: "https://web.facebook.com/profile.php?id=61563159332764", ig: null },
  { name: "Dragon Fruit Worldwide South Africa Plant Supply", tagline: "Commercial dragon fruit plant supply", fb: "https://web.facebook.com/profile.php?id=61563501713802", ig: null },
  { name: "GradeMaster AI Tutor Africa", tagline: "AI-powered learning support for students", fb: "https://web.facebook.com/GradeMasterAITutorAfrica/", ig: "https://www.instagram.com/grademasteraitutorafrica/" },
  { name: "Living Culture Health", tagline: "Health & wellness products", fb: "https://web.facebook.com/profile.php?id=61595415033229", ig: "https://www.instagram.com/livingculturehealth.company/" },
  { name: "Market Place Hub SADC & UAE", tagline: "Cross-border marketplace platform", fb: "https://web.facebook.com/marketplacehub.africa/", ig: "https://www.instagram.com/marketplacehub.company/" },
  { name: "PixelPerfect AI", tagline: "AI creative technology platform", fb: "https://web.facebook.com/profile.php?id=61562823160217", ig: null },
  { name: "PocketSchoolPro", tagline: "Digital tools for schools", fb: "https://web.facebook.com/PocketSchoolPro/", ig: null },
  { name: "ProAgri-SA CRM Company", tagline: "Agricultural CRM platform", fb: "https://web.facebook.com/proagrisa/", ig: "https://www.instagram.com/proagrisa/" },
  { name: "ProAgriSA Education – Technical Schools", tagline: "Technical education for agriculture", fb: "https://web.facebook.com/profile.php?id=61563974604325", ig: null },
  { name: "ProAgriSA SA News Today", tagline: "Agricultural news and updates", fb: "https://web.facebook.com/profile.php?id=61560748018060", ig: null },
  { name: "ProAgriSA SA Nuus Vandag", tagline: "Landbou nuus en opdaterings", fb: "https://web.facebook.com/profile.php?id=61560488964068", ig: null },
  { name: "ProAgriSA Spirulina & Chlorella Africa", tagline: "Micro algae nutrition & cultivation", fb: "https://web.facebook.com/profile.php?id=61564838022257", ig: null },
  { name: "ProAgriSA Wonderful Dragon Fruit Botswana", tagline: "Dragon fruit development in Botswana", fb: "https://web.facebook.com/profile.php?id=61589209614070", ig: null },
  { name: "ProAgriSA Wonderful Dragon Fruit DFSA", tagline: "Dragon Fruit South Africa network", fb: "https://web.facebook.com/profile.php?id=61571339863052", ig: null },
  { name: "ProAgriSA Wonderful Dragon Fruit Malawi", tagline: "Dragon fruit development in Malawi", fb: "https://web.facebook.com/profile.php?id=61562992080499", ig: null },
  { name: "ProAgriSA Wonderful Dragon Fruit Mozambique", tagline: "Dragon fruit development in Mozambique", fb: "https://web.facebook.com/profile.php?id=61560728786177", ig: null },
  { name: "ProAgriSA Wonderful Dragon Fruit Namibia", tagline: "Dragon fruit development in Namibia", fb: "https://web.facebook.com/profile.php?id=61565301583319", ig: null },
  { name: "ProAgriSA Wonderful Dragon Fruit Zimbabwe", tagline: "Dragon fruit development in Zimbabwe", fb: "https://web.facebook.com/profile.php?id=61564586858163", ig: null },
  { name: "Purely Health Nutra", tagline: "Gut Health Probiotics South Africa", fb: "https://web.facebook.com/profile.php?id=61566672006628", ig: "https://www.instagram.com/purelyhealthnutracom/" },
];

const sectionIcon = {
  community: Users,
  education: School,
  training: Tractor,
  ai: Cpu,
  partners: Handshake,
} as const;

function SectionHeading({
  icon: Icon,
  eyebrow,
  title,
}: {
  icon: (typeof sectionIcon)[keyof typeof sectionIcon];
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
        <h2 className="font-display text-2xl md:text-3xl font-bold">{title}</h2>
      </div>
    </div>
  );
}

function TopicGrid({ items }: { items: { icon: typeof Users; title: string; text: string }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.title} className="h-full">
          <CardContent className="pt-5">
            <item.icon className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-semibold mb-1">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.text}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function CommunityDevelopment() {
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [category, setCategory] = useState("General Enquiry");

  // Scroll to the section referenced by the hash (e.g. #education-training)
  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.replace("#", ""));
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
      }
    }
  }, [location.hash]);

  const openFormWith = (cat: string) => {
    setCategory(cat);
    document.getElementById("enquiry-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    // Honeypot: hidden field that only bots fill in.
    if (String(data.get("company_website") ?? "").trim()) return;

    const name = String(data.get("full_name") ?? "").trim();
    const organisation = String(data.get("organisation") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const country = String(data.get("country") ?? "").trim();
    const projectName = String(data.get("project_name") ?? "").trim();
    const projectDescription = String(data.get("project_description") ?? "").trim();
    const proposedSupport = String(data.get("proposed_support") ?? "").trim();
    const resources = String(data.get("resources") ?? "").trim();
    const additionalMessage = String(data.get("message") ?? "").trim();

    if (!name || !email || !projectDescription) {
      toast.error("Please fill in your name, email and a short project description");
      return;
    }

    const message = [
      `Enquiry category: ${category}`,
      organisation ? `Organisation/Company: ${organisation}` : null,
      country ? `Country: ${country}` : null,
      projectName ? `Project name: ${projectName}` : null,
      `Project description: ${projectDescription}`,
      proposedSupport ? `Proposed partnership/sponsorship: ${proposedSupport}` : null,
      resources ? `Available resources: ${resources}` : null,
      additionalMessage ? `Additional message: ${additionalMessage}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    setSubmitting(true);
    try {
      const { error } = await appClient.from("customer_enquiries").insert({
        name: name.slice(0, 200),
        email: email.slice(0, 200),
        phone: phone ? phone.slice(0, 50) : null,
        subject: `[${category}]${projectName ? ` ${projectName}` : ""}`.slice(0, 200),
        message: message.slice(0, 5000),
        source: "community_development",
      });
      if (error) throw error;
      setSubmitted(true);
      form.reset();
      toast.success("Thank you! Your enquiry has been received.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit your enquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SEOHead
        title="ProAgriSA Community Development, Agricultural Education & AI Innovation"
        description="ProAgriSA supports agricultural community development, farmer support, education, school outreach, skills development, partnerships and AI innovation across South Africa and Africa."
        keywords="ProAgriSA Community Development, Agricultural Community Development South Africa, Agricultural Training South Africa, Agricultural Education for Schools, Rural Farmer Development, Youth Agricultural Development, Agricultural Outreach Programmes, Agricultural Project Partnerships, AI in Agriculture South Africa, Dragon Fruit South Africa DFSA"
        url="/community-development"
      />
      <Header />
      <CartSidebar />
      <WhatsAppButton />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Community Development" },
            ]}
            className="mb-6"
          />

          {/* Hero */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white mb-14">
            <img
              src="/images/blog/dragon-fruit-farming-guide.jpg"
              alt="Dragon fruit field with rows of trellised dragon fruit plants on a South African farm"
              className="absolute inset-0 h-full w-full object-cover opacity-25"
              loading="eager"
            />
            <div className="relative z-10 px-6 py-16 md:px-12 md:py-24 max-w-3xl">
              <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight mb-4">
                Growing Communities. Developing Skills. Advancing Agriculture Through Innovation.
              </h1>
              <p className="text-white/85 text-lg mb-6">
                ProAgriSA brings together agricultural knowledge, community development, education,
                practical training and artificial intelligence to help create new opportunities for
                farmers, schools, young people and communities across Africa.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" onClick={() => openFormWith("Community Development")} className="bg-white text-emerald-900 hover:bg-white/90">
                  Become a Project Partner
                </Button>
                <Button size="lg" variant="outline" onClick={() => openFormWith("Project Sponsorship")} className="border-white/40 text-white hover:bg-white/10">
                  Sponsor an Agricultural Development Project
                </Button>
              </div>
            </div>
          </section>

          {/* Community Development & Agricultural Projects */}
          <section id="community-development" className="mb-16 scroll-mt-24">
            <SectionHeading icon={Users} eyebrow="Community" title="Community Development & Agricultural Projects" />
            <p className="text-muted-foreground max-w-3xl mb-8">
              ProAgriSA is committed to supporting agricultural development in communities — helping
              communities identify agricultural opportunities, develop practical skills and explore
              sustainable farming activities. Some activities below are existing areas of work; others
              are proposed projects that depend on partnerships and sponsorship.
            </p>
            <TopicGrid items={communityTopics} />
            <Card className="mt-8 border-primary/20 bg-primary/5">
              <CardContent className="pt-5">
                <h3 className="font-semibold mb-2">Do you have a community project in mind?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Organisations, businesses and communities are welcome to approach ProAgriSA with
                  proposed projects. We distinguish clearly between existing activities and proposed,
                  partnership-dependent projects — we do not promise outcomes before funding and
                  partners are in place.
                </p>
                <Button onClick={() => openFormWith("Community Development")}>
                  Submit a community project enquiry
                </Button>
              </CardContent>
            </Card>
          </section>

          {/* Education & School Outreach */}
          <section id="education-training" className="mb-16 scroll-mt-24">
            <SectionHeading icon={School} eyebrow="Education" title="Agricultural Education & School Outreach" />
            <p className="text-muted-foreground max-w-3xl mb-8">
              Agricultural education is important for food security, employment, entrepreneurship and
              the next generation of agricultural development. We invite schools, teachers, educational
              institutions and community organisations to enquire about potential collaborations.
            </p>
            <TopicGrid items={educationTopics} />
            <div className="mt-8 rounded-2xl overflow-hidden border">
              <img
                src="/images/blog/dragon-fruit-business.jpg"
                alt="Young people learning practical crop production in a community agricultural project"
                className="w-full h-64 object-cover"
                loading="lazy"
              />
            </div>
          </section>

          {/* Training & Skills Development */}
          <section id="skills-training" className="mb-16 scroll-mt-24">
            <SectionHeading icon={Tractor} eyebrow="Training" title="Agricultural Training & Skills Development" />
            <p className="text-muted-foreground max-w-3xl mb-8">
              ProAgriSA showcases possible agricultural training and development areas, delivered
              through flexible formats. Note: we do not claim formal accreditation or qualifications
              unless verified.
            </p>
            <TopicGrid items={trainingTopics} />
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-lg">Training delivery options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {deliveryOptions.map((d) => (
                    <span key={d} className="rounded-full bg-accent px-3 py-1 text-sm">
                      {d}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* AI & Innovation */}
          <section id="ai-innovation" className="mb-16 scroll-mt-24">
            <SectionHeading icon={Brain} eyebrow="Innovation" title="ProAgriSA, DFSA & Artificial Intelligence in Agriculture" />
            <p className="text-muted-foreground max-w-3xl mb-8">
              ProAgriSA and Dragon Fruit South Africa (DFSA) are embracing modern technology, AI and
              digital agriculture to make reliable knowledge more accessible — while supporting, not
              replacing, qualified agricultural professionals.
            </p>
            <div className="grid gap-6 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg"><Brain className="h-5 w-5 text-primary" />AI-Powered Agricultural Knowledge</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>AI-assisted agricultural education and digital information platforms.</p>
                  <p>AI tools that help farmers access knowledge, plan and make better decisions.</p>
                  <p>Digital farm management and agricultural business development support.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg"><Sprout className="h-5 w-5 text-primary" />Dragon Fruit South Africa – DFSA</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>Dragon fruit cultivation and farming education, cultivar knowledge and information.</p>
                  <p>Farmer development networks and digital agricultural resources.</p>
                  <p>International agricultural knowledge sharing and AI-assisted educational tools for dragon fruit farmers.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg"><Cpu className="h-5 w-5 text-primary" />ProAgriSA Agricultural CRM</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>An agricultural CRM platform in development to help agricultural businesses manage:</p>
                  <p>Invoices and quotations • Customers and suppliers • Agricultural products • Farm administration • Business records • Multiple company operations • AI-assisted administrative support.</p>
                </CardContent>
              </Card>
            </div>
            <Card className="mt-6 border-primary/20 bg-primary/5">
              <CardContent className="pt-5">
                <h3 className="font-semibold mb-2">Our vision for AI in agriculture</h3>
                <p className="text-sm text-muted-foreground">
                  ProAgriSA is interested in combining practical agricultural experience, traditional
                  knowledge, education, digital technology and AI to help advance African agriculture.
                  AI is a support tool — it does not replace qualified agricultural professionals and
                  does not guarantee farming outcomes.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Partnerships & Sponsorships */}
          <section id="partnerships" className="mb-16 scroll-mt-24">
            <SectionHeading icon={Handshake} eyebrow="Partnerships" title="Community Projects, Sponsors & Partnerships" />
            <p className="text-muted-foreground max-w-3xl mb-8">
              We invite corporate sponsors, agricultural businesses, educational institutions,
              development organisations, community organisations, agricultural suppliers, technology
              companies, international development partners and individuals to collaborate in areas
              such as: {collaborationAreas.slice(0, 8).join(", ")} and more.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <Button size="lg" className="h-auto py-4" onClick={() => openFormWith("Business Partnership")}>
                Become a Project Partner
              </Button>
              <Button size="lg" className="h-auto py-4" variant="outline" onClick={() => openFormWith("Project Sponsorship")}>
                Sponsor an Agricultural Development Project
              </Button>
              <Button size="lg" className="h-auto py-4" variant="outline" onClick={() => openFormWith("School Education")}>
                Become an Educational & Community Partner
              </Button>
            </div>
          </section>

          {/* Enquiry Form */}
          <section id="enquiry-form" className="mb-16 scroll-mt-24">
            <SectionHeading icon={Send} eyebrow="Enquiries" title="Partnership & Sponsorship Enquiry Form" />
            {submitted ? (
              <Card className="max-w-3xl border-green-500/30 bg-green-500/5">
                <CardContent className="pt-6 pb-6 flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Thank you — your enquiry has been received.</h3>
                    <p className="text-sm text-muted-foreground">
                      Our team will review your enquiry and get back to you. For urgent matters, use
                      WhatsApp or the contact details on our Contact page.
                    </p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setSubmitted(false)}>
                      Submit another enquiry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="max-w-3xl">
                <CardHeader>
                  <CardTitle>Tell us about your project or partnership idea</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full name *</Label>
                        <Input id="full_name" name="full_name" required maxLength={200} placeholder="Your full name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="organisation">Organisation or company</Label>
                        <Input id="organisation" name="organisation" maxLength={200} placeholder="e.g. ABC Farming (Pty) Ltd" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email address *</Label>
                        <Input id="email" name="email" type="email" required maxLength={200} placeholder="you@example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">WhatsApp or telephone number</Label>
                        <Input id="phone" name="phone" type="tel" maxLength={50} placeholder="+27 …" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input id="country" name="country" maxLength={100} placeholder="e.g. South Africa" />
                      </div>
                      <div className="space-y-2">
                        <Label>Enquiry category</Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger aria-label="Enquiry category">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {enquiryCategories.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project_name">Project name</Label>
                      <Input id="project_name" name="project_name" maxLength={200} placeholder="e.g. Mzansi School Gardens Initiative" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project_description">Project description *</Label>
                      <Textarea id="project_description" name="project_description" required rows={4} maxLength={3000} placeholder="Describe the project, the community or school involved, and what you want to achieve…" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="proposed_support">Proposed partnership or sponsorship</Label>
                      <Textarea id="proposed_support" name="proposed_support" rows={2} maxLength={1500} placeholder="What kind of partnership or sponsorship are you proposing?" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="resources">Available resources</Label>
                      <Textarea id="resources" name="resources" rows={2} maxLength={1500} placeholder="Land, equipment, funding, volunteers, facilities…" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Additional message</Label>
                      <Textarea id="message" name="message" rows={3} maxLength={3000} placeholder="Anything else we should know?" />
                    </div>
                    {/* Honeypot anti-spam */}
                    <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                    <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                      {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Submit Enquiry
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Business Network & Social Media Directory */}
          <section id="business-network" className="mb-8">
            <SectionHeading icon={sectionIcon.partners} eyebrow="Our Network" title="Our Business Network, Technology Platforms & Development Initiatives" />
            <p className="text-muted-foreground max-w-3xl mb-8">
              The wider Healthy Fields Group includes affiliated businesses, educational platforms,
              agricultural initiatives and technology projects. These are listed as affiliated
              businesses, associated initiatives or technology platforms within the wider network.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {businessNetwork.map((b) => (
                <Card key={b.name} className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base leading-snug">{b.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{b.tagline}</p>
                    <div className="flex flex-col gap-1.5 text-sm">
                      <a
                        href={b.fb}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                      >
                        <Facebook className="h-4 w-4" /> Facebook page
                      </a>
                      {b.ig && (
                        <a
                          href={b.ig}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-pink-600 hover:underline"
                        >
                          <Instagram className="h-4 w-4" /> Instagram profile
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
