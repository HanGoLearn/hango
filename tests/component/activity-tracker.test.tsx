// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/han",
}));

import { ActivityTracker } from "@/components/analytics/activity-tracker";

describe("ActivityTracker", () => {
  const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(new Response(null, { status: 204 })),
  );

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockClear();
    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("waits for real interaction and leaves the /han hub unattributed", () => {
    render(<ActivityTracker />);

    act(() => vi.advanceTimersByTime(15_000));
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.pointerDown(document.body);
    act(() => vi.advanceTimersByTime(15_000));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const request = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(JSON.parse(request.body as string)).toMatchObject({
      surface: "GENERAL",
      path: "/han",
      activeSeconds: 15,
      interactionCount: 1,
      sequence: 1,
    });
  });

  it("does not count interval heartbeats while the document is hidden", () => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    render(<ActivityTracker />);
    fireEvent.pointerDown(document.body);

    act(() => vi.advanceTimersByTime(30_000));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses an explicit in-page marker for the lateral Han Tutor", () => {
    const { getByRole } = render(
      <>
        <ActivityTracker />
        <button type="button" data-activity-surface="HAN_TUTOR">
          Open tutor
        </button>
      </>,
    );

    fireEvent.pointerDown(getByRole("button", { name: "Open tutor" }));
    act(() => vi.advanceTimersByTime(15_000));

    const request = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(JSON.parse(request.body as string).surface).toBe("HAN_TUTOR");
  });
});
