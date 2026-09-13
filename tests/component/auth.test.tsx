// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

// login and google-signin actions import next-auth (-> next/server), which
// Vitest's jsdom environment can't resolve — see tests/component/shell.test.tsx.
vi.mock("@/lib/actions/login", () => ({ loginAction: vi.fn() }));
vi.mock("@/lib/actions/google-signin", () => ({ googleSignInAction: vi.fn() }));

import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { messages } from "@/i18n/messages/en";

afterEach(() => {
  cleanup();
});

/**
 * Regression test for a real bug: GoogleSignInButton renders its own
 * <form>, and it was originally placed inside the credentials <form>.
 * Browsers silently drop nested <form> elements, so clicking "Continue
 * with Google" submitted the credentials form instead of doing anything —
 * jsdom does not enforce this the way a real browser does, so this has to
 * be asserted explicitly rather than relying on jsdom to catch it.
 */
function expectNoNestedForms(container: HTMLElement) {
  const forms = Array.from(container.querySelectorAll("form"));
  for (const form of forms) {
    const nestedForms = form.querySelectorAll("form");
    expect(nestedForms.length).toBe(0);
  }
}

describe("LoginForm", () => {
  it("does not nest the Google sign-in form inside the credentials form", () => {
    const { container } = render(
      <LoginForm googleEnabled locale="en" messages={messages.auth} />,
    );
    expectNoNestedForms(container);
  });
});

describe("RegisterForm", () => {
  it("does not nest the Google sign-in form inside the registration form", () => {
    const { container } = render(
      <RegisterForm googleEnabled locale="en" messages={messages.auth} />,
    );
    expectNoNestedForms(container);
  });
});
