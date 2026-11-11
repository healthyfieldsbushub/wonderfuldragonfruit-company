import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/lib/cart-context";
import { AuthProvider } from "@/lib/auth-context";
import { AddToCartRecommendationModal } from "@/components/cart/AddToCartRecommendationModal";
import { FloatingWhatsApp } from "@/components/layout/FloatingWhatsApp";
import { SiteFooter } from "@/components/layout/SiteFooter";

import { RouteTracker } from "@/components/analytics/RouteTracker";
import { CookieConsentBanner } from "@/components/consent/CookieConsentBanner";
const Index = lazy(() => import("./pages/Index"));
const DracoPage = lazy(() => import("./pages/Draco"));
const Products = lazy(() => import("./pages/Products"));
const SpecialsOfTheMonth = lazy(() => import("./pages/Specials"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const CommunityDevelopment = lazy(() => import("./pages/CommunityDevelopment"));
const BusinessResources = lazy(() => import("./pages/BusinessResources"));
const ConsultationServices = lazy(() => import("./pages/ConsultationServices"));
const RootingServices = lazy(() => import("./pages/RootingServices"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminBulkImport = lazy(() => import("./pages/admin/BulkImport"));
const AdminProductAudit = lazy(() => import("./pages/admin/ProductAudit"));
const AdminApiIntegrations = lazy(() => import("./pages/admin/ApiIntegrations"));
const AdminCategories = lazy(() => import("./pages/admin/Categories"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminCustomers = lazy(() => import("./pages/admin/Customers"));
const AdminEnquiries = lazy(() => import("./pages/admin/Enquiries"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminAI = lazy(() => import("./pages/admin/AIAssistant"));
const AdminAIImages = lazy(() => import("./pages/admin/AIImageGenerator"));
const AdminCatalogue = lazy(() => import("./pages/admin/CatalogueManager"));
const AdminSEO = lazy(() => import("./pages/admin/SEOManager"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminKnowledgeBase = lazy(() => import("./pages/admin/KnowledgeBase"));
const AdminCodeAudit = lazy(() => import("./pages/admin/CodeAudit"));
const AdminWebhooks = lazy(() => import("./pages/admin/WebhookTester"));
const AdminAIControl = lazy(() => import("./pages/admin/AIControlPanel"));
const AdminAPIVault = lazy(() => import("./pages/admin/APIKeyVault"));
const AdminWhatsApp = lazy(() => import("./pages/admin/WhatsAppInbox"));
const AdminSocialInbox = lazy(() => import("./pages/admin/SocialInbox"));
const AdminSocialPublisher = lazy(() => import("./pages/admin/SocialPublisher"));
const AdminFacebookPages = lazy(() => import("./pages/admin/FacebookPages"));
// AIModelConfig removed - superseded by AIConfiguration
const AdminChatSettings = lazy(() => import("./pages/admin/ChatSettings"));
const AdminShippingRates = lazy(() => import("./pages/admin/ShippingRates"));
const AdminAIProviders = lazy(() => import("./pages/admin/AIProviderDashboard"));
const AdminAIConfiguration = lazy(() => import("./pages/admin/AIConfiguration"));
const AdminAIDiagnostics = lazy(() => import("./pages/admin/AIDiagnostics"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPostDetail = lazy(() => import("./pages/BlogPostDetail"));
const BusinessDirectory = lazy(() => import("./pages/BusinessDirectory"));
const BusinessRegister = lazy(() => import("./pages/BusinessRegister"));
const BusinessDetail = lazy(() => import("./pages/BusinessDetail"));
const DirectorySlugRouter = lazy(() => import("./pages/directory/DirectorySlugRouter"));
const Distributors = lazy(() => import("./pages/Distributors"));

const PageDetail = lazy(() => import("./pages/PageDetail"));
const Association = lazy(() => import("./pages/Association"));
const DragonFruitBotswana = lazy(() => import("./pages/DragonFruitBotswana"));
const DragonFruitZimbabwe = lazy(() => import("./pages/DragonFruitZimbabwe"));
const DragonFruitNamibia = lazy(() => import("./pages/DragonFruitNamibia"));
const HistoryOfDragonFruit = lazy(() => import("./pages/HistoryOfDragonFruit"));
const DragonFruitGlobalProduction = lazy(() => import("./pages/DragonFruitGlobalProduction"));
const LargestDragonFruitRecord = lazy(() => import("./pages/LargestDragonFruitRecord"));
const DragonFruitResearchBenefits = lazy(() => import("./pages/DragonFruitResearchBenefits"));
const DragonFruitEnvironmentalBenefits = lazy(() => import("./pages/DragonFruitEnvironmentalBenefits"));
const DragonFruitCarbonRadiation = lazy(() => import("./pages/DragonFruitCarbonRadiation"));
const DragonFruitIndustryGrowth = lazy(() => import("./pages/DragonFruitIndustryGrowth"));
const AfricaFruitMarkets = lazy(() => import("./pages/AfricaFruitMarkets"));
const CommercialOrders = lazy(() => import("./pages/CommercialOrders"));
const Education = lazy(() => import("./pages/Education"));
const OneHectareCost = lazy(() => import("./pages/OneHectareCost"));
const AdminBlogPosts = lazy(() => import("./pages/admin/BlogPosts"));
const AdminPages = lazy(() => import("./pages/admin/Pages"));
const AdminMenus = lazy(() => import("./pages/admin/Menus"));
const AdminBusinessListings = lazy(() => import("./pages/admin/BusinessListings"));
const AdminDistributors = lazy(() => import("./pages/admin/Distributors"));
const AdminDistributorEnquiries = lazy(() => import("./pages/admin/DistributorEnquiries"));
const AdminDistributorDocuments = lazy(() => import("./pages/admin/DistributorDocuments"));

const AdminAIAgents = lazy(() => import("./pages/admin/AIAgents"));
const AdminSitemapSubmission = lazy(() => import("./pages/admin/SitemapSubmission"));
const AdminRobotsAudit = lazy(() => import("./pages/admin/RobotsAudit"));
const AdminPromoCodes = lazy(() => import("./pages/admin/PromoCodes"));
const AdminQuotations = lazy(() => import("./pages/admin/Quotations"));
const AdminSEOValidator = lazy(() => import("./pages/admin/SEOValidator"));
const AdminGeoContent = lazy(() => import("./pages/admin/GeoContentGenerator"));
const CountriesIndex = lazy(() => import("./pages/geo/CountriesIndex"));
const CountryHub = lazy(() => import("./pages/geo/CountryHub"));
const CountryPage = lazy(() => import("./pages/geo/CountryPage"));
const RegionHub = lazy(() => import("./pages/geo/RegionHub"));
const RegionPage = lazy(() => import("./pages/geo/RegionPage"));
const LegacyCountryRedirect = lazy(() => import("./pages/geo/LegacyCountryRedirect"));
const CountryAbout = lazy(() => import("./pages/country/CountryAbout"));
const CountryAssociation = lazy(() => import("./pages/country/CountryAssociation"));
const CountryTerms = lazy(() => import("./pages/country/CountryTerms"));
const Terms = lazy(() => import("./pages/Terms"));
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));
const CookiePolicy = lazy(() => import("./pages/legal/CookiePolicy"));
const CommunityGuidelines = lazy(() => import("./pages/legal/CommunityGuidelines"));
const CopyrightPolicy = lazy(() => import("./pages/legal/CopyrightPolicy"));
const FacebookDataDeletion = lazy(() => import("./pages/legal/FacebookDataDeletion"));
const IntegrationsIndex = lazy(() => import("./pages/settings/IntegrationsIndex"));
const TikTokIntegration = lazy(() => import("./pages/settings/TikTokIntegration"));
const TikTokSuccess = lazy(() => import("./pages/settings/TikTokSuccess"));
const TikTokError = lazy(() => import("./pages/settings/TikTokError"));
const TikTokCallbackBridge = lazy(() => import("./pages/settings/TikTokCallbackBridge"));

const AfricaHub = lazy(() => import("./pages/africa/AfricaHub"));
const AfricaCountry = lazy(() => import("./pages/africa/AfricaCountry"));
const AdminAgriIntelligence = lazy(() => import("./pages/admin/AgriIntelligence"));
const AdminSubscriptions = lazy(() => import("./pages/admin/Subscriptions"));

const queryClient = new QueryClient();

import { useCatalogBroadcastListener } from "@/hooks/use-catalog-refresh";

const CatalogBroadcastBridge = () => {
  useCatalogBroadcastListener();
  return null;
};

/** Warms the most common shopping-path chunks during idle time so
 * navigation to them feels instant after route-level code splitting. */
const RouteWarmer = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      void import("./pages/Products");
      void import("./pages/ProductDetail");
      void import("./pages/CategoryPage");
      void import("./pages/Checkout");
    }, 3500);
    return () => clearTimeout(timer);
  }, []);
  return null;
};

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-label="Loading page">
    <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AddToCartRecommendationModal />
          <BrowserRouter>
            <CatalogBroadcastBridge />
            <RouteTracker />
            <RouteWarmer />
            <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/products" element={<Products />} />
              <Route path="/specials-of-the-month" element={<SpecialsOfTheMonth />} />
              <Route path="/draco" element={<DracoPage />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/community-development" element={<CommunityDevelopment />} />
              <Route path="/about" element={<About />} />
              <Route path="/business-resources" element={<BusinessResources />} />
              <Route path="/consultations" element={<ConsultationServices />} />
              <Route path="/rooting-services" element={<RootingServices />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPostDetail />} />
              <Route path="/directory" element={<BusinessDirectory />} />
              <Route path="/directory/register" element={<BusinessRegister />} />
              <Route path="/directory/:slug" element={<DirectorySlugRouter />} />
              <Route path="/distributors" element={<Distributors />} />
              <Route path="/distributors/:country" element={<Distributors />} />
              <Route path="/page/:slug" element={<PageDetail />} />
              <Route path="/association" element={<Association />} />
              <Route path="/dragon-fruit-botswana" element={<DragonFruitBotswana />} />
              <Route path="/dragon-fruit-zimbabwe" element={<DragonFruitZimbabwe />} />
              <Route path="/dragon-fruit-namibia" element={<DragonFruitNamibia />} />
              <Route path="/history-of-dragon-fruit" element={<HistoryOfDragonFruit />} />
              <Route path="/dragon-fruit-global-production" element={<DragonFruitGlobalProduction />} />
              <Route path="/largest-dragon-fruit-record" element={<LargestDragonFruitRecord />} />
              <Route path="/dragon-fruit-research-benefits" element={<DragonFruitResearchBenefits />} />
              <Route path="/dragon-fruit-environmental-benefits" element={<DragonFruitEnvironmentalBenefits />} />
              <Route path="/dragon-fruit-carbon-and-radiation-claims" element={<DragonFruitCarbonRadiation />} />
              <Route path="/dragon-fruit-industry-growth" element={<DragonFruitIndustryGrowth />} />
              <Route path="/africa-fruit-and-vegetable-markets" element={<AfricaFruitMarkets />} />
              <Route path="/education" element={<Education />} />
              <Route path="/education/commercial-orders" element={<CommercialOrders />} />
              <Route path="/education/1-hectare-dragon-fruit-farm-cost" element={<OneHectareCost />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/community-guidelines" element={<CommunityGuidelines />} />
              <Route path="/copyright-policy" element={<CopyrightPolicy />} />
              <Route path="/data-deletion" element={<FacebookDataDeletion />} />

              <Route path="/terms-and-services" element={<Terms />} />

              {/* Settings / Integrations */}
              <Route path="/settings/integrations" element={<IntegrationsIndex />} />
              <Route path="/settings/integrations/tiktok" element={<TikTokIntegration />} />
              <Route path="/settings/integrations/tiktok/success" element={<TikTokSuccess />} />
              <Route path="/settings/integrations/tiktok/error" element={<TikTokError />} />
              <Route path="/api/tiktok/callback" element={<TikTokCallbackBridge />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="product-audit" element={<AdminProductAudit />} />
                <Route path="bulk-import" element={<AdminBulkImport />} />
                <Route path="product-images" element={<AdminBulkImport initialTab="images" />} />
                <Route path="api-integrations" element={<AdminApiIntegrations />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="enquiries" element={<AdminEnquiries />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="ai" element={<AdminAI />} />
                <Route path="ai-agents" element={<AdminAIAgents />} />
                <Route path="ai-images" element={<AdminAIImages />} />
                <Route path="catalogue" element={<AdminCatalogue />} />
                <Route path="seo" element={<AdminSEO />} />
                <Route path="knowledge-base" element={<AdminKnowledgeBase />} />
                <Route path="code-audit" element={<AdminCodeAudit />} />
                <Route path="webhooks" element={<AdminWebhooks />} />
                <Route path="ai-control" element={<AdminAIControl />} />
                <Route path="api-vault" element={<AdminAPIVault />} />
                <Route path="whatsapp" element={<AdminWhatsApp />} />
                <Route path="social-inbox" element={<AdminSocialInbox />} />
                <Route path="social-publisher" element={<AdminSocialPublisher />} />
                <Route path="facebook-pages" element={<AdminFacebookPages />} />
                {/* ai-models route removed - redirected to ai-config */}
                <Route path="chat-settings" element={<AdminChatSettings />} />
                <Route path="shipping-rates" element={<AdminShippingRates />} />
                <Route path="ai-providers" element={<AdminAIProviders />} />
                <Route path="ai-config" element={<AdminAIConfiguration />} />
                <Route path="ai-diagnostics" element={<AdminAIDiagnostics />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="blog-posts" element={<AdminBlogPosts />} />
                <Route path="pages" element={<AdminPages />} />
                <Route path="menus" element={<AdminMenus />} />
                <Route path="business-listings" element={<AdminBusinessListings />} />
                <Route path="distributors" element={<AdminDistributors />} />
                <Route path="distributor-enquiries" element={<AdminDistributorEnquiries />} />
                <Route path="distributor-documents" element={<AdminDistributorDocuments />} />

                <Route path="subscriptions" element={<AdminSubscriptions />} />
                <Route path="sitemap" element={<AdminSitemapSubmission />} />
                <Route path="robots-audit" element={<AdminRobotsAudit />} />
                <Route path="promo-codes" element={<AdminPromoCodes />} />
                <Route path="quotations" element={<AdminQuotations />} />
                <Route path="seo-validator" element={<AdminSEOValidator />} />
                <Route path="geo-content" element={<AdminGeoContent />} />
                <Route path="agri-intelligence" element={<AdminAgriIntelligence />} />
              </Route>

              {/* Africa-wide markets & intelligence */}
              <Route path="/africa" element={<AfricaHub />} />
              <Route path="/africa/:country" element={<AfricaCountry />} />

              {/* Africa-wide country/region/page hierarchy under canonical /country prefix */}
              <Route path="/countries" element={<CountriesIndex />} />
              <Route path="/country" element={<CountriesIndex />} />
              <Route path="/country/:country" element={<CountryHub />} />
              {/* Shared org pages — identical content for every country (canonical handled inside) */}
              <Route path="/country/:country/about" element={<CountryAbout />} />
              <Route path="/country/:country/association" element={<CountryAssociation />} />
              <Route path="/country/:country/terms" element={<CountryTerms />} />
              <Route path="/country/:country/terms-and-services" element={<CountryTerms />} />
              {/* Generic country sub-pages (listings, markets, etc.) */}
              <Route path="/country/:country/:page" element={<CountryPage />} />
              {/* Region hierarchy */}
              <Route path="/country/:country/:region" element={<RegionHub />} />
              <Route path="/country/:country/:region/:page" element={<RegionPage />} />

              {/* Legacy redirects — old /:country/... URLs forward to /country/:country/... */}
              <Route path="/:country" element={<LegacyCountryRedirect />} />
              <Route path="/:country/:region" element={<LegacyCountryRedirect />} />
              <Route path="/:country/:region/:page" element={<LegacyCountryRedirect />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            <SiteFooter />
            <FloatingWhatsApp />
            <CookieConsentBanner />

          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
