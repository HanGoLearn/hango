import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";

const PORT = 3099;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let server: ChildProcess;

async function waitForServer(timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(BASE_URL);
      if (response.ok) return;
    } catch {
      // Server not ready yet, keep polling.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Server did not become ready in time");
}

describe("application smoke test", () => {
  beforeAll(async () => {
    server = spawn(`npx next dev -p ${PORT}`, {
      cwd: process.cwd(),
      shell: true,
      stdio: "ignore",
      // Vitest sets NODE_ENV=test, but Next.js intentionally skips loading
      // .env.local when NODE_ENV=test. Override it so the spawned dev
      // server loads local config the same way `npm run dev` does.
      env: { ...process.env, NODE_ENV: "development" },
    });
    await waitForServer(60_000);
  }, 75_000);

  afterAll(async () => {
    if (!server.pid) return;
    await new Promise<void>((resolve) => {
      const kill = spawn("taskkill", ["/pid", String(server.pid), "/t", "/f"], {
        stdio: "ignore",
      });
      kill.on("exit", () => resolve());
      kill.on("error", () => resolve());
    });
  });

  it("serves the home page with expected content", async () => {
    const response = await fetch(BASE_URL);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("HanGo");
    expect(html).toContain("Application foundation running.");
  });
});
