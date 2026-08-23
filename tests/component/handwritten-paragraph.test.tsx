// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HandwrittenParagraph } from "@/components/writing/handwritten-paragraph";

afterEach(cleanup);

describe("HandwrittenParagraph", () => {
  it("shows three levels, the shared three-topic catalog, and manual submission", () => {
    render(<HandwrittenParagraph onExit={() => undefined} />);

    expect(screen.getByText("Basic")).toBeInTheDocument();
    expect(screen.getByText("Intermediate")).toBeInTheDocument();
    expect(screen.getByText("Advanced")).toBeInTheDocument();
    expect(screen.getAllByText("Family").length).toBeGreaterThan(0);
    expect(screen.getByText("Daily routine")).toBeInTheDocument();
    expect(screen.getByText("Shopping")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Evaluate my handwriting" }),
    ).toBeDisabled();
    expect(
      screen.getByText(/failed calls are never retried automatically/i),
    ).toBeInTheDocument();
  });
});
