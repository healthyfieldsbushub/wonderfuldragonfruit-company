/**
 * Automated SEO audit for the Winter Sale 2026 blog post.
 *
 * Renders <SEOHead /> with the exact props that BlogPostDetail.tsx passes
 * for slug `pre-winter-dragon-fruit-sale-2026`, then verifies every SEO
 * surface (title, description, canonical, OpenGraph, Twitter cards,
 * JSON-LD Article schema) is present and non-empty on the rendered page.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { SEOHead } from "../SEOHead";

const CANONICAL_BASE = "https://www.wonderfuldragonfruit.company";
const SLUG = "pre-winter-dragon-fruit-sale-2026";
const URL_PATH = `/blog/${SLUG}`;

// Snapshot of the live blog_posts row used to drive the audit.
const POST = {
  title: "Winter Dragon Fruit Sale 2026: Build Your Farming Empire (30 April – 31 July)",
  meta_title:
    "Winter Dragon Fruit Sale 2026 | 600 & 1000 Plant Farm Packages | DFSA",
  meta_description:
    "Winter Sale 30 April – 31 July 2026. Buy 600 or 1000 premium dragon fruit plants with full farm setup, training & export compliance. Order: orders@proagrisa.co.za | +27 83 447 4639.",
  featured_image_url: "/blog/winter-sale-2026.png",
  author_name: "Max van Heerden — Proagrisa Africa / DFSA",
  published_at: "2026-04-29T22:00:00+00:00",
  tags: [
    "winter sale 2026",
    "dragon fruit plants for sale",
    "commercial dragon fruit farming",
    "pitaya farming Africa",
    "600 plant package",
    "1000 plant package",
    "DFSA",
    "Max van Heerden",
    "Wonderful Dragon Fruit South Africa",
    "export compliance",
    "farm starter package",
  ],
};

const meta = (name: string, isProperty = false) =>
  document.head.querySelector(
    `meta[${isProperty ? "property" : "name"}="${name}"]`
  );

const metaContent = (name: string, isProperty = false) =>
  meta(name, isProperty)?.getAttribute("content") ?? "";

const expectNonEmpty = (label: string, value: string) => {
  expect(value, `${label} should be present and non-empty`).toBeTruthy();
  expect(value.trim().length, `${label} should not be whitespace`).toBeGreaterThan(0);
};

describe("SEO audit — Winter Sale 2026 blog post", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.title = "";
    Object.defineProperty(window, "location", {
      writable: true,
      value: new URL(`${CANONICAL_BASE}${URL_PATH}`),
    });

    render(
      <SEOHead
        title={POST.meta_title}
        description={POST.meta_description}
        keywords={POST.tags.join(", ")}
        image={POST.featured_image_url}
        url={URL_PATH}
        type="article"
        author={POST.author_name}
        publishedAt={POST.published_at}
        tags={POST.tags}
      />
    );
  });

  afterEach(() => {
    cleanup();
    document.head.innerHTML = "";
  });

  it("sets a non-empty document title", () => {
    expectNonEmpty("document.title", document.title);
    expect(document.title).toBe(POST.meta_title);
  });

  it("renders meta description and keywords", () => {
    expectNonEmpty("meta description", metaContent("description"));
    expect(metaContent("description")).toBe(POST.meta_description);
    expectNonEmpty("meta keywords", metaContent("keywords"));
  });

  it("renders robots=index,follow", () => {
    expect(metaContent("robots")).toBe("index,follow");
  });

  it("renders a canonical link matching the production URL", () => {
    const canonical = document.head.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement | null;
    expect(canonical).not.toBeNull();
    expect(canonical!.href).toBe(`${CANONICAL_BASE}${URL_PATH}`);
  });

  it("renders complete OpenGraph tags", () => {
    expectNonEmpty("og:title", metaContent("og:title", true));
    expectNonEmpty("og:description", metaContent("og:description", true));
    expectNonEmpty("og:image", metaContent("og:image", true));
    expect(metaContent("og:image", true)).toContain(POST.featured_image_url);
    expect(metaContent("og:url", true)).toBe(`${CANONICAL_BASE}${URL_PATH}`);
    expect(metaContent("og:type", true)).toBe("article");
    expectNonEmpty("og:site_name", metaContent("og:site_name", true));
  });

  it("renders article-specific OpenGraph tags", () => {
    expect(metaContent("article:published_time", true)).toBe(POST.published_at);
    expectNonEmpty("article:author", metaContent("article:author", true));
    // At least one article:tag should be emitted
    const articleTag0 = document.head.querySelector('meta[property="article:tag:0"]');
    expect(articleTag0).not.toBeNull();
    expect(articleTag0!.getAttribute("content")).toBe(POST.tags[0]);
  });

  it("renders complete Twitter Card tags", () => {
    expect(metaContent("twitter:card")).toBe("summary_large_image");
    expectNonEmpty("twitter:title", metaContent("twitter:title"));
    expectNonEmpty("twitter:description", metaContent("twitter:description"));
    expectNonEmpty("twitter:image", metaContent("twitter:image"));
  });

  it("renders a valid JSON-LD Article schema with all required fields", () => {
    const ld = document.getElementById("json-ld-seo") as HTMLScriptElement | null;
    expect(ld, "JSON-LD <script> tag must exist").not.toBeNull();
    expect(ld!.type).toBe("application/ld+json");
    expectNonEmpty("JSON-LD body", ld!.textContent ?? "");

    const schema = JSON.parse(ld!.textContent ?? "{}");
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("Article");
    expect(schema.headline).toBe(POST.meta_title);
    expect(schema.description).toBe(POST.meta_description);
    expect(schema.url).toBe(`${CANONICAL_BASE}${URL_PATH}`);
    expect(schema.datePublished).toBe(POST.published_at);
    expect(schema.dateModified).toBeTruthy();

    // image must be a non-empty array of absolute URLs
    expect(Array.isArray(schema.image)).toBe(true);
    expect(schema.image.length).toBeGreaterThan(0);
    expect(schema.image[0]).toMatch(/^https?:\/\//);

    // author + publisher
    expect(schema.author?.name).toBe(POST.author_name);
    expect(schema.publisher?.name).toBeTruthy();
    expect(schema.publisher?.logo?.url).toMatch(/^https?:\/\//);

    // mainEntityOfPage canonical anchor
    expect(schema.mainEntityOfPage?.["@id"]).toBe(`${CANONICAL_BASE}${URL_PATH}`);

    // keywords carries the full tag array
    expect(Array.isArray(schema.keywords)).toBe(true);
    expect(schema.keywords).toEqual(POST.tags);
  });
});
