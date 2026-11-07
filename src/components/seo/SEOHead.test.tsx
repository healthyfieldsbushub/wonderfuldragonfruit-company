import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { SEOHead } from "./SEOHead";

const CANONICAL_BASE = "https://wonderfuldragonfruit.company";

const setHostname = (hostname: string) => {
  // jsdom allows reassigning window.location via Object.defineProperty
  Object.defineProperty(window, "location", {
    writable: true,
    value: new URL(`https://${hostname}/blog/pre-winter-dragon-fruit-sale-2026`),
  });
};

const getMeta = (name: string, isProperty = false) => {
  const attr = isProperty ? "property" : "name";
  return document.head.querySelector(`meta[${attr}="${name}"]`);
};

describe("SEOHead — robots & canonical", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.title = "";
    setHostname("wonderfuldragonfruit.company");
  });

  afterEach(() => {
    cleanup();
    document.head.innerHTML = "";
  });

  it("emits robots=index,follow by default", () => {
    render(
      <SEOHead
        title="Winter Dragon Fruit Sale 2026"
        description="DFSA winter planting window."
        url="/blog/pre-winter-dragon-fruit-sale-2026"
        type="article"
      />
    );

    const robots = getMeta("robots");
    expect(robots).not.toBeNull();
    expect(robots!.getAttribute("content")).toBe("index,follow");
  });

  it("emits robots=noindex,follow when noIndex is true", () => {
    render(
      <SEOHead
        title="Thin page"
        description="Transient."
        url="/temp"
        noIndex
      />
    );

    expect(getMeta("robots")!.getAttribute("content")).toBe("noindex,follow");
  });

  it("renders a canonical tag that exactly matches the server-canonical URL", () => {
    const path = "/blog/pre-winter-dragon-fruit-sale-2026";
    render(
      <SEOHead
        title="Winter Dragon Fruit Sale 2026"
        description="DFSA winter planting window."
        url={path}
        type="article"
      />
    );

    const canonical = document.head.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement | null;

    expect(canonical).not.toBeNull();
    expect(canonical!.href).toBe(`${CANONICAL_BASE}${path}`);
  });

  it("always anchors canonical to the production hostname, even on preview hosts", () => {
    setHostname("a-preview-host.manus.space");
    const path = "/blog/pre-winter-dragon-fruit-sale-2026";
    render(
      <SEOHead
        title="Home"
        description="Landing page."
        url={path}
      />
    );

    const canonical = document.head.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement;

    // Canonical must NEVER reflect the preview hostname.
    expect(canonical.href).toBe(`${CANONICAL_BASE}${path}`);
    expect(canonical.href).not.toContain("manus.space");
  });
});
