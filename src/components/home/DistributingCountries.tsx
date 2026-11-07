import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface CountryOption {
  id: string;
  slug: string;
  name: string;
  flag_emoji: string | null;
}

/** Homepage "DISTRIBUTING COUNTRIES" section linking into the Distributors page. */
export function DistributingCountries() {
  const { data: countries } = useQuery<CountryOption[]>({
    queryKey: ['distributor-network'],
    queryFn: async () => {
      const response = await fetch('/api/distributors/network');
      if (!response.ok) return [];
      const payload = await response.json();
      return (payload.data?.countries || []) as CountryOption[];
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <section className="py-16 bg-muted/40" aria-labelledby="distributing-countries-heading">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">DISTRIBUTING COUNTRIES</p>
          <h2 id="distributing-countries-heading" className="text-2xl sm:text-3xl font-bold mb-3">
            Our Dragon Fruit Distribution Network Across Africa
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore our country distribution network to find authorised distributors, planting material information,
            farm registration requirements and relevant programme details.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {(countries || []).map((country) => (
            <Link
              key={country.id}
              to={`/distributors/${country.slug}`}
              className="group flex flex-col items-center gap-2 rounded-xl border bg-card px-4 py-6 text-center shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              aria-label={`${country.name} distributor information`}
            >
              <span className="text-3xl" aria-hidden="true">{country.flag_emoji || '🌍'}</span>
              <span className="font-semibold tracking-wide group-hover:text-primary">{country.name}</span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary">
                View programme <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
