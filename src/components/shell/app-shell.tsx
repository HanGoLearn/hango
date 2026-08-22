import type { ReactNode } from "react";
import { Sidebar } from "@/components/shell/sidebar";
import { BottomNav } from "@/components/shell/bottom-nav";
import { TopBar } from "@/components/shell/top-bar";
import { AiTeacherBubble } from "@/components/shell/ai-teacher-bubble";
import { AiTeacherProvider } from "@/components/ai-teacher/ai-teacher-provider";
import { auth } from "@/lib/auth";
import { getStudyStreak } from "@/lib/dashboard-data";
import { getOrCreateLearnerProfile } from "@/lib/learner-profile";

export interface AppShellProps {
  children: ReactNode;
}

/**
 * Shared authenticated application layout (docs/04_design/ui.md
 * "Global Application Layout"). Real authentication/authorization is
 * enforced in FASE 2 — this only provides the visual/structural shell.
 *
 * No longer preloads AI Teacher conversation history here (2026-08-19,
 * project/learning-journey-optimization.md) - the chat always starts
 * visually empty regardless (openTeacher resets it every time it's
 * opened), so this ran on every fresh app load only to be immediately
 * discarded. AiTeacherProvider's `initialMessages` now just defaults to
 * empty.
 */
export async function AppShell({ children }: AppShellProps) {
  const session = await auth();
  const [hanPreferences, streak] = await Promise.all([
    session?.user?.id
      ? getOrCreateLearnerProfile(session.user.id).then((profile) => ({
          mode: profile.defaultAiMode,
          responseMode: profile.hanResponseMode,
          voice: profile.hanVoice,
          explanationLanguage: profile.explanationLanguage ?? "EN",
        }))
      : Promise.resolve({
          mode: "TUTOR" as const,
          responseMode: "TEXT_ONLY" as const,
          voice: "cedar",
          explanationLanguage: "EN",
        }),
    session?.user?.id
      ? getStudyStreak(session.user.id)
      : Promise.resolve({ currentStreak: 0, activeToday: false }),
  ]);

  return (
    <AiTeacherProvider
      initialMode={hanPreferences.mode}
      initialResponseMode={hanPreferences.responseMode}
      initialVoice={hanPreferences.voice}
      initialExplanationLanguage={hanPreferences.explanationLanguage}
    >
      <div className="flex h-dvh flex-col">
        <TopBar streak={streak} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-page p-4 pb-20 md:pb-4">
            {children}
          </main>
        </div>
        <BottomNav />
        <AiTeacherBubble />
      </div>
    </AiTeacherProvider>
  );
}
