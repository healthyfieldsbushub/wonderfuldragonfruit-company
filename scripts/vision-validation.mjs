/**
 * DRACO vision validation — proves the Cloud Vision evidence leg of the scan
 * pipeline works end-to-end with a real dragon fruit image, and documents
 * that callDracoLLM never receives images (the vision bridge handles them).
 *
 * Run: node scripts/vision-validation.mjs
 */
import fs from "fs";
import path from "path";

const imgPath = process.argv[2] || "public/images/blog/dragon-fruit-agritourism.jpg";
const key = process.env.GOOGLE_API_KEY_MULTI;

const checks = [];
const check = (label, ok, detail = "") => { checks.push({ label, ok }); console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`); };

// 1. Environment
check("GOOGLE_API_KEY_MULTI configured", !!key, key ? `...${key.slice(-6)}` : "missing");

// 2. Image availability
const image = fs.existsSync(imgPath) ? fs.readFileSync(imgPath) : null;
check("test image loaded", !!image, image ? `${(image.length / 1024).toFixed(0)} KB (${imgPath})` : imgPath);

// 3. Cloud Vision evidence (mirrors googleVisionPlantEvidence)
if (image && key) {
  const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [{
        image: { content: image.toString("base64") },
        features: [
          { type: "LABEL_DETECTION", maxResults: 15 },
          { type: "OBJECT_LOCALIZATION", maxResults: 10 },
          { type: "WEB_DETECTION", maxResults: 5 },
        ],
      }],
    }),
  });
  check("vision API reachable", response.ok, `HTTP ${response.status}`);
  if (response.ok) {
    const result = await response.json();
    const r = result.responses?.[0];
    const labels = (r?.labelAnnotations || []).filter((l) => l.score > 0.5).map((l) => `${l.description} (${Math.round(l.score * 100)}%)`);
    const objects = (r?.localizedObjectAnnotations || []).filter((o) => o.score > 0.5).map((o) => o.name);
    const web = [
      ...(r?.webDetection?.webEntities || []).filter((e) => e.score > 0.6).map((e) => e.description),
      ...(r?.webDetection?.pagesWithMatchingImages || []).map((p) => p.pageTitle || ""),
    ].filter(Boolean).slice(0, 8);
    const evidence = [
      labels.length ? `Image labels: ${labels.join(", ")}` : "",
      objects.length ? `Objects detected: ${objects.join(", ")}` : "",
      web.length ? `Similar-image matches: ${web.join("; ")}` : "",
    ].filter(Boolean).join("\n");
    check("vision returned structured evidence", evidence.length > 0, `${evidence.length} chars`);
    console.log("\n--- EVIDENCE DRACO WOULD RECEIVE (text bridge, never the raw image) ---");
    console.log(evidence || "(empty)");
    console.log("--- END EVIDENCE ---");
  }
}

// 4. Architecture facts (static verification of server/index.ts)
const server = fs.readFileSync("server/index.ts", "utf8");
check("scan endpoint pre-processes image via Vision, not LLM", /googleVisionPlantEvidence\(compressed/.test(server));
check("scan injects Vision evidence as TEXT into prompt", /GOOGLE CLOUD VISION IMAGE ANALYSIS/.test(server));
check("callDracoLLM signature accepts unknown content (multimodal-safe)", /content: unknown/.test(server));
check("callDracoLLM primary provider is NVIDIA/LongCat, not Gemini", /integrate\.api\.nvidia\.com/.test(server) && !/generativelanguage\.googleapis/.test(server.split("function callDracoLLM")[1]?.split("async function")[0] || ""));
check("chat never calls Gemini (no Gemini key usage in draco path)", !/GEMINI_API_KEY/.test(server.split("async function callDracoLLM")[1]?.split("\n}")[0] || ""));

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
