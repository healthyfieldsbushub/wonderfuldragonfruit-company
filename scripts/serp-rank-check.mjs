/**
 * Live keyword ranking check — top 10 product keywords in South Africa via SerpAPI.
 * Measures where wonderfuldragonfruit.company ranks for each keyword and compares
 * against competitors (Livingseeds, dragonfruit-sa). Saves results to
 * docs/serp-rankings-<date>.json and prints a prioritized action plan.
 *
 * Uses ~10 SerpAPI credits. Run: node scripts/serp-rank-check.mjs
 */
import fs from "fs";
import crypto from "crypto";

const SITE_VARIANTS = ["wonderfuldragonfruit.company", "www.wonderfuldragonfruit.company"];
const COMPETITORS = {
  "livingseeds.co.za": "Livingseeds",
  "dragonfruit-sa.co.za": "Dragon Fruit SA",
  "dragonfruit-sa.com": "Dragon Fruit SA",
};
const KEYWORDS = [
  "dragon fruit for sale south africa",
  "dragon fruit cuttings south africa",
  "dragon fruit plants for sale",
  "buy dragon fruit plant",
  "pitaya plants south africa",
  "dragon fruit nursery south africa",
  "dragon fruit cuttings for sale",
  "red dragon fruit plant for sale",
  "yellow dragon fruit south africa",
  "dragon fruit farming south africa",
];

function serpApiUrl(params) {
  const apiKey = process.env.GOOGLE_SERPAPI || process.env.GOOGLE_SERP_API;
  if (!apiKey) throw new Error("SerpAPI not configured");
  const search = new URLSearchParams({ engine: "google", gl: "za", hl: "en", num: "20", ...params });
  return `https://serpapi.com/search?${search.toString()}&api_key=${apiKey}`;
}

function hostOf(link) {
  try { return new URL(link).hostname.replace(/^www\./, ""); } catch { return ""; }
}

async function checkKeyword(keyword) {
  const res = await fetch(serpApiUrl({ q: keyword }));
  if (!res.ok) return { keyword, error: `HTTP ${res.status}`, competitors: [] };
  const data = await res.json();
  const organic = Array.isArray(data.organic_results) ? data.organic_results : [];
  const byHost = new Map();
  organic.forEach((r, i) => {
    const h = hostOf(r.link || "");
    if (h && !byHost.has(h)) byHost.set(h, { rank: r.position ?? i + 1, title: r.title || "" });
  });
  const findRank = (hosts) => {
    for (const h of hosts) {
      const hit = byHost.get(h);
      if (hit) return hit;
    }
    return null;
  };
  const us = findRank(SITE_VARIANTS.map((h) => h.replace(/^www\./, "")));
  const competitorRows = Object.entries(COMPETITORS).map(([host, label]) => {
    const hit = byHost.get(host);
    return { host, label, rank: hit?.rank ?? null, title: hit?.title ?? null };
  });
  return {
    keyword,
    totalResults: data.search_information?.total_results ?? 0,
    ourRank: us?.rank ?? null,
    ourTitle: us?.title ?? null,
    competitors: competitorRows,
    top3: organic.slice(0, 3).map((r) => ({ rank: r.position, host: hostOf(r.link || ""), title: r.title || "" })),
  };
}

const results = [];
  for (const kw of KEYWORDS) {
  try {
    const r = await checkKeyword(kw);
    results.push(r);
    console.log(`${r.error ? "ERR " : "OK  "} ${kw} — our rank: ${r.ourRank ?? "not in top 20"}`);
    if (r.error) console.log(`     reason: ${r.error}`);
    if (r.top3?.length) console.log(`     top3: ${r.top3.map((t) => `#${t.rank} ${t.host}`).join(" | ")}`);
  } catch (e) {
    results.push({ keyword: kw, error: e.message, competitors: [] });
    console.log(`ERR  ${kw} — ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 400));
}

const ranked = results.filter((r) => typeof r.ourRank === "number");
const unranked = results.filter((r) => typeof r.ourRank !== "number");
const ourWins = results.filter((r) => r.competitors.every((c) => c.rank === null || (r.ourRank !== null && r.ourRank <= c.rank))).length;
console.log(`\nSummary: ${ranked.length}/${results.length} keywords ranked; winning vs all competitors on ${ourWins}.`);

// Prioritized action plan from real data only.
const plan = [];
for (const r of unranked) plan.push({ priority: 1, keyword: r.keyword, action: "Not ranking in top 20 — build a dedicated product/category page targeting this keyword with on-page title, H1, and FAQ content." });
for (const r of ranked.filter((r) => r.ourRank > 5)) plan.push({ priority: 2, keyword: r.keyword, action: `Ranking #${r.ourRank} — improve internal links, add FAQ schema, and enrich the target page's content depth to push into top 5.` });
for (const r of ranked.filter((r) => r.ourRank >= 2 && r.ourRank <= 5)) plan.push({ priority: 3, keyword: r.keyword, action: `Ranking #${r.ourRank} — add product schema markup and buy-intent content blocks to reach position 1.` });
for (const r of ranked.filter((r) => r.ourRank === 1)) plan.push({ priority: 4, keyword: r.keyword, action: "Ranking #1 — defend: refresh content quarterly, keep earning reviews and new backlinks." });
if (!plan.length) plan.push({ priority: 5, keyword: "—", action: "All checked keywords already rank well; focus on long-tail expansion and content freshness." });

const out = {
  generatedAt: new Date().toISOString(),
  market: "South Africa (gl=za, hl=en)",
  keywordsChecked: KEYWORDS.length,
  ourRankings: results.map((r) => ({ keyword: r.keyword, rank: r.ourRank ?? null, totalResults: r.totalResults ?? null })),
  competitorComparison: results.map((r) => ({ keyword: r.keyword, our: r.ourRank ?? null, competitors: r.competitors })),
  actionPlan: plan,
};
const date = new Date().toISOString().slice(0, 10);
const file = `docs/serp-rankings-${date}.json`;
fs.writeFileSync(file, JSON.stringify(out, null, 2));
console.log(`saved: ${file}`);
fs.writeFileSync(file.replace(".json", "-action-plan.md"),
  `# SEO Action Plan — ${date}\n\nBased on ${KEYWORDS.length} live SerpAPI checks (South Africa, top 20).\n\n` +
  plan.map((p) => `- **P${p.priority} [${p.keyword}]** — ${p.action}`).join("\n") + "\n");
console.log(`saved: ${file.replace(".json", "-action-plan.md")}`);
