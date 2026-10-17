// Owner-approved exception: only GHSA-vfj7-8cjw-p6xm in development tooling.
// Inclusive through 2026-10-23 in America/Bogota.
export const exceptionExpiry = "2026-10-24T00:00:00-05:00";
export const advisoryUrl = "https://github.com/advisories/GHSA-vfj7-8cjw-p6xm";
export const toolingChain = {
  "eslint-config-next": { version: "16.3.8", via: "@next/eslint-plugin-next" },
  "@next/eslint-plugin-next": { version: "16.3.8", via: "fast-glob" },
  "fast-glob": { version: "3.3.1", via: "micromatch" },
  micromatch: { version: "4.0.8", via: "braces" },
  braces: { version: "3.0.3", via: null },
};

export function evaluateAuditReport(report, manifest, lock, now = Date.now()) {
  const blocked = [];
  const accepted = [];
  if (
    report?.error ||
    report?.auditReportVersion !== 2 ||
    !report.vulnerabilities ||
    typeof report.vulnerabilities !== "object" ||
    !report.metadata?.vulnerabilities
  )
    return { blocked: ["Invalid audit report"], accepted };
  if (!manifest.devDependencies?.prisma || manifest.dependencies?.prisma)
    blocked.push("Prisma must remain development-only");
  if (
    !manifest.devDependencies?.["eslint-config-next"] ||
    manifest.dependencies?.["eslint-config-next"]
  )
    blocked.push("ESLint must remain development-only");
  for (const [name, finding] of Object.entries(report.vulnerabilities)) {
    if (
      !["info", "low", "moderate", "high", "critical"].includes(
        finding.severity,
      )
    ) {
      blocked.push(`${name}: unknown severity`);
      continue;
    }
    if (!["high", "critical"].includes(finding.severity)) continue;
    const allowed = toolingChain[name];
    const node = `node_modules/${name}`;
    const installed = lock.packages?.[node];
    if (
      !allowed ||
      finding.severity !== "high" ||
      now >= Date.parse(exceptionExpiry) ||
      installed?.version !== allowed.version ||
      installed?.dev !== true ||
      finding.nodes?.length !== 1 ||
      finding.nodes[0] !== node ||
      !Array.isArray(finding.via) ||
      finding.via.length !== 1
    ) {
      blocked.push(`${name}: unexpected, changed, or expired finding`);
      continue;
    }
    const cause = finding.via[0];
    const matches = allowed.via
      ? cause === allowed.via
      : cause &&
        typeof cause === "object" &&
        cause.name === "braces" &&
        cause.dependency === "braces" &&
        cause.url === advisoryUrl &&
        cause.severity === "high";
    if (!matches) {
      blocked.push(`${name}: unapproved advisory/cause`);
      continue;
    }
    if (allowed.via && !report.vulnerabilities[allowed.via]) {
      blocked.push(`${name}: incomplete dependency advisory chain`);
      continue;
    }
    accepted.push(name);
  }
  return { blocked, accepted };
}
