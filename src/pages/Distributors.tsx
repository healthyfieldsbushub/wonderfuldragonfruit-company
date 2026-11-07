import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2, MapPin, Phone, Mail, Globe, Clock, Facebook, Instagram,
  ChevronDown, Download, Send, Loader2, FileText, ShieldCheck, Leaf,
  PackageCheck, HelpCircle, CheckCircle2, AlertCircle, PhoneCall, ArrowRight,
  User, Smartphone, MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useDistributorCountries, useCountryDistributors, type Distributor } from '@/hooks/use-distributors';

const SITE = 'https://www.wonderfuldragonfruit.company';

const INQUIRY_CATEGORIES = [
  'Planting Material Prices',
  'Cultivar Information',
  'Farm Registration',
  'Out-Grower Programme',
  'Farming Requirements',
  'Fruit Distribution and Export',
  'Other Enquiries',
];

const COVERED_CULTIVARS = [
  'Israel Gold', 'Ruby Red', 'Ruby Rose', 'Ruby', 'Purple Haze', 'Zamorano',
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  { q: 'Who are the authorised dragon fruit distributors in Zimbabwe?', a: 'Two organisations based in Harare have been appointed as authorised distributors for the covered planting material. Their contact details are published on this page, and planting material prices are available on request directly from the distributors.' },
  { q: 'How do I obtain planting material prices?', a: 'Contact either authorised distributor directly to request current prices.' },
  { q: 'Does registering my farm automatically qualify me for fruit distribution?', a: 'No. Farm registration and out-grower programme acceptance are separate. Only accepted out-growers who comply with the applicable requirements will be considered for programme opportunities.' },
  { q: 'Will DFSA guarantee that my fruit will be purchased?', a: 'No. DFSA may assist the authorised distribution offices with their registered lists of accepted out-grower farmers and potential market opportunities. It does not guarantee purchases or distribution.' },
  { q: 'I am already growing dragon fruit. Can I join the out-grower programme?', a: 'Existing farmers do not automatically qualify. They must meet the applicable replanting requirements and provide the necessary proof before they can be considered for acceptance.' },
  { q: 'Can I sell or give away planting material supplied through the programme?', a: 'The applicable cultivar protection terms restrict resale, gifting, propagation and distribution unless written authorisation is provided.' },
  { q: 'Must out-growers use approved fertilisers and crop-protection products?', a: 'Yes. Accepted out-growers must follow the applicable approved product lists and farming standards and keep the required records.' },
  { q: 'Where can I download farm forms and registers?', a: 'Use the Farmer Documents and Downloadable Registers section. Documents will become available as they are uploaded and approved.' },
  { q: 'Does joining the programme guarantee export approval?', a: 'No. All applicable legal, phytosanitary, certification, traceability and destination-market requirements must still be met.' },
  { q: 'Are fruit by-products included in the programme?', a: 'Possible by-product opportunities may be explored as the industry develops. Availability and commercial arrangements are not guaranteed.' },
];

interface NetworkData {
  countries: { id: string; slug: string; name: string; flag_emoji: string | null }[];
  distributors: Distributor[];
  documents: { id: string; country_slug: string; title: string; description: string | null; version_label: string | null; file_url: string; file_name: string | null }[];
}

function useNetwork() {
  return useQuery<NetworkData>({
    queryKey: ['distributor-network'],
    queryFn: async () => {
      const response = await fetch('/api/distributors/network');
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Network lookup failed');
      return payload.data as NetworkData;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** A labelled distributor field: shows the real value when supplied, otherwise a quiet empty state. */
function DistributorField({ icon, label, value, href }: { icon: React.ReactNode; label: string; value?: string | null; href?: string }) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <span className="mt-0.5 text-primary/70">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {value ? (
          href ? (
            <a href={href} className="text-sm font-medium text-primary underline-offset-2 hover:underline break-words">{value}</a>
          ) : (
            <p className="text-sm font-medium break-words">{value}</p>
          )
        ) : (
          <p className="text-sm italic text-muted-foreground/70">To be supplied by the distributor</p>
        )}
      </div>
    </div>
  );
}

function EnquiryForm({ distributor, index }: { distributor: Distributor; index: number }) {
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', inquiry_category: '', message: '', privacy_consent: false, company_website: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!form.full_name.trim() || !form.email.trim() || !form.message.trim() || !form.inquiry_category) {
      setError('Please complete all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/distributor-enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, distributor_id: distributor.id, privacy_consent: form.privacy_consent }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.ok === false) {
        const message = payload?.error?.message || 'Your enquiry could not be submitted. Please try again.';
        setError(message);
        toast.error(message);
        return;
      }
      setDone(true);
      toast.success(`Your enquiry to ${distributor.business_name} has been received.`);
    } catch {
      const message = 'Your enquiry could not be submitted. Please check your connection and try again.';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Enquiry received</p>
              <p className="text-sm text-muted-foreground">
                Thank you, {form.full_name.split(' ')[0]}. Your enquiry has been recorded for {distributor.business_name}.
                The distributor will respond using the contact details you provided.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Contact Distributor {index}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <input type="text" name="company_website" value={form.company_website} onChange={(e) => setForm({ ...form, company_website: e.target.value })} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`name-${index}`}>Full Name *</Label>
              <Input id={`name-${index}`} required maxLength={191} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} autoComplete="name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`email-${index}`}>Email Address *</Label>
              <Input id={`email-${index}`} type="email" required maxLength={191} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`phone-${index}`}>Phone Number (optional)</Label>
              <Input id={`phone-${index}`} type="tel" maxLength={64} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`category-${index}`}>Subject / Inquiry Category *</Label>
              <Select value={form.inquiry_category} onValueChange={(value) => setForm({ ...form, inquiry_category: value })}>
                <SelectTrigger id={`category-${index}`} aria-required="true"><SelectValue placeholder="Choose a category" /></SelectTrigger>
                <SelectContent>
                  {INQUIRY_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`message-${index}`}>Message *</Label>
            <Textarea id={`message-${index}`} required rows={5} maxLength={5000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          <div className="flex items-start gap-2">
            <Checkbox
              id={`consent-${index}`}
              checked={form.privacy_consent}
              onCheckedChange={(checked) => setForm({ ...form, privacy_consent: checked === true })}
            />
            <Label htmlFor={`consent-${index}`} className="text-sm font-normal leading-snug cursor-pointer">
              I consent to my details being stored and processed by this distributor so my enquiry can be answered, in line with the{' '}
              <Link to="/privacy-policy" className="underline underline-offset-2">Privacy Policy</Link>. *
            </Label>
          </div>
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
            </div>
          )}
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {`SEND ENQUIRY TO DISTRIBUTOR ${index}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DistributorCard({ distributor, index, countryLabel = 'Zimbabwe' }: { distributor: Distributor; index: number; countryLabel?: string }) {
  return (
    <Card id={`distributor-${index}`} className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5 text-primary" /> Authorised {countryLabel} Distributor {index}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <DistributorField icon={<Building2 className="h-4 w-4" />} label="Company Name" value={distributor.business_name && !/^Authorised Zimbabwe Distributor \d$/.test(distributor.business_name) ? distributor.business_name : null} />
        <DistributorField icon={<User className="h-4 w-4" />} label="Contact Person" value={distributor.representative_name ? `${distributor.representative_name}${distributor.position ? ` — ${distributor.position}` : ''}` : null} />
        <DistributorField icon={<Smartphone className="h-4 w-4" />} label="Mobile Number" value={distributor.mobile} href={distributor.mobile ? `tel:${distributor.mobile.replace(/[^+\d]/g, '')}` : undefined} />
        <DistributorField icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp" value={distributor.whatsapp ? 'Chat on WhatsApp' : null} href={distributor.whatsapp ? `https://wa.me/${distributor.whatsapp.replace(/[^\d]/g, '')}` : undefined} />
        {distributor.description ? (
          <div className="flex items-start gap-3 py-1.5">
            <span className="mt-0.5 text-primary/70"><FileText className="h-4 w-4" /></span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Registration & Agreement Details</p>
              <div className="pt-1 space-y-0.5">
                {distributor.description.split(' · ').filter(Boolean).map((line, i) => (
                  <p key={i} className="text-sm text-muted-foreground">{line}</p>
                ))}
              </div>
            </div>
          </div>
        ) : null}
        <DistributorField icon={<MapPin className="h-4 w-4" />} label="Physical Address" value={distributor.address} />
        <DistributorField icon={<Phone className="h-4 w-4" />} label="Direct Telephone Number" value={distributor.phone} href={distributor.phone ? `tel:${distributor.phone.replace(/[^+\d]/g, '')}` : undefined} />
        <DistributorField icon={<Mail className="h-4 w-4" />} label="Email Address" value={distributor.email} href={distributor.email ? `mailto:${distributor.email}` : undefined} />
        <DistributorField icon={<Clock className="h-4 w-4" />} label="Hours of Operation" value={distributor.operating_hours} />
        <DistributorField icon={<Globe className="h-4 w-4" />} label="Website" value={distributor.website} href={distributor.website || undefined} />
        <div className="flex items-start gap-3 py-1.5">
          <span className="mt-0.5 text-primary/70"><Facebook className="h-4 w-4" /></span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Social Media</p>
            <div className="flex gap-3 pt-1">
              {distributor.facebook ? (
                <a href={distributor.facebook} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline"><Facebook className="h-4 w-4" /></a>
              ) : (
                <Facebook className="h-4 w-4 text-muted-foreground/40" />
              )}
              {distributor.instagram ? (
                <a href={distributor.instagram} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline"><Instagram className="h-4 w-4" /></a>
              ) : (
                <Instagram className="h-4 w-4 text-muted-foreground/40" />
              )}
            </div>
          </div>
        </div>
        <DistributorField icon={<MapPin className="h-4 w-4" />} label="Google Maps Location" value={distributor.maps_embed_url ? 'View on map' : null} href={distributor.maps_embed_url || undefined} />
        <div className="mt-4 rounded-lg border border-primary/25 bg-primary/5 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" /> Having trouble reaching this distributor?
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            If you cannot get hold of our local distributor, please contact our{' '}
            <strong className="text-foreground">Head Office in South Africa (ZA)</strong> and we will assist you directly — including any complaints.
          </p>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <a href="mailto:dfsa.africa@proagrisa.co.za" className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-2 hover:underline">
              <Mail className="h-4 w-4" /> dfsa.africa@proagrisa.co.za
            </a>
            <a href="https://wa.me/27834474639" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-2 hover:underline">
              <MessageCircle className="h-4 w-4" /> Emergency WhatsApp: +27 83 447 4639
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const COUNTRY_MESSAGES: Record<string, string> = {};

export default function Distributors() {
  const { country: countryParam } = useParams<{ country?: string }>();
  const { data: network, isLoading } = useNetwork();
  const { data: zimbabweResult, isLoading: distributorsLoading } = useCountryDistributors('zimbabwe');

  const countries = network?.countries || [];
  const zimbabwe = useMemo(
    () => (zimbabweResult?.distributors || []).filter((d) => d.is_active).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    [zimbabweResult],
  );
  const documents = (network?.documents || []).filter((doc) => doc.country_slug === (countryParam || 'zimbabwe'));

  useEffect(() => {
    if (!countryParam || isLoading) return;
    const target = countries.find((c) => c.slug === countryParam);
    if (!target) return;
    const element = document.getElementById(`country-${target.slug}`);
    if (element) setTimeout(() => element.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
  }, [countryParam, isLoading, countries]);

  const activeCountry = countries.find((c) => c.slug === countryParam);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Dragon Fruit Distributors Africa | Authorised Planting Material & Out-Growers"
        description="Find authorised dragon fruit distributors, planting material information, farm registration requirements and out-grower programme details for Zimbabwe and our African distribution network."
        type="website"
        url="/distributors"
      />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Distributors', href: '/distributors' },
            ...(activeCountry ? [{ label: activeCountry.name, href: `/distributors/${activeCountry.slug}` }] : []),
          ]}
        />

        {/* Introduction */}
        <header className="py-10 text-center max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Dragon Fruit Distributors</h1>
          <h2 className="text-xl font-semibold text-primary mb-6">Building a Strong Dragon Fruit Farming Network Across Africa</h2>
          <div className="space-y-4 text-muted-foreground text-left">
            <p>We are developing an organised network of dragon fruit farmers, authorised distributors and commercial farming partners across Africa.</p>
            <p>Our aim is to supply approved dragon fruit planting material, support farm registration and cultivar traceability, and help develop structured farming networks that can serve local and international markets.</p>
            <p>Our distribution network focuses on approved planting material, responsible farming practices, reliable documentation, cultivar protection and the development of out-grower programmes where available.</p>
            <p>Prices for planting material are available on request from the relevant authorised distribution office.</p>
            <p className="rounded-md border border-amber-300/60 bg-amber-50/60 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <strong>Important:</strong> Distribution opportunities, out-grower participation and export opportunities are subject to country-specific programme requirements, approval, market availability and separate commercial arrangements.
            </p>
          </div>
        </header>

        {/* Distributing countries grid */}
        <section className="py-8" aria-labelledby="countries-heading">
          <h2 id="countries-heading" className="text-2xl font-bold text-center mb-2">Our Dragon Fruit Distribution Network Across Africa</h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-8">
            Explore our country distribution network to find authorised distributors, planting material information, farm registration requirements and relevant programme details.
          </p>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {countries.map((country) => (
                <Link
                  key={country.id}
                  to={`/distributors/${country.slug}`}
                  className="group flex flex-col items-center gap-2 rounded-xl border bg-card px-4 py-6 text-center shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                  aria-label={`${country.name} distributor information`}
                >
                  <span className="text-3xl" aria-hidden="true">{country.flag_emoji || '🌍'}</span>
                  <span className="font-semibold tracking-wide group-hover:text-primary">{country.name}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary">View programme <ArrowRight className="h-3 w-3" /></span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Country sections */}
        <section className="py-8 space-y-16" aria-label="Country programmes">
          {/* ZIMBABWE – full programme */}
          <article id="country-zimbabwe" className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-2 text-center">ZIMBABWE – AUTHORISED DRAGON FRUIT DISTRIBUTORS</h2>
            <div className="max-w-3xl mx-auto space-y-4 text-muted-foreground mb-8">
              <p>We are pleased to announce that two organisations based in Harare, Zimbabwe, have been appointed as authorised distributors for our covered dragon fruit planting material.</p>
              <p>These organisations will help supply approved cultivars, register participating farms and develop an organised network of commercial dragon fruit farmers.</p>
              <p>The programme is intended to support reliable cultivar records, traceability, responsible farming practices and the development of potential local and export markets.</p>
              <p className="text-center font-medium text-foreground"><strong>Planting material prices are available on request directly from the authorised distributors.</strong></p>
            </div>

            {distributorsLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2 mb-10">
                {zimbabwe.slice(0, 2).map((distributor, index) => (
                  <DistributorCard key={distributor.id} distributor={distributor} index={index + 1} />
                ))}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2 mb-12">
              {zimbabwe.slice(0, 2).map((distributor, index) => (
                <EnquiryForm key={`form-${distributor.id}`} distributor={distributor} index={index + 1} />
              ))}
            </div>

            {/* DFSA role */}
            <Card className="mb-10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><ShieldCheck className="h-5 w-5 text-primary" /> The Role of DFSA – Dragon Fruit Association of Africa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>DFSA – Dragon Fruit Association of Africa – supports the development of the dragon fruit industry and works with the authorised Zimbabwe distribution offices.</p>
                <p>As part of this arrangement, DFSA may assist the distribution offices by working with their registered lists of farmers who have been accepted into the official out-grower programme.</p>
                <p>This support is intended to help the distribution offices develop organised fruit supply networks and explore potential fruit distribution and export opportunities for participating out-grower farmers.</p>
                <p className="rounded-md border px-4 py-3 text-sm font-medium text-foreground"><strong>DFSA does not individually connect every farmer with fruit buyers and does not guarantee that a farmer's fruit will be purchased, collected, distributed or exported.</strong></p>
                <p>DFSA's role is to assist the authorised distribution offices with the development of their approved out-grower networks and potential market opportunities. Any actual fruit purchase, distribution or export arrangement depends on availability, quality, demand, logistics, applicable requirements and separate commercial agreements.</p>
                <p>Possible dragon fruit processing and by-product opportunities may also be explored as the industry develops.</p>
              </CardContent>
            </Card>

            {/* Farm registration and out-grower programme */}
            <Card className="mb-10" id="farm-registration">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><Leaf className="h-5 w-5 text-primary" /> Farm Registration and the Out-Grower Programme</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>Farm registration and out-grower programme acceptance are two separate processes.</p>
                <p>Farmers purchasing planting material through the authorised Zimbabwean distribution offices must complete the applicable farm registration process.</p>
                <p>However, registering a farm does not automatically qualify a farmer for fruit distribution or export opportunities.</p>
                <p>Farmers wishing to participate in the official out-grower programme must apply, meet the applicable requirements and be accepted by the authorised distribution office.</p>
                <p className="font-medium text-foreground">The registered farm information may include:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Farmer's name and contact details.</li>
                  <li>Physical farm address and location.</li>
                  <li>Cultivars planted.</li>
                  <li>Source and origin of planting material.</li>
                  <li>Planting dates and production records.</li>
                  <li>Fertiliser and crop-protection application records.</li>
                  <li>Harvest and fruit traceability records.</li>
                  <li>Other required documentation.</li>
                </ul>
                <p>Only farmers accepted into the official out-grower programme and complying with its requirements will be considered for the programme's fruit supply, distribution and export opportunities.</p>
              </CardContent>
            </Card>

            {/* Existing farmers */}
            <Card className="mb-10 border-blue-200/70 dark:border-blue-900">
              <CardHeader>
                <CardTitle className="text-xl">Already Farming Dragon Fruit in Zimbabwe?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>Farmers who already have established dragon fruit plantations will not automatically qualify for the official out-grower programme or its fruit distribution opportunities.</p>
                <p>If you are already farming dragon fruit and wish to join this programme, you must meet the applicable replanting requirements and provide the necessary proof that the required replanting has been completed.</p>
                <p>Registering an existing farm or purchasing additional plants does not automatically qualify an established farmer for the programme.</p>
                <p>Contact one of the authorised Zimbabwe distribution offices before making changes to your farm. The office will explain the applicable replanting requirements, acceptable proof and approval process.</p>
              </CardContent>
            </Card>

            {/* Cultivar protection */}
            <Card className="mb-10" id="cultivar-protection">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><PackageCheck className="h-5 w-5 text-primary" /> Authorised Planting Material and Cultivar Protection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>The two authorised distribution organisations will be the only permitted suppliers in Zimbabwe of the cultivars covered by the applicable distribution and cultivar protection agreements.</p>
                <p className="font-medium text-foreground">The covered cultivars include, but are not limited to:</p>
                <div className="flex flex-wrap gap-2">
                  {COVERED_CULTIVARS.map((cultivar) => (
                    <span key={cultivar} className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">{cultivar}</span>
                  ))}
                  <span className="rounded-full bg-muted px-3 py-1 text-sm">Other cultivars included in the approved cultivar list</span>
                </div>
                <p>Planting material supplied under the applicable terms is intended for cultivation at the registered farm address identified in the relevant agreement.</p>
                <p>Unless expressly authorised in writing, the applicable terms are intended to prohibit:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Reselling the covered planting material.</li>
                  <li>Giving away or gifting the material.</li>
                  <li>Distributing it to other farmers or farms.</li>
                  <li>Propagating it for unauthorised resale or distribution.</li>
                  <li>Moving it to another farm or registered address.</li>
                </ul>
                <p>Where a farmer stops farming and does not intend to replant, the farmer must follow the applicable written requirements for handling the remaining restricted planting material. These may require proper destruction or composting rather than sale, gifting or distribution.</p>
                <p className="text-sm italic">These restrictions are contractual requirements applicable to the relevant authorised planting material and do not automatically apply to all dragon fruit plants in Zimbabwe regardless of their source or legal status.</p>
                <div className="rounded-md border px-4 py-3 text-sm">
                  <p className="font-medium text-foreground">Proposed cultivar protection penalty</p>
                  <p className="mt-1">The proposed cultivar protection terms refer to a penalty of R1,500,000 (one million five hundred thousand South African rand) for specified violations. This amount is not an automatically enforceable government fine. It must be supported by the applicable agreement and reviewed for enforceability under relevant law. The final approved legal wording will be published here after legal review.</p>
                </div>
              </CardContent>
            </Card>

            {/* Farming standards */}
            <Card className="mb-10" id="farming-standards">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><Leaf className="h-5 w-5 text-primary" /> Out-Grower Farming Standards</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>All farmers accepted into the official out-grower programme must follow the applicable programme farming standards.</p>
                <p>This includes using fertilisers and crop-protection products from the approved lists applicable to the programme, following product instructions and keeping accurate farm records.</p>
                <p className="font-medium text-foreground">Farmers must:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Check the current approved fertiliser list.</li>
                  <li>Check the current approved crop-protection product list.</li>
                  <li>Follow the applicable application instructions and safety requirements.</li>
                  <li>Record product names, application dates, quantities and relevant details.</li>
                  <li>Maintain accurate production, harvest and traceability records.</li>
                  <li>Comply with Zimbabwean laws and any additional requirements applicable to the intended export market.</li>
                </ul>
                <p>Products must be legally authorised for the intended use in Zimbabwe and must comply with relevant destination-market requirements.</p>
                <p>Failure to follow applicable programme standards may affect a farmer's eligibility for out-grower participation and consideration for fruit distribution or export opportunities.</p>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card className="mb-10" id="documents">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><FileText className="h-5 w-5 text-primary" /> Farmer Documents and Downloadable Registers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Approved programme documents will appear here as they are uploaded. Only documents that have actually been uploaded are listed.
                </p>
                {documents.length === 0 ? (
                  <p className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                    No documents have been uploaded yet. Please check back soon or contact an authorised distributor for the current forms.
                  </p>
                ) : (
                  <ul className="divide-y rounded-md border">
                    {documents.map((doc) => (
                      <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="font-medium">{doc.title}</p>
                          {doc.description && <p className="text-sm text-muted-foreground">{doc.description}</p>}
                          {doc.version_label && <p className="text-xs text-muted-foreground">Version: {doc.version_label}</p>}
                        </div>
                        <a href={doc.file_url} download={doc.file_name || undefined} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                          <Download className="h-4 w-4" /> Download
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Fruit distribution and export opportunities */}
            <Card className="mb-10" id="export-opportunities">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><PhoneCall className="h-5 w-5 text-primary" /> Fruit Distribution and Export Opportunities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>The Zimbabwe dragon fruit programme aims to develop an organised network of commercial growers capable of supplying suitable local and international markets.</p>
                <p>Fruit distribution and export opportunities will be considered through the authorised distribution offices and their approved out-grower networks.</p>
                <p>DFSA may assist the distribution offices using their registered lists of accepted out-grower farmers to support the development of potential supply and market opportunities.</p>
                <p>Only farmers accepted into the official out-grower programme and meeting its applicable requirements will be considered for these opportunities.</p>
                <p>Farmers who are not part of the approved out-grower programme must not assume that their fruit will be included in the programme's distribution or export arrangements.</p>
                <p>Any purchase, distribution or export arrangement depends on fruit quality, production volumes, market demand, logistics, traceability, certification and separate commercial agreements.</p>
                <p className="font-medium text-foreground">Farm registration or programme participation does not guarantee a fruit buyer, fixed price, minimum purchase volume, export contract or guaranteed sales.</p>
                <p>Possible fruit processing and by-product opportunities may be explored in the future, depending on commercial feasibility and market demand.</p>
              </CardContent>
            </Card>

            {/* Traceability */}
            <Card className="mb-10" id="traceability">
              <CardHeader>
                <CardTitle className="text-xl">Preparing for Local and International Markets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>Traceable planting material and accurate farm records can help support future commercial supply chains.</p>
                <p className="font-medium text-foreground">Relevant records may include:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Cultivar identity and source.</li>
                  <li>Planting material origin.</li>
                  <li>Registered farm address.</li>
                  <li>Production records.</li>
                  <li>Fertiliser and crop-protection records.</li>
                  <li>Harvest information.</li>
                  <li>Traceability records.</li>
                  <li>Applicable inspection and certification documents.</li>
                </ul>
                <p>Farm registration and authorised planting material do not automatically provide export approval. Exporters and farmers must meet all applicable phytosanitary, certification, destination-country and commercial requirements.</p>
                <p className="text-sm italic">DFSA and the authorised distributors do not issue official government export certificates.</p>
              </CardContent>
            </Card>
          </article>

          {/* Other countries: professional placeholder sections */}
          {countries.filter((c) => c.slug !== 'zimbabwe').map((country) => {
            const countryDistributors = (network?.distributors || [])
              .filter((d) => d.country_id === country.id)
              .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
              .slice(0, 2);
            return (
              <article key={country.id} id={`country-${country.slug}`} className="scroll-mt-20">
                <h2 className="text-xl font-bold mb-3 text-center">{country.name} – Dragon Fruit Distribution</h2>
                {countryDistributors.length > 0 ? (
                  <div className="grid gap-6 lg:grid-cols-2 mb-6">
                    {countryDistributors.map((distributor, index) => (
                      <DistributorCard key={distributor.id} distributor={distributor} index={index + 1} countryLabel={country.name} />
                    ))}
                  </div>
                ) : (
                  <div className="mx-auto max-w-2xl rounded-xl border bg-card px-6 py-6 text-center">
                    <p className="text-muted-foreground">
                      Local distributor / representative details for {country.name} will be published here. In the meantime, contact our Head Office in South Africa (ZA) for authorised distributor information and current availability.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm">
                      <a href="mailto:dfsa.africa@proagrisa.co.za" className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-2 hover:underline">
                        <Mail className="h-4 w-4" /> dfsa.africa@proagrisa.co.za
                      </a>
                      <a href="https://wa.me/27834474639" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-2 hover:underline">
                        <MessageCircle className="h-4 w-4" /> Emergency WhatsApp: +27 83 447 4639
                      </a>
                    </div>
                    <Button asChild variant="outline" className="mt-4">
                      <Link to="/contact">Contact the DFSA office</Link>
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </section>

        {/* Head office fallback */}
        <section className="py-10" aria-labelledby="head-office-heading">
          <Card className="mx-auto max-w-3xl border-primary/30">
            <CardHeader>
              <CardTitle id="head-office-heading" className="flex items-center justify-center gap-2 text-center text-xl">
                <Building2 className="h-5 w-5 text-primary" /> Head Office (South Africa / ZA)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-center text-muted-foreground">
              <p>For immediate assistance, general inquiries, or open distribution territories, please reach out to us directly.</p>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-base">
                <a href="mailto:dfsa.africa@proagrisa.co.za" className="inline-flex items-center gap-2 font-medium text-primary underline-offset-2 hover:underline">
                  <Mail className="h-5 w-5" /> dfsa.africa@proagrisa.co.za
                </a>
                <a href="https://wa.me/27834474639" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-medium text-primary underline-offset-2 hover:underline">
                  <MessageCircle className="h-5 w-5" /> Emergency WhatsApp: +27 83 447 4639
                </a>
              </div>
            </CardContent>
          </Card>
        </section>
        {/* FAQ */}
        <section className="py-10" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="flex items-center justify-center gap-2 text-2xl font-bold mb-6"><HelpCircle className="h-6 w-6 text-primary" /> Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="max-w-3xl mx-auto">
            {FAQ_ITEMS.map((item, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Trust / back links */}
        <section className="border-t pt-8 pb-4 text-center text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/" className="inline-flex items-center gap-1 hover:text-primary">Back to the homepage <ArrowRight className="h-3 w-3" /></Link>
            <Link to="/privacy-policy" className="hover:text-primary">Privacy information for enquiries</Link>
            <Link to="/association" className="hover:text-primary">About DFSA</Link>
          </div>
          <p className="mt-4 max-w-2xl mx-auto text-xs">
            Enquiries submitted through this page are stored securely and shared only with the distributor you contacted.
          </p>
        </section>
      </div>
    </div>
  );
}
