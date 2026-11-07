import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  ChevronLeft,
  Star,
  CheckCircle,
  ExternalLink,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Building,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/Header";
import { appClient } from "@/integrations/manus/client";

interface ManagementMember {
  name: string;
  role: string;
  image_url?: string;
}

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
}

interface BusinessListing {
  id: string;
  slug: string;
  business_name: string;
  description: string | null;
  category: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  gallery_images: (string | { url: string })[];
  management_team: ManagementMember[];
  social_links: SocialLinks;
  operating_hours: { [key: string]: string };
  services: string[] | null;
  is_verified: boolean | null;
  is_featured: boolean | null;
  view_count: number | null;
  country: { name: string; flag_emoji: string | null } | null;
  province: { name: string } | null;
  city: { name: string } | null;
}

export default function BusinessDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: business, isLoading, error } = useQuery({
    queryKey: ['business-listing', slug],
    queryFn: async () => {
      const { data, error } = await appClient
        .from('business_listings')
        .select(`
          *,
          country:african_countries(name, flag_emoji),
          province:provinces(name),
          city:cities(name)
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .eq('subscription_status', 'active')
        .single();

      if (error) throw error;

      // Increment view count
      await appClient
        .from('business_listings')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id);

      // Parse JSONB fields safely
      return {
        ...data,
        gallery_images: Array.isArray(data.gallery_images) ? data.gallery_images as (string | { url: string })[] : [],
        management_team: Array.isArray(data.management_team) ? data.management_team as unknown as ManagementMember[] : [],
        social_links: typeof data.social_links === 'object' && data.social_links ? data.social_links as unknown as SocialLinks : {},
        operating_hours: typeof data.operating_hours === 'object' && data.operating_hours ? data.operating_hours as Record<string, string> : {},
      } as BusinessListing;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-10 w-1/2 mb-4" />
          <Skeleton className="h-24 w-full mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Business Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The business listing you're looking for doesn't exist or is no longer active.
          </p>
          <Button asChild>
            <Link to="/directory">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Directory
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const locationParts = [
    business.city?.name,
    business.province?.name,
    business.country?.name,
  ].filter(Boolean);

  const socialIcons: { [key: string]: any } = {
    facebook: Facebook,
    instagram: Instagram,
    twitter: Twitter,
    linkedin: Linkedin,
  };

  // Normalize gallery images
  const galleryUrls = business.gallery_images.map((img: any) => 
    typeof img === 'string' ? img : img?.url
  ).filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Cover Image */}
      <div className="relative h-64 md:h-80 bg-muted mt-16">
        {business.cover_image_url ? (
          <img
            src={business.cover_image_url}
            alt={business.business_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-10">
        {/* Back Button */}
        <Button variant="outline" size="sm" className="mb-4 bg-background" asChild>
          <Link to="/directory">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Directory
          </Link>
        </Button>

        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Logo */}
                <div className="flex-shrink-0">
                  {business.logo_url ? (
                    <img
                      src={business.logo_url}
                      alt={`${business.business_name} logo`}
                      className="w-24 h-24 md:w-32 md:h-32 object-contain rounded-lg border"
                    />
                  ) : (
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-muted rounded-lg flex items-center justify-center">
                      <Building className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold">{business.business_name}</h1>
                    {business.is_verified && (
                      <Badge className="gap-1 bg-primary">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                    {business.is_featured && (
                      <Badge className="gap-1 bg-secondary text-secondary-foreground">
                        <Star className="h-3 w-3" />
                        Featured
                      </Badge>
                    )}
                  </div>

                  <Badge variant="secondary" className="mb-3">{business.category}</Badge>

                  {locationParts.length > 0 && (
                    <p className="text-muted-foreground flex items-center gap-2 mb-3">
                      <MapPin className="h-4 w-4" />
                      {business.country?.flag_emoji} {locationParts.join(', ')}
                    </p>
                  )}

                  {/* Contact Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {business.phone && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`tel:${business.phone}`}>
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </a>
                      </Button>
                    )}
                    {business.email && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`mailto:${business.email}`}>
                          <Mail className="h-4 w-4 mr-2" />
                          Email
                        </a>
                      </Button>
                    )}
                    {business.website && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={business.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4 mr-2" />
                          Website
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Social Links */}
                {Object.keys(business.social_links).length > 0 && (
                  <div className="flex gap-2">
                    {Object.entries(business.social_links).map(([platform, url]) => {
                      if (!url) return null;
                      const Icon = socialIcons[platform] || Globe;
                      return (
                        <Button key={platform} variant="ghost" size="icon" asChild>
                          <a href={url as string} target="_blank" rel="noopener noreferrer">
                            <Icon className="h-5 w-5" />
                          </a>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 pb-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {business.description && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{business.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Services */}
            {business.services && business.services.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {business.services.map((service, idx) => (
                        <Badge key={idx} variant="secondary">{service}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Photo Gallery */}
            {galleryUrls.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Photo Gallery</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {galleryUrls.map((url: string, idx: number) => (
                        <div key={idx} className="aspect-square rounded-lg overflow-hidden">
                          <img
                            src={url}
                            alt={`${business.business_name} gallery ${idx + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Management Team */}
            {business.management_team.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Management Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {business.management_team.map((member: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          {member.image_url ? (
                            <img
                              src={member.image_url}
                              alt={member.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-lg font-bold text-primary">
                                {member.name?.charAt(0) || '?'}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {business.address && (
                    <div className="flex gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">{business.address}</span>
                    </div>
                  )}
                  {business.phone && (
                    <div className="flex gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <a href={`tel:${business.phone}`} className="text-sm hover:text-primary">
                        {business.phone}
                      </a>
                    </div>
                  )}
                  {business.email && (
                    <div className="flex gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <a href={`mailto:${business.email}`} className="text-sm hover:text-primary break-all">
                        {business.email}
                      </a>
                    </div>
                  )}
                  {business.website && (
                    <div className="flex gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <a 
                        href={business.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm hover:text-primary break-all"
                      >
                        {business.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Operating Hours */}
            {Object.keys(business.operating_hours).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Operating Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(business.operating_hours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between text-sm">
                          <span className="capitalize">{day}</span>
                          <span className="text-muted-foreground">{hours as string}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-primary text-primary-foreground">
                <CardContent className="p-6 text-center">
                  <h3 className="font-bold text-lg mb-2">List Your Business</h3>
                  <p className="text-primary-foreground/80 text-sm mb-4">
                    Join the African Dragon Fruit Directory for R200/month
                  </p>
                  <Button variant="secondary" asChild>
                    <Link to="/directory/register">Register Now</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 bg-muted/50">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2026 Wonderful Dragon Fruit South Africa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
