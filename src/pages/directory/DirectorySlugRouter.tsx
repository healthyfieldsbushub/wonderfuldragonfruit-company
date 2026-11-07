import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useDistributorCountries } from '@/hooks/use-distributors';
import CountryDistributors from './CountryDistributors';
import BusinessDetail from '@/pages/BusinessDetail';

/**
 * /directory/:slug resolves to a country distributor page when the slug matches an
 * active distributor_countries row, otherwise falls back to a business listing.
 * New countries added in the admin panel work immediately — no route changes needed.
 */
export default function DirectorySlugRouter() {
  const { slug } = useParams<{ slug: string }>();
  const { data: countries, isLoading } = useDistributorCountries();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isCountry = (countries || []).some((c) => c.slug === slug);
  return isCountry ? <CountryDistributors /> : <BusinessDetail />;
}
