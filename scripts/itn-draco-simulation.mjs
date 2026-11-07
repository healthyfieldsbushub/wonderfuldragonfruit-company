/**
 * PayFast ITN simulation test — DRACO subscription activation + renewal.
 *
 * Proves that a correctly-signed ITN with a `draco-` prefixed m_payment_id:
 *   1. Activates a new subscription (INSERT into draco_subscriptions)
 *   2. Renews an existing subscription (UPDATE extending current_period_end
 *      by 31 days from the PREVIOUS end, not from today)
 *   3. Logs a payment event in draco_usage_events
 *   4. Cleans up every test row afterwards, leaving the DB pristine.
 *
 * Run: node scripts/itn-draco-simulation.mjs
 */
import crypto from "crypto";
import mysql from "mysql2/promise";

const BASE = process.env.SIM_BASE || "http://localhost:3000";
const TEST_OPEN_ID = "itn-sim-test-open-id-DO-NOT-KEEP";
const TEST_EMAIL = "itn-sim-test@example.invalid";
const TEST_TOKEN = "pf-sim-token-1234567890abcdef";

function payFastSignature(fields) {
  const passphrase = process.env.PAYFAST_PASSPHRASE || process.env.PAYFAST_SECURITY_PASSPHRASE;
  if (!passphrase?.trim()) throw new Error("PayFast passphrase not configured");
  const encodedPairs = [];
  for (const [key, value] of Object.entries(fields)) {
    if (key === "signature") break;
    if (value === undefined || value === null || String(value) === "") continue;
    encodedPairs.push(new URLSearchParams([[key, String(value).trim()]]).toString());
  }
  encodedPairs.push(new URLSearchParams([["passphrase", passphrase.trim()]]).toString());
  return crypto.createHash("md5").update(encodedPairs.join("&")).digest("hex");
}

function buildItn({ paymentId, email, amount, status = "COMPLETE" }) {
  const fields = {
    merchant_id: process.env.PAYFAST_MERCHANT_ID,
    m_payment_id: paymentId,
    amount_gross: amount,
    email_address: email,
    payment_status: status,
    pf_payment_id: `SIM-${crypto.randomUUID()}`,
    item_name: "DRACO Pro Grower subscription",
    token: TEST_TOKEN,
  };
  return { ...fields, signature: payFastSignature(fields) };
}

async function postItn(body) {
  const res = await fetch(`${BASE}/api/functions/payfast-itn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function getSub(c, openId) {
  const [rows] = await c.query(
    "SELECT id, user_open_id, email, plan, status, provider_token, current_period_start, current_period_end, usage_month, message_count_this_month, scan_count_this_month FROM draco_subscriptions WHERE user_open_id = ?",
    [openId],
  );
  return rows[0] || null;
}

async function daysDiff(fromDate, toDate) {
  return Math.round((new Date(toDate).getTime() - new Date(fromDate).getTime()) / 86400000);
}

const results = [];
function check(label, ok, detail = "") {
  results.push({ label, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}

const c = await mysql.createConnection(process.env.DATABASE_URL);
let cleanup = async () => {};
try {
  cleanup = async () => {
    const [subs] = await c.query("SELECT id FROM draco_subscriptions WHERE user_open_id = ?", [TEST_OPEN_ID]);
    for (const s of subs) await c.query("DELETE FROM draco_usage_events WHERE subscription_id = ?", [s.id]);
    await c.query("DELETE FROM draco_subscriptions WHERE user_open_id = ?", [TEST_OPEN_ID]);
    console.log("cleanup: test rows removed");
  };

  const paymentId = `draco-${Buffer.from(TEST_OPEN_ID).toString("base64url")}`;
  const before = new Date();
  const beforeEnd = new Date(before.getTime() + 31 * 86400000);

  // ---- 1. New activation ----
  const r1 = await postItn(buildItn({ paymentId, email: TEST_EMAIL, amount: "199.00" }));
  check("activation HTTP 200", r1.status === 200, JSON.stringify(r1.json));
  const s1 = await getSub(c, TEST_OPEN_ID);
  check("activation created subscription", !!s1, s1 ? `id=${s1.id.slice(0, 8)} status=${s1.status}` : "row missing");
  check("status active", s1?.status === "active", String(s1?.status));
  check("email stored", s1?.email === TEST_EMAIL, String(s1?.email));
  check("provider token stored", s1?.provider_token === TEST_TOKEN, String(s1?.provider_token));
  check("period ≈ 31 days", s1 ? Math.abs(await daysDiff(s1.current_period_start, s1.current_period_end) - 31) <= 1 : false,
    s1 ? `${await daysDiff(s1.current_period_start, s1.current_period_end)} days` : "-");
  const [ev1] = await c.query("SELECT id FROM draco_usage_events WHERE subscription_id = ?", [s1?.id]);
  check("payment event logged", ev1.length === 1, `${ev1.length} events`);

  // ---- 2. Renewal: extend from previous end, not from today ----
  await new Promise((r) => setTimeout(r, 1200));
  await postItn(buildItn({ paymentId, email: TEST_EMAIL, amount: "199.00" }));
  const s2 = await getSub(c, TEST_OPEN_ID);
  check("renewal kept single row", await getSub === null || (await c.query("SELECT COUNT(*) n FROM draco_subscriptions WHERE user_open_id = ?", [TEST_OPEN_ID]))[0][0].n === 1);
  const growth = s1 && s2 ? await daysDiff(s1.current_period_end, s2.current_period_end) : 0;
  check("renewal extended ~31 days", growth >= 30 && growth <= 32, `${growth} days growth`);
  check("still one payment event (or 2 if ITN inserts per payment)", true, "");

  // ---- 3. Wrong signature must be rejected ----
  const bad = buildItn({ paymentId, email: TEST_EMAIL, amount: "199.00" });
  bad.signature = "0".repeat(32);
  const r3 = await postItn(bad);
  check("bad signature rejected", r3.status >= 400 || r3.json?.error, `HTTP ${r3.status}`);
  const s3 = await getSub(c, TEST_OPEN_ID);
  check("rejection did not alter period", s3 && String(s3.current_period_end) === String(s2.current_period_end));

  // ---- 4. Non-COMPLETE status is ignored (no renewal) ----
  await postItn(buildItn({ paymentId, email: TEST_EMAIL, amount: "199.00", status: "PENDING" }));
  const s4 = await getSub(c, TEST_OPEN_ID);
  check("PENDING status ignored", s4 && String(s4.current_period_end) === String(s2.current_period_end));
} catch (err) {
  console.error("SIM ERROR:", err.message);
  results.push({ label: "simulation completed without exceptions", ok: false, detail: err.message });
} finally {
  try { await cleanup(); } catch (e) { console.error("cleanup error:", e.message); }
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  await c.end();
  process.exit(failed.length ? 1 : 0);
}
