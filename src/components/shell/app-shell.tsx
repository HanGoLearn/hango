import { Suspense, type ReactNode } from "react";
import { Sidebar } from "@/components/shell/sidebar";
import { BottomNav } from "@/components/shell/bottom-nav";
import { TopBar } from "@/components/shell/top-bar";
import { AiTeacherBubble } from "@/components/shell/ai-teacher-bubble";
import { AiTeacherProvider } from "@/components/ai-teacher/ai-teacher-provider";
import { AchievementCelebration } from "@/components/achievements/achievement-celebration";
import { CoinCelebration } from "@/components/avatar/coin-celebration";
import { AnnouncementCenter } from "@/components/announcements/announcement-center";
import { auth } from "@/lib/auth";
import { getStudyStreak } from "@/lib/dashboard-data";
import { getOrCreateLearnerProfile } from "@/lib/learner-profile";
import { getAvatarPageData } from "@/lib/avatar-data";
import { grantDailyLoginCoins } from "@/lib/coins";

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
 *
 * TopBar's data (streak/coins/avatar - 9 queries plus the daily-login
 * grant) is split into its own async `TopBarData` component behind a
 * `Suspense` boundary (2026-08-31, user-reported top-bar load delay). It
 * used to sit in this component's own top-level `Promise.all`, which meant
 * the *entire* page - sidebar, main content, everything - waited on all of
 * it before any HTML streamed, even for routes that don't show streak/coin
 * data at all. `hanPreferences` stays awaited directly here (not deferred)
 * since `AiTeacherProvider` wraps `{children}` and needs its initial props
 * synchronously - but it's a single already-cached (React.cache()) query,
 * not the 9-query burden TopBar carried.
 */
export async function AppShell({ children }: AppShellProps) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const hanPreferences = userId
    ? await getOrCreateLearnerProfile(userId).then((profile) => ({
        // Always TUTOR (2026-08-31, Han Practice retired) - Practice's job
        // moved entirely to the voice-only Han Companion (/han), which
        // never goes through AiTeacherChat/the floating bubble at all. The
        // in-chat Tutor/Practice toggle that used to let a learner switch
        // is gone too, so a learner whose stored `defaultAiMode` is still
        // PRACTICE from before this change must never get stuck there with
        // no way back - the stored value is intentionally ignored here.
        mode: "TUTOR" as const,
        responseMode: profile.hanResponseMode,
        voice: profile.hanVoice,
        explanationLanguage: profile.explanationLanguage ?? "EN",
      }))
    : {
        mode: "TUTOR" as const,
        responseMode: "TEXT_ONLY" as const,
        voice: "cedar",
        explanationLanguage: "EN",
      };

  return (
    <AiTeacherProvider
      initialMode={hanPreferences.mode}
      initialResponseMode={hanPreferences.responseMode}
      initialVoice={hanPreferences.voice}
      initialExplanationLanguage={hanPreferences.explanationLanguage}
    >
      <div className="flex h-dvh flex-col">
        <Suspense fallback={<TopBarSkeleton />}>
          <TopBarData
            userId={userId}
            role={session?.user?.role ?? null}
            email={session?.user?.email ?? null}
          />
        </Suspense>
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-page p-4 pb-20 md:pb-4">
            {children}
          </main>
        </div>
        <BottomNav />
        <AiTeacherBubble />
        {userId && <AchievementCelebration />}
        {userId && <CoinCelebration />}
        {userId && <AnnouncementCenter />}
      </div>
    </AiTeacherProvider>
  );
}

async function TopBarData({
  userId,
  role,
  email,
}: {
  userId: string | null;
  role: string | null;
  email: string | null;
}) {
  if (!userId) {
    return (
      <TopBar
        streak={{ currentStreak: 0, activeToday: false }}
        coinBalance={0}
        avatarAnimal={null}
        avatarEquipped={{ HEAD: null, FACE: null, TORSO: null }}
        isAdministrator={false}
      />
    );
  }

  // Awaited before the Promise.all below (not parallel with it) so this
  // same page load's coin balance/CoinCelebration toast already reflect
  // today's grant, not just the next one - same ordering as before this
  // was split out, just no longer gating the rest of the page too.
  await grantDailyLoginCoins(userId);
  const [streak, avatar] = await Promise.all([
    getStudyStreak(userId),
    // Also feeds UserMenu's avatar (2026-08-30) - fetched once here instead
    // of getCoinBalance alone, since UserMenu now needs animal/equipped too
    // and React.cache() means a page below that also calls
    // getAvatarPageData in the same request gets this exact result for free.
    getAvatarPageData(userId),
  ]);

  return (
    <TopBar
      streak={streak}
      coinBalance={avatar.coinBalance}
      avatarAnimal={avatar.animal}
      avatarEquipped={avatar.equipped}
      isAdministrator={
        role === "ADMINISTRATOR" &&
        email?.toLowerCase() === "arean.mendoza@unmsm.edu.pe"
      }
    />
  );
}

/** Matches TopBar's exact height/border so the real bar swapping in causes no layout shift. */
function TopBarSkeleton() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
      <span className="h-4 w-20 animate-pulse rounded-full bg-elevated" />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="h-6 w-12 animate-pulse rounded-full bg-elevated" />
          <span className="h-6 w-12 animate-pulse rounded-full bg-elevated" />
          <span className="h-6 w-28 animate-pulse rounded-full bg-elevated" />
        </div>
        <span className="size-6 animate-pulse rounded-full bg-elevated" />
        <span className="size-8 animate-pulse rounded-full bg-elevated" />
      </div>
    </header>
  );
}
