import { describe, expect, it, vi, beforeEach } from "vitest";

const { signIn, FakeAuthError } = vi.hoisted(() => {
  class FakeAuthError extends Error {}
  return { signIn: vi.fn(), FakeAuthError };
});
const { consumeAuthRateLimit, FakeRateLimitError } = vi.hoisted(() => {
  class FakeRateLimitError extends Error {}
  return {
    consumeAuthRateLimit: vi.fn(),
    FakeRateLimitError,
  };
});
vi.mock("@/lib/auth", () => ({ signIn }));
vi.mock("next-auth", () => ({ AuthError: FakeAuthError }));
vi.mock("@/lib/auth-rate-limit", () => ({
  AuthRateLimitExceededError: FakeRateLimitError,
  consumeAuthRateLimit,
  getAuthRequestIdentity: vi.fn(async () => ({ ip: "203.0.113.5" })),
}));

import { loginAction } from "@/lib/actions/login";

function formDataOf(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loginAction", () => {
  it("returns a generic error and never reveals whether the email exists", async () => {
    signIn.mockRejectedValueOnce(new FakeAuthError("CredentialsSignin"));

    const result = await loginAction(
      "/dashboard",
      { status: "idle" },
      formDataOf({ email: "nobody@hango.dev", password: "wrong" }),
    );

    expect(result.status).toBe("error");
    expect(result.message).toBe("Invalid email or password.");
    expect(result.message).not.toMatch(/exist|not found|unknown user/i);
  });

  it("re-throws non-auth errors (e.g. the internal redirect signal on success)", async () => {
    const redirectSignal = new Error("NEXT_REDIRECT");
    signIn.mockRejectedValueOnce(redirectSignal);

    await expect(
      loginAction(
        "/dashboard",
        { status: "idle" },
        formDataOf({ email: "user@hango.dev", password: "correct" }),
      ),
    ).rejects.toBe(redirectSignal);
  });

  it("calls signIn with the credentials provider and the given redirect target", async () => {
    signIn.mockResolvedValueOnce(undefined);

    await loginAction(
      "/learning-journey",
      { status: "idle" },
      formDataOf({ email: "user@hango.dev", password: "correct" }),
    );

    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "user@hango.dev",
      password: "correct",
      redirectTo: "/learning-journey",
    });
    expect(consumeAuthRateLimit).toHaveBeenCalledWith(
      "login",
      "user@hango.dev",
      { ip: "203.0.113.5" },
    );
  });

  it("blocks the provider call after the persistent limit is exceeded", async () => {
    consumeAuthRateLimit.mockRejectedValueOnce(new FakeRateLimitError());

    const result = await loginAction(
      "/dashboard",
      { status: "idle" },
      formDataOf({ email: "USER@HANGO.DEV ", password: "correct" }),
    );

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/too many attempts/i);
    expect(signIn).not.toHaveBeenCalled();
  });
});
