import { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { SEOHead } from "@/components/seo/SEOHead";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

export interface LegalSection {
  heading: string;
  body: ReactNode;
}

interface LegalPageLayoutProps {
  title: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  intro: ReactNode;
  sections: LegalSection[];
  lastUpdated?: string;
}

/**
 * Shared shell for standalone legal / policy pages: clean single-column,
 * readable typography, SEO head + breadcrumbs.
 */
export function LegalPageLayout({
  title,
  metaTitle,
  metaDescription,
  canonicalUrl,
  intro,
  sections,
  lastUpdated,
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={metaTitle} description={metaDescription} url={canonicalUrl} />
      <Header />
      <CartSidebar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <Breadcrumbs items={[{ label: title }]} className="mb-6" />

        <header className="mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
            {title}
          </h1>
          <div className="text-base md:text-lg text-muted-foreground leading-relaxed [&_p]:mb-3 last:[&_p]:mb-0">
            {intro}
          </div>
        </header>

        <div className="space-y-8">
          {sections.map(({ heading, body }) => (
            <section key={heading} className="border-t border-border pt-6">
              <h2 className="font-display text-2xl md:text-3xl font-semibold mb-3 text-foreground">
                {heading}
              </h2>
              <div className="text-foreground/90 leading-relaxed text-base md:text-[1.05rem] [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_ul]:mb-3 last:[&_p]:mb-0">
                {body}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-12 text-sm text-muted-foreground">
          Last updated:{" "}
          {lastUpdated ??
            new Date().toLocaleDateString("en-ZA", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          This page is maintained by Wonderful Dragon Fruit South Africa. It contains placeholder wording that should be
          reviewed by a qualified legal advisor before being relied upon.
        </p>
      </main>
    </div>
  );
}
