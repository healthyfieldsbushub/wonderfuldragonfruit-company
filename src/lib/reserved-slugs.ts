// Top-level routes already used by the app. The dynamic /:country (and any
// nested /:country/:region/...) route MUST NOT match these — otherwise a typo
// like /about/team would silently render a broken country page.
//
// Keep this list in sync with src/App.tsx top-level <Route path="/..."> entries.
const RESERVED_TOP_LEVEL_SLUGS = new Set<string>([
  // Core nav
  'about',
  'blog',
  'shop',
  'products',
  'product',
  'category',
  'contact',
  'cart',
  'checkout',
  'order-success',
  'my-orders',
  'login',
  'signup',
  'reset-password',

  // Legal / compliance
  'terms',
  'terms-and-services',
  'terms-of-service',
  'privacy-policy',
  'cookie-policy',
  'community-guidelines',
  'copyright-policy',
  'data-deletion',


  // Editorial / CMS / structural
  'page',
  'pages',
  'directory',
  'association',
  'education',
  'consultations',
  'rooting-services',
  'business-resources',

  // Africa / geo hubs (NOT country slugs themselves)
  'africa',
  'countries',
  'country', // new canonical prefix for /country/[slug]/...

  // SEO landing pages
  'dragon-fruit-botswana',
  'dragon-fruit-zimbabwe',
  'dragon-fruit-namibia',
  'dragon-fruit-global-production',
  'dragon-fruit-research-benefits',
  'dragon-fruit-environmental-benefits',
  'dragon-fruit-carbon-and-radiation-claims',
  'dragon-fruit-industry-growth',
  'history-of-dragon-fruit',
  'largest-dragon-fruit-record',
  'africa-fruit-and-vegetable-markets',

  // Admin / API
  'admin',
  'api',

  // Static assets / system
  'sitemap.xml',
  'robots.txt',
  'favicon.ico',
  'assets',
  'static',
  'public',
]);

export const isReservedTopLevelSlug = (slug?: string): boolean =>
  !!slug && RESERVED_TOP_LEVEL_SLUGS.has(slug.toLowerCase());
