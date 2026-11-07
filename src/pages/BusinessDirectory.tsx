import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { appClient } from '@/integrations/manus/client';
import { motion } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Filter,
  Building2,
  Leaf,
  Truck,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Header } from '@/components/layout/Header';
import { Skeleton } from '@/components/ui/skeleton';
import { SEOHead } from '@/components/seo/SEOHead';

const categoryIcons: Record<string, any> = {
  farm: Leaf,
  supplier: Truck,
  corporation: Building2,
  consultant: Users,
};

export default function BusinessDirectory() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');

  const { data: countries } = useQuery({
    queryKey: ['african-countries'],
    queryFn: async () => {
      const { data, error } = await appClient
        .from('african_countries')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: listings, isLoading } = useQuery({
    queryKey: ['business-listings', search, selectedCategory, selectedCountry],
    queryFn: async () => {
      let query = appClient
        .from('business_listings')
        .select(`
          *,
          african_countries (name, flag_emoji),
          provinces (name),
          cities (name)
        `)
        .eq('is_active', true)
        .eq('subscription_status', 'active')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`business_name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (selectedCountry !== 'all') {
        query = query.eq('country_id', selectedCountry);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Dragon Fruit Business Directory Africa | Find Growers & Suppliers"
        description="Discover dragon fruit growers, suppliers, and businesses across Africa. Connect with verified farmers in South Africa, Botswana, Zambia, Zimbabwe & more."
        keywords="dragon fruit directory, dragon fruit growers Africa, dragon fruit suppliers, business directory"
        url="/directory"
      />
      <Header />

      {/* Hero */}
      <section className="relative py-20 pt-32 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <Badge className="mb-4">African Agriculture</Badge>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Business Directory
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Connect with dragon fruit farms, suppliers, and agricultural businesses across Africa
            </p>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search businesses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-4 items-center">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="farm">Farms</SelectItem>
                <SelectItem value="supplier">Suppliers</SelectItem>
                <SelectItem value="corporation">Corporations</SelectItem>
                <SelectItem value="consultant">Consultants</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {countries?.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.flag_emoji} {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="ml-auto">
              <Button asChild>
                <Link to="/directory/register">List Your Business</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Listings */}
      <section className="py-12 flex-1">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <Skeleton className="aspect-video" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : listings?.length === 0 ? (
            <div className="text-center py-20">
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">No Businesses Found</h2>
              <p className="text-muted-foreground mb-6">
                Be the first to list your business in our directory!
              </p>
              <Button asChild>
                <Link to="/directory/register">Register Your Business</Link>
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings?.map((listing: any, index) => {
                const CategoryIcon = categoryIcons[listing.category] || Building2;
                return (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow group overflow-hidden">
                      {listing.cover_image_url ? (
                        <div className="aspect-video overflow-hidden">
                          <img
                            src={listing.cover_image_url}
                            alt={listing.business_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-muted flex items-center justify-center">
                          <CategoryIcon className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">
                              <Link to={`/directory/${listing.slug}`}>
                                {listing.business_name}
                              </Link>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {listing.cities?.name && `${listing.cities.name}, `}
                              {listing.african_countries?.name}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className="shrink-0">
                            {listing.category}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {listing.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                            {listing.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {listing.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {listing.phone}
                            </span>
                          )}
                          {listing.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {listing.email}
                            </span>
                          )}
                          {listing.website && (
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              Website
                            </span>
                          )}
                        </div>
                        {listing.is_featured && (
                          <Badge className="mt-3 bg-yellow-500/20 text-yellow-700">
                            Featured
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">List Your Business</h2>
          <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
            Join our growing network of African agricultural businesses. Get visibility across the continent for only R200/month.
          </p>
          <Button variant="secondary" size="lg" asChild>
            <Link to="/directory/register">Get Started</Link>
          </Button>
        </div>
      </section>

      <footer className="py-8 bg-muted/50">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2026 Wonderful Dragon Fruit South Africa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
