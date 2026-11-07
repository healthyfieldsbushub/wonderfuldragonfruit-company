import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/integrations/manus/client";
import { motion } from "framer-motion";
import { Calendar, Clock, User, Tag, ArrowLeft, Share2 } from "lucide-react";
import { ShareButtons } from "@/components/ui/share-buttons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/Header";
import { SEOHead } from "@/components/seo/SEOHead";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

const markdownComponents = {
  h1: ({ children }: any) => (
    <h2 className="mt-10 mb-4 text-3xl md:text-4xl font-display font-bold leading-tight text-foreground scroll-mt-24">
      {children}
    </h2>
  ),
  h2: ({ children }: any) => (
    <h2 className="mt-10 mb-4 text-2xl md:text-3xl font-display font-bold leading-tight text-foreground scroll-mt-24">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="mt-8 mb-3 text-xl md:text-2xl font-display font-semibold leading-snug text-foreground">
      {children}
    </h3>
  ),
  h4: ({ children }: any) => (
    <h4 className="mt-6 mb-2 text-lg md:text-xl font-display font-semibold text-foreground">
      {children}
    </h4>
  ),
  h5: ({ children }: any) => (
    <h5 className="mt-5 mb-2 text-base md:text-lg font-semibold text-foreground">{children}</h5>
  ),
  h6: ({ children }: any) => (
    <h6 className="mt-5 mb-2 text-sm md:text-base font-semibold uppercase tracking-wide text-muted-foreground">{children}</h6>
  ),
  p: ({ children }: any) => (
    <p className="my-5 text-base md:text-lg leading-8 text-foreground">{children}</p>
  ),
  a: ({ children, href }: any) => (
    <a
      href={href}
      className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors break-words [overflow-wrap:anywhere]"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),
  strong: ({ children }: any) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }: any) => <em className="italic text-foreground">{children}</em>,
  hr: () => <hr className="my-10 border-border" />,
  code: ({ inline, children }: any) =>
    inline ? (
      <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-foreground">{children}</code>
    ) : (
      <code className="block w-full overflow-x-auto rounded-lg bg-muted p-4 text-sm font-mono text-foreground">{children}</code>
    ),
  pre: ({ children }: any) => (
    <pre className="my-6 w-full overflow-x-auto rounded-lg bg-muted p-4 text-sm">{children}</pre>
  ),
  ul: ({ children }: any) => (
    <ul className="my-6 ml-6 list-disc space-y-2 text-foreground marker:text-primary">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="my-6 ml-6 list-decimal space-y-2 text-foreground marker:text-primary marker:font-semibold">{children}</ol>
  ),
  li: ({ children }: any) => (
    <li className="pl-2 text-base md:text-lg leading-8 text-foreground">{children}</li>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="my-8 border-l-4 border-primary bg-primary/5 px-5 py-3 italic text-foreground rounded-r-lg">
      {children}
    </blockquote>
  ),
  table: ({ children }: any) => (
    <div className="my-8 w-full overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm md:text-base">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => <thead className="bg-muted">{children}</thead>,
  tbody: ({ children }: any) => <tbody>{children}</tbody>,
  tr: ({ children }: any) => <tr className="border-b border-border last:border-b-0">{children}</tr>,
  th: ({ children }: any) => (
    <th className="border-b border-border bg-muted px-4 py-3 font-semibold text-foreground">{children}</th>
  ),
  td: ({ children }: any) => (
    <td className="px-4 py-3 align-top text-foreground">{children}</td>
  ),
  img: ({ src, alt }: any) => (
    <span className="my-8 block w-full overflow-hidden rounded-xl shadow-lg bg-muted">
      <img
        src={src}
        alt={alt || "Dragon fruit farming article image"}
        className="block w-full h-auto max-h-[600px] object-contain mx-auto"
        loading="lazy"
        decoding="async"
      />
    </span>
  ),
};

export default function BlogPostDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await appClient
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      
      await appClient
        .from('blog_posts')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id);

      return data;
    },
    enabled: !!slug,
  });

  // Fetch related posts
  const { data: relatedPosts = [] } = useQuery({
    queryKey: ['related-posts', post?.category, post?.id],
    queryFn: async () => {
      const { data } = await appClient
        .from('blog_posts')
        .select('id, slug, title, excerpt, featured_image_url, category, read_time_minutes, published_at, created_at')
        .eq('is_published', true)
        .eq('category', post!.category!)
        .neq('id', post!.id)
        .limit(3);
      return data || [];
    },
    enabled: !!post?.category && !!post?.id,
  });

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = post?.title || '';
    
    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
      return;
    }

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 pt-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <Skeleton className="h-8 w-32 mb-4" />
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-8" />
            <Skeleton className="aspect-video w-full mb-8 rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 pt-24">
          <div className="container mx-auto px-4 text-center py-20">
            <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title={post.meta_title || `${post.title} | DFSA Blog`}
        description={post.meta_description || post.excerpt || ''}
        keywords={post.tags?.join(', ')}
        image={post.featured_image_url || '/og-image.png'}
        url={`/blog/${post.slug}`}
        type="article"
        author={post.author_name || 'DFSA Team'}
        publishedAt={post.published_at || post.created_at}
        tags={post.tags || []}
      />
      <Header />
      
      <main className="flex-1 pt-24">
        <div className="container mx-auto px-4 max-w-4xl mb-6">
          <Breadcrumbs items={[
            { label: 'Blog', href: '/blog' },
            { label: post.title },
          ]} className="mb-4" />
          <Button variant="ghost" size="sm" asChild>
            <Link to="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </div>

        <article className="container mx-auto px-4 max-w-4xl">
          {/* Featured Image - Full Width Above Title */}
          {post.featured_image_url && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-h-80 rounded-2xl overflow-hidden mb-8 shadow-lg"
            >
              <img
                src={post.featured_image_url}
                alt={`${post.title} – featured image, Wonderful Dragon Fruit South Africa by DFSA`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </motion.div>
          )}

          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Badge>{post.category}</Badge>
              {post.is_featured && <Badge variant="secondary">Featured</Badge>}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4 leading-tight">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-lg md:text-xl text-muted-foreground mb-6 leading-relaxed">{post.excerpt}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b pb-6">
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {post.author_name || 'DFSA Team'}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(post.published_at || post.created_at).toLocaleDateString('en-ZA', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {post.read_time_minutes} min read
              </span>
            </div>
          </motion.header>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-none mb-12 min-w-0 break-words [overflow-wrap:anywhere]"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={markdownComponents}
            >
              {post.content || ""}
            </ReactMarkdown>
          </motion.div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-8 pb-8 border-b">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {post.tags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}

          {/* Share Buttons */}
          <div className="mb-12">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Share this article
            </h3>
            <ShareButtons
              url={`/blog/${post.slug}`}
              title={post.title}
              description={post.excerpt || ''}
              label=""
            />
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="mb-12">
              <h3 className="text-2xl font-display font-bold mb-6">Related Articles</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map((related: any) => (
                  <Link key={related.id} to={`/blog/${related.slug}`} className="group">
                    <div className="rounded-xl overflow-hidden border bg-card hover:shadow-lg transition-shadow">
                      <div className="h-36 bg-muted overflow-hidden">
                        <img
                          src={related.featured_image_url || '/placeholder.svg'}
                          alt={related.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-4">
                        <Badge variant="secondary" className="text-xs mb-2">{related.category}</Badge>
                        <h4 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                          {related.title}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{related.excerpt}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center mb-12">
            <h3 className="text-2xl font-display font-bold mb-2">Join Dragon Fruit SA</h3>
            <p className="text-muted-foreground mb-4">Connect with the Dragon Fruit Association of Africa and grow your farming business.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild><Link to="/products">Shop Cultivars</Link></Button>
              <Button variant="outline" asChild><Link to="/consultations">Book Consultation</Link></Button>
            </div>
          </div>
        </article>
      </main>

      <footer className="py-8 bg-muted/50">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2026 Wonderful Dragon Fruit South Africa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
