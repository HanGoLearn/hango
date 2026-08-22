import { config } from "dotenv";
import { vi } from "vitest";

config({ path: ".env.local" });

// Several integration tests are written and documented to expect the mock
// AI/STT/TTS providers (no real network calls, no cost) - that was true by
// accident, only because no real key existed in .env.local. Now that a real
// OPENAI_API_KEY is configured there for actually running the app, leaving
// it in place here would make every test run silently bill the real OpenAI
// API. Test runs should never depend on what happens to be in a developer's
// local env for a paid external service - strip these unconditionally so
// getAiProvider()/getSttProvider()/getTtsProvider() always fall back to
// their mock implementations here, regardless of .env.local's contents.
delete process.env.OPENAI_API_KEY;
delete process.env.ANTHROPIC_API_KEY;

// server-only throws when required outside Next's RSC bundler graph, which
// includes plain Vitest/Node runs — it's a no-op here by design.
vi.mock("server-only", () => ({}));

// jsdom doesn't implement ResizeObserver, which Radix components (e.g.
// Checkbox) use internally. Harmless no-op stub for component tests.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// jsdom doesn't implement Element.scrollTo either (used by the AI Teacher
// chat to auto-scroll to the latest message). Harmless no-op stub.
if (typeof Element !== "undefined" && !Element.prototype.scrollTo) {
  Element.prototype.scrollTo = () => {};
}

// jsdom doesn't implement window.matchMedia either (theme-toggle.tsx's
// module-scope OS-theme-change listener, registered as soon as any
// component importing it is loaded - not deferred to an effect). Harmless
// stub reporting "no preference"; nothing in these tests asserts on it
// actually firing a change event.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList;
}
