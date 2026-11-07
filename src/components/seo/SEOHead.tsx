import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  author?: string;
  publishedAt?: string;
  tags?: string[];
  /** When true, emits <meta name="robots" content="noindex,follow"> for thin/transient pages. */
  noIndex?: boolean;
}

export function SEOHead({ 
  title, 
  description, 
  keywords, 
  image = '/og-image.png', 
  url,
  type = 'website',
  author,
  publishedAt,
  tags,
  noIndex = false,
}: SEOHeadProps) {
  useEffect(() => {
    // Always anchor public-facing SEO surfaces (canonical, OG, Twitter, JSON-LD)
    // to the canonical production hostname so search engines and social
    // crawlers index the correct URL — never a preview host.
    const PROD_HOST = 'https://wonderfuldragonfruit.company';
    const baseUrl = PROD_HOST;
    const path = url ?? (window.location.pathname + window.location.search);
    const fullUrl = `${baseUrl}${path}`;
    const fullImage = image?.startsWith('http') ? image : `${baseUrl}${image}`;

    document.title = title;

    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('description', description);
    if (keywords) setMeta('keywords', keywords);
    if (author) setMeta('author', author);
    setMeta('robots', noIndex ? 'noindex,follow' : 'index,follow');

    // Open Graph
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:image', fullImage, true);
    setMeta('og:url', fullUrl, true);
    setMeta('og:type', type, true);
    setMeta('og:site_name', 'Wonderful Dragon Fruit South Africa', true);

    // Twitter
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', fullImage);

    // Canonical — always production hostname so preview/staging never split SEO signals.
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = fullUrl;

    // Article-specific meta
    if (type === 'article') {
      if (publishedAt) setMeta('article:published_time', publishedAt, true);
      if (author) setMeta('article:author', author, true);
      tags?.forEach((tag, i) => {
        setMeta(`article:tag:${i}`, tag, true);
      });
    }

    // JSON-LD Structured Data
    let ldScript = document.getElementById('json-ld-seo') as HTMLScriptElement;
    if (!ldScript) {
      ldScript = document.createElement('script');
      ldScript.id = 'json-ld-seo';
      ldScript.type = 'application/ld+json';
      document.head.appendChild(ldScript);
    }

    // Always anchor structured data to the canonical production domain so
    // search engines associate the schema with the indexable URL — not preview hosts.
    const canonicalBase = 'https://www.wonderfuldragonfruit.company';
    const canonicalUrl = url ? `${canonicalBase}${url}` : fullUrl;
    const canonicalImage = image?.startsWith('http') ? image : `${canonicalBase}${image}`;
    const logoUrl = `${canonicalBase}/og-image.png`;

    const publisher = {
      '@type': 'Organization',
      name: 'Wonderful Dragon Fruit South Africa',
      url: canonicalBase,
      logo: {
        '@type': 'ImageObject',
        url: logoUrl,
        width: 1200,
        height: 630,
      },
    };

    if (type === 'article') {
      ldScript.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl,
        },
        headline: title,
        description: description,
        image: [canonicalImage],
        url: canonicalUrl,
        datePublished: publishedAt,
        dateModified: publishedAt,
        author: {
          '@type': 'Person',
          name: author || 'DFSA Team',
          url: canonicalBase,
        },
        publisher,
        keywords: tags && tags.length ? tags : (keywords ? keywords.split(',').map(k => k.trim()).filter(Boolean) : undefined),
        articleSection: 'Dragon Fruit Farming',
        inLanguage: 'en',
      });
    } else {
      ldScript.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: title,
        description: description,
        url: canonicalUrl,
        inLanguage: 'en',
        publisher,
      });
    }

    return () => {
      // Cleanup JSON-LD on unmount
      ldScript?.remove();
    };
  }, [title, description, keywords, image, url, type, author, publishedAt, tags, noIndex]);

  return null;
}
