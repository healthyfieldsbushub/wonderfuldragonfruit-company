import { useParams } from 'react-router-dom';
import Association from '@/pages/Association';
import { useCountry } from '@/hooks/use-geo-pages';
import NotFound from '@/pages/NotFound';

/**
 * Per-country Association page. Identical content to /association, since DFSA
 * is a single Africa-wide association. Master canonical handled by Association.
 */
export default function CountryAssociation() {
  const { country: countrySlug } = useParams<{ country: string }>();
  const { data: country, isLoading } = useCountry(countrySlug);
  if (!isLoading && !country) return <NotFound />;
  return <Association />;
}
