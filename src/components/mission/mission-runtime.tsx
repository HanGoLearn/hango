"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CardTitle, Body, Caption } from "@/components/ui/typography";
import { MissionChat } from "@/components/mission/mission-chat";
import { MissionReportDisplay } from "@/components/mission/mission-report-display";
import {
  startMissionAttemptAction,
  endMissionAttemptAction,
} from "@/lib/actions/mission";
import type { MissionReport } from "@/lib/mission-evaluation";

export interface MissionSummary {
  id: string;
  title: string;
  context: string | null;
  objective: string;
  learnerRole: string | null;
  aiRole: string | null;
  successConditions: string[];
}

/**
 * The full Mission Runtime (12.1): brief -> start -> in-character
 * conversation -> end -> report, with retry starting a fresh attempt.
 * Shared by the lesson-embedded Mission step and the Scenario Detail
 * page's final mission.
 */
export function MissionRuntime({
  mission,
  onDone,
}: {
  mission: MissionSummary;
  onDone: () => void;
}) {
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [report, setReport] = useState<MissionReport | null>(null);

  async function handleStart() {
    const { attemptId: id } = await startMissionAttemptAction(mission.id);
    setAttemptId(id);
    setReport(null);
  }

  async function handleEnd() {
    if (!attemptId) return;
    setEnding(true);
    const result = await endMissionAttemptAction(attemptId);
    setEnding(false);
    setReport(result);
  }

  if (report) {
    return (
      <div data-activity-surface="MISSIONS" className="flex flex-col gap-4">
        <MissionReportDisplay report={report} />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => void handleStart()}
          >
            Retry
          </Button>
          <Button type="button" onClick={onDone}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  if (attemptId) {
    return (
      <div data-activity-surface="MISSIONS" className="flex flex-col gap-4">
        <MissionChat attemptId={attemptId} />
        <Button
          type="button"
          onClick={() => void handleEnd()}
          loading={ending}
          className="w-fit"
        >
          End Mission
        </Button>
      </div>
    );
  }

  return (
    <Card data-activity-surface="MISSIONS" className="flex flex-col gap-3">
      <CardTitle>{mission.title}</CardTitle>
      {mission.context && (
        <Body className="text-text-secondary">{mission.context}</Body>
      )}
      <Body className="font-medium">{mission.objective}</Body>

      {(mission.learnerRole || mission.aiRole) && (
        <Caption>
          You play {mission.learnerRole ?? "the learner"}. The AI plays{" "}
          {mission.aiRole ?? "the other role"}.
        </Caption>
      )}

      {mission.successConditions.length > 0 && (
        <div className="flex flex-col gap-1">
          <Caption>Success looks like</Caption>
          <ul className="flex flex-col gap-1">
            {mission.successConditions.map((condition) => (
              <li key={condition}>
                <Body>{condition}</Body>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button
        type="button"
        onClick={() => void handleStart()}
        className="mt-2 w-fit"
      >
        Start Mission
      </Button>
    </Card>
  );
}
