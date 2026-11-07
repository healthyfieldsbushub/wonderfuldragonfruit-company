import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/integrations/manus/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Search, Loader2, Building2, CheckCircle, XCircle, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

export default function AdminBusinessListings() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: listings, isLoading } = useQuery({
    queryKey: ['admin-business-listings', search, statusFilter],
    queryFn: async () => {
      let query = appClient
        .from('business_listings')
        .select(`
          *,
          african_countries (name),
          provinces (name),
          cities (name)
        `)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`business_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('subscription_status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await appClient
        .from('business_listings')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-business-listings'] });
      toast.success('Listing updated!');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleVerify = (id: string, verified: boolean) => {
    updateMutation.mutate({ id, updates: { is_verified: verified } });
  };

  const handleActivate = (id: string, active: boolean) => {
    updateMutation.mutate({ 
      id, 
      updates: { 
        is_active: active,
        subscription_status: active ? 'active' : 'inactive'
      } 
    });
  };

  const handleFeature = (id: string, featured: boolean) => {
    updateMutation.mutate({ id, updates: { is_featured: featured } });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Business Listings
          </h1>
          <p className="text-muted-foreground">Manage directory listings</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search businesses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Listings Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          </div>
        ) : listings?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No listings found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings?.map((listing: any) => (
                <TableRow key={listing.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {listing.logo_url ? (
                        <img
                          src={listing.logo_url}
                          alt={listing.business_name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{listing.business_name}</p>
                        <p className="text-xs text-muted-foreground">{listing.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{listing.category}</Badge>
                  </TableCell>
                  <TableCell>
                    {listing.cities?.name && `${listing.cities.name}, `}
                    {listing.african_countries?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {listing.is_verified && (
                        <Badge className="bg-blue-500/20 text-blue-700">Verified</Badge>
                      )}
                      {listing.is_featured && (
                        <Badge className="bg-yellow-500/20 text-yellow-700">Featured</Badge>
                      )}
                      {listing.is_active ? (
                        <Badge className="bg-green-500/20 text-green-700">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={listing.subscription_status === 'active' ? 'default' : 'outline'}>
                      {listing.subscription_status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(listing.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleVerify(listing.id, !listing.is_verified)}
                        title={listing.is_verified ? 'Remove verification' : 'Verify'}
                      >
                        <CheckCircle className={`h-4 w-4 ${listing.is_verified ? 'text-blue-500' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleActivate(listing.id, !listing.is_active)}
                        title={listing.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {listing.is_active ? (
                          <XCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleFeature(listing.id, !listing.is_featured)}
                        title={listing.is_featured ? 'Remove featured' : 'Make featured'}
                      >
                        <Eye className={`h-4 w-4 ${listing.is_featured ? 'text-yellow-500' : ''}`} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>
    </div>
  );
}
