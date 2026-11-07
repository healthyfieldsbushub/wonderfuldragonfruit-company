import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// The Bing verification token is supplied via the BING_SITE_VERIFICATION_TOKEN
// environment variable; tests are skipped when it is not configured.
const REQUIRED_BING_TOKEN = process.env.BING_SITE_VERIFICATION_TOKEN ?? "";

const testFn = REQUIRED_BING_TOKEN ? it : it.skip;

describe("Bing site verification (index.html)", () => {
  let html = "";

  beforeAll(() => {
    html = readFileSync(resolve(process.cwd(), "index.html"), "utf-8");
  });

  testFn("includes the exact required msvalidate.01 meta tag", () => {
    const expected = `<meta name="msvalidate.01" content="${REQUIRED_BING_TOKEN}" />`;
    expect(html).toContain(expected);
  });

  it("contains exactly one msvalidate.01 meta tag (no duplicates)", () => {
    const matches = html.match(/<meta\s+name=["']msvalidate\.01["'][^>]*>/gi) ?? [];
    expect(matches).toHaveLength(1);
  });

  it("places the Bing meta tag inside <head>", () => {
    const headMatch = html.match(/<head[\s\S]*?<\/head>/i);
    expect(headMatch).not.toBeNull();
    expect(headMatch![0]).toContain(REQUIRED_BING_TOKEN);
  });

  it("does not contain stale/legacy Bing tokens", () => {
    expect(html).not.toContain("F2E39B63B7AB1E9A4C3C65121BD3CDFF");
  });
});
