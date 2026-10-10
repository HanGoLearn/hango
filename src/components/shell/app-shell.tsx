import { Suspense, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Sidebar } from "@/components/shell/sidebar";
import { BottomNav } from "@/components/shell/bottom-nav";
import { TopBar } from "@/components/shell/top-bar";
import { HomeOnly } from "@/components/shell/home-only";
import { AiTeacherBubble } from "@/components/shell/ai-teacher-bubble";
import { AiTeacherProvider } from "@/components/ai-teacher/ai-teacher-provider";
import { AnnouncementCenter } from "@/components/announcements/announcement-center";
import { FeedbackWidget } from "@/components/feedback/feedback-widget";
import { ActivityTracker } from "@/components/analytics/activity-tracker";
import { isAdministratorEmail } from "@/lib/admin-identity";
import { auth } from "@/lib/auth";
import { getStudyStreak } from "@/lib/dashboard-data";
import { getOrCreateLearnerProfile } from "@/lib/learner-profile";
import { resolveTourStateForUser } from "@/lib/tour-progress";
import { getAvatarPageData } from "@/lib/avatar-data";
import { grantDailyLoginCoins } from "@/lib/coins";
import type { AppLocale } from "@/i18n/config";
import type {
  AchievementsMessages,
  LessonMessages,
  ShellMessages,
  TourMessages,
} from "@/i18n/messages/types";
import { LessonMessagesProvider } from "@/components/lesson/lesson-messages";
import { TourProvider } from "@/components/tour/tour-provider";
import { TourOverlay } from "@/components/tour/tour-overlay";
import { TourHint } from "@/components/tour/tour-hint";

// Dynamically loaded (2026-09-08 optimization pass) - these are rare-event
// overlays (an achievement unlocking, coins landing), not visible on most
// page loads, but were statically imported into this shell that wraps
// every authenticated page. `ssr: false` isn't allowed here (AppShell is a
// Server Component) - this still code-splits them into their own chunk
// fetched separately from the main shell bundle, which is the part that
// mattered (their `motion` animation dependency was the bulk of the cost).
const AchievementCelebration = dynamic(() =>
  import("@/components/achievements/achievement-celebration").then(
    (mod) => mod.AchievementCelebration,
  ),
);
const CoinCelebration = dynamic(() =>
  import("@/components/avatar/coin-celebration").then(
    (mod) => mod.CoinCelebration,
  ),
);

export interface AppShellProps {
  children: ReactNode;
  locale: AppLocale;
  messages: ShellMessages;
  achievementMessages: AchievementsMessages;
  lessonMessages: LessonMessages;
  tourMessages: TourMessages;
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
export async function AppShell({
  children,
  locale,
  messages,
  achievementMessages,
  lessonMessages,
  tourMessages,
}: AppShellProps) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  // One profile read feeds both Han's preferences and the tour's decision -
  // the shell already paid for this row, and reading it twice for two
  // unrelated features would double that cost on every authenticated page.
  const profile = userId
    ? await getOrCreateLearnerProfile(userId, locale === "en" ? "EN" : "ES")
    : null;

  const tourState =
    userId && profile
      ? await resolveTourStateForUser(userId, {
          onboardingCompletedAt: profile.onboardingCompletedAt,
          tourCompletedAt: profile.tourCompletedAt,
          tourSkippedAt: profile.tourSkippedAt,
          seenTourHints: profile.seenTourHints,
        })
      : null;

  const hanPreferences = profile
    ? {
        // Always TUTOR (2026-08-31, Han Practice retired) - Practice's job
        // moved entirely to the voice-only Han Companion (/han), which
        // never goes through AiTeacherChat/the floating bubble at all. The
        // in-chat Tutor/Practice toggle that used to let a learner switch
        // is gone too, so a learner whose stored `defaultAiMode` is still
        // PRACTICE from before this change must never get stuck there with
        // no way back - the stored value is intentionally ignored here.
        mode: "TUTOR" as const,
        // The retired three-way response format is temporarily reused only
        // as a backwards-compatible mute flag. Typed replies never autoplay.
        autoPlayVoiceReplies: profile.hanResponseMode !== "TEXT_ONLY",
        voice: profile.hanVoice,
        explanationLanguage: profile.explanationLanguage ?? "EN",
      }
    : {
        mode: "TUTOR" as const,
        autoPlayVoiceReplies: true,
        voice: "cedar",
        explanationLanguage: "EN",
      };

  return (
    <AiTeacherProvider
      initialMode={hanPreferences.mode}
      initialAutoPlayVoiceReplies={hanPreferences.autoPlayVoiceReplies}
      initialVoice={hanPreferences.voice}
      initialExplanationLanguage={hanPreferences.explanationLanguage}
    >
      <LessonMessagesProvider messages={lessonMessages}>
        <TourProvider
          autoStart={tourState?.autoStart ?? false}
          initialSeenHints={tourState?.seenHints ?? []}
        >
          <ActivityTracker />
          <div className="flex h-dvh flex-col">
            {/* Home only - the skeleton is inside the gate too, so another
              section never flashes a 56px bar before the real one resolves
              to nothing. */}
            <HomeOnly>
              <Suspense fallback={<TopBarSkeleton />}>
                <TopBarData
                  userId={userId}
                  role={session?.user?.role ?? null}
                  email={session?.user?.email ?? null}
                  locale={locale}
                  messages={messages}
                />
              </Suspense>
            </HomeOnly>
            <div className="flex flex-1 overflow-hidden">
              <Sidebar locale={locale} messages={messages} />
              <main className="flex-1 overflow-y-auto bg-page p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-4">
                {children}
              </main>
            </div>
            <BottomNav locale={locale} messages={messages} />
            <AiTeacherBubble />
            {userId && (
              <AchievementCelebration
                messages={messages.achievementCelebration}
                achievementMessages={achievementMessages}
              />
            )}
            {userId && (
              <CoinCelebration
                locale={locale}
                messages={messages.coinCelebration}
              />
            )}
            {userId && (
              <AnnouncementCenter
                locale={locale}
                messages={messages.announcements}
              />
            )}
            {userId && (
              <FeedbackWidget locale={locale} messages={messages.feedback} />
            )}
            {/* Last inside the shell, so its scrim and card layer over
              everything the tour points at. */}
            <TourOverlay messages={tourMessages} />
            {/* Just below the tour's own layer, and silent while the tour
                is running - a note about the page Han is already standing
                on would be absurd. */}
            <TourHint messages={tourMessages} />
          </div>
        </TourProvider>
      </LessonMessagesProvider>
    </AiTeacherProvider>
  );
}

async function TopBarData({
  userId,
  role,
  email,
  locale,
  messages,
}: {
  userId: string | null;
  role: string | null;
  email: string | null;
  locale: AppLocale;
  messages: ShellMessages;
}) {
  if (!userId) {
    return (
      <TopBar
        streak={{ currentStreak: 0, activeToday: false }}
        coinBalance={0}
        avatarAnimal={null}
        avatarEquipped={{ HEAD: null, FACE: null, TORSO: null }}
        isAdministrator={false}
        locale={locale}
        messages={messages}
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
      isAdministrator={role === "ADMINISTRATOR" && isAdministratorEmail(email)}
      locale={locale}
      messages={messages}
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
