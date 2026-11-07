// Shared definition of all per-region page templates.
// Used by routing, sitemap, AI generator, and breadcrumbs.

export interface RegionPageDef {
  slug: string;
  title: string;
  category: 'core' | 'farming' | 'market' | 'education' | 'community' | 'organization';
  intent: string; // short brief used by the AI generator
}

export const REGION_PAGES: RegionPageDef[] = [
  // Core
  { slug: 'services', title: 'Services', category: 'core', intent: 'List dragon fruit farming services available in this region (consultation, training, plant supply, rooting, export support).' },
  { slug: 'what-we-offer', title: 'What We Offer', category: 'core', intent: 'Overview of DFSA offerings tailored to growers in this region.' },
  { slug: 'about', title: 'About', category: 'core', intent: 'About DFSA presence, mission, and history in this region.' },
  { slug: 'terms-and-services', title: 'Terms and Services', category: 'core', intent: 'Plain-language terms governing services delivered in this region.' },
  { slug: 'listings', title: 'Listings', category: 'core', intent: 'Featured farms, nurseries and dragon fruit businesses in this region.' },
  { slug: 'contact', title: 'Contact', category: 'core', intent: 'How to reach DFSA in this region (phone, WhatsApp, email).' },
  { slug: 'support', title: 'Support', category: 'core', intent: 'Grower support resources, FAQs and helplines for this region.' },

  // Farming & Business
  { slug: 'start-farming', title: 'Start Farming', category: 'farming', intent: 'Step-by-step guide to starting a dragon fruit farm in this region (climate, soil, capital).' },
  { slug: 'training', title: 'Training', category: 'farming', intent: 'Available training programs, workshops, and certifications in this region.' },
  { slug: 'buy-plants', title: 'Buy Plants', category: 'farming', intent: 'How to buy dragon fruit cuttings and rooted plants delivered to this region.' },
  { slug: 'sell-produce', title: 'Sell Produce', category: 'farming', intent: 'How growers in this region can sell dragon fruit produce locally and abroad.' },

  // Market & Economy
  { slug: 'market-prices', title: 'Market Prices', category: 'market', intent: 'Indicative wholesale and retail dragon fruit prices in this region.' },
  { slug: 'export-opportunities', title: 'Export Opportunities', category: 'market', intent: 'Export channels, certifications, and target markets relevant to this region.' },
  { slug: 'buyers', title: 'Buyers', category: 'market', intent: 'Wholesale buyers, retailers and exporters sourcing dragon fruit from this region.' },

  // Education
  { slug: 'how-to-grow', title: 'How to Grow', category: 'education', intent: 'Region-specific agronomy: climate notes, trellising, watering, harvest cycle.' },
  { slug: 'pest-control', title: 'Pest Control', category: 'education', intent: 'Common pests and diseases affecting dragon fruit in this region and how to manage them.' },
  { slug: 'irrigation', title: 'Irrigation', category: 'education', intent: 'Water requirements and irrigation systems suited to this region.' },

  // Community
  { slug: 'events', title: 'Events', category: 'community', intent: 'Upcoming and recent dragon fruit farming events in this region.' },
  { slug: 'news', title: 'News', category: 'community', intent: 'Latest dragon fruit farming news from this region.' },
  { slug: 'success-stories', title: 'Success Stories', category: 'community', intent: 'Profiles of successful dragon fruit growers in this region.' },

  // Organization
  { slug: 'membership', title: 'Membership', category: 'organization', intent: 'Benefits of joining the DFSA association as a grower in this region.' },
  { slug: 'partners', title: 'Partners', category: 'organization', intent: 'Local partners, suppliers and collaborators active in this region.' },
];

const REGION_PAGE_SLUGS = REGION_PAGES.map(p => p.slug);

export const COUNTRY_PAGES = [
  { slug: 'about', title: 'About' },
  { slug: 'terms', title: 'Terms' },
  { slug: 'listings', title: 'Listings' },
  { slug: 'markets', title: 'Markets' },
  { slug: 'association', title: 'Association' },
];
