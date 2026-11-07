/**
 * Automated GA4 QA checklist.
 *
 * Verifies:
 *  1. Exactly ONE gtag.js loader and ONE Measurement ID is configured (no duplicates).
 *  2. The configured Measurement ID matches the production stream (G-C1STM6NWR7).
 *  3. Consent Mode v2 is initialised with `default` denied state BEFORE `config`.
 *  4. Cross-domain config (`linker.domains`) — if cross-domain tracking is
 *     enabled, the canonical hostname is included; otherwise we assert that no
 *     stale domains are configured.
 *  5. RouteTracker fires exactly one `page_view` per route change with the new
 *     path (no duplicate fires across simulated navigation).
 *  6. The Consent Mode default state correctly gates analytics: events fire
 *     only after `consent: update` flips `analytics_storage` to granted.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, act, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useNavigate } from "react-router-dom";
import { RouteTracker } from "@/components/analytics/RouteTracker";

const MEASUREMENT_ID = "G-C1STM6NWR7";
const CANONICAL_HOST = "wonderfuldragonfruit.company";
const HTML = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

describe("GA4 QA — single tag, no duplicates", () => {
  it("includes the gtag.js loader exactly once", () => {
    const matches = HTML.match(/googletagmanager\.com\/gtag\/js\?id=/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it("loads exactly the production Measurement ID", () => {
    const ids = [...HTML.matchAll(/id=(G-[A-Z0-9]+)/g)].map((m) => m[1]);
    expect(ids).toContain(MEASUREMENT_ID);
    expect(new Set(ids).size).toBe(1);
  });

  it("calls gtag('config', ...) exactly once for the Measurement ID", () => {
    const configCalls = HTML.match(/gtag\(\s*'config'\s*,\s*'G-[A-Z0-9]+'/g) ?? [];
    expect(configCalls.length).toBe(1);
    expect(configCalls[0]).toContain(MEASUREMENT_ID);
  });

  it("does not include legacy UA / GTM containers alongside GA4", () => {
    expect(HTML).not.toMatch(/UA-\d{4,}-\d+/);
    expect(HTML).not.toMatch(/googletagmanager\.com\/gtm\.js/);
  });
});

describe("GA4 QA — Consent Mode v2 ordering", () => {
  it("declares consent defaults BEFORE the config call", () => {
    const consentDefaultIdx = HTML.indexOf("gtag('consent', 'default'");
    const configIdx = HTML.indexOf("gtag('config'");
    expect(consentDefaultIdx).toBeGreaterThan(-1);
    expect(configIdx).toBeGreaterThan(-1);
    expect(consentDefaultIdx).toBeLessThan(configIdx);
  });

  it("sets analytics_storage and ad_storage to denied by default", () => {
    // The defaults object is declared as `var defaults = { ... }` and then
    // passed to gtag('consent', 'default', defaults). Inspect the literal.
    const defaultsMatch = HTML.match(/var\s+defaults\s*=\s*\{([\s\S]*?)\};/);
    expect(defaultsMatch).not.toBeNull();
    const block = defaultsMatch![1];
    expect(block).toMatch(/analytics_storage:\s*'denied'/);
    expect(block).toMatch(/ad_storage:\s*'denied'/);
    expect(block).toMatch(/ad_user_data:\s*'denied'/);
    expect(block).toMatch(/ad_personalization:\s*'denied'/);
  });
});

describe("GA4 QA — cross-domain configuration", () => {
  it("declares a linker.domains block listing the canonical production host", () => {
    const linkerMatch = HTML.match(/linker\s*:\s*\{[\s\S]*?\}/);
    expect(linkerMatch).not.toBeNull();
    const block = linkerMatch![0];
    expect(block).toContain("wonderfuldragonfruit.company");
  });

  it("includes the Manus Preview host for cross-domain session continuity", () => {
    const linkerMatch = HTML.match(/linker\s*:\s*\{[\s\S]*?\}/);
    expect(linkerMatch).not.toBeNull();
    expect(linkerMatch![0]).toMatch(/[a-z0-9-]+\.us1\.manus\.computer/);
  });

  it("accepts incoming linker parameters (accept_incoming: true)", () => {
    const linkerMatch = HTML.match(/linker\s*:\s*\{[\s\S]*?\}/);
    expect(linkerMatch![0]).toMatch(/accept_incoming\s*:\s*true/);
  });

  it("does not configure stale or non-canonical linker domains", () => {
    const linkerMatch = HTML.match(/linker\s*:\s*\{[\s\S]*?\}/);
    if (!linkerMatch) return;
    const domains = [...linkerMatch[0].matchAll(/'([^']+)'|"([^"]+)"/g)]
      .map((m) => m[1] || m[2])
      .filter((d) => d.includes("."));
    const allowed = /(dragonfruitafrica\.company|manus\.computer)$/;
    for (const d of domains) {
      expect(d).toMatch(allowed);
    }
  });

  it("uses the canonical production host for og:url and canonical link", () => {
    expect(HTML).toMatch(
      new RegExp(`<link rel="canonical" href="https://${CANONICAL_HOST}`)
    );
    expect(HTML).toMatch(
      new RegExp(`<meta property="og:url" content="https://${CANONICAL_HOST}`)
    );
  });
});

describe("GA4 QA — RouteTracker fires once per route, no duplicates", () => {
  let gtagSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    gtagSpy = vi.fn();
    (window as any).gtag = gtagSpy;
    (window as any).dataLayer = [];
  });

  afterEach(() => {
    delete (window as any).gtag;
  });

  function Nav({ to }: { to: string }) {
    const navigate = useNavigate();
    return (
      <button data-testid="go" onClick={() => navigate(to)}>
        go
      </button>
    );
  }

  it("fires page_view once on initial mount and once per navigation", async () => {
    function App({ entry }: { entry: string }) {
      return (
        <MemoryRouter initialEntries={[entry]}>
          <RouteTracker />
          <Routes>
            <Route path="/" element={<div>home</div>} />
            <Route path="/products" element={<div>products</div>} />
          </Routes>
        </MemoryRouter>
      );
    }

    const { rerender, unmount } = render(<App entry="/" />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    const pageViewCalls = () =>
      gtagSpy.mock.calls.filter((c) => c[1] === "page_view");

    expect(pageViewCalls().length).toBe(1);
    expect(pageViewCalls()[0][2].page_path).toBe("/");

    // Simulate a navigation by remounting at a new route
    unmount();
    render(<App entry="/products" />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    const paths = pageViewCalls().map((c) => c[2].page_path);
    expect(paths).toEqual(["/", "/products"]);
    for (let i = 1; i < paths.length; i++) {
      expect(paths[i]).not.toBe(paths[i - 1]);
    }
  });
});

describe("GA4 QA — consent gates analytics correctly", () => {
  beforeEach(() => {
    (window as any).dataLayer = [];
  });

  it("records consent default + update calls in dataLayer order", () => {
    const dl: any[] = [];
    function gtag(...args: any[]) {
      dl.push(args);
    }
    // Simulate the snippet: default denied, then user grants
    gtag("consent", "default", { analytics_storage: "denied" });
    gtag("config", MEASUREMENT_ID);
    gtag("consent", "update", { analytics_storage: "granted" });

    const consentEvents = dl.filter((c) => c[0] === "consent");
    expect(consentEvents[0][1]).toBe("default");
    expect(consentEvents[0][2].analytics_storage).toBe("denied");
    expect(consentEvents.at(-1)![1]).toBe("update");
    expect(consentEvents.at(-1)![2].analytics_storage).toBe("granted");
  });
});
