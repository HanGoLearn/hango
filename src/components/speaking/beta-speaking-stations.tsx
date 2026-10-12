"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Clock3, Mic2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Body,
  Caption,
  CardTitle,
  PageTitle,
} from "@/components/ui/typography";
import { EmptyState } from "@/components/ui/states";
import { BetaSpeakingConversation } from "@/components/speaking/beta-speaking-conversation";
import { localePath, type AppLocale } from "@/i18n/config";
import { formatMessage } from "@/i18n/format";
import type { SpeakingLabMessages } from "@/i18n/messages/types";
import type {
  BetaSpeakingStationData,
  BetaSpeakingConversationData,
} from "@/lib/beta-speaking-stations";

const STATION_ICONS = {
  INTRODUCTIONS: Mic2,
  NUMBERS_TIME: Clock3,
  PRICES: Check,
} as const;

export function BetaSpeakingStations({
  locale,
  stations,
  selectedStation,
  selectedConversation,
  messages,
}: {
  locale: AppLocale;
  stations: BetaSpeakingStationData[];
  selectedStation: BetaSpeakingStationData | null;
  selectedConversation: BetaSpeakingConversationData | null;
  messages: SpeakingLabMessages;
}) {
  const router = useRouter();

  if (selectedStation) {
    const stationIndex = stations.findIndex(
      (station) => station.id === selectedStation.id,
    );
    const copy = messages.beta.stations[selectedStation.id];

    if (!selectedConversation) {
      return (
        <div className="flex flex-col gap-5">
          <Link
            href={localePath(locale, "/speaking-lab")}
            className="flex w-fit items-center gap-1.5 font-interface text-supporting font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {messages.beta.backToStations}
          </Link>
          <EmptyState
            title={messages.beta.unavailableTitle}
            description={messages.beta.unavailableDescription}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-5">
        <Link
          href={localePath(locale, "/speaking-lab")}
          className="flex w-fit items-center gap-1.5 font-interface text-supporting font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {messages.beta.backToStations}
        </Link>
        <div className="flex flex-col gap-1.5">
          <Caption className="font-semibold uppercase tracking-[0.1em] text-primary-300">
            {formatMessage(messages.beta.station, {
              current: stationIndex + 1,
              total: stations.length,
            })}
          </Caption>
          <PageTitle>{copy.title}</PageTitle>
          <Body className="text-text-secondary">{copy.outcome}</Body>
        </div>
        <BetaSpeakingConversation
          conversation={selectedConversation}
          onExit={() => router.push(localePath(locale, "/speaking-lab"))}
          messages={messages}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Caption className="font-semibold uppercase tracking-[0.1em] text-primary-300">
          {messages.beta.eyebrow}
        </Caption>
        <PageTitle>{messages.beta.title}</PageTitle>
        <Body className="max-w-2xl text-text-secondary">
          {messages.beta.description}
        </Body>
      </div>

      <ol className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {stations.map((station, index) => {
          const Icon = STATION_ICONS[station.id];
          const copy = messages.beta.stations[station.id];

          return (
            <li key={station.id} className="flex">
              <Card className="flex w-full flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-500/15 text-primary-300">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <Caption className="font-semibold text-text-muted">
                    {formatMessage(messages.beta.station, {
                      current: index + 1,
                      total: stations.length,
                    })}
                  </Caption>
                </div>

                <div className="flex flex-1 flex-col gap-1.5">
                  <CardTitle>{copy.title}</CardTitle>
                  <Body className="text-text-secondary">
                    {copy.description}
                  </Body>
                  <Caption className="mt-1 text-text-muted">
                    {station.scenarioTitle} · {station.lessonTitle}
                  </Caption>
                </div>

                <Link
                  href={localePath(
                    locale,
                    `/speaking-lab?station=${station.id}`,
                  )}
                  className="flex min-h-11 items-center justify-center rounded-control bg-primary-500 px-4 py-2 font-interface text-supporting font-semibold text-on-color-light transition-colors hover:bg-primary-600"
                >
                  {messages.beta.practiceNow}
                </Link>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
