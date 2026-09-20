import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
const packageLock = JSON.parse(
  readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"),
);

const exception = {
  expiresAt: "2026-10-16",
  reason:
    "Prisma CLI 7.10.0 pins these packages. HanGo uses PostgreSQL, does not import mysql2 or deepmerge-ts, and Prisma is a development dependency.",
  packages: {
    "@prisma/config": {
      node: "node_modules/@prisma/config",
      version: "7.10.0",
    },
    "deepmerge-ts": {
      node: "node_modules/deepmerge-ts",
      version: "7.1.5",
    },
    mysql2: {
      node: "node_modules/mysql2",
      version: "3.15.3",
    },
    prisma: {
      node: "node_modules/prisma",
      version: "7.10.0",
    },
  },
};

function fail(message) {
  console.error(`[security:audit] FAILED: ${message}`);
  process.exit(1);
}

if (!packageJson.devDependencies?.prisma || packageJson.dependencies?.prisma) {
  fail("Prisma must remain a development-only root dependency.");
}

if (Date.now() >= Date.parse(`${exception.expiresAt}T00:00:00Z`)) {
  fail(
    `The temporary Prisma dependency exception expired on ${exception.expiresAt}. Re-evaluate or remove it.`,
  );
}

const npmCli = process.env.npm_execpath;
if (!npmCli) {
  fail("Run this check through `npm run security:audit`.");
}

const audit = spawnSync(process.execPath, [npmCli, "audit", "--json"], {
  cwd: projectRoot,
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
});

if (audit.error) {
  fail(`npm audit could not start: ${audit.error.message}`);
}

let report;
try {
  report = JSON.parse(audit.stdout);
} catch {
  if (audit.stderr) {
    console.error(audit.stderr.trim());
  }
  fail("npm audit did not return a valid JSON report.");
}

const severityRank = {
  info: 0,
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4,
};
const blocking = Object.entries(report.vulnerabilities ?? {}).filter(
  ([, finding]) => severityRank[finding.severity] >= severityRank.high,
);
const unexpected = [];

for (const [name, finding] of blocking) {
  const allowed = exception.packages[name];
  if (!allowed) {
    unexpected.push(`${name} (${finding.severity})`);
    continue;
  }

  const installed = packageLock.packages?.[allowed.node];
  const nodes = Array.isArray(finding.nodes) ? finding.nodes : [];
  if (
    installed?.version !== allowed.version ||
    nodes.length !== 1 ||
    nodes[0] !== allowed.node
  ) {
    unexpected.push(
      `${name} changed scope/version (expected ${allowed.version} at ${allowed.node})`,
    );
  }
}

if (unexpected.length > 0) {
  fail(`unexpected high/critical findings: ${unexpected.join(", ")}`);
}

if (blocking.length === 0) {
  console.log("[security:audit] PASSED: no high or critical vulnerabilities.");
  process.exit(0);
}

console.warn(
  `[security:audit] PASSED with ${blocking.length} temporary Prisma CLI findings. Exception expires ${exception.expiresAt}.`,
);
console.warn(`[security:audit] ${exception.reason}`);
