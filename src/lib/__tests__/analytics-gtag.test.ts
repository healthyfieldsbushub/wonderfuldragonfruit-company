/**
 * GA4 / gtag instrumentation tests.
 *
 * 1. Verifies the gtag snippet is present in `index.html` with the correct
 *    Measurement ID (G-C1STM6NWR7) and gtag.js loader.
 * 2. Verifies that our analytics helpers fire the canonical GA4 e-commerce
 *    events — `page_view`, `add_to_cart`, `begin_checkout` — with valid
 *    payloads (currency, value, items[]).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  trackPageView,
  trackAddToCart,
  trackBeginCheckout,
} from "@/lib/analytics";

const MEASUREMENT_ID = "G-C1STM6NWR7";

describe("GA4 gtag — install snippet (index.html)", () => {
  const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

  it("loads the gtag.js script with the correct Measurement ID", () => {
    expect(html).toMatch(
      new RegExp(
        `<script[^>]*src="https://www\\.googletagmanager\\.com/gtag/js\\?id=${MEASUREMENT_ID}"`
      )
    );
  });

  it("initialises dataLayer + gtag and configures the Measurement ID", () => {
    expect(html).toContain("window.dataLayer = window.dataLayer || []");
    expect(html).toMatch(/function gtag\(\)\s*\{\s*dataLayer\.push\(arguments\);\s*\}/);
    expect(html).toMatch(new RegExp(`gtag\\('config',\\s*'${MEASUREMENT_ID}'`));
  });

  it("places the gtag snippet inside <head>", () => {
    const headStart = html.indexOf("<head>");
    const headEnd = html.indexOf("</head>");
    const snippetIndex = html.indexOf("googletagmanager.com/gtag/js");
    expect(snippetIndex).toBeGreaterThan(headStart);
    expect(snippetIndex).toBeLessThan(headEnd);
  });
});

describe("GA4 events fire via window.gtag", () => {
  let gtagSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    gtagSpy = vi.fn();
    (window as any).gtag = gtagSpy;
    (window as any).dataLayer = [];
  });

  it("fires page_view with page_path + page_location", () => {
    trackPageView("/blog/pre-winter-dragon-fruit-sale-2026", "Winter Sale 2026");

    expect(gtagSpy).toHaveBeenCalledTimes(1);
    const [verb, event, params] = gtagSpy.mock.calls[0];
    expect(verb).toBe("event");
    expect(event).toBe("page_view");
    expect(params.page_path).toBe("/blog/pre-winter-dragon-fruit-sale-2026");
    expect(params.page_title).toBe("Winter Sale 2026");
    expect(typeof params.page_location).toBe("string");
    expect(params.page_location.length).toBeGreaterThan(0);
  });

  it("fires add_to_cart with currency=ZAR, computed value, and items[]", () => {
    trackAddToCart({
      id: "prod-123",
      sku: "DF-RUBY-001",
      name: "Ruby Dragon Fruit Cutting",
      price: 75,
      quantity: 2,
    });

    expect(gtagSpy).toHaveBeenCalledTimes(1);
    const [, event, params] = gtagSpy.mock.calls[0];
    expect(event).toBe("add_to_cart");
    expect(params.currency).toBe("ZAR");
    expect(params.value).toBe(150);
    expect(params.items).toHaveLength(1);
    expect(params.items[0]).toMatchObject({
      item_id: "DF-RUBY-001",
      item_name: "Ruby Dragon Fruit Cutting",
      price: 75,
      quantity: 2,
    });
  });

  it("fires begin_checkout with cart total and full items[] array", () => {
    trackBeginCheckout({
      value: 1250,
      items: [
        { id: "p1", sku: "DF-RUBY-001", name: "Ruby", price: 75, quantity: 10 },
        { id: "p2", sku: "DF-WHITE-001", name: "Sweet White", price: 50, quantity: 10 },
      ],
    });

    expect(gtagSpy).toHaveBeenCalledTimes(1);
    const [, event, params] = gtagSpy.mock.calls[0];
    expect(event).toBe("begin_checkout");
    expect(params.currency).toBe("ZAR");
    expect(params.value).toBe(1250);
    expect(params.items).toHaveLength(2);
    expect(params.items[0].item_id).toBe("DF-RUBY-001");
    expect(params.items[1].item_id).toBe("DF-WHITE-001");
  });

  it("is a no-op (and does not throw) when window.gtag is missing", () => {
    delete (window as any).gtag;
    expect(() => trackPageView("/")).not.toThrow();
    expect(() =>
      trackAddToCart({ id: "x", name: "X", price: 1, sku: "X" })
    ).not.toThrow();
    expect(() =>
      trackBeginCheckout({ value: 0, items: [] })
    ).not.toThrow();
  });
});
