import { describe, it, expect, beforeAll, vi, afterAll } from 'vitest';
import { checkSitemapHealth, SITEMAP_URL } from '../sitemap-health';

const VALID_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://www.wonderfuldragonfruit.company/</loc></url>
  <url><loc>https://www.wonderfuldragonfruit.company/products</loc></url>
  <url><loc>https://www.wonderfuldragonfruit.company/blog</loc></url>
</urlset>`;

describe('checkSitemapHealth', () => {
  const realFetch = global.fetch;

  beforeAll(() => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === SITEMAP_URL) {
        return new Response(VALID_XML, {
          status: 200,
          headers: { 'Content-Type': 'application/xml' },
        });
      }
      if (url.endsWith('/missing.xml')) {
        return new Response('not found', { status: 404 });
      }
      if (url.endsWith('/wrong-host.xml')) {
        const xml = `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://other.example.com/</loc></url></urlset>`;
        return new Response(xml, { status: 200, headers: { 'Content-Type': 'application/xml' } });
      }
      throw new Error('network error');
    }));
  });

  afterAll(() => {
    vi.stubGlobal('fetch', realFetch);
  });

  it('passes all checks for a healthy sitemap', async () => {
    const result = await checkSitemapHealth();
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.urlCount).toBe(3);
    expect(result.checks.find(c => c.name === 'HTTP 200 OK')?.passed).toBe(true);
    expect(result.checks.find(c => c.name === 'Well-formed XML')?.passed).toBe(true);
    expect(result.checks.find(c => c.name === 'All URLs on canonical host')?.passed).toBe(true);
    expect(result.checks.find(c => c.name === 'Homepage present in sitemap')?.passed).toBe(true);
  });

  it('fails on 404', async () => {
    const result = await checkSitemapHealth('https://www.wonderfuldragonfruit.company/missing.xml');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
    expect(result.checks.find(c => c.name === 'HTTP 200 OK')?.passed).toBe(false);
  });

  it('fails when URLs are on the wrong host', async () => {
    const result = await checkSitemapHealth('https://www.wonderfuldragonfruit.company/wrong-host.xml');
    expect(result.checks.find(c => c.name === 'All URLs on canonical host')?.passed).toBe(false);
  });

  it('fails gracefully on network error', async () => {
    const result = await checkSitemapHealth('https://www.wonderfuldragonfruit.company/network-fail.xml');
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
