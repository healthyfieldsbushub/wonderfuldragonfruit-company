import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/integrations/manus/client';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Subscription {
  id: string;
  business_id: string | null;
  user_id: string | null;
  plan_id: string | null;
  status: string;
  amount_paid_zar: number | null;
  payment_reference: string | null;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  business_listings?: { business_name: string; slug: string } | null;
}

export default function AdminSubscriptions() {
  const qc = useQueryClient();

  const { data: subs, isLoading } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      const { data, error } = await appClient
        .from('business_subscriptions')
        .select('*, business_listings(business_name, slug)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Subscription[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await appClient
        .from('business_subscriptions')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      toast.success('Subscription updated');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  const totalActive = subs?.filter(s => s.status === 'active').length || 0;
  const totalRevenue = subs?.filter(s => s.status === 'active')
    .reduce((sum, s) => sum + (Number(s.amount_paid_zar) || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <CreditCard className="h-8 w-8" />
          Subscriptions
        </h1>
        <p className="text-muted-foreground">Business directory subscriptions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Total Subscriptions</p>
          <p className="text-3xl font-bold">{subs?.length || 0}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-3xl font-bold text-green-600">{totalActive}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Active Revenue (ZAR)</p>
          <p className="text-3xl font-bold">R{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
        ) : subs?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No subscriptions yet</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Starts</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subs?.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    {s.business_listings?.business_name || s.business_id?.slice(0, 8) || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.status === 'active' ? 'default' : s.status === 'pending' ? 'outline' : 'secondary'}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell>R{Number(s.amount_paid_zar || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-xs font-mono">{s.payment_reference || '—'}</TableCell>
                  <TableCell>{formatDate(s.starts_at)}</TableCell>
                  <TableCell>{formatDate(s.expires_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {s.status !== 'active' && (
                        <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: s.id, status: 'active' })}>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {s.status !== 'cancelled' && (
                        <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: s.id, status: 'cancelled' })}>
                          <XCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
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
