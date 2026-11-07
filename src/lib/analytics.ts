/**
 * Thin GA4 / gtag wrapper.
 *
 * We intentionally keep this stateless and side-effect-free so it is safe to
 * call from anywhere (including SSR / tests). All calls are no-ops when
 * `window.gtag` has not been initialised by the snippet in `index.html`.
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export type GtagEvent =
  | "page_view"
  | "add_to_cart"
  | "begin_checkout"
  | "purchase"
  | "view_item";

function gtagEvent(event: GtagEvent, params: Record<string, any> = {}) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  try {
    window.gtag("event", event, params);
  } catch {
    /* never let analytics break the app */
  }
}

/** GA4 page_view — call on every client-side route change. */
export function trackPageView(path: string, title?: string) {
  gtagEvent("page_view", {
    page_path: path,
    page_location: typeof window !== "undefined" ? window.location.href : path,
    page_title: title ?? (typeof document !== "undefined" ? document.title : undefined),
  });
}

/** GA4 add_to_cart — fire when a product is added to the cart. */
export function trackAddToCart(item: {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  sku?: string;
}) {
  gtagEvent("add_to_cart", {
    currency: "ZAR",
    value: Number(item.price) * (Number(item.quantity) || 1),
    items: [
      {
        item_id: item.sku || item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity ?? 1,
      },
    ],
  });
}

/** GA4 begin_checkout — fire when checkout page is reached with a non-empty cart. */
export function trackBeginCheckout(cart: {
  value: number;
  items: Array<{ id: string; name: string; price: number; quantity: number; sku?: string }>;
}) {
  gtagEvent("begin_checkout", {
    currency: "ZAR",
    value: cart.value,
    items: cart.items.map((i) => ({
      item_id: i.sku || i.id,
      item_name: i.name,
      price: i.price,
      quantity: i.quantity,
    })),
  });
}
