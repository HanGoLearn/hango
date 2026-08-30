import type { ReactNode } from "react";
import { Sidebar } from "@/components/shell/sidebar";
import { BottomNav } from "@/components/shell/bottom-nav";
import { TopBar } from "@/components/shell/top-bar";
import { AiTeacherBubble } from "@/components/shell/ai-teacher-bubble";
import { AiTeacherProvider } from "@/components/ai-teacher/ai-teacher-provider";
import { AchievementCelebration } from "@/components/achievements/achievement-celebration";
import { CoinCelebration } from "@/components/avatar/coin-celebration";
import { auth } from "@/lib/auth";
import { getStudyStreak } from "@/lib/dashboard-data";
import { getOrCreateLearnerProfile } from "@/lib/learner-profile";
import { getAvatarPageData } from "@/lib/avatar-data";
import { grantCoins } from "@/lib/coins";
import { toUtcDateString } from "@/lib/study-streak";

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
  if (session?.user?.id) {
    // HanCoins (2026-08-30, user request) - 5 coins once per calendar day,
    // just for opening the app. Awaited *before* the Promise.all below (not
    // parallel with it) so this same page load's coin balance/CoinCelebration
    // toast already reflect today's grant, not just the next one.
    // sourceKey is dated, so grantCoins's existing uniqueness makes a second
    // page load the same day a safe no-op.
    await grantCoins(
      session.user.id,
      5,
      "daily_login",
      `daily_login:${toUtcDateString(new Date())}`,
    );
  }
  const [hanPreferences, streak, avatar] = await Promise.all([
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
    // Also feeds UserMenu's avatar (2026-08-30) - fetched once here instead
    // of getCoinBalance alone, since UserMenu now needs animal/equipped too
    // and React.cache() means a page below that also calls
    // getAvatarPageData in the same request gets this exact result for free.
    session?.user?.id
      ? getAvatarPageData(session.user.id)
      : Promise.resolve({
          animal: null,
          animalName: null,
          coinBalance: 0,
          ownedAccessoryKeys: [],
          equipped: { HEAD: null, FACE: null, TORSO: null },
        }),
  ]);

  return (
    <AiTeacherProvider
      initialMode={hanPreferences.mode}
      initialResponseMode={hanPreferences.responseMode}
      initialVoice={hanPreferences.voice}
      initialExplanationLanguage={hanPreferences.explanationLanguage}
    >
      <div className="flex h-dvh flex-col">
        <TopBar
          streak={streak}
          coinBalance={avatar.coinBalance}
          avatarAnimal={avatar.animal}
          avatarEquipped={avatar.equipped}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-page p-4 pb-20 md:pb-4">
            {children}
          </main>
        </div>
        <BottomNav />
        <AiTeacherBubble />
        {session?.user?.id && <AchievementCelebration />}
        {session?.user?.id && <CoinCelebration />}
      </div>
    </AiTeacherProvider>
  );
}
