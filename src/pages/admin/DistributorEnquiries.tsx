import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Archive, Inbox, Loader2, Mail } from 'lucide-react';

interface EnquiryRow {
  id: string;
  distributor_name: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  inquiry_category: string;
  message: string;
  status: string;
  created_at: string;
}

const STATUS_STYLES: Record<string, 'default' | 'secondary' | 'outline'> = {
  new: 'default',
  read: 'secondary',
  archived: 'outline',
};

export default function AdminDistributorEnquiries() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: enquiries, isLoading } = useQuery({
    queryKey: ['admin-distributor-enquiries'],
    queryFn: async () => {
      const response = await fetch('/api/admin/distributor-enquiries', { credentials: 'include' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Failed to load enquiries');
      return payload.data as EnquiryRow[];
    },
    refetchInterval: 60_000,
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/admin/distributor-enquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message || 'Update failed');
    },
    onSuccess: () => {
      toast.success('Enquiry updated');
      queryClient.invalidateQueries({ queryKey: ['admin-distributor-enquiries'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const sendTest = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/distributor-enquiries/test-notification', { method: 'POST', credentials: 'include' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Test notification failed');
      return payload as { ownerNotification: string; email: string; recipients: string[] };
    },
    onSuccess: (result) => {
      toast.success(`Test notification sent. Email routing: ${result.email}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = (enquiries || []).filter((row) => statusFilter === 'all' || row.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Inbox className="h-6 w-6 text-primary" /> Distributor Enquiries</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enquiries submitted through the Distributors page contact forms. Each submission identifies the distributor contacted.
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Filter status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => sendTest.mutate()} disabled={sendTest.isPending}>
          {sendTest.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
          Send test notification
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> {rows.length} enquiry{rows.length === 1 ? '' : 's'}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading enquiries…</p>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No enquiries yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Received</TableHead>
                  <TableHead>Distributor</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-xs whitespace-nowrap">{new Date(row.created_at).toLocaleString('en-ZA')}</TableCell>
                    <TableCell className="text-sm font-medium">{row.distributor_name || '—'}</TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium">{row.full_name}</div>
                      <a href={`mailto:${row.email}`} className="text-xs text-primary hover:underline">{row.email}</a>
                      {row.phone && <div className="text-xs text-muted-foreground">{row.phone}</div>}
                    </TableCell>
                    <TableCell className="text-sm">{row.inquiry_category}</TableCell>
                    <TableCell className="max-w-[320px]"><p className="text-sm line-clamp-3 whitespace-pre-wrap">{row.message}</p></TableCell>
                    <TableCell><Badge variant={STATUS_STYLES[row.status] || 'outline'}>{row.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-2">
                      {row.status === 'new' && (
                        <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: row.id, status: 'read' })}>Mark read</Button>
                      )}
                      {row.status !== 'archived' && (
                        <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ id: row.id, status: 'archived' })}>
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Enquiries always notify the project owner through the platform notification channel. Direct email delivery to the
        distributor addresses activates once the ENQUIRY_NOTIFY_EMAILS and SMTP secrets are configured.
      </p>
    </div>
  );
}
