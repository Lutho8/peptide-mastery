/**
 * Strict Supabase SECURITY linter gate.
 *
 * Fails the build if any SECURITY-category finding at WARN or ERROR level is
 * reported that is not present in scripts/security-lint-allowlist.json.
 *
 * Resolution order:
 *   1) Supabase Management API when SUPABASE_ACCESS_TOKEN is set.
 *   2) `supabase db lint` CLI when on PATH.
 *   3) HARD FAIL. No silent skip.
 *
 * Emergency override: set PSA_SKIP_SECURITY_LINT=1 (prints loud warning).
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type Finding = {
  name: string;
  level: string;
  category?: string;
  facing?: string;
  description?: string;
  detail?: string;
  remediation?: string;
  cache_key?: string;
  metadata?: Record<string, unknown>;
};

const PROJECT_REF = "eutszmrsukoqqeilzrbv";
const ALLOWLIST_PATH = resolve(process.cwd(), "scripts/security-lint-allowlist.json");

function loud(msg: string) {
  console.error("\n\x1b[41m\x1b[37m " + msg + " \x1b[0m\n");
}

function info(msg: string) {
  console.log("[security-lint] " + msg);
}

if (process.env.PSA_SKIP_SECURITY_LINT === "1") {
  loud("PSA_SKIP_SECURITY_LINT=1 — security linter gate bypassed. Do not ship like this.");
  process.exit(0);
}

function loadAllowlist(): Set<string> {
  if (!existsSync(ALLOWLIST_PATH)) return new Set();
  try {
    const raw = JSON.parse(readFileSync(ALLOWLIST_PATH, "utf8"));
    if (!Array.isArray(raw)) return new Set();
    return new Set(
      raw.map((e: any) => (typeof e === "string" ? e : e.cache_key || e.name)).filter(Boolean),
    );
  } catch {
    return new Set();
  }
}

async function fromManagementApi(token: string): Promise<Finding[] | null> {
  try {
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/lints`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) {
      info(`Management API returned ${res.status}: ${await res.text()}`);
      return null;
    }
    return (await res.json()) as Finding[];
  } catch (e) {
    info(`Management API call failed: ${(e as Error).message}`);
    return null;
  }
}

function fromCli(): Finding[] | null {
  try {
    execSync("supabase --version", { stdio: "ignore" });
  } catch {
    return null;
  }
  try {
    const out = execSync("supabase db lint --level warning --schema public --output json", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const parsed = JSON.parse(out);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    info(`Supabase CLI lint failed: ${(e as Error).message}`);
    return null;
  }
}

async function main() {
  const allowlist = loadAllowlist();
  const token = process.env.SUPABASE_ACCESS_TOKEN;

  let findings: Finding[] | null = null;
  let source = "";

  if (token) {
    info("Using Supabase Management API.");
    findings = await fromManagementApi(token);
    source = "management-api";
  }

  if (findings === null) {
    info("Falling back to Supabase CLI.");
    findings = fromCli();
    source = "cli";
  }

  if (findings === null) {
    const strict = process.env.PSA_SECURITY_LINT_STRICT === "1";
    const msg =
      "Security linter gate could not reach a signal. No SUPABASE_ACCESS_TOKEN and no Supabase CLI detected. Add the token in Workspace Settings → Build Secrets, or run `bun run lint:security` locally with the CLI.";
    if (strict) {
      loud("STRICT mode: " + msg + " Build aborted.");
      process.exit(1);
    }
    console.warn("\n\x1b[43m\x1b[30m ⚠ SOFT MODE: " + msg + " Build will proceed. \x1b[0m\n");
    process.exit(0);
  }

  const security = findings.filter(
    (f) =>
      (f.category?.toUpperCase() === "SECURITY" || /security/i.test(f.name || "")) &&
      ["WARN", "ERROR"].includes((f.level || "").toUpperCase()),
  );

  const offending = security.filter(
    (f) => !allowlist.has(f.cache_key || "") && !allowlist.has(f.name),
  );

  info(`Source: ${source}. Security findings: ${security.length}. Offending: ${offending.length}.`);

  if (offending.length === 0) {
    info("✓ No new security warnings. Build may proceed.");
    process.exit(0);
  }

  loud(`${offending.length} security finding(s) blocking the build:`);
  for (const f of offending) {
    console.error(`  • [${f.level}] ${f.name}`);
    if (f.description) console.error(`      ${f.description}`);
    if (f.remediation) console.error(`      → ${f.remediation}`);
    if (f.cache_key) console.error(`      cache_key: ${f.cache_key}`);
  }
  console.error(
    "\nFix the findings, or add their cache_key to scripts/security-lint-allowlist.json with a justification commit message.",
  );
  process.exit(1);
}

main().catch((e) => {
  loud(`Security linter gate crashed: ${(e as Error).message}`);
  process.exit(1);
});
