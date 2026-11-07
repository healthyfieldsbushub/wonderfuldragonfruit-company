// SEO content for each category - used on category pages and sitemap
export interface CategorySEO {
  slug: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  seoContent: string;
  relatedCategories: string[];
  relatedBlogSlugs: string[];
}

// Map DB category slugs to clean SEO URL slugs
// Map DB category slugs to clean SEO URL slugs
// Any DB slug not listed here will pass through as-is
export const categorySlugMap: Record<string, string> = {
  'white-flesh-cultivars': 'white-dragon-fruit',
  'red-magenta-purple-flesh-cultivars': 'red-dragon-fruit',
  'yellow-flesh-cultivars': 'yellow-dragon-fruit',
  'variegated-special-cultivars': 'variegated-dragon-fruit',
  'combo-specials': 'dragon-fruit-combo-specials',
  'commercial-farm-packages': 'dragon-fruit-farm-packages',
  'services-memberships': 'dragon-fruit-services',
  'premium-services': 'dragon-fruit-premium-services',
  'business-resources': 'dragon-fruit-business-resources',
};

// Reverse map: SEO slug → DB slug
export const seoToDbSlug: Record<string, string> = Object.entries(categorySlugMap).reduce(
  (acc, [dbSlug, seoSlug]) => ({ ...acc, [seoSlug]: dbSlug }),
  {} as Record<string, string>
);

export function getDbSlug(seoSlug: string): string {
  return seoToDbSlug[seoSlug] || seoSlug;
}

export function getSeoSlug(dbSlug: string): string {
  return categorySlugMap[dbSlug] || dbSlug;
}

export const categorySEOData: Record<string, CategorySEO> = {
  'white-dragon-fruit': {
    slug: 'white-dragon-fruit',
    h1: 'White Dragon Fruit Plants South Africa',
    metaTitle: 'Buy White Dragon Fruit Plants South Africa | Premium Cuttings & Nursery',
    metaDescription: 'Order premium white-fleshed dragon fruit plants and unrooted cuttings in South Africa. Selenicereus undatus varieties with sweet, refreshing flavor. Nationwide delivery from DFSA.',
    keywords: 'white dragon fruit plants south africa, white pitaya cuttings, selenicereus undatus, buy white dragon fruit, white flesh dragon fruit nursery SA',
    seoContent: `<p>White-fleshed dragon fruit (<em>Selenicereus undatus</em>) is the most widely cultivated pitaya variety worldwide and the foundation of South Africa's growing dragon fruit industry. Known for its bright pink skin and crisp, sweet white interior speckled with tiny black seeds, this category showcases our finest white-flesh cultivars sourced and grown right here in Southern Africa.</p>

<p>At Wonderful Dragon Fruit South Africa (DFSA), we supply premium unrooted cuttings of proven white-flesh varieties that thrive in South Africa's diverse climate zones — from the subtropical KwaZulu-Natal coast to the warm Limpopo lowveld. Our collection includes classic commercial cultivars such as <strong>Vietnamese White</strong>, <strong>David Bowie</strong>, <strong>Thomson</strong>, and many more exclusive genetics selected for yield, sweetness, and disease resistance.</p>

<p>White dragon fruit is the ideal entry point for new growers. These varieties are generally the hardiest, most productive, and easiest to pollinate. They produce reliably large fruit (300–600 g) and are well-suited to both home gardens and commercial operations. The fruit commands strong retail demand in South African supermarkets, restaurants, and export markets across Botswana, Namibia, Zimbabwe, and beyond.</p>

<p>Every cutting ships fresh from our nursery with detailed planting instructions. Whether you're starting a backyard trellis or scaling a 5-hectare commercial farm, DFSA provides the genetics, knowledge, and ongoing support to help you succeed. Browse our white-flesh cultivars below and add to cart for fast nationwide delivery.</p>`,
    relatedCategories: ['red-dragon-fruit', 'yellow-dragon-fruit', 'variegated-dragon-fruit'],
    relatedBlogSlugs: ['complete-guide-growing-dragon-fruit-south-africa', 'top-5-dragon-fruit-varieties-african-climates'],
  },
  'red-dragon-fruit': {
    slug: 'red-dragon-fruit',
    h1: 'Red Dragon Fruit Plants South Africa',
    metaTitle: 'Buy Red Dragon Fruit Plants South Africa | Purple & Magenta Pitaya',
    metaDescription: 'Premium red, magenta and purple-fleshed dragon fruit plants for sale in South Africa. Rich in antioxidants. Unrooted cuttings with nationwide delivery from DFSA nursery.',
    keywords: 'red dragon fruit plants south africa, purple pitaya cuttings, magenta dragon fruit, buy red dragon fruit SA, costaricensis pitaya nursery',
    seoContent: `<p>Red and purple-fleshed dragon fruit varieties are the crown jewels of any pitaya collection. Their stunning deep magenta interior is packed with betalain antioxidants, making them the most sought-after cultivars for health-conscious consumers and premium markets across South Africa and the SADC region.</p>

<p>DFSA's red-flesh collection features top-performing cultivars including <strong>American Beauty</strong>, <strong>Physical Graffiti</strong>, <strong>Dark Star</strong>, <strong>Zamorano</strong>, and dozens more — each selected for exceptional colour intensity, sweetness (14–22 Brix), and commercial viability in Southern African growing conditions.</p>

<p>Red-flesh dragon fruit typically commands 30–50% higher prices than white varieties at retail, making them an excellent choice for farmers seeking premium market positioning. These cultivars often require cross-pollination for optimal fruit set, so we recommend planting multiple red-flesh varieties alongside compatible pollinators.</p>

<p>All cuttings are freshly harvested from mature mother plants at our South African nursery and shipped nationwide. Each order includes variety-specific growing notes and access to our farmer support network. Start building your red-flesh collection today — perfect for commercial farms, boutique growers, and home gardeners across South Africa, Botswana, Namibia, and Zimbabwe.</p>`,
    relatedCategories: ['white-dragon-fruit', 'yellow-dragon-fruit', 'dragon-fruit-combo-specials'],
    relatedBlogSlugs: ['top-5-dragon-fruit-varieties-african-climates', 'dragon-fruit-health-benefits-diet'],
  },
  'yellow-dragon-fruit': {
    slug: 'yellow-dragon-fruit',
    h1: 'Yellow Dragon Fruit Plants South Africa',
    metaTitle: 'Buy Yellow Dragon Fruit Plants South Africa | Selenicereus megalanthus',
    metaDescription: 'Premium yellow dragon fruit plants and cuttings for sale in South Africa. Selenicereus megalanthus — the sweetest pitaya variety. Nationwide delivery from DFSA nursery.',
    keywords: 'yellow dragon fruit plants south africa, selenicereus megalanthus, palora dragon fruit, buy yellow pitaya SA, golden dragon fruit cuttings',
    seoContent: `<p>Yellow dragon fruit (<em>Selenicereus megalanthus</em>) is widely regarded as the sweetest and most flavourful pitaya species. With its distinctive yellow thorny skin and translucent white flesh, it commands the highest market prices of any dragon fruit variety — often R80–R150 per fruit at South African retail.</p>

<p>Our yellow-flesh collection at DFSA includes the legendary <strong>Palora</strong> (Ecuador's premium export cultivar), <strong>Colombian Gold</strong>, and other rare megalanthus genetics. These varieties produce smaller fruit (150–350 g) but deliver extraordinary sweetness levels of 18–24 Brix — far exceeding most red or white varieties.</p>

<p>Yellow dragon fruit grows somewhat differently from its pink-skinned cousins: it prefers slightly cooler conditions, takes longer to fruit (18–24 months from cutting), and benefits from careful irrigation management. However, the premium prices and market exclusivity make it a highly profitable crop for South African growers willing to invest the extra care.</p>

<p>DFSA ships fresh unrooted yellow dragon fruit cuttings nationwide across South Africa, with export available to Botswana, Namibia, Zimbabwe, Zambia, and Uganda. Each cutting comes with detailed megalanthus-specific growing instructions. Browse our yellow cultivar range below and secure your premium genetics today.</p>`,
    relatedCategories: ['white-dragon-fruit', 'red-dragon-fruit', 'dragon-fruit-farm-packages'],
    relatedBlogSlugs: ['top-5-dragon-fruit-varieties-african-climates', 'starting-dragon-fruit-business-beginners-guide'],
  },
  'variegated-dragon-fruit': {
    slug: 'variegated-dragon-fruit',
    h1: 'Variegated Dragon Fruit Plants South Africa',
    metaTitle: 'Buy Variegated Dragon Fruit Plants South Africa | Rare Collector Cultivars',
    metaDescription: 'Rare variegated and specialty dragon fruit plants for sale in South Africa. Unique chimera genetics with stunning colours. Collector-grade cuttings from DFSA nursery.',
    keywords: 'variegated dragon fruit south africa, rare pitaya plants, chimera dragon fruit, collector dragon fruit cuttings, rainbow dragon fruit SA',
    seoContent: `<p>Variegated and specialty dragon fruit cultivars represent the rarest and most visually striking genetics in the pitaya world. These collector-grade plants feature stunning colour variations — from gold-and-green striped stems to chimeric fruit with multi-coloured flesh — making them prized both as ornamental specimens and premium produce.</p>

<p>DFSA's variegated collection includes rare genetics sourced from specialist breeders across Southeast Asia, Central America, and our own South African breeding programme. Expect unique cultivars with names like <strong>Chameleon</strong>, <strong>Rainbow</strong>, and exclusive chimera sports that produce truly one-of-a-kind fruit.</p>

<p>These speciality varieties are limited in availability and often sell out quickly. They make exceptional gifts for garden enthusiasts and valuable additions to commercial operations seeking niche market differentiation. Many variegated varieties also produce excellent-tasting fruit alongside their ornamental appeal.</p>

<p>All variegated cuttings ship fresh from our nursery with authentication notes and care instructions specific to each variety. Delivery available nationwide across South Africa and to neighbouring countries. Secure your rare genetics before stock runs out.</p>`,
    relatedCategories: ['white-dragon-fruit', 'red-dragon-fruit', 'yellow-dragon-fruit'],
    relatedBlogSlugs: ['top-5-dragon-fruit-varieties-african-climates', 'complete-guide-growing-dragon-fruit-south-africa'],
  },
  'dragon-fruit-combo-specials': {
    slug: 'dragon-fruit-combo-specials',
    h1: 'Dragon Fruit Combo Specials South Africa',
    metaTitle: 'Dragon Fruit Combo Packs South Africa | Multi-Variety Cutting Bundles',
    metaDescription: 'Save with dragon fruit combo specials — multi-variety cutting bundles perfect for starting your collection. Multiple cultivars in one order. Fast SA delivery from DFSA.',
    keywords: 'dragon fruit combo pack south africa, pitaya variety bundle, dragon fruit starter pack, multiple dragon fruit cuttings SA',
    seoContent: `<p>Our combo specials are the smartest way to start or expand your dragon fruit collection. Each bundle combines multiple carefully selected cultivars at a discounted price, giving you genetic diversity and cross-pollination compatibility in a single order.</p>

<p>Whether you're a first-time grower wanting to trial several varieties or an experienced farmer expanding your planting mix, DFSA's combo packs deliver exceptional value. Bundles include a mix of white, red, and yellow-flesh varieties selected for compatible flowering times and complementary flavour profiles.</p>

<p>Cross-pollination between different cultivars dramatically improves fruit set and size, so planting multiple varieties isn't just fun — it's good farming practice. Our combo specials are designed with pollination compatibility in mind, ensuring your plants produce abundant, high-quality fruit.</p>

<p>All combos ship fresh nationwide across South Africa with individual variety labels and planting guides. Perfect for home gardens, small farms, and commercial operations looking to diversify their cultivar portfolio.</p>`,
    relatedCategories: ['white-dragon-fruit', 'red-dragon-fruit', 'yellow-dragon-fruit'],
    relatedBlogSlugs: ['complete-guide-growing-dragon-fruit-south-africa', 'starting-dragon-fruit-business-beginners-guide'],
  },
  'dragon-fruit-farm-packages': {
    slug: 'dragon-fruit-farm-packages',
    h1: 'Commercial Dragon Fruit Farm Packages South Africa',
    metaTitle: 'Commercial Dragon Fruit Farm Packages SA | Bulk Cuttings 150-1000+ Plants',
    metaDescription: 'Bulk dragon fruit cuttings for commercial farming in South Africa. Volume pricing for 150-1000+ plants with professional farm setup support. DFSA commercial packages.',
    keywords: 'commercial dragon fruit farm south africa, bulk pitaya cuttings, dragon fruit farming business SA, wholesale dragon fruit plants',
    seoContent: `<p>DFSA's commercial farm packages are designed for serious agricultural entrepreneurs ready to establish profitable dragon fruit operations in South Africa and across the SADC region. Our bulk packages offer significant volume discounts on 150 to 1,000+ unrooted cuttings, complete with professional farm planning support.</p>

<p>Each commercial package includes a curated mix of proven high-yield cultivars selected for your specific climate zone and market targets. We work with you to design optimal variety combinations that ensure year-round production, effective cross-pollination, and diversified market appeal.</p>

<p>Beyond genetics, DFSA provides commercial clients with comprehensive support: farm layout consultation, trellis system recommendations, irrigation planning, and ongoing agronomic advisory services. We've helped establish successful dragon fruit farms across South Africa, Botswana, Zimbabwe, Namibia, and Zambia.</p>

<p>Dragon fruit farming offers exceptional returns — established orchards can generate R500,000–R2,000,000 per hectare annually depending on variety mix and market access. Contact us to discuss your commercial project or order directly below for immediate dispatch.</p>`,
    relatedCategories: ['white-dragon-fruit', 'red-dragon-fruit', 'dragon-fruit-combo-specials'],
    relatedBlogSlugs: ['starting-dragon-fruit-business-beginners-guide', 'complete-guide-growing-dragon-fruit-south-africa'],
  },
};

// All category SEO slugs for sitemap and routing
const allCategorySeoSlugs = Object.keys(categorySEOData);
