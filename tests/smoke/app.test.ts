import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";

const PORT = 3099;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const isWindows = process.platform === "win32";

let server: ChildProcess;
let serverOutput = "";

function appendServerOutput(chunk: Buffer | string): void {
  serverOutput = `${serverOutput}${chunk.toString()}`.slice(-8_000);
}

async function waitForServer(timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (server.exitCode !== null) {
      throw new Error(
        `Server exited before becoming ready (code ${server.exitCode}).\n${serverOutput}`,
      );
    }
    try {
      const response = await fetch(BASE_URL);
      if (response.ok) return;
    } catch {
      // Server not ready yet, keep polling.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(
    `Server did not become ready in time. Recent output:\n${serverOutput}`,
  );
}

describe("application smoke test", () => {
  beforeAll(async () => {
    server = spawn(`npx next dev -p ${PORT}`, {
      cwd: process.cwd(),
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
      // Not on Windows: puts the shell + `next dev` (+ its own children) in
      // a new process group, so the whole tree can be killed together via
      // a negative PID below - mirrors what `taskkill /T` already does on
      // Windows (2026-09-05 CI fix - `detached` has no meaningful effect
      // on win32 spawn, so this is safe to set unconditionally too, but
      // named for clarity about which platform actually needs it).
      detached: !isWindows,
      // Vitest sets NODE_ENV=test, but Next.js intentionally skips loading
      // .env.local when NODE_ENV=test. Override it so the spawned dev
      // server loads local config the same way `npm run dev` does.
      env: {
        ...process.env,
        NODE_ENV: "development",
        HANGO_SMOKE_TEST: "1",
        OPENAI_API_KEY: "",
        ANTHROPIC_API_KEY: "",
      },
    });
    server.stdout?.on("data", appendServerOutput);
    server.stderr?.on("data", appendServerOutput);
    await waitForServer(120_000);
  }, 135_000);

  afterAll(async () => {
    if (!server.pid) return;
    // Cross-platform process-tree kill (2026-09-05 CI fix, replacing a
    // Windows-only `taskkill` that would silently fail to clean up on a
    // standard Linux CI runner). `shell: true` above spawns a wrapping
    // shell, so killing just `server.pid` would leave the real `next dev`
    // process running either way.
    if (isWindows) {
      await new Promise<void>((resolve) => {
        const kill = spawn(
          "taskkill",
          ["/pid", String(server.pid), "/t", "/f"],
          {
            stdio: "ignore",
          },
        );
        kill.on("exit", () => resolve());
        kill.on("error", () => resolve());
      });
      return;
    }
    try {
      process.kill(-server.pid, "SIGKILL");
    } catch {
      // Already exited - nothing left to clean up.
    }
  });

  it("serves the home page with expected content", async () => {
    const response = await fetch(BASE_URL);
    const html = await response.text();

    expect(response.status).toBe(200);
    // Structural checks, not exact marketing copy (2026-09-05 fix - the
    // previous assertion checked for "Application foundation running.",
    // the FASE 0 placeholder the real homepage replaced; copy here has
    // already changed more than once since). "HanGo" (the brand name) and
    // a working registration link are stable regardless of copy edits.
    expect(html).toContain("HanGo");
    expect(html).toContain('href="/es/register"');
  });
});
