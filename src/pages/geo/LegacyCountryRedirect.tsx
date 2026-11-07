import { Navigate, useLocation, useParams } from 'react-router-dom';
import { isReservedTopLevelSlug } from '@/lib/reserved-slugs';
import { useCountry } from '@/hooks/use-geo-pages';
import NotFound from '@/pages/NotFound';

/**
 * Catches legacy URLs of the form /:country, /:country/:region, /:country/:region/:page
 * and forwards them to the new canonical /country/... structure with `replace`
 * (so back-button doesn't loop). Anything that isn't a real country falls
 * through to NotFound.
 */
export default function LegacyCountryRedirect() {
  const params = useParams();
  const location = useLocation();
  const first = params.country;

  if (!first || isReservedTopLevelSlug(first)) return <NotFound />;

  const { data: country, isLoading } = useCountry(first);
  if (isLoading) return null;
  if (!country) return <NotFound />;

  // Preserve any deeper path segments (region, page) and query/hash.
  const target = `/country${location.pathname}${location.search}${location.hash}`;
  return <Navigate to={target} replace />;
}
