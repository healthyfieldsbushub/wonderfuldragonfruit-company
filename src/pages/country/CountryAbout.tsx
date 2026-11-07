import { useParams } from 'react-router-dom';
import About from '@/pages/About';
import { useCountry } from '@/hooks/use-geo-pages';
import NotFound from '@/pages/NotFound';

/**
 * Per-country About page. Renders the master About content unchanged so that
 * "DFSA" reads as a single organisation across every country. SEO uses a
 * canonical pointing at /about to avoid duplicate-content penalties.
 */
export default function CountryAbout() {
  const { country: countrySlug } = useParams<{ country: string }>();
  const { data: country, isLoading } = useCountry(countrySlug);
  if (!isLoading && !country) return <NotFound />;
  return <About />;
}
