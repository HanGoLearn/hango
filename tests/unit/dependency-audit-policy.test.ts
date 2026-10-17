import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
// Exercise the same native Node module used by CI, without a TS transform.
const { advisoryUrl, evaluateAuditReport, exceptionExpiry, toolingChain } =
  createRequire(import.meta.url)(
    "../../scripts/dependency-audit-policy.mjs",
  ) as {
    advisoryUrl: string;
    exceptionExpiry: string;
    toolingChain: Record<string, { version: string; via: string | null }>;
    evaluateAuditReport: (
      report: Record<string, unknown>,
      manifest: Record<string, unknown>,
      lock: Record<string, unknown>,
      now?: number,
    ) => { blocked: string[]; accepted: string[] };
  };

function fixture() {
  const vulnerabilities = Object.fromEntries(
    Object.entries(toolingChain).map(([name, value]) => [
      name,
      {
        severity: "high",
        nodes: [`node_modules/${name}`],
        via: [
          value.via ?? {
            name: "braces",
            dependency: "braces",
            url: advisoryUrl,
            severity: "high",
          },
        ],
      },
    ]),
  );
  return {
    report: {
      auditReportVersion: 2,
      vulnerabilities,
      metadata: { vulnerabilities: { high: 5, critical: 0, total: 5 } },
    },
    manifest: {
      devDependencies: { prisma: "7.10.1", "eslint-config-next": "16.3.8" },
      dependencies: {} as Record<string, string>,
    },
    lock: {
      packages: Object.fromEntries(
        Object.entries(toolingChain).map(([name, value]) => [
          `node_modules/${name}`,
          { version: value.version, dev: true },
        ]),
      ),
    },
  };
}
const beforeExpiry = Date.parse("2026-10-23T23:59:59-05:00");
describe("owner-approved development audit exception", () => {
  it("accepts only the exact approved chain before expiry", () => {
    const { report, manifest, lock } = fixture();
    expect(evaluateAuditReport(report, manifest, lock, beforeExpiry)).toEqual({
      blocked: [],
      accepted: Object.keys(toolingChain),
    });
  });
  it("blocks at expiry even with the same advisory and versions", () => {
    const { report, manifest, lock } = fixture();
    expect(
      evaluateAuditReport(report, manifest, lock, Date.parse(exceptionExpiry))
        .blocked,
    ).toHaveLength(5);
  });
  it("does not fail a clean report after the exception expires", () => {
    const { report, manifest, lock } = fixture();
    report.vulnerabilities = {};
    expect(
      evaluateAuditReport(report, manifest, lock, Date.parse(exceptionExpiry))
        .blocked,
    ).toEqual([]);
  });
  it.each([
    "version",
    "runtime",
    "path",
    "advisory",
    "critical",
    "extra cause",
    "missing cause",
  ])("blocks a changed %s", (change) => {
    const { report, manifest, lock } = fixture();
    const finding = report.vulnerabilities.braces!;
    if (change === "version")
      lock.packages["node_modules/braces"]!.version = "3.0.4";
    if (change === "runtime") lock.packages["node_modules/braces"]!.dev = false;
    if (change === "path")
      finding.nodes.push("node_modules/other/node_modules/braces");
    if (change === "advisory")
      finding.via = [
        {
          name: "braces",
          dependency: "braces",
          url: "https://example.invalid/new",
          severity: "high",
        },
      ];
    if (change === "critical") finding.severity = "critical";
    if (change === "extra cause") finding.via.push("new-package");
    if (change === "missing cause") delete report.vulnerabilities.braces;
    expect(
      evaluateAuditReport(report, manifest, lock, beforeExpiry).blocked.length,
    ).toBeGreaterThan(0);
  });
  it("blocks a new high-severity package", () => {
    const { report, manifest, lock } = fixture();
    report.vulnerabilities.next = {
      severity: "high",
      nodes: ["node_modules/next"],
      via: ["unknown"],
    };
    expect(
      evaluateAuditReport(report, manifest, lock, beforeExpiry).blocked.length,
    ).toBeGreaterThan(0);
  });
  it("blocks promoting the tooling to runtime", () => {
    const { report, manifest, lock } = fixture();
    manifest.dependencies["eslint-config-next"] = "16.3.8";
    expect(
      evaluateAuditReport(report, manifest, lock, beforeExpiry).blocked.length,
    ).toBeGreaterThan(0);
  });
  it.each([
    {},
    { error: { message: "network" } },
    { auditReportVersion: 2, vulnerabilities: {} },
  ])("fails closed for an invalid report", (report) => {
    const { manifest, lock } = fixture();
    expect(
      evaluateAuditReport(report, manifest, lock, beforeExpiry).blocked,
    ).toEqual(["Invalid audit report"]);
  });
});
