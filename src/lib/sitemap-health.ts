/**
 * Live sitemap health-check.
 * Verifies https://www.wonderfuldragonfruit.company/sitemap.xml is reachable, returns
 * a 200 with an XML content-type, parses as well-formed XML, and contains a
 * non-empty <urlset> with valid <loc> entries on the canonical host.
 */

export const SITEMAP_URL = 'https://www.wonderfuldragonfruit.company/sitemap.xml';
const CANONICAL_HOST = 'wonderfuldragonfruit.company';

export interface SitemapCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface SitemapHealthResult {
  ok: boolean;
  url: string;
  status: number | null;
  contentType: string | null;
  urlCount: number;
  durationMs: number;
  checks: SitemapCheck[];
  error?: string;
}

export async function checkSitemapHealth(
  url: string = SITEMAP_URL,
): Promise<SitemapHealthResult> {
  const start = performance.now();
  const checks: SitemapCheck[] = [];
  let status: number | null = null;
  let contentType: string | null = null;
  let urlCount = 0;

  try {
    const res = await fetch(url, { method: 'GET', cache: 'no-store' });
    status = res.status;
    contentType = res.headers.get('content-type');

    checks.push({
      name: 'HTTP 200 OK',
      passed: res.ok,
      detail: `Received status ${res.status}`,
    });

    checks.push({
      name: 'XML content-type',
      passed: !!contentType && /xml/i.test(contentType),
      detail: contentType ?? 'missing',
    });

    const xml = await res.text();

    checks.push({
      name: 'Non-empty body',
      passed: xml.trim().length > 0,
      detail: `${xml.length} bytes`,
    });

    // Well-formed XML check using DOMParser when available (browser/jsdom).
    let parserError = '';
    let docOk = false;
    if (typeof DOMParser !== 'undefined') {
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      const errEl = doc.querySelector('parsererror');
      docOk = !errEl;
      if (errEl) parserError = errEl.textContent ?? 'unknown parser error';
    } else {
      // Fallback: structural sanity (declaration + urlset).
      docOk = /<\?xml/i.test(xml) && /<urlset[\s>]/i.test(xml);
    }
    checks.push({
      name: 'Well-formed XML',
      passed: docOk,
      detail: docOk ? 'parsed cleanly' : parserError || 'malformed XML',
    });

    checks.push({
      name: 'Sitemap namespace',
      passed: xml.includes('http://www.sitemaps.org/schemas/sitemap/0.9'),
      detail: 'sitemaps.org/schemas/sitemap/0.9',
    });

    const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map(m => m[1]);
    urlCount = locs.length;

    checks.push({
      name: '≥1 <loc> entry',
      passed: urlCount > 0,
      detail: `${urlCount} URLs`,
    });

    const offHost = locs.filter(l => {
      try {
        return new URL(l).hostname !== CANONICAL_HOST;
      } catch {
        return true;
      }
    });
    checks.push({
      name: 'All URLs on canonical host',
      passed: offHost.length === 0,
      detail: offHost.length === 0
        ? CANONICAL_HOST
        : `${offHost.length} off-host entries (e.g. ${offHost[0]})`,
    });

    checks.push({
      name: 'Homepage present in sitemap',
      passed: locs.some(l => l === `https://${CANONICAL_HOST}/` || l === `https://${CANONICAL_HOST}`),
      detail: `https://${CANONICAL_HOST}/`,
    });

    return {
      ok: checks.every(c => c.passed),
      url,
      status,
      contentType,
      urlCount,
      durationMs: Math.round(performance.now() - start),
      checks,
    };
  } catch (err) {
    return {
      ok: false,
      url,
      status,
      contentType,
      urlCount,
      durationMs: Math.round(performance.now() - start),
      checks,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
