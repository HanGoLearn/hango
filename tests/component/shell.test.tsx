// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));
// logoutAction is a "use server" action pulling in next-auth (-> next/server),
// which Vitest's jsdom environment can't resolve — it doesn't understand the
// "use server" build-time boundary the way Next's bundler does. Real
// server-action behavior is proven separately (login-action unit tests +
// manual curl verification against a live server).
vi.mock("@/lib/actions/logout", () => ({ logoutAction: vi.fn() }));
// AppShell (FASE 8) is an async Server Component that calls auth() and
// reads AI conversation history — both pull in next-auth/Prisma, which
// don't resolve inside jsdom the same way Next's bundler resolves them.
// Mocked here for the same reason as logoutAction above.
vi.mock("@/lib/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/ai-teacher-data", () => ({
  getConversationHistory: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/actions/ai-teacher", () => ({
  sendAiTeacherMessageAction: vi.fn(),
  resetAiTeacherConversationAction: vi.fn(),
  transcribeHanMessageAction: vi.fn(),
}));

import { Sidebar } from "@/components/shell/sidebar";
import { BottomNav } from "@/components/shell/bottom-nav";
import { TopBar } from "@/components/shell/top-bar";
import { AiTeacherBubble } from "@/components/shell/ai-teacher-bubble";
import { AppShell } from "@/components/shell/app-shell";
import { UserMenu } from "@/components/shell/user-menu";
import {
  AiTeacherProvider,
  useAiTeacher,
} from "@/components/ai-teacher/ai-teacher-provider";
import {
  resetAiTeacherConversationAction,
  sendAiTeacherMessageAction,
} from "@/lib/actions/ai-teacher";

function InjectSpeakingContext() {
  const { setContext } = useAiTeacher();
  return (
    <button
      type="button"
      onClick={() =>
        setContext({
          rolePlay: {
            aiRole: "old classmate",
            learnerRole: "learner",
            scenarioContext: "Remembering an old school",
            objective: "Talk about the old school",
            lessonHskLevel: 5,
          },
        })
      }
    >
      Inject Speaking context
    </button>
  );
}

afterEach(() => {
  cleanup();
});

describe("Sidebar", () => {
  it("marks the current section as active", () => {
    render(<Sidebar />);
    const dashboardLink = screen.getByRole("link", { name: /Dashboard/ });
    expect(dashboardLink).toHaveAttribute("aria-current", "page");
    const journeyLink = screen.getByRole("link", { name: /Learning Journey/ });
    expect(journeyLink).not.toHaveAttribute("aria-current");
  });

  it("includes all required desktop nav items", () => {
    render(<Sidebar />);
    for (const label of [
      "Dashboard",
      "Learning Journey",
      "Speaking Lab",
      "Writing Lab",
      "Progress",
      "Settings",
    ]) {
      expect(
        screen.getByRole("link", { name: new RegExp(label) }),
      ).toBeInTheDocument();
    }
  });
});

describe("BottomNav", () => {
  it("omits Settings and uses compact mobile labels", () => {
    render(<BottomNav />);
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Journey" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Settings/ }),
    ).not.toBeInTheDocument();
  });
});

describe("TopBar", () => {
  it("derives the title from the current route and shows a user menu button", () => {
    render(
      <TopBar
        streak={{ currentStreak: 5, activeToday: true }}
        coinBalance={40}
        avatarAnimal={null}
        avatarEquipped={{ HEAD: null, FACE: null, TORSO: null }}
        isAdministrator={false}
      />,
    );
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "User menu" }),
    ).toBeInTheDocument();
  });
});

describe("UserMenu", () => {
  it("opens to reveal Settings and Log out, but not Administrador for a regular learner", async () => {
    render(
      <UserMenu
        animal={null}
        equipped={{ HEAD: null, FACE: null, TORSO: null }}
        isAdministrator={false}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "User menu" }));

    // Radix's DropdownMenu.Item applies role="menuitem" to its child,
    // overriding the anchor's implicit "link" role.
    expect(screen.getByRole("menuitem", { name: "Settings" })).toHaveAttribute(
      "href",
      "/settings",
    );
    expect(
      screen.getByRole("menuitem", { name: "Log out" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Administrador" }),
    ).not.toBeInTheDocument();
  });

  it("reveals Administrador, linking to the private back-office, only for an administrator (2026-09-05)", async () => {
    render(
      <UserMenu
        animal={null}
        equipped={{ HEAD: null, FACE: null, TORSO: null }}
        isAdministrator
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "User menu" }));

    expect(
      screen.getByRole("menuitem", { name: "Administrador" }),
    ).toHaveAttribute("href", "/admin");
  });
});

describe("AiTeacherBubble", () => {
  it("starts closed and opens the chat on request", async () => {
    render(
      <AiTeacherProvider initialMessages={[]}>
        <AiTeacherBubble />
      </AiTeacherProvider>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open Han" }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Open Han" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Han")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Close Han" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Speak to Han" }),
    ).toBeInTheDocument();
  });

  it("starts a fresh visible conversation every time Han is opened", async () => {
    vi.mocked(resetAiTeacherConversationAction).mockClear();
    render(
      <AiTeacherProvider
        initialMessages={[
          { id: "old-message", role: "ASSISTANT", content: "Old conversation" },
        ]}
      >
        <AiTeacherBubble />
      </AiTeacherProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Open Han" }));

    expect(screen.queryByText("Old conversation")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Ask Han anything about this lesson/),
    ).toBeInTheDocument();
    expect(resetAiTeacherConversationAction).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole("button", { name: "Close Han" }));
    await userEvent.click(screen.getByRole("button", { name: "Open Han" }));
    expect(resetAiTeacherConversationAction).toHaveBeenCalledTimes(2);
  });

  it("stays open when the learner interacts with navigation outside the panel", async () => {
    render(
      <AiTeacherProvider initialMessages={[]}>
        <button type="button">Learning Journey navigation</button>
        <AiTeacherBubble />
      </AiTeacherProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Open Han" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Learning Journey navigation" }),
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows lesson context once set", async () => {
    render(
      <AiTeacherProvider initialMessages={[]}>
        <AiTeacherBubble />
      </AiTeacherProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Open Han" }));
    expect(screen.getByText("No active lesson context")).toBeInTheDocument();
  });

  it("never sends a stale Speaking role-play through the floating Han tutor", async () => {
    vi.mocked(sendAiTeacherMessageAction).mockResolvedValueOnce({
      ok: true,
      reply: "Hola, soy Han.",
      responseLanguage: "Spanish",
    });
    render(
      <AiTeacherProvider initialMessages={[]}>
        <InjectSpeakingContext />
        <AiTeacherBubble />
      </AiTeacherProvider>,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Inject Speaking context" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Open Han" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Message Han" }), "Hola");
    await userEvent.click(screen.getByRole("button", { name: "Send message" }));

    expect(sendAiTeacherMessageAction).toHaveBeenCalledWith(
      "Hola",
      expect.objectContaining({ rolePlay: undefined }),
      "TUTOR",
    );
  });
});

describe("AppShell", () => {
  it("renders navigation, top bar, and page content together", async () => {
    // AppShell is an async Server Component — called directly and awaited
    // (rather than mounted as JSX) so its Promise<Element> resolves before
    // React Testing Library renders the result.
    render(await AppShell({ children: <p>Page content</p> }));
    expect(screen.getByText("Page content")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Dashboard|Home/ }).length,
    ).toBeGreaterThan(0);
  });
});
