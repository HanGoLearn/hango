// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

afterEach(() => {
  cleanup();
});

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { InformationBanner } from "@/components/ui/banner";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/states";
import { Checkbox } from "@/components/ui/checkbox";
import { Toggle } from "@/components/ui/toggle";
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalTitle,
  ModalDescription,
} from "@/components/ui/modal";

describe("Button", () => {
  it("renders and handles click", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Continue</Button>);
    const button = screen.getByRole("button", { name: "Continue" });
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("disables interaction while loading", () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});

describe("IconButton", () => {
  it("requires an accessible label", () => {
    render(<IconButton icon={<span />} aria-label="Play audio" />);
    expect(
      screen.getByRole("button", { name: "Play audio" }),
    ).toBeInTheDocument();
  });
});

describe("Input", () => {
  it("associates the label and shows an error message", () => {
    render(<Input label="Email" error="Email is required" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Email is required")).toBeInTheDocument();
  });
});

describe("Textarea", () => {
  it("shows a character count against maxLength", () => {
    render(
      <Textarea
        label="Message"
        value="hello"
        maxLength={20}
        showCharacterCount
        onChange={() => {}}
      />,
    );
    expect(screen.getByText("5 / 20")).toBeInTheDocument();
  });
});

describe("Checkbox", () => {
  it("toggles checked state", async () => {
    render(<Checkbox label="Show Pinyin" />);
    const checkbox = screen.getByRole("checkbox", { name: "Show Pinyin" });
    expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});

describe("Toggle", () => {
  it("toggles on activation", async () => {
    render(<Toggle label="Automatic playback" />);
    const toggle = screen.getByRole("switch", { name: "Automatic playback" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });
});

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Scenario content</Card>);
    expect(screen.getByText("Scenario content")).toBeInTheDocument();
  });
});

describe("ProgressBar", () => {
  it("exposes progress via role and label", () => {
    render(<ProgressBar value={40} label="Lesson progress" />);
    expect(screen.getByText("Lesson progress")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
  });
});

describe("InformationBanner", () => {
  it("uses role=alert for the error variant", () => {
    render(
      <InformationBanner variant="error">
        Something went wrong.
      </InformationBanner>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Something went wrong.",
    );
  });

  it("uses role=status for non-error variants", () => {
    render(
      <InformationBanner variant="info">A helpful tip.</InformationBanner>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("A helpful tip.");
  });
});

describe("LoadingState / EmptyState / ErrorState", () => {
  it("LoadingState announces the active process", () => {
    render(<LoadingState message="Loading your lesson." />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading your lesson.",
    );
  });

  it("EmptyState explains why and offers an action", async () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="No writing activities yet"
        description="Start your first Writing Lab practice."
        action={{ label: "Start practice", onClick }}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Start practice" }),
    );
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("ErrorState offers a retry action", async () => {
    const onRetry = vi.fn();
    render(
      <ErrorState
        title="We could not evaluate your recording."
        description="Try again or continue without pronunciation feedback."
        onRetry={onRetry}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe("Modal", () => {
  it("opens and shows title/description, closable via the Close button", async () => {
    render(
      <Modal>
        <ModalTrigger>Open</ModalTrigger>
        <ModalContent>
          <ModalTitle>Exit lesson?</ModalTitle>
          <ModalDescription>Your progress will be saved.</ModalDescription>
        </ModalContent>
      </Modal>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Exit lesson?")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
