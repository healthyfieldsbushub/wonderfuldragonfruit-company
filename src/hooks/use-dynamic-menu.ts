import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/integrations/manus/client';

export interface MenuItem {
  label: string;
  url: string;
  target?: string;
  children?: MenuItem[];
}

export interface Menu {
  id: string;
  name: string;
  location: string;
  items: MenuItem[];
  is_active: boolean;
}

export function useDynamicMenu(location: string) {
  return useQuery({
    queryKey: ['menu', location],
    queryFn: async () => {
      const { data, error } = await appClient
        .from('menus')
        .select('*')
        .eq('location', location)
        .eq('is_active', true)
        .single();

      if (error) {
        // No menu found is okay, return null
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      // Parse items safely
      let items: MenuItem[] = [];
      if (data?.items) {
        if (typeof data.items === 'string') {
          try {
            items = JSON.parse(data.items);
          } catch {
            items = [];
          }
        } else if (Array.isArray(data.items)) {
          items = data.items as unknown as MenuItem[];
        }
      }

      return {
        ...data,
        items,
      } as Menu;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

function useAllMenus() {
  return useQuery({
    queryKey: ['menus'],
    queryFn: async () => {
      const { data, error } = await appClient
        .from('menus')
        .select('*')
        .eq('is_active', true)
        .order('location');

      if (error) throw error;

      return data.map((menu) => {
        let items: MenuItem[] = [];
        if (menu.items) {
          if (typeof menu.items === 'string') {
            try {
              items = JSON.parse(menu.items);
            } catch {
              items = [];
            }
          } else if (Array.isArray(menu.items)) {
            items = menu.items as unknown as MenuItem[];
          }
        }
        return { ...menu, items } as Menu;
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}
