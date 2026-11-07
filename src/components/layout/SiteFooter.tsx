import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { openCookieSettings } from "@/components/consent/CookieConsentBanner";
import { FACEBOOK_PAGES, whatsappLink } from "@/config/social";

export const LEGAL_LINKS: { label: string; to: string }[] = [
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Terms of Service", to: "/terms-of-service" },
  { label: "Cookie Policy", to: "/cookie-policy" },
  { label: "Community Guidelines", to: "/community-guidelines" },
  { label: "Copyright Policy", to: "/copyright-policy" },
  { label: "Facebook Data Deletion", to: "/data-deletion" },
];

/**
 * Global site footer. Rendered once from App.tsx for every public route.
 */
export function SiteFooter() {
  const { pathname } = useLocation();
  const auth = useAuth() as { isAdmin?: boolean } | null;

  // Admin console has its own chrome.
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="bg-dragon-dark text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <h3 className="font-display text-2xl font-bold text-gradient-tropical mb-2">
              Wonderful Dragon Fruit South Africa
            </h3>
            <p className="text-sm text-white/70 mb-2">Commercial plant supply, worldwide</p>
            <p className="text-xs text-white/50">Wonderful Dragon Fruit South Africa &amp; Healthy Fields</p>
            <p className="text-xs text-white/50 mt-1">Since 2008</p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-dragon-lime">Quick Links</h4>
            <nav aria-label="Footer navigation">
              <ul className="space-y-2 text-white/70 text-sm">
                <li><Link to="/products" className="hover:text-white transition-colors">Shop Cultivars</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Farming Blog</Link></li>
                <li><Link to="/consultations" className="hover:text-white transition-colors">Book Consultation</Link></li>
                <li><Link to="/rooting-services" className="hover:text-white transition-colors">Rooting Services</Link></li>
                <li><Link to="/association" className="hover:text-white transition-colors">Join Association</Link></li>
                <li><Link to="/distributors" className="hover:text-white transition-colors">Distributors</Link></li>
                <li><Link to="/directory" className="hover:text-white transition-colors">Business Directory</Link></li>
              </ul>
            </nav>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-dragon-lime">Resources</h4>
            <nav aria-label="Resources navigation">
              <ul className="space-y-2 text-white/70 text-sm">
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/business-resources" className="hover:text-white transition-colors">Business Resources</Link></li>
                <li><Link to="/education" className="hover:text-white transition-colors">Education &amp; Training</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              </ul>
            </nav>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-dragon-lime">Legal</h4>
            <nav aria-label="Legal navigation">
              <ul className="space-y-2 text-white/70 text-sm">
                {LEGAL_LINKS.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={openCookieSettings}
                    className="hover:text-white transition-colors underline-offset-4 hover:underline"
                  >
                    Cookie Settings
                  </button>
                </li>
              </ul>
            </nav>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-dragon-lime">Contact</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              <li><a href="mailto:admin@proagrisa.co.za" className="hover:text-white transition-colors">admin@proagrisa.co.za</a></li>
              <li><a href="mailto:orders@proagrisa.co.za" className="hover:text-white transition-colors">orders@proagrisa.co.za</a></li>
              <li><a href="tel:+27834474639" className="hover:text-white transition-colors">+27 83 447 4639</a></li>
              <li><a href="tel:+13517772848" className="hover:text-white transition-colors">+1 351 777 2848</a></li>
            </ul>
          </div>
        </div>

        {/* Follow us across our Facebook network + WhatsApp contact */}
        <div className="border-t border-white/20 mt-8 pt-8">
          <h4 className="font-semibold mb-4 text-dragon-lime">Follow Us on Facebook</h4>
          <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {FACEBOOK_PAGES.map((page) => (
              <a
                key={page.url}
                href={page.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 text-sm hover:text-white transition-colors flex items-center gap-2 min-w-0"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0 text-[#1877F2]" fill="currentColor" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="truncate">
                  {page.name}
                  {page.username && <span className="ml-1 text-white/40 text-xs">{page.username}</span>}
                </span>
              </a>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href={whatsappLink("Hi Wonderful Dragon Fruit SA, I'd like to know more about your products and catalogues.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.347-.347.52-.52.174-.174.232-.298.347-.497.115-.199.057-.372-.058-.52-.115-.149-.585-1.407-1.03-1.927-.446-.52-.896-.447-1.242-.447-.347 0-.72-.05-1.072-.05-.347 0-.918.125-1.393.621-.476.497-1.814 1.762-1.814 4.244 0 2.482 1.858 4.883 2.118 5.222.26.34 3.644 5.56 8.832 7.798.298.115 2.595.9 3.032.665.437-.248 1.396-1.653 1.6-2.844.199-.982.199-1.894.1-2.044-.1-.148-.248-.297-.545-.446z" />
                <path d="M12.05 2C6.438 2 1.867 6.571 1.867 12.183c0 1.813.473 3.58 1.372 5.137L2 22l4.829-1.197c1.493.815 3.179 1.246 4.912 1.246h.004c5.611 0 10.183-4.571 10.183-10.183C21.928 6.571 17.661 2 12.05 2z" />
              </svg>
              Chat on WhatsApp
            </a>
            <span className="text-white/40 text-xs">Share products &amp; catalogues to Facebook or WhatsApp from any product page.</span>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-white/50 text-sm">
          <span>© {new Date().getFullYear()} Wonderful Dragon Fruit South Africa. Since 2008. All rights reserved.</span>
          <Link to="/admin" className="text-dragon-pink hover:text-white transition-colors text-xs">
            {auth?.isAdmin ? "Admin Dashboard" : "Admin Login"}
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
