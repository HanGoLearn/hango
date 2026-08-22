"use client";

import { useRouter } from "next/navigation";
import {
  MissionRuntime,
  type MissionSummary,
} from "@/components/mission/mission-runtime";

/**
 * Thin client wrapper so the (server) Scenario Detail page can render the
 * interactive Mission Runtime - a Server Component can't pass a plain
 * callback prop like `onDone` across to a Client Component, so this owns
 * that handler itself.
 */
export function ScenarioFinalMission({ mission }: { mission: MissionSummary }) {
  const router = useRouter();
  return <MissionRuntime mission={mission} onDone={() => router.refresh()} />;
}
