import Link from "next/link";
import { Trophy } from "lucide-react";
import { auth } from "@/lib/auth";
import { getLeaderboardTop, getLearnerRank } from "@/lib/leaderboard-data";
import { getAvatarPageData } from "@/lib/avatar-data";
import { isoWeekBounds } from "@/lib/weekly-leaderboard-payout";
import { AvatarDisplay } from "@/components/avatar/avatar-display";
import { WeeklyBonusCountdown } from "@/components/leaderboard/weekly-bonus-countdown";
import {
  PageTitle,
  Body,
  CardTitle,
  Caption,
} from "@/components/ui/typography";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/cn";
import { isAppLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatMessage } from "@/i18n/format";

const LEADERBOARD_SIZE = 50;

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isAppLocale(localeParam)) return null;
  const dictionary = await getDictionary(localeParam);
  const messages = dictionary.leaderboard;
  const session = await auth();
  const userId = session!.user!.id!;

  const [entries, myRank, myAvatar] = await Promise.all([
    getLeaderboardTop(LEADERBOARD_SIZE),
    getLearnerRank(userId),
    getAvatarPageData(userId),
  ]);

  const meInList = entries.some((entry) => entry.userId === userId);
  const weekEndsAt = isoWeekBounds(new Date()).end;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <PageTitle>{messages.title}</PageTitle>
        <Body className="text-text-secondary">{messages.description}</Body>
      </div>

      <WeeklyBonusCountdown
        weekEndsAt={weekEndsAt.toISOString()}
        messages={messages}
      />

      {myRank ? (
        <div className="flex items-center justify-between gap-4 rounded-panel border border-accent-500 bg-accent-500/10 px-5 py-4">
          <div className="flex items-center gap-3">
            {myAvatar.animal && (
              <AvatarDisplay
                animal={myAvatar.animal}
                equipped={myAvatar.equipped}
                size={40}
              />
            )}
            <div>
              <Caption className="font-semibold uppercase tracking-wide text-accent-300">
                {messages.yourRank}
              </Caption>
              <CardTitle className="text-[1.4rem]">
                #{myRank.rank}{" "}
                <span className="text-body font-normal text-text-secondary">
                  {formatMessage(messages.rankOf, {
                    total: myRank.totalRanked,
                  })}
                </span>
              </CardTitle>
            </div>
          </div>
          <Chip tone="accent" variant="solid">
            {myRank.points} {messages.points}
          </Chip>
        </div>
      ) : (
        <div className="rounded-panel border border-border bg-surface px-5 py-4">
          <Body className="text-text-secondary">{messages.joinPrompt}</Body>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="rounded-panel border border-border bg-surface px-5 py-8 text-center">
          <Body className="text-text-secondary">{messages.empty}</Body>
        </div>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {entries.map((entry) => {
            const isMe = entry.userId === userId;
            return (
              <li
                key={entry.userId}
                className={cn(
                  "flex items-center gap-3 rounded-card border px-4 py-3",
                  isMe
                    ? "border-accent-500 bg-accent-500/10"
                    : "border-border bg-surface",
                )}
              >
                {entry.rank === 1 ? (
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-500 text-on-color-dark"
                    aria-hidden="true"
                  >
                    <Trophy className="size-4" />
                  </span>
                ) : (
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-elevated font-interface text-supporting font-semibold text-text-secondary"
                    aria-hidden="true"
                  >
                    {entry.rank}
                  </span>
                )}
                {entry.animal && (
                  <AvatarDisplay
                    animal={entry.animal}
                    equipped={entry.equipped}
                    size={36}
                  />
                )}
                <span className="flex-1 font-interface text-body font-medium text-text-primary">
                  @{entry.accountName}
                  {isMe && (
                    <span className="ml-1.5 text-supporting text-accent-300">
                      ({messages.you})
                    </span>
                  )}
                </span>
                <span className="font-interface text-body font-semibold text-text-primary">
                  {entry.points}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {myRank && !meInList && (
        <Body className="text-center text-text-secondary">
          {formatMessage(
            myRank.rank - LEADERBOARD_SIZE === 1
              ? messages.spotsAwayOne
              : messages.spotsAwayMany,
            {
              count: myRank.rank - LEADERBOARD_SIZE,
              top: LEADERBOARD_SIZE,
            },
          )}
        </Body>
      )}

      <Link
        href={localePath(localeParam, "/learning-journey")}
        className="self-center text-supporting font-medium text-primary-300 underline-offset-4 hover:underline"
      >
        {messages.keepLearning}
      </Link>
    </div>
  );
}
