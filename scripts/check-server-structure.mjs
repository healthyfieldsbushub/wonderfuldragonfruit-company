#!/usr/bin/env node
/**
 * Server structure gate.
 *
 * Written after a real incident: the `app.put("/api/admin/ai/settings")` handler
 * lost its closing braces, which silently nested every route registered after it
 * (including the SPA catch-alls) inside that handler. The file was still valid
 * TypeScript, so both the build and `tsc` reported success, but at runtime none
 * of those routes were ever registered.
 *
 * This gate catches that class of fault directly:
 *
 *   1. Syntax        - TypeScript's own parser must produce zero diagnostics.
 *   2. Independent   - esbuild must also parse every file (a second parser).
 *   3. Route nesting - every route registration must be a top-level statement of
 *                      its module. A registration found inside a function is a
 *                      hard error when that function is itself a route handler,
 *                      because it can only run if the outer route is requested.
 *
 * Exits non-zero on any finding so it can gate a commit or CI run.
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const SERVER_DIR = path.resolve(process.cwd(), "server");
const ROUTE_METHODS = new Set(["get", "post", "put", "patch", "delete", "use", "all", "options", "head"]);
const ROUTE_OBJECTS = new Set(["app", "router", "apiRouter", "server"]);

const errors = [];
const warnings = [];

function listServerFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listServerFiles(full));
    else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) out.push(full);
  }
  return out.sort();
}

/** Recognises `app.get(...)`, `router.use(...)` and similar route registrations. */
function routeCallName(node) {
  if (!ts.isCallExpression(node)) return null;
  const callee = node.expression;
  if (!ts.isPropertyAccessExpression(callee)) return null;
  const method = callee.name.text;
  const target = callee.expression;
  if (!ROUTE_METHODS.has(method)) return null;
  if (!ts.isIdentifier(target) || !ROUTE_OBJECTS.has(target.text)) return null;
  return `${target.text}.${method}`;
}

function checkFile(file) {
  const rel = path.relative(process.cwd(), file);
  const source = fs.readFileSync(file, "utf8");

  // ---- 1. TypeScript parser diagnostics (real syntax checking) ----
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
  for (const diag of sf.parseDiagnostics ?? []) {
    const { line, character } = sf.getLineAndCharacterOfPosition(diag.start ?? 0);
    errors.push(
      `${rel}:${line + 1}:${character + 1} syntax: ${ts.flattenDiagnosticMessageText(diag.messageText, " ")}`,
    );
  }
  if ((sf.parseDiagnostics ?? []).length > 0) {
    // Parsing failed, so the structural walk below would be unreliable.
    return;
  }

  // ---- 2. Independent parser (esbuild) ----
  try {
    execFileSync(
      "npx",
      ["esbuild", rel, "--platform=node", "--format=esm", "--outfile=/dev/null", "--log-level=error"],
      { stdio: "pipe" },
    );
  } catch (error) {
    const detail = (error.stderr?.toString() || error.stdout?.toString() || error.message || "").trim();
    errors.push(`${rel} esbuild: ${detail.split("\n").slice(0, 6).join(" | ")}`);
  }

  // ---- 3. Route registrations must be top-level statements ----
  const topLevel = [];
  const nestedInHandler = [];
  const nestedInFunction = [];

  // Walk the module body, tracking whether we are inside a function and whether
  // that function is a route handler (i.e. an argument to a route call).
  const walk = (node, context) => {
    const name = routeCallName(node);
    if (name) {
      const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
      if (context.depth === 0) topLevel.push({ name, line: line + 1 });
      else if (context.inHandler) nestedInHandler.push({ name, line: line + 1, inside: context.owner });
      else nestedInFunction.push({ name, line: line + 1, inside: context.owner });
    }

    const children = node.getChildren(sf);
    for (const child of children) {
      // A route call's callback arguments are route handlers.
      const childIsHandler = Boolean(name) && child !== node.expression;
      const entersFunction =
        ts.isFunctionLike(child) || ts.isArrowFunction(child) || ts.isFunctionExpression(child);

      let nextContext = context;
      if (entersFunction) {
        nextContext = {
          depth: context.depth + 1,
          inHandler: context.inHandler || childIsHandler,
          owner: childIsHandler ? `${name} handler` : context.owner,
        };
      } else if (childIsHandler) {
        nextContext = { ...context, inHandler: true, owner: `${name} handler` };
      }
      walk(child, nextContext);
    }
  };

  walk(sf, { depth: 0, inHandler: false, owner: "module" });

  for (const found of nestedInHandler) {
    errors.push(
      `${rel}:${found.line} route ${found.name} is nested inside the ${found.inside} — ` +
        `it will never be registered at runtime`,
    );
  }
  for (const found of nestedInFunction) {
    warnings.push(
      `${rel}:${found.line} route ${found.name} is inside a function (${found.inside}); ` +
        `confirm that function is actually called`,
    );
  }

  return { rel, topLevel: topLevel.length, total: topLevel.length + nestedInHandler.length + nestedInFunction.length };
}

const files = listServerFiles(SERVER_DIR);
if (files.length === 0) {
  console.error("check-server-structure: no server/*.ts files found");
  process.exit(1);
}

let totalRoutes = 0;
for (const file of files) {
  const result = checkFile(file);
  if (result) totalRoutes += result.topLevel;
}

console.log(`check-server-structure: parsed ${files.length} file(s), ${totalRoutes} top-level route registration(s)`);

for (const warning of warnings) console.log(`  warn  ${warning}`);

if (errors.length > 0) {
  console.error("");
  for (const error of errors) console.error(`  ERROR ${error}`);
  console.error(`\ncheck-server-structure: FAILED with ${errors.length} problem(s)`);
  process.exit(1);
}

console.log("check-server-structure: OK");
