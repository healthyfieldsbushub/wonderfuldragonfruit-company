import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/integrations/manus/client';

export interface DfsaCountry {
  id: string;
  slug: string;
  name: string;
  sub_region: string;
  iso_code: string | null;
  flag_emoji: string | null;
  currency: string | null;
  languages: string[] | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  intro: string | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string[] | null;
  hashtags: string[] | null;
  sort_order: number;
}

export interface DfsaRegion {
  id: string;
  country_id: string;
  slug: string;
  name: string;
  capital_city: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  intro: string | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string[] | null;
  hashtags: string[] | null;
  sort_order: number;
}

export interface DfsaRegionPage {
  id: string;
  region_id: string;
  page_slug: string;
  page_category: string | null;
  title: string;
  h1: string | null;
  body_md: string | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string[] | null;
  hashtags: string[] | null;
  schema_jsonld: any;
}

export function useCountries() {
  return useQuery({
    queryKey: ['dfsa-countries'],
    queryFn: async () => {
      const { data, error } = await appClient
        .from('dfsa_countries' as any)
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as unknown as DfsaCountry[];
    },
    // Country list rarely changes — cache aggressively to avoid refetching
    // on every page navigation / Header re-mount / window focus.
    staleTime: 60 * 60 * 1000, // 1 hour: data considered fresh
    gcTime: 24 * 60 * 60 * 1000, // 24 hours: keep in cache even when unused
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

export function useCountry(slug?: string) {
  return useQuery({
    queryKey: ['dfsa-country', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await appClient
        .from('dfsa_countries' as any)
        .select('*')
        .eq('slug', slug!)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as DfsaCountry | null;
    },
  });
}

export function useRegions(countryId?: string) {
  return useQuery({
    queryKey: ['dfsa-regions', countryId],
    enabled: !!countryId,
    queryFn: async () => {
      const { data, error } = await appClient
        .from('dfsa_regions' as any)
        .select('*')
        .eq('country_id', countryId!)
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as unknown as DfsaRegion[];
    },
  });
}

export function useRegion(countryId?: string, regionSlug?: string) {
  return useQuery({
    queryKey: ['dfsa-region', countryId, regionSlug],
    enabled: !!countryId && !!regionSlug,
    queryFn: async () => {
      const { data, error } = await appClient
        .from('dfsa_regions' as any)
        .select('*')
        .eq('country_id', countryId!)
        .eq('slug', regionSlug!)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as DfsaRegion | null;
    },
  });
}

function useRegionPage(regionId?: string, pageSlug?: string) {
  return useQuery({
    queryKey: ['dfsa-region-page', regionId, pageSlug],
    enabled: !!regionId && !!pageSlug,
    queryFn: async () => {
      const { data, error } = await appClient
        .from('dfsa_region_pages' as any)
        .select('*')
        .eq('region_id', regionId!)
        .eq('page_slug', pageSlug!)
        .eq('is_published', true)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as DfsaRegionPage | null;
    },
  });
}
