// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "@/i18n/messages/en";

const mocks = vi.hoisted(() => ({
  submit: vi.fn(),
  history: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/learn",
}));
vi.mock("@/lib/actions/beta-feedback", () => ({
  submitBetaFeedbackAction: mocks.submit,
  getMyBetaFeedbackAction: mocks.history,
}));

import { FeedbackWidget } from "@/components/feedback/feedback-widget";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("FeedbackWidget", () => {
  it("submits a one-screen mobile report with automatic route and locale", async () => {
    const user = userEvent.setup();
    mocks.history.mockResolvedValue([]);
    mocks.submit.mockResolvedValue({ ok: true });
    render(<FeedbackWidget locale="en" messages={messages.shell.feedback} />);

    await user.click(screen.getByRole("button", { name: "Feedback" }));
    await user.click(screen.getByText("I have an idea"));
    await user.click(screen.getByRole("button", { name: "4 out of 5" }));
    await user.type(
      screen.getByLabelText("Tell us more"),
      "Please add another practice station.",
    );
    await user.click(screen.getByRole("button", { name: "Send feedback" }));

    await waitFor(() =>
      expect(mocks.submit).toHaveBeenCalledWith({
        category: "IDEA",
        rating: 4,
        message: "Please add another practice station.",
        path: "/en/learn",
        locale: "en",
      }),
    );
    expect(await screen.findByText("Thank you!")).toBeInTheDocument();
  });
});
