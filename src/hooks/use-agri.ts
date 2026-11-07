import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/integrations/manus/client';

export function useAgriMarkets(countryId?: string) {
  return useQuery({
    queryKey: ['agri-markets', countryId],
    enabled: !!countryId,
    queryFn: async () => {
      const { data, error } = await (appClient as any)
        .from('agri_markets').select('*')
        .eq('country_id', countryId).eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAgriBuyers(countryId?: string) {
  return useQuery({
    queryKey: ['agri-buyers', countryId],
    enabled: !!countryId,
    queryFn: async () => {
      const { data, error } = await (appClient as any)
        .from('agri_buyers').select('*')
        .eq('country_id', countryId).eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAgriGov(countryId?: string) {
  return useQuery({
    queryKey: ['agri-gov', countryId],
    enabled: !!countryId,
    queryFn: async () => {
      const { data, error } = await (appClient as any)
        .from('agri_government_bodies').select('*')
        .eq('country_id', countryId).eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAgriOrgs(countryId?: string) {
  return useQuery({
    queryKey: ['agri-orgs', countryId],
    enabled: !!countryId,
    queryFn: async () => {
      const { data, error } = await (appClient as any)
        .from('agri_organizations').select('*')
        .eq('country_id', countryId).eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAgriProcessing(countryId?: string) {
  return useQuery({
    queryKey: ['agri-processing', countryId],
    enabled: !!countryId,
    queryFn: async () => {
      const { data, error } = await (appClient as any)
        .from('agri_processing_facilities').select('*')
        .eq('country_id', countryId).eq('is_active', true);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDragonFruitPrices(limit = 30) {
  return useQuery({
    queryKey: ['agri-prices', limit],
    queryFn: async () => {
      const { data, error } = await (appClient as any)
        .from('agri_dragon_fruit_prices').select('*')
        .order('recorded_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAgriFeedItems(scope?: string, limit = 30) {
  return useQuery({
    queryKey: ['agri-feed', scope, limit],
    queryFn: async () => {
      let q: any = (appClient as any).from('agri_feed_items').select('*')
        .order('published_at', { ascending: false }).limit(limit);
      if (scope) q = q.in('country_scope', [scope, 'global']);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useAgriMarket(countryId?: string, slug?: string) {
  return useQuery({
    queryKey: ['agri-market', countryId, slug],
    enabled: !!countryId && !!slug,
    queryFn: async () => {
      const { data, error } = await (appClient as any)
        .from('agri_markets').select('*')
        .eq('country_id', countryId).eq('slug', slug)
        .eq('is_active', true).maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}
