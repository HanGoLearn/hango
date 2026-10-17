import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  evaluateAuditReport,
  exceptionExpiry,
} from "./dependency-audit-policy.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
const lock = JSON.parse(
  readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"),
);
function fail(message) {
  console.error(`[security:audit] FAILED: ${message}`);
  process.exit(1);
}
const npmCli = process.env.npm_execpath;
if (!npmCli) fail("Run this check through npm run security:audit.");
function audit(extraArgs = []) {
  const result = spawnSync(
    process.execPath,
    [
      npmCli,
      "audit",
      "--json",
      "--fetch-retries=0",
      "--fetch-timeout=30000",
      ...extraArgs,
    ],
    {
      cwd: projectRoot,
      encoding: "utf8",
      timeout: 60000,
      maxBuffer: 20 * 1024 * 1024,
    },
  );
  if (result.error || ![0, 1].includes(result.status))
    fail("npm audit did not finish successfully.");
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    fail("npm audit did not return valid JSON.");
  }
  return report;
}
// No exception is allowed in the runtime dependency set, at any severity.
const runtime = audit(["--omit=dev"]);
if (
  runtime?.error ||
  runtime?.auditReportVersion !== 2 ||
  !runtime.vulnerabilities ||
  !runtime.metadata?.vulnerabilities ||
  Object.keys(runtime.vulnerabilities).length !== 0 ||
  runtime.metadata.vulnerabilities.total !== 0
)
  fail("Runtime audit must report zero vulnerabilities.");
const verdict = evaluateAuditReport(audit(), manifest, lock);
if (verdict.blocked.length) fail(verdict.blocked.join("; "));
// This single-project config must not enable glob input to the affected parser.
const config = (await import("../eslint.config.mjs")).default;
if (
  !Array.isArray(config) ||
  config.some((entry) => entry.settings?.next?.rootDir !== undefined)
)
  fail("ESLint rootDir glob inputs are not permitted under this exception.");
if (!verdict.accepted.length) {
  console.log(
    "[security:audit] PASSED: runtime zero; no high/critical tooling findings.",
  );
} else {
  console.warn(
    `[security:audit] PASSED with owner-approved development-only braces exception (${verdict.accepted.length} chain findings). Runtime: zero vulnerabilities. Expires ${exceptionExpiry}.`,
  );
}
