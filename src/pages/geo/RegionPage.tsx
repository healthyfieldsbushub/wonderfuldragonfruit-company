import { useParams, Navigate } from 'react-router-dom';
import { isReservedTopLevelSlug } from '@/lib/reserved-slugs';
import NotFound from '@/pages/NotFound';
import RegionHub from './RegionHub';

/**
 * Region sub-pages are intentionally deferred. Redirect any
 * /country/[country]/[region]/[page] hit back to the region "Coming Soon"
 * hub so we never serve a 404 for these URLs.
 */
export default function RegionPage() {
  const { country: countrySlug, region: regionSlug } = useParams<{
    country: string; region: string; page: string;
  }>();

  if (isReservedTopLevelSlug(countrySlug)) return <NotFound />;
  if (!countrySlug || !regionSlug) return <NotFound />;

  // Render the same Coming Soon UI rather than redirect — keeps the URL
  // crawlable for noindex without flapping.
  return <RegionHub />;
}
