import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { appClient } from "@/integrations/manus/client";

interface PageData {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  template: string | null;
  meta_title: string | null;
  meta_description: string | null;
  featured_image_url: string | null;
}

export default function PageDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading, error } = useQuery({
    queryKey: ['page', slug],
    queryFn: async () => {
      const { data, error } = await appClient
        .from('pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      return data as PageData;
    },
    enabled: !!slug,
  });

  // Update document title and meta
  if (page) {
    document.title = page.meta_title || page.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && page.meta_description) {
      metaDesc.setAttribute('content', page.meta_description);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The page you're looking for doesn't exist or has been unpublished.
          </p>
          <Button asChild>
            <Link to="/">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Template-based rendering
  const renderContent = () => {
    switch (page.template) {
      case 'landing':
        return (
          <div className="min-h-screen">
            {/* Hero with featured image */}
            {page.featured_image_url && (
              <div className="relative h-64 md:h-96">
                <img
                  src={page.featured_image_url}
                  alt={page.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h1 className="text-4xl md:text-5xl font-display font-bold text-white drop-shadow-lg">
                    {page.title}
                  </h1>
                </div>
              </div>
            )}
            <div className="container mx-auto px-4 py-12">
              {!page.featured_image_url && (
                <h1 className="text-4xl md:text-5xl font-display font-bold mb-8 text-center">
                  {page.title}
                </h1>
              )}
              <div 
                className="prose prose-lg dark:prose-invert max-w-4xl mx-auto"
                dangerouslySetInnerHTML={{ __html: page.content || '' }}
              />
            </div>
          </div>
        );

      case 'full-width':
        return (
          <div className="min-h-screen pt-24">
            {page.featured_image_url && (
              <div className="w-full h-48 md:h-64 mb-8">
                <img
                  src={page.featured_image_url}
                  alt={page.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="container mx-auto px-4 py-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-8">{page.title}</h1>
              <div 
                className="prose prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: page.content || '' }}
              />
            </div>
          </div>
        );

      case 'sidebar':
        return (
          <div className="min-h-screen pt-24">
            <div className="container mx-auto px-4 py-8">
              <div className="grid lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3">
                  {page.featured_image_url && (
                    <img
                      src={page.featured_image_url}
                      alt={page.title}
                      className="w-full h-48 md:h-64 object-cover rounded-lg mb-8"
                    />
                  )}
                  <h1 className="text-3xl md:text-4xl font-bold mb-6">{page.title}</h1>
                  <div 
                    className="prose prose-lg dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: page.content || '' }}
                  />
                </div>
                <aside className="space-y-6">
                  <div className="glass-card p-6 rounded-lg">
                    <h3 className="font-bold mb-4">Need Help?</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Contact our team for assistance with dragon fruit farming.
                    </p>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/contact">Contact Us</Link>
                    </Button>
                  </div>
                  <div className="glass-card p-6 rounded-lg">
                    <h3 className="font-bold mb-4">Quick Links</h3>
                    <ul className="space-y-2 text-sm">
                      <li><Link to="/products" className="text-primary hover:underline">Shop Products</Link></li>
                      <li><Link to="/consultations" className="text-primary hover:underline">Consultations</Link></li>
                      <li><Link to="/blog" className="text-primary hover:underline">Blog</Link></li>
                      <li><Link to="/directory" className="text-primary hover:underline">Business Directory</Link></li>
                    </ul>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        );

      default: // 'default' template
        return (
          <div className="min-h-screen pt-24">
            <div className="container mx-auto px-4 py-8">
              <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto"
              >
                {page.featured_image_url && (
                  <img
                    src={page.featured_image_url}
                    alt={page.title}
                    className="w-full h-48 md:h-64 object-cover rounded-lg mb-8"
                  />
                )}
                <h1 className="text-3xl md:text-4xl font-bold mb-6">{page.title}</h1>
                <div 
                  className="prose prose-lg dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: page.content || '' }}
                />
              </motion.article>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {renderContent()}
      {/* Footer */}
      <footer className="py-8 bg-muted/50 mt-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2026 Wonderful Dragon Fruit South Africa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
