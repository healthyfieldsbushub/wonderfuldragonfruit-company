import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/integrations/manus/client';

interface DistributorCountry {
  id: string;
  slug: string;
  name: string;
  flag_emoji: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_tagline: string | null;
  hero_image_url: string | null;
  intro: string | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string[] | null;
  hashtags: string[] | null;
  head_office_email: string;
  is_active: boolean;
  sort_order: number;
}

export interface Distributor {
  id: string;
  country_id: string;
  slug: string;
  business_name: string;
  logo_url: string | null;
  banner_url: string | null;
  representative_name: string | null;
  position: string | null;
  address: string | null;
  province: string | null;
  phone: string | null;
  mobile: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  operating_hours: string | null;
  latitude: number | null;
  longitude: number | null;
  maps_embed_url: string | null;
  years_with_dfsa: string | null;
  service_area: string | null;
  description: string | null;
  products: string[] | null;
  gallery_images: unknown;
  is_active: boolean;
  sort_order: number;
}

/** All active country pages — drives navigation, sitemap links and country switching. */
export function useDistributorCountries() {
  return useQuery({
    queryKey: ['distributor-countries'],
    queryFn: async () => {
      const { data, error } = await appClient
        .from('distributor_countries')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return (data || []) as unknown as DistributorCountry[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** One country page plus its active associate suppliers. */
export function useCountryDistributors(slug?: string) {
  return useQuery({
    queryKey: ['distributor-country', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data: country, error } = await appClient
        .from('distributor_countries')
        .select('*')
        .eq('slug', slug!)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      if (!country) return null;

      const { data: distributors, error: dErr } = await appClient
        .from('distributors')
        .select('*')
        .eq('country_id', (country as any).id)
        .eq('is_active', true)
        .order('sort_order');
      if (dErr) throw dErr;

      return {
        country: country as unknown as DistributorCountry,
        distributors: (distributors || []) as unknown as Distributor[],
      };
    },
  });
}

export const galleryUrls = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === 'string' ? v : (v as any)?.url))
      .filter((v): v is string => typeof v === 'string' && v.length > 0);
  }
  return [];
};
