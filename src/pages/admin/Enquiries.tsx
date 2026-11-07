import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/integrations/manus/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Search, Loader2, Inbox, Mail, Phone, Trash2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

type Enquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  source: string;
  status: string;
  notes: string | null;
  created_at: string;
};

type Lead = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  country: string;
  plants_needed: string;
  message: string | null;
  status: string;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  contacted: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  closed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
};

export default function AdminEnquiries() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('new');
  const qc = useQueryClient();

  const { data: enquiries, isLoading } = useQuery({
    queryKey: ['admin-enquiries', search, statusFilter],
    queryFn: async () => {
      let q = appClient
        .from('customer_enquiries')
        .select('*')
        .order('created_at', { ascending: false });
      if (search) {
        q = q.or(
          `name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%,message.ilike.%${search}%`
        );
      }
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data as Enquiry[];
    },
  });

  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['admin-commercial-leads'],
    queryFn: async () => {
      const { data, error } = await appClient
        .from('commercial_leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  const update = useMutation({
    mutationFn: async (vars: { id: string; status: string; notes: string }) => {
      const { error } = await appClient
        .from('customer_enquiries')
        .update({ status: vars.status, notes: vars.notes })
        .eq('id', vars.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Enquiry updated');
      qc.invalidateQueries({ queryKey: ['admin-enquiries'] });
      setSelected(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await appClient.from('customer_enquiries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Enquiry deleted');
      qc.invalidateQueries({ queryKey: ['admin-enquiries'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const openDetail = (e: Enquiry) => {
    setSelected(e);
    setEditNotes(e.notes ?? '');
    setEditStatus(e.status);
  };

  const counts = {
    total: enquiries?.length ?? 0,
    new: enquiries?.filter((e) => e.status === 'new').length ?? 0,
    contacted: enquiries?.filter((e) => e.status === 'contacted').length ?? 0,
    closed: enquiries?.filter((e) => e.status === 'closed').length ?? 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <Inbox className="h-8 w-8" />
          Enquiries & Leads
        </h1>
        <p className="text-muted-foreground">
          Customer contact form submissions and commercial lead enquiries
        </p>
      </div>

      <Tabs defaultValue="enquiries">
        <TabsList>
          <TabsTrigger value="enquiries">
            Contact Enquiries ({counts.total})
          </TabsTrigger>
          <TabsTrigger value="leads">
            Commercial Leads ({leads?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enquiries" className="space-y-4">
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: counts.total, color: 'text-foreground' },
              { label: 'New', value: counts.new, color: 'text-blue-600' },
              { label: 'Contacted', value: counts.contacted, color: 'text-amber-600' },
              { label: 'Closed', value: counts.closed, color: 'text-emerald-600' },
            ].map((s) => (
              <div key={s.label} className="glass-card rounded-xl p-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, email, subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl overflow-hidden"
          >
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              </div>
            ) : !enquiries?.length ? (
              <div className="p-8 text-center text-muted-foreground">
                No enquiries yet. Submissions from the Contact page will appear here.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enquiries.map((e) => (
                    <TableRow key={e.id} className="cursor-pointer" onClick={() => openDetail(e)}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{e.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {e.email}
                          </p>
                          {e.phone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {e.phone}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {e.subject || <span className="text-muted-foreground italic">No subject</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{e.source}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[e.status] ?? ''} variant="secondary">
                          {e.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(e.created_at)}
                      </TableCell>
                      <TableCell className="text-right" onClick={(ev) => ev.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => openDetail(e)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this enquiry?')) remove.mutate(e.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="leads">
          <div className="glass-card rounded-xl overflow-hidden">
            {leadsLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              </div>
            ) : !leads?.length ? (
              <div className="p-8 text-center text-muted-foreground">
                No commercial leads yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Plants Needed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Received</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.full_name}</TableCell>
                      <TableCell>
                        <p className="text-sm">{l.email}</p>
                        <p className="text-xs text-muted-foreground">{l.phone}</p>
                      </TableCell>
                      <TableCell>{l.country}</TableCell>
                      <TableCell>{l.plants_needed}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{l.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(l.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.subject || 'Enquiry'}</DialogTitle>
                <DialogDescription>
                  From {selected.name} • {formatDate(selected.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Email</p>
                    <a className="text-primary hover:underline" href={`mailto:${selected.email}`}>
                      {selected.email}
                    </a>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Phone</p>
                    <p>{selected.phone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Source</p>
                    <p>{selected.source}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Status</p>
                    <Select value={editStatus} onValueChange={setEditStatus}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground text-xs mb-1">Message</p>
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                    {selected.message}
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground text-xs mb-1">Internal notes</p>
                  <Textarea
                    rows={3}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Add follow-up notes..."
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" asChild>
                  <a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject || 'Your enquiry')}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Reply by email
                  </a>
                </Button>
                {selected.phone && (
                  <Button variant="outline" asChild>
                    <a
                      href={`https://wa.me/${selected.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      WhatsApp
                    </a>
                  </Button>
                )}
                <Button
                  onClick={() =>
                    update.mutate({ id: selected.id, status: editStatus, notes: editNotes })
                  }
                  disabled={update.isPending}
                >
                  {update.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
