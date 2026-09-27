// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// The provider reaches for the route and for two server actions. Both are
// mocked rather than exercised: importing the real actions pulls next-auth
// into jsdom, and what matters here is that finishing and skipping each
// report the right one.
const pathname = vi.hoisted(() => ({ current: "/en/dashboard" }));
const routerPush = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
  useRouter: () => ({ push: routerPush }),
}));

const tourActions = vi.hoisted(() => ({
  completeTourAction: vi.fn(),
  skipTourAction: vi.fn(),
  markTourHintsSeenAction: vi.fn().mockResolvedValue(undefined),
  restartTourAction: vi.fn().mockResolvedValue(undefined),
  restoreTourHintsAction: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/actions/tour", () => tourActions);

import { TourProvider } from "@/components/tour/tour-provider";
import { TourOverlay } from "@/components/tour/tour-overlay";
import { SECTION_TOUR, WELCOME_TOUR } from "@/components/tour/tour-steps";
import { TourHint } from "@/components/tour/tour-hint";
import { TourSection } from "@/components/settings/tour-section";
import { messages as englishMessages } from "@/i18n/messages/en";

// jsdom has no layout engine: `scrollIntoView` is missing outright, and
// every `getBoundingClientRect` returns zeroes. The zeroes are not a
// harmless detail here - the overlay treats a zero-sized box as "not on
// screen" and falls back to the centred card, so without a stubbed box no
// test could ever reach the anchored layout. A plausible rect is installed
// instead, and the real positioning maths is checked on the dev server.
const ORIGINAL_RECT = Element.prototype.getBoundingClientRect;

function rectOf(top: number, height: number): DOMRect {
  return {
    x: 20,
    y: top,
    width: 320,
    height,
    top,
    left: 20,
    right: 340,
    bottom: top + height,
    toJSON: () => ({}),
  } as DOMRect;
}

/** Mutable so a test can put the anchor wherever the case needs it. */
let currentRect = rectOf(100, 120);

beforeEach(() => {
  currentRect = rectOf(100, 120);
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.getBoundingClientRect = () => currentRect;
  window.history.replaceState({}, "", "/en/dashboard?tour=1");
  pathname.current = "/en/dashboard";
  routerPush.mockClear();
  tourActions.completeTourAction.mockClear();
  tourActions.skipTourAction.mockClear();
  tourActions.markTourHintsSeenAction.mockClear();
  tourActions.restartTourAction.mockClear();
  tourActions.restoreTourHintsAction.mockClear();
});

afterEach(() => {
  cleanup();
  Element.prototype.getBoundingClientRect = ORIGINAL_RECT;
  window.history.replaceState({}, "", "/");
});

function renderTour({ autoStart = false, seenHints = [] as string[] } = {}) {
  return render(
    <TourProvider autoStart={autoStart} initialSeenHints={seenHints}>
      {/* One stand-in per real anchor. A step whose `anchor` stopped
          matching the page would fall back to the centred card, and the
          "Back"/"Next" controls this file drives would vanish - so the
          sequence below is what catches a renamed anchor. */}
      <div data-tour-id="dashboard-hero">Continue learning</div>
      <div data-tour-id="dashboard-streak">Week</div>
      <div data-tour-id="dashboard-experience">Experience</div>
      <div data-tour-id="dashboard-words">Words of the day</div>
      <button type="button" data-tour-id="han-bubble">
        Open Han
      </button>
      <nav data-tour-id="primary-nav">
        <span data-tour-id="nav-learning">Learning</span>
        <span data-tour-id="nav-han">Han</span>
        <span data-tour-id="nav-progress">Progress</span>
        <span data-tour-id="nav-shop">Shop</span>
      </nav>
      <TourOverlay messages={englishMessages.tour} />
    </TourProvider>,
  );
}

const TOTAL = WELCOME_TOUR.length;

describe("guided tour", () => {
  it("covers the seven approved steps", () => {
    expect(WELCOME_TOUR.map((step) => step.id)).toEqual([
      "welcome",
      "next-step",
      "streak",
      "experience",
      "words",
      "bubble",
      "navigation",
    ]);
  });

  it("never uses the apologetic pose — nobody fails in the tour", () => {
    expect(WELCOME_TOUR.some((step) => step.pose === "wrong")).toBe(false);
  });

  it("opens on the welcome step when the tour is requested", () => {
    renderTour();

    expect(
      screen.getByRole("dialog", { name: "Guided tour" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Hi, I'm Han")).toBeInTheDocument();
    // Twice on purpose: the visible counter is aria-hidden (the dots beside
    // it mean nothing read aloud), and the live region announces the same
    // position separately for screen readers.
    expect(screen.getAllByText(`1 of ${TOTAL}`)).toHaveLength(2);
  });

  it("stays closed when the tour was not requested", () => {
    window.history.replaceState({}, "", "/en/dashboard");
    renderTour();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("advances from the welcome card to the anchored one", async () => {
    const user = userEvent.setup();
    renderTour();

    await user.click(screen.getByRole("button", { name: /Show me/ }));

    expect(screen.getByText(/I pick your next lesson/)).toBeInTheDocument();
    expect(screen.getAllByText(`2 of ${TOTAL}`)).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Back" })).toBeEnabled();
  });

  it("goes back to the previous step", async () => {
    const user = userEvent.setup();
    renderTour();

    await user.click(screen.getByRole("button", { name: /Show me/ }));
    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(screen.getByText("Hi, I'm Han")).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    renderTour();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes from the skip control without finishing", async () => {
    const user = userEvent.setup();
    renderTour();

    await user.click(screen.getByRole("button", { name: "Not right now" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(tourActions.skipTourAction).toHaveBeenCalledTimes(1);
    expect(tourActions.completeTourAction).not.toHaveBeenCalled();
  });

  it("records a skip when the learner presses Escape", async () => {
    const user = userEvent.setup();
    renderTour();

    await user.keyboard("{Escape}");

    expect(tourActions.skipTourAction).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe("");
  });

  it("opens by itself on the dashboard when the learner is new", () => {
    window.history.replaceState({}, "", "/en/dashboard");
    renderTour({ autoStart: true });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("never opens by itself away from the dashboard", () => {
    // Every step of the first leg points at something on Inicio, so opening
    // anywhere else would spotlight elements that aren't on the page.
    window.history.replaceState({}, "", "/en/lesson/greetings");
    pathname.current = "/en/lesson/greetings";
    renderTour({ autoStart: true });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("walks every step and finishes on the last one", async () => {
    const user = userEvent.setup();
    renderTour();

    await user.click(screen.getByRole("button", { name: /Show me/ }));
    // Steps 2 through 6 advance; the seventh offers a finish instead.
    for (let position = 2; position < TOTAL; position += 1) {
      expect(screen.getAllByText(`${position} of ${TOTAL}`)).toHaveLength(2);
      await user.click(screen.getByRole("button", { name: /^Next/ }));
    }

    expect(screen.getAllByText(`${TOTAL} of ${TOTAL}`)).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: /^Next/ }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Start studying" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // Reaching the end is what counts as finishing, and it must not also
    // register as a skip.
    expect(tourActions.completeTourAction).toHaveBeenCalledTimes(1);
    expect(tourActions.skipTourAction).not.toHaveBeenCalled();
  });
});

/** Walks the first leg to its final card, where the branch lives. */
async function reachTheBranch(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Show me$/ }));
  for (let position = 2; position < WELCOME_TOUR.length; position += 1) {
    await user.click(screen.getByRole("button", { name: /^Next/ }));
  }
}

describe("the branch at the end of the first leg", () => {
  it("offers the rest of the app instead of just ending", async () => {
    const user = userEvent.setup();
    renderTour();
    await reachTheBranch(user);

    expect(
      screen.getByRole("button", { name: /Show me the rest/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start studying" }),
    ).toBeInTheDocument();
    // Declining must not feel like losing something.
    expect(
      screen.getByText("You can see this later from Settings"),
    ).toBeInTheDocument();
  });

  it("declining finishes the tour without starting the walk", async () => {
    const user = userEvent.setup();
    renderTour();
    await reachTheBranch(user);

    await user.click(screen.getByRole("button", { name: "Start studying" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(tourActions.completeTourAction).toHaveBeenCalledTimes(1);
  });

  it("accepting asks the learner to press, and never navigates for them", async () => {
    const user = userEvent.setup();
    renderTour();
    await reachTheBranch(user);

    await user.click(screen.getByRole("button", { name: /Show me the rest/ }));

    // The first leg counts as finished either way, so abandoning the walk
    // later can never reopen it.
    expect(tourActions.completeTourAction).toHaveBeenCalledTimes(1);
    // Being teleported somewhere teaches nobody where it lives.
    expect(routerPush).not.toHaveBeenCalled();
    expect(screen.getByText(/Press here/)).toBeInTheDocument();
    // Nothing is marked as explained until the learner actually gets there.
    expect(tourActions.markTourHintsSeenAction).not.toHaveBeenCalled();
  });

  it("counts the second leg's own steps, not the first leg's", async () => {
    const user = userEvent.setup();
    renderTour();
    await reachTheBranch(user);
    await user.click(screen.getByRole("button", { name: /Show me the rest/ }));

    expect(screen.getAllByText(`1 of ${SECTION_TOUR.length}`)).toHaveLength(2);
  });
});

describe("the second leg waits for the learner", () => {
  it("moves on once they arrive, and records what they saw", async () => {
    const user = userEvent.setup();
    const view = renderTour();
    await reachTheBranch(user);
    await user.click(screen.getByRole("button", { name: /Show me the rest/ }));

    // The learner presses the menu entry themselves; the route changing is
    // what finishes the step.
    pathname.current = "/en/learning-journey";
    view.rerender(
      <TourProvider>
        <nav data-tour-id="primary-nav">
          <span data-tour-id="nav-learning">Learning</span>
          <span data-tour-id="nav-han">Han</span>
        </nav>
        <TourOverlay messages={englishMessages.tour} />
      </TourProvider>,
    );

    expect(screen.getAllByText(`2 of ${SECTION_TOUR.length}`)).toHaveLength(2);
    expect(tourActions.markTourHintsSeenAction).toHaveBeenCalledWith([
      "journey",
    ]);
  });

  it("still offers a way forward for someone who won't press", async () => {
    const user = userEvent.setup();
    renderTour();
    await reachTheBranch(user);
    await user.click(screen.getByRole("button", { name: /Show me the rest/ }));

    await user.click(screen.getByRole("button", { name: /^Next/ }));

    expect(screen.getAllByText(`2 of ${SECTION_TOUR.length}`)).toHaveLength(2);
    // Skipping past a section must not mark it explained - its own note
    // should still appear the day they finally open it.
    expect(tourActions.markTourHintsSeenAction).not.toHaveBeenCalled();
  });

  it("finishes the centred closing card instead of restarting its invitation", async () => {
    const user = userEvent.setup();
    renderTour();
    await reachTheBranch(user);
    await user.click(screen.getByRole("button", { name: /Show me the rest/ }));

    for (let position = 1; position < SECTION_TOUR.length; position += 1) {
      await user.click(screen.getByRole("button", { name: /^Next/ }));
    }

    expect(
      screen.getAllByText(`${SECTION_TOUR.length} of ${SECTION_TOUR.length}`),
    ).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Start studying" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Show me$/ }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Start studying" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(tourActions.skipTourAction).not.toHaveBeenCalled();
    expect(window.location.search).toBe("");
  });

  it("keeps moving forward across more than one route", async () => {
    const user = userEvent.setup();
    const view = renderTour();
    await reachTheBranch(user);
    await user.click(screen.getByRole("button", { name: /Show me the rest/ }));

    pathname.current = "/en/learning-journey";
    view.rerender(
      <TourProvider>
        <nav data-tour-id="primary-nav">
          <span data-tour-id="nav-learning">Learning</span>
          <span data-tour-id="nav-han">Han</span>
        </nav>
        <TourOverlay messages={englishMessages.tour} />
      </TourProvider>,
    );
    await waitFor(() =>
      expect(screen.getAllByText(`2 of ${SECTION_TOUR.length}`)).toHaveLength(
        2,
      ),
    );

    pathname.current = "/en/writing-lab";
    view.rerender(
      <TourProvider>
        <nav data-tour-id="primary-nav">
          <span data-tour-id="nav-learning">Learning</span>
          <span data-tour-id="nav-han">Han</span>
        </nav>
        <TourOverlay messages={englishMessages.tour} />
      </TourProvider>,
    );

    await waitFor(() =>
      expect(screen.getAllByText(`3 of ${SECTION_TOUR.length}`)).toHaveLength(
        2,
      ),
    );
  });
});

describe("replaying the introduction from settings", () => {
  it("resets it and opens the dashboard with an explicit request", async () => {
    const user = userEvent.setup();
    render(<TourSection messages={englishMessages.tour} locale="en" />);

    await user.click(
      screen.getByRole("button", {
        name: englishMessages.tour.settings.replay,
      }),
    );

    await waitFor(() => {
      expect(tourActions.restartTourAction).toHaveBeenCalledTimes(1);
      expect(routerPush).toHaveBeenCalledWith("/en/dashboard?tour=1");
    });
  });
});

function renderHint({ seenHints = [] as string[], tourRunning = false } = {}) {
  if (!tourRunning) window.history.replaceState({}, "", pathname.current);
  return render(
    <TourProvider initialSeenHints={seenHints}>
      <div data-tour-id="lesson-steps">Steps</div>
      {/* Both are mounted so the "tour is running" case can assert that one
          silences the other, which is the whole point of that check. */}
      <TourOverlay messages={englishMessages.tour} />
      <TourHint messages={englishMessages.tour} />
    </TourProvider>,
  );
}

describe("section hints", () => {
  it("explains a section the first time the learner opens it", () => {
    pathname.current = "/en/writing-lab";
    renderHint();

    expect(screen.getByText(/Writing outside the journey/)).toBeInTheDocument();
  });

  it("stays quiet for a section the walk already covered", () => {
    pathname.current = "/en/writing-lab";
    renderHint({ seenHints: ["writingLab"] });

    expect(screen.queryByText(/Writing outside the journey/)).toBeNull();
  });

  it("records the section when dismissed, so it never returns", async () => {
    const user = userEvent.setup();
    pathname.current = "/en/progress";
    renderHint();

    await user.click(screen.getByRole("button", { name: "Got it" }));

    expect(tourActions.markTourHintsSeenAction).toHaveBeenCalledWith([
      "progress",
    ]);
    expect(screen.queryByText(/where you're strong/)).toBeNull();
  });

  it("says nothing while the tour itself is running", () => {
    // A note about the page Han is already standing on would be absurd.
    pathname.current = "/en/dashboard";
    window.history.replaceState({}, "", "/en/dashboard?tour=1");
    renderHint({ tourRunning: true });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Got it" })).toBeNull();
  });

  it("has no hint on a page the tour has nothing to say about", () => {
    pathname.current = "/en/leaderboard";
    renderHint();

    expect(screen.queryByRole("button", { name: "Got it" })).toBeNull();
  });
});

describe("where the card lands", () => {
  function openSecondStep(user: ReturnType<typeof userEvent.setup>) {
    return user.click(screen.getByRole("button", { name: /Show me$/ }));
  }

  it("sits below an anchor that leaves room beneath it", async () => {
    const user = userEvent.setup();
    currentRect = rectOf(80, 160);
    renderTour();
    await openSecondStep(user);

    const card = screen.getByRole("dialog");
    expect(card.style.top).toBe("252px");
    expect(card.style.bottom).toBe("");
  });

  it("sits above an anchor pressed against the bottom of the screen", async () => {
    const user = userEvent.setup();
    // Barely any room underneath, plenty above.
    currentRect = rectOf(window.innerHeight - 120, 90);
    renderTour();
    await openSecondStep(user);

    const card = screen.getByRole("dialog");
    expect(card.style.bottom).not.toBe("");
    expect(card.style.top).toBe("");
  });

  it("never pushes itself off the top of the screen for a tall anchor", async () => {
    const user = userEvent.setup();
    // Two regressions guarded at once. The first rule flipped the card
    // above a tall anchor, putting its bottom edge near the top of the
    // screen with the rest out of view. The second squeezed it into
    // whatever gap was left, so it rendered with an inner scrollbar and
    // read as cut off. Neither is acceptable: it pins to the foot instead,
    // at its own height.
    currentRect = rectOf(110, Math.round(window.innerHeight * 0.5));
    renderTour();
    await openSecondStep(user);

    const card = screen.getByRole("dialog");
    expect(card.style.top).toBe("");
    expect(card.style.bottom).toBe("");
    expect(card.className).toContain("bottom-[calc(1rem");
  });

  it("is never squeezed into a gap smaller than it needs", async () => {
    const user = userEvent.setup();
    // The words panel case: centred by `scrollIntoView`, it leaves a gap
    // each side that is real but too small for the card's own content.
    const tall = Math.round(window.innerHeight * 0.42);
    currentRect = rectOf(Math.round((window.innerHeight - tall) / 2), tall);
    renderTour();
    await openSecondStep(user);

    const card = screen.getByRole("dialog");
    const maxHeight = Number.parseInt(card.style.maxHeight || "0", 10);
    // Either it got its natural height, or the cap is at least as large as
    // a full card - never a sliver.
    expect(maxHeight === 0 || maxHeight >= 300).toBe(true);
  });

  it("pins to the foot when the anchor leaves no room either side", async () => {
    const user = userEvent.setup();
    currentRect = rectOf(20, window.innerHeight - 40);
    renderTour();
    await openSecondStep(user);

    const card = screen.getByRole("dialog");
    expect(card.style.top).toBe("");
    expect(card.style.bottom).toBe("");
    expect(card.className).toContain("bottom-[calc(1rem");
  });
});
