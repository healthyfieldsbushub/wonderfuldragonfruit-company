import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Trash2, FileText, BookOpen, Package } from 'lucide-react';

/**
 * The files attached to one ebook.
 *
 * A title can carry several formats — PDF for printing, EPUB for e-readers —
 * and the buyer gets all of them from the single link we email on payment.
 * Each format has its own download allowance, so taking the PDF does not use up
 * the EPUB.
 */
export interface EbookFormat {
  id: number;
  format: string;
  file_key: string;
  file_name: string | null;
  file_size: number | null;
  label: string | null;
  sort_order: number;
}

const ICONS: Record<string, React.ReactNode> = {
  PDF: <FileText className="h-4 w-4" />,
  EPUB: <BookOpen className="h-4 w-4" />,
};

const mb = (n: number | null | undefined) =>
  n == null ? '' : ` · ${(Number(n) / 1048576).toFixed(1)} MB`;

/** Guess the format from the file's extension so the admin does not have to. */
function guessFormat(fileName: string): string {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  if (ext === 'epub') return 'EPUB';
  if (ext === 'pdf') return 'PDF';
  if (ext === 'zip') return 'ZIP';
  return ext ? ext.toUpperCase() : 'PDF';
}

export default function EbookFormats({ productId }: { productId: string }) {
  const { toast } = useToast();
  const [formats, setFormats] = useState<EbookFormat[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pendingFormat, setPendingFormat] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/digital/formats/${encodeURIComponent(productId)}`, {
        credentials: 'include',
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || `Request failed (${res.status})`);
      setFormats(json?.data?.formats || []);
    } catch (err) {
      toast({
        title: 'Could not load the ebook files',
        description: err instanceof Error ? err.message : '',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [productId, toast]);

  useEffect(() => { void load(); }, [load]);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      // Step 1: store the file.
      const form = new FormData();
      form.append('file', file);
      const up = await fetch('/api/admin/digital/upload', {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      const upJson = await up.json().catch(() => null);
      if (!up.ok) throw new Error(upJson?.error?.message || `Upload failed (${up.status})`);
      const uploaded = upJson?.data || {};

      // Step 2: attach it to this ebook under its format.
      const format = (pendingFormat.trim() || guessFormat(file.name)).toUpperCase();
      const res = await fetch('/api/admin/digital/formats', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          format,
          fileKey: uploaded.fileKey,
          fileName: uploaded.fileName || file.name,
          fileSize: uploaded.fileSize || file.size,
          sortOrder: formats.length,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || `Could not attach the file (${res.status})`);
      setFormats(json?.data?.formats || []);
      setPendingFormat('');
      toast({ title: `${format} added`, description: 'Buyers will now receive this format too.' });
    } catch (err) {
      toast({
        title: 'Upload failed',
        description: err instanceof Error ? err.message : '',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const remove = async (id: number) => {
    setBusyId(id);
    try {
      const res = await fetch('/api/admin/digital/formats/remove', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || `Could not remove the file (${res.status})`);
      setFormats(json?.data?.formats || []);
      toast({ title: 'Format removed' });
    } catch (err) {
      toast({
        title: 'Could not remove',
        description: err instanceof Error ? err.message : '',
        variant: 'destructive',
      });
    } finally {
      setBusyId(null);
    }
  };

  if (!productId) {
    return (
      <p className="text-sm text-muted-foreground">
        Save this product first, then upload the ebook files here.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Ebook files</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Add every format this title comes in. A buyer pays once and can download all of them from the
          same link — PDF for printing, EPUB for an e-reader. Uploading a format again replaces the old file.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground"><Loader2 className="h-4 w-4 inline animate-spin" /> Loading…</p>
      ) : formats.length === 0 ? (
        <p className="text-sm text-amber-600">
          No file uploaded yet. Customers cannot download this book until you add at least one.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {formats.map((f) => (
            <li key={f.id} className="flex items-center gap-3 p-3">
              <span className="text-primary">{ICONS[f.format] || <Package className="h-4 w-4" />}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {f.format}
                  {f.label && <span className="text-muted-foreground font-normal"> — {f.label}</span>}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {f.file_name || 'file'}{mb(f.file_size)}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void remove(f.id)}
                disabled={busyId === f.id || formats.length <= 1}
                title={formats.length <= 1 ? 'An ebook needs at least one file' : 'Remove this format'}
              >
                {busyId === f.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Format</label>
          <Input
            placeholder="PDF, EPUB…"
            value={pendingFormat}
            onChange={(e) => setPendingFormat(e.target.value.toUpperCase())}
            className="w-32"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">File (PDF, EPUB or ZIP, up to 200 MB)</label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.epub,.zip,application/pdf,application/epub+zip"
            className="text-sm"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
          />
        </div>
        {uploading && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
          </p>
        )}
      </div>
      {!pendingFormat.trim() && (
        <p className="text-xs text-muted-foreground">
          Leave Format empty and it will be taken from the file name.
        </p>
      )}
    </div>
  );
}
