import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/analytics";

/**
 * Fires a GA4 page_view event whenever the client-side route changes.
 * Place inside <BrowserRouter> so useLocation works.
 */
export function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname + location.search;
    // Defer one tick so document.title (set by SEOHead) is up to date.
    const id = window.setTimeout(() => trackPageView(path), 0);
    return () => window.clearTimeout(id);
  }, [location.pathname, location.search]);

  return null;
}
