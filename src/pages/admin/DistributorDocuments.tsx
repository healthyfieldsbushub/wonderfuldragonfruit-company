import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/integrations/manus/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { FileUp, Loader2, Trash2 } from 'lucide-react';

const COUNTRIES = [
  { slug: 'zimbabwe', name: 'Zimbabwe' },
  { slug: 'botswana', name: 'Botswana' },
  { slug: 'zambia', name: 'Zambia' },
  { slug: 'namibia', name: 'Namibia' },
  { slug: 'drc', name: 'DRC' },
  { slug: 'south-africa', name: 'South Africa' },
  { slug: 'eswatini', name: 'Eswatini (Swaziland)' },
  { slug: 'lesotho', name: 'Lesotho' },
];

type Row = Record<string, any>;

export default function AdminDistributorDocuments() {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Row>({
    country_slug: 'zimbabwe', title: '', description: '', version_label: '', sort_order: 0,
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['admin-distributor-documents'],
    queryFn: async () => {
      const { data, error } = await appClient
        .from('distributor_documents')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as Row[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Choose a PDF, DOCX or XLSX file first');
      setUploading(true);
      try {
        const path = `distributor-documents/${Date.now()}-${file.name.replace(/[^A-Za-z0-9._-]/g, '_')}`;
        const { data: upload, error: uploadError } = await appClient.storage.from('uploads').upload(path, file);
        if (uploadError) throw new Error(uploadError.message || 'Upload failed');
        const url = `/manus-storage/uploads/${path}`;
        const { error } = await appClient.from('distributor_documents').insert({
          country_slug: form.country_slug,
          title: form.title,
          description: form.description || null,
          version_label: form.version_label || null,
          file_url: url,
          file_name: file.name,
          sort_order: Number(form.sort_order) || 0,
          is_active: true,
        });
        if (error) throw new Error(error.message || 'Could not save the document record');
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      toast.success('Document published');
      setForm({ country_slug: form.country_slug, title: '', description: '', version_label: '', sort_order: 0 });
      setFile(null);
      if (fileInput.current) fileInput.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['admin-distributor-documents'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await appClient.from('distributor_documents').delete().eq('id', id);
      if (error) throw new Error(error.message || 'Delete failed');
    },
    onSuccess: () => {
      toast.success('Document removed');
      queryClient.invalidateQueries({ queryKey: ['admin-distributor-documents'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileUp className="h-6 w-6 text-primary" /> Farmer Documents &amp; Registers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload approved programme documents (PDF, DOCX, XLSX). Published documents appear on the public Distributors page under "Farmer Documents and Downloadable Registers".
        </p>
      </div>

      <form
        onSubmit={(event) => { event.preventDefault(); create.mutate(); }}
        className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-2"
      >
        <div className="space-y-1.5">
          <Label>Country section</Label>
          <Select value={form.country_slug} onValueChange={(value) => setForm({ ...form, country_slug: value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.slug} value={country.slug}>{country.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="doc-title">Document title</Label>
          <Input id="doc-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Farm Registration Form" />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="doc-description">Short description</Label>
          <Textarea id="doc-description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="doc-version">Version or date label</Label>
          <Input id="doc-version" value={form.version_label} onChange={(e) => setForm({ ...form, version_label: e.target.value })} placeholder="e.g. v1.0 — January 2026" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="doc-order">Sort order</Label>
          <Input id="doc-order" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="doc-file">File (PDF, DOCX, XLSX)</Label>
          <Input id="doc-file" ref={fileInput} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <div className="md:col-span-2">
          <Button type="submit" disabled={create.isPending || uploading}>
            {(create.isPending || uploading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
            Upload &amp; publish document
          </Button>
        </div>
      </form>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>File</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">Loading…</TableCell></TableRow>
            ) : (documents || []).length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">No documents uploaded yet.</TableCell></TableRow>
            ) : (
              (documents || []).map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.title}</TableCell>
                  <TableCell className="capitalize">{doc.country_slug}</TableCell>
                  <TableCell className="text-sm">{doc.version_label || '—'}</TableCell>
                  <TableCell className="text-sm">
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{doc.file_name || 'Download'}</a>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => remove.mutate(doc.id)} aria-label={`Delete ${doc.title}`}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
