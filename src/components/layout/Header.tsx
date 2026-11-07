import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Package, Heart, User, LogOut, ChevronDown, Search, Check } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useCategories } from '@/hooks/use-products';
import { useCountries } from '@/hooks/use-geo-pages';
import { useDistributorCountries } from '@/hooks/use-distributors';

import { useDynamicMenu } from '@/hooks/use-dynamic-menu';
import { getSeoSlug } from '@/lib/category-seo';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { DonationModal } from '@/components/donations/DonationModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { itemCount, setIsOpen } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: dbCategories = [] } = useCategories();
  const { data: countries = [] } = useCountries();
  const { data: distributorCountries = [] } = useDistributorCountries();

  const { data: customMenu } = useDynamicMenu('header');
  const [countrySearch, setCountrySearch] = useState('');
  const [mobileCountrySearch, setMobileCountrySearch] = useState('');
  const location = useLocation();

  // Active country = first URL segment if it matches a known country slug.
  // Works for /:country, /:country/:region, /:country/:region/:page, etc.
  const activeCountrySlug = useMemo(() => {
    const segs = location.pathname.split('/').filter(Boolean);
    // New canonical: /country/:slug/...
    if (segs[0]?.toLowerCase() === 'country' && segs[1]) {
      const s = segs[1].toLowerCase();
      return countries.some(c => c.slug.toLowerCase() === s) ? s : null;
    }
    // Legacy /:slug/... still highlights while redirect resolves.
    const first = segs[0]?.toLowerCase();
    if (!first) return null;
    return countries.some(c => c.slug.toLowerCase() === first) ? first : null;
  }, [location.pathname, countries]);

  const shopCategories = [
    { label: 'All Products', href: '/products' },
    ...dbCategories.map((cat) => ({
      label: cat.name,
      href: `/category/${getSeoSlug(cat.slug)}`,
    })),
  ];

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(c => c.name.toLowerCase().includes(q));
  }, [countries, countrySearch]);

  const filteredMobileCountries = useMemo(() => {
    const q = mobileCountrySearch.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(c => c.name.toLowerCase().includes(q));
  }, [countries, mobileCountrySearch]);

  const countriesBySubRegion = useMemo(
    () =>
      filteredCountries.reduce<Record<string, typeof countries>>((acc, c) => {
        (acc[c.sub_region] ||= []).push(c);
        return acc;
      }, {}),
    [filteredCountries],
  );

  const mobileCountriesBySubRegion = useMemo(
    () =>
      filteredMobileCountries.reduce<Record<string, typeof countries>>((acc, c) => {
        (acc[c.sub_region] ||= []).push(c);
        return acc;
      }, {}),
    [filteredMobileCountries],
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#b89b74]/80 bg-[#D2B48C] shadow-[0_4px_18px_rgba(72,53,32,0.18)] transition-colors duration-200">
      <div className="container mx-auto px-3 md:px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-3">
            <span className="text-xl md:text-2xl font-display font-bold text-gradient-dragon">
              DFSA
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-0 rounded-2xl border border-[#b89b74]/70 bg-[#ead7b8]/35 p-1 shadow-inner">
            <Link to="/" className="animated-underline rounded-lg px-2 py-2 text-sm font-semibold text-stone-900 hover:bg-white/45 hover:text-emerald-950 transition-all duration-200">Home</Link>
            
            {/* Shop dropdown with category links */}
            <DropdownMenu>
              <DropdownMenuTrigger className="animated-underline rounded-lg px-2 py-2 text-sm font-semibold text-stone-900 hover:bg-white/45 hover:text-emerald-950 transition-all duration-200 flex items-center gap-1 outline-none">
                Shop <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {shopCategories.map((cat) => (
                  <DropdownMenuItem key={cat.href} asChild>
                    <Link to={cat.href} className="w-full cursor-pointer">
                      {cat.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Education dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="animated-underline rounded-lg px-2 py-2 text-sm font-semibold text-stone-900 hover:bg-white/45 hover:text-emerald-950 transition-all duration-200 flex items-center gap-1 outline-none">
                Education <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuItem asChild><Link to="/education" className="w-full cursor-pointer font-semibold">All Education Resources</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/history-of-dragon-fruit" className="w-full cursor-pointer">History & Origins</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/dragon-fruit-global-production" className="w-full cursor-pointer">Global Production</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/largest-dragon-fruit-record" className="w-full cursor-pointer">Record Sizes</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/dragon-fruit-research-benefits" className="w-full cursor-pointer">Research & Science</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/dragon-fruit-environmental-benefits" className="w-full cursor-pointer">Environmental Benefits</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/dragon-fruit-carbon-and-radiation-claims" className="w-full cursor-pointer">Carbon & Radiation Claims</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/dragon-fruit-industry-growth" className="w-full cursor-pointer">Industry Growth</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/africa-fruit-and-vegetable-markets" className="w-full cursor-pointer">Africa Markets Directory</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/education/1-hectare-dragon-fruit-farm-cost" className="w-full cursor-pointer font-semibold text-primary">1 Hectare Farm Cost Guide</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/education/commercial-orders" className="w-full cursor-pointer font-semibold text-primary">Commercial Orders</Link></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/blog" className="animated-underline rounded-lg px-2 py-2 text-sm font-semibold text-stone-900 hover:bg-white/45 hover:text-emerald-950 transition-all duration-200">Blog</Link>
            {/* Directory dropdown — includes country associate plant suppliers */}
            <DropdownMenu>
              <DropdownMenuTrigger className="animated-underline rounded-lg px-2 py-2 text-sm font-semibold text-stone-900 hover:bg-white/45 hover:text-emerald-950 transition-all duration-200 flex items-center gap-1 outline-none">
                Directory <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuItem asChild><Link to="/directory" className="w-full cursor-pointer font-semibold">Business Directory</Link></DropdownMenuItem>
                {distributorCountries.map((c) => (
                  <DropdownMenuItem key={c.slug} asChild>
                    <Link to={`/directory/${c.slug}`} className="w-full cursor-pointer">
                      <span className="mr-2" aria-hidden="true">{c.flag_emoji}</span>
                      {c.name} Associate Plant Suppliers
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>


            {/* Countries mega-menu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="animated-underline rounded-lg px-2 py-2 text-sm font-semibold text-stone-900 hover:bg-white/45 hover:text-emerald-950 transition-all duration-200 flex items-center gap-1 outline-none">
                Countries <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="p-4 w-[min(90vw,720px)]">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="search"
                    placeholder="Search countries…"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="pl-9 h-9"
                    aria-label="Search countries"
                  />
                </div>
                {filteredCountries.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No countries match "{countrySearch}"
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 max-h-[60vh] overflow-y-auto">
                    {Object.entries(countriesBySubRegion).map(([sub, list]) => (
                      <div key={sub}>
                        <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">{sub}</div>
                        <ul className="space-y-1">
                          {list.map((c) => (
                            <li key={c.id}>
                              <Link
                                to={`/country/${c.slug}`}
                                aria-current={activeCountrySlug === c.slug ? 'page' : undefined}
                                className={cn(
                                  'flex items-center gap-2 text-sm transition-colors py-0.5 px-2 -mx-2 rounded-md',
                                  activeCountrySlug === c.slug
                                    ? 'bg-primary/10 text-primary font-semibold'
                                    : 'text-foreground/80 hover:text-primary hover:bg-accent/50',
                                )}
                              >
                                <span aria-hidden>{c.flag_emoji}</span>
                                <span className="flex-1">{c.name}</span>
                                {activeCountrySlug === c.slug && (
                                  <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 pt-3 border-t flex items-center justify-between gap-3">
                  <Link to="/countries" className="text-sm font-medium text-primary hover:underline">
                    See all countries →
                  </Link>
                  <Link to="/africa" className="text-sm font-medium text-primary hover:underline">
                    Africa Markets Hub →
                  </Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/consultations" className="animated-underline rounded-lg px-2 py-2 text-sm font-semibold text-stone-900 hover:bg-white/45 hover:text-emerald-950 transition-all duration-200">Consult</Link>
            <Link to="/distributors" className="animated-underline rounded-lg px-2 py-2 text-sm font-semibold text-stone-900 hover:bg-white/45 hover:text-emerald-950 transition-all duration-200">Distributors</Link>
            <Link to="/association" className="animated-underline rounded-lg px-2 py-2 text-sm font-semibold text-stone-900 hover:bg-white/45 hover:text-emerald-950 transition-all duration-200">Association</Link>
            <Link to="/about" className="animated-underline rounded-lg px-2 py-2 text-sm font-semibold text-stone-900 hover:bg-white/45 hover:text-emerald-950 transition-all duration-200">About</Link>
            {/* Contact dropdown — contact pages + community development hub */}
            <DropdownMenu>
              <DropdownMenuTrigger className="animated-underline rounded-lg px-2 py-2 text-sm font-semibold text-stone-900 hover:bg-white/45 hover:text-emerald-950 transition-all duration-200 flex items-center gap-1 outline-none">
                Contact <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuItem asChild><Link to="/contact" className="w-full cursor-pointer font-semibold">Contact ProAgriSA</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/community-development" className="w-full cursor-pointer">Community Development &amp; Projects</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/community-development#education-training" className="w-full cursor-pointer">Education, Training &amp; Outreach</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/community-development#ai-innovation" className="w-full cursor-pointer">AI &amp; Agricultural Innovation</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/community-development#partnerships" className="w-full cursor-pointer">Business Partnerships &amp; Sponsorships</Link></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {customMenu?.items?.map((item) => (
              <Link
                key={item.url}
                to={item.url}
                target={item.target}
                className="animated-underline rounded-lg px-2 py-2 text-sm font-semibold text-stone-900 hover:bg-white/45 hover:text-emerald-950 transition-all duration-200"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 md:gap-2">
            <DonationModal 
              trigger={
                <Button variant="ghost" size="sm" className="hidden md:flex h-9 rounded-xl border border-pink-700/25 bg-white/35 px-2.5 text-sm font-semibold text-pink-800 shadow-sm hover:-translate-y-0.5 hover:bg-white/60 hover:text-pink-900 hover:shadow-md transition-all duration-200">
                  <Heart className="h-4 w-4 fill-current" />
                  Donate
                </Button>
              }
            />
            
            <Button variant="ghost" size="icon" className="hidden md:flex h-9 w-9 rounded-xl border border-stone-800/15 bg-white/30 text-stone-900 shadow-sm hover:-translate-y-0.5 hover:bg-white/60 hover:shadow-md transition-all duration-200" asChild>
              <Link to="/my-orders" title="My Orders">
                <Package className="h-5 w-5" />
              </Link>
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative h-9 w-9 rounded-xl border border-stone-800/15 bg-white/30 text-stone-900 shadow-sm hover:-translate-y-0.5 hover:bg-white/60 hover:shadow-md transition-all duration-200"
              onClick={() => setIsOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              )}
            </Button>

            {/* Auth buttons */}
            {user ? (
              <div className="hidden md:flex items-center gap-1">
                {isAdmin && (
                  <Button variant="outline" size="sm" className="h-9 rounded-xl border-stone-800/35 bg-white/25 px-2.5 text-sm text-stone-900 shadow-sm hover:bg-white/60 hover:shadow-md transition-all duration-200" asChild>
                    <Link to="/admin">Admin</Link>
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={signOut} className="gap-1">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-9 rounded-xl px-2.5 text-sm text-stone-900 hover:bg-white/55 font-semibold shadow-sm hover:shadow-md transition-all duration-200" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button variant="default" size="sm" className="h-9 rounded-xl border border-emerald-950/20 bg-emerald-900 px-3 text-sm text-white font-semibold shadow-md hover:-translate-y-0.5 hover:bg-emerald-950 hover:shadow-lg transition-all duration-200" asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            )}

            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden h-10 w-10 rounded-xl border border-stone-800/15 bg-white/30 text-stone-900 shadow-sm hover:bg-white/60 hover:shadow-md transition-all duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-[#b89b74]/80 bg-[#D2B48C] shadow-lg"
          >
            <nav className="flex flex-col p-4 gap-4">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 font-semibold text-stone-900 hover:bg-white/45 transition-colors">Home</Link>
              
              {/* Mobile shop categories */}
              <div className="border-l-2 border-stone-800/25 pl-4 space-y-2">
                <span className="font-semibold text-sm text-primary uppercase tracking-wide">Shop Categories</span>
                {shopCategories.map((cat) => (
                  <Link
                    key={cat.href}
                    to={cat.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-stone-900 hover:bg-white/45 hover:text-emerald-950 transition-colors"
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>

              <Link to="/blog" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 font-semibold text-stone-900 hover:bg-white/45 transition-colors">Blog</Link>
              
              {/* Mobile education links */}
              <div className="border-l-2 border-stone-800/25 pl-4 space-y-2">
                <span className="font-semibold text-sm text-primary uppercase tracking-wide">Education</span>
                <Link key="education-hub" to="/education" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-semibold text-stone-900 hover:bg-white/45 hover:text-emerald-950 transition-colors">All Education Resources</Link>
                {[
                  { href: '/history-of-dragon-fruit', label: 'History & Origins' },
                  { href: '/dragon-fruit-global-production', label: 'Global Production' },
                  { href: '/largest-dragon-fruit-record', label: 'Record Sizes' },
                  { href: '/dragon-fruit-research-benefits', label: 'Research & Science' },
                  { href: '/dragon-fruit-environmental-benefits', label: 'Environmental Benefits' },
                  { href: '/dragon-fruit-carbon-and-radiation-claims', label: 'Carbon & Radiation' },
                  { href: '/dragon-fruit-industry-growth', label: 'Industry Growth' },
                  { href: '/africa-fruit-and-vegetable-markets', label: 'Africa Markets' },
                  { href: '/education/1-hectare-dragon-fruit-farm-cost', label: '💰 1 Hectare Farm Cost Guide' },
                  { href: '/education/commercial-orders', label: '🌱 Commercial Orders' },
                ].map((item) => (
                  <Link key={item.href} to={item.href} onClick={() => setMobileMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-stone-900 hover:bg-white/45 hover:text-emerald-950 transition-colors">{item.label}</Link>
                ))}
              </div>

              <Link to="/directory" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 font-semibold text-stone-900 hover:bg-white/45 transition-colors">Directory</Link>
              <Link to="/distributors" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 font-semibold text-stone-900 hover:bg-white/45 transition-colors">Distributors</Link>
              <div className="border-l-2 border-stone-800/25 pl-4 space-y-1">
                {distributorCountries.map((c) => (
                  <Link key={c.slug} to={`/directory/${c.slug}`} onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-stone-900 hover:bg-white/45 hover:text-emerald-950 transition-colors">
                    {c.flag_emoji} {c.name} Associate Plant Suppliers
                  </Link>
                ))}
              </div>


              {/* Mobile countries */}
              <div className="border-l-2 border-stone-800/25 pl-4 space-y-3">
                <span className="font-semibold text-sm text-primary uppercase tracking-wide">Countries</span>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="search"
                    placeholder="Search countries…"
                    value={mobileCountrySearch}
                    onChange={(e) => setMobileCountrySearch(e.target.value)}
                    className="pl-9 h-9"
                    aria-label="Search countries"
                  />
                </div>
                {filteredMobileCountries.length === 0 ? (
                  <div className="py-3 text-sm text-muted-foreground">
                    No countries match "{mobileCountrySearch}"
                  </div>
                ) : (
                  Object.entries(mobileCountriesBySubRegion).map(([sub, list]) => (
                    <div key={sub}>
                      <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">{sub}</div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        {list.map((c) => (
                          <Link
                            key={c.id}
                            to={`/country/${c.slug}`}
                            onClick={() => setMobileMenuOpen(false)}
                            aria-current={activeCountrySlug === c.slug ? 'page' : undefined}
                            className={cn(
                              'flex items-center gap-1 text-sm transition-colors py-0.5 px-2 -mx-2 rounded-md',
                              activeCountrySlug === c.slug
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-foreground/80 hover:text-primary',
                            )}
                          >
                            <span>{c.flag_emoji} {c.name}</span>
                            {activeCountrySlug === c.slug && (
                              <Check className="h-3 w-3 text-primary ml-auto" aria-hidden />
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))
                )}
                <Link to="/countries" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-primary pt-1">
                  See all countries →
                </Link>
              </div>
              <Link to="/my-orders" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 font-semibold text-stone-900 hover:bg-white/45 transition-colors">My Orders</Link>
              <Link to="/consultations" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 font-semibold text-stone-900 hover:bg-white/45 transition-colors">Consultations</Link>
              <Link to="/association" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 font-semibold text-stone-900 hover:bg-white/45 transition-colors">Association</Link>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 font-semibold text-stone-900 hover:bg-white/45 transition-colors">About</Link>
              {/* Mobile contact menu */}
              <div className="border-l-2 border-stone-800/25 pl-4 space-y-1">
                <span className="font-semibold text-sm text-primary uppercase tracking-wide">Contact</span>
                <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg px-3 py-2 font-semibold text-stone-900 hover:bg-white/45 hover:text-emerald-950 transition-colors">Contact ProAgriSA</Link>
                <Link to="/community-development" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg px-3 py-2 font-semibold text-stone-900 hover:bg-white/45 hover:text-emerald-950 transition-colors">Community Development &amp; Projects</Link>
                <Link to="/community-development#education-training" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-stone-900 hover:bg-white/45 transition-colors">Education, Training &amp; Outreach</Link>
                <Link to="/community-development#ai-innovation" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-stone-900 hover:bg-white/45 transition-colors">AI &amp; Agricultural Innovation</Link>
                <Link to="/community-development#partnerships" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-stone-900 hover:bg-white/45 transition-colors">Business Partnerships &amp; Sponsorships</Link>
              </div>
              
              {/* Mobile Auth */}
              <div className="border-t pt-4 mt-2">
                {user ? (
                  <>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="font-medium py-2 block text-primary">
                        Admin Dashboard
                      </Link>
                    )}
                    <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="font-medium py-2 text-destructive">
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" asChild>
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                    </Button>
                    <Button className="flex-1" asChild>
                      <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
                    </Button>
                  </div>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
