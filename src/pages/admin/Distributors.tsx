import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/integrations/manus/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Globe2, Loader2, Pencil, Plus, Trash2, ExternalLink } from 'lucide-react';

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

type Row = Record<string, any>;

const EMPTY: Row = {
  country_id: '', business_name: '', slug: '', logo_url: '', banner_url: '',
  representative_name: '', position: '', address: '', province: '', phone: '', mobile: '',
  whatsapp: '', email: '', website: '', facebook: '', instagram: '', operating_hours: '',
  latitude: '', longitude: '', maps_embed_url: '', years_with_dfsa: '', service_area: '',
  description: '', products: '', gallery_images: '', is_active: true, sort_order: 0,
};

export default function AdminDistributors() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Row>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [countryFilter, setCountryFilter] = useState('all');

  const { data: countries } = useQuery({
    queryKey: ['admin-distributor-countries'],
    queryFn: async () => {
      const { data, error } = await appClient
        .from('distributor_countries').select('*').order('sort_order');
      if (error) throw error;
      return data as Row[];
    },
  });

  const { data: distributors, isLoading } = useQuery({
    queryKey: ['admin-distributors'],
    queryFn: async () => {
      const { data, error } = await appClient
        .from('distributors')
        .select('*, distributor_countries(name, slug)')
        .order('sort_order');
      if (error) throw error;
      return data as Row[];
    },
  });

  const filtered = useMemo(
    () => (distributors || []).filter((d) => countryFilter === 'all' || d.country_id === countryFilter),
    [distributors, countryFilter],
  );

  const save = useMutation({
    mutationFn: async (row: Row) => {
      const payload = {
        country_id: row.country_id,
        business_name: row.business_name,
        slug: row.slug || slugify(row.business_name),
        logo_url: row.logo_url || null,
        banner_url: row.banner_url || null,
        representative_name: row.representative_name || null,
        position: row.position || null,
        address: row.address || null,
        province: row.province || null,
        phone: row.phone || null,
        mobile: row.mobile || null,
        whatsapp: row.whatsapp || null,
        email: row.email || null,
        website: row.website || null,
        facebook: row.facebook || null,
        instagram: row.instagram || null,
        operating_hours: row.operating_hours || null,
        latitude: row.latitude === '' || row.latitude === null ? null : Number(row.latitude),
        longitude: row.longitude === '' || row.longitude === null ? null : Number(row.longitude),
        maps_embed_url: row.maps_embed_url || null,
        years_with_dfsa: row.years_with_dfsa || null,
        service_area: row.service_area || null,
        description: row.description || null,
        products: String(row.products || '')
          .split(/[\n,|]/).map((s) => s.trim()).filter(Boolean),
        gallery_images: String(row.gallery_images || '')
          .split(/[\n,]/).map((s) => s.trim()).filter(Boolean),
        is_active: !!row.is_active,
        sort_order: Number(row.sort_order) || 0,
      };

      if (editingId) {
        const { error } = await appClient.from('distributors').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await appClient.from('distributors').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-distributors'] });
      queryClient.invalidateQueries({ queryKey: ['distributor-country'] });
      toast.success(editingId ? 'Distributor updated' : 'Distributor added — the country page is live');
      setOpen(false);
      setForm(EMPTY);
      setEditingId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await appClient.from('distributors').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-distributors'] });
      toast.success('Distributor removed');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const startEdit = (d: Row) => {
    setEditingId(d.id);
    setForm({
      ...EMPTY,
      ...d,
      latitude: d.latitude ?? '',
      longitude: d.longitude ?? '',
      products: (d.products || []).join('\n'),
      gallery_images: Array.isArray(d.gallery_images) ? d.gallery_images.join('\n') : '',
    });
    setOpen(true);
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const field = (k: string, label: string, placeholder = '') => (
    <div className="space-y-1.5">
      <Label htmlFor={`f-${k}`}>{label}</Label>
      <Input id={`f-${k}`} value={form[k] ?? ''} onChange={set(k)} placeholder={placeholder} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <Globe2 className="h-8 w-8" /> Country Distributors
          </h1>
          <p className="text-muted-foreground">
            Manage DFSA Associate Plant Suppliers shown on /directory/&lt;country&gt; pages.
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Country" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              {(countries || []).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.flag_emoji} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => { setForm({ ...EMPTY, country_id: countries?.[0]?.id || '' }); setEditingId(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add distributor
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(countries || []).map((c) => (
          <a key={c.id} href={`/directory/${c.slug}`} target="_blank" rel="noreferrer"
            className="text-sm inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 hover:border-primary">
            {c.flag_emoji} {c.name} <ExternalLink className="h-3 w-3" />
          </a>
        ))}
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No distributors yet</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <p className="font-medium">{d.business_name}</p>
                    <p className="text-xs text-muted-foreground">{d.representative_name}</p>
                  </TableCell>
                  <TableCell>{d.distributor_countries?.name}</TableCell>
                  <TableCell className="text-sm">
                    <p>{d.email}</p>
                    <p className="text-muted-foreground">{d.mobile || d.phone}</p>
                  </TableCell>
                  <TableCell>
                    {d.is_active
                      ? <Badge className="bg-green-500/20 text-green-700">Active</Badge>
                      : <Badge variant="outline">Inactive</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(d)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      if (confirm(`Delete ${d.business_name}?`)) remove.mutate(d.id);
                    }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit distributor' : 'Add distributor'}</DialogTitle>
          </DialogHeader>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Select value={form.country_id} onValueChange={(v) => setForm((f) => ({ ...f, country_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  {(countries || []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.flag_emoji} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {field('business_name', 'Business name')}
            {field('slug', 'Slug (auto from name if blank)')}
            {field('representative_name', 'Contact person')}
            {field('position', 'Position')}
            {field('logo_url', 'Logo URL')}
            {field('banner_url', 'Banner image URL')}
            {field('address', 'Address')}
            {field('province', 'Province / region')}
            {field('phone', 'Telephone')}
            {field('mobile', 'Mobile')}
            {field('whatsapp', 'WhatsApp number', '+263 77 000 0000')}
            {field('email', 'Email')}
            {field('website', 'Website')}
            {field('facebook', 'Facebook URL')}
            {field('instagram', 'Instagram URL')}
            {field('operating_hours', 'Operating hours', 'Mon–Fri 08:00–17:00, Sat 08:00–13:00')}
            {field('latitude', 'GPS latitude', '-17.8252')}
            {field('longitude', 'GPS longitude', '31.0335')}
            {field('years_with_dfsa', 'Years with DFSA', 'Since 2008')}
            {field('service_area', 'Service area', 'Harare, Bulawayo & surrounds')}
            {field('maps_embed_url', 'Google Maps embed URL (optional)')}
            {field('sort_order', 'Sort order')}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="f-description">Business description</Label>
            <Textarea id="f-description" rows={4} value={form.description ?? ''} onChange={set('description')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-products">Product list (one per line)</Label>
            <Textarea id="f-products" rows={4} value={form.products ?? ''} onChange={set('products')}
              placeholder={'Commercial Dragon Fruit Plants\nPremium Cultivars\nTraining'} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-gallery">Gallery image URLs (one per line)</Label>
            <Textarea id="f-gallery" rows={4} value={form.gallery_images ?? ''} onChange={set('gallery_images')} />
          </div>
          <div className="flex items-center gap-3">
            <Switch id="f-active" checked={!!form.is_active}
              onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
            <Label htmlFor="f-active">Active (visible on the public country page)</Label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              disabled={!form.business_name || !form.country_id || save.isPending}
              onClick={() => save.mutate(form)}
            >
              {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingId ? 'Save changes' : 'Add distributor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
