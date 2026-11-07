import { Header } from '@/components/layout/Header';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { FAQSection, type FAQItem } from '@/components/seo/FAQSection';

const TERMS_FAQS: FAQItem[] = [
  {
    question: 'What currency are DFSA prices in?',
    answer:
      'All prices are quoted in South African Rand (ZAR) unless explicitly stated otherwise, regardless of the buyer\'s country.',
  },
  {
    question: 'How long does the rooting service take?',
    answer:
      'The professional rooting service typically takes 3–6 weeks. Plants are only dispatched once a healthy root system is confirmed. Tiered pricing applies (R30 for 1–10 plants, R5 for 150–599, with lower rates at scale).',
  },
  {
    question: 'Do you ship outside South Africa?',
    answer:
      'Yes — to Botswana, Zimbabwe, Namibia and other African countries. Cross-border shipments require valid phytosanitary documentation, arranged at additional cost.',
  },
  {
    question: 'What is your refund and replacement policy?',
    answer:
      'DFSA does not offer cash refunds. Plants are inspected before dispatch. Damage or non-viability claims must be lodged within 7 days of receipt with photographic evidence. DFSA will replace the plant or issue store credit at its discretion. Custom commercial orders are non-refundable once propagation has begun.',
  },
  {
    question: 'Can I cancel a consultation or training booking?',
    answer:
      'Cancellations more than 7 days before the scheduled date receive a full credit. Cancellations inside that window may incur a fee.',
  },
  {
    question: 'Which law governs these terms?',
    answer:
      'These terms are governed by the laws of the Republic of South Africa. Disputes are first referred to good-faith negotiation, then mediation, before litigation in a competent South African court.',
  },
];

interface Props {
  /** Master canonical URL — keeps duplicate-content safe across country prefixes. */
  canonicalUrl?: string;
  /** Optional breadcrumb trail prepended before "Terms". */
  breadcrumb?: { label: string; href?: string }[];
}

const SECTIONS: { heading: string; body: React.ReactNode }[] = [
  {
    heading: '1. Orders & Pricing',
    body: (
      <p>
        All prices are quoted in South African Rand (ZAR) unless explicitly stated.
        Orders are confirmed once payment clears. Stock availability is dynamic and DFSA
        reserves the right to substitute a cultivar with a like-for-like variety where
        necessary, with the customer's prior consent.
      </p>
    ),
  },
  {
    heading: '2. Rooting Service',
    body: (
      <p>
        The professional rooting service typically takes 3–6 weeks. Rooting fees follow
        tiered pricing (R30 for 1–10 plants, R5 for 150–599, lower at scale). Rooted
        plants are dispatched only once a healthy root system is confirmed.
      </p>
    ),
  },
  {
    heading: '3. Shipping & Cross-Border Delivery',
    body: (
      <p>
        Domestic deliveries within South Africa are handled by The Courier Guy and PUDO.
        Cross-border shipments (Botswana, Zimbabwe, Namibia and other African countries)
        require valid phytosanitary documentation arranged at additional cost.
      </p>
    ),
  },
  {
    heading: '4. Export Certifications',
    body: (
      <p>
        Optional certificates available at checkout: Phytosanitary Certificate (R600),
        Inspection Certificate (R650). Export buyers are responsible for import permits
        in the destination country.
      </p>
    ),
  },
  {
    heading: '5. Refunds & Replacements',
    body: (
      <p>
        DFSA does not offer cash refunds on any product or service. Plants are inspected
        before dispatch. Claims for damaged or non-viable plants must be lodged within
        7 days of receipt with photographic evidence. DFSA will replace the plant or
        issue store credit at its discretion. Custom commercial orders are non-refundable
        once propagation has begun. Shipping is always quoted and charged separately on
        every order — we do not offer free shipping at any order value.
      </p>
    ),
  },
  {
    heading: '6. Consultation & Training Services',
    body: (
      <p>
        Bookings are confirmed on payment. Cancellations more than 7 days before the
        scheduled date receive a full credit; later cancellations may incur a fee.
      </p>
    ),
  },
  {
    heading: '7. Association Membership',
    body: (
      <p>
        Membership of the DFSA Association is annual and grants access to member pricing,
        training discounts and the buyer/seller network. Membership is non-transferable.
      </p>
    ),
  },
  {
    heading: '8. Privacy & Data',
    body: (
      <p>
        Personal data submitted via orders, leads or WhatsApp conversations is processed
        in line with the Protection of Personal Information Act (POPIA) and used solely
        to fulfil services and provide updates the customer has opted into.
      </p>
    ),
  },
  {
    heading: '9. Governing Law',
    body: (
      <p>
        These terms are governed by the laws of the Republic of South Africa. Disputes
        shall first be referred to good-faith negotiation, then to mediation, before
        litigation in a competent South African court.
      </p>
    ),
  },
  {
    heading: '10. Contact',
    body: (
      <p>
        Questions about these terms:{' '}
        <a
          href="mailto:orders@proagrisa.co.za"
          className="text-primary underline underline-offset-4 hover:text-primary/80"
        >
          orders@proagrisa.co.za
        </a>
        .
      </p>
    ),
  },
];

export default function Terms({ canonicalUrl = '/terms', breadcrumb = [] }: Props) {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Terms of Service | Wonderful Dragon Fruit South Africa (DFSA)"
        description="DFSA terms of service governing the supply of dragon fruit plants, training, consultations and rooting services across Africa."
        url={canonicalUrl}
      />
      <Header />
      <CartSidebar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <Breadcrumbs items={[...breadcrumb, { label: 'Terms of Service' }]} className="mb-6" />

        <header className="mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            These terms govern the supply of dragon fruit plants, training, consultations,
            rooting services and association membership offered by Dragon Fruit Farming
            Africa (DFSA / "Wonderful Dragonfruit") across South Africa and the rest of
            Africa. DFSA operates as a single organisation; identical terms apply to all
            customers regardless of country of delivery.
          </p>
        </header>

        <div className="space-y-8">
          {SECTIONS.map(({ heading, body }) => (
            <section key={heading} className="border-t border-border pt-6">
              <h2 className="font-display text-2xl md:text-3xl font-semibold mb-3 text-foreground">
                {heading}
              </h2>
              <div className="text-foreground/90 leading-relaxed text-base md:text-[1.05rem] [&_p]:mb-3 last:[&_p]:mb-0">
                {body}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-12 text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </main>

      <FAQSection
        title="Terms — FAQs"
        description="Quick answers to the most common questions about ordering, shipping, refunds and consultations with DFSA."
        faqs={TERMS_FAQS}
      />
    </div>
  );
}
