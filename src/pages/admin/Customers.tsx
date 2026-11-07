import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { toast } from 'sonner';
import { Search, Loader2, Users, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSyncCustomer } from '@/hooks/use-zoho-sync';

export default function AdminCustomers() {
  const [search, setSearch] = useState('');
  const syncCustomer = useSyncCustomer();

  const { data: customers, isLoading } = useQuery({
    queryKey: ['admin-customers', search],
    queryFn: async () => {
      let query = appClient
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: orderCounts } = useQuery({
    queryKey: ['customer-order-counts'],
    queryFn: async () => {
      const { data, error } = await appClient
        .from('orders')
        .select('customer_id, total_zar');
      
      if (error) throw error;
      
      const counts: Record<string, { orders: number; total: number }> = {};
      data?.forEach((order) => {
        if (order.customer_id) {
          if (!counts[order.customer_id]) {
            counts[order.customer_id] = { orders: 0, total: 0 };
          }
          counts[order.customer_id].orders++;
          counts[order.customer_id].total += order.total_zar || 0;
        }
      });
      return counts;
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSyncToZoho = (customer: any) => {
    syncCustomer.mutate(customer);
  };

  const handleSyncAllToZoho = () => {
    if (!customers?.length) return;
    
    customers.forEach((customer, index) => {
      setTimeout(() => {
        syncCustomer.mutate(customer);
      }, index * 500); // Stagger requests
    });
    
    toast.info(`Syncing ${customers.length} customers to Zoho CRM...`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Customers
          </h1>
          <p className="text-muted-foreground">Manage customer accounts</p>
        </div>
        <Button
          variant="outline"
          onClick={handleSyncAllToZoho}
          disabled={syncCustomer.isPending || !customers?.length}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncCustomer.isPending ? 'animate-spin' : ''}`} />
          Sync All to Zoho
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customers Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          </div>
        ) : customers?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No customers found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers?.map((customer) => {
                const stats = orderCounts?.[customer.id] || { orders: 0, total: 0 };
                return (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                          {(customer.first_name?.[0] || customer.email[0]).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">
                            {customer.first_name || customer.last_name
                              ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                              : 'No name'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone || '-'}</TableCell>
                    <TableCell>{stats.orders}</TableCell>
                    <TableCell>{formatCurrency(stats.total)}</TableCell>
                    <TableCell>{formatDate(customer.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSyncToZoho(customer)}
                        disabled={syncCustomer.isPending}
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${syncCustomer.isPending ? 'animate-spin' : ''}`} />
                        Sync
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </motion.div>
    </div>
  );
}
