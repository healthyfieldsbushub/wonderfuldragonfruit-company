import { useParams } from 'react-router-dom';
import Terms from '@/pages/Terms';
import { useCountry } from '@/hooks/use-geo-pages';
import NotFound from '@/pages/NotFound';

export default function CountryTerms() {
  const { country: countrySlug } = useParams<{ country: string }>();
  const { data: country, isLoading } = useCountry(countrySlug);
  if (!isLoading && !country) return <NotFound />;
  // Identical content; canonical points at the master /terms URL.
  return (
    <Terms
      canonicalUrl="/terms"
      breadcrumb={[{ label: country?.name ?? '', href: `/country/${countrySlug}` }]}
    />
  );
}
