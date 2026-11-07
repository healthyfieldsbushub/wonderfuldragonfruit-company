import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, MapPin, Phone, Smartphone, Mail, Globe, Clock, CalendarClock,
  Facebook, Instagram, MessageCircle, CheckCircle2, Loader2, Send, ArrowRight, Map as MapIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { appClient } from '@/integrations/manus/client';
import {
  useCountryDistributors, useDistributorCountries, galleryUrls, type Distributor,
} from '@/hooks/use-distributors';

const SITE = 'https://www.wonderfuldragonfruit.company';

const DEFAULT_PRODUCTS = [
  'Commercial Dragon Fruit Plants',
  'Premium Cultivars',
  'Planting Material',
  'Rooted Plants',
  'Consultation',
  'Farm Visits',
  'Training',
  'Bulk Orders',
  'Export Assistance',
];

const LOCAL_BENEFITS = [
  'Faster service',
  'Lower transport costs',
  'Local knowledge',
  'Easier communication',
  'Regional support',
];

const INTERNAL_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Shop' },
  { href: '/consultations', label: 'Consultation' },
  { href: '/education', label: 'Education' },
  { href: '/association', label: 'Association' },
  { href: '/directory', label: 'Directory' },
  { href: '/countries', label: 'Countries' },
  { href: '/contact', label: 'Contact' },
  { href: '/about', label: 'About' },
];

function mapSrc(d: Distributor): string | null {
  if (d.maps_embed_url) return d.maps_embed_url;
  if (d.latitude != null && d.longitude != null) {
    return `https://maps.google.com/maps?q=${d.latitude},${d.longitude}&z=14&output=embed`;
  }
  if (d.address) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(d.address)}&z=13&output=embed`;
  }
  return null;
}

function EnquiryForm({ distributor, countryName }: { distributor: Distributor; countryName: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: '', surname: '', email: '', phone: '', country: countryName,
    subject: `Dragon Fruit plant enquiry — ${countryName}`, message: '', company_website: '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.message.trim().length < 10) {
      toast.error('Please tell us a little more (at least 10 characters).');
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await appClient.functions.invoke('distributor-enquiry', {
        body: { distributorId: distributor.id, ...form },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error('Please check your details and try again.');
      setSent(true);
      toast.success('Enquiry sent — the supplier and DFSA head office have been notified.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send your enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <Card className="p-8 text-center space-y-3">
        <CheckCircle2 className="h-12 w-12 mx-auto text-primary" />
        <h3 className="text-xl font-display font-bold">Enquiry sent successfully</h3>
        <p className="text-muted-foreground">
          {distributor.business_name} has received your message, with a copy to Wonderful Dragon Fruit South Africa head office.
          You can expect a reply within 1–2 business days.
        </p>
        <Button variant="outline" onClick={() => setSent(false)}>Send another enquiry</Button>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <h3 className="text-xl font-display font-bold mb-1">Contact {distributor.business_name}</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Your message is emailed directly to the supplier, with a copy to DFSA head office.
      </p>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="d-name">Name</Label>
            <Input id="d-name" required maxLength={100} value={form.name} onChange={set('name')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-surname">Surname</Label>
            <Input id="d-surname" required maxLength={100} value={form.surname} onChange={set('surname')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-email">Email</Label>
            <Input id="d-email" type="email" required maxLength={255} value={form.email} onChange={set('email')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-phone">Phone</Label>
            <Input id="d-phone" required maxLength={40} value={form.phone} onChange={set('phone')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-country">Country</Label>
            <Input id="d-country" required maxLength={100} value={form.country} onChange={set('country')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-subject">Subject</Label>
            <Input id="d-subject" required maxLength={150} value={form.subject} onChange={set('subject')} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="d-message">Message</Label>
          <Textarea id="d-message" required rows={5} maxLength={3000} value={form.message} onChange={set('message')} />
        </div>
        {/* Honeypot — hidden from humans, filled by bots */}
        <input
          type="text" tabIndex={-1} autoComplete="off" aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
          value={form.company_website} onChange={set('company_website')}
        />
        <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
          Submit enquiry
        </Button>
      </form>
    </Card>
  );
}

function ContactRow({ icon: Icon, label, value, href }: {
  icon: typeof Phone; label: string; value: string; href?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 mt-1 text-primary shrink-0" />
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        {href ? (
          <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
            className="text-sm font-medium break-words hover:text-primary transition-colors">{value}</a>
        ) : (
          <p className="text-sm font-medium break-words">{value}</p>
        )}
      </div>
    </div>
  );
}

function DistributorProfile({ distributor, countryName }: { distributor: Distributor; countryName: string }) {
  const gallery = galleryUrls(distributor.gallery_images);
  const products = distributor.products?.length ? distributor.products : DEFAULT_PRODUCTS;
  const embed = mapSrc(distributor);
  const waDigits = distributor.whatsapp?.replace(/[^\d]/g, '');

  return (
    <article className="rounded-2xl border border-border overflow-hidden bg-card">
      {distributor.banner_url && (
        <img src={distributor.banner_url} alt={`${distributor.business_name} business banner`}
          loading="lazy" className="w-full h-40 sm:h-56 object-cover" />
      )}
      <div className="p-6 sm:p-8 space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-center gap-4">
          {distributor.logo_url ? (
            <img src={distributor.logo_url} alt={`${distributor.business_name} logo`} loading="lazy"
              className="h-20 w-20 rounded-xl object-cover border border-border" />
          ) : (
            <div className="h-20 w-20 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-9 w-9 text-primary" />
            </div>
          )}
          <div>
            <h3 className="text-2xl font-display font-bold">{distributor.business_name}</h3>
            {distributor.representative_name && (
              <p className="text-muted-foreground">
                {distributor.representative_name}
                {distributor.position ? ` — ${distributor.position}` : ''}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary">DFSA Associate Plant Supplier</Badge>
              {distributor.years_with_dfsa && <Badge variant="outline">{distributor.years_with_dfsa} with DFSA</Badge>}
            </div>
          </div>
        </header>

        {distributor.description && (
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{distributor.description}</p>
        )}

        <div className="grid sm:grid-cols-2 gap-x-8 divide-y sm:divide-y-0 divide-border/60">
          {distributor.address && <ContactRow icon={MapPin} label="Address" value={distributor.address} />}
          <ContactRow icon={Globe} label="Country" value={countryName} />
          {distributor.province && <ContactRow icon={MapPin} label="Province" value={distributor.province} />}
          {distributor.phone && <ContactRow icon={Phone} label="Telephone" value={distributor.phone} href={`tel:${distributor.phone}`} />}
          {distributor.mobile && <ContactRow icon={Smartphone} label="Mobile" value={distributor.mobile} href={`tel:${distributor.mobile}`} />}
          {waDigits && <ContactRow icon={MessageCircle} label="WhatsApp" value={distributor.whatsapp!} href={`https://wa.me/${waDigits}`} />}
          {distributor.email && <ContactRow icon={Mail} label="Email" value={distributor.email} href={`mailto:${distributor.email}`} />}
          {distributor.website && <ContactRow icon={Globe} label="Website" value={distributor.website} href={distributor.website} />}
          {distributor.facebook && <ContactRow icon={Facebook} label="Facebook" value={distributor.facebook} href={distributor.facebook} />}
          {distributor.instagram && <ContactRow icon={Instagram} label="Instagram" value={distributor.instagram} href={distributor.instagram} />}
          {distributor.operating_hours && <ContactRow icon={Clock} label="Operating hours" value={distributor.operating_hours} />}
          {distributor.years_with_dfsa && <ContactRow icon={CalendarClock} label="Years with DFSA" value={distributor.years_with_dfsa} />}
          {distributor.service_area && <ContactRow icon={MapIcon} label="Service area" value={distributor.service_area} />}
        </div>

        {embed && (
          <section className="space-y-3">
            <h4 className="font-display font-bold text-lg">Location</h4>
            <div className="rounded-xl overflow-hidden border border-border">
              <iframe
                src={embed} title={`${distributor.business_name} location on Google Maps`}
                width="100%" height="360" loading="lazy" style={{ border: 0 }}
                referrerPolicy="no-referrer-when-downgrade" allowFullScreen
              />
            </div>
          </section>
        )}

        {gallery.length > 0 && (
          <section className="space-y-3">
            <h4 className="font-display font-bold text-lg">Gallery</h4>
            <p className="text-sm text-muted-foreground">
              Farm photographs, dragon fruit plants, nursery, packing facilities and staff.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {gallery.map((url, i) => (
                <img key={url + i} src={url} loading="lazy"
                  alt={`${distributor.business_name} dragon fruit farm photo ${i + 1}`}
                  className="aspect-square w-full rounded-lg object-cover border border-border" />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h4 className="font-display font-bold text-lg">Products & services supplied</h4>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {products.map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />{p}
              </li>
            ))}
          </ul>
        </section>

        <section id={`enquire-${distributor.slug}`} className="scroll-mt-24">
          <EnquiryForm distributor={distributor} countryName={countryName} />
        </section>
      </div>
    </article>
  );
}

export default function CountryDistributors() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useCountryDistributors(slug);
  const { data: countries } = useDistributorCountries();

  const country = data?.country;
  const distributors = data?.distributors ?? [];

  const jsonLd = useMemo(() => {
    if (!country) return null;
    const url = `${SITE}/directory/${country.slug}`;
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          name: 'Wonderful Dragon Fruit South Africa',
          url: SITE,
          logo: `${SITE}/og-image.png`,
        },
        {
          '@type': 'CollectionPage',
          name: country.meta_title || `${country.name} Associate Plant Suppliers`,
          description: country.meta_description || '',
          url,
          about: { '@type': 'Country', name: country.name },
          inLanguage: 'en',
        },
        ...distributors.map((d) => ({
          '@type': 'LocalBusiness',
          name: d.business_name,
          description: d.description || `DFSA Associate Dragon Fruit plant supplier in ${country.name}.`,
          url: d.website || url,
          image: d.banner_url || d.logo_url || undefined,
          telephone: d.phone || d.mobile || undefined,
          email: d.email || undefined,
          address: {
            '@type': 'PostalAddress',
            streetAddress: d.address || undefined,
            addressRegion: d.province || undefined,
            addressCountry: country.name,
          },
          ...(d.latitude != null && d.longitude != null
            ? { geo: { '@type': 'GeoCoordinates', latitude: d.latitude, longitude: d.longitude } }
            : {}),
          areaServed: d.service_area || country.name,
          openingHours: d.operating_hours || undefined,
        })),
      ],
    };
  }, [country, distributors]);

  useEffect(() => {
    if (!jsonLd) return;
    let el = document.getElementById('json-ld-distributors') as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement('script');
      el.id = 'json-ld-distributors';
      el.type = 'application/ld+json';
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(jsonLd);
    return () => { el?.remove(); };
  }, [jsonLd]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!country) {
    return (
      <div className="container mx-auto px-4 py-24 text-center space-y-4">
        <h1 className="text-3xl font-display font-bold">Country not found</h1>
        <p className="text-muted-foreground">This distributor directory page is not available.</p>
        <Button asChild><Link to="/directory">Back to Directory</Link></Button>
      </div>
    );
  }

  const heroTitle = country.hero_title || `${country.name} Associate Plant Suppliers`;

  return (
    <>
      <SEOHead
        title={country.meta_title || `${country.name} Dragon Fruit Plants | DFSA Associate Plant Suppliers`}
        description={country.meta_description ||
          `Buy premium Dragon Fruit plants in ${country.name} through an official DFSA Associate Plant Supplier. Local support, commercial planting material, consultation and training.`}
        keywords={(country.keywords || []).join(', ')}
        url={`/directory/${country.slug}`}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {country.hero_image_url && (
          <img src={country.hero_image_url} alt={`Dragon fruit farming landscape in ${country.name}`}
            className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/70 to-background" />
        <div className="relative container mx-auto px-4 py-20 sm:py-28 text-center text-primary-foreground">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <span className="text-5xl" aria-hidden="true">{country.flag_emoji}</span>
            <h1 className="text-3xl sm:text-5xl font-display font-bold">{heroTitle}</h1>
            {country.hero_subtitle && <p className="text-xl sm:text-2xl font-medium">{country.hero_subtitle}</p>}
            {country.hero_tagline && <p className="text-base sm:text-lg opacity-90">{country.hero_tagline}</p>}
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <Button asChild size="lg" variant="secondary">
                <a href="#suppliers">View {country.name} suppliers</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-background/10 border-primary-foreground/40">
                <Link to="/products">Shop plants online</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6">
        <Breadcrumbs items={[
          { label: 'Directory', href: '/directory' },
          { label: `${country.name} Associate Plant Suppliers`, href: `/directory/${country.slug}` },
        ]} />
      </div>

      {/* Intro */}
      <section className="container mx-auto px-4 pb-12">
        <div className="max-w-3xl space-y-5">
          <h2 className="text-2xl sm:text-3xl font-display font-bold">{country.name} Associate Plant Suppliers</h2>
          <p className="text-muted-foreground leading-relaxed">{country.intro}</p>
          <div>
            <p className="font-medium mb-2">Using your local supplier provides:</p>
            <ul className="space-y-1.5">
              {LOCAL_BENEFITS.map((b) => (
                <li key={b} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />{b}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm rounded-lg border border-border bg-muted/40 p-4">
            Customers located in South Africa should{' '}
            <Link to="/contact" className="text-primary font-medium underline">contact our South African office</Link>{' '}instead.
          </p>
        </div>
      </section>

      {/* Suppliers */}
      <section id="suppliers" className="container mx-auto px-4 pb-16 space-y-10 scroll-mt-24">
        {distributors.length === 0 ? (
          <Card className="p-8 text-center space-y-4">
            <Building2 className="h-10 w-10 mx-auto text-primary" />
            <h3 className="text-xl font-display font-bold">
              {country.name} associate supplier listings coming soon
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto">
              We are finalising our appointed Associate Plant Supplier for {country.name}. In the meantime,
              contact Wonderful Dragon Fruit South Africa head office and we will route your enquiry to the nearest partner.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild><Link to="/contact">Contact head office</Link></Button>
              <Button asChild variant="outline"><Link to="/directory">Browse the Directory</Link></Button>
            </div>
          </Card>
        ) : (
          distributors.map((d) => (
            <DistributorProfile key={d.id} distributor={d} countryName={country.name} />
          ))
        )}
      </section>

      {/* CTA */}
      <section className="bg-primary/10 border-y border-border">
        <div className="container mx-auto px-4 py-16 text-center space-y-4">
          <h2 className="text-2xl sm:text-4xl font-display font-bold">
            Need Dragon Fruit Plants in {country.name}?
          </h2>
          <p className="text-muted-foreground">Contact your local DFSA Associate Supplier today.</p>
          <Button asChild size="lg">
            <a href={distributors.length ? `#enquire-${distributors[0].slug}` : '/contact'}>
              Contact Supplier <ArrowRight className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </div>
      </section>

      {/* Country switching */}
      <section className="container mx-auto px-4 py-14 space-y-4">
        <h2 className="text-2xl font-display font-bold">Looking for another country?</h2>
        <div className="flex flex-wrap gap-3">
          {(countries || []).map((c) => (
            <Button key={c.slug} asChild variant={c.slug === country.slug ? 'default' : 'outline'}>
              <Link to={`/directory/${c.slug}`}>
                <span className="mr-2" aria-hidden="true">{c.flag_emoji}</span>{c.name}
              </Link>
            </Button>
          ))}
          <Button asChild variant="outline"><Link to="/contact">🇿🇦 South Africa</Link></Button>
        </div>
      </section>

      {/* Internal linking */}
      <section className="container mx-auto px-4 pb-16">
        <h2 className="text-xl font-display font-bold mb-3">Explore Wonderful Dragon Fruit South Africa</h2>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {INTERNAL_LINKS.map((l) => (
            <Link key={l.href} to={l.href} className="text-muted-foreground hover:text-primary transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
      </section>
    </>
  );
}
