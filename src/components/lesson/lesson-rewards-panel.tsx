import Link from "next/link";
import { ChevronRight, Gem, Trophy } from "lucide-react";
import { db } from "@/lib/db";
import { getAvatarPageData } from "@/lib/avatar-data";
import { getLearnerRank } from "@/lib/leaderboard-data";
import { computeLessonEarnedPoints } from "@/lib/general-level";
import { getAchievementSummary } from "@/lib/achievements";
import { AchievementIcon } from "@/components/achievements/achievement-icon";
import { HanCoinsIcon } from "@/components/ui/hancoins-icon";
import { Body, Caption, CardTitle } from "@/components/ui/typography";
import { localePath, type AppLocale } from "@/i18n/config";
import { formatMessage } from "@/i18n/format";
import type { LessonMessages } from "@/i18n/messages/types";
import { getJourneyLessonReport } from "@/lib/journey-lesson-report-service";
import { journeyReportMessages } from "@/i18n/journey-report";

/**
 * The reward moment (2026-09-20). Rank, achievements and coins used to live
 * only as permanently-visible teasers on the Dashboard, where a learner
 * scrolls past them with nothing at stake. They land here instead - on the
 * screen shown seconds after finishing a lesson - because that is when the
 * learner has actually just earned something and the numbers mean
 * something.
 *
 * Avatar and rank are request-cached and shared with the page shell where
 * applicable. The achievement summary and lesson ledger are deliberately
 * fetched once here, at the moment they are displayed.
 */
export async function LessonRewardsPanel({
  userId,
  lessonId,
  locale,
  messages,
  journeyReport = false,
}: {
  userId: string;
  lessonId: string;
  locale: AppLocale;
  messages: LessonMessages["rewards"];
  journeyReport?: boolean;
}) {
  const text = journeyReportMessages[locale];
  // Old ledger entries can survive redo. Never present them as a new payout
  // or expose a v2 point contribution before this run is verified/settled.
  const verified = journeyReport
    ? await getJourneyLessonReport(userId, lessonId).catch(() => null)
    : null;
  const confirmed =
    !journeyReport || verified?.rewards.settlement === "SETTLED";
  const [coinsForLesson, report, avatar, rank, achievements] =
    await Promise.all([
      // The exact coins this lesson paid out, not just the balance - a real
      // "+2" beats a running total the learner can't attribute to anything.
      db.coinLedgerEntry.findFirst({
        where: { userId, sourceKey: `lesson:${lessonId}` },
        select: { amount: true },
      }),
      journeyReport
        ? Promise.resolve(null)
        : db.lessonReflectionReport.findUnique({
            where: { userId_lessonId: { userId, lessonId } },
            select: { totalScore: true },
          }),
      getAvatarPageData(userId),
      getLearnerRank(userId),
      getAchievementSummary(userId),
    ]);

  // This lesson's weighted General Level share. Until 2026-09-21 the running
  // total stayed at zero until the scenario's last lesson, which is exactly
  // why it is worth showing here now that lessons contribute one by one.
  const score = journeyReport ? verified?.overall.score : report?.totalScore;
  const experienceEarned =
    !confirmed || score === null || score === undefined
      ? 0
      : await computeLessonEarnedPoints(lessonId, score);

  return (
    <section className="flex flex-col gap-2">
      <Caption className="font-semibold uppercase tracking-wide text-text-muted">
        {journeyReport ? text.accountSummary : messages.title}
      </Caption>

      {/* One horizontally scrollable band on a phone, a plain row once
          there's width for it - never three stacked full-width cards. */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:snap-none sm:overflow-visible sm:px-0 [&>*]:w-40 [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:flex-1">
        {experienceEarned > 0 && (
          <RewardCard
            href={localePath(locale, "/progress")}
            title={formatMessage(
              journeyReport
                ? text.pointsContribution
                : messages.experienceEarned,
              {
                amount: Math.round(experienceEarned),
              },
            )}
            detail={journeyReport ? "General Level" : messages.experienceTitle}
            icon={<Gem className="size-5 text-accent-300" aria-hidden="true" />}
          />
        )}

        <RewardCard
          href={localePath(locale, "/tienda")}
          title={
            coinsForLesson && confirmed
              ? formatMessage(
                  journeyReport
                    ? text.lessonCoinsRecorded
                    : messages.coinsEarned,
                  {
                    amount: coinsForLesson.amount,
                  },
                )
              : messages.coinsNone
          }
          detail={formatMessage(messages.coinsBalance, {
            balance: avatar.coinBalance,
          })}
          icon={<HanCoinsIcon size={20} />}
        />

        {rank && (
          <RewardCard
            href={localePath(locale, "/leaderboard")}
            title={formatMessage(messages.rankValue, {
              rank: rank.rank,
              total: rank.totalRanked,
            })}
            detail={messages.rankTitle}
            icon={
              <Trophy className="size-5 text-accent-300" aria-hidden="true" />
            }
          />
        )}

        <RewardCard
          href={localePath(locale, "/achievements")}
          title={formatMessage(messages.achievementsValue, {
            unlocked: achievements.unlockedCount,
            total: achievements.totalCount,
          })}
          detail={messages.achievementsTitle}
          icon={
            achievements.recent[0] ? (
              <AchievementIcon
                name={achievements.recent[0].iconName}
                className="size-5 text-accent-300"
              />
            ) : (
              <Trophy className="size-5 text-text-muted" aria-hidden="true" />
            )
          }
        />
      </div>
    </section>
  );
}

function RewardCard({
  href,
  title,
  detail,
  icon,
}: {
  href: string;
  title: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-1 rounded-panel bg-elevated p-4 transition-colors duration-fast ease-standard hover:bg-elevated/70"
    >
      <div className="flex items-center justify-between gap-2">
        {icon}
        <ChevronRight
          className="size-4 shrink-0 text-text-secondary transition-transform duration-fast ease-standard group-hover:translate-x-1"
          aria-hidden="true"
        />
      </div>
      <CardTitle className="font-display text-text-primary">{title}</CardTitle>
      <Body className="text-text-secondary">{detail}</Body>
    </Link>
  );
}
