import { spawnSync } from "node:child_process";

const DIRECT_RULES = [
  ["OpenAI/Anthropic key", /\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{20,}\b/],
  ["GitHub token", /\b(?:github_pat_|gh[pousr]_)[A-Za-z0-9_]{20,}\b/],
  ["Google API key", /\bAIza[A-Za-z0-9_-]{20,}\b/],
  ["Google OAuth secret", /\bGOCSPX-[A-Za-z0-9_-]{16,}\b/],
  ["AWS access key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ["Slack token", /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
  ["Resend API key", /\bre_[A-Za-z0-9]{20,}\b/],
  [
    "Private key material",
    /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
  ],
  [
    "Database URL with credentials",
    /\b(?:postgres(?:ql)?|mysql):\/\/[^\s:@/]+:[^\s@/]+@[^\s/]+/i,
  ],
  [
    "Prisma database API key",
    /\bprisma\+postgres:\/\/[^\s]+(?:api_key|apikey)=[^\s&"']+/i,
  ],
];

const SECRET_VARIABLES = [
  "ANTHROPIC_API_KEY",
  "AUTH_SECRET",
  "CRON_SECRET",
  "DATABASE_URL",
  "DIRECT_URL",
  "GOOGLE_CLIENT_SECRET",
  "OPENAI_API_KEY",
  "RESEND_API_KEY",
];
const VARIABLE_PATTERN = new RegExp(
  `\\b(${SECRET_VARIABLES.join("|")})\\s*[:=]\\s*(?:["']([^"']*)["']|([^\\s#;,]+))`,
);
const GREP_PATTERN = [
  "sk-",
  "github_pat_",
  "gh[pousr]_",
  "AIza",
  "GOCSPX-",
  "AKIA",
  "ASIA",
  "xox[baprs]-",
  "re_",
  "PRIVATE KEY",
  "postgres",
  "mysql:",
  "api_key",
  ...SECRET_VARIABLES,
].join("|");

function git(args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    ...options,
  });
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(
      `git ${args[0]} failed (${result.status ?? "no status"}): ${String(result.stderr).trim()}`,
    );
  }
  return result.stdout;
}

function placeholderValue(value) {
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "" ||
    normalized.startsWith("<") ||
    normalized.startsWith("process.env") ||
    normalized.startsWith("serverenv.") ||
    normalized.startsWith("os.") ||
    normalized.startsWith("env.") ||
    normalized.startsWith("config.") ||
    normalized.startsWith("deno.env") ||
    normalized.startsWith("z.") ||
    normalized === "optionalnonemptystring" ||
    normalized.startsWith("${{") ||
    normalized.startsWith("$") ||
    normalized.includes("placeholder") ||
    normalized.includes("example") ||
    normalized.includes("sample") ||
    normalized.includes("dummy") ||
    normalized.includes("test-") ||
    normalized.includes("mock-") ||
    normalized.includes("your_") ||
    normalized.includes("your-") ||
    normalized.includes("not-a-real") ||
    normalized.includes("generate-a-real") ||
    normalized.includes("your-secret") ||
    normalized.includes("change-me")
  );
}

function vendoredSkillDocumentation(path) {
  return /^(?:\.agents|\.claude|\.windsurf)\/skills\//.test(
    path.replaceAll("\\", "/"),
  );
}

function obviousPlaceholderLine(line) {
  const normalized = line.toLowerCase();
  return (
    normalized.includes("<api") ||
    normalized.includes("<password") ||
    normalized.includes("<username") ||
    normalized.includes("<project") ||
    normalized.includes("your_api") ||
    normalized.includes("your-api") ||
    normalized.includes("your_password") ||
    normalized.includes("your-password") ||
    normalized.includes("user:password@") ||
    normalized.includes("username:password@") ||
    normalized.includes("db_user:db_password@") ||
    normalized.includes("postgres:postgres@localhost") ||
    normalized.includes("hango:hango@localhost") ||
    normalized.includes("example.com") ||
    normalized.includes("placeholder") ||
    normalized.includes("not-a-real") ||
    normalized.includes("test-key") ||
    normalized.includes("mock-key") ||
    normalized.includes("dummy-key")
  );
}

function codeReferenceValue(path, value) {
  return (
    /\.(?:[cm]?[jt]s|tsx)$/.test(path) &&
    (/^[A-Z][A-Z0-9_]*[;,]?$/.test(value) ||
      (value.startsWith("`") && value.includes("${")))
  );
}

function allowedCredentialExample(path, line) {
  const normalized = line.toLowerCase();
  return (
    (path === ".env.example" &&
      normalized.includes("postgres:postgres@localhost")) ||
    (path === ".github/workflows/ci.yml" &&
      (normalized.includes("hango:hango@localhost") ||
        // Public fixture for the disposable CI service, not a real credential.
        // Anchor the complete line: no other host/user/port/database is exempt.
        /^\s*(?:database_url|direct_url): postgresql:\/\/hango:hango@127\.0\.0\.1:54329\/hango_local_test\s*$/.test(
          normalized,
        )))
  );
}

function classify(path, line) {
  const labels = [];
  for (const [label, pattern] of DIRECT_RULES) {
    if (!pattern.test(line)) continue;
    if (obviousPlaceholderLine(line)) continue;
    if (line.includes("${")) continue;
    if (
      vendoredSkillDocumentation(path) &&
      (label === "Database URL with credentials" ||
        label === "Prisma database API key")
    ) {
      continue;
    }
    if (
      label === "Database URL with credentials" &&
      allowedCredentialExample(path, line)
    ) {
      continue;
    }
    labels.push(label);
  }

  const variableMatch = VARIABLE_PATTERN.exec(line);
  if (variableMatch) {
    const value = variableMatch[2] ?? variableMatch[3] ?? "";
    if (
      !vendoredSkillDocumentation(path) &&
      !placeholderValue(value) &&
      !codeReferenceValue(path, value) &&
      !allowedCredentialExample(path, line)
    ) {
      labels.push(`${variableMatch[1]} literal`);
    }
  }
  return [...new Set(labels)];
}

function parseHistoricalLine(raw) {
  const match = /^([0-9a-f]{40}):(.+?):(\d+):(.*)$/.exec(raw);
  if (!match) return null;
  return {
    commit: match[1],
    path: match[2],
    lineNumber: Number(match[3]),
    line: match[4],
  };
}

function parseWorkingLine(raw) {
  const match = /^(.+?):(\d+):(.*)$/.exec(raw);
  if (!match) return null;
  return {
    commit: "working-tree",
    path: match[1],
    lineNumber: Number(match[2]),
    line: match[3],
  };
}

function grepRevision(revision) {
  return git([
    "grep",
    ...(revision ? [] : ["--untracked"]),
    "-I",
    "-n",
    "-E",
    "-e",
    GREP_PATTERN,
    ...(revision ? [revision] : []),
    "--",
  ]);
}

const commits = git(["rev-list", "--all"]).split(/\r?\n/).filter(Boolean);
const findings = [];

for (const commit of commits) {
  for (const raw of grepRevision(commit).split(/\r?\n/)) {
    if (!raw) continue;
    const occurrence = parseHistoricalLine(raw);
    if (!occurrence) continue;
    for (const rule of classify(occurrence.path, occurrence.line)) {
      findings.push({ ...occurrence, rule });
    }
  }
}

for (const raw of grepRevision(null).split(/\r?\n/)) {
  if (!raw) continue;
  const occurrence = parseWorkingLine(raw);
  if (!occurrence) continue;
  for (const rule of classify(occurrence.path, occurrence.line)) {
    findings.push({ ...occurrence, rule });
  }
}

const unique = [
  ...new Map(
    findings.map((finding) => [
      `${finding.commit}:${finding.path}:${finding.lineNumber}:${finding.rule}`,
      finding,
    ]),
  ).values(),
];

if (unique.length > 0) {
  console.error(
    `[security:secrets] FAILED: ${unique.length} probable secret occurrence(s). Values are intentionally redacted.`,
  );
  for (const finding of unique.slice(0, 100)) {
    console.error(
      `- ${finding.rule} at ${finding.commit.slice(0, 12)}:${finding.path}:${finding.lineNumber}`,
    );
  }
  if (unique.length > 100) {
    console.error(
      `- ...and ${unique.length - 100} more redacted occurrence(s).`,
    );
  }
  process.exit(1);
}

console.log(
  `[security:secrets] PASSED: ${commits.length} commit(s) plus the non-ignored working tree scanned; no probable secret material found.`,
);
