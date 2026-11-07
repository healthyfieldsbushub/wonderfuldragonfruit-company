import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import { appClient } from '@/integrations/manus/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Download, Upload, ImagePlus, Loader2, FileSpreadsheet } from 'lucide-react';

type Row = Record<string, any>;

const PRODUCT_COLUMNS = [
  'sku', 'name', 'slug', 'category_slug', 'short_description', 'description',
  'price_zar', 'compare_at_price_zar', 'cost_price_zar',
  'stock_quantity', 'low_stock_threshold', 'allow_backorder',
  'weight_kg', 'length_cm', 'width_cm', 'height_cm',
  'brand', 'barcode', 'tags', 'meta_title', 'meta_description',
  'primary_image_url', 'is_featured', 'is_active',
];

const CATEGORY_COLUMNS = [
  'slug', 'name', 'description', 'image_url', 'parent_slug', 'sort_order', 'is_active',
];

function toCsv(rows: Row[], columns: string[]) {
  return Papa.unparse(rows.map((r) => {
    const o: Row = {};
    for (const c of columns) {
      let v = r[c];
      if (Array.isArray(v)) v = v.join('|');
      o[c] = v ?? '';
    }
    return o;
  }));
}

function downloadFile(name: string, content: string, mime = 'text/csv') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function parseBool(v: any, dflt = false) {
  if (v === undefined || v === null || v === '') return dflt;
  const s = String(v).trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 't'].includes(s);
}
function parseNum(v: any): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}
function parseTags(v: any): string[] | null {
  if (!v) return null;
  if (Array.isArray(v)) return v;
  return String(v).split(/[|,]/).map((s) => s.trim()).filter(Boolean);
}
function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function BulkImport({ initialTab = 'products' }: { initialTab?: string }) {
  const [tab, setTab] = useState(initialTab);

  // Export state
  const [exporting, setExporting] = useState(false);

  // Import state
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importLog, setImportLog] = useState<string[]>([]);

  // Image mapping state
  const [imgCsv, setImgCsv] = useState('');
  const [imgBusy, setImgBusy] = useState(false);

  // Image upload state
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadLog, setUploadLog] = useState<string[]>([]);

  const productTemplate = useMemo(
    () => PRODUCT_COLUMNS.join(',') + '\n' +
      'DFA-001,Sample Product,sample-product,cuttings-cultivars,Short desc,Long desc,199,,,0,5,false,0.5,,,,DFA,,tag1|tag2,Meta title,Meta description,,false,true',
    []
  );
  const categoryTemplate = useMemo(
    () => CATEGORY_COLUMNS.join(',') + '\n' +
      'my-category,My Category,Description,,parent-slug-or-empty,0,true',
    []
  );

  async function exportProducts() {
    setExporting(true);
    try {
      const { data: cats } = await appClient.from('categories').select('id, slug');
      const catById = new Map((cats ?? []).map((c) => [c.id, c.slug]));
      const rows: Row[] = [];
      let from = 0;
      const pageSize = 1000;
      // paginate
      while (true) {
        const { data, error } = await appClient
          .from('products')
          .select('*')
          .order('sku')
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        for (const p of data) {
          rows.push({
            ...p,
            category_slug: p.category_id ? catById.get(p.category_id) ?? '' : '',
            tags: p.tags ?? [],
          });
        }
        if (data.length < pageSize) break;
        from += pageSize;
      }
      downloadFile(`products-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows, PRODUCT_COLUMNS));
      toast.success(`Exported ${rows.length} products`);
    } catch (e: any) {
      toast.error(`Export failed: ${e.message}`);
    } finally {
      setExporting(false);
    }
  }

  async function exportCategories() {
    setExporting(true);
    try {
      const { data, error } = await appClient.from('categories').select('*').order('sort_order');
      if (error) throw error;
      const byId = new Map((data ?? []).map((c) => [c.id, c.slug]));
      const rows = (data ?? []).map((c) => ({
        ...c,
        parent_slug: c.parent_id ? byId.get(c.parent_id) ?? '' : '',
      }));
      downloadFile(`categories-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows, CATEGORY_COLUMNS));
      toast.success(`Exported ${rows.length} categories`);
    } catch (e: any) {
      toast.error(`Export failed: ${e.message}`);
    } finally {
      setExporting(false);
    }
  }

  async function handleFile(f: File | null) {
    if (!f) return;
    const text = await f.text();
    setImportText(text);
  }

  async function importProducts() {
    setImporting(true);
    setImportLog([]);
    const log: string[] = [];
    try {
      const parsed = Papa.parse<Row>(importText, { header: true, skipEmptyLines: true });
      if (parsed.errors.length) log.push(`Parse warnings: ${parsed.errors.length}`);
      const rows = parsed.data;
      log.push(`Parsed ${rows.length} rows`);
      const { data: cats } = await appClient.from('categories').select('id, slug');
      const catBySlug = new Map((cats ?? []).map((c) => [c.slug, c.id]));

      let ok = 0, fail = 0;
      const batch: Row[] = [];
      for (const r of rows) {
        if (!r.sku || !r.name) { fail++; log.push(`Skip: missing sku/name`); continue; }
        const record: Row = {
          sku: String(r.sku).trim(),
          name: String(r.name).trim(),
          slug: r.slug?.trim() || slugify(r.name),
          short_description: r.short_description || null,
          description: r.description || null,
          price_zar: parseNum(r.price_zar) ?? 0,
          compare_at_price_zar: parseNum(r.compare_at_price_zar),
          cost_price_zar: parseNum(r.cost_price_zar),
          stock_quantity: parseNum(r.stock_quantity) ?? 0,
          low_stock_threshold: parseNum(r.low_stock_threshold) ?? 5,
          allow_backorder: parseBool(r.allow_backorder, false),
          weight_kg: parseNum(r.weight_kg),
          length_cm: parseNum(r.length_cm),
          width_cm: parseNum(r.width_cm),
          height_cm: parseNum(r.height_cm),
          brand: r.brand || null,
          barcode: r.barcode || null,
          tags: parseTags(r.tags),
          meta_title: r.meta_title || null,
          meta_description: r.meta_description || null,
          primary_image_url: r.primary_image_url || null,
          is_featured: parseBool(r.is_featured, false),
          is_active: parseBool(r.is_active, true),
        };
        if (r.category_slug) {
          const cid = catBySlug.get(String(r.category_slug).trim());
          if (cid) record.category_id = cid;
          else log.push(`Row ${record.sku}: category "${r.category_slug}" not found`);
        }
        batch.push(record);
      }

      // Upsert in chunks
      const chunkSize = 100;
      for (let i = 0; i < batch.length; i += chunkSize) {
        const slice = batch.slice(i, i + chunkSize);
        const { error } = await appClient.from('products').upsert(slice as any, { onConflict: 'sku' });
        if (error) {
          fail += slice.length;
          log.push(`Chunk ${i}: ${error.message}`);
        } else {
          ok += slice.length;
        }
      }
      log.push(`Done. Upserted ${ok}, failed ${fail}`);
      toast.success(`Imported ${ok} products`);
    } catch (e: any) {
      log.push(`Error: ${e.message}`);
      toast.error(e.message);
    } finally {
      setImportLog(log);
      setImporting(false);
    }
  }

  async function importCategories() {
    setImporting(true);
    setImportLog([]);
    const log: string[] = [];
    try {
      const parsed = Papa.parse<Row>(importText, { header: true, skipEmptyLines: true });
      const rows = parsed.data;
      log.push(`Parsed ${rows.length} rows`);
      // Two-pass: insert without parents, then update parents
      const { data: existing } = await appClient.from('categories').select('id, slug');
      const bySlug = new Map((existing ?? []).map((c) => [c.slug, c.id]));

      let ok = 0;
      const records = rows.filter((r) => r.slug && r.name).map((r) => ({
        slug: String(r.slug).trim(),
        name: String(r.name).trim(),
        description: r.description || null,
        image_url: r.image_url || null,
        sort_order: parseNum(r.sort_order) ?? 0,
        is_active: parseBool(r.is_active, true),
      }));
      for (let i = 0; i < records.length; i += 100) {
        const slice = records.slice(i, i + 100);
        const { error } = await appClient.from('categories').upsert(slice, { onConflict: 'slug' });
        if (error) log.push(`Chunk ${i}: ${error.message}`);
        else ok += slice.length;
      }

      // Refresh bySlug
      const { data: refreshed } = await appClient.from('categories').select('id, slug');
      const map2 = new Map((refreshed ?? []).map((c) => [c.slug, c.id]));

      // Second pass: parent_slug
      const parentUpdates = rows.filter((r) => r.parent_slug && r.slug);
      for (const r of parentUpdates) {
        const pid = map2.get(String(r.parent_slug).trim());
        const cid = map2.get(String(r.slug).trim());
        if (pid && cid) {
          const { error } = await appClient.from('categories').update({ parent_id: pid }).eq('id', cid);
          if (error) log.push(`Parent ${r.slug}: ${error.message}`);
        }
      }
      log.push(`Upserted ${ok} categories`);
      toast.success(`Imported ${ok} categories`);
    } catch (e: any) {
      log.push(`Error: ${e.message}`);
      toast.error(e.message);
    } finally {
      setImportLog(log);
      setImporting(false);
    }
  }

  async function applyImageMap() {
    setImgBusy(true);
    try {
      const parsed = Papa.parse<Row>(imgCsv, { header: true, skipEmptyLines: true });
      let ok = 0, fail = 0;
      for (const r of parsed.data) {
        const sku = r.sku?.trim();
        const url = r.primary_image_url?.trim();
        if (!sku || !url) { fail++; continue; }
        const { error } = await appClient.from('products').update({ primary_image_url: url }).eq('sku', sku);
        if (error) fail++; else ok++;
      }
      toast.success(`Updated ${ok} images (${fail} failed)`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setImgBusy(false);
    }
  }

  function detectSku(fileName: string, skus: string[]): string | null {
    // Support "SKU.ext", "SKU-2.ext", "SKU_3.ext", or "SKU/anything.ext" (webkitRelativePath)
    const parts = fileName.split('/');
    // Try folder name first
    if (parts.length > 1 && skus.includes(parts[0])) return parts[0];
    const base = parts[parts.length - 1];
    const noExt = base.replace(/\.[^.]+$/, '');
    if (skus.includes(noExt)) return noExt;
    // Longest SKU that is a prefix followed by non-alphanumeric (or end)
    const candidates = skus
      .filter((s) => noExt === s || noExt.startsWith(s + '-') || noExt.startsWith(s + '_') || noExt.startsWith(s + ' '))
      .sort((a, b) => b.length - a.length);
    return candidates[0] ?? null;
  }

  async function uploadImages(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadBusy(true);
    const log: string[] = [];
    try {
      // Load all SKUs + existing images for matching
      const skuMap = new Map<string, { id: string; images: string[]; primary_image_url: string | null }>();
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await appClient
          .from('products')
          .select('id, sku, images, primary_image_url')
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        for (const p of data) {
          skuMap.set(p.sku, {
            id: p.id,
            images: Array.isArray(p.images) ? (p.images as string[]) : [],
            primary_image_url: p.primary_image_url,
          });
        }
        if (data.length < pageSize) break;
        from += pageSize;
      }
      const skuList = Array.from(skuMap.keys());
      log.push(`Loaded ${skuList.length} products for matching`);

      // Group files by SKU
      const groups = new Map<string, File[]>();
      const unmatched: string[] = [];
      for (const file of Array.from(files)) {
        // Use webkitRelativePath when folder-uploaded
        const rel = (file as any).webkitRelativePath || file.name;
        const sku = detectSku(rel, skuList);
        if (!sku) { unmatched.push(rel); continue; }
        if (!groups.has(sku)) groups.set(sku, []);
        groups.get(sku)!.push(file);
      }
      if (unmatched.length) log.push(`Skipped ${unmatched.length} file(s) with no matching SKU: ${unmatched.slice(0, 5).join(', ')}${unmatched.length > 5 ? '…' : ''}`);

      let uploaded = 0, linked = 0, failed = 0;
      for (const [sku, list] of groups) {
        const info = skuMap.get(sku)!;
        const newUrls: string[] = [];
        // Sort files to keep deterministic order
        list.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        for (const file of list) {
          const ext = file.name.match(/\.[^.]+$/)?.[0] ?? '';
          const clean = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const path = `${sku}/${Date.now()}-${clean}${ext && !clean.endsWith(ext) ? ext : ''}`;
          const { data: uploadedFile, error: upErr } = await appClient.storage
            .from('product-images')
            .upload(path, file, { upsert: true, contentType: file.type || undefined });
          if (upErr) { failed++; log.push(`${sku} / ${file.name}: ${upErr.message}`); continue; }
          if (!uploadedFile?.publicUrl) { failed++; log.push(`${sku} / ${file.name}: Manus Storage did not return an image URL`); continue; }
          newUrls.push(uploadedFile.publicUrl);
          uploaded++;
        }
        if (newUrls.length === 0) continue;

        const merged = Array.from(new Set([...(info.images ?? []), ...newUrls]));
        const primary = info.primary_image_url && info.primary_image_url.length > 0
          ? info.primary_image_url
          : newUrls[0];
        const { error: updErr } = await appClient
          .from('products')
          .update({ images: merged as any, primary_image_url: primary })
          .eq('id', info.id);
        if (updErr) { log.push(`${sku}: db update failed - ${updErr.message}`); failed++; continue; }
        info.images = merged;
        info.primary_image_url = primary;
        linked++;
        log.push(`${sku}: +${newUrls.length} image(s), primary=${primary.split('/').pop()}`);
      }
      toast.success(`Uploaded ${uploaded} file(s) across ${linked} SKU(s)${failed ? `, ${failed} failed` : ''}`);
    } catch (e: any) {
      toast.error(e.message);
      log.push(`Error: ${e.message}`);
    } finally {
      setUploadLog(log);
      setUploadBusy(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">{tab === 'images' ? 'Product Image Folder' : 'Bulk Import & Edit'}</h1>
        <p className="text-muted-foreground">
          {tab === 'images'
            ? 'Upload a local product-image folder to Manus Storage. Files are matched by SKU and linked to product records in the Manus database.'
            : 'Manage products and categories in bulk via CSV. Upload images later by SKU-named files.'}
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export products</CardTitle>
              <CardDescription>Download all products as CSV. Edit and re-upload below.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2 flex-wrap">
              <Button onClick={exportProducts} disabled={exporting}>
                {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Export CSV
              </Button>
              <Button variant="outline" onClick={() => downloadFile('products-template.csv', productTemplate)}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Download template
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Import / update products</CardTitle>
              <CardDescription>
                Upsert by <code>sku</code>. Existing SKUs are updated; new ones are inserted.
                Columns: <code>{PRODUCT_COLUMNS.join(', ')}</code>. Tags use <code>|</code> or <code>,</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Upload CSV file</Label>
                <Input type="file" accept=".csv,text/csv" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
              </div>
              <div>
                <Label>Or paste CSV</Label>
                <Textarea rows={8} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="sku,name,slug,category_slug,..." />
              </div>
              <Button onClick={importProducts} disabled={importing || !importText.trim()}>
                {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Import products
              </Button>
              {importLog.length > 0 && (
                <pre className="mt-3 rounded bg-muted p-3 text-xs whitespace-pre-wrap max-h-64 overflow-auto">
                  {importLog.join('\n')}
                </pre>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export categories</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2 flex-wrap">
              <Button onClick={exportCategories} disabled={exporting}>
                {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Export CSV
              </Button>
              <Button variant="outline" onClick={() => downloadFile('categories-template.csv', categoryTemplate)}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Download template
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Import / update categories</CardTitle>
              <CardDescription>
                Upsert by <code>slug</code>. Columns: <code>{CATEGORY_COLUMNS.join(', ')}</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Upload CSV file</Label>
                <Input type="file" accept=".csv,text/csv" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
              </div>
              <div>
                <Label>Or paste CSV</Label>
                <Textarea rows={6} value={importText} onChange={(e) => setImportText(e.target.value)} />
              </div>
              <Button onClick={importCategories} disabled={importing || !importText.trim()}>
                {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Import categories
              </Button>
              {importLog.length > 0 && (
                <pre className="mt-3 rounded bg-muted p-3 text-xs whitespace-pre-wrap max-h-64 overflow-auto">
                  {importLog.join('\n')}
                </pre>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload to Manus Product Image Folder by SKU</CardTitle>
              <CardDescription>
                Drop many files at once. Files are matched to products by filename:
                <br />• <code>DFA-001.jpg</code>, <code>DFA-001-2.jpg</code>, <code>DFA-001_front.png</code> all map to SKU <code>DFA-001</code>.
                <br />• Or upload a folder named after the SKU (e.g. <code>DFA-001/hero.jpg</code>).
                <br />All images are stored under the Manus Storage <code>product-images/&lt;SKU&gt;/</code> folder and appended to the product gallery. The primary image is set to the first upload if none exists.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <Label>Select files</Label>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    disabled={uploadBusy}
                    onChange={(e) => uploadImages(e.target.files)}
                  />
                </div>
                <div>
                  <Label>Or upload folders</Label>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    disabled={uploadBusy}
                    // @ts-expect-error - non-standard attributes for folder picker
                    webkitdirectory=""
                    directory=""
                    onChange={(e) => uploadImages(e.target.files)}
                  />
                </div>
              </div>
              {uploadBusy && <div className="flex items-center text-sm"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…</div>}
              {uploadLog.length > 0 && (
                <pre className="rounded bg-muted p-3 text-xs whitespace-pre-wrap max-h-64 overflow-auto">
                  {uploadLog.join('\n')}
                </pre>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bulk set image URLs</CardTitle>
              <CardDescription>
                CSV with columns <code>sku,primary_image_url</code>. Useful when images are hosted elsewhere.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={6}
                value={imgCsv}
                onChange={(e) => setImgCsv(e.target.value)}
                placeholder={'sku,primary_image_url\nDFA-001,https://…'}
              />
              <Button onClick={applyImageMap} disabled={imgBusy || !imgCsv.trim()}>
                {imgBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                Apply
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
